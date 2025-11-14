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

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
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

let isDragging = false;
let dragStartY = 0;
let shotPower = 0;
let ballVelocity = new THREE.Vector3(0, 0, 0);

window.addEventListener("mousedown", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(ballMesh, true);

  if (intersects.length > 0) {
    isDragging = true;
    dragStartY = event.clientY;
    shotPower = 0;
  }
});

window.addEventListener("mousemove", (event) => {
  if (!isDragging) return;

  const dragAmount = (event.clientY - dragStartY);

  shotPower = Math.max(0, dragAmount * 0.02);
});

window.addEventListener("mouseup", () => {
  if (isDragging) {
    isDragging = false;

    const shootDir = new THREE.Vector3();
    camera.getWorldDirection(shootDir);
    shootDir.normalize();

    ballVelocity.copy(shootDir).multiplyScalar(shotPower);
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


  mixers.forEach(mixer => mixer.update(delta));

  updateBallPhysics(delta);

  
  updateCamera(delta); 
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);


