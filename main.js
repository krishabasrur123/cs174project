// main.js — unified raycaster + fixes

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createWindmill } from './features/windmill.js';
import { createTree } from './features/tree.js';
import { createSolarPanel } from './features/solarpanel.js';
import { createCameraController } from './features/CameraController.js';
import { createTrash } from './features/Trash.js';
import { createtrashcans } from './features/trashcans.js';
import { createFruit } from './features/Fruit.js';

const loader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa0d8ef);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
let gameTime = 300;
let gameRunning = true;
let targetPoints = 75;
let selectedTrash = null;
let selectedFruit = null;
let inputEnabled = true;
let placedObjects = [];

// Highlight materials
const trashHighlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.20 });
let trashHighlightMesh = null;

const fruitHighlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.20 });
let fruitHighlightMesh = null;

const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
let highlightMesh = null;

// Interactive lists (for single raycast & performance)
const interactiveObjects = []; // objects to raycast against (all clickable)
const buildingObjects = [];
const trashObjects = [];
const fruitObjects = [];
const windmillObjects = [];
const treeObjects = [];
const binObjects = [];

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

const timerUI = document.createElement("div");
timerUI.style.position = "absolute";
timerUI.style.top = "10px";
timerUI.style.right = "10px";
timerUI.style.padding = "10px 20px";
timerUI.style.fontSize = "18px";
timerUI.style.fontFamily = "Arial";
timerUI.style.zIndex = "1000";
timerUI.style.background = "rgba(255,255,255,0.8)";
timerUI.style.borderRadius = "8px";
document.body.appendChild(timerUI);

function updateUI() {
    ui.innerHTML = `
        ⭐ Total Points: ${points}<br>
        💨 Wind Points: ${wind}<br>
        🌱 Watering Cans: ${wateringCans}<br>
        ☀️ Solar Panels: ${solarPanels}<br>
    `;
    timerUI.innerHTML = `⏱️ Timer: 00:${gameTime}<br>`;
}
updateUI();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
const collidableObjects = []; // used by CameraController (we'll add interactive objects to this)
const CameraController = createCameraController(camera, scene, collidableObjects);

const baseSolarPanel = createSolarPanel();


const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(30, 50, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 200;
sunLight.shadow.camera.left = -120;
sunLight.shadow.camera.right = 120;
sunLight.shadow.camera.top = 120;
sunLight.shadow.camera.bottom = -120;

const ambient = new THREE.AmbientLight(0xffffff, 0.7);
ambient.intensity = 2; 
scene.add(ambient);
scene.add(sunLight);

const { recycleBin, trashBin, animateFlaps, handleClick } = createtrashcans(scene, (binType) => {
    console.log("Bin clicked:", binType);
});
scene.add(recycleBin);
scene.add(trashBin);

// mark bins and add to interactive lists
recycleBin.userData.type = "recycleBin";
trashBin.userData.type = "trashBin";
interactiveObjects.push(recycleBin, trashBin);
binObjects.push(recycleBin, trashBin);
collidableObjects.push(recycleBin, trashBin);
placedObjects.push(recycleBin, trashBin);

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

const gridSize = 10;
const spacing = 10;

function startGameTimer() {
    const timerInterval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(timerInterval);
            return;
        }
        gameTime--;
        updateUI();
        if (gameTime <= 0) {
            gameRunning = false;
            clearInterval(timerInterval);
            endGame && endGame();
        }
    }, 1000);
}
startGameTimer();

function createTile(x, z, type) {
    const tileGeom = new THREE.PlaneGeometry(10, 10);

    let texturePath = "/textures/grass.jpg";
    let repeatX = 2;
    let repeatY = 2;

    if (type === "road") {
        texturePath = "/textures/road.jpg";
        repeatX = 1;
        repeatY = 1;
    }
    if (type === "sidewalk") {
        texturePath = "/textures/sidewalk.jpg";
        repeatX = 2;
        repeatY = 2;
    }

    const tex = loader.load(texturePath);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);

    const tileMaterial = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.8,
        metalness: 0.0
    });

    if (type === "sidewalk") tileMaterial.color = new THREE.Color(0xcccccc);

    const tile = new THREE.Mesh(tileGeom, tileMaterial);
    tile.rotation.x = -Math.PI / 2;
    tile.position.set(x, 0, z);
    tile.receiveShadow = true;

    scene.add(tile);
    groundTiles.push(tile);
}

let trashCanSets = []

for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
        const x = i * spacing;
        const z = j * spacing;

        let tileType = "grass";
        let hasBuilding = false;

        if (i % 4 === 0 || j % 4 === 0) tileType = "road";

        if (tileType !== "road" && Math.random() < 0.15) {
            hasBuilding = true;
            tileType = "sidewalk";
        }

        createTile(x, z, tileType);

        // BUILDINGS
        if (hasBuilding) {
            const height = 7 + Math.random() * 10;
            const width = 5 + Math.random() * 3;
            const depth = 3 + Math.random() * 3;

            const texturePath = buildingTextures[Math.floor(Math.random() * buildingTextures.length)];
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const texture = loader.load(texturePath);

            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);

            const sideMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0.2 });
            const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
            const bottomMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

            const material = [sideMaterial, sideMaterial, roofMaterial, bottomMaterial, sideMaterial, sideMaterial];

            const building = new THREE.Mesh(geometry, material);
            building.position.set(x, height / 2, z);
            building.castShadow = true;
            building.receiveShadow = true;

            // mark and add to interactive lists
            building.userData.type = "building";
            interactiveObjects.push(building);
            buildingObjects.push(building);
            collidableObjects.push(building);

            scene.add(building);
            allBuildings.push(building);
            placedObjects.push(building);
        }

        // GRASS SPAWNS: windmill / tree / trash / fruit (only one per tile)
        if (tileType === "grass") {
            let hasWindmill = false;
            let hasTree = false;
            let hasTrash = false;
            let hasFruit = false;

            if (Math.random() < 0.1) {
                hasWindmill = true;
                const { windmillGroup, bladeGroup: blades } = createWindmill();
                windmillGroup.position.set(x, -1, z);

                // mark and add to interactive lists
                windmillGroup.userData.type = "windmill";
                interactiveObjects.push(windmillGroup);
                windmillObjects.push(windmillGroup);
                collidableObjects.push(windmillGroup);

                scene.add(windmillGroup);
                allWindwills.push(windmillGroup);
                allBlades.push(blades);
                placedObjects.push(windmillGroup);

            }

            if (!hasWindmill && Math.random() < 0.5) {
                hasTree = true;
                const tree = createTree();
                tree.position.set(x, 0, z);
                tree.castShadow = true;
                tree.receiveShadow = true;

                tree.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // mark and add to interactive lists (trees are clickable)
                tree.userData.type = "tree";
                interactiveObjects.push(tree);
                treeObjects.push(tree);
                collidableObjects.push(tree);

                scene.add(tree);
                allTrees.push(tree);
                placedObjects.push(tree);

            }

            if (!hasWindmill && !hasTree && Math.random() < 0.3) {
                hasTrash = true;
                const trash = createTrash();
                trash.position.set(x, 0.75, z);

                trash.userData.type = "trash";
                interactiveObjects.push(trash);
                trashObjects.push(trash);
                collidableObjects.push(trash);

                scene.add(trash);
            }

            if (!hasWindmill && !hasTree && !hasTrash && Math.random() < 0.3) {
                hasFruit = true;
                const fruit = createFruit();
                fruit.position.set(x, 0.75, z);

                fruit.userData.type = "fruit";
                interactiveObjects.push(fruit);
                fruitObjects.push(fruit);
                collidableObjects.push(fruit);

                scene.add(fruit);
                placedObjects.push(fruit);
            }
        }
    }
}

function objectsOverlap(objA, objB, padding = 0.5) {
    const boxA = new THREE.Box3().setFromObject(objA);
    const boxB = new THREE.Box3().setFromObject(objB);

    boxA.expandByScalar(padding);
    boxB.expandByScalar(padding);

    return boxA.intersectsBox(boxB);
}

function canPlaceObject(newObj, padding = 0.5) {
    for (const existing of placedObjects) {

        if (objectsOverlap(newObj, existing, padding)) {

            // allow solar panels placed onto buildings ONLY
            const newIsSolar = isSolarPanel(newObj);
            const existingIsBuilding = isBuilding(existing);

            const placedOnTopOfBuilding =
                newIsSolar && existingIsBuilding;

            if (placedOnTopOfBuilding) {
                return true; // allowed intentional overlap
            }

            // otherwise overlap is forbidden
            return false;
        }
    }

    return true;
}

// --- helpers for placement rules ---
function isSolarPanel(obj) {
    return !!(obj && obj.userData && obj.userData.type === 'solar');
}

function isBuilding(obj) {
    return !!(obj && obj.userData && obj.userData.type === 'building');
}


// helper: safe remove + dispose + clear highlight
function removeObject(obj) {
    if (!obj) return;
    // remove highlight if present
    if (obj === selectedTrash && trashHighlightMesh) {
        scene.remove(trashHighlightMesh);
        trashHighlightMesh = null;
    }
    if (obj === selectedFruit && fruitHighlightMesh) {
        scene.remove(fruitHighlightMesh);
        fruitHighlightMesh = null;
    }

    // remove from scene and arrays
    scene.remove(obj);
    try {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            } else {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        }
    } catch (err) { /* ignore */ }

    // remove from interactive lists if present
    const remFromList = (list) => {
        const idx = list.indexOf(obj);
        if (idx !== -1) list.splice(idx, 1);
    };
    remFromList(interactiveObjects);
    remFromList(trashObjects);
    remFromList(fruitObjects);
    remFromList(buildingObjects);
    remFromList(treeObjects);
    remFromList(windmillObjects);
    remFromList(binObjects);
    remFromList(collidableObjects);
}

// selection / highlight functions (mostly unchanged)
// selectBuilding: compute size via bounding box
function selectBuilding(building) {
    if (highlightMesh) {
        scene.remove(highlightMesh);
        highlightMesh = null;
    }

    selectedBuilding = building;

    const box = new THREE.Box3().setFromObject(building);
    const size = new THREE.Vector3();
    box.getSize(size);

    const geo = new THREE.BoxGeometry(size.x * 1.05, size.y * 1.05, size.z * 1.05);
    highlightMesh = new THREE.Mesh(geo, highlightMaterial);
    // place highlight at building's world pos
    const worldPos = new THREE.Vector3();
    building.getWorldPosition(worldPos);
    highlightMesh.position.copy(worldPos);
    highlightMesh.position.y += 0.02; // small offset to avoid z-fighting

    scene.add(highlightMesh);

    console.log("Building selected:", building);
}

function selectTrash(trash) {
    if (trashHighlightMesh) {
        scene.remove(trashHighlightMesh);
        trashHighlightMesh = null;
    }

    selectedTrash = trash;

    const box = new THREE.Box3().setFromObject(trash);
    const size = new THREE.Vector3();
    box.getSize(size);

    const sx = size.x > 0 ? size.x * 1.15 : 1.05;
    const sy = size.y > 0 ? size.y * 1.15 : 1.05;
    const sz = size.z > 0 ? size.z * 1.15 : 1.05;

    const geo = new THREE.BoxGeometry(sx, sy, sz);
    trashHighlightMesh = new THREE.Mesh(geo, trashHighlightMaterial);

    const worldPos = new THREE.Vector3();
    trash.getWorldPosition(worldPos);
    trashHighlightMesh.position.copy(worldPos);
    trashHighlightMesh.position.y += 0.02;

    trashHighlightMesh.castShadow = false;
    trashHighlightMesh.receiveShadow = false;
    trashHighlightMesh.renderOrder = 999;

    scene.add(trashHighlightMesh);

    console.log("Trash selected:", trash);
}

function selectFruit(fruit) {
    if (fruitHighlightMesh) {
        scene.remove(fruitHighlightMesh);
        fruitHighlightMesh = null;
    }

    selectedFruit = fruit;

    const box = new THREE.Box3().setFromObject(fruit);
    const size = new THREE.Vector3();
    box.getSize(size);

    const sx = size.x > 0 ? size.x * 1.15 : 1.05;
    const sy = size.y > 0 ? size.y * 1.15 : 1.05;
    const sz = size.z > 0 ? size.z * 1.15 : 1.05;

    const geo = new THREE.BoxGeometry(sx, sy, sz);
    fruitHighlightMesh = new THREE.Mesh(geo, fruitHighlightMaterial);

    const worldPos = new THREE.Vector3();
    fruit.getWorldPosition(worldPos);
    fruitHighlightMesh.position.copy(worldPos);
    fruitHighlightMesh.position.y += 0.02;

    fruitHighlightMesh.castShadow = false;
    fruitHighlightMesh.receiveShadow = false;
    fruitHighlightMesh.renderOrder = 999;

    scene.add(fruitHighlightMesh);

    console.log("Fruit selected:", fruit);
}

// bin handlers following your scoring rules:
// fruit -> trash = +1, fruit -> recycle = -1
// trash -> recycle = +1, trash -> trash = -1
function handleTrashBin() {
    if (selectedFruit) {
        // fruit into trash -> +1
        points += 1;
        removeObject(selectedFruit);
        selectedFruit = null;
    } else if (selectedTrash) {
        // trash into trash -> -1
        points -= 1;
        removeObject(selectedTrash);
        selectedTrash = null;
    }
    updateUI();
}

function handleRecycleBin() {
    if (selectedTrash) {
        // trash into recycle -> +1
        points += 1;
        removeObject(selectedTrash);
        selectedTrash = null;
    } else if (selectedFruit) {
        // fruit into recycle -> -1
        points -= 1;
        removeObject(selectedFruit);
        selectedFruit = null;
    }
    updateUI();
}

function activateWindmill(wm) {
    const endTime = performance.now() + 10000;
    windmillTimers.set(wm, endTime);
    windmillPointTimers.set(wm, performance.now());
    updateUI();
}

function endGame() {
    // prevent further input/updates
    inputEnabled = false;
    gameRunning = false;

    // disable camera controls so user can't keep rotating
    try { controls.enabled = false; } catch (e) {}
    try { CameraController && CameraController.enabled && (CameraController.enabled = false); } catch (e) {}

    // Stop windmill timers so they stop awarding points (optional)
    windmillTimers.clear();
    windmillPointTimers.clear();

    // show overlay
    const won = points >= targetPoints;
    showEndScreen(won);
}

function showEndScreen(won) {
    // make overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.zIndex = '2000';

    const box = document.createElement('div');
    box.style.background = 'white';
    box.style.padding = '30px 40px';
    box.style.borderRadius = '12px';
    box.style.textAlign = 'center';
    box.style.fontFamily = 'Arial, sans-serif';
    box.style.boxShadow = '0 6px 30px rgba(0,0,0,0.4)';

    const title = document.createElement('h1');
    title.textContent = won ? '🎉 You Win!' : '😞 You Lose';
    title.style.margin = '0 0 10px';
    title.style.fontSize = '36px';

    const score = document.createElement('p');
    score.textContent = `Points: ${points} / ${targetPoints}`;
    score.style.margin = '8px 0 18px';
    score.style.fontSize = '18px';

    const restartBtn = document.createElement('button');
    restartBtn.textContent = 'Restart';
    restartBtn.style.marginRight = '12px';
    restartBtn.style.padding = '8px 12px';
    restartBtn.style.fontSize = '16px';
    restartBtn.style.cursor = 'pointer';
    restartBtn.onclick = () => {
        // reload simplifies resetting everything
        window.location.reload();
    };

    // Optional: a "Close overlay" button that just re-enables controls (not used now)
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.padding = '8px 12px';
    closeBtn.style.fontSize = '16px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = () => {
        // close overlay but keep game ended — re-enable camera to look at the city
        document.body.removeChild(overlay);
        try { controls.enabled = true; } catch (e) {}
    };

    box.appendChild(title);
    box.appendChild(score);
    box.appendChild(restartBtn);
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}


// unified click handler — single raycast & route by type
window.addEventListener("pointerdown", (event) => {
    // allow trashcan internal click handler to run (some implementations rely on direct events)
    if (!inputEnabled) return;
    if (typeof handleClick === 'function') {
        try { handleClick(event, camera); } catch (e) { /* ignore */ }
    }

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactiveObjects, true);

    if (hits.length === 0) {
        // clear highlights and selections
        if (highlightMesh) {
            scene.remove(highlightMesh);
            highlightMesh = null;
        }
        if (trashHighlightMesh) {
            scene.remove(trashHighlightMesh);
            trashHighlightMesh = null;
            selectedTrash = null;
        }
        if (fruitHighlightMesh) {
            scene.remove(fruitHighlightMesh);
            fruitHighlightMesh = null;
            selectedFruit = null;
        }
        return;
    }

    // pick top-most hit, walk to its root (object might be nested)
    let obj = hits[0].object;
    while (obj.parent && obj.parent.type !== "Scene") obj = obj.parent;

    const type = obj.userData && obj.userData.type;

    // route by type (order matters: trash/fruit before building)
    if (type === "trash") {
        selectTrash(obj);
        return;
    }
    if (type === "fruit") {
        selectFruit(obj);
        return;
    }
    if (type === "recycleBin") {
        handleRecycleBin();
        return;
    }
    if (type === "trashBin") {
        handleTrashBin();
        return;
    }
    if (type === "tree") {
        // grow the tree (we use same growTree logic)
        if (wateringCans <= 0) return;
        growTree(obj);
        wateringCans--;
        points += 2;
        updateUI();
        return;
    }
    if (type === "windmill") {
        activateWindmill(obj);
        return;
    }
    // building detection fallback
    if (buildingObjects.indexOf(obj) !== -1 || (obj.geometry && obj.geometry.type === "BoxGeometry")) {
        selectBuilding(obj);
        return;
    }
});

// remove old separate listeners if any existed earlier in file (we consolidated them).
// (We do NOT re-add onClickTrash/onClickFruit/onClickTreeGrow listeners.)

// tree growth helper (unchanged)
function growTree(tree) {
    const targetScale = tree.scale.x + 0.2;
    const startScale = tree.scale.x;
    const duration = 300;
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

// keyboard solar panel attach (kept but using bounding box earlier)
window.addEventListener("keydown", (e) => {
    if (!inputEnabled) return;
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
    const oldPanel = selectedBuilding.getObjectByName("SolarPanel");
    if (oldPanel) {
        console.log("Building already has a solar panel!");
        return;
    }
    const newPanel = baseSolarPanel.clone(true);
    newPanel.name = "SolarPanel";

    const box = new THREE.Box3().setFromObject(selectedBuilding);
    const size = new THREE.Vector3();
    box.getSize(size);

    const roofHeight = size.y / 2;
    selectedBuilding.add(newPanel);
    newPanel.position.set(0, roofHeight + 0.2, 0);
    newPanel.rotation.x = -Math.PI / 6;

    console.log("Solar panel cloned onto building!");
    solarPanels--;
    points += 4;
    updateUI();
});

function animate() {
    requestAnimationFrame(animate);

    // ONLY update orbit controls while dragging (no more conflict!)
    if (controls.isDragging) controls.update();

    // rotate blades only for windmills that exist
    allBlades.forEach((blades, i) => {
        const windmill = allWindwills[i];
        const endTime = windmillTimers.get(windmill);
        const now = performance.now();

        if (endTime && now < endTime) {
            blades.rotation.z += 0.08;

            const lastPointTime = windmillPointTimers.get(windmill) || now;
            if (now - lastPointTime >= 1000) {
                wind += 1;
                windmillPointTimers.set(windmill, now);
                updateUI();
            }
            const milestone = Math.floor((wind + 1) / 10);
            if (milestone > windMilestone) {
                windMilestone += 1;
                points += 2;
            }
        } else {
            windmillTimers.delete(windmill);
            windmillPointTimers.delete(windmill);
        }
    });

    // animate trashcan flaps
    try { animateFlaps && animateFlaps(); } catch (err) {}

    // custom camera controller (Q/E)
    CameraController.update();

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});