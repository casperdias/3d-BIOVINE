import * as THREE from 'three';
import { state, resetLevelState, recordLevelPoints } from './state.js';
import { stage1 } from './stages/stage1.js';
import { stage2 } from './stages/stage2.js';
import { loadCheckpoint, clearCheckpoint, saveScore } from './db.js';

// ─────────────────────────────────────────────────────
// DOM helpers
// ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

let onProfileDone   = null;
let onProfileResume = null;  // set when a checkpoint is found

// ─────────────────────────────────────────────────────
// Profile Screen
// ─────────────────────────────────────────────────────
/**
 * cb(name)      – called when player starts a NEW game
 * resumeCb(cp)  – called when player chooses to RESUME a saved checkpoint
 */
export function showProfileScreen(cb, resumeCb) {
  onProfileDone   = cb;
  onProfileResume = resumeCb || null;

  const checkpoint = loadCheckpoint();

  // Populate (or hide) the checkpoint banner
  const resumeSection = $('resume-section');
  if (checkpoint && resumeSection && onProfileResume) {
    const d = new Date(checkpoint.savedAt);
    const fmt = d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
              + ' ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
    resumeSection.classList.remove('hidden');
    resumeSection.innerHTML = `
      <div class="resume-card">
        <div class="resume-info">
          <span class="resume-avatar">🎮</span>
          <div>
            <strong>${checkpoint.playerName}</strong>
            <div style="font-size:12px;color:#aaa;margin-top:2px">
              Level ${checkpoint.currentLevel} &nbsp;·&nbsp; ${checkpoint.totalPoints} poin &nbsp;·&nbsp; ${fmt}
            </div>
          </div>
        </div>
        <button class="btn-resume" id="btn-resume-game">▶ Lanjutkan</button>
        <button class="btn-new-checkpoint" id="btn-discard-checkpoint" title="Mulai baru">✕</button>
      </div>
    `;
    document.getElementById('btn-resume-game').onclick = () => {
      hideProfileScreen();
      onProfileResume(checkpoint);
    };
    document.getElementById('btn-discard-checkpoint').onclick = () => {
      clearCheckpoint();
      resumeSection.classList.add('hidden');
    };
  } else if (resumeSection) {
    resumeSection.classList.add('hidden');
  }

  $('profile-screen').classList.remove('hidden');
}

function hideProfileScreen() {
  $('profile-screen').classList.add('hidden');
}

// ─────────────────────────────────────────────────────
// Intro Video Screen (shown once after profile is created)
// ─────────────────────────────────────────────────────
let _introAssetRenderer = null;  // keep ref so we can dispose it

// ─────────────────────────────────────────────────────
// Global background music (persists for the whole session)
// ─────────────────────────────────────────────────────
let _bgAudio = null;
export function startBgMusic() {
  if (_bgAudio) return;          // already playing
  _bgAudio = new Audio('/intro-music.mp3');
  _bgAudio.loop   = true;
  _bgAudio.volume = 0.45;
  _bgAudio.play().catch(() => {}); // silently handle autoplay block
}

export function showIntroVideo(cb) {
  // TODO: rewrite intro video scene
  cb();
}


// ─────────────────────────────────────────────────────
// Instructions Screen
// ─────────────────────────────────────────────────────
export function showInstructions(cb) {
  $('instructions-screen').classList.remove('hidden');

  // Fill control hint based on device type
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
                || (navigator.maxTouchPoints > 1);
  const ctrlEl = $('instr-controls-text');
  if (ctrlEl) {
    ctrlEl.innerHTML = isMobile
      ? `Gunakan <strong>joystick virtual</strong> di kiri bawah layar untuk bergerak. Dekati objek bercahaya lalu ketuk tombol <strong>E</strong> di kanan bawah untuk berinteraksi.`
      : `Gunakan <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> atau tombol panah untuk bergerak. Dekati objek bercahaya lalu tekan <kbd>E</kbd> untuk berinteraksi.`;
  }

  // Populate level guide cards
  const levelGuideEl = $('instr-level-guide');
  if (levelGuideEl) {
    const levels = [
      { num:1, icon:'🔬', name:'Lab Sains',            desc:'Amati 3 fenomena pencemaran vinasse di laboratorium dan jawab pertanyaan ilmiah.' },
      { num:2, icon:'🏭', name:'Pabrik Etanol',         desc:'Kunjungi 3 stasiun pabrik, lakukan simulasi pengolahan COD/BOD/pH secara interaktif.' },
      { num:3, icon:'🌿', name:'Kolam Remediasi',       desc:'Pilih mikroorganisme yang tepat di toko, hitung dosis, lalu buka kran vinasse.' },
      { num:4, icon:'🔧', name:'Workshop IPAL',         desc:'Rancang prototype reaktor IPAL: pilih alat & bahan, ikuti prosedur, evaluasi hasilnya.' },
      { num:5, icon:'🔭', name:'Lab Observasi',         desc:'Analisis kegagalan reaktor dari Level 4 dan jawab soal evaluasi mikroskop.' },
      { num:6, icon:'🎤', name:'Aula Presentasi',       desc:'Presentasikan temuanmu dalam 5 slide, lakukan quiz akhir, dan tampilkan produk POC.' },
    ];
    levelGuideEl.innerHTML = levels.map(l => `
      <div class="level-guide-card">
        <span class="lg-icon">${l.icon}</span>
        <div><strong>Level ${l.num} – ${l.name}</strong><div class="lg-desc">${l.desc}</div></div>
      </div>
    `).join('');
  }

  $('btn-start-game').onclick = () => {
    $('instructions-screen').classList.add('hidden');
    cb();
  };
}

