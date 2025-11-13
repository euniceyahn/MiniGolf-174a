import * as THREE from 'three';


export function createWall() {
    const loader = new THREE.TextureLoader();

    // Load all textures from public folder
    const colorMap = loader.load('/textures/Brick/Brick_Color.jpg');
    const normalMap = loader.load('/textures/Brick/Brick_NormalGL.jpg');
    const roughnessMap = loader.load('/textures/Brick/Brick_Roughness.jpg');
    const displacementMap = loader.load('/textures/Brick/Brick_Displacement.jpg');
    const aoMap = loader.load('/textures/Brick/Brick_AmbientOcclusion.jpg');

    // Repeat textures
    [colorMap, normalMap, roughnessMap, displacementMap, aoMap].forEach(tex => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(35, 0.25); // adjust scale
    });

    const wallgeometry = new THREE.BoxGeometry(70, 1, 1); 
    // const wallmaterial = new THREE.MeshStandardMaterial({
    //     map: colorMap,
    //     normalMap: normalMap,
    //     roughnessMap: roughnessMap,
    //     displacementMap: displacementMap,
    //     displacementScale: 0.001, 
    //     aoMap: aoMap,
    //     side: THREE.DoubleSide,
    // });
    const wallmaterial = new THREE.MeshStandardMaterial({
  map: colorMap,
  side: THREE.DoubleSide,
});

    const wall1 = new THREE.Mesh(wallgeometry, wallmaterial);
    wall1.position.set(10,0,10)
    // ground.rotation.x = -Math.PI / 2;
    // ground.receiveShadow = true;

    // Set uv2 for AO map
    wallgeometry.attributes.uv2 = wallgeometry.attributes.uv;

    return wall1;
}
