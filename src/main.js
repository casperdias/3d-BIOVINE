import * as THREE from 'three';
import { createScene, buildWorld, createQuestionObjects, animateQuestionObjects } from './world.js';
import { createFactoryScene, buildFactory } from './world2.js';
import { createPondScene, buildPond, createValveObject, animateValveObject } from './world3.js';
import { createWorkshopScene, buildWorkshop, createTerminalObject, animateTerminalObject } from './world4.js';
import { createObsLabScene, buildObsLab, createScopeObject, animateScopeObject } from './world5.js';
import { PlayerCharacter } from './player.js';
import { state } from './state.js';
import { setFactoryObstacles, setPondObstacles, setWorkshopObstacles, setObsLabObstacles } from './collision.js';
import {
  buildUIHTML,
  showProfileScreen,
  showSynopsis,
  showYoutubeVideos,
  showInstructions,
  showIntroVideo,
  startBgMusic,
  initPauseMenu,
  showQuestionPanel,
  initHUD,
  updateHUD,
  setInteractPrompt,
  showLevelComplete,
  showRoomSelect,
  showGameComplete,
} from './ui.js';
import { showSimulation } from './simulation.js';
import { showStage3 } from './stage3UI.js';
import { showStage4 } from './stage4UI.js';
import { showStage5 } from './stage5UI.js';
import { saveCheckpoint, loadCheckpoint } from './db.js';
import { uploadLevelProgress } from './sheets.js';

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

// ── Level 4: IPAL Workshop ──
const { scene: workshopScene } = createWorkshopScene();
buildWorkshop(workshopScene);

// ── Level 5: Observation Lab ──
const { scene: obsLabScene } = createObsLabScene();
buildObsLab(obsLabScene);

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
// Level 3 valve object
let valveObject = null;
// Level 4 terminal object
let terminalObject = null;
// Level 5 scope object
let scopeObject = null;

// Which set of question objects is active
let activeQuestionObjects = questionObjects;

// ─────────────────────────────────────────────────────
// Utility — dispose an interactive object's GPU resources
// and remove it from its scene to prevent memory leaks.
// ─────────────────────────────────────────────────────
function disposeInteractiveObj(obj, scene) {
  if (!obj) return;
  if (obj.glowMesh) {
    scene.remove(obj.glowMesh);
    obj.glowMesh.geometry?.dispose();
  }
  if (obj.glowMat) {
    obj.glowMat.dispose();
  }
  if (obj.doneSprite) {
    scene.remove(obj.doneSprite);
    obj.doneSprite.material?.dispose();
  }
}

// ─────────────────────────────────────────────────────
// Camera — follow player in 3rd person
// ─────────────────────────────────────────────────────
const CAM_DIST_L1 = 22;   // lab  – smaller room
const CAM_DIST_L2 = 26;   // factory – bigger room, pull back a bit
const CAM_DIST_L3 = 24;   // pond – outdoor, medium distance
const CAM_DIST_L4 = 22;   // workshop
const CAM_DIST_L5 = 21;   // observation lab
const CAM_HEIGHT  = 14;
const CAM_LERP    = 0.08;
let   gameStarted = false;

