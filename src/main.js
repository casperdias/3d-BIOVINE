import * as THREE from 'three';
import { createScene, buildWorld, createQuestionObjects, animateQuestionObjects } from './world.js';
import { PlayerCharacter } from './player.js';
import { state } from './state.js';
import {
  buildUIHTML,
  showProfileScreen,
  showInstructions,
  showQuestionPanel,
  initHUD,
  updateHUD,
  setInteractPrompt,
  showLevelComplete,
} from './ui.js';

// ─────────────────────────────────────────────────────
// Renderer & Scene Setup
// ─────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const { scene } = createScene();

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 18, 38);
camera.lookAt(0, 0, 0);

// ─────────────────────────────────────────────────────
// World & Player
// ─────────────────────────────────────────────────────
buildWorld(scene);
const player = new PlayerCharacter(scene);
const questionObjects = createQuestionObjects(scene);

// ─────────────────────────────────────────────────────
// Camera — follow player in 3rd person (fixed angle)
// ─────────────────────────────────────────────────────
const CAM_DIST   = 22;
const CAM_HEIGHT = 14;
const CAM_LERP   = 0.08;
let   gameStarted = false;

// Fixed camera yaw – player uses camera-relative movement
const CAM_YAW = Math.PI; // camera sits "behind" the world origin at start

let orbitAngle = 0;

function updateCamera(t) {
  if (!gameStarted) {
    orbitAngle += 0.0012;
    camera.position.x = Math.sin(orbitAngle) * 38;
    camera.position.z = Math.cos(orbitAngle) * 38;
    camera.position.y = 18 + Math.sin(t * 0.3) * 1.5;
    camera.lookAt(0, 2, 0);
    return;
  }

  const px = player.position.x;
  const pz = player.position.z;

  // Camera stays at a fixed offset behind the player (world-space, not player-facing)
  const targetX = px + Math.sin(CAM_YAW) * CAM_DIST;
  const targetZ = pz + Math.cos(CAM_YAW) * CAM_DIST;

  camera.position.x += (targetX - camera.position.x) * CAM_LERP;
  camera.position.z += (targetZ - camera.position.z) * CAM_LERP;
  camera.position.y += (CAM_HEIGHT - camera.position.y) * CAM_LERP;
  camera.lookAt(px, 3, pz);
}

// Returns the camera's forward and right vectors (flat, Y=0)
function getCameraAxes() {
  // Camera looks at player; forward = player - camera (flattened)
  const fwd = new THREE.Vector3(
    player.position.x - camera.position.x,
    0,
    player.position.z - camera.position.z
  ).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  return { fwd, right };
}

// ─────────────────────────────────────────────────────
// Proximity & Interaction
// ─────────────────────────────────────────────────────
const INTERACT_RADIUS = 6.5;
let   nearObject      = null;
let   quizOpen        = false;

function checkProximity() {
  if (quizOpen) return;

  let closest    = null;
  let closestDist = Infinity;

  for (const obj of questionObjects) {
    if (obj.done) continue;
    const dx   = player.position.x - obj.pos.x;
    const dz   = player.position.z - obj.pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < INTERACT_RADIUS && dist < closestDist) {
      closestDist = dist;
      closest = obj;
    }
  }

  if (closest !== nearObject) {
    nearObject = closest;
    setInteractPrompt(
      closest
        ? `Tekan <kbd>E</kbd> &nbsp;— ❓ Fenomena ${closest.idx + 1}`
        : null
    );
  }
}

window.addEventListener('keydown', e => {
  if (e.code === 'KeyE' && nearObject && !quizOpen && gameStarted) {
    openQuiz(nearObject);
  }
});

function openQuiz(obj) {
  quizOpen = true;
  setInteractPrompt(null);
  showQuestionPanel(obj.idx,
    () => {
      // Answered correctly — mark done
      obj.done = true;
      obj.doneSprite.visible = true;
      // Shift glow to calm green
      obj.glowMat.color.set(0x2ecc71);
      obj.glowMat.emissive.set(0x2ecc71);
      obj.glowMat.emissiveIntensity = 0.2;
      quizOpen   = false;
      nearObject = null;

      if (questionObjects.every(o => o.done)) {
        setTimeout(() => showLevelComplete(), 600);
      }
    },
    () => {
      // Dismissed without finishing
      quizOpen   = false;
      nearObject = null;
    }
  );
}

// ─────────────────────────────────────────────────────
// Resize
// ─────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ─────────────────────────────────────────────────────
// Build UI & Boot
// ─────────────────────────────────────────────────────
buildUIHTML();

showProfileScreen(name => {
  player.setName(name);
  showInstructions(() => {
    gameStarted = true;
    document.getElementById('hud').style.display = 'block';
    initHUD();
    updateHUD();
  });
});

// ─────────────────────────────────────────────────────
// Render Loop
// ─────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  updateCamera(t);
  player.update(t, quizOpen || !gameStarted, getCameraAxes());

  if (gameStarted) checkProximity();

  animateQuestionObjects(questionObjects, t);

  renderer.render(scene, camera);
}

animate();
