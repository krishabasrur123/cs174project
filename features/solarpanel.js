

import * as THREE from 'three';

export function createSolarPanel() {

    function rotationXMatrix(theta) {
            return new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, Math.cos(theta), -Math.sin(theta), 0,
                0, Math.sin(theta), Math.cos(theta), 0,
                0, 0, 0, 1
            );
        }

    // Solar panel geometry by creatin box and resizing it
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
    solarPanel.name = "SolarPanel";
    const theta = -Math.PI / 6;
solarPanel.matrix.identity();
solarPanel.applyMatrix4(rotationXMatrix(theta));
solarPanel.castShadow = true;     
solarPanel.receiveShadow = true;  

    // DO NOT add to scene
    return solarPanel;
}