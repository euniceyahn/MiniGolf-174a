import * as THREE from 'three';
import { createGround } from './objects/Ground.js';
import { createWall } from './objects/Walls.js';
import { createCamera, setupFlyCamera } from './core/Camera.js';
import {createFlag} from './objects/Flag.js';
import { createPutter } from './objects/Putter.js';
import { createBall } from './objects/Ball.js';
import { createCubeObstacle } from './objects/CubeObstacle.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

// Create ramp function - flat box that's rotated to create a slope
function createRamp(position, size, rotation, color) {
  // Create a flat box and rotate it to create an incline
  const geometry = new THREE.BoxGeometry(size.length, 0.5, size.width);
  
  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.3,
    roughness: 0.6,
    emissive: color,
    emissiveIntensity: 0.1,
  });
  
  const ramp = new THREE.Mesh(geometry, material);
  
  // Calculate tilt angle
  const tiltAngle = Math.atan2(size.height, size.length);
  
  // Create a group to handle compound rotations properly
  const rampGroup = new THREE.Group();
  rampGroup.position.set(position.x, position.y, position.z);
  rampGroup.rotation.y = rotation || 0;
  
  // Position the ramp mesh within the group
  // Offset so the low end is at ground level
  ramp.position.set(0, size.height / 2 + 0.25, 0);
  ramp.rotation.x = -tiltAngle;
  
  ramp.castShadow = true;
  ramp.receiveShadow = true;
  
  // Mark as ramp for raycasting
  ramp.userData.isRamp = true;
  
  rampGroup.add(ramp);
  
  // Store data on the group
  rampGroup.userData.isRampGroup = true;
  rampGroup.userData.rampMesh = ramp;
  
  return rampGroup;
}

// Raycaster for ground/ramp detection
const groundRaycaster = new THREE.Raycaster();
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const scene = new THREE.Scene();

// Create beautiful sky gradient
const skyColor = 0x87ceeb;
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.Fog(skyColor, 80, 250); // Add atmospheric fog

// Add decorative clouds in the background
function createClouds() {
  const cloudGroup = new THREE.Group();
  const cloudGeometry = new THREE.SphereGeometry(8, 16, 16);
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    roughness: 1,
  });
  
  // Create multiple clouds scattered around (positioned high and far)
  for (let i = 0; i < 12; i++) {
    const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloud.position.set(
      Math.random() * 300 - 150,
      Math.random() * 40 + 80,  // Much higher: 80-120 instead of 40-70
      Math.random() * 300 - 150
    );
    cloud.scale.set(
      Math.random() * 2 + 1,
      Math.random() * 0.5 + 0.5,
      Math.random() * 1.5 + 1
    );
    cloudGroup.add(cloud);
  }
  
  return cloudGroup;
}

const clouds = createClouds();
scene.add(clouds);

// Better lighting setup
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

// Main sun-like directional light with shadows
const directional = new THREE.DirectionalLight(0xfff4e6, 1.5);
directional.position.set(50, 80, 40);
directional.castShadow = true;
directional.shadow.mapSize.width = 2048;
directional.shadow.mapSize.height = 2048;
directional.shadow.camera.near = 0.5;
directional.shadow.camera.far = 500;
directional.shadow.camera.left = -100;
directional.shadow.camera.right = 100;
directional.shadow.camera.top = 100;
directional.shadow.camera.bottom = -100;
directional.shadow.bias = -0.0001;
scene.add(directional);

// Add warm fill light
const fillLight = new THREE.DirectionalLight(0xffa500, 0.3);
fillLight.position.set(-50, 30, -50);
scene.add(fillLight);

// Add hemisphere light for better ambient
const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a7c59, 0.5);
scene.add(hemiLight);

// Night mode system
let isNightMode = false;

// Store original lighting values for day mode
const daySettings = {
  skyColor: 0x87ceeb,
  fogColor: 0x87ceeb,
  ambientIntensity: 0.6,
  directionalColor: 0xfff4e6,
  directionalIntensity: 1.5,
  fillColor: 0xffa500,
  fillIntensity: 0.3,
  hemiSkyColor: 0x87ceeb,
  hemiGroundColor: 0x4a7c59,
  hemiIntensity: 0.5,
  exposure: 0.7
};

const nightSettings = {
  skyColor: 0x1a1a3a,
  fogColor: 0x1a1a3a,
  ambientIntensity: 0.4,
  directionalColor: 0x6688cc,
  directionalIntensity: 0.8,
  fillColor: 0x4466bb,
  fillIntensity: 0.3,
  hemiSkyColor: 0x334466,
  hemiGroundColor: 0x223344,
  hemiIntensity: 0.4,
  exposure: 0.8
};

// Create stars for night mode
const starsGeometry = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 500; i++) {
  const x = (Math.random() - 0.5) * 400;
  const y = Math.random() * 100 + 50;
  const z = (Math.random() - 0.5) * 400;
  starPositions.push(x, y, z);
}
starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.5,
  transparent: true,
  opacity: 0
});
const stars = new THREE.Points(starsGeometry, starsMaterial);
scene.add(stars);

// Create moon for night mode
const moonGeometry = new THREE.SphereGeometry(5, 32, 32);
const moonMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffcc,
  transparent: true,
  opacity: 0
});
const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(80, 60, -80);
scene.add(moon);

