import * as THREE from 'three';

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 30, 100);
  return camera;
}

export function setupFlyCamera(camera, renderer) {
  // --- Movement ---
  const keys = {};
  document.addEventListener('keydown', e => (keys[e.code] = true));
  document.addEventListener('keyup', e => (keys[e.code] = false));

  const moveSpeed = 0.5;
const velocity = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const right = new THREE.Vector3();

  // --- Bird's Eye View Toggle ---
  let isBirdsEyeView = false;
  let savedPosition = new THREE.Vector3();
  let savedRotation = new THREE.Euler();
  
  document.addEventListener('keydown', (e) => {
    if (e.key === '7') {
      isBirdsEyeView = !isBirdsEyeView;
      
      if (isBirdsEyeView) {
        // Save current camera state
        savedPosition.copy(camera.position);
        savedRotation.copy(camera.rotation);
        
        // Switch to bird's eye view
        camera.position.set(0, 80, 0);
        camera.rotation.set(-Math.PI / 2, 0, 0);
        camera.rotation.order = 'YXZ';
      } else {
        // Restore previous camera state
        camera.position.copy(savedPosition);
        camera.rotation.copy(savedRotation);
        camera.rotation.order = 'YXZ';
      }
    }
  });

  // --- Mouse rotation with pointer lock ---
  const rotationSpeed = 0.002;

  // Request pointer lock on click
  renderer.domElement.addEventListener('click', () => {
    if (!isBirdsEyeView) {
      renderer.domElement.requestPointerLock();
    }
  });

  // Handle mouse movement when pointer is locked
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement !== renderer.domElement || isBirdsEyeView) return;

    const deltaX = e.movementX || 0;
    const deltaY = e.movementY || 0;

    camera.rotation.order = 'YXZ'; // yaw (y), pitch (x)
    camera.rotation.y -= deltaX * rotationSpeed; // yaw
    camera.rotation.x -= deltaY * rotationSpeed; // pitch
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
  });

  // --- Update per frame ---
  function update(deltaTime) {
    // Skip movement updates when in bird's eye view
    if (isBirdsEyeView) return;
    
    direction.set(0, 0, -1).applyQuaternion(camera.quaternion);
    direction.y = 0;             // flatten movement horizontally
    direction.normalize();
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    const move = new THREE.Vector3();

    if (keys['ArrowUp']) move.add(direction);
    if (keys['ArrowDown']) move.sub(direction);
    if (keys['ArrowLeft']) move.sub(right);
    if (keys['ArrowRight']) move.add(right);
    if (keys['Space']) move.y += 1;
    if (keys['ShiftLeft'] || keys['ShiftRight']) move.y -= 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(moveSpeed);
    }
    velocity.lerp(move, 0.1);

    camera.position.addScaledVector(velocity, deltaTime * 60);
    
    // Clamp camera position to map boundaries (100x100 ground)
    const mapBoundary = 50; // Ground is 100x100, so ±50 from center
    camera.position.x = Math.max(-mapBoundary, Math.min(mapBoundary, camera.position.x));
    camera.position.z = Math.max(-mapBoundary, Math.min(mapBoundary, camera.position.z));
    
    // Prevent camera from going below ground
    camera.position.y = Math.max(0.5, camera.position.y);
  }

  return { update };
}
