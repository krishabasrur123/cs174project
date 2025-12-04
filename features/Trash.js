import * as THREE from 'three';

export function createTrash() {
    const loader = new THREE.TextureLoader();
    const texture = loader.load('./textures/trash.png')
        // const texture = loader.load("./textures/trash.png", t => {
        //     t.wrapS = THREE.RepeatWrapping;
        //     t.wrapT = THREE.RepeatWrapping;
        //     t.repeat.set(1, 1);
        // });

    //const geometry = new THREE.SphereGeometry(2, 64, 64); // small sphere trash

    const geometry = new THREE.IcosahedronGeometry(1, 0);

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