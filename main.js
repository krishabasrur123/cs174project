import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8ef);

// Camera setup
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 3, 5);

// Renderer setup
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
sunLight.position.set(30, 50,20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2000;
sunLight.shadow.mapSize.height = 2000;
scene.add(sunLight);

// Ground

const groundGeometry = new THREE.PlaneGeometry(200,200);
const groundMaterial = new THREE.MeshStandardMaterial({color : 0x555555});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Building

function createBuilding (x, z) {

  const height = 5 + Math.random() * 15;
  const width =  2 + Math.random() * 3;
  const depth =  2 + Math.random() * 3;

  const color = new THREE.Color().setHSL(Math.random(), 0.3, 0.25 + Math.random() * 0.15);
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color : color,
    roughness : 0.8,
    metalness : 0.3,
  });
  

const building = new THREE.Mesh(geometry, material);
building.position.set(x, height / 2, z);
building.castShadow = true;
building.receiveShadow = true;

scene.add(building);
}
function createTrash (x,z) {
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.MeshStandardMaterial({color: 0x888888,
    side : THREE.DoubleSide,
    roughness: 1.0
  });

  const trash = new THREE.Mesh(geometry, material);
  trash.rotation.x = -Math.PI / 2;
  trash.position.set(x, 0.02, z);
  scene.add(trash);
}


const gridSize = 6; 
const spacing = 12;
for ( let i = -gridSize; i <= gridSize; i++) {
  for (let j = -gridSize; j <= gridSize; j++) {
    if (Math.random() > 0.5) continue;

    const x = i * spacing;
    const z = j * spacing;

    createBuilding (x, z);
    const trashCount = Math.floor(Math.random() * 7) + 4;
    for (let t = 0;  t < trashCount; t++) {
     const offsetX = (Math.random() * 20 - 10);
     const offesetZ = (Math.random() * 20 - 10);
     createTrash (x +offsetX, z + offesetZ);
    }
  }
}



// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
