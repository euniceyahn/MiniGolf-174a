import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export function createPutter(path, options = {}) {
    const {
        position = new THREE.Vector3(0, 0, 0),
        scale = new THREE.Vector3(1, 1, 1),
        rotation = new THREE.Euler(0, 0, 0),
        onload = () => {},
        onProgress = () => {},
        onError = (err) => console.error('Error loading putter:', err),
    } = options;

    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => {
                const model = gltf.scene;

                model.position.copy(position);
                model.scale.copy(scale);
                model.rotation.copy(rotation);

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                onload(model);
                resolve({ model });
            },
            (xhr) => onProgress(xhr),
            (err) => {
                onError(err);
                reject(err);
            }
        );
    });
}
