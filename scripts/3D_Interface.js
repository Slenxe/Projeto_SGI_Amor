import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Reference of the canvas element
let myCanvas = document.getElementById('myCanvas');

// Create the 3D space
let renderer = new THREE.WebGLRenderer({ canvas: myCanvas });
    
// Prevent background color from flashing on resize
renderer.setClearColor(0x000000);
renderer.physicallyCorrectLights = true;
let scene = new THREE.Scene();

// Set the scene background color
scene.background = new THREE.Color(0xffeec2);

// Create the 3D model loader
let loader = new GLTFLoader();

// Create the texture loader
const textureLoader = new THREE.TextureLoader();

// Create the 3D scene helpers
let camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
let controls = new OrbitControls(camera, renderer.domElement);

// Set the lightbulb colors
export let defaultColor = new THREE.Color("#ffcc00");
export let turnedOffColor = new THREE.Color("#bfbdbd");
export let blackColor = new THREE.Color("#000000");

// Global Variables for light control
let lightState = 1;
let bulbState = 1;

// Create the scene lights
let ambientLight = new THREE.AmbientLight("lightgreen");
let pointLight = new THREE.PointLight("white");
let directionalLight = new THREE.DirectionalLight("white");

// Set the scene lights properties
pointLight.position.set(0, 2, 2);
pointLight.intensity = 15;
directionalLight.position.set(0, 0, 0);
directionalLight.intensity = 30;

// Add scene light
scene.add(ambientLight);
scene.add(pointLight);
scene.add(directionalLight);

// Dynamic Variables Initialization
let point, spot, lightbulb_sphere, supportJoint, lightbulb_cc, lightbulb_ccInside, abajurInside, cube, shortArm, longArm, armToAbajurJoint, abajurJoint, cubeBoundBox;

// Global Variables for animation control
let mixer, supportJointAction, longArmAction, support, shortArmAction, armToAbajurJointAction, abajurJointAction, abajur, S_LightBulbAction;

// Global Variables for the initial animation time
let supportJointTime = 0.97; 
let longArmTime = 1.2; 
let shortArmTime = 0.4; 
let armToAbajurJointTime = 0.8; 
let abajurJointTime = 1.15; 
let S_LightBulbTime = 2;
let clock = new THREE.Clock();