// ─────────────────────────────────────────────────────
// HUD
// ─────────────────────────────────────────────────────
export function initHUD() {
  updateHUD();
  $('btn-glossary').onclick = () => toggleGlossary();
}

// ─────────────────────────────────────────────────────
// Pause Menu
// ─────────────────────────────────────────────────────
export function initPauseMenu(onResumeCheckpoint, onNewGame) {
  const overlay = $('pause-menu-overlay');

  $('btn-pause-menu').onclick = () => {
    // Populate checkpoint info
    const cp = loadCheckpoint();
    const infoEl = $('pause-checkpoint-info');
    const resumeBtn = $('btn-pm-resume');
    if (cp) {
      const d = new Date(cp.savedAt);
      const fmt = d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
                + ' ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
      infoEl.innerHTML = `💾 Checkpoint tersimpan: <strong>${cp.playerName}</strong> · Level ${cp.currentLevel} · ${cp.totalPoints} poin<br><small style="color:#aaa">${fmt}</small>`;
      resumeBtn.disabled = false;
      resumeBtn.title = '';
    } else {
      infoEl.innerHTML = `<span style="color:#aaa">Belum ada checkpoint tersimpan.</span>`;
      resumeBtn.disabled = true;
      resumeBtn.title = 'Tidak ada checkpoint tersimpan';
    }
    overlay.classList.remove('hidden');
  };

  $('btn-pm-continue').onclick = () => {
    overlay.classList.add('hidden');
  };

  $('btn-pm-resume').onclick = () => {
    overlay.classList.add('hidden');
    onResumeCheckpoint();
  };

  $('btn-pm-newgame').onclick = () => {
    if (confirm('Yakin ingin memulai ulang? Semua progres sesi ini akan hilang.')) {
      overlay.classList.add('hidden');
      onNewGame();
    }
  };

  // Close on backdrop click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
}

export function updateHUD() {
  $('hud-player').textContent = state.playerName || 'Pemain';
  $('hud-level').textContent  = `Level ${state.currentLevel}`;
  $('hud-points').textContent = state.totalPoints;

  // Attempts dots
  const attemptsEl = $('hud-attempts');
  attemptsEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.className = 'attempt-dot' + (i < state.levelAttempts ? ' used' : '');
    attemptsEl.appendChild(dot);
  }
}

// ─────────────────────────────────────────────────────
// Interact Prompt (floating "Press E" hint)
// ─────────────────────────────────────────────────────
export function setInteractPrompt(html) {
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
                || (navigator.maxTouchPoints > 1);
  let el = $('interact-prompt');
  if (!el) {
    el = document.createElement('div');
    el.id = 'interact-prompt';
    el.style.cssText = `
      position:fixed; bottom:${isMobile ? '200px' : '120px'}; left:50%; transform:translateX(-50%);
      background:rgba(10,20,40,0.88); color:#fff; padding:10px 22px;
      border-radius:24px; font-size:15px; pointer-events:none;
      border:2px solid #00d4ff; box-shadow:0 0 18px #00d4ff88;
      transition:opacity 0.25s; z-index:200; white-space:nowrap;
    `;
    document.body.appendChild(el);
  }
  // On mobile replace keyboard hint with tap hint
  if (isMobile && html) {
    html = html.replace(/Tekan <kbd>E<\/kbd>/g, '👆 Ketuk tombol <b>E</b>');
  }
  if (html) {
    el.innerHTML = html;
    el.style.opacity = '1';
    el.style.display = 'block';
  } else {
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; }, 260);
  }
}

// ─────────────────────────────────────────────────────
// Stage / Quiz Panel
// ─────────────────────────────────────────────────────
export function showStagePanel(onComplete) {
  const screen = $('stage-screen');
  screen.classList.remove('hidden');
  renderPhenomenon(state.phenomenonIndex, onComplete);
}

// Open a single phenomenon by index (used by 3D object interaction)
// Always shows ONLY that one question, then calls onDone — no chaining.
export function showQuestionPanel(phenomenonIdx, onDone, onDismiss) {
  const screen = $('stage-screen');
  screen.classList.remove('hidden');
  screen.style.pointerEvents = 'all';

  state.phenomenonIndex = phenomenonIdx;

  renderPhenomenon(phenomenonIdx, () => {
    screen.classList.add('hidden');
    screen.style.pointerEvents = 'none';
    if (onDone) onDone();
  }, () => {
    screen.classList.add('hidden');
    screen.style.pointerEvents = 'none';
    if (onDismiss) onDismiss();
  }, /* standalone= */ true);
}

