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

  const moveSpeed = 0.01;
  const direction = new THREE.Vector3();
  const right = new THREE.Vector3();

  // --- Mouse rotation ---
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  const rotationSpeed = 0.005;

  renderer.domElement.addEventListener('mousedown', e => {
    isDragging = true;
    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;
  });

  document.addEventListener('mouseup', () => (isDragging = false));

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    previousMousePosition.x = e.clientX;
    previousMousePosition.y = e.clientY;

    camera.rotation.order = 'YXZ'; // yaw (y), pitch (x)
    camera.rotation.y += deltaX * rotationSpeed; // yaw
    camera.rotation.x += deltaY * rotationSpeed; // pitch
    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
  });

  // --- Update per frame ---
  function update() {
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
      camera.position.add(move);
    }
  }

  return { update };
}
