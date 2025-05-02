import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.12.2/index.js';
import { NODES } from './nodes.js';

const canvas = document.getElementById('canvas');
const info = document.getElementById('info');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 4, 8);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const light = new THREE.DirectionalLight(0xffffff, 0.6);
light.position.set(5, 10, 7);
scene.add(light);

// Create linked list node visuals
const nodeMeshes = [];
const nodeGeo = new THREE.SphereGeometry(0.4, 16, 16);
const nodeMat = new THREE.MeshStandardMaterial({ color: 0x8888ff });

NODES.forEach((node, i) => {
  const mesh = new THREE.Mesh(nodeGeo, nodeMat);
  mesh.position.set(0, -i * 1.5, 0);
  scene.add(mesh);
  nodeMeshes.push(mesh);
});

// Arrows
NODES.forEach((node, i) => {
  const from = nodeMeshes[i].position;
  const to = nodeMeshes[node.next].position;
  const lineMat = new THREE.LineBasicMaterial({ color: node.next < i ? 0xff0000 : 0xdddddd });
  const points = [from.clone(), to.clone()];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, lineMat);
  scene.add(line);
});

// Pointers
const tortoise = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0x22aa22 })
);
const hare = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xaa2222 })
);
scene.add(tortoise, hare);
tortoise.position.copy(nodeMeshes[0].position);
hare.position.copy(nodeMeshes[0].position);

let tIdx = 0, hIdx = 0;
let running = true;

function step() {
  if (!running) return;

  tIdx = NODES[tIdx].next;
  hIdx = NODES[NODES[hIdx].next].next;

  gsap.to(tortoise.position, {
    ...nodeMeshes[tIdx].position, duration: 0.8
  });
  gsap.to(hare.position, {
    ...nodeMeshes[hIdx].position, duration: 0.8,
    onComplete: () => {
      info.textContent = `Tortoise: ${tIdx}, Hare: ${hIdx}`;
      if (tIdx === hIdx) {
        info.textContent = `Loop detected at node ${tIdx}`;
        running = false;
        gsap.to([tortoise.scale, hare.scale], {
          x: 1.5, y: 1.5, z: 1.5,
          repeat: 3, yoyo: true
        });
      } else {
        setTimeout(step, 400);
      }
    }
  });
}

setTimeout(step, 1000);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
