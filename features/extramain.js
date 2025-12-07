import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createWindmill } from './features/windmill.js';
import { createTree } from './features/tree.js';
import { createSolarPanel } from './features/solarpanel.js';
import { createCameraController } from './features/CameraController.js';

const loader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8ef);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 0.5, 1);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Game State ---
let wateringCans = 10;
let solarPanels = 5;
let windmills = 5;
let points = 0;
let windmillCredits = 3;
let groundTiles = [];

const ui = document.createElement("div");
ui.style.position = "absolute";
ui.style.top = "10px";
ui.style.left = "10px";
ui.style.padding = "10px 20px";
ui.style.background = "rgba(255,255,255,0.8)";
ui.style.borderRadius = "8px";
ui.style.fontSize = "18px";
ui.style.fontFamily = "Arial";
ui.style.zIndex = "1000";
document.body.appendChild(ui);

function updateUI() {
    ui.innerHTML = `
        ⭐ Points: ${points}<br>
        🌱 Watering Cans: ${wateringCans}<br>
        ☀️ Solar Panels: <br>
        💨 Windmills: <br>
        

    `;
}
updateUI();

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
const collidableObjects = [];
const CameraController = createCameraController (camera, scene, collidableObjects);

createSolarPanel(scene, camera, renderer);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(3, 10, 5);
scene.add(light, new THREE.AmbientLight(0xffffff, 2));

const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(30, 50, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2000;
sunLight.shadow.mapSize.height = 2000;
scene.add(sunLight);

// Ground
const roadTexture = loader.load("/textures/road3.png");
roadTexture.wrapS = roadTexture.wrapT = THREE.RepeatWrapping;

roadTexture.repeat.set(0.80, 0.80);
const grassTexture = loader.load("/textures/ground.jpg");
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;


// Building textures
const buildingTextures = [
    "/textures/building1.png",
    "/textures/building2.png",
    "/textures/building3.png",
    "/textures/building5.png",
    "/textures/building6.png",
];

let allBlades = []
let allWindwills = [];
let allTrees = [];


const blueMat = new THREE.MeshStandardMaterial({ color: 0x0066ff, roughness: 0.2 });
const greenMat = new THREE.MeshStandardMaterial({ color: 0x00ff66, roughness: 0.7 });

function createAppleCore() {
    const group = new THREE.Group();

    // --- Core cylinder ---
    const coreGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 12);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffe5b4,  // apple core flesh color
        roughness: 0.8
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // --- Top bite sphere ---
    const biteGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const biteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,      // slightly transparent bite
    });

    const topBite = new THREE.Mesh(biteGeo, biteMat);
    topBite.position.y = 0.4;
    topBite.scale.set(1.15, 0.5, 1.15); // flatten a bit
    group.add(topBite);

    // --- Bottom bite ---
    const bottomBite = new THREE.Mesh(biteGeo, biteMat);
    bottomBite.position.y = -0.4;
    bottomBite.scale.set(1.15, 0.5, 1.15);
    group.add(bottomBite);

    return group;
}


function createTrashPiece() {
    const geo = new THREE.DodecahedronGeometry(0.5);

    const mat = Math.random() < 0.5 ? greenMat : blueMat;
    return new THREE.Mesh(geo, mat);
}



// Create buildings 
const gridSize = 10;
const spacing = 10;


function createTile(x, z, isRoad) {
    const tileGeom = new THREE.PlaneGeometry(10, 10);

    const tileMat = new THREE.MeshStandardMaterial({
        map: isRoad ? grassTexture : roadTexture,
        side: THREE.DoubleSide,
    });

    const tile = new THREE.Mesh(tileGeom, tileMat);
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(x, 0, z);
    tile.receiveShadow = true;

    scene.add(tile);

    
    groundTiles.push(tile);
}

let allTrash = [];

for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {

        const x = i * spacing;
        const z = j * spacing;

        let hasBuilding = false;

        // ----- BUILDING -----
        if (Math.random() < 0.15) {
            hasBuilding = true;

            const height = 7 + Math.random() * 10;
            const width = 5 + Math.random() * 3;
            const depth = 3 + Math.random() * 3;

            const texturePath = buildingTextures[Math.floor(Math.random() * buildingTextures.length)];
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const texture = loader.load(texturePath);

            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;

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

            const building = new THREE.Mesh(geometry, material);
            building.position.set(x, height / 2, z);
            building.castShadow = true;
            building.receiveShadow = true;

            scene.add(building);
            collidableObjects.push(building);
        }

        createTile(x, z, hasBuilding);

        // ----- WINDMILL -----
        if (!hasBuilding && Math.random() < 0.1) {
            const { windmillGroup, bladeGroup: blades } = createWindmill();
            windmillGroup.position.set(x, 0, z);
            scene.add(windmillGroup);
            allWindwills.push(windmillGroup);
            allBlades.push(blades);
            collidableObjects.push(windmillGroup);

        // ----- TREE -----
        } else if (!hasBuilding && Math.random() < 0.5) {
            const tree = createTree();
            tree.position.set(x, 0, z);
            scene.add(tree);
            allTrees.push(tree);
            collidableObjects.push(tree);

        // ----- TRASH -----
        } else if (!hasBuilding && Math.random() < 0.1) {

            const trash = createAppleCore();

            trash.position.set(
                x + (Math.random() * 1 - 0.5),
                0.15,
                z + (Math.random() * 1 - 0.5)
            );

            scene.add(trash);
            allTrash.push(trash);
            collidableObjects.push(trash);
        }
    }
}







let windmillRotation = 0;
const stableRange = 5 * (Math.PI / 180);
const fallSpeed = 0.01;

document.addEventListener('keydown', (e) => {
    if (e.key === 'p') windmillRotation += 0.05;
    if (e.key === 'o') windmillRotation -= 0.05;
});

window.addEventListener('click', onClickTreeGrow);

function onClickTreeGrow(event) {
    // convert mouse position to normalized -1..1
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // cast ray
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(allTrees, true);
    if (intersects.length === 0) return;

    // if no watering cans left → do nothing
    if (wateringCans <= 0) {
        console.log("No watering cans left!");
        return;
    }

    const tree = intersects[0].object.parent;

    // grow the tree
    growTree(tree);

    // update game state
    wateringCans--;
    points += 5;

    updateUI();
}


function growTree(tree) {
    const targetScale = tree.scale.x + 0.2;
    const startScale = tree.scale.x;
    const duration = 300; // ms
    const startTime = performance.now();

    function animateGrowth() {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);

        const newScale = startScale + (targetScale - startScale) * t;
        tree.scale.set(newScale, newScale, newScale);

        if (t < 1) requestAnimationFrame(animateGrowth);
    }

    animateGrowth();
}

function animate() {
    requestAnimationFrame(animate);
    allBlades.forEach(b => b.rotation.z += 0.05);
    allWindwills.forEach(w => {
        w.rotation.z = windmillRotation
    });

    if (windmillRotation > stableRange) {
        const ground = Math.PI / 2;
        if (windmillRotation < ground) windmillRotation += fallSpeed;
    } else if (windmillRotation < -stableRange) {
        const ground = -Math.PI / 2;
        if (windmillRotation > ground) windmillRotation -= fallSpeed;
    }

    if (scene.userData.updateTrashCans) {
scene.userData.updateTrashCans();

    }

    CameraController.update();
    renderer.render(scene, camera);
}
animate();



// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});