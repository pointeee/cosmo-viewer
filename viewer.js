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
camera.position.set(0, 0, 5);

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ---------- Controls ----------
const controls = new PointerLockControls(camera, renderer.domElement);
renderer.domElement.addEventListener("click", () => controls.lock());

const keys = {};
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup",   e => keys[e.code] = false);

// ---------- Particle container ----------
let points = null;

// ---------- Load local particle file ----------
document.getElementById("fileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const buf = ev.target.result;
    const positions = new Float32Array(buf);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

const material = new THREE.ShaderMaterial({
  transparent: false,
  depthWrite: true,
  uniforms: {},
  vertexShader: `
    void main() {
      gl_PointSize = 0.1;
      gl_Position = projectionMatrix *
                    modelViewMatrix *
                    vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    void main() {
      vec2 c = gl_PointCoord - vec2(0.5);
      if (dot(c, c) > 0.25) discard;
      gl_FragColor = vec4(1.0);
    }
  `
});


    if (points) scene.remove(points);
    points = new THREE.Points(geometry, material);
    scene.add(points);

    console.log(`Loaded ${positions.length / 3} particles`);
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

}

animate();

// ---------- Resize ----------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