// Zoom-to-object state — set when player interacts with an object
let zoomTarget   = null;   // {x, y, z} world pos of the object
let zoomActive   = false;
let zoomProgress = 0;      // 0..1

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

  // ── Zoom-to-object mode ────────────────────────────────
  if (zoomActive && zoomTarget) {
    zoomProgress = Math.min(1, zoomProgress + 0.04);
    const ease = 1 - Math.pow(1 - zoomProgress, 3);  // cubic ease-out
    // Position camera at a fixed offset in front of the object
    const ox = zoomTarget.x;
    const oz = zoomTarget.z;
    const oy = zoomTarget.y ?? 4;
    // Stand 7 units in front of the object (toward player spawn)
    const zoomCamX = ox + (px - ox) * 0.35;
    const zoomCamZ = oz + (pz - oz) * 0.35;
    const zoomCamY = oy + 6;
    // Normal cam position (where we'd be without zoom)
    const normalDist = state.currentLevel === 2 ? CAM_DIST_L2
                     : state.currentLevel === 3 ? CAM_DIST_L3
                     : state.currentLevel === 4 ? CAM_DIST_L4
                     : state.currentLevel === 5 ? CAM_DIST_L5
                     : CAM_DIST_L1;
    const normalX = px + Math.sin(camYaw) * normalDist;
    const normalZ = pz + Math.cos(camYaw) * normalDist;
    const normalY = CAM_HEIGHT;
    camera.position.x = normalX + (zoomCamX - normalX) * ease;
    camera.position.y = normalY + (zoomCamY - normalY) * ease;
    camera.position.z = normalZ + (zoomCamZ - normalZ) * ease;
    // FOV narrows on zoom
    camera.fov = 60 - 20 * ease;
    camera.updateProjectionMatrix();
    camera.lookAt(ox, oy, oz);
    return;
  }

  // Restore FOV if returning from zoom
  if (Math.abs(camera.fov - 60) > 0.5) {
    camera.fov += (60 - camera.fov) * 0.1;
    camera.updateProjectionMatrix();
  }

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
                : state.currentLevel === 4 ? CAM_DIST_L4
                : state.currentLevel === 5 ? CAM_DIST_L5
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
      : state.currentLevel === 4
      ? `Tekan <kbd>E</kbd> &nbsp;— 💻 IPAL Builder Terminal`
      : state.currentLevel === 5
      ? `Tekan <kbd>E</kbd> &nbsp;— 🔬 Analisis Mikroskop`
      : `Tekan <kbd>E</kbd> &nbsp;— ❓ Fenomena ${closest ? closest.idx + 1 : ''}`;    
    setInteractPrompt(closest ? label : null);
  }
}

window.addEventListener('keydown', e => {
  if (e.code === 'KeyE' && nearObject && !quizOpen && gameStarted) {
    openQuiz(nearObject);
  }
});

// Mobile interact button
document.addEventListener('DOMContentLoaded', () => {
  const mobileBtn = document.getElementById('btn-interact-mobile');
  if (mobileBtn) {
    mobileBtn.addEventListener('touchstart', e => {
      e.preventDefault();
      if (nearObject && !quizOpen && gameStarted) openQuiz(nearObject);
    }, { passive: false });
  }
});

function openQuiz(obj) {
  quizOpen = true;
  setInteractPrompt(null);

  // ── Zoom camera toward the interacted object ──────────
  zoomTarget   = obj.pos ? { x: obj.pos.x, y: 3, z: obj.pos.z } : { x: 0, y: 3, z: 0 };
  zoomActive   = true;
  zoomProgress = 0;

  // Helper — release zoom when a panel closes
  function releaseZoom() {
    zoomActive   = false;
    zoomProgress = 0;
  }

  // ── Level 3: valve triggers Stage 3 UI ─────────────────
  if (state.currentLevel === 3 && obj.isValve) {
    showStage3(() => {
      obj.done = true;
      obj.doneSprite.visible = true;
      obj.glowMat.color.set(0x2ecc71);
      obj.glowMat.opacity = 0.3;
      releaseZoom();
      quizOpen   = false;
      nearObject = null;
      state.stage3.valveOpened = true;
      setTimeout(() => showLevelComplete(() => returnToHub(3)), 600);
    });
    return;
  }

  // ── Level 4: terminal triggers Stage 4 UI ──────────────
  if (state.currentLevel === 4 && obj.isTerminal) {
    showStage4(() => {
      obj.done = true;
      obj.doneSprite.visible = true;
      obj.glowMat.color.set(0x2ecc71);
      obj.glowMat.opacity = 0.3;
      releaseZoom();
      quizOpen   = false;
      nearObject = null;
      state.stage4.terminalDone = true;
      setTimeout(() => showLevelComplete(() => returnToHub(4)), 600);
    });
    return;
  }

  // ── Level 5: microscope triggers Stage 5 UI ─────────────
  if (state.currentLevel === 5 && obj.isScope) {
    showStage5(() => {
      obj.done = true;
      obj.doneSprite.visible = true;
      obj.glowMat.color.set(0x2ecc71);
      obj.glowMat.opacity = 0.3;
      releaseZoom();
      quizOpen   = false;
      nearObject = null;
      state.stage5.scopeDone = true;
      setTimeout(() => showLevelComplete(() => returnToHub(5)), 600);
    });
    return;
  }

  const panelFn = showQuestionPanel;

  panelFn(obj.idx,
    () => {
      // Answered correctly — mark done
      obj.done = true;
      obj.doneSprite.visible = true;
      // Shift glow to calm green
      obj.glowMat.color.set(0x2ecc71);
      obj.glowMat.emissive.set(0x2ecc71);
      obj.glowMat.emissiveIntensity = 0.2;
      releaseZoom();
      quizOpen   = false;
      nearObject = null;

      if (activeQuestionObjects.every(o => o.done)) {
        if (state.currentLevel === 1) {
          setTimeout(() => showLevelComplete(() => returnToHub(1)), 600);
        }
      }
    },
    () => {
      // Dismissed without finishing
      releaseZoom();
      quizOpen   = false;
      nearObject = null;
    }
  );
}

// ─────────────────────────────────────────────────────
// Room Hub — mark room done, save, return to hub or end game
// ─────────────────────────────────────────────────────
function returnToHub(completedLevel) {
  // Mark this room as completed (avoid duplicates)
  if (!state.completedRooms.includes(completedLevel)) {
    state.completedRooms.push(completedLevel);
  }

  // Upload progress to Google Sheets (fire-and-forget)
  uploadLevelProgress(completedLevel);

  // Persist progress
  saveCheckpoint({
    playerName:     state.playerName,
    currentLevel:   completedLevel,
    totalPoints:    state.totalPoints,
    levelBreakdown: state.levelBreakdown,
    completedRooms: state.completedRooms,
  });

  // All 5 rooms done → game complete
  if (state.completedRooms.length >= 5) {
    showGameComplete();
    return;
  }

  // Show hub so player can pick next room
  enterRoomHub();
}

// ─────────────────────────────────────────────────────
// Room Hub entry point
// ─────────────────────────────────────────────────────
function enterRoomHub() {
  // Pause gameplay while hub is shown
  quizOpen   = true;
  nearObject = null;
  setInteractPrompt(null);

  showRoomSelect(lvl => {
    quizOpen = false;
    enterRoom(lvl);
  });
}

// ─────────────────────────────────────────────────────
// Route to the correct level
// ─────────────────────────────────────────────────────
function enterRoom(lvl) {
  state.currentLevel      = lvl;
  state.pointsAtLevelStart = state.totalPoints;

  if      (lvl === 1) startLevel1();
  else if (lvl === 2) startLevel2();
  else if (lvl === 3) startLevel3();
  else if (lvl === 4) startLevel4();
  else if (lvl === 5) startLevel5();
}

// ─────────────────────────────────────────────────────
// Level 1 transition
// ─────────────────────────────────────────────────────
function startLevel1() {
  // Remove player from whatever scene they're in and place in lab
  [labScene, factoryScene, pondScene, workshopScene, obsLabScene].forEach(s => {
    try { player.removeFromScene(s); } catch (_) {}
  });
  player.addToScene(labScene);
  player.position.set(0, 0, 12);

  activeScene = labScene;
  // Reset lab question objects so already-answered ones can be redone
  questionObjects = createQuestionObjects(labScene);
  activeQuestionObjects = questionObjects;

  setCamBounds(27, 17);
  nearObject = null;
  updateHUD();
}

// ─────────────────────────────────────────────────────
// Level 2 transition
// ─────────────────────────────────────────────────────
function startLevel2() {
  // Swap scene
  activeScene = factoryScene;
  setFactoryObstacles();
  camBoundsX = 30;
  camBoundsZ = 20;

  [labScene, pondScene, workshopScene, obsLabScene].forEach(s => {
    try { player.removeFromScene(s); } catch (_) {}
  });
  player.addToScene(factoryScene);
  player.position.set(0, 0, 18);

  // No factory tour — jump straight to simulation
  activeQuestionObjects = [];
  nearObject = null;
  updateHUD();
  setTimeout(() => showSimulation(() => {
    setTimeout(() => showLevelComplete(() => returnToHub(2)), 600);
  }), 400);
}

// ─────────────────────────────────────────────────────
// Level 3 transition
// ─────────────────────────────────────────────────────
function startLevel3() {
  activeScene = pondScene;
  setPondObstacles();
  camBoundsX = 26;
  camBoundsZ = 21;

  [labScene, factoryScene, workshopScene, obsLabScene].forEach(s => {
    try { player.removeFromScene(s); } catch (_) {}
  });
  player.addToScene(pondScene);
  player.position.set(0, 0, 16);

  disposeInteractiveObj(valveObject, pondScene);
  valveObject = createValveObject(pondScene);
  activeQuestionObjects = [valveObject];

  nearObject = null;
  updateHUD();
}

