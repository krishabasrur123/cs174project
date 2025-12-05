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
let gameTime = 60;
let gameRunning = true;
let targetPoints = 50;
let selectedTrash = null;
let selectedFruit = null;


const trashHighlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.20
});
let trashHighlightMesh = null;

const fruitHighlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.20
});
let fruitHighlightMesh = null;

const highlightMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    wireframe: true
});
let highlightMesh = null;


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
    timerUI.innerHTML = `
        ⏱️ Timer: 00:${gameTime}<br>
    `;
}
updateUI();





const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
const collidableObjects = [];
const CameraController = createCameraController(camera, scene, collidableObjects);


const baseSolarPanel = createSolarPanel();


const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(3, 10, 5);
scene.add(light);

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
scene.add(ambient);

scene.add(sunLight);


const { recycleBin, trashBin, animateFlaps, handleClick } =
createtrashcans(scene, (binType) => {
    console.log("Bin clicked:", binType);
});

scene.add(recycleBin);
scene.add(trashBin);

recycleBin.userData.type = "recycleBin";
trashBin.userData.type = "trashBin";

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
    // const timerEl = document.getElementById("timer");

    const timerInterval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(timerInterval);
            return;
        }

        gameTime--;
        updateUI();
        // timerEl.textContent = "Time: " + gameTime;

        if (gameTime <= 0) {
            gameRunning = false;
            clearInterval(timerInterval);
            endGame();
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

    if (type === "road") {
        
    }

    if (type === "sidewalk") {
        tileMaterial.color = new THREE.Color(0xcccccc);
    }

    const tile = new THREE.Mesh(tileGeom, tileMaterial);

    tile.rotation.x = -Math.PI / 2;
    tile.position.set(x, 0, z);
    tile.receiveShadow = true;

    scene.add(tile);
    groundTiles.push(tile);
}


let trashCanSets=[]
for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
        const x = i * spacing;
        const z = j * spacing;

        let tileType = "grass";
        let hasBuilding = false;

        if (i % 4 === 0 || j % 4 === 0) {
            tileType = "road";
        }

        if (tileType !== "road" && Math.random() < 0.15) {
            hasBuilding = true;
            tileType = "sidewalk";
        }

        createTile(x, z, tileType);

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

        if (tileType === "grass") {
            let hasWindmill = false;
            let hasTree = false;
            let hasTrash = false;
            let hasFruit = false;

            if (Math.random() < 0.1) {
                hasWindmill = true;
                const { windmillGroup, bladeGroup: blades } = createWindmill();
                windmillGroup.position.set(x, -1, z);
                scene.add(windmillGroup);

                windmillGroup.userData.spin = false;
                windmillGroup.userData.blades = blades;

                allWindwills.push(windmillGroup);
                allBlades.push(blades);
                collidableObjects.push(windmillGroup);
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
                scene.add(tree);
                allTrees.push(tree);
                collidableObjects.push(tree);
            }

            if (!hasWindmill && !hasTree && Math.random() < 0.3) {
                hasTrash = true;
                const trash = createTrash();
                trash.position.set(x, 0.75, z);
                scene.add(trash);
                trash.userData.type = "trash";
                collidableObjects.push(trash);
            }

            if (!hasWindmill && !hasTree && !hasTrash && Math.random() < 0.3) {
                hasFruit = true;
                const fruit = createFruit();
                fruit.position.set(x, 0.75, z);
                scene.add(fruit);
                fruit.userData.type = "fruit";
                collidableObjects.push(fruit);
            }
        }
    }
}

window.addEventListener("pointerdown", (event) => {
    trashCanSets.forEach(set => set.handleClick(event, camera));
});


function selectBuilding(building) {
    if (highlightMesh) {
        scene.remove(highlightMesh);
        highlightMesh = null;
    }

    selectedBuilding = building;

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

    fruitHighlightMesh.castShadow = false;
    fruitHighlightMesh.receiveShadow = false;
    fruitHighlightMesh.renderOrder = 999;

    scene.add(fruitHighlightMesh);

    console.log("Fruit selected:", fruit);
}


function addOutline(baseMesh) {
    const outline = baseMesh.clone();
    outline.material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: THREE.BackSide,
    });
    outline.scale.multiplyScalar(1.05);
    baseMesh.add(outline);
    baseMesh.userData.outline = outline;
    outline.visible = false;
}

function setHighlight(obj, value) {
    if (!obj.userData.outline) return;
    obj.userData.outline.visible = value;
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
            const endTime = performance.now() + 10000;
            windmillTimers.set(root, endTime);
            windmillPointTimers.set(root, performance.now());
            updateUI();
            return;
        }

      

        if (obj.geometry && obj.geometry.type === "BoxGeometry") {
            lastBuildingClicked = root;
            selectBuilding(root);
            return;
        }
    }

    if (highlightMesh) {
        scene.remove(highlightMesh);
        highlightMesh = null;
    }
  
});

window.addEventListener("pointerdown", (event) => {
    handleClick(event, camera);
});


function onClickTrash(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length === 0) {
        if (trashHighlightMesh) {
            scene.remove(trashHighlightMesh);
            trashHighlightMesh = null;
        }
        selectedTrash = null;
        return;
    }

    const obj = intersects[0].object;

    if (obj.userData && obj.userData.type === "trash") {
        selectTrash(obj);
        return;
    }

    if (obj.userData && obj.userData.type === "recycleBin" && selectedTrash) {
        scene.remove(selectedTrash);
        try {
            selectedTrash.geometry.dispose();
            if (selectedTrash.material.map) selectedTrash.material.map.dispose();
            selectedTrash.material.dispose();
        } catch (err) { }

        if (trashHighlightMesh) {
            scene.remove(trashHighlightMesh);
            trashHighlightMesh = null;
        }

        selectedTrash = null;
        points += 1;
        updateUI();
        return;
    }

    if (trashHighlightMesh) {
        scene.remove(trashHighlightMesh);
        trashHighlightMesh = null;
    }
    selectedTrash = null;
}


function onClickFruit(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length === 0) {
        if (fruitHighlightMesh) {
            scene.remove(fruitHighlightMesh);
            fruitHighlightMesh = null;
        }
        selectedFruit = null;
        return;
    }

    const obj = intersects[0].object;

    if (obj.userData && obj.userData.type === "fruit") {
        selectFruit(obj);
        return;
    }

    if (obj.userData && obj.userData.type === "trashBin" && selectedFruit) {
        scene.remove(selectedFruit);
        try {
            selectedFruit.geometry.dispose();
            if (selectedFruit.material.map) selectedFruit.material.map.dispose();
            selectedFruit.material.dispose();
        } catch (err) { }

        if (fruitHighlightMesh) {
            scene.remove(fruitHighlightMesh);
            fruitHighlightMesh = null;
        }

        selectedFruit = null;
        points += 1;
        updateUI();
        return;
    }

    if (fruitHighlightMesh) {
        scene.remove(fruitHighlightMesh);
        fruitHighlightMesh = null;
    }
    selectedFruit = null;
}



function onClickTreeGrow(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(allTrees, true);
    if (intersects.length === 0) return;

    if (wateringCans <= 0) {
        console.log("No watering cans left!");
        return;
    }

    const tree = intersects[0].object.parent;

    growTree(tree);

    wateringCans--;
    points += 2;

    updateUI();
}

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

window.addEventListener('mousedown', onClickTrash);
window.addEventListener('mousedown', onClickFruit);

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

    const oldPanel = selectedBuilding.getObjectByName("SolarPanel");
    if (oldPanel) {
        console.log("Building already has a solar panel!");
        return;
    }

    if (!baseSolarPanel) {
        console.warn("Solar panel not found in scene!");
        return;
    }

    if (solarPanels <= 0) {
        console.log("No solar panels left!");
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
    points += 5;
    updateUI();
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
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
        trashCanSets.forEach(set => set.animateFlaps());


    });


    CameraController.update();
    animateFlaps();
   
    renderer.render(scene, camera);
}
animate();



window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});