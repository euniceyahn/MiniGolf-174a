import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createGround } from './objects/Ground.js';
import { createWall } from './objects/Walls.js';
import { createCamera, setupFlyCamera } from './core/Camera.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // light sky blue
// const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(100, 200, 100);
scene.add(directional);


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

const camera = createCamera();
const { update: updateCamera } = setupFlyCamera(camera, renderer);

const ground = createGround();
scene.add(ground);

const walls = createWall();
scene.add(walls);

// const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 2, 0); // Where the camera is.
// controls.target.set(0, 1, 0); // Where the camera is looking towards.


let lastTime = performance.now();

function animate() {
    const now = performance.now();
    const delta = (now-lastTime) / 1000;
    lastTime = now;

      requestAnimationFrame(animate);
  updateCamera(delta); // handle mouse + keyboard movement
  renderer.render(scene, camera);
}