// Open a Level 2 (Stage 2) phenomenon by index
export function showLevel2QuestionPanel(phenomenonIdx, onDone, onDismiss) {
  const screen = $('stage-screen');
  screen.classList.remove('hidden');
  screen.style.pointerEvents = 'all';

  state.phenomenonIndex = phenomenonIdx;

  renderLevel2Phenomenon(phenomenonIdx, () => {
    screen.classList.add('hidden');
    screen.style.pointerEvents = 'none';
    if (onDone) onDone();
  }, () => {
    screen.classList.add('hidden');
    screen.style.pointerEvents = 'none';
    if (onDismiss) onDismiss();
  }, /* standalone= */ true);
}

// ─────────────────────────────────────────────────────
// Level Complete banner (all 3 phenomena done)
// ─────────────────────────────────────────────────────
export function showLevelComplete(onAdvance) {
  // Calculate score based on total wrong answers across all phenomena
  const wrong = state.wrongAnswers ?? 0;
  let points = wrong === 0 ? 100 : wrong <= 2 ? 50 : 25;
  state.totalPoints += points;
  state.levelAttempts++;
  updateHUD();
  // Record how many points were earned this level
  recordLevelPoints(state.currentLevel);
  const nextLevelNum = state.currentLevel + 1;
  showLevelResult(points, `Lanjut ke Level ${nextLevelNum} →`, () => {
    state.currentLevel = nextLevelNum;
    state.pointsAtLevelStart = state.totalPoints; // reset baseline for next level
    resetLevelState();
    updateHUD();
    if (onAdvance) onAdvance();
  });
}

// ─────────────────────────────────────────────────────
// Level 2 Complete (after quiz panels — before simulation)
// ─────────────────────────────────────────────────────
export function showLevel2QuizComplete(onAdvance) {
  // no points awarded yet — simulation will award them
  const wrong = state.wrongAnswers ?? 0;
  let points = wrong === 0 ? 100 : wrong <= 2 ? 50 : 25;
  state.totalPoints += points;
  state.levelAttempts++;
  updateHUD();
  showLevelResult(points, '🔬 Mulai Simulasi Pengolahan →', () => {
    if (onAdvance) onAdvance();
  });
}

// ─────────────────────────────────────────────────────
// Game Complete — after Level 6, back to start
// ─────────────────────────────────────────────────────
export function showGameComplete() {
  // ── Persist the final level's points & save to leaderboard ──
  recordLevelPoints(state.currentLevel);
  saveScore({
    playerName:     state.playerName,
    totalPoints:    state.totalPoints,
    levelBreakdown: state.levelBreakdown,
    completedAt:    new Date().toISOString(),
  });
  clearCheckpoint();

  // ── Build per-level breakdown rows ──
  const breakdownRows = state.levelBreakdown.map(entry => `
    <tr>
      <td style="text-align:left;padding:6px 12px;color:#ccc">${entry.label}</td>
      <td style="text-align:right;padding:6px 12px;font-weight:700;color:#ffe040">+${entry.points}</td>
    </tr>
  `).join('');

  const overlay = document.createElement('div');
  overlay.id = 'game-complete-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.88);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    z-index:9999;font-family:system-ui,sans-serif;color:#fff;text-align:center;
    animation:fadeIn .5s ease;overflow-y:auto;padding:20px 0;
  `;
  overlay.innerHTML = `
    <div style="max-width:560px;width:92%;padding:36px 32px;
          background:linear-gradient(135deg,#1a2a1a,#0d1a10);
          border-radius:20px;border:2px solid #2ecc71;box-shadow:0 0 60px rgba(46,204,113,.4)">
      <div style="font-size:64px;margin-bottom:8px">🏆</div>
      <h1 style="font-size:26px;margin:0 0 6px;color:#2ecc71">Selamat, Kamu Menyelesaikan<br>3D BIOVINE!</h1>
      <p style="font-size:14px;color:#aaa;margin:0 0 20px">
        Kamu telah berhasil mengolah limbah vinasse menjadi<br>
        <strong style="color:#ffe040">Pupuk Organik Cair (POC)</strong> yang bermanfaat 🌿
      </p>

      <!-- Per-level breakdown -->
      <div style="background:rgba(0,0,0,.3);border-radius:12px;padding:16px;margin-bottom:20px;text-align:left">
        <div style="font-size:13px;font-weight:700;color:#2ecc71;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">📊 Rincian Poin per Level</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tbody>
            ${breakdownRows}
          </tbody>
          <tfoot>
            <tr style="border-top:1px solid rgba(255,255,255,.15)">
              <td style="text-align:left;padding:8px 12px;font-weight:700;color:#fff">Total</td>
              <td style="text-align:right;padding:8px 12px;font-size:22px;font-weight:700;color:#ffe040">${state.totalPoints}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <button id="btn-gc-restart" style="
          padding:12px 28px;border-radius:10px;border:none;cursor:pointer;font-size:15px;font-weight:600;
          background:linear-gradient(135deg,#2ecc71,#27ae60);color:#fff;
          box-shadow:0 4px 16px rgba(46,204,113,.4)">
          🔄 Main Lagi dari Awal
        </button>
        <button id="btn-gc-close" style="
          padding:12px 28px;border-radius:10px;border:none;cursor:pointer;font-size:15px;font-weight:600;
          background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2)">
          ✕ Tutup
        </button>
      </div>
    </div>
    <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#btn-gc-close').onclick = () => {
    overlay.remove();
    updateHUD();
  };

  overlay.querySelector('#btn-gc-restart').onclick = () => {
    overlay.remove();
    // Full page reload — cleanest way to restart all state
    window.location.reload();
  };
}

function renderPhenomenon(idx, onComplete, onDismiss, standalone = false) {
  const phenom = stage1.phenomena[idx];
  const screen = $('stage-screen');

  // Clear previous panel
  const existing = screen.querySelector('.stage-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.className = 'stage-panel fade-in';

  // Header — in standalone mode hide the progress counter (it's just 1 question)
  panel.innerHTML = `
    <div class="phenomenon-header">
      <span class="phenomenon-badge">${phenom.title}</span>
      ${!standalone ? `<span class="question-progress">${idx + 1} / ${stage1.phenomena.length}</span>` : ''}
      ${onDismiss ? `<button class="panel-close-btn" id="panel-close-btn" title="Tutup">✕</button>` : ''}
    </div>
    ${!standalone ? `
    <div class="progress-bar-wrap">
      ${stage1.phenomena.map((_, i) => `<div class="prog-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}"></div>`).join('')}
    </div>` : ''}
  `;

  // Wire up close button
  if (onDismiss) {
    setTimeout(() => {
      const closeBtn = panel.querySelector('#panel-close-btn');
      if (closeBtn) closeBtn.onclick = onDismiss;
    }, 0);
  }

  // Context
  const ctxDiv = document.createElement('div');
  ctxDiv.className = 'question-text';
  ctxDiv.innerHTML = phenom.context;
  panel.appendChild(ctxDiv);

  // Optional question image
  if (phenom.image) {
    const imgWrap = document.createElement('div');
    imgWrap.style.cssText = 'text-align:center;margin:10px 0';
    const img = document.createElement('img');
    img.src = phenom.image;
    img.alt = phenom.title || 'Gambar soal';
    img.style.cssText = 'max-width:100%;max-height:260px;border-radius:10px;border:2px solid rgba(255,255,255,.15);object-fit:contain';
    imgWrap.appendChild(img);
    panel.appendChild(imgWrap);
  }

  // Data table
  if (phenom.tableData) {
    panel.appendChild(buildDataTable(phenom.tableData));
  }

  // Standard/regulation table
  if (phenom.standardTable) {
    panel.appendChild(buildStandardTable(phenom.standardTable));
  }

  // Rice graph
  if (phenom.riceGraph) {
    panel.appendChild(buildRiceGraph());
  }

  // Question
  const qDiv = document.createElement('div');
  qDiv.className = 'question-text';
  qDiv.style.marginTop = '4px';
  qDiv.style.borderLeftColor = '#e67e22';
  qDiv.innerHTML = `<strong>❓ Pertanyaan:</strong><br>${phenom.question}`;
  panel.appendChild(qDiv);

  // Answer options
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'answer-options';

  // Track whether answered
  let answered = false;
  let correct = false;

  phenom.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.innerHTML = `<strong>${opt.label}.</strong> ${opt.text}`;
    btn.dataset.correct = opt.correct;

    btn.onclick = () => {
      if (answered) return;

      if (opt.correct) {
        answered = true;
        correct = true;
        btn.classList.add('correct');
        showFeedback(panel, true, phenom.explanation);
        nextBtn.classList.add('visible');
        // Disable all
        optionsDiv.querySelectorAll('.answer-btn').forEach(b => (b.disabled = true));
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        state.wrongAnswers++;
        updateHUD();
        showFeedback(panel, false, '❌ Jawaban kurang tepat. Coba pilihan lain!');
      }
    };

    optionsDiv.appendChild(btn);
  });

  panel.appendChild(optionsDiv);

  // Feedback box
  const feedbackDiv = document.createElement('div');
  feedbackDiv.className = 'feedback-box';
  feedbackDiv.id = 'feedback-box';
  panel.appendChild(feedbackDiv);

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'next-btn';
  // In standalone mode: always "Done" — never chain to next phenomenon
  nextBtn.textContent = standalone
    ? '✅ Selesai'
    : (idx < stage1.phenomena.length - 1 ? 'Fenomena Berikutnya →' : '✅ Selesai Level 1');
  nextBtn.onclick = () => {
    if (standalone || idx >= stage1.phenomena.length - 1) {
      screen.classList.add('hidden');
      screen.style.pointerEvents = 'none';
      if (onComplete) onComplete();
    } else {
      state.phenomenonIndex++;
      renderPhenomenon(state.phenomenonIndex, onComplete, onDismiss, false);
    }
  };
  panel.appendChild(nextBtn);

  screen.appendChild(panel);
}

// ─────────────────────────────────────────────────────
// Level 2 phenomenon renderer
// ─────────────────────────────────────────────────────
function renderLevel2Phenomenon(idx, onComplete, onDismiss, standalone = false) {
  const phenom = stage2.phenomena[idx];
  const screen = $('stage-screen');

  const existing = screen.querySelector('.stage-panel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.className = 'stage-panel fade-in';

  panel.innerHTML = `
    <div class="phenomenon-header">
      <span class="phenomenon-badge" style="background:rgba(255,140,30,0.18);border-color:#ff8c1e;color:#ff8c1e">
        ${phenom.title}
      </span>
      ${!standalone ? `<span class="question-progress">${idx + 1} / ${stage2.phenomena.length}</span>` : ''}
      ${onDismiss ? `<button class="panel-close-btn" id="panel-close-btn2" title="Tutup">✕</button>` : ''}
    </div>
    ${!standalone ? `
    <div class="progress-bar-wrap">
      ${stage2.phenomena.map((_, i) => `
        <div class="prog-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}"></div>
      `).join('')}
    </div>` : ''}
  `;

  if (onDismiss) {
    setTimeout(() => {
      const closeBtn = panel.querySelector('#panel-close-btn2');
      if (closeBtn) closeBtn.onclick = onDismiss;
    }, 0);
  }

  // Context
  const ctxDiv = document.createElement('div');
  ctxDiv.className = 'question-text';
  ctxDiv.innerHTML = phenom.context;
  panel.appendChild(ctxDiv);

  // Optional question image
  if (phenom.image) {
    const imgWrap = document.createElement('div');
    imgWrap.style.cssText = 'text-align:center;margin:10px 0';
    const img = document.createElement('img');
    img.src = phenom.image;
    img.alt = phenom.title || 'Gambar soal';
    img.style.cssText = 'max-width:100%;max-height:260px;border-radius:10px;border:2px solid rgba(255,255,255,.15);object-fit:contain';
    imgWrap.appendChild(img);
    panel.appendChild(imgWrap);
  }

  // Question
  const qDiv = document.createElement('div');
  qDiv.className = 'question-text';
  qDiv.style.marginTop = '4px';
  qDiv.style.borderLeftColor = '#e67e22';
  qDiv.innerHTML = `<strong>❓ Pertanyaan:</strong><br>${phenom.question}`;
  panel.appendChild(qDiv);

  // Answer options
  const optionsDiv = document.createElement('div');
  optionsDiv.className = 'answer-options';

  let answered = false;

  phenom.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.innerHTML = `<strong>${opt.label}.</strong> ${opt.text}`;

    btn.onclick = () => {
      if (answered) return;
      if (opt.correct) {
        answered = true;
        btn.classList.add('correct');
        showFeedback(panel, true, phenom.explanation);
        nextBtn.classList.add('visible');
        optionsDiv.querySelectorAll('.answer-btn').forEach(b => (b.disabled = true));
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        state.wrongAnswers++;
        updateHUD();
        showFeedback(panel, false, '❌ Jawaban kurang tepat. Coba pilihan lain!');
      }
    };
    optionsDiv.appendChild(btn);
  });

  panel.appendChild(optionsDiv);

  const feedbackDiv = document.createElement('div');
  feedbackDiv.className = 'feedback-box';
  feedbackDiv.id = 'feedback-box';
  panel.appendChild(feedbackDiv);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'next-btn';
  const isLast = idx >= stage2.phenomena.length - 1;
  nextBtn.textContent = standalone
    ? '✅ Selesai'
    : (isLast ? '🔬 Lanjut ke Simulasi →' : 'Stasiun Berikutnya →');
  nextBtn.onclick = () => {
    if (standalone || isLast) {
      screen.classList.add('hidden');
      screen.style.pointerEvents = 'none';
      if (onComplete) onComplete();
    } else {
      state.phenomenonIndex++;
      renderLevel2Phenomenon(state.phenomenonIndex, onComplete, onDismiss, false);
    }
  };
  panel.appendChild(nextBtn);

  screen.appendChild(panel);
}


function showFeedback(panel, isCorrect, message) {
  const box = panel.querySelector('#feedback-box');
  if (!box) return;
  box.className = 'feedback-box ' + (isCorrect ? 'correct' : 'wrong');
  box.innerHTML = message;
}

// ─────────────────────────────────────────────────────
// Data Table builder
// ─────────────────────────────────────────────────────
function buildDataTable(tableData) {
  const wrap = document.createElement('div');
  wrap.className = 'data-table-wrap';

  let html = '<table class="data-table"><thead><tr>';
  for (const h of tableData.headers) {
    html += `<th>${h}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const row of tableData.rows) {
    html += `<tr><td><strong>${row.label}</strong></td>`;
    row.values.forEach((v, i) => {
      const cls = row.classes[i] ? ` class="${row.classes[i]}"` : '';
      html += `<td${cls}>${v}</td>`;
    });
    html += '</tr>';
  }

  html += '</tbody></table>';
  if (tableData.note) {
    html += `<div class="info-label" style="margin-top:6px">📌 ${tableData.note}</div>`;
  }

  wrap.innerHTML = html;
  return wrap;
}

// ─────────────────────────────────────────────────────
// Standard Table builder
// ─────────────────────────────────────────────────────
function buildStandardTable(std) {
  const wrap = document.createElement('div');
  wrap.className = 'std-table-wrap';

  let html = `<div class="info-label" style="margin-bottom:6px">📋 ${std.title}</div>`;
  html += '<table class="std-table"><thead><tr>';
  for (const h of std.headers) {
    html += `<th>${h}</th>`;
  }
  html += '</tr></thead><tbody>';
  for (const row of std.rows) {
    html += '<tr>' + row.map(c => `<td>${c}</td>`).join('') + '</tr>';
  }
  html += '</tbody></table>';

  wrap.innerHTML = html;
  return wrap;
}

// ─────────────────────────────────────────────────────
// Rice harvest bar chart
// ─────────────────────────────────────────────────────
function buildRiceGraph() {
  const data = [
    { label: 'Tahun 1', value: 62, color: '#3498db' },
    { label: 'Tahun 2', value: 78, color: '#2ecc71' },
    { label: 'Tahun 3', value: 34, color: '#e74c3c' },
  ];
  const maxVal = 100;

  const wrap = document.createElement('div');
  wrap.className = 'rice-graph-wrap';

  let html = `<div class="rice-graph-title">📊 Produktivitas Panen Padi (% baseline)</div>`;
  html += '<div class="bar-chart">';

  for (const d of data) {
    const heightPct = (d.value / maxVal) * 100;
    html += `
      <div class="bar-item">
        <div class="bar-val">${d.value}%</div>
        <div class="bar" style="height:${heightPct}px; background:${d.color};"></div>
        <div class="bar-label">${d.label}</div>
      </div>
    `;
  }
  html += '</div>';
  html += `<div class="info-label" style="margin-top:8px; text-align:center;">
    Tahun 1: Sebelum paparan | Tahun 2: Paparan awal | Tahun 3: Akumulasi kronis
  </div>`;

  wrap.innerHTML = html;
  return wrap;
}

// ─────────────────────────────────────────────────────
// Level Result Popup
// ─────────────────────────────────────────────────────
function showLevelResult(points, btnLabel, onComplete) {
  const overlay = $('result-overlay');
  overlay.classList.remove('hidden');

  const isGood = points >= 75;
  $('result-icon').textContent = isGood ? '🎉' : points >= 50 ? '👍' : '💡';
  $('result-title').textContent = isGood ? 'Luar Biasa!' : points >= 50 ? 'Bagus!' : 'Terus Belajar!';
  $('result-score').textContent = `+${points} poin`;
  $('result-total').textContent = `Total: ${state.totalPoints} poin`;

  const attempt = state.levelAttempts;
  const attemptsText = attempt === 1
    ? '🥇 Berhasil di percobaan pertama!'
    : attempt === 2
    ? '🥈 Berhasil di percobaan ke-2.'
    : '🥉 Berhasil di percobaan ke-3.';
  $('result-attempts').textContent = attemptsText;

  const contBtn = $('btn-result-continue');
  contBtn.textContent = btnLabel || 'Lanjut →';
  contBtn.onclick = () => {
    overlay.classList.add('hidden');
    onComplete();
  };
}

// ─────────────────────────────────────────────────────
// Glossary
// ─────────────────────────────────────────────────────
function toggleGlossary() {
  const modal = $('glossary-modal');
  modal.classList.toggle('hidden');
}

// ─────────────────────────────────────────────────────
// Build all static HTML into the page
// ─────────────────────────────────────────────────────
export function buildUIHTML() {
  const hud = $('hud');
  hud.innerHTML = `
    <div id="hud-bar">
      <div id="hud-left">
        <span id="hud-player">Pemain</span>
        <span id="hud-level">Level 1</span>
      </div>
      <div id="hud-center">
        <div class="progress-bar-wrap" id="level-progress">
          ${[1,2,3,4,5,6].map((l, i) => `<div class="prog-dot ${i === 0 ? 'active' : ''}" title="Level ${l}"></div>`).join('')}
        </div>
      </div>
      <div id="hud-right">
        <span id="hud-points">0</span>
        <div id="hud-attempts"></div>
        <button id="btn-glossary">📖 Buku Saku</button>
        <button id="btn-pause-menu">⚙️ Menu</button>
      </div>
    </div>
  `;
  hud.style.display = 'none';

  const ui = $('ui-overlay');
  ui.innerHTML = `
    <!-- PAUSE MENU MODAL -->
    <div id="pause-menu-overlay" class="hidden">
      <div id="pause-menu-card">
        <div id="pause-menu-title">⚙️ Menu Permainan</div>
        <div id="pause-checkpoint-info"></div>
        <button class="btn-pause-action" id="btn-pm-continue">▶ Lanjutkan Bermain</button>
        <button class="btn-pause-action btn-pause-checkpoint" id="btn-pm-resume">↩ Kembali ke Checkpoint</button>
        <button class="btn-pause-action btn-pause-newgame" id="btn-pm-newgame">🔄 Mulai Ulang (New Game)</button>
      </div>
    </div>

    <!-- PROFILE SCREEN -->
    <div class="screen" id="profile-screen">
      <div class="profile-card">
        <div class="logo">🌿</div>
        <h1>3D BIOVINE</h1>
        <p class="subtitle">Game Edukasi Penyelamatan Lingkungan<br>dari Pencemaran Limbah Vinasse</p>

        <!-- Checkpoint resume banner (populated dynamically) -->
        <div id="resume-section" class="hidden"></div>

        <label for="input-name">Nama Karakter Kamu</label>
        <input type="text" id="input-name" placeholder="Masukkan nama karakter..." maxlength="30" />
        <button class="btn-primary" id="btn-profile-start">Mulai Petualangan →</button>
      </div>
    </div>

    <!-- INSTRUCTIONS SCREEN -->
    <div class="screen hidden" id="instructions-screen">
      <div class="instructions-card">
        <h2>📋 Petunjuk Permainan</h2>

        <div class="instr-section">
          <h3>🎯 Misi Utama</h3>
          <p>Selamatkan lingkungan dari pencemaran limbah <strong>Vinasse</strong> akibat industri etanol di kawasan Bekonang. Kamu akan menjelajahi kawasan pabrik, sungai, dan persawahan untuk memahami dampak pencemaran ini.</p>
        </div>

        <div class="instr-section">
          <h3>�️ Kontrol Gerak</h3>
          <p id="instr-controls-text"></p>
        </div>

        <div class="instr-section">
          <h3>�📊 Sistem Level</h3>
          <p>Terdapat <strong>6 Level</strong> yang harus diselesaikan secara berurutan. Setiap level memiliki 3 fenomena dengan masing-masing 1 pertanyaan.</p>
        </div>

        <div class="instr-section">
          <h3>🪙 Sistem Poin</h3>
          <table class="point-table">
            <thead><tr><th>Percobaan</th><th>Poin Diperoleh</th></tr></thead>
            <tbody>
              <tr><td>✅ Percobaan ke-1 (0 salah)</td><td>100 poin</td></tr>
              <tr><td>✅ Percobaan ke-2 (≤2 salah)</td><td>50 poin</td></tr>
              <tr><td>✅ Percobaan ke-3</td><td>25 poin</td></tr>
            </tbody>
          </table>
        </div>

        <div class="instr-section">
          <h3>�️ Panduan Level</h3>
          <div id="instr-level-guide"></div>
        </div>

        <div class="instr-section">
          <h3>💡 Tips Bermain</h3>
          <ul class="instr-tips">
            <li>🔴 Jawab dengan hati-hati karena setiap jawaban salah mengurangi poin yang kamu dapatkan.</li>
            <li>🟡 Progres permainan tersimpan otomatis setiap kali kamu menyelesaikan sebuah level!</li>
            <li>🟢 Jika kamu menutup permainan, kamu bisa <strong>melanjutkan dari level terakhir</strong> kapan saja.</li>
            <li>🔵 Gunakan <strong>Buku Saku</strong> di HUD jika kamu tidak mengenal istilah kimia.</li>
          </ul>
        </div>

        <div class="instr-section">
          <h3>�📖 Bantuan</h3>
          <p>Klik ikon <strong>"Buku Saku"</strong> di pojok kanan atas jika kamu butuh penjelasan tentang istilah kimia seperti pH, BOD, COD, DO, atau Vinasse.</p>
        </div>

        <button class="btn-primary" id="btn-start-game">🚀 Mulai Level 1</button>
      </div>
    </div>

    <!-- INTRO VIDEO SCREEN -->
    <div class="screen hidden" id="intro-video-screen">
      <div class="intro-scene-wrap">
        <canvas id="intro-3d-canvas"></canvas>

        <!-- Title overlay top-left -->
        <div class="intro-overlay-title">
          <div class="intro-overlay-logo">🌿</div>
          <div>
            <div class="intro-overlay-h">3D BIOVINE</div>
            <div class="intro-overlay-sub">Simulasi IPAL Kawasan Industri &amp; Sistem Pengelolaan Limbah Vinasse</div>
          </div>
        </div>

        <!-- Stage label bottom-left -->
        <div id="intro-stage-label"></div>

        <!-- Continue button bottom-right -->
        <button class="btn-primary intro-btn-continue" id="btn-intro-continue">Lanjutkan ke Petunjuk →</button>
      </div>
    </div>

    <!-- STAGE SCREEN (quiz panel appended dynamically) -->
    <div class="screen hidden" id="stage-screen" style="background:transparent; pointer-events:none;"></div>

    <!-- RESULT POPUP -->
    <div class="popup-overlay hidden" id="result-overlay">
      <div class="popup-card">
        <div class="result-icon" id="result-icon">🎉</div>
        <h2 id="result-title">Luar Biasa!</h2>
        <div class="result-score" id="result-score">+100 poin</div>
        <p id="result-total">Total: 100 poin</p>
        <p id="result-attempts">🥇 Berhasil di percobaan pertama!</p>
        <button class="btn-primary" id="btn-result-continue">Lanjut ke Level 2 →</button>
      </div>
    </div>

    <!-- GLOSSARY MODAL -->
    <div id="glossary-modal" class="hidden">
      <div class="glossary-card">
        <button class="glossary-close" id="btn-close-glossary">✕ Tutup</button>
        <h2>📖 Buku Saku Kimia Lingkungan</h2>

        <div class="glossary-item">
          <div class="term">Vinasse</div>
          <div class="definition">Limbah cair hasil penyulingan (distilasi) fermentasi tebu menjadi etanol. Berwarna coklat kehitaman, berbau manis menyengat, sangat asam, dan kaya bahan organik seperti asam asetat, asam laktat, gliserol, fenol, dan melanoid.</div>
        </div>
        <div class="glossary-item">
          <div class="term">COD (Chemical Oxygen Demand)</div>
          <div class="definition">Jumlah oksigen yang diperlukan untuk mengurai <em>seluruh</em> bahan organik dalam air secara kimia. Nilai tinggi menandakan banyak polutan organik. Satuan: mg/L.</div>
        </div>
        <div class="glossary-item">
          <div class="term">BOD (Biochemical Oxygen Demand)</div>
          <div class="definition">Jumlah oksigen terlarut yang dibutuhkan mikroorganisme untuk mengurai bahan organik secara biologis (aerobik). Nilai tinggi = air tercemar berat. Satuan: mg/L.</div>
        </div>
        <div class="glossary-item">
          <div class="term">DO (Dissolved Oxygen)</div>
          <div class="definition">Kadar oksigen yang terlarut dalam air. DO rendah (&lt;4 mg/L) berarti air tidak sehat bagi organisme akuatik. Air bersih normal memiliki DO ≥ 6 mg/L.</div>
        </div>
        <div class="glossary-item">
          <div class="term">TDS (Total Dissolved Solids)</div>
          <div class="definition">Total padatan (ion anorganik + senyawa organik terlarut) dalam air. Satuan mg/L. Baku mutu air minum: ≤ 500 mg/L. TDS tinggi mengindikasikan pencemaran berat.</div>
        </div>
        <div class="glossary-item">
          <div class="term">pH</div>
          <div class="definition">Derajat keasaman air. pH &lt; 7 = asam; pH 7 = netral; pH &gt; 7 = basa. Limbah vinasse bersifat sangat asam (pH rendah), merusak ekosistem perairan dan tanah pertanian.</div>
        </div>
        <div class="glossary-item">
          <div class="term">Bakteri Coliform</div>
          <div class="definition">Kelompok bakteri indikator pencemaran feses/organik. Pertumbuhannya meningkat seiring naiknya BOD & COD. Berbahaya bagi kesehatan manusia, dapat menyebabkan diare hingga kematian.</div>
        </div>
        <div class="glossary-item">
          <div class="term">Bakteri Metanogenik & Asidogenik</div>
          <div class="definition">Kelompok bakteri anaerob yang ditemukan dalam limbah vinasse. Bakteri asidogenik menghasilkan asam organik, sedangkan metanogenik menghasilkan gas metana (CH₄) dalam proses fermentasi anaerob.</div>
        </div>
      </div>
    </div>
  `;

  // Profile submit
  $('btn-profile-start').onclick = () => {
    const name = $('input-name').value.trim();
    if (!name) {
      $('input-name').style.borderColor = '#e74c3c';
      $('input-name').focus();
      return;
    }
    state.playerName = name;
    hideProfileScreen();
    if (onProfileDone) onProfileDone(name);
  };

  $('input-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('btn-profile-start').click();
  });

  // Glossary close
  setTimeout(() => {
    const closeBtn = $('btn-close-glossary');
    if (closeBtn) closeBtn.onclick = () => toggleGlossary();
  }, 100);
}
