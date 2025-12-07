import * as THREE from 'three';

export function createcloud() {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/textures/cloud-removebg-preview.png');

    const material = new THREE.SpriteMaterial({
        map:tex,
        transparent: true,
        opacity: 0.9,
    });
    const cloud = new THREE.Sprite(material);

     cloud.scale.set(12,10, 1);
    cloud.userData.speedX = (Math.random() * 0.002) - 0.001;
    cloud.userData.speedY = (Math.random() * 0.002) - 0.001;

    cloud.castShadow = false;
    cloud.receiveShadow = false;
    return cloud;
}