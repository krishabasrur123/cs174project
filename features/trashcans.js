import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/*
------------------------------ HOW TO IMPORT  THIS MODULE IN MAIN>JS ------------------------------

1. IMPORT THE FUNCTION
In your main.js (or whatever file initializes the scene):

    import { createtrashcans } from './createtrashcans.js';

2. CREATE THE BINS + CLICK HANDLER
Inside  scene setup:

    const { recycleBin, trashBin, animateFlaps, handleClick } =
        createtrashcans(scene, (binType) => {
            console.log("Bin clicked:", binType);   // 'r' for recycle, 'c' for compost
        });

3. ADD BINS TO THE SCENE
    scene.add(recycleBin);
    scene.add(trashBin);

4. ADD CLICK LISTENER

    window.addEventListener("pointerdown", (event) => {
        handleClick(event, camera);
    });

5. CALL animateFlaps() IN YOUR ANIMATE LOOP
Inside your animation loop:

    function render() {
        requestAnimationFrame(render);

        animateFlaps();     // <-- make lids move

        renderer.render(scene, camera);
    }
    render();

*/


export function createtrashcans(scene, handleClick) {
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
            sx, 0, 0, 0,
            0, sy, 0, 0,
            0, 0, sz, 0,
            0, 0, 0, 1
        );
    }

    function rotationXMatrix(theta) {
        return new THREE.Matrix4().set(
            1, 0, 0, 0,
            0, Math.cos(theta), -Math.sin(theta), 0,
            0, Math.sin(theta), Math.cos(theta), 0,
            0, 0, 0, 1
        );
    }

    function rotationYMatrix(theta) {
        return new THREE.Matrix4().set(
            Math.cos(theta), 0, Math.sin(theta), 0,
            0, 1, 0, 0, -Math.sin(theta), 0, Math.cos(theta), 0,
            0, 0, 0, 1
        );
    }

    function rotationZMatrix(theta) {
        return new THREE.Matrix4().set(
            Math.cos(theta), -Math.sin(theta), 0, 0,
            Math.sin(theta), Math.cos(theta), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );
    }

    //cube geometry
    const l = 0.5;
    const positions = new Float32Array([
        // Front
        -l, -l, l,
        l, -l, l,
        l, l, l, -l, l, l,

        // Left
        -l, -l, -l, -l, -l, l, -l, l, l, -l, l, -l,

        // Top
        -l, l, l,
        l, l, l,
        l, l, -l, -l, l, -l,

        // Bottom
        -l, -l, l, -l, -l, -l,

        l, -l, -l,
        l, -l, l,

        // Right
        l, -l, l,
        l, -l, -l,
        l, l, -l,
        l, l, l,

        // Back
        -l, -l, -l, -l, l, -l,
        l, l, -l,
        l, -l, -l
    ]);

    const indices = [
        // front
        0, 1, 2,
        0, 2, 3,

        // left
        4, 5, 6,
        4, 6, 7,
        //top

        8, 9, 10,
        8, 10, 11,

        // bottom
        12, 13, 14,
        12, 14, 15,

        // right
        16, 17, 18,
        16, 18, 19,

        // back
        20, 21, 22,
        20, 22, 23
    ];

    const normals = new Float32Array([
        // front
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,

        // left
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,

        // top
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,

        // bottom
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,

        // right
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,
        1, 0, 0,

        // back
        0, 0, -1,
        0, 0, -1,
        0, 0, -1,
        0, 0, -1
    ]);

    const uvs = new Float32Array([
        // Front
        0, 0, 1, 0, 1, 1, 0, 1,

        // Left
        0, 0, 1, 0, 1, 1, 0, 1,

        // Top
        0, 0, 1, 0, 1, 1, 0, 1,

        // Bottom
        0, 0, 1, 0, 1, 1, 0, 1,

        // Right
        0, 0, 1, 0, 1, 1, 0, 1,

        // Back
        0, 0, 1, 0, 1, 1, 0, 1,
    ]);



    class Texture_Bin { //bin texture
        vertexShader() {
            return `
        uniform sampler2D uTexture;
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
        `;
        }

        fragmentShader() {
            return `
        uniform sampler2D uTexture;
        uniform float animation_time;
        varying vec2 vUv;
        varying vec3 vPosition;


        void main() {
            vec4 tex_color = texture2D(uTexture, vUv);
            if (!gl_FrontFacing) {
 gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);  
    } else {
        gl_FragColor = tex_color;                  // normal texture
    }
        }
    `;
        }



    }

    // Full geometry
    const boxGeom = new THREE.BufferGeometry();
    boxGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    boxGeom.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    boxGeom.setIndex(indices);


    boxGeom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));


    boxGeom.attributes.position.needsUpdate = true;


    boxGeom.addGroup(0, 6, 0);
    boxGeom.addGroup(6, 6, 1);
    boxGeom.addGroup(12, 6, 2);
    boxGeom.addGroup(18, 6, 3);
    boxGeom.addGroup(24, 6, 4);
    boxGeom.addGroup(30, 6, 5);


    boxGeom.computeVertexNormals();

    let animation_time = 0.0;


    const textureLoader = new THREE.TextureLoader();


    const recycleTexture = textureLoader.load('features/recyclelogo.png');
    const compostTexture = textureLoader.load('features/compostlogo.png');


    recycleTexture.generateMipmaps = true; // default for power-of-two
    recycleTexture.minFilter = THREE.LinearMipmapLinearFilter;
    recycleTexture.magFilter = THREE.LinearFilter;
    recycleTexture.needsUpdate = true;




    const recycle_mat = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: recycleTexture },
            animation_time: { value: animation_time }

        },
        vertexShader: new Texture_Bin().vertexShader(),
        fragmentShader: new Texture_Bin().fragmentShader(),
        side: THREE.DoubleSide,

    });

    compostTexture.generateMipmaps = true;
    compostTexture.minFilter = THREE.LinearMipmapLinearFilter;
    compostTexture.magFilter = THREE.LinearFilter;
    compostTexture.needsUpdate = true;

    const compost_mat = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: compostTexture },
            animation_time: { value: animation_time }
        },
        vertexShader: new Texture_Bin().vertexShader(),
        fragmentShader: new Texture_Bin().fragmentShader(),
        side: THREE.DoubleSide,
    });





    const recycleMat = new THREE.MeshPhongMaterial({ color: 0x0066ff, shininess: 50, side: THREE.DoubleSide });
    const trashMat = new THREE.MeshPhongMaterial({ color: 0x00aa00, shininess: 50, side: THREE.DoubleSide }); // green
    const mat_top = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });




    const materials = [recycle_mat, recycleMat, mat_top, recycleMat, recycleMat, recycleMat];

    const recycleBin = new THREE.Mesh(boxGeom, materials);


    const trashBin = new THREE.Mesh(boxGeom, [compost_mat, trashMat, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }), trashMat, trashMat, trashMat]);




    //cube transorm to make the bins using scale

    const scale = scalingMatrix(1.4, 2.5, 1.4);

    const recycleMove = translationMatrix(-2, 1.2, 0);
    const trashMove = translationMatrix(2, 1.2, 0);

    recycleBin.matrixAutoUpdate = false;
    trashBin.matrixAutoUpdate = false;

    recycleBin.matrix.copy(recycleMove).multiply(scale);
    trashBin.matrix.copy(trashMove).multiply(scale);

    //flaps
    const flapMaterialG = new THREE.MeshPhongMaterial({
        shininess: 30,
        side: THREE.DoubleSide,
        color: 0xFF00FF // dark green
    });

    const flapMaterialR = new THREE.MeshPhongMaterial({
        shininess: 30,
        side: THREE.DoubleSide,
        color: 0xFE7D6A // dark blue
    });

    const flapRecycle = new THREE.Mesh(boxGeom, flapMaterialR);
    const flapTrash = new THREE.Mesh(boxGeom, flapMaterialG);

    flapRecycle.matrixAutoUpdate = true;
    flapTrash.matrixAutoUpdate = true;

    recycleBin.add(flapRecycle);
    trashBin.add(flapTrash);




    const flapRecyclePos = translationMatrix(-2, 0, 0);
    const flapTrashPos = translationMatrix(2, 0, 0);

    let flapRecycleMatrix = new THREE.Matrix4()
        .multiply(flapRecyclePos);
    let flapTrashMatrix = new THREE.Matrix4()
        .multiply(flapTrashPos);
    flapRecycle.matrix.copy(flapRecycleMatrix);
    flapTrash.matrix.copy(flapTrashMatrix);


    let recycleFlapAngle = 0;
    let trashFlapAngle = 0;



    function setFlapMatrix(flapMesh, angleDeg, positionX, binHeight = 1) {
        const flapAngle = angleDeg * Math.PI / 180; // convert to radians
        const flapScale = new THREE.Matrix4().set(
            1.0, 0, 0, 0,
            0, .05, 0, 0,
            0, 0, 1.0, 0,
            0, 0, 0, 1
        );

        const hingeOffset = translationMatrix(0, -flapScale.elements[5] / 2, -flapScale.elements[10] / 2);

        const flapRotation = rotationXMatrix(-flapAngle);

        const hingeInverse = translationMatrix(0, flapScale.elements[5] / 2, flapScale.elements[10] / 2);

        const moveToTop = translationMatrix(0, .525, 0);

        const flapMatrix = new THREE.Matrix4()

        .multiply(moveToTop)
            .multiply(hingeOffset)
            // <-- scale first
            .multiply(flapRotation) // <-- rotate after
            .multiply(hingeInverse).multiply(flapScale);

        flapMesh.matrixAutoUpdate = false;
        flapMesh.matrix.copy(flapMatrix);
    }

    //shadow work
    recycleBin.castShadow = true;
    recycleBin.receiveShadow = true;

    trashBin.castShadow = true;
    trashBin.receiveShadow = true;

    let recycleFlapVelocity = 0;
    const FLAP_ACCEL = Math.PI / 8;
    const MAX_FLAP_ANGLE = Math.PI / 6;

    // Trash flap
    let trashFlapVelocity = 0;

    function handleBinClick(event, camera) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([recycleBin, trashBin]);
        if (intersects.length > 0) {
            const clicked = intersects[0].object;
            if (clicked === recycleBin) recycleFlapVelocity += FLAP_ACCEL;
            if (clicked === trashBin) trashFlapVelocity += FLAP_ACCEL;
            if (handleClick) handleClick(clicked === recycleBin ? 'r' : 'c');
        }
    }



    function updateFlaps() {
        const REST_ANGLE = 0;
        const SPRING = 0.02;
        const DAMPING = 0.5;

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





    function animateFlaps() {
        updateFlaps();

    }
    return { recycleBin, trashBin, animateFlaps, handleClick: handleBinClick };


}