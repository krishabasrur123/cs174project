import * as THREE from 'three';

export function createTree() {
    const tree = new THREE.Group();

    // --- Trunk ---
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5;
    tree.add(trunk);

    // --- Foliage (3 spheres stacked) ---
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });

    for (let i = 0; i < 3; i++) {
        const sphereGeo = new THREE.SphereGeometry(1.4 - i * 0.2, 16, 16);
        const foliage = new THREE.Mesh(sphereGeo, foliageMat);

        foliage.position.y = 3 + i * 0.8;
        tree.add(foliage);
    }

    // Shadows
    tree.traverse(obj => {
        if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
        }
    });

    tree.userData.isTree = true;

    return tree;
}