// 3D model loader
loader.load(
    '/models/RecordPlayer.gltf',
    function (gltf) {
        
        const model = gltf.scene;
        scene.add(model);

        // Get the 3D model animations
        const animations = gltf.animations;
        mixer = new THREE.AnimationMixer(model);
        
        // Get the 3D model objects
        cube = model.getObjectByName('Cube');
        point = model.getObjectByName('Point');
        support = model.getObjectByName('Support');
        spot = model.getObjectByName('Spot');
        supportJoint = model.getObjectByName('SupportJoint');
        longArm = model.getObjectByName('LongArm');
        shortArm = model.getObjectByName('ShortArm');
        armToAbajurJoint = model.getObjectByName('ArmToAbajurJoint');
        abajurJoint = model.getObjectByName('AbajurJoint');
        lightbulb_cc = model.getObjectByName('C_LightBulbMesh');
        lightbulb_ccInside = model.getObjectByName('C_LightBulbMesh_1');
        lightbulb_sphere = model.getObjectByName('S_LightBulb');
        abajurInside = model.getObjectByName('AbajurMesh_1');
        abajur = model.getObjectByName('AbajurMesh');

        //set color grey
        lightbulb_ccInside.material.emissive=turnedOffColor;

        // Check if the objects exist
        const objectArray = [cube, supportJoint, longArm, shortArm, armToAbajurJoint, abajurJoint, point, spot, lightbulb_cc, lightbulb_ccInside, lightbulb_sphere, abajurInside, abajur];
        const errorMessages = [];
        
        objectArray.forEach((item) => {
            if (!item) {
                errorMessages.push(item.name + " object not found!");
            }
        });

        support.position.y = 3;
        support.position.x = 0.6;

        // Default 3D model material (wood)
        let material = new THREE.MeshStandardMaterial({
            map: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_albedo.png', function() {
                console.log('Texture loaded!');
            }),
            metalnessMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_metallic.png', function() {
                console.log('Texture loaded!');
            }),
            normalMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_normal-ogl.png', function() {
                console.log('Texture loaded!');
            }),
            roughnessMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_roughness.png', function() {
                console.log('Texture loaded!');
            }),
            roughness: 2,
        });

        // Checks if the object exists and applies the material
        if (abajur) {
            abajur.material = material;
            abajur.material.needsUpdate = true;
        }

        // Default 3D model material (wood) for the inside of the abajur
        let insideMaterial = new THREE.MeshStandardMaterial({
            map: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_albedo.png', function() {
                console.log('Texture loaded!');
            }),
            metalnessMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_metallic.png', function() {
                console.log('Texture loaded!');
            }),
            normalMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_normal-ogl.png', function() {
                console.log('Texture loaded!');
            }),
            roughnessMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_roughness.png', function() {
                console.log('Texture loaded!');
            }),
            roughness: 0,
        });

        // Same as above, but for the inside of the abajur
        if (abajurInside) {
            abajurInside.material = insideMaterial;
            abajurInside.material.needsUpdate = true;
        }

        // Set the animations for the 3D model
        let supportJointAnim = THREE.AnimationClip.findByName(animations, 'SupportJointAction_1');
        let longArmAnim = THREE.AnimationClip.findByName(animations, 'LongArmAction');
        let shortArmAnim = THREE.AnimationClip.findByName(animations, 'ShortArmAction');
        let armToAbajurJointAnim = THREE.AnimationClip.findByName(animations, 'ArmToAbajurJointAction');
        let abajurJointAnim = THREE.AnimationClip.findByName(animations, 'AbajurJointAction');
/*         let S_LightBulbAnim = THREE.AnimationClip.findByName(animations, 'S_LightBulbAction'); */
        
        // Set the animations on the mixer
        supportJointAction = mixer.clipAction(supportJointAnim);
        longArmAction = mixer.clipAction(longArmAnim);
        shortArmAction = mixer.clipAction(shortArmAnim);
        armToAbajurJointAction = mixer.clipAction(armToAbajurJointAnim);
        abajurJointAction = mixer.clipAction(abajurJointAnim);
/*         S_LightBulbAction = mixer.clipAction(S_LightBulbAnim); */

        // Check if the animations exist
        gltf.animations.forEach((clip) => {
            if (!clip) {
                console.error(clip.name + "not found!");
            }
        });

        // Set the animations to be paused by default
        objectAnimation('btn-anim-1', supportJointAction);
        supportJointAction.play();
        supportJointAction.time = supportJointTime; // It sets the initial position of the animation
        supportJointAction.paused = true;

        objectAnimation('btn-anim-2', longArmAction);
        longArmAction.play();
        longArmAction.time = longArmTime;
        longArmAction.paused = true;

        objectAnimation('btn-anim-3', shortArmAction);
        shortArmAction.play();
        shortArmAction.time = shortArmTime;
        shortArmAction.paused = true;

        objectAnimation('btn-anim-4', armToAbajurJointAction);
        armToAbajurJointAction.play();
        armToAbajurJointAction.time = armToAbajurJointTime;
        armToAbajurJointAction.paused = true;

        objectAnimation('btn-anim-5', abajurJointAction);
        abajurJointAction.play();
        abajurJointAction.time = abajurJointTime;
        abajurJointAction.paused = true;

        document.getElementById('btn-anim-reset').addEventListener('click', () => {
            // Pause all actions
            supportJointAction.paused = true;
            longArmAction.paused = true;
            shortArmAction.paused = true;
            armToAbajurJointAction.paused = true;
            abajurJointAction.paused = true;
        
            // Reset all actions to initial time
            supportJointAction.time = supportJointTime;
            longArmAction.time = longArmTime;
            shortArmAction.time = shortArmTime;
            armToAbajurJointAction.time = armToAbajurJointTime;
            abajurJointAction.time = abajurJointTime;

            btn_reset.style.display = 'none';
        
            // Update the mixer to apply the changes
            mixer.update(0);
        
            // Reset button states and styles
            document.querySelectorAll('[id^="btn-"]').forEach(button => {
                button.dataset.state = "0";
                button.style.backgroundColor = '#D0D0D0';
            });
        });

// Quando acabarmos o que falta, vemos se temos tempo para fazer
/*         objectAnimation('btn-anim-reset', S_LightBulbAction);
        S_LightBulbAction.play();
        S_LightBulbAction.time = 2;
        S_LightBulbAction.paused = true;
        lightbulb_cc.visible = false; */

        // Set the bounding box for the cube
        cubeBoundBox = new THREE.Box3().setFromObject(cube);

        // Set the initial light settings
        lampLightSettings(true);
        togglePower();
        console.log(model);
    },
    undefined,
    function (error) {
        console.error('Loading the GLTF file failed! [ERROR]:', error);
    }


)

// Set the screen's size
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // It prevents canvas blurring for HiDPI device
document.body.style.margin = '0';
document.body.style.body = '0';
document.body.style.display = 'block';
document.body.style.overflow = 'hidden';

// Position the camera accordingly
camera.position.x = 2;
camera.position.y = 3;
camera.position.z = 5;
camera.lookAt(0, 0, 0);

// Set the animation settings
let delta = 0;
let minimum_latency = 1 / 60;

// Animate the objects rotation recursively
function animate() {
    requestAnimationFrame(animate);

    // Clamp the camera position within the bounding box
    clampCameraToBounds();

    // Update the scene
    delta += clock.getDelta();
    if (delta < minimum_latency) return;
    delta = delta % minimum_latency;

    // Update the mixer
    if (mixer) {
        mixer.update(delta);
    }

    // Render the scene
    renderer.render(scene, camera);
}

// Update the default color on the color picker
export function updateDefaultColor(hexColor) {
    defaultColor.set(hexColor);
}

// Global Variables for the object animation
let btn_reset = document.getElementById('btn-anim-reset');
btn_reset.style.display = 'none';

// Standardize the object animation (it can be used for all the buttons to prevent repetition)
function objectAnimation(buttonId, objectAction) {

    // Get the button element
    const button = document.getElementById(buttonId);

    // Check if the button exists
    if (!button) {
        console.error("Button with ID '" + buttonId + "' not found.");
        return;
    }

    // Set the button state
    button.dataset.state = button.dataset.state || "0";

    button.addEventListener('click', () => {
        if (objectAction) {

            // Check the button state
            if (button.dataset.state === "0") {
                objectAction.paused = false;

                btn_reset.style.display = 'block';

                // Set the animation to loop infinitely
                objectAction.setLoop(THREE.LoopPingPong, Infinity);
                
                button.dataset.state = "1";
                button.style.backgroundColor = '#15e38a';
            } else {
                objectAction.paused = true;
                button.dataset.state = "0";
                button.style.backgroundColor = '#D0D0D0';
            }
        }
    })
}
    
/* document.getElementById('btn-anim-1').addEventListener('click', () => {
    if (supportJointAction) {
        console.log(supportJointAction);
        if (buttonState1 === 0) {
            supportJointAction.paused = false;
            supportJointAction.setLoop(THREE.LoopPingPong, Infinity);
            buttonState1 = 1;
        } else {
            supportJointAction.paused = true;
            buttonState1 = 0;
        }
    }
}); */

// Global Variables for the material control
let btn_wood = document.getElementById('btn-wood');
let btn_metal = document.getElementById('btn-metal');
let btn_cortica = document.getElementById('btn-cortica');

btn_wood.addEventListener('click', () => {
    console.log("Wood Button clicked!");

    // Set the material for the abajur
    let material = new THREE.MeshStandardMaterial({
        map: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_albedo.png', function() {
            console.log('Texture loaded!');
        }),
        metalnessMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_metallic.png', function() {
            console.log('Texture loaded!');
        }),
        normalMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_normal-ogl.png', function() {
            console.log('Texture loaded!');
        }),
        roughnessMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_roughness.png', function() {
            console.log('Texture loaded!');
        }),
        roughness: 0,
    });

    if (abajur) {
        abajur.material = material;
        abajur.material.needsUpdate = true;
    }

    // Set the material for the inside of the abajur
    let insideMaterial = new THREE.MeshStandardMaterial({
        map: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_albedo.png', function() {
            console.log('Texture loaded!');
        }),
        metalnessMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_metallic.png', function() {
            console.log('Texture loaded!');
        }),
        normalMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_normal-ogl.png', function() {
            console.log('Texture loaded!');
        }),
        roughnessMap: textureLoader.load('/files/textures/oak-wood/oak-wood-bare_roughness.png', function() {
            console.log('Texture loaded!');
        }),
        roughness: 0,
    });

    if (abajurInside) {
        abajurInside.material = insideMaterial;
        abajurInside.material.needsUpdate = true;
    }
});

btn_metal.addEventListener('click', () => {
    console.log("Metal Button clicked!");

    // Set the material for the abajur
    let material = new THREE.MeshStandardMaterial({
        map: textureLoader.load('/files/textures/metal/metal-studs_albedo.png', function() {
            console.log('Texture loaded!');
        }),
        metalnessMap: textureLoader.load('/files/textures/metal/metal-studs_metallic.png', function() {
            console.log('Texture loaded!');
        }),
        normalMap: textureLoader.load('/files/textures/metal/metal-studs_normal-ogl.png', function() {
            console.log('Texture loaded!');
        }),
        roughnessMap: textureLoader.load('/files/textures/metal/metal-studs_roughness.png', function() {
            console.log('Texture loaded!');
        }),
        roughness: 2,
    });

    if (abajur) {
        abajur.material = material;
        abajur.material.needsUpdate = true;
    }

    // It sets the initial position of the animation
    let insideMaterial = new THREE.MeshStandardMaterial({
        map: textureLoader.load('/files/textures/metal/metal-studs_albedo.png', function() {
            console.log('Texture loaded!');
        }),
        metalnessMap: textureLoader.load('/files/textures/metal/metal-studs_metallic.png', function() {
            console.log('Texture loaded!');
        }),
        normalMap: textureLoader.load('/files/textures/metal/metal-studs_normal-ogl.png', function() {
            console.log('Texture loaded!');
        }),
        roughnessMap: textureLoader.load('/files/textures/metal/metal-studs_roughness.png', function() {
            console.log('Texture loaded!');
        }),
        roughness: 0,
    });

    if (abajurInside) {
        abajurInside.material = insideMaterial;
        abajurInside.material.needsUpdate = true;
    }
});

btn_cortica.addEventListener('click', () => {
    console.log("Cortica Button clicked!");

    // Set the material for the abajur
    let material = new THREE.MeshStandardMaterial({
        map: textureLoader.load('/files/textures/corkboard/corkboard3b-albedo.png', function() {
            console.log('Texture loaded!');
        }),
        metalnessMap: textureLoader.load('/files/textures/corkboard/corkboard3b-metalness.png', function() {
            console.log('Texture loaded!');
        }),
        normalMap: textureLoader.load('/files/textures/corkboard/corkboard3b-normal.png', function() {
            console.log('Texture loaded!');
        }),
        roughnessMap: textureLoader.load('/files/textures/corkboard/corkboard3b-roughnness.png', function() {
            console.log('Texture loaded!');
        }),
        roughness: 0,
    });

    if (abajur) {
        abajur.material = material;
        abajur.material.needsUpdate = true;
    }

    // Set the material for the inside of the abajur
    let insideMaterial = new THREE.MeshStandardMaterial({
        map: textureLoader.load('/files/textures/corkboard/corkboard3b-albedo.png', function() {
            console.log('Texture loaded!');
        }),
        metalnessMap: textureLoader.load('/files/textures/corkboard/corkboard3b-metalness.png', function() {
            console.log('Texture loaded!');
        }),
        normalMap: textureLoader.load('/files/textures/corkboard/corkboard3b-normal.png', function() {
            console.log('Texture loaded!');
        }),
        roughnessMap: textureLoader.load('/files/textures/corkboard/corkboard3b-roughnness.png', function() {
            console.log('Texture loaded!');
        }),
        roughness: 0,
    });

    if (abajurInside) {
        abajurInside.material = insideMaterial;
        abajurInside.material.needsUpdate = true;
    }
});

/* Brightness Slider Functionality */
let brightnessSlider = document.querySelector('.slider');
brightnessSlider.addEventListener('input', () => {
    // If the light is off and/or the lightbulb is not visible, there is not any unexpected emission of light
    if(!powerCheck.checked){
        point.intensity=0;
        spot.intensity=0;
        return;
    }
    if(!lightbulb_cc.visible){
        point.intensity=0;
        spot.intensity=0;
        return;
    }
    

    // Set the brightness value
    const brightness = brightnessSlider.value / 100;

    // Set the point light intensity
    const pointIntensity = brightness * 10;
    point.intensity = pointIntensity;

    // Set the spot light angle
    const angle = Math.PI / 4;

    // Update the spot light intensity
    spot.intensity = calculateSpotIntensity(pointIntensity, angle);
});

/* Power Button Functionality */
let powerCheck = document.querySelector('#power-checkbox');
powerCheck.addEventListener('click', togglePower);

function togglePower() {
    if (!powerCheck.checked) {
        lampLightSettings(false);
        console.log("Power Button not pressed");
        if (lightState === 0) {
            // If the light is off and there is no ambient light, set this colors for the components
            lightbulb_cc.material.emissive = blackColor;
            lightbulb_ccInside.material.emissive = blackColor;
        }
   
    } else if (bulbState === 1) {
        lampLightSettings(true);
        // If the light is off and the lightbulb is visible, set this colors for the components
        lightbulb_ccInside.material.emissive = turnedOffColor;
        console.log("Power Button pressed");
    }
}

function lampLightSettings(isPoweredOn) {
    const brightness = brightnessSlider.value / 100;
    const pointIntensity = isPoweredOn ? brightness * 10 : 0;
    const angle = Math.PI / 4;

    abajurInside.visible = true;

    // Update PointLight properties
    point.intensity = pointIntensity;
    point.distance = 5;
    point.decay = 2;

    // Update SpotLight properties
    spot.intensity = calculateSpotIntensity(pointIntensity, angle);
    spot.distance = 10;
    spot.decay = 2;

    // Update emissive color
    point.color = spot.color = isPoweredOn ? defaultColor : turnedOffColor;
    lightbulb_sphere.children[0].material.emissive = isPoweredOn ? defaultColor : turnedOffColor;

    if (!isPoweredOn) {
        abajurInside.visible = true;
    }
}

// Calculate the spot light intensity in a realistic way using the cone factor
function calculateSpotIntensity(pointIntensity, angle) {

    /* The formula calculates the spotlight intensity by adjusting
       the point intensity based on the geometry of the light cone, 
       accounting for how light is spread over the cone's surface area. */
       
    const coneFactor = 2 /  (1 - Math.cos(angle));
    return pointIntensity * coneFactor;
}

/* Fulscreen Functionality */
let fullscreenButton = document.querySelector('#fullscreen-btn');
fullscreenButton.addEventListener('click', toggleFullscreen);

function toggleFullscreen() {
    console.log("Fulscreen Button clicked!");

    // Check if the document is in fullscreen mode
    if (!document.fullscreenElement) {
        document.body.requestFullscreen();
        document.getElementById('fullscreen-img').src="files/fullscreen-exit.svg";
    } else {
        document.exitFullscreen();
        document.getElementById('fullscreen-img').src="files/fullscreen-enter.svg";
    }
}

function clampCameraToBounds() {
    if (!cubeBoundBox || !point) return;

    // Get the "Support" object position dynamically
    const support = scene.getObjectByName('Support');
    if (support) {
        controls.target.copy(support.position);
    }

    // Get the bounding box min and max values
    const min = cubeBoundBox.min;
    const max = cubeBoundBox.max;

    // Clamp camera position within the bounding box
    camera.position.x = Math.max(min.x, Math.min(max.x, camera.position.x));
    camera.position.y = Math.max(min.y, Math.min(max.y, camera.position.y));
    camera.position.z = Math.max(min.z, Math.min(max.z, camera.position.z));

    // Update controls after clamping
    controls.update();
}

// Resize the renderer when the window is resized
window.addEventListener('resize', () => {
    // Update the renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Update the camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;

    // Update the camera projection matrix
    camera.updateProjectionMatrix(); 
})

// Light State Button Functionality
let lightStateButton = document.querySelector('#light-state-btn');
lightStateButton.addEventListener('click', toggleLightState);

function toggleLightState() {
    if (lightState === 1) {
        document.getElementById('light-state-img').src="files/flare.svg";
        lightState = 0;

        // Remove scene lights
        scene.remove(ambientLight);
        scene.remove(pointLight);
        scene.remove(directionalLight);
        if (powerCheck.checked) {
            // If the ambient light is off and the powercheck(light) is on, set this colors for the components
            lightbulb_ccInside.material.emissive = turnedOffColor;
            if (!lightbulb_cc.visible) {
                // If the ambient light is off, the powercheck(light) is on and the lightbulb is not visible set this colors for the components
                lightbulb_ccInside.material.emissive = blackColor;
            }
        }
        // If the ambient light is off and the powercheck(light) is off, set this colors for the components
        if (!powerCheck.checked){
            lightbulb_cc.material.emissive = blackColor;
            lightbulb_ccInside.material.emissive = blackColor;
        }
        
        
        console.log("Ambient Light has been removed!")
    } else if (lightState===0){
        document.getElementById('light-state-img').src="files/moon.svg";
        lightState = 1;
        
        // Set the scene lights properties
        pointLight.position.set(0, 2, 2);
        pointLight.intensity = 15;
    
        directionalLight.position.set(0, 0, 0);
        directionalLight.intensity = 30;
    
        // Add scene light
        scene.add(ambientLight);
        scene.add(pointLight);
        scene.add(directionalLight);

        if (!powerCheck.checked) {
            lightbulb_cc.material.emissive = turnedOffColor;
            lightbulb_ccInside.material.emissive = turnedOffColor;
        }
        if (powerCheck.checked) {
            lightbulb_ccInside.material.emissive = turnedOffColor;
        }

        console.log("Ambient Light has been added!")
    }
}

// Lightbulb Button Functionality
let lightbulbButton = document.querySelector('#lightbulb-btn');
lightbulbButton.addEventListener('click', lightbulbPresence);

function lightbulbPresence() {
    if (bulbState === 1) {
        bulbState = 0;
        lightbulb_sphere.visible = false;
        lightbulb_cc.visible = false;
        
        lampLightSettings(false);
        document.getElementById('lightbulb-img').src="files/lightbulb_add.svg";
        if (!lightState) {
            lightbulb_ccInside.material.emissive = blackColor;
        }
        console.log("LightBulb has been removed!");
    } else {
        bulbState = 1;
        lightbulb_sphere.visible = true;
        lightbulb_cc.visible = true;
        if (powerCheck.checked) {
            lightbulb_ccInside.material.emissive = turnedOffColor;
        }
        if (powerCheck.checked) {
            lampLightSettings(true);
        }
        document.getElementById('lightbulb-img').src="files/lightbulb_remove.svg";
        console.log("LightBulb has been inserted!");
    }
}
animate();