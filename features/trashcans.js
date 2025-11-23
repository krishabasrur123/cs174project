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
orbitControls.target.set(0, 3, 0);

// Lights - may need to remove when integrating into buildings.js
const sunPivot = new THREE.Object3D();
scene.add(sunPivot);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(5, 5, 5);  // starting position
sunLight.castShadow = true;

sunPivot.add(sunLight);  // attach light to pivot

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;


//matrices
function translationMatrix(tx, ty, tz) {
    return new THREE.Matrix4().set(
        1, 0, 0, tx,
        0, 1, 0, ty,
        0, 0, 1, tz,
        0, 0, 0, 1
    );
}

function scalingMatrix(sx, sy, sz) {
    return new THREE.Matrix4().set(
        sx, 0,  0,  0,
        0, sy,  0,  0,
        0,  0, sz,  0,
        0,  0,  0,  1
    );
}
function rotationXMatrix(theta) {
    return new THREE.Matrix4().set(
        1,                0,                 0, 0,
        0,  Math.cos(theta), -Math.sin(theta), 0,
        0,  Math.sin(theta),  Math.cos(theta), 0,
        0,                0,                 0, 1
    );
}

function rotationYMatrix(theta) {
    return new THREE.Matrix4().set(
         Math.cos(theta), 0, Math.sin(theta), 0,
         0,               1,                0, 0,
        -Math.sin(theta), 0, Math.cos(theta), 0,
         0,               0,                0, 1
    );
}

function rotationZMatrix(theta) {
    return new THREE.Matrix4().set(
        Math.cos(theta), -Math.sin(theta), 0, 0,
        Math.sin(theta),  Math.cos(theta), 0, 0,
        0,                0,               1, 0,
        0,                0,               0, 1
    );
}

//cube geometry
const l = 0.5;
const positions = new Float32Array([
    // Front
    -l, -l,  l, 
     l, -l,  l, 
      l,  l,  l,  
      -l,  l,  l,

    // Left
    -l, -l, -l,
     -l, -l,  l,
      -l,  l,  l,
       -l,  l, -l,

    // Top (THIS WILL BE REMOVED)
    -l,  l,  l, 
     l,  l,  l, 
      l,  l, -l,
       -l,  l, -l,

    // Bottom
    -l, -l,  l, 
    -l, -l, -l, 
    
    l, -l, -l,  
    l, -l,  l,

    // Right
    l, -l,  l,
     l,
    -l, -l, l, 
      l, -l, l, 
       l,  l,

    // Back
    -l, -l, -l,
     -l,  l, -l, 
     l,  l, -l,
      l, -l, -l
]);

const indices = [
    // front
    0,1,2,
     0,2,3,

    // left
    4,5,6, 
    4,6,7,
    //top

    8,9,10,  
    8,10,11,

    // bottom
    12,13,14, 
    12,14,15,

    // right
    16,17,18, 
    16,18,19,

    // back
    20,21,22, 
    20,22,23
];

const normals = new Float32Array([
    // front
    0,0,1, 
    0,0,1, 
    0,0,1,
     0,0,1,

    // left
    -1,0,0, 
    -1,0,0, 
    -1,0,0, 
    -1,0,0,

    // top
    0,1,0, 
    0,1,0, 
    0,1,0,
     0,1,0,

    // bottom
    0,-1,0,
     0,-1,0,
      0,-1,0, 
      0,-1,0,

    // right
    1,0,0, 
    1,0,0, 
    1,0,0, 
    1,0,0,

    // back
    0,0,-1,
     0,0,-1, 
     0,0,-1, 
     0,0,-1
]);

// Full geometry
const boxGeom = new THREE.BufferGeometry();
boxGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
boxGeom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
boxGeom.setIndex(indices);


const openTopIndices = indices.filter((v, i) => !(i >= 12 && i < 18));
boxGeom.setIndex(openTopIndices);
boxGeom.attributes.position.needsUpdate = true;
boxGeom.computeVertexNormals();

//cube material
const recycleMat = new THREE.MeshPhongMaterial({ color: 0x0066ff, shininess: 50 ,side: THREE.DoubleSide}); // blue
const trashMat   = new THREE.MeshPhongMaterial({ color: 0x00aa00, shininess: 50 ,side: THREE.DoubleSide}); // green

const recycleBin = new THREE.Mesh(boxGeom, recycleMat);
const trashBin   = new THREE.Mesh(boxGeom, trashMat);

scene.add(recycleBin);
scene.add(trashBin);

//cube transorm to make the bins using scale

const scale = scalingMatrix(1.4, 2.5, 1.4); 

const recycleMove = translationMatrix(-2, 1.2, 0);
const trashMove   = translationMatrix( 2, 1.2, 0);

recycleBin.matrixAutoUpdate = false;
trashBin.matrixAutoUpdate = false;

recycleBin.matrix.copy(recycleMove).multiply(scale);
trashBin.matrix.copy(trashMove).multiply(scale);

//flaps
const flapMaterialG = new THREE.MeshPhongMaterial({
    shininess: 80,
    side: THREE.DoubleSide,
    color: 0x00aa00,
});

