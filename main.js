import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createWindmill } from './features/windmill.js';
import { createTree } from './features/tree.js';
import { createSolarPanel } from './features/solarpanel.js';
import { createCameraController } from './features/CameraController.js';
import { createTrash } from './features/Trash.js';

const loader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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

// --- Game State ---
let wateringCans = 10;
let solarPanels = 10;
let wind = 0;
let points = 0;
let windMilestone = 0;
let groundTiles = [];
let allBuildings = [];
let selectedBuilding = null;
let windmillTimers = new Map();
let windmillPointTimers = new Map();

const highlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    wireframe: true
});
let highlightMesh = null;


// --- UI Display ---
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
        ⭐ Total Points: ${points}<br>
        💨 Wind Points: ${wind}<br>
        🌱 Watering Cans: ${wateringCans}<br>
        ☀️ Solar Panels: ${solarPanels}<br>
    `;
}
updateUI();

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
const collidableObjects = [];
const CameraController = createCameraController(camera, scene, collidableObjects);


const baseSolarPanel = createSolarPanel();


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

    // 🔥 Add to raycast list
    groundTiles.push(tile);
}


// function isTextureGreen(texture, callback) {
//     const image = texture.image;
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");

//     canvas.width = image.width;
//     canvas.height = image.height;
//     ctx.drawImage(image, 0, 0);

//     const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

//     let greenCount = 0;
//     let total = canvas.width * canvas.height;

//     for (let i = 0; i < data.length; i += 4) {
//         const r = data[i];
//         const g = data[i + 1];
//         const b = data[i + 2];

//         if (g > r + 20 && g > b + 20) greenCount++;
//     }

//     const fractionGreen = greenCount / total;
//     callback(fractionGreen > 0.2); // 20% green = qualifies for tree
// }


for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
        const x = i * spacing;
        const z = j * spacing;
        let hasBuilding = false;
        if (Math.random() < 0.15) {
            hasBuilding = true;

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

            collidableObjects.push(building);
        }
        createTile(x, z, hasBuilding);

        if (!hasBuilding && Math.random() < 0.1) {
            const { windmillGroup, bladeGroup: blades } = createWindmill();
            windmillGroup.position.set(x, -1, z);
            scene.add(windmillGroup);

            // NEW — add interaction state
            windmillGroup.userData.spin = false;
            windmillGroup.userData.blades = blades;

            allWindwills.push(windmillGroup);
            allBlades.push(blades);
            collidableObjects.push(windmillGroup);

        } else if (!hasBuilding && Math.random() < 0.5) {

            const tree = createTree();
            tree.position.set(x, 0, z);
            scene.add(tree);
            allTrees.push(tree);
            collidableObjects.push(tree);
        } else if (!hasBuilding && Math.random() < 0.5) {

            const trash = createTrash();
            trash.position.set(x, 1.5, z);

            scene.add(trash);
            //allTrees.push(tree);
            //collidableObjects.push(trash);
        }
    }


}

//BACKUP WINDMILL

// let windmillRotation = 0;
// const stableRange = 5 * (Math.PI / 180);
// const fallSpeed = 0.01;

// document.addEventListener('keydown', (e) => {
//     // if (e.key === 'o') windmillRotation -= 0.05;
// });

function selectBuilding(building) {
    // Remove old highlight
    if (highlightMesh) {
        scene.remove(highlightMesh);
        highlightMesh = null;
    }

    selectedBuilding = building;

    // Create highlight mesh slightly larger
    const geo = new THREE.BoxGeometry(
        building.geometry.parameters.width * 1.05,
        building.geometry.parameters.height * 1.05,
        building.geometry.parameters.depth * 1.05
    );

    highlightMesh = new THREE.Mesh(geo, highlightMaterial);
    highlightMesh.position.copy(building.position);
    scene.add(highlightMesh);

    console.log("Building selected:", building);
}


window.addEventListener('click', onClickTreeGrow);

let lastBuildingClicked = null;

window.addEventListener("click", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(collidableObjects, true);

    lastBuildingClicked = null;

    for (const hit of hits) {
        const obj = hit.object;

        let root = obj;
        while (root.parent && root.parent.type !== "Scene") {
            root = root.parent;
        }

        if (allWindwills.includes(root)) {
            console.log("Windmill clicked!");

            // 🔥 Activate rotation for 10 seconds
            const endTime = performance.now() + 6000; // 5 sec
            windmillTimers.set(root, endTime);
            windmillPointTimers.set(root, performance.now());
            // Give points for clicking a windmill

            updateUI();

            return;
        }

        // if (root.userData && root.userData.blades) {
        //     // It's a windmill!
        //     root.userData.spin = !root.userData.spin;
        //     console.log("Windmill spin toggled:", root.userData.spin);

        //     // DO NOT highlight windmills like buildings
        //     return;
        // }

        // Buildings are BoxGeometry → clickable
        if (obj.geometry && obj.geometry.type === "BoxGeometry") {
            let root = obj;
            while (root.parent && root.parent.type !== "Scene") {
                root = root.parent;
            }

            lastBuildingClicked = root;
            selectBuilding(root); // <--- NEW highlighting
            return;
        }
    }


    // If you click empty ground → clear highlight
    if (highlightMesh) {
        scene.remove(highlightMesh);
        highlightMesh = null;
    }
});


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
    points += 2;

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


window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "p") return;
    if (!selectedBuilding) return;

    if (!baseSolarPanel) {
        console.warn("Solar panel not found in scene!");
        return;
    }

    if (solarPanels <= 0) {
        console.log("No solar panels left!");
        return;
    }

    // Remove any existing panel on the building
    const oldPanel = selectedBuilding.getObjectByName("SolarPanel");
    if (oldPanel) {
        console.log("Building already has a solar panel!");
        return; // ❗ Stop — no point increase, no solar panel decrease
    }

    if (!baseSolarPanel) {
        console.warn("Solar panel not found in scene!");
        return;
    }

    if (solarPanels <= 0) {
        console.log("No solar panels left!");
        return;
    }

    // Clone the actual solar panel from solarpanel.js
    const newPanel = baseSolarPanel.clone(true);
    newPanel.name = "SolarPanel";

    // Compute roof height
    const box = new THREE.Box3().setFromObject(selectedBuilding);
    const size = new THREE.Vector3();
    box.getSize(size);

    const roofHeight = size.y / 2;

    // Attach to the building
    selectedBuilding.add(newPanel);

    // Local position
    newPanel.position.set(0, roofHeight + 0.2, 0);

    // Optional tilt
    newPanel.rotation.x = -Math.PI / 6;

    console.log("Solar panel cloned onto building!");
    solarPanels--;
    points += 5;
    updateUI();
});

function animate() {
    requestAnimationFrame(animate);
    scene.traverse(obj => {
        if (obj.userData && obj.userData.spin && obj.userData.blades) {
            obj.userData.blades.rotation.z += 0.05;
        }
    });
    allBlades.forEach((blades, i) => {
        const windmill = allWindwills[i];

        const endTime = windmillTimers.get(windmill);
        const now = performance.now();

        if (endTime && now < endTime) {
            // 🔄 Spin while timer active
            blades.rotation.z += 0.08;

            const lastPointTime = windmillPointTimers.get(windmill) || now;


            if (now - lastPointTime >= 1000) {
                wind += 1; // +1 point per second while spinning
                windmillPointTimers.set(windmill, now);
                updateUI();
            }
            const milestone = Math.floor((wind + 1) / 10);

            if (milestone > windMilestone) {
                windMilestone += 1;
                points += 2;
            }

        } else {
            // 🛑 Stop spinning after 10 sec
            windmillTimers.delete(windmill);
            windmillPointTimers.delete(windmill);
        }

    });

    // allWindwills.forEach(w => {
    //     w.rotation.z = windmillRotation
    // });

    // if (windmillRotation > stableRange) {
    //     const ground = Math.PI / 2;
    //     if (windmillRotation < ground) windmillRotation += fallSpeed;
    // } else if (windmillRotation < -stableRange) {
    //     const ground = -Math.PI / 2;
    //     if (windmillRotation > ground) windmillRotation -= fallSpeed;
    // }

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