// ─────────────────────────────────────────────────────
// Level 4 transition
// ─────────────────────────────────────────────────────
function startLevel4() {
  activeScene = workshopScene;
  setWorkshopObstacles();
  camBoundsX = 24;
  camBoundsZ = 18;

  [labScene, factoryScene, pondScene, obsLabScene].forEach(s => {
    try { player.removeFromScene(s); } catch (_) {}
  });
  player.addToScene(workshopScene);
  player.position.set(0, 0, 14);

  disposeInteractiveObj(terminalObject, workshopScene);
  terminalObject = createTerminalObject(workshopScene);
  activeQuestionObjects = [terminalObject];

  nearObject = null;
  updateHUD();
}

// ─────────────────────────────────────────────────────
// Level 5 transition
// ─────────────────────────────────────────────────────
function startLevel5() {
  activeScene = obsLabScene;
  setObsLabObstacles();
  camBoundsX = 22;
  camBoundsZ = 16;

  [labScene, factoryScene, pondScene, workshopScene].forEach(s => {
    try { player.removeFromScene(s); } catch (_) {}
  });
  player.addToScene(obsLabScene);
  player.position.set(0, 0, 12);

  disposeInteractiveObj(scopeObject, obsLabScene);
  scopeObject = createScopeObject(obsLabScene);
  activeQuestionObjects = [scopeObject];

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

// Prevent page scroll / zoom on touch devices while playing
canvas.addEventListener('touchstart',  e => e.preventDefault(), { passive: false });
canvas.addEventListener('touchmove',   e => e.preventDefault(), { passive: false });
canvas.addEventListener('touchend',    e => e.preventDefault(), { passive: false });

// ─────────────────────────────────────────────────────
// Build UI & Boot
// ─────────────────────────────────────────────────────
buildUIHTML();

// ─────────────────────────────────────────────────────
// Common boot finalizer — called after name set + HUD ready
// ─────────────────────────────────────────────────────
function bootGame() {
  gameStarted = true;
  document.getElementById('hud').style.display = 'block';
  initHUD();
  updateHUD();
  initPauseMenu(
    () => {
      const cp = loadCheckpoint();
      if (cp) {
        state.completedRooms = cp.completedRooms || [];
        state.totalPoints    = cp.totalPoints;
        state.levelBreakdown = cp.levelBreakdown || [];
        updateHUD();
      }
      enterRoomHub();
    },
    () => { location.reload(); }
  );
  // Drop player into lab scene by default (background scene while hub is shown)
  player.addToScene(labScene);
  player.position.set(0, 0, 12);
  activeScene = labScene;
  activeQuestionObjects = questionObjects;
  // Open hub immediately
  enterRoomHub();
}

// ─────────────────────────────────────────────────────
// Resume from checkpoint
// ─────────────────────────────────────────────────────
function resumeFromCheckpoint(checkpoint) {
  state.playerName      = checkpoint.playerName;
  state.totalPoints     = checkpoint.totalPoints;
  state.levelBreakdown  = checkpoint.levelBreakdown || [];
  state.completedRooms  = checkpoint.completedRooms || [];
  state.pointsAtLevelStart = checkpoint.totalPoints;

  player.setName(state.playerName);
  bootGame();
}

showProfileScreen(
  // New game callback
  name => {
    player.setName(name);
    startBgMusic();
    showSynopsis(() => {
      showYoutubeVideos(() => {
        showIntroVideo(() => {
          showInstructions(() => {
            bootGame();
          });
        });
      });
    });
  },
  // Resume callback
  checkpoint => {
    startBgMusic();
    resumeFromCheckpoint(checkpoint);
  }
);

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
  } else if (state.currentLevel === 3 && valveObject) {
    animateValveObject(valveObject, t);
  } else if (state.currentLevel === 4 && terminalObject) {
    animateTerminalObject(terminalObject, t);
  } else if (state.currentLevel === 5 && scopeObject) {
    animateScopeObject(scopeObject, t);
  }

  renderer.render(activeScene, camera);
}

animate();