// Night mode UI indicator
const nightModeUI = document.createElement('div');
nightModeUI.id = 'night-mode-ui';
nightModeUI.style.cssText = `
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(10, 10, 30, 0.9), rgba(30, 30, 60, 0.9));
  color: #aaccff;
  padding: 8px 20px;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
  font-weight: 900;
  border-radius: 20px;
  border: 2px solid rgba(100, 150, 255, 0.4);
  box-shadow: 0 4px 20px rgba(0, 50, 150, 0.4);
  backdrop-filter: blur(10px);
  letter-spacing: 1px;
  display: none;
  z-index: 100;
`;
nightModeUI.textContent = '🌙 NIGHT MODE';
document.body.appendChild(nightModeUI);

function setNightMode(enabled) {
  isNightMode = enabled;
  const settings = enabled ? nightSettings : daySettings;
  
  // Update sky and fog
  scene.background = new THREE.Color(settings.skyColor);
  scene.fog.color = new THREE.Color(settings.fogColor);
  
  // Update lighting
  ambient.intensity = settings.ambientIntensity;
  directional.color.setHex(settings.directionalColor);
  directional.intensity = settings.directionalIntensity;
  fillLight.color.setHex(settings.fillColor);
  fillLight.intensity = settings.fillIntensity;
  hemiLight.color.setHex(settings.hemiSkyColor);
  hemiLight.groundColor.setHex(settings.hemiGroundColor);
  hemiLight.intensity = settings.hemiIntensity;
  
  // Update renderer exposure
  renderer.toneMappingExposure = settings.exposure;
  
  // Show/hide stars and moon
  starsMaterial.opacity = enabled ? 0.8 : 0;
  moonMaterial.opacity = enabled ? 1 : 0;
  
  // Update clouds opacity for night
  clouds.children.forEach(cloud => {
    cloud.material.opacity = enabled ? 0.15 : 0.4;
  });
  
  // Show/hide night mode UI
  nightModeUI.style.display = enabled ? 'block' : 'none';
}

const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild( renderer.domElement );

// Create power bar UI with modern styling
const powerBarContainer = document.createElement('div');
powerBarContainer.id = 'power-bar-container';
powerBarContainer.style.cssText = `
  position: fixed;
  bottom: 60px;
  left: 50%;
  width: 350px;
  height: 40px;
  margin-left: -175px;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.9), rgba(40, 40, 70, 0.9));
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  display: none;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;

const powerBarFill = document.createElement('div');
powerBarFill.id = 'power-bar-fill';
powerBarFill.style.cssText = `
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00ddff, #ffaa00, #ff3366);
  transition: width 0.05s linear;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
`;

const powerBarLabel = document.createElement('div');
powerBarLabel.style.cssText = `
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 3px;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.8), 2px 2px 4px rgba(0,0,0,0.9);
  pointer-events: none;
`;
powerBarLabel.textContent = 'POWER';

powerBarContainer.appendChild(powerBarFill);
powerBarContainer.appendChild(powerBarLabel);
document.body.appendChild(powerBarContainer);

// Create score UI with modern glassmorphism styling
const scoreContainer = document.createElement('div');
scoreContainer.style.cssText = `
  position: fixed;
  top: 30px;
  right: 30px;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.85), rgba(40, 40, 70, 0.85));
  color: white;
  padding: 25px;
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  min-width: 240px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;
scoreContainer.innerHTML = `
  <div style="font-size: 22px; font-weight: 900; margin-bottom: 15px; border-bottom: 2px solid rgba(255, 255, 255, 0.3); padding-bottom: 8px; letter-spacing: 2px; text-shadow: 0 0 10px rgba(0, 255, 255, 0.6);">⛳ SCORE</div>
  <div style="margin: 8px 0; font-weight: 600; display: flex; justify-content: space-between;">
    <span style="color: rgba(255, 255, 255, 0.8);">Current Hits:</span> 
    <span id="current-hits" style="color: #00ff88; font-weight: 900; text-shadow: 0 0 8px rgba(0, 255, 136, 0.6);">0</span>
  </div>
  <div style="margin: 8px 0; font-weight: 600; display: flex; justify-content: space-between;">
    <span style="color: rgba(255, 255, 255, 0.8);">Last Score:</span> 
    <span id="last-hits" style="color: #ffaa00; font-weight: 900;">-</span>
  </div>
  <div style="margin: 8px 0; font-weight: 600; display: flex; justify-content: space-between;">
    <span style="color: rgba(255, 255, 255, 0.8);">Best Score:</span> 
    <span id="best-hits" style="color: #ff3366; font-weight: 900; text-shadow: 0 0 8px rgba(255, 51, 102, 0.6);">-</span>
  </div>
  <div style="margin-top: 15px; padding-top: 10px; font-size: 12px; color: rgba(255, 255, 255, 0.6); border-top: 1px solid rgba(255, 255, 255, 0.2); text-align: center; letter-spacing: 1px;">Press <span style="color: #00ddff; font-weight: 900;">P</span> to reset</div>
  <div id="aim-mode" style="margin-top: 8px; padding-top: 8px; font-size: 11px; color: rgba(255, 255, 255, 0.5); border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; letter-spacing: 1px;">Ground Mode</div>
`;
document.body.appendChild(scoreContainer);

// Create controls panel UI
const controlsContainer = document.createElement('div');
controlsContainer.style.cssText = `
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.85), rgba(40, 40, 70, 0.85));
  color: white;
  padding: 12px 15px;
  font-family: 'Arial', sans-serif;
  font-size: 11px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 2px 8px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
`;
controlsContainer.innerHTML = `
  <div style="font-size: 13px; font-weight: 900; margin-bottom: 8px; letter-spacing: 1px; text-shadow: 0 0 10px rgba(0, 255, 255, 0.6);">🎮 CONTROLS</div>
  <div style="margin: 4px 0; display: flex; align-items: center; gap: 8px;">
    <span style="background: rgba(0, 255, 136, 0.2); color: #00ff88; padding: 2px 8px; border-radius: 4px; font-weight: 900; min-width: 25px; text-align: center; border: 1px solid rgba(0, 255, 136, 0.4); font-size: 10px;">E</span>
    <span style="color: rgba(255, 255, 255, 0.8); font-size: 11px;">Shoot</span>
  </div>
  <div style="margin: 4px 0; display: flex; align-items: center; gap: 8px;">
    <span style="background: rgba(0, 221, 255, 0.2); color: #00ddff; padding: 2px 8px; border-radius: 4px; font-weight: 900; min-width: 25px; text-align: center; border: 1px solid rgba(0, 221, 255, 0.4); font-size: 10px;">7</span>
    <span style="color: rgba(255, 255, 255, 0.8); font-size: 11px;">Bird's Eye</span>
  </div>
  <div style="margin: 4px 0; display: flex; align-items: center; gap: 8px;">
    <span style="background: rgba(255, 170, 0, 0.2); color: #ffaa00; padding: 2px 6px; border-radius: 4px; font-weight: 900; min-width: 25px; text-align: center; border: 1px solid rgba(255, 170, 0, 0.4); font-size: 10px;">WASD</span>
    <span style="color: rgba(255, 255, 255, 0.8); font-size: 11px;">Move</span>
  </div>
  <div style="margin: 4px 0; display: flex; align-items: center; gap: 8px;">
    <span style="background: rgba(255, 51, 102, 0.2); color: #ff3366; padding: 2px 8px; border-radius: 4px; font-weight: 900; min-width: 25px; text-align: center; border: 1px solid rgba(255, 51, 102, 0.4); font-size: 10px;">P</span>
    <span style="color: rgba(255, 255, 255, 0.8); font-size: 11px;">Reset</span>
  </div>
`;
document.body.appendChild(controlsContainer);

const camera = createCamera();
const { update: updateCamera } = setupFlyCamera(camera, renderer);

// Ball cam - follows the ball from behind while it's moving
const ballCamera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
let ballCamActive = false;

// Create ball cam UI container
const ballCamContainer = document.createElement('div');
ballCamContainer.id = 'ball-cam-container';
ballCamContainer.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 280px;
  height: 160px;
  border: 3px solid rgba(255, 255, 255, 0.4);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.3);
  display: none;
  z-index: 100;
`;

const ballCamLabel = document.createElement('div');
ballCamLabel.style.cssText = `
  position: absolute;
  top: 8px;
  left: 10px;
  background: rgba(255, 51, 102, 0.8);
  color: white;
  padding: 4px 10px;
  border-radius: 5px;
  font-family: Arial, sans-serif;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 1px;
  z-index: 101;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
`;
ballCamLabel.textContent = '🎥 BALL CAM';

const ballCamCanvas = document.createElement('canvas');
ballCamCanvas.width = 280;
ballCamCanvas.height = 160;
ballCamCanvas.style.cssText = `
  width: 100%;
  height: 100%;
  display: block;
