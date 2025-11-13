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
        tex.repeat.set(7, 0.1); // adjust scale
    });

    let positions = [
        {x:0, z:45},
        {x: 44.5, z:30.5},
        {x:30, z:15},
        {x:15, z:-14.5},
        {x:-14.5, z:-45},
        {x:-44.5, z:-0.5}
    ]

    let dimensions = [
        {x:90, z:1},
        {x:1, z:30},
        {x:30, z:1},
        {x:1, z:60},
        {x:60, z:1},
        {x:1, z:90}
    ]
    let walls = [];
    let geometries = [];



    const wall1geometry = new THREE.BoxGeometry(80, 1, 1); 

    const wallmaterial = new THREE.MeshStandardMaterial({
        map: colorMap,
        side: THREE.DoubleSide,
    });

    for (let i = 0; i <6; i++) {
        const geometry = new THREE.BoxGeometry(dimensions[i].x, 1, dimensions[i].z);
        
        [colorMap, normalMap, roughnessMap, displacementMap, aoMap].forEach(tex => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(dimensions[i].z / 10.0, dimensions[i].x / 10.0);
        });

        const material = new THREE.MeshStandardMaterial({
            map:colorMap,
            side:THREE.DoubleSide,
        });


        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(positions[i].x, 0.5, positions[i].z);
        

        geometry.attributes.uv2 = geometry.attributes.uv;

        walls.push(wall);
    }


    return walls;



// geometries[0] = new THREE.BoxGeometry(dimensions[0].x, 1, dimensions[0].z);
// const testwall = new THREE.Mesh(geometries[0], wallmaterial);
// testwall.position.set(positions[0].x, 1, positions[0].z);
// testwall.position.set(0, 1, 0);



    const wall1 = new THREE.Mesh(wall1geometry, wallmaterial);
    wall1.position.set(10,1,10)
    // ground.rotation.x = -Math.PI / 2;
    // ground.receiveShadow = true;

    // Set uv2 for AO map
    // wall1geometry.attributes.uv2 = wall1geometry.attributes.uv;
    // geometries[0].attributes.uv2 = geometries[0].attributes.uv;
    // return testwall;

    // return wall1;


}
