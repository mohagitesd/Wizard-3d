import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Fog & background
scene.fog = new THREE.Fog(0x88ccee, 10, 70);
scene.background = new THREE.Color(0x88ccee);

// Light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.09);
scene.add(ambientLight);

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

// Floor
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load("/textures/grass.jpg");
const floor = new THREE.PlaneGeometry(100, 100, 32);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x346e31,
  side: THREE.DoubleSide,
  map: texture,
});
const floorMesh = new THREE.Mesh(floor, floorMaterial);
floorMesh.rotation.x = Math.PI / 2;
scene.add(floorMesh);

// Second floor
const texture2 = textureLoader.load("/textures/grass.jpg");
const floor2 = new THREE.PlaneGeometry(100, 100, 32);
const floorMaterial2 = new THREE.MeshStandardMaterial({
  color: 0x346e31,
  side: THREE.DoubleSide,
  map: texture2,
});
const floorMesh2 = new THREE.Mesh(floor2, floorMaterial2);
floorMesh2.rotation.x = Math.PI / 2;
floorMesh2.position.z = 100;
scene.add(floorMesh2);

// Tree system
const treeLoader = new GLTFLoader();
const trees = [];

treeLoader.load("/models/tree.glb", (gltf) => {
  console.log("Tree loaded", gltf);

  for (let i = 0; i < 30; i++) {
    const tree = gltf.scene.clone();
    tree.scale.set(6, 6, 6);
    tree.position.x = (Math.random() - 0.5) * 80;
    tree.position.y = 7.6;
    tree.position.z = Math.random() * 200 - 100;
    trees.push(tree);
    scene.add(tree);
  }
});

// Load wizard
const loader = new GLTFLoader();
let mixer = null;
let walk = null;
let roll = null;
let run = null;

loader.load("/models/animatedWizard.glb", (gltf) => {
  console.log("Wizard loaded", gltf);
  const wizard = gltf.scene;
  scene.add(wizard);

  mixer = new THREE.AnimationMixer(gltf.scene);
  walk = mixer.clipAction(gltf.animations[14]);
  run = mixer.clipAction(gltf.animations[9]);
  roll = mixer.clipAction(gltf.animations[8]);
});

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-9, 1, 3);
scene.add(camera);
// Camera orbit settings
let orbitAngle = 0;
const orbitRadius = 15;
const orbitSpeed = 0.2;

// Controls
const controls = new OrbitControls(camera, canvas);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
renderer.render(scene, camera);

// Events
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

// Animation
const clock = new THREE.Clock();
let previousTime = 0;
let currentSpeed = 0.0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  controls.update();
  if (mixer) {
    mixer.update(deltaTime);
  }

  // Orbit camera around the wizard
  orbitAngle += orbitSpeed * deltaTime;
  camera.position.x = Math.cos(orbitAngle) * orbitRadius;
  camera.position.z = Math.sin(orbitAngle) * orbitRadius;
  camera.lookAt(0, 2, 0);
  // Animate floors
  floorMesh.position.z -= currentSpeed;
  floorMesh2.position.z -= currentSpeed;

  if (floorMesh.position.z < -100) {
    floorMesh.position.z = floorMesh2.position.z + 100;
  }
  if (floorMesh2.position.z < -100) {
    floorMesh2.position.z = floorMesh.position.z + 100;
  }

  // Move trees like floor
  trees.forEach((tree) => {
    tree.position.z -= currentSpeed;
    if (tree.position.z < -100) {
      tree.position.z += 200;
      tree.position.x = (Math.random() - 0.5) * 80;
    }
  });

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();

// Controls for wizard animations
document.addEventListener("keydown", (event) => {
  console.log("key pressed", event.key);
  if (mixer) mixer.stopAllAction();

  switch (event.key) {
    case "w":
      walk?.play();
      currentSpeed = 0.03;
      break;
    case "r":
      run?.play();
      currentSpeed = 0.09;
      break;
    case "t":
      roll?.play();
      currentSpeed = 0.09;
      break;
    default:
      currentSpeed = 0.0;
      break;
  }
});
