import * as THREE from 'three';
import { createGround } from './objects/Ground.js';
import { createWall } from './objects/Walls.js';
import { createCamera, setupFlyCamera } from './core/Camera.js';
import {createFlag} from './objects/Flag.js';
import { createPutter } from './objects/Putter.js';
import { createBall } from './objects/Ball.js';
import { createCubeObstacle } from './objects/CubeObstacle.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); 

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(100, 200, 100);
scene.add(directional);


const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Create power bar UI
const powerBarContainer = document.createElement('div');
powerBarContainer.id = 'power-bar-container';
powerBarContainer.style.cssText = `
  position: fixed;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.5);
  border: 2px solid white;
  border-radius: 5px;
  display: none;
  overflow: hidden;
`;

const powerBarFill = document.createElement('div');
powerBarFill.id = 'power-bar-fill';
powerBarFill.style.cssText = `
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
  transition: width 0.05s linear;
`;

const powerBarLabel = document.createElement('div');
powerBarLabel.style.cssText = `
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  pointer-events: none;
`;
powerBarLabel.textContent = 'POWER';

powerBarContainer.appendChild(powerBarFill);
powerBarContainer.appendChild(powerBarLabel);
document.body.appendChild(powerBarContainer);

// Create score UI
const scoreContainer = document.createElement('div');
scoreContainer.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  font-family: Arial, sans-serif;
  font-size: 16px;
  border-radius: 8px;
  border: 2px solid white;
  min-width: 200px;
`;
scoreContainer.innerHTML = `
  <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid white; padding-bottom: 5px;">SCORE</div>
  <div>Current Hits: <span id="current-hits">0</span></div>
  <div>Last Score: <span id="last-hits">-</span></div>
  <div>Best Score: <span id="best-hits">-</span></div>
  <div style="margin-top: 10px; font-size: 12px; color: #aaa;">Press P to reset</div>
