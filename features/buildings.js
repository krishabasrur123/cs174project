import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const loader = new THREE.TextureLoader();

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8ef);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 3, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(3, 10, 5);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.4));

const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(30, 50, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2000;
sunLight.shadow.mapSize.height = 2000;
scene.add(sunLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(300, 300);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Building textures
const buildingTextures = [
  "/textures/building1.png",
  "/textures/building2.png",
  "/textures/building3.png",
  "/textures/building5.png",
  "/textures/building6.png",
];

// Create buildings 
const gridSize = 10;
const spacing = 10;

for (let i = -gridSize; i <= gridSize; i++) {
  for (let j = -gridSize; j <= gridSize; j++) {

    if (Math.random() > 0.4) continue;

    const x = i * spacing;
    const z = j * spacing;

    // Random dimensions
    const height = 7 + Math.random() * 10;
    const width = 5 + Math.random() * 3;
    const depth = 3 + Math.random() * 3;

    // Random texture
    const texturePath = buildingTextures[Math.floor(Math.random() * buildingTextures.length)];
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const texture = loader.load(texturePath);

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    // Materials
    const sideMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2
    });

    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const bottomMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

    const material = [
      sideMaterial,
      sideMaterial,
      roofMaterial,
      bottomMaterial,
      sideMaterial,
      sideMaterial
    ];

    // Create building mesh
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;

    scene.add(building);
  }
}

// Animation loop 
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