const flapMaterialR = new THREE.MeshPhongMaterial({
    shininess: 80,
    side: THREE.DoubleSide,
    color: 0x0066ff,
});
const flapRecycle = new THREE.Mesh(boxGeom, flapMaterialR);
const flapTrash   = new THREE.Mesh(boxGeom, flapMaterialG);

flapRecycle.matrixAutoUpdate = false;
flapTrash.matrixAutoUpdate = false;

scene.add(flapRecycle);
scene.add(flapTrash);

const flapScale = scalingMatrix(1.4, 0.15, 1.4);
const flapRecyclePos = translationMatrix(-2, 0, 0);
const flapTrashPos   = translationMatrix( 2, 0, 0);

let flapRecycleMatrix = new THREE.Matrix4()
    .multiply(flapRecyclePos)
    .multiply(flapScale);

let flapTrashMatrix = new THREE.Matrix4()
    .multiply(flapTrashPos)
    .multiply(flapScale);

flapRecycle.matrix.copy(flapRecycleMatrix);
flapTrash.matrix.copy(flapTrashMatrix);


let recycleFlapAngle = 0;      
let trashFlapAngle   = 0;



function setFlapMatrix(flapMesh, angleDeg, positionX, binHeight = 2.5) {
    const flapAngle = angleDeg * Math.PI / 180; // convert to radians
    const flapScale = new THREE.Matrix4().set(
        1.4, 0,   0,   0,
        0,   0.15,0,   0,
        0,   0,   1.4, 0,
        0,   0,   0,   1
    );

    const hingeOffset = translationMatrix(positionX, flapScale.elements[5]/2, flapScale.elements[10]/2);

    const flapRotation = rotationXMatrix(-flapAngle);

    const hingeInverse = translationMatrix(0, -flapScale.elements[5]/2, -flapScale.elements[10]/2);

    const moveToTop = translationMatrix(0, binHeight, 0);

    const flapMatrix = new THREE.Matrix4()
        .multiply(moveToTop)
        .multiply(hingeInverse)
        .multiply(flapRotation)
        .multiply(hingeOffset)
        .multiply(flapScale);

    flapMesh.matrixAutoUpdate = false;
    flapMesh.matrix.copy(flapMatrix);
}



//shadow work
recycleBin.castShadow = true;
recycleBin.receiveShadow = true;

trashBin.castShadow = true;
trashBin.receiveShadow = true;

const groundGeo = new THREE.PlaneGeometry(50, 50);
const groundMat = new THREE.MeshPhongMaterial({ color: 0xdddddd, side: THREE.DoubleSide });

const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;   // make horizontal
ground.position.y = 0;              // under bins
ground.receiveShadow = true;

scene.add(ground);



        
let recycleFlapVelocity = 0;       
const FLAP_ACCEL = Math.PI / 8;    
const MAX_FLAP_ANGLE = Math.PI / 3; 

// Trash flap
let trashFlapVelocity = 0;       

let score = 0;
let currentTrash = null; 

function randomTrash() {
    currentTrash = Math.random() < 0.5 ? "recycle" : "compost";
    document.getElementById("scoreboard").innerText = `Score: ${score} | Current Trash: ${currentTrash}`;
}


randomTrash();


document.addEventListener("keydown", (e) => {
    if (e.key === "r" || e.key === "R") {
        recycleFlapVelocity += FLAP_ACCEL; 

        if (currentTrash === "recycle") {
            score++;
        }
        randomTrash(); 
    }

    if (e.key === "c" || e.key === "C") {
        trashFlapVelocity += FLAP_ACCEL; 

        if (currentTrash === "compost") {
            score++;
        }
        randomTrash();
    }
});



function updateFlaps() {
    const REST_ANGLE = 0; 
    const SPRING = 0.02;  
    const DAMPING = 0.6;

    let accelRecycle = -SPRING * (recycleFlapAngle - REST_ANGLE);
    recycleFlapVelocity += accelRecycle;
    recycleFlapVelocity *= DAMPING;
    recycleFlapAngle += recycleFlapVelocity;

    if (recycleFlapAngle > MAX_FLAP_ANGLE) {
        recycleFlapAngle = MAX_FLAP_ANGLE;
        recycleFlapVelocity = 0;
    }
    if (recycleFlapAngle < 0) {
        recycleFlapAngle = 0;
        recycleFlapVelocity = 0;
    }

    setFlapMatrix(flapRecycle, recycleFlapAngle * 180 / Math.PI, -2);

    // --- Trash flap ---
    let accelTrash = -SPRING * (trashFlapAngle - REST_ANGLE);
    trashFlapVelocity += accelTrash;
    trashFlapVelocity *= DAMPING;
    trashFlapAngle += trashFlapVelocity;

    if (trashFlapAngle > MAX_FLAP_ANGLE) {
        trashFlapAngle = MAX_FLAP_ANGLE;
        trashFlapVelocity = 0;
    }
    if (trashFlapAngle < 0) {
        trashFlapAngle = 0;
        trashFlapVelocity = 0;
    }

    setFlapMatrix(flapTrash, trashFlapAngle * 180 / Math.PI, 2);
}



function animate() {
    requestAnimationFrame(animate);
//sunPivot.rotation.y += 0.002;  
//sunPivot.rotation.x = -0.4;    

    updateFlaps();
    orbitControls.update();
    renderer.render(scene, camera);
}
animate();
