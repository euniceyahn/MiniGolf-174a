import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();


export function createFlag(path, options = {}) {
    const {
        position = new THREE.Vector3(0,10,0),
        scale = new THREE.Vector3(1,1,1),
        rotation = new THREE.Euler(0,0,0),
        onload = () => {},
        onProgress = () => {},
        onError = (err) => console.error('Error loading model:', err),
    } = options;

    return new Promise((resolve, reject) => {
        loader.load(
            path,
            (gltf) => {
                const model = gltf.scene;
                const clips = gltf.animations || [];
                model.position.copy(position);
                model.scale.copy(scale);
                model.rotation.copy(rotation);

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                let mixer = null;
                if (clips.length >0) {
                    mixer = new THREE.AnimationMixer(model);
                    const action = mixer.clipAction(clips[0]);
                    action.play()
                }
                onload(model);
                resolve({model, mixer});
            },
            (xhr) => onProgress(xhr),
            (err) => {
                onError(err);
                reject(err);
            }
        );
    });
}