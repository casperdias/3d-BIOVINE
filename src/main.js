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
// Camera — follow player in 3rd person
// ─────────────────────────────────────────────────────
const CAM_DIST   = 22;
const CAM_HEIGHT = 14;
const CAM_LERP   = 0.08;
let   gameStarted = false;

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
  const targetX = px - Math.sin(player.group.rotation.y) * CAM_DIST;
  const targetZ = pz - Math.cos(player.group.rotation.y) * CAM_DIST;

  camera.position.x += (targetX - camera.position.x) * CAM_LERP;
  camera.position.z += (targetZ - camera.position.z) * CAM_LERP;
  camera.position.y += (CAM_HEIGHT - camera.position.y) * CAM_LERP;
  camera.lookAt(px, 3, pz);
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
      obj.glowMat.color.set(0x555555);
      obj.glowMat.emissive.set(0x222222);
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
  player.update(t, quizOpen || !gameStarted);

  if (gameStarted) checkProximity();

  animateQuestionObjects(questionObjects, t);

  scene.children.forEach(obj => {
    if (obj.userData?.smoke) {
      obj.position.y += 0.01;
      obj.material.opacity = Math.max(0, obj.material.opacity - 0.0003);
      if (obj.material.opacity < 0.05) {
        obj.material.opacity = 0.35;
        obj.position.y -= 12;
      }
    }
  });

  renderer.render(scene, camera);
}

animate();
