import * as THREE from 'three';

export function createCubeObstacle(position = { x: 0, y: 1, z: 0 }, size = { x: 2, y: 2, z: 2 }, color = 0xffffff) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    
    const material = new THREE.MeshStandardMaterial({
        color: color,
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(position.x, position.y, position.z);
    
    return cube;
}