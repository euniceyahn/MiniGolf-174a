import * as THREE from 'three';
import { createGround } from './objects/Ground.js';
import { createWall } from './objects/Walls.js';
import { createCamera, setupFlyCamera } from './core/Camera.js';
import {createFlag} from './objects/Flag.js';
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

// Adding individual cube obstacles
const cube1 = createCubeObstacle({ x: 10, y: 1, z: 20 }, { x: 6, y: 2, z: 6 }); 
scene.add(cube1);

const cube2 = createCubeObstacle({ x: -10, y: 1, z: 10 }, { x: 8, y: 2, z: 8 }); 
scene.add(cube2);

const cube3 = createCubeObstacle({ x: 0, y: 1, z: -20 }, { x: 7, y: 2, z: 7 }); 
scene.add(cube3);

let mixers = [];

createFlag('/models/golf_flag.glb', {
  position: new THREE.Vector3(30,8,30),
  scale: new THREE.Vector3(5,5,5),
}).then(({model, mixer}) => {
  scene.add(model)
  if (mixer) mixers.push(mixer);
});

camera.position.set(0, 2, 10); 


const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const delta = Math.min(clock.getDelta(), 0.05);


  mixers.forEach(mixer => mixer.update(delta));
  
  updateCamera(delta); 
  renderer.render(scene, camera);
}

requestAnimationFrame(animate);