`;

ballCamContainer.appendChild(ballCamCanvas);
ballCamContainer.appendChild(ballCamLabel);
document.body.appendChild(ballCamContainer);

// Create a separate renderer for ball cam
const ballCamRenderer = new THREE.WebGLRenderer({ 
  canvas: ballCamCanvas, 
  antialias: true,
  alpha: true
});
ballCamRenderer.setSize(280, 160);
ballCamRenderer.toneMapping = THREE.ACESFilmicToneMapping;
ballCamRenderer.toneMappingExposure = 0.7;

// Post-processing setup (after camera is created)
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom effect for glowy, prettier look (subtle)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.15,   // strength (reduced from 0.4)
  0.4,    // radius (reduced from 0.6)
  0.6     // threshold (increased from 0.3 - only very bright things bloom)
);
composer.addPass(bloomPass);

// Output pass for color correction
const outputPass = new OutputPass();
composer.addPass(outputPass);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

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

// Course system - 3 different courses
// Play area bounds: Upper section (x: -44 to 44, z: 15 to 44), Lower section (x: -44 to 14, z: -44 to 15)
const courses = [
  {
    name: "Course 1",
    ballStart: { x: 3, y: 1, z: 10 },
    holePosition: { x: 30, y: 0, z: 30 },
    flagPosition: { x: 30, y: 8, z: 30 },
    obstacles: [
      { pos: { x: 10, y: 1, z: 20 }, size: { x: 6, y: 2, z: 6 }, color: 0xff6b6b },
      { pos: { x: -10, y: 1, z: 10 }, size: { x: 8, y: 2, z: 8 }, color: 0x4ecdc4 },
      { pos: { x: 0, y: 1, z: -20 }, size: { x: 7, y: 2, z: 7 }, color: 0xffe66d }
    ],
    ramps: [
      // Ramp at (20, 20) angled toward hole at (30, 30) - within upper-right section (x:15-44, z:15-44)
      { pos: { x: 20, y: 0, z: 20 }, size: { length: 6, width: 6, height: 2.5 }, rotation: Math.PI / 4, color: 0x8e44ad }
    ]
  },
  {
    name: "Course 2",
    ballStart: { x: -30, y: 1, z: 35 },
    holePosition: { x: -30, y: 0, z: -35 },
    flagPosition: { x: -30, y: 8, z: -35 },
    obstacles: [
      { pos: { x: -20, y: 1, z: 20 }, size: { x: 10, y: 2, z: 4 }, color: 0x9b59b6 },
      { pos: { x: -35, y: 1, z: 5 }, size: { x: 4, y: 2, z: 15 }, color: 0xe74c3c },
      { pos: { x: -15, y: 1, z: -10 }, size: { x: 8, y: 2, z: 8 }, color: 0x3498db },
      { pos: { x: -30, y: 1, z: -20 }, size: { x: 12, y: 2, z: 4 }, color: 0x2ecc71 }
    ],
    ramps: [
      // Ramp at (-25, 10) facing toward hole at (-30, -35) - facing -Z direction
      { pos: { x: -25, y: 0, z: 10 }, size: { length: 6, width: 8, height: 2.5 }, rotation: Math.PI, color: 0x16a085 }
    ]
  },
  {
    name: "Course 3",
    ballStart: { x: -35, y: 1, z: -35 },
    holePosition: { x: 35, y: 0, z: 35 },
    flagPosition: { x: 35, y: 8, z: 35 },
    obstacles: [
      { pos: { x: -20, y: 1, z: 25 }, size: { x: 5, y: 2, z: 5 }, color: 0xf39c12 },
      { pos: { x: 20, y: 1, z: 25 }, size: { x: 5, y: 2, z: 5 }, color: 0xf39c12 },
      { pos: { x: -25, y: 1, z: 0 }, size: { x: 6, y: 2, z: 6 }, color: 0x1abc9c },
      { pos: { x: 0, y: 1, z: 5 }, size: { x: 10, y: 2, z: 4 }, color: 0x1abc9c },
      { pos: { x: 0, y: 1, z: -15 }, size: { x: 8, y: 2, z: 4 }, color: 0xe91e63 },
      { pos: { x: -10, y: 1, z: -30 }, size: { x: 5, y: 2, z: 5 }, color: 0x00bcd4 }
    ],
    ramps: [
      // Ramp at (-30, -10) facing toward hole at (35, 35) - angled NE (toward +X, +Z)
      { pos: { x: -30, y: 0, z: -10 }, size: { length: 6, width: 8, height: 2.5 }, rotation: Math.PI / 4, color: 0xd35400 }
    ]
  }
];

let currentCourseIndex = 0;
let cubeObstacles = [];
let cubeBoxes = [];
let rampObstacles = [];
let currentFlagModel = null;

// Course name UI
const courseNameUI = document.createElement('div');
courseNameUI.style.cssText = `
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(20, 20, 40, 0.9), rgba(40, 40, 70, 0.9));
  color: white;
  padding: 12px 30px;
  font-family: 'Arial', sans-serif;
  font-size: 20px;
  font-weight: 900;
  border-radius: 25px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
  z-index: 100;