`;
document.body.appendChild(scoreContainer);

const camera = createCamera();
const { update: updateCamera } = setupFlyCamera(camera, renderer);

const ground = createGround();
scene.add(ground);

const walls = createWall();
walls.forEach(wall => scene.add(wall));

const wallBoxes = [];
walls.forEach(wall => {
    wall.geometry.computeBoundingBox();
    const box = new THREE.Box3().setFromObject(wall);
    wallBoxes.push(box);
});

// Adding individual cube obstacles
const cube1 = createCubeObstacle({ x: 10, y: 1, z: 20 }, { x: 6, y: 2, z: 6 }); 
scene.add(cube1);

const cube2 = createCubeObstacle({ x: -10, y: 1, z: 10 }, { x: 8, y: 2, z: 8 }); 
scene.add(cube2);

const cube3 = createCubeObstacle({ x: 0, y: 1, z: -20 }, { x: 7, y: 2, z: 7 }); 
scene.add(cube3);

// Store cubes for collision detection
const cubeObstacles = [cube1, cube2, cube3];
const cubeBoxes = [];
cubeObstacles.forEach(cube => {
    cube.geometry.computeBoundingBox();
    const box = new THREE.Box3().setFromObject(cube);
    cubeBoxes.push(box);
});

// Create hole at flag position
const holePosition = new THREE.Vector3(30, 0, 30);
const holeRadius = 1.5;
const holeGeometry = new THREE.CircleGeometry(holeRadius, 32);
const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const hole = new THREE.Mesh(holeGeometry, holeMaterial);
hole.rotation.x = -Math.PI / 2;
hole.position.copy(holePosition);
hole.position.y = 0.01; // Slightly above ground to prevent z-fighting
scene.add(hole);

let ballMesh = null;

let mixers = [];

createFlag('/models/golf_flag.glb', {
  position: new THREE.Vector3(30,8,30),
  scale: new THREE.Vector3(5,5,5),
}).then(({model, mixer}) => {
  scene.add(model)
  if (mixer) mixers.push(mixer);
});

createBall('/models/golfball.glb', {
  position: new THREE.Vector3(3, 1, 10),
  scale: new THREE.Vector3(.3, .3, .3),
}).then(({ model }) => {
  ballMesh = model;
  scene.add(model);
});

let isCharging = false;
let chargeStartTime = 0;
let shotPower = 0;
let ballVelocity = new THREE.Vector3(0, 0, 0);
const maxPower = 2.0; // Maximum shot power
const chargeRate = 0.001; // Power increase per millisecond

// Game state
let currentHits = 0;
let lastHits = null;
let bestHits = null;
const ballStartPosition = new THREE.Vector3(3, 1, 10);

// Update UI helper
function updateScoreUI() {
  document.getElementById('current-hits').textContent = currentHits;
  document.getElementById('last-hits').textContent = lastHits !== null ? lastHits : '-';
  document.getElementById('best-hits').textContent = bestHits !== null ? bestHits : '-';
}

// Reset turn
function resetTurn() {
  if (ballMesh) {
    ballMesh.position.copy(ballStartPosition);
    ballVelocity.set(0, 0, 0);
    currentHits = 0;
    updateScoreUI();
  }
}

// Shoot ball by holding and releasing 'E' key
window.addEventListener("keydown", (event) => {
  if (event.key === 'e' || event.key === 'E') {
    if (!isCharging && ballVelocity.length() < 0.001) { // Only allow shooting when ball is stopped
      isCharging = true;
      chargeStartTime = Date.now();
      shotPower = 0;
    }
  }
  
  // Reset with P key
  if (event.key === 'p' || event.key === 'P') {
    resetTurn();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === 'e' || event.key === 'E') {
    if (isCharging) {
      isCharging = false;

      const shootDir = new THREE.Vector3();
      camera.getWorldDirection(shootDir);
      shootDir.normalize();

      ballVelocity.copy(shootDir).multiplyScalar(shotPower);
      shotPower = 0;
      
      // Increment hit counter
      currentHits++;
      updateScoreUI();
    }
  }
});




camera.position.set(0, 2, 10); 


const clock = new THREE.Clock();

function updateBallPhysics(delta) {
  if (!ballMesh) return;

  ballMesh.position.add(ballVelocity);

  ballMesh.position.y = 0.3;   
  ballVelocity.y = 0;       

  ballVelocity.multiplyScalar(0.96);

  if (ballVelocity.length() < 0.001) {
    ballVelocity.set(0, 0, 0);
  }

  const ballRadius = 0.3;
  const ballSphere = new THREE.Sphere(ballMesh.position, ballRadius);

  // Check if ball is in the hole
  const distanceToHole = ballMesh.position.distanceTo(holePosition);
  if (distanceToHole < holeRadius && ballVelocity.length() < 0.5) { // Ball must be moving slowly to fall in
    // Ball scored!
    lastHits = currentHits;
    if (bestHits === null || currentHits < bestHits) {
      bestHits = currentHits;
    }
    updateScoreUI();
    
    // Reset after a short delay
    setTimeout(() => {
      resetTurn();
    }, 500);
    return;
  }

  // Clamp ball position to map boundaries (100x100 ground)
  const mapBoundary = 50;
  if (ballMesh.position.x > mapBoundary || ballMesh.position.x < -mapBoundary) {
    ballMesh.position.x = Math.max(-mapBoundary, Math.min(mapBoundary, ballMesh.position.x));
    ballVelocity.x *= -0.9; // Bounce back
  }
  if (ballMesh.position.z > mapBoundary || ballMesh.position.z < -mapBoundary) {
    ballMesh.position.z = Math.max(-mapBoundary, Math.min(mapBoundary, ballMesh.position.z));
    ballVelocity.z *= -0.9; // Bounce back
  }

  // Wall collision detection
  for (let i = 0; i < wallBoxes.length; i++) {
    const wall = wallBoxes[i];

    if (wall.intersectsSphere(ballSphere)) {

      const size = new THREE.Vector3();
      wall.getSize(size);

      const isVertical = size.x < size.z;   
      const isHorizontal = size.z < size.x;  

      if (isVertical) {
        ballVelocity.x *= -0.9;
        ballMesh.position.x += (ballVelocity.x > 0 ? 1 : -1) * 0.05;
      }
      if (isHorizontal) {
        ballVelocity.z *= -0.9;
        ballMesh.position.z += (ballVelocity.z > 0 ? 1 : -1) * 0.05;
      }
    }
  }
  
  // Cube obstacle collision detection
  for (let i = 0; i < cubeBoxes.length; i++) {
    const cubeBox = new THREE.Box3().setFromObject(cubeObstacles[i]);

    if (cubeBox.intersectsSphere(ballSphere)) {
      const cubeCenter = new THREE.Vector3();
      cubeBox.getCenter(cubeCenter);
      
      // Calculate collision normal (direction from cube center to ball)
      const collisionNormal = new THREE.Vector3()
        .subVectors(ballMesh.position, cubeCenter)
        .normalize();
      
      // Reflect velocity using the formula: v' = v - 2(v·n)n
      const dotProduct = ballVelocity.dot(collisionNormal);
      const reflection = collisionNormal.clone().multiplyScalar(2 * dotProduct);
      ballVelocity.sub(reflection);
      ballVelocity.multiplyScalar(0.9); // Some energy loss
      
      // Push ball out of collision more aggressively
      const pushOut = collisionNormal.clone().multiplyScalar(0.5);
      ballMesh.position.add(pushOut);
    }
  }
}


function animate() {
  requestAnimationFrame(animate);
  
  const delta = Math.min(clock.getDelta(), 0.05);

  // Update shot power while charging
  if (isCharging) {
    const chargeTime = Date.now() - chargeStartTime;
    shotPower = Math.min(chargeTime * chargeRate, maxPower);
    
    // Show and update power bar
    powerBarContainer.style.display = 'block';
    const powerPercent = (shotPower / maxPower) * 100;
    powerBarFill.style.width = powerPercent + '%';
  } else {
    // Hide power bar when not charging
    powerBarContainer.style.display = 'none';
  }

  mixers.forEach(mixer => mixer.update(delta));

  updateBallPhysics(delta);

  
  updateCamera(delta); 
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);


