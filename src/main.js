import * as THREE from 'three';
import { createScene, buildWorld, createQuestionObjects, animateQuestionObjects } from './world.js';
import { createFactoryScene, buildFactory, createFactoryQuestionObjects, animateFactoryObjects } from './world2.js';
import { createPondScene, buildPond, createValveObject, animateValveObject } from './world3.js';
import { PlayerCharacter } from './player.js';
import { state } from './state.js';
import { setFactoryObstacles, setPondObstacles } from './collision.js';
import {
  buildUIHTML,
  showProfileScreen,
  showInstructions,
  showQuestionPanel,
  showLevel2QuestionPanel,
  initHUD,
  updateHUD,
  setInteractPrompt,
  showLevelComplete,
  showLevel2QuizComplete,
} from './ui.js';
import { showSimulation } from './simulation.js';
import { showStage3 } from './stage3UI.js';

// ─────────────────────────────────────────────────────
// Renderer & Scene Setup
// ─────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Active scene (swapped on level transition)
let activeScene = null;

// ── Level 1: Lab ──
const { scene: labScene }     = createScene();
buildWorld(labScene);

// ── Level 2: Factory (built once, swapped in when needed) ──
const { scene: factoryScene } = createFactoryScene();
buildFactory(factoryScene);

// ── Level 3: Remediation Pond ──
const { scene: pondScene } = createPondScene();
buildPond(pondScene);

activeScene = labScene;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 18, 38);
camera.lookAt(0, 0, 0);

// ─────────────────────────────────────────────────────
// World & Player
// ─────────────────────────────────────────────────────
const player = new PlayerCharacter(labScene);

// Level 1 question objects
let questionObjects    = createQuestionObjects(labScene);
// Level 2 factory station objects (created but held back until Level 2 loads)
let factoryQuestionObjects = null;
// Level 3 valve object
let valveObject = null;

// Which set of question objects is active
let activeQuestionObjects = questionObjects;

// ─────────────────────────────────────────────────────
// Camera — follow player in 3rd person
// ─────────────────────────────────────────────────────
const CAM_DIST_L1 = 22;   // lab  – smaller room
const CAM_DIST_L2 = 26;   // factory – bigger room, pull back a bit
const CAM_DIST_L3 = 24;   // pond – outdoor, medium distance
const CAM_HEIGHT  = 14;
const CAM_LERP    = 0.08;
let   gameStarted = false;

// Camera yaw follows player's facing direction (smooth)
let camYaw     = Math.PI;   // start pointing at world origin
let camYawTarget = Math.PI;
let orbitAngle = 0;

// Room bounds for camera clipping (keeps camera inside walls)
// Updated at level transition
let camBoundsX = 27;   // lab:  LAB_W/2 - margin
let camBoundsZ = 17;   // lab:  LAB_D/2 - margin

function setCamBounds(hx, hz) {
  camBoundsX = hx;
  camBoundsZ = hz;
}

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

  // Smoothly track the camera yaw toward the player's current facing
  const playerYaw = player.group ? player.group.rotation.y : camYaw;
  // Camera sits *behind* the player — opposite of player's facing
  camYawTarget = playerYaw + Math.PI;
  // Smooth interpolation on the angle (handle wrap-around)
  let diff = camYawTarget - camYaw;
  while (diff >  Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  camYaw += diff * 0.04;   // very gentle lag so it doesn't spin wildly

  const camDist = state.currentLevel === 2 ? CAM_DIST_L2
                : state.currentLevel === 3 ? CAM_DIST_L3
                : CAM_DIST_L1;

  // Desired camera position (behind player)
  let desiredX = px + Math.sin(camYaw) * camDist;
  let desiredZ = pz + Math.cos(camYaw) * camDist;

  // ── Clamp so camera never exits the room walls ──────
  desiredX = Math.max(-camBoundsX, Math.min(camBoundsX, desiredX));
  desiredZ = Math.max(-camBoundsZ, Math.min(camBoundsZ, desiredZ));

  // Lerp toward desired position
  camera.position.x += (desiredX - camera.position.x) * CAM_LERP;
  camera.position.z += (desiredZ - camera.position.z) * CAM_LERP;
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

  for (const obj of activeQuestionObjects) {
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
    const label = state.currentLevel === 2
      ? `Tekan <kbd>E</kbd> &nbsp;— 🏭 Stasiun ${closest ? closest.idx + 1 : ''}`
      : state.currentLevel === 3
      ? `Tekan <kbd>E</kbd> &nbsp;— 🚰 Buka Kran Vinasse`
      : `Tekan <kbd>E</kbd> &nbsp;— ❓ Fenomena ${closest ? closest.idx + 1 : ''}`;
    setInteractPrompt(closest ? label : null);
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

  // ── Level 3: valve triggers Stage 3 UI ─────────────────
  if (state.currentLevel === 3 && obj.isValve) {
    showStage3(() => {
      obj.done = true;
      obj.doneSprite.visible = true;
      obj.glowMat.color.set(0x2ecc71);
      obj.glowMat.opacity = 0.3;
      quizOpen   = false;
      nearObject = null;
      state.stage3.valveOpened = true;
      // Level 3 complete — show final level complete screen
      setTimeout(() => showLevelComplete(() => {
        // Future: startLevel4() or game end screen
        updateHUD();
      }), 600);
    });
    return;
  }

  const panelFn = state.currentLevel === 2 ? showLevel2QuestionPanel : showQuestionPanel;

  panelFn(obj.idx,
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

      if (activeQuestionObjects.every(o => o.done)) {
        if (state.currentLevel === 1) {
          setTimeout(() => showLevelComplete(() => startLevel2()), 600);
        } else if (state.currentLevel === 2) {
          setTimeout(() => showLevel2QuizComplete(() => {
            showSimulation(() => {
              // Simulation done — go to Level 3
              setTimeout(() => showLevelComplete(() => startLevel3()), 600);
            });
          }), 600);
        }
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
// Level 2 transition
// ─────────────────────────────────────────────────────
function startLevel2() {
  // Swap scene
  activeScene = factoryScene;

  // Switch collision obstacles to factory layout
  setFactoryObstacles();

  // Expand camera bounds to fit the bigger factory room
  // FAC_W=70, FAC_D=50 → keep camera 5 units inside each wall
  camBoundsX = 30;
  camBoundsZ = 20;

  // Move player to factory spawn
  player.removeFromScene(labScene);
  player.addToScene(factoryScene);
  player.position.set(0, 0, 18);

  // Create factory question objects
  factoryQuestionObjects = createFactoryQuestionObjects(factoryScene);
  activeQuestionObjects  = factoryQuestionObjects;

  nearObject = null;
  updateHUD();
}

// ─────────────────────────────────────────────────────
// Level 3 transition
// ─────────────────────────────────────────────────────
function startLevel3() {
  state.currentLevel = 3;

  // Swap to pond scene
  activeScene = pondScene;

  // Switch collision obstacles
  setPondObstacles();

  // Camera bounds for pond area (POND_W=60, POND_D=50)
  camBoundsX = 26;
  camBoundsZ = 21;

  // Move player to pond spawn
  player.removeFromScene(factoryScene);
  player.addToScene(pondScene);
  player.position.set(0, 0, 16);

  // Create valve interactive object
  valveObject = createValveObject(pondScene);
  activeQuestionObjects = [valveObject];

  nearObject = null;
  updateHUD();
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

  // Animate question objects for current level
  if (state.currentLevel === 1) {
    animateQuestionObjects(questionObjects, t);
  } else if (state.currentLevel === 2 && factoryQuestionObjects) {
    animateFactoryObjects(factoryQuestionObjects, t);
  } else if (state.currentLevel === 3 && valveObject) {
    animateValveObject(valveObject, t);
  }

  renderer.render(activeScene, camera);
}

animate();
