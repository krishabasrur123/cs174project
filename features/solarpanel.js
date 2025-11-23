import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8ef);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(6, 6, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.target.set(6, 6, -2);

// Sun setup
const sunGeometry = new THREE.SphereGeometry(1, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfdfd96 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(10, 10, 10);
scene.add(sun);

// Directional light representing sun
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.copy(sun.position);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// Solar panel setup
const panelContainer = new THREE.Group();
scene.add(panelContainer);

const panelWidth = 5;
const panelHeight = 2.5;
const panelThickness = 0.2;
const panelGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness);

function createPanelTexture() {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const squareSize = 16;
    
    for (let row = 0; row < size; row += squareSize) {
        for (let col = 0; col < size; col += squareSize) {
            const isBlue = (col + row) % (2 * squareSize) === 0;
            context.fillStyle = isBlue ? '#1013dc81' : '#30088eff';
            context.fillRect(col, row, squareSize, squareSize);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 1);
    return texture;
}

const panelMaterial = new THREE.MeshStandardMaterial({
    map: createPanelTexture(),
    roughness: 0.2,
    metalness: 0.1
});

const solarPanel = new THREE.Mesh(panelGeometry, panelMaterial);
solarPanel.rotation.x = -Math.PI / 6;
panelContainer.add(solarPanel);

panelContainer.position.set(6, 6, -2);

const moveSpeed = 0.1;
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            panelContainer.position.z -= moveSpeed;
            break;
        case 'ArrowDown':
            panelContainer.position.z += moveSpeed;
            break;
        case 'ArrowLeft':
            panelContainer.position.x -= moveSpeed;
            break;
        case 'ArrowRight':
            panelContainer.position.x += moveSpeed;
            break;
    }
    orbitControls.target.copy(panelContainer.position);
});

// Sun animation parameters
let sunRadius = 1;
let expanding = true;
const minRadius = 0.5;
const maxRadius = 2;

function updateSun() {
    // Update radius
    if (expanding) {
        sunRadius += 0.01;
        if (sunRadius >= maxRadius) expanding = false;
    } else {
        sunRadius -= 0.01;
        if (sunRadius <= minRadius) expanding = true;
    }

    // Update sun sphere
    sun.scale.set(sunRadius, sunRadius, sunRadius);

    // Update light intensity based on radius
    sunLight.intensity = 0.5 + (sunRadius - minRadius) / (maxRadius - minRadius) * 1.5; // 0.5 → 2
}

function runAnimation() {
    requestAnimationFrame(runAnimation);
    
    updateSun();
    orbitControls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

runAnimation();
