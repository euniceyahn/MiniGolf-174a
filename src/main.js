import * as THREE from 'three';
import { createGround } from './objects/Ground.js';
import { createWall } from './objects/Walls.js';
import { createCamera, setupFlyCamera } from './core/Camera.js';

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


camera.position.set(0, 2, 10); 


let lastTime = performance.now();

function animate(now) {
  
  const delta = (now-lastTime) / 1000;
  lastTime = now;
  
  updateCamera(delta); 
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);


