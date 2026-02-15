import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { PointerLockControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js";

// ---------- Scene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// ---------- Camera ----------
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 0, 1000);

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ---------- Controls ----------
const controls = new PointerLockControls(camera, renderer.domElement);
const dir = new THREE.Vector3(0, 0, -1).normalize();
const yaw   = Math.atan2(dir.x, -dir.z);
const pitch = Math.asin(dir.y);
controls.getObject().rotation.set(pitch, yaw, 0);
renderer.domElement.addEventListener("click", () => controls.lock());

const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup",   e => keys[e.code] = false);

// ---------- Camera Axes Helper ----------
const cameraAxes = new THREE.AxesHelper(2);
controls.getObject().add(cameraAxes);
cameraAxes.position.set(0, 0, -5);
scene.add(camera)

// ---------- Particle container ----------
let points = null;
let positions = null;
let colors = null;


// ---------- UI components ----------
const slider = document.getElementById('sizeSlider');
slider.addEventListener('input', () => {
  material.uniforms.uSize.value = parseFloat(slider.value);
});

const resetPositionBtn = document.getElementById('resetPositionBtn');
resetPositionBtn.addEventListener('click', () => {
  camera.position.set(0, 0, 0);
});

const resetViewBtn = document.getElementById('resetViewBtn');
resetViewBtn.addEventListener('click', () => {
controls.getObject().rotation.set(0, 0, 0);
});

const bgPicker = document.getElementById("bgPicker");
bgPicker.addEventListener("input", () => {
  scene.background = new THREE.Color(bgPicker.value);
});

// ---------- Particle Material ----------
let material = new THREE.ShaderMaterial({
  uniforms: {
    uSize: { value: 0.5 },
    uPixelRatio: { value: window.devicePixelRatio }
  },
  vertexColors: true,
  vertexShader: `
    uniform float uSize;
    uniform float uPixelRatio;
    varying vec3 vColor;

    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // size in screen pixels
      gl_PointSize = uSize * uPixelRatio;
    }
  `,
  fragmentShader: `
    varying vec3 vColor;
    
    void main() {
      vec2 c = gl_PointCoord - vec2(0.5);
      if (dot(c, c) > 0.25) discard;
    
      gl_FragColor = vec4(vColor, 1.0);
}
  `,
  transparent: true
});

// ---------- Load particle file ----------
document.getElementById("fileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const buf = ev.target.result;
    positions = new Float32Array(buf);

    for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
  
    positions[i]     = x;
    positions[i + 1] = z;
    positions[i + 2] = -y;
}


    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    if (points) scene.remove(points);
    points = new THREE.Points(geometry, material);
    scene.add(points);

    console.log(`Loaded ${positions.length / 3} particles`);

  };

  reader.readAsArrayBuffer(file);
});

// ---------- Load color file ----------
document.getElementById("fileColorInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {

    if (!positions) return;

    const buf = ev.target.result;
    const colors = new Float32Array(buf);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    if (colors.length === positions.length) {
    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );
    }

    if (points) scene.remove(points);
    points = new THREE.Points(geometry, material);
    scene.add(points);

    console.log(`Loaded ${positions.length / 3} particles with colors`);

  };

  reader.readAsArrayBuffer(file);
});

// ---------- Animation loop ----------
const speed = 50.0;
const direction = new THREE.Vector3();
let prevTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const time = performance.now();
  const dt = (time - prevTime) / 1000;
  prevTime = time;

  direction.set(0, 0, 0);
  if (keys["KeyW"]) direction.z += 1;
  if (keys["KeyS"]) direction.z -= 1;
  if (keys["KeyA"]) direction.x -= 1;
  if (keys["KeyD"]) direction.x += 1;
  if (keys["Space"]) direction.y += 1;
  if (keys["ShiftLeft"]) direction.y -= 1;

  direction.normalize();
  controls.moveRight(direction.x * speed * dt);
  controls.moveForward(direction.z * speed * dt);
  camera.position.y += direction.y * speed * dt;

  renderer.render(scene, camera);
  cameraAxes.quaternion.copy(camera.quaternion.clone().invert());


}

function setupUI() {

}

animate();

// ---------- Resize ----------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Demo Data ----------
window.addEventListener('DOMContentLoaded', () => {
  loadDemo();
});

async function loadDemo() {
  var res = await fetch("data/DESI_BGS.bin");
  var buf = await res.arrayBuffer();
  positions = new Float32Array(buf);

  var res = await fetch("data/DESI_BGS_false_color.bin");
  var buf = await res.arrayBuffer();
  colors = new Float32Array(buf);

  const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    if (colors.length === positions.length) {
    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );
    }

    if (points) scene.remove(points);
    points = new THREE.Points(geometry, material);
    scene.add(points);

}
