import * as THREE from 'three';

export function createCubeObstacle(position = { x: 0, y: 1, z: 0 }, size = { x: 2, y: 2, z: 2 }, color = 0xffffff) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    
    const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.2,
        roughness: 0.4,
        emissive: color,
        emissiveIntensity: 0.1,
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(position.x, position.y, position.z);
    cube.castShadow = true;
    cube.receiveShadow = true;
    
    return cube;
}