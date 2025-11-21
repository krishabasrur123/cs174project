import * as THREE from 'three';

export function createWindmill() {
const material = new THREE.MeshStandardMaterial({ color: 0xfaf5ef });

const towerGeo = new THREE.CylinderGeometry(0.2, 0.5, 10, 12);
const tower = new THREE.Mesh(towerGeo, material);
tower.position.y = 6;


const hubGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
const hubMat = new THREE.MeshStandardMaterial({ color: 0x749259 });
const hub = new THREE.Mesh(hubGeo, hubMat);
hub.rotation.x = Math.PI / 2;

const towerTopY = tower.position.y + 10 / 2;
const hubDepth = 0.3;
const hubHalfDepth = hubDepth / 2;

hub.position.set(0, towerTopY, 0.2 + hubHalfDepth);


const bladeGroup = new THREE.Group();
bladeGroup.position.copy(hub.position);
bladeGroup.position.z += hubHalfDepth;

const size = 128;
const canvas = document.createElement('canvas');
canvas.width = canvas.height = size;
const ctx = canvas.getContext('2d');
const squareSize = 32;
for (let y = 0; y < size; y += squareSize) {
  for (let x = 0; x < size; x += squareSize) {
    ctx.fillStyle = ((x + y) % (2 * squareSize) === 0) ? '#ffffff' : '#cccccc';
    ctx.fillRect(x, y, squareSize, squareSize);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, squareSize, squareSize);
  }
}
const bladeTexture = new THREE.CanvasTexture(canvas);
bladeTexture.wrapS = bladeTexture.wrapT = THREE.RepeatWrapping;
bladeTexture.repeat.set(1, 4);

const bladeLength = 4;
const bladeGeo = new THREE.BoxGeometry(0.3, bladeLength, 0.1);
bladeGeo.translate(0, bladeLength / 2, 0);
const bladeMat = new THREE.MeshStandardMaterial({
  map: bladeTexture,
  roughness: 0.9
});

for (let i = 0; i < 4; i++) {
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.rotation.z = -Math.PI / 2 + (Math.PI / 2) * i;
  bladeGroup.add(blade);
}

const windmillGroup = new THREE.Group();
windmillGroup.add(tower);
windmillGroup.add(hub);
windmillGroup.add(bladeGroup);

return { windmillGroup, bladeGroup};
}