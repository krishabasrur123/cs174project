import * as THREE from 'three';

export function createFruit() {
    const loader = new THREE.TextureLoader();

    const textures = [
        "./textures/apple.png",
        "./textures/orange2.png"
    ];


    const texturePath = textures[Math.floor(Math.random() * textures.length)]
        //const geometry = new THREE.SphereGeometry(2, 64, 64); // small sphere trash
    const texture = loader.load(texturePath, t => {
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(1, 1);
    });

    const geometry = new THREE.SphereGeometry(1, 16, 16);

    //const material = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
    });



    const trash = new THREE.Mesh(geometry, material);
    //trash.rotation.y = Math.PI / 4;
    trash.rotation.z = Math.PI / 2;
    trash.rotation.y = Math.PI / 2;
    trash.castShadow = true;
    trash.receiveShadow = true;

    // Name it so raycaster can identify it
    trash.name = "trash";

    // Spawn somewhere random on the map
    const range = 50; // adjust based on your world's size
    trash.position.set(
        (Math.random() - 0.5) * range, 2, // slightly above ground
        (Math.random() - 0.5) * range
    );

    return trash;
}