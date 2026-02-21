import './style.css';
import { GameManager } from './GameManager.js';
import { HUD } from './ui/HUD.js';
import { Menu } from './stages/Menu.js';
import { Stage1 } from './stages/Stage1.js';
import { Stage2 } from './stages/Stage2.js';
import { Stage3 } from './stages/Stage3.js';
import { Stage4 } from './stages/Stage4.js';
import { Evaluation } from './stages/Evaluation.js';
import { Recommendation } from './stages/Recommendation.js';

// DOM elements
const canvas = document.getElementById('game-canvas');
const hudEl = document.getElementById('hud');
const overlayEl = document.getElementById('ui-overlay');

// Game Manager
const gm = new GameManager();

// HUD
const hud = new HUD(hudEl, gm);

// Active stage instance
let activeStage = null;

function showTransition(title, subtitle, cb) {
  const div = document.createElement('div');
  div.className = 'stage-transition';
  div.innerHTML = `<h2>${title}</h2><p>${subtitle}</p>`;
  document.body.appendChild(div);
  setTimeout(() => {
    div.remove();
    if (cb) cb();
  }, 2300);
}

function loadStage(stageName) {
  // Destroy current stage
  if (activeStage) {
    activeStage.destroy();
    activeStage = null;
  }

  const transitions = {
    stage1: ['📍 Tahap 1', 'Mengidentifikasi Masalah'],
    stage2: ['🏭 Tahap 2', 'Mengidentifikasi Akar Masalah'],
    stage3: ['🛒 Tahap 3', 'Menentukan Solusi'],
    stage4: ['🔬 Tahap 4', 'Merancang Prototipe'],
    evaluation: ['📊 Evaluasi', 'Melakukan Evaluasi'],
    recommendation: ['🎉 Rekomendasi', 'Membuat Rekomendasi']
  };

  const trans = transitions[stageName];
  if (!trans) {
    startStage(stageName);
    return;
  }

  showTransition(trans[0], trans[1], () => startStage(stageName));
}

function startStage(stageName) {
  hud.show();

  switch (stageName) {
    case 'stage1':
      activeStage = new Stage1(canvas, overlayEl, hud, gm);
      activeStage.init();
      break;
    case 'stage2':
      activeStage = new Stage2(canvas, overlayEl, hud, gm);
      activeStage.init();
      break;
    case 'stage3':
      activeStage = new Stage3(canvas, overlayEl, hud, gm);
      activeStage.init();
      break;
    case 'stage4':
      activeStage = new Stage4(canvas, overlayEl, hud, gm);
      activeStage.init();
      break;
    case 'evaluation':
      activeStage = new Evaluation(canvas, overlayEl, hud, gm);
      activeStage.init();
      break;
    case 'recommendation':
      activeStage = new Recommendation(canvas, overlayEl, hud, gm);
      activeStage.init();
      break;
    default:
      console.warn('Unknown stage:', stageName);
  }
}

// Listen for stage changes
gm.onStageChange((stageName) => {
  if (stageName === 'menu') {
    if (activeStage) { activeStage.destroy(); activeStage = null; }
    hud.hide();
    const menu = new Menu(overlayEl, gm);
    menu.show();
  } else {
    loadStage(stageName);
  }
});

// Start with menu
hud.hide();
const menu = new Menu(overlayEl, gm);
menu.show();
