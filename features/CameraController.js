import * as THREE from 'three';

export function createCameraController(camera, scene, obstacles = []) {
const state = {
obstacles: obstacles,
moveSpeed: 0.15,
rotationSpeed: 0.15,
playerHeight : 1.6,
playerRadius: 0.5,
yaw: 0,
isFirstPerson: false,
keys: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false

}

};

const raycaster = new THREE.Raycaster();
raycaster.far = state.playerRadius + 0.5;

function onKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case 'w' : state.keys.forward = true; break;
        case 's' : state.keys.backward = true; break;
        case 'a' : state.keys.left = true; break;
        case 'd' : state.keys.right = true; break;
        case 'q' : state.keys.turnLeft = true; break;
        case 'e' : state.keys.turnRight = true; break;
        case 'v' : toggleView(); break;
    }
}


function onKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case 'w' : state.keys.forward = false; break;
        case 's' : state.keys.backward = false; break;
        case 'a' : state.keys.left = false; break;
        case 'd' : state.keys.right = false; break;
        case 'q' : state.keys.turnLeft = false; break;
        case 'e' : state.keys.turnRight = false; break;
   
    }
}

function toggleView() {
    state.isFirstPerson = !state.isFirstPerson;
    if (state.isFirstPerson) {
        setFirstPersonView();
    } else {
        setThirdPersonView();
    }
}

function setFirstPersonView() {
    camera.position.y = state.playerHeight;
}
function setThirdPersonView () {
    camera.position.y = state.playerHeight + 2;
}

function checkCollision(newPosition) {
    const directions = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0.707, 0, 0.707),
        new THREE.Vector3(-0.707, 0, 0.707),
        new THREE.Vector3(0.707, 0, -0.707),
        new THREE.Vector3(-0.707, 0, -0.707)

    ];

    for (let direction of directions) {
        raycaster.set(newPosition, direction);
        const intersects = raycaster.intersectObjects(state.obstacles, true);
        if (intersects.length > 0 && intersects[0].distance < state.playerRadius) {
            return true;
        }
    }
    return false;
}
function update() {
    if (state.keys.turnLeft) {
        state.yaw += state.rotationSpeed;
    }
    if (state.keys.turnRight) {
        state.yaw -= state.rotationSpeed;
    }

    const forward = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
    const right = new THREE.Vector3(Math.cos(state.yaw), 0, -Math.sin(state.yaw));

const movement = new THREE.Vector3();

if (state.keys.forward) {
    movement.add(forward.clone().multiplyScalar(state.moveSpeed));
}
if (state.keys.backward) {
    movement.add(forward.clone().multiplyScalar(-state.moveSpeed));
}
if (state.keys.left) {
    movement.add(right.clone().multiplyScalar(-state.moveSpeed));
}
if (state.keys.right) {
    movement.add(right.clone().multiplyScalar(state.moveSpeed));
}

if (movement.length() > 0) {
    const newPosition = camera.position.clone().add(movement);
    newPosition.y = camera.position.y;

    if (!checkCollision(newPosition)) {
        camera.position.copy(newPosition);
    }
}

const lookAt = camera.position.clone().add(forward);
camera.lookAt(lookAt);

}
 function addObstacle(object) {
state.obstacles.push(object);
 }
 function addObstacles(objects) {
    for (let i = 0; i < objects.length; i++) {
        state.obstacles.push(objects[i]);
    }
 }
 function getPosition() {
    return camera.position.clone();
 }

 window.addEventListener('keydown', onKeyDown);
 window.addEventListener('keyup', onKeyUp);

 setThirdPersonView();
 function destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
 }

 return {
    update, 
    addObstacle,
    addObstacles,
    getPosition,
    toggleView,
    destroy
 };

}
