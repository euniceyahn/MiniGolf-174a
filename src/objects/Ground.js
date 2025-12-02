// src/objects/Ground.js
import * as THREE from 'three';

export function createGround() {
    const loader = new THREE.TextureLoader();

    // Load all textures from public folder
    const colorMap = loader.load('/textures/Grass/Grass_Color.jpg');
    const normalMap = loader.load('/textures/Grass/Grass_NormalGL.jpg');
    const roughnessMap = loader.load('/textures/Grass/Grass_Roughness.jpg');
    const displacementMap = loader.load('/textures/Grass/Grass_Displacement.jpg');
    const aoMap = loader.load('/textures/Grass/Grass_AmbientOcclusion.jpg');

    // Repeat textures
    [colorMap, normalMap, roughnessMap, displacementMap, aoMap].forEach(tex => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(10, 10); // adjust scale
    });

    const geometry = new THREE.PlaneGeometry(100, 100, 256, 256); // subdivisions for displacement
    const material = new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        displacementMap: displacementMap,
        displacementScale: 0.5, // tweak for bumpiness
        aoMap: aoMap,
    });

    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.castShadow = false;

    // Set uv2 for AO map
    geometry.attributes.uv2 = geometry.attributes.uv;

    return ground;
}
