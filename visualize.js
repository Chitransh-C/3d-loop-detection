import * as THREE from 'three';
    import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';


let scene, camera, renderer,controls, nodes = [], connections = [];
let group, labels = [];
let nodesByAddress = {};
let addressToNode = {};
let tortoiseMarker, hareMarker;
let tortoiseTrail, hareTrail;
let tortoisePositions = [], harePositions = [];

// Initialize the 3D Scene
function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Create the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 15);

    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
controls = new TrackballControls(camera, renderer.domElement);
controls.rotateSpeed = 2.0;
controls.zoomSpeed = 1.0;
controls.panSpeed = 1.0;

    // Add lights
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040, 40);
    scene.add(ambientLight);

    // Handle window resizing
    window.addEventListener('resize', onWindowResize);

    // Create group for nodes and connections
    group = new THREE.Group();
    scene.add(group);
window.scene = scene;
window.group = group;
tortoiseMarker = createMarker(0x00ff00); // green
hareMarker = createMarker(0xff00ff);     // magenta
tortoiseTrail = createTrailLine(0x00ff00);
hareTrail = createTrailLine(0xff00ff);

    // Render loop
    animate();
}
function createMarker(color) {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color });
    const marker = new THREE.Mesh(geometry, material);
    marker.visible = false;
    group.add(marker);
    return marker;
}
function createTrailLine(color) {
    const material = new THREE.LineBasicMaterial({ color: color });
    const dummyPoint = new THREE.Vector3(0, 0, 0); // Add this dummy point
    const geometry = new THREE.BufferGeometry().setFromPoints([dummyPoint]);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    return line;
}


function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}


// Add Node
function addNode(address) {
    const [x, y, z] = address.split(',').map(Number);

    // Validate input
    if ([x, y, z].some(coord => isNaN(coord) || coord < 1 || coord > 10)) {
        alert("Invalid address! Each coordinate must be between 1 and 10.");
        return;
    }

    // Check if node already exists
    if (address in addressToNode) {
        const existingNode = addressToNode[address];

        // Connect previous node to this existing one if it's a different node
        if (nodes.length > 0 && nodes[nodes.length - 1] !== existingNode) {
            drawConnection(nodes[nodes.length - 1], existingNode);
            nodes[nodes.length - 1].next = existingNode;
        }

        // Do not create a new node
        return;
    }

    // Create the sphere (node)
    const material = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(x, y, z);
    group.add(sphere);

    // Add a label
    const label = createTextLabel(`${x},${y},${z}`);
    label.position.set(x, y + 0.6, z);
    group.add(label);
    labels.push(label);

    // Create new node object
    const newNode = { x, y, z, address, next: null };
    nodes.push(newNode);
    nodesByAddress[address] = newNode;
    addressToNode[address] = newNode;
document.getElementById("nodeAddress").value="";
    // Connect to the previous node
    if (nodes.length > 1) {
        const lastNode = nodes[nodes.length - 2];
        drawConnection(lastNode, newNode);
        lastNode.next = newNode;
    }
}
// Global


// In init():


function drawConnection(node1, node2) {
    const start = new THREE.Vector3(node1.x, node1.y, node1.z);
    const end = new THREE.Vector3(node2.x, node2.y, node2.z);

    const distance = start.distanceTo(end);
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, distance, 8);
    const cylinder = new THREE.Mesh(geometry, material);

    cylinder.position.copy(midPoint);

    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    const axis = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
    cylinder.quaternion.copy(quaternion);

    // Set initial scale to zero height (Y-axis)
    cylinder.scale.set(1, 0, 1);

    group.add(cylinder);

    // Animate the Y-scale using GSAP
    gsap.to(cylinder.scale, {
        y: 1,
        duration: 1.5,
        ease: "power2.out"
    });
}


function createTextLabel(text) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 128;
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = "bold 36px Arial";
    context.fillStyle = "black";
    context.fillText(text, 20, 50);
context.shadowColor = "white";
context.shadowBlur = 4;

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);

    return sprite;
}

// Attach event listeners
document.getElementById("addNodeBtn").addEventListener("click", () => {
    const address = document.getElementById("nodeAddress").value.trim();
    if (!address) {
        alert("Please enter an address!");
        return;
    }
    addNode(address);
});

// Initialize the simulation
init();
document.getElementById("checkLoopBtn").addEventListener("click", () => {
    const head = nodes.length > 0 ? nodes[0] : null;
    if (!head) {
        alert("No nodes to check.");
        return;
    }
    checkLoop(head); // This comes from linkedlist.js
});
//
async function checkLoop() {
    // Initialize trails
    tortoisePositions = [];
    harePositions = [];

    if (nodes.length > 0) {
        const start = new THREE.Vector3(nodes[0].x, nodes[0].y + 0.2, nodes[0].z);
        tortoisePositions.push(start.clone());
        harePositions.push(start.clone());

        tortoiseTrail.geometry.setFromPoints(tortoisePositions);
        hareTrail.geometry.setFromPoints(harePositions);
    }

    if (nodes.length === 0) return;

    let tortoise = nodes[0];
    let hare = nodes[0];

    if (tortoise) {
        showMarker(tortoiseMarker, tortoise);
        tortoisePositions.push(new THREE.Vector3(tortoise.x, tortoise.y + 0.2, tortoise.z));
        tortoiseTrail.geometry.setFromPoints(tortoisePositions);
    }

    if (hare) {
        showMarker(hareMarker, hare);
        harePositions.push(new THREE.Vector3(hare.x, hare.y + 0.2, hare.z));
        hareTrail.geometry.setFromPoints(harePositions);
    }

    while (hare && hare.next) {
        await delay(1000);
        tortoise = tortoise.next;
        hare = hare.next?.next;

        showMarker(tortoiseMarker, tortoise);
        showMarker(hareMarker, hare);

        // ADD THIS: update trail lines inside the loop
        if (tortoise) {
            tortoisePositions.push(new THREE.Vector3(tortoise.x, tortoise.y + 0.2, tortoise.z));
            tortoiseTrail.geometry.setFromPoints(tortoisePositions);
        }

        if (hare) {
            harePositions.push(new THREE.Vector3(hare.x, hare.y + 0.2, hare.z));
            hareTrail.geometry.setFromPoints(harePositions);
        }

        if (tortoise === hare) {
            highlightNode(tortoise);
            alert("Loop detected visually!");
            return;
        }
    }

    alert("No loop detected.");
}

function showMarker(marker, node) {
    if (!node || node.x === undefined) {
        marker.visible = false;
        return;
    }
    marker.position.set(node.x, node.y + 0.6, node.z);
    marker.visible = true;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function highlightNode(node) {
    const highlight = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x00ffff })
    );
    highlight.position.set(node.x, node.y, node.z);
    group.add(highlight);
}

document.getElementById("resetBtn").addEventListener("click", () => {
    resetSimulation();
});
function resetSimulation() {
    // Remove all children from group (nodes, labels, connections)
    while (group.children.length > 0) {
        group.remove(group.children[0]);
    }

    // Remove old trail lines from scene
    if (tortoiseTrail) scene.remove(tortoiseTrail);
    if (hareTrail) scene.remove(hareTrail);

    // Remove old markers from group
    if (tortoiseMarker) group.remove(tortoiseMarker);
    if (hareMarker) group.remove(hareMarker);

    // Reset trail arrays
    tortoisePositions = [];
    harePositions = [];

    // Create new trail lines and markers
    tortoiseTrail = createTrailLine(0x00ff00);
    hareTrail = createTrailLine(0xff00ff);
    tortoiseTrail.geometry.setFromPoints([new THREE.Vector3(0, 0, 0)]);
    hareTrail.geometry.setFromPoints([new THREE.Vector3(0, 0, 0)]);
    tortoiseTrail.visible = false;
    hareTrail.visible = false;

    tortoiseMarker = createMarker(0x00ff00);
    hareMarker = createMarker(0xff00ff);
    tortoiseMarker.visible = false;
    hareMarker.visible = false;

    // Clear internal data
    nodes.length = 0;
    labels.length = 0;
    connections.length = 0;
    Object.keys(nodesByAddress).forEach(k => delete nodesByAddress[k]);
    Object.keys(addressToNode).forEach(k => delete addressToNode[k]);

    alert("Simulation has been reset.");
}