`;
courseNameUI.textContent = '⛳ COURSE 1';
document.body.appendChild(courseNameUI);

// Dynamic hole position
let holePosition = new THREE.Vector3(30, 0, 30);

// Function to clear current course obstacles
function clearCourseObstacles() {
  cubeObstacles.forEach(cube => {
    scene.remove(cube);
    if (cube.geometry) cube.geometry.dispose();
    if (cube.material) cube.material.dispose();
  });
  cubeObstacles = [];
  cubeBoxes = [];
  
  // Clear ramps (they are now Groups containing meshes)
  rampObstacles.forEach(ramp => {
    scene.remove(ramp);
    // If it's a group, dispose children
    if (ramp.children) {
      ramp.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    // If it's a mesh directly
    if (ramp.geometry) ramp.geometry.dispose();
    if (ramp.material) ramp.material.dispose();
  });
  rampObstacles = [];
}

// Function to load a course
function loadCourse(courseIndex) {
  const course = courses[courseIndex];
  currentCourseIndex = courseIndex;
  
  // Clear existing obstacles
  clearCourseObstacles();
  
  // Create new obstacles
  course.obstacles.forEach(obs => {
    const cube = createCubeObstacle(obs.pos, obs.size, obs.color);
    scene.add(cube);
    cubeObstacles.push(cube);
    cube.geometry.computeBoundingBox();
    const box = new THREE.Box3().setFromObject(cube);
    cubeBoxes.push(box);
  });
  
  // Update hole position
  holePosition.set(course.holePosition.x, course.holePosition.y, course.holePosition.z);
  
  // Update hole visual elements
  if (hole) {
    hole.position.set(course.holePosition.x, 0.245, course.holePosition.z);
  }
  if (ring) {
    ring.position.set(course.holePosition.x, 0.235, course.holePosition.z);
  }
  if (glowRing) {
    glowRing.position.set(course.holePosition.x, 0.25, course.holePosition.z);
  }
  if (cup) {
    cup.position.set(course.holePosition.x, 0.0, course.holePosition.z);
  }
  
  // Update flag position
  if (currentFlagModel) {
    currentFlagModel.position.set(course.flagPosition.x, course.flagPosition.y, course.flagPosition.z);
  }
  
  // Update course name UI
  courseNameUI.textContent = `⛳ ${course.name.toUpperCase()}`;
  
  // Create ramps
  if (course.ramps) {
    course.ramps.forEach(rampData => {
      const ramp = createRamp(rampData.pos, rampData.size, rampData.rotation, rampData.color);
      scene.add(ramp);
      rampObstacles.push(ramp);
    });
  }
  
  console.log(`Loaded ${course.name}`);
}

// Function to switch to next course
function nextCourse() {
  const nextIndex = (currentCourseIndex + 1) % courses.length;
  loadCourse(nextIndex);
  
  // 50% chance of night mode when switching courses
  const shouldBeNight = Math.random() < 0.5;
  setNightMode(shouldBeNight);
}

// Get current course ball start position
function getCurrentBallStart() {
  const course = courses[currentCourseIndex];
  return new THREE.Vector3(course.ballStart.x, course.ballStart.y, course.ballStart.z);
}

// Initialize first course obstacles
const initialCourse = courses[0];
initialCourse.obstacles.forEach(obs => {
  const cube = createCubeObstacle(obs.pos, obs.size, obs.color);
  scene.add(cube);
  cubeObstacles.push(cube);
  cube.geometry.computeBoundingBox();
  const box = new THREE.Box3().setFromObject(cube);
  cubeBoxes.push(box);
});

// Initialize first course ramps
if (initialCourse.ramps) {
  initialCourse.ramps.forEach(rampData => {
    const ramp = createRamp(rampData.pos, rampData.size, rampData.rotation, rampData.color);
    scene.add(ramp);
    rampObstacles.push(ramp);
  });
}
const holeRadius = 1.5;

// Create a glowing ring around the hole
const ringGeometry = new THREE.RingGeometry(holeRadius, holeRadius + 0.3, 32);
const ringMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x3a6b1f,
  emissive: 0x2d5016,
  emissiveIntensity: 0.3,
  side: THREE.DoubleSide,
  depthWrite: true,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
  metalness: 0.3,
  roughness: 0.7
});
let ring = new THREE.Mesh(ringGeometry, ringMaterial);
ring.rotation.x = -Math.PI / 2;
ring.position.copy(holePosition);
ring.position.y = 0.235;
ring.renderOrder = 1;
scene.add(ring);

// Create the black hole interior with subtle glow
const holeGeometry = new THREE.CircleGeometry(holeRadius, 32);
const holeMaterial = new THREE.MeshBasicMaterial({ 
  color: 0x000000,
  side: THREE.DoubleSide,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2
});
let hole = new THREE.Mesh(holeGeometry, holeMaterial);
hole.rotation.x = -Math.PI / 2;
hole.position.copy(holePosition);
hole.position.y = 0.245;
hole.renderOrder = 2; // Render on top of ring
scene.add(hole);

// Add a subtle glow rim around the hole
const glowRingGeometry = new THREE.RingGeometry(holeRadius - 0.05, holeRadius, 32);
const glowRingMaterial = new THREE.MeshBasicMaterial({
  color: 0xffaa00,
  transparent: true,
  opacity: 0.4,
  side: THREE.DoubleSide,
  depthWrite: false
});
let glowRing = new THREE.Mesh(glowRingGeometry, glowRingMaterial);
glowRing.rotation.x = -Math.PI / 2;
glowRing.position.copy(holePosition);
glowRing.position.y = 0.25;
glowRing.renderOrder = 3;
scene.add(glowRing);

// Create the hole cup/rim for better visibility
const cupGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius - 0.1, 0.5, 32, 1, true);
const cupMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x1a1a1a,
  side: THREE.DoubleSide,
  metalness: 0.5,
  roughness: 0.5
});
let cup = new THREE.Mesh(cupGeometry, cupMaterial);
cup.position.copy(holePosition);
cup.position.y = 0.0; // Position cup to connect with hole
scene.add(cup);

let ballMesh = null;

// Trajectory visualization
let trajectoryLine = null;
let trajectoryDots = [];
function createTrajectoryLine() {
  const points = [];
  for (let i = 0; i < 50; i++) {
    points.push(new THREE.Vector3(0, 0, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineDashedMaterial({ 
    color: 0x00ff88,
    transparent: true,
    opacity: 0.7,
    linewidth: 2,
    dashSize: 0.5,
    gapSize: 0.3
  });
  trajectoryLine = new THREE.Line(geometry, material);
  trajectoryLine.computeLineDistances();
  trajectoryLine.visible = false;
  scene.add(trajectoryLine);
  
  // Create dots along trajectory for better visibility
  const dotGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const dotMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ffaa,
    transparent: true,
    opacity: 0.8
  });
  
  for (let i = 0; i < 10; i++) {
    const dot = new THREE.Mesh(dotGeometry, dotMaterial.clone());
    dot.visible = false;
    scene.add(dot);
    trajectoryDots.push(dot);
  }
}

function updateTrajectoryLine(startPos, direction, power) {
  if (!trajectoryLine) return;
  
  const points = [];
  const velocity = direction.clone().multiplyScalar(power);
  const friction = 0.96;
  const timeSteps = 50;
  
  let pos = startPos.clone();
  let vel = velocity.clone();
  
  for (let i = 0; i < timeSteps; i++) {
    points.push(pos.clone());
    
    // Simulate physics
    pos.add(vel);
    vel.multiplyScalar(friction);
    
    // Stop if velocity is too small
    if (vel.length() < 0.001) break;
  }
  
  trajectoryLine.geometry.setFromPoints(points);
  trajectoryLine.geometry.attributes.position.needsUpdate = true;
  trajectoryLine.computeLineDistances();
  
  // Update dots positions along trajectory
  const dotInterval = Math.floor(points.length / trajectoryDots.length);
  trajectoryDots.forEach((dot, index) => {
    const pointIndex = index * dotInterval;
    if (pointIndex < points.length) {
      dot.position.copy(points[pointIndex]);
      dot.position.y = 0.3; // Slightly above ground
      dot.visible = true;
    } else {
      dot.visible = false;
    }
  });
}

createTrajectoryLine();

let mixers = [];

createFlag('/models/golf_flag.glb', {
  position: new THREE.Vector3(30,8,30),
  scale: new THREE.Vector3(5,5,5),
}).then(({model, mixer}) => {
  currentFlagModel = model;
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
let isBallFalling = false; // Track if ball is falling into hole

// Mouse tracking for aerial aiming
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let mouseGroundPosition = new THREE.Vector3();
let isAerialMode = false;
let previousAerialMode = false;

// Track mouse position
window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Create aim target indicator for aerial mode
const aimTargetGeometry = new THREE.RingGeometry(0.8, 1.0, 32);
const aimTargetMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xff3366,
  transparent: true,
  opacity: 0.8,
  side: THREE.DoubleSide
});
const aimTarget = new THREE.Mesh(aimTargetGeometry, aimTargetMaterial);
aimTarget.rotation.x = -Math.PI / 2;
aimTarget.visible = false;
scene.add(aimTarget);

// Inner dot for aim target
const aimDotGeometry = new THREE.CircleGeometry(0.3, 32);
const aimDotMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xff6699,
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide
});
const aimDot = new THREE.Mesh(aimDotGeometry, aimDotMaterial);
aimDot.rotation.x = -Math.PI / 2;
aimDot.visible = false;
scene.add(aimDot);

// Calculate shot direction based on mode (aerial or ground)
function calculateShootDirection() {
  if (!ballMesh) return new THREE.Vector3(0, 0, -1);
  
  // Determine if we're in aerial mode (camera is high up)
  isAerialMode = camera.position.y > 15;
  
  if (isAerialMode) {
    // AERIAL MODE: Use mouse to aim at ground point
    const ballPos = ballMesh.position.clone();
    ballPos.y = 0;
    
    const targetPos = mouseGroundPosition.clone();
    targetPos.y = 0;
    
    // Direction from ball to mouse target
    const shootDir = new THREE.Vector3().subVectors(targetPos, ballPos);
    
    // If too close, use a default direction
    if (shootDir.length() < 0.1) {
      return new THREE.Vector3(0, 0, -1);
    }
    
    shootDir.normalize();
    return shootDir;
    
  } else {
    // GROUND MODE: Ball travels from your position through the ball
    const shootDir = new THREE.Vector3(0, 0, -1);
    shootDir.applyQuaternion(camera.quaternion);
    shootDir.y = 0; // Keep it flat on ground
    shootDir.normalize();
    
    return shootDir;
  }
}

// Particle system for visual effects
const particles = [];
function createParticles(position, color, count = 20) {
  const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const particleMaterial = new THREE.MeshBasicMaterial({ 
    color: color,
    transparent: true,
    opacity: 1
  });
  
  for (let i = 0; i < count; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
    particle.position.copy(position);
    
    // Random velocity for particles
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 0.3,
      (Math.random() - 0.5) * 0.3
    );
    particle.life = 1.0;
    
    scene.add(particle);
    particles.push(particle);
  }
}

function updateParticles(delta) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    
    particle.position.add(particle.velocity);
    particle.velocity.y -= 0.01; // gravity
    particle.life -= delta * 2;
    
    particle.material.opacity = particle.life;
    particle.scale.setScalar(particle.life);
    
    if (particle.life <= 0) {
      scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
      particles.splice(i, 1);
    }
  }
}

// Game state
let currentHits = 0;
let lastHits = null;
let bestHits = null;
let ballStartPosition = new THREE.Vector3(3, 1, 10);

// Update UI helper
function updateScoreUI() {
  document.getElementById('current-hits').textContent = currentHits;
  document.getElementById('last-hits').textContent = lastHits !== null ? lastHits : '-';
  document.getElementById('best-hits').textContent = bestHits !== null ? bestHits : '-';
}

// Reset turn
function resetTurn(switchCourse = true) {
  if (ballMesh) {
    // Switch to next course if requested
    if (switchCourse) {
      nextCourse();
      ballStartPosition = getCurrentBallStart();
    }
    
    ballMesh.position.copy(ballStartPosition);
    ballVelocity.set(0, 0, 0);
    currentHits = 0;
    isBallFalling = false;
    updateScoreUI();
    
    // Reset camera position if not in aerial/bird's eye view
    const isAerial = camera.position.y > 15;
    if (!isAerial) {
      // Get direction from ball to hole
      const ballPos = ballStartPosition.clone();
      const holePos = holePosition.clone();
      
      // Direction from hole to ball (camera should be behind ball, opposite to hole)
      const dirToHole = new THREE.Vector3().subVectors(holePos, ballPos);
      dirToHole.y = 0;
      dirToHole.normalize();
      
      // Position camera behind the ball (opposite direction from hole)
      const cameraDistance = 8; // Distance from ball
      const cameraHeight = 2.5; // Height above ground
      
      camera.position.set(
        ballPos.x - dirToHole.x * cameraDistance,
        cameraHeight,
        ballPos.z - dirToHole.z * cameraDistance
      );
      
      // Make camera look at the ball
      camera.lookAt(ballPos.x, 0.3, ballPos.z);
    }
  }
}

// Shoot ball by holding and releasing 'E' key
window.addEventListener("keydown", (event) => {
  if (event.key === 'e' || event.key === 'E') {
    if (!isCharging && !isBallFalling && ballVelocity.length() < 0.001) { // Only allow shooting when ball is stopped and not falling
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

      // Calculate direction based on player position and camera angle
      const shootDir = calculateShootDirection();

      ballVelocity.copy(shootDir).multiplyScalar(shotPower);
      
      // Create particle effect when ball is hit
      if (ballMesh && shotPower > 0.1) {
        createParticles(ballMesh.position.clone(), 0x00ff88, Math.floor(shotPower * 15));
      }
      
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

  // If ball is falling into hole, animate it falling
  if (isBallFalling) {
    ballMesh.position.y -= delta * 3; // Fall down
    ballMesh.rotation.x += delta * 10; // Spin while falling
    
    // Reset after falling out of view
    if (ballMesh.position.y < -2) {
      resetTurn();
    }
    return;
  }

  // Floor level - ground is at y=0, ball sits at y=0.3
  let floorLevel = 0;
  
  // Check ramps via raycasting
  let onRamp = false;
  let surfaceNormal = new THREE.Vector3(0, 1, 0);
  
  const rampMeshes = [];
  rampObstacles.forEach(rampGroup => {
    if (rampGroup.userData.isRampGroup && rampGroup.userData.rampMesh) {
      rampGroup.userData.rampMesh.userData.isRamp = true;
      rampMeshes.push(rampGroup.userData.rampMesh);
    } else if (rampGroup.userData.isRamp) {
      rampMeshes.push(rampGroup);
    }
  });
  
  if (rampMeshes.length > 0) {
    const rayOrigin = new THREE.Vector3(ballMesh.position.x, ballMesh.position.y + 5, ballMesh.position.z);
    groundRaycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));
    const intersects = groundRaycaster.intersectObjects(rampMeshes, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      if (hit.point.y > floorLevel) {
        floorLevel = hit.point.y;
        onRamp = true;
        if (hit.face) {
          surfaceNormal.copy(hit.face.normal);
          hit.object.localToWorld(surfaceNormal);
          surfaceNormal.sub(hit.object.position).normalize();
        }
      }
    }
  }
  
  // The target Y position for ball sitting on floor
  const targetY = floorLevel + 0.3; // floorLevel + ballRadius
  
  // Apply horizontal velocity
  ballMesh.position.x += ballVelocity.x;
  ballMesh.position.z += ballVelocity.z;
  
  // Vertical physics - simple like original ground
  if (ballMesh.position.y > targetY + 0.01) {
    // Ball is in the air - apply gravity and move
    ballVelocity.y -= 0.008;
    ballMesh.position.y += ballVelocity.y;
    
    // Check if landed
    if (ballMesh.position.y <= targetY) {
      ballMesh.position.y = targetY;
      ballVelocity.y = 0;
    }
  } else {
    // Ball is on the floor - lock Y position
    ballMesh.position.y = targetY;
    ballVelocity.y = 0;
  }
  
  // Ramp launch physics (only when on ramp)
  if (onRamp) {
    const slopeDir = new THREE.Vector3(surfaceNormal.x, 0, surfaceNormal.z).normalize();
    const slopeStrength = Math.abs(surfaceNormal.y);
    
    if (slopeStrength < 0.99) {
      const slopeForce = 0.004 * (1 - slopeStrength);
      ballVelocity.x += slopeDir.x * slopeForce;
      ballVelocity.z += slopeDir.z * slopeForce;
    }
    
    const speed = Math.sqrt(ballVelocity.x * ballVelocity.x + ballVelocity.z * ballVelocity.z);
    if (speed > 0.08 && ballVelocity.y <= 0) {
      const moveDir = new THREE.Vector3(ballVelocity.x, 0, ballVelocity.z).normalize();
      const dot = moveDir.dot(slopeDir);
      if (dot < -0.3) {
        ballVelocity.y = speed * 0.5;
      }
    }
  }

  // Apply friction to horizontal movement
  ballVelocity.x *= 0.96;
  ballVelocity.z *= 0.96;

  if (ballVelocity.length() < 0.001) {
    ballVelocity.set(0, 0, 0);
  }

  const ballRadius = 0.3;
  const ballSphere = new THREE.Sphere(ballMesh.position, ballRadius);

  // Check if ball is in the hole
  const distanceToHole = new THREE.Vector2(ballMesh.position.x, ballMesh.position.z)
    .distanceTo(new THREE.Vector2(holePosition.x, holePosition.z));
  
  if (distanceToHole < holeRadius - 0.2 && ballVelocity.length() < 0.5) { // Ball must be moving slowly to fall in
    // Ball scored! Start falling animation
    isBallFalling = true;
    ballVelocity.set(0, 0, 0);
    
    // Create celebration particle effect
    createParticles(ballMesh.position.clone(), 0xffaa00, 30);
    createParticles(ballMesh.position.clone(), 0xff3366, 20);
    
    lastHits = currentHits;
    if (bestHits === null || currentHits < bestHits) {
      bestHits = currentHits;
    }
    updateScoreUI();
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
  updateParticles(delta); // Update particle effects
  
  // Animate clouds slowly
  clouds.rotation.y += delta * 0.02;

  // Update mouse raycasting for aerial mode
  if (ballMesh && !isBallFalling && ballVelocity.length() < 0.001) {
    // Cast ray from mouse to ground
    raycaster.setFromCamera(mouse, camera);
    
    // Create a ground plane for intersection
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersectPoint);
    
    if (intersectPoint) {
      mouseGroundPosition.copy(intersectPoint);
    }
    
    // Determine if in aerial mode
    isAerialMode = camera.position.y > 15;
    
    // Handle pointer lock based on mode changes
    if (isAerialMode !== previousAerialMode) {
      if (isAerialMode) {
        // Switching to aerial mode - exit pointer lock
        if (document.pointerLockElement === renderer.domElement) {
          document.exitPointerLock();
        }
      } else {
        // Switching to ground mode - request pointer lock
        renderer.domElement.requestPointerLock();
      }
      previousAerialMode = isAerialMode;
    }
    
    // Show/hide aim target based on mode
    if (isAerialMode) {
      aimTarget.visible = true;
      aimTarget.position.copy(mouseGroundPosition);
      aimTarget.position.y = 0.3;
      
      aimDot.visible = true;
      aimDot.position.copy(mouseGroundPosition);
      aimDot.position.y = 0.31;
      
      // Animate aim target
      aimTarget.rotation.z += delta * 2;
      
      // Update UI
      document.body.classList.add('aerial-mode');
      const aimModeElement = document.getElementById('aim-mode');
      if (aimModeElement) {
        aimModeElement.innerHTML = '🖱️ <span style="color: #ff3366;">Aerial Mode</span> - Use Mouse';
      }
    } else {
      aimTarget.visible = false;
      aimDot.visible = false;
      document.body.classList.remove('aerial-mode');
      const aimModeElement = document.getElementById('aim-mode');
      if (aimModeElement) {
        aimModeElement.innerHTML = '🚶 <span style="color: #00ff88;">Ground Mode</span> - Use Position';
      }
    }
  } else {
    aimTarget.visible = false;
    aimDot.visible = false;
    // Reset mode tracking when ball is moving
    previousAerialMode = isAerialMode;
  }

  // Update trajectory line when ball is stationary
  if (ballMesh && !isBallFalling && ballVelocity.length() < 0.001) {
    trajectoryLine.visible = true;
    
    // Calculate direction based on mode (aerial mouse or ground position)
    const shootDir = calculateShootDirection();
    
    // Use current power if charging, otherwise show a preview with medium power
    const previewPower = isCharging ? shotPower : 1.0;
    updateTrajectoryLine(ballMesh.position, shootDir, previewPower);
  } else {
    if (trajectoryLine) {
      trajectoryLine.visible = false;
      trajectoryDots.forEach(dot => dot.visible = false);
    }
  }
  
  updateCamera(delta);
  
  // Update ball camera and render ball cam view
  if (ballMesh && ballVelocity.length() > 0.01 && !isBallFalling) {
    ballCamActive = true;
    ballCamContainer.style.display = 'block';
    
    // Position ball camera behind the ball, looking in direction of movement
    const ballPos = ballMesh.position.clone();
    const velDir = ballVelocity.clone().normalize();
    
    // Camera follows behind the ball
    const cameraOffset = velDir.clone().multiplyScalar(-3); // 3 units behind
    cameraOffset.y = 1.5; // Slightly above
    
    ballCamera.position.copy(ballPos).add(cameraOffset);
    
    // Look slightly ahead of the ball
    const lookTarget = ballPos.clone().add(velDir.clone().multiplyScalar(5));
    lookTarget.y = 0.3;
    ballCamera.lookAt(lookTarget);
    
    // Render ball cam view
    ballCamRenderer.render(scene, ballCamera);
  } else {
    if (ballCamActive) {
      ballCamActive = false;
      ballCamContainer.style.display = 'none';
    }
  }
  
  composer.render(); // Use post-processing composer instead of direct render
}

requestAnimationFrame(animate);


