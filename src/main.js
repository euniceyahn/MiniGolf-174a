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

// Shoot ball by holding and releasing 'E' key
window.addEventListener("keydown", (event) => {
  if (event.key === 'e' || event.key === 'E') {
    if (!isCharging) {
      isCharging = true;
      chargeStartTime = Date.now();
      shotPower = 0;
    }
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


