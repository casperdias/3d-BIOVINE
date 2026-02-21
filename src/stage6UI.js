// ─────────────────────────────────────────────────────────────────────────────
// Stage 6 UI – Memberikan Rekomendasi Perbaikan Final
// Steps: Slide Presentation → Final MCQ → Product Showcase → Recommendations
// ─────────────────────────────────────────────────────────────────────────────
import { pocProduct, presentationSlides, stage6FinalQuiz, recommendations } from './stages/stage6.js';
import { state } from './state.js';
import { updateHUD } from './ui.js';

const $ = id => document.getElementById(id);

export function showStage6(onDone) {
  injectCSS();
  removeOverlay();
  showPresentationPanel(() => {
    showFinalMCQ(() => {
      showProductShowcase(() => {
        showRecommendations(onDone);
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 – Slide Presentation (5 slides with checklists)
// ─────────────────────────────────────────────────────────────────────────────
function showPresentationPanel(onComplete) {
  let currentSlide = 0;

  function render() {
    const ov = document.getElementById('s6-overlay');
    const slide = presentationSlides[currentSlide];
    const isLast = currentSlide === presentationSlides.length - 1;

    ov.querySelector('.s6-card').innerHTML = `
      <div class="s6-header">
        <span class="s6-badge">🎤 LEVEL 6 – PRESENTASI</span>
        <h2 class="s6-title">Presentasi Hasil Penelitianmu</h2>
        <p class="s6-subtitle">
          Slide ${currentSlide + 1} / ${presentationSlides.length}
        </p>
      </div>
      ${stepBar(1)}

      <div class="s6-slide-nav">
        ${presentationSlides.map((s, i) => `
          <button class="s6-slide-dot ${i === currentSlide ? 'active' : i < currentSlide ? 'done' : ''}"
            data-idx="${i}">${s.icon}</button>
        `).join('')}
      </div>

      <div class="s6-slide-card">
        <div class="s6-slide-title">${slide.icon} ${slide.title}</div>
        <div class="s6-slide-checklist">
          ${slide.checklist.map(item => `
            <div class="s6-check-item">
              <span class="s6-check-mark">✔</span>
              <span>${item}</span>
            </div>
          `).join('')}
        </div>
        <div class="s6-slide-sample">${slide.sampleContent}</div>
      </div>

      <div class="s6-slide-footer">
        <button class="s6-btn s6-btn-prev ${currentSlide === 0 ? 'hidden' : ''}" id="s6-btn-prev">
          ← Slide Sebelumnya
        </button>
        <button class="s6-btn" id="s6-btn-next">
          ${isLast ? '✅ Selesai Presentasi → Quiz Akhir' : 'Slide Berikutnya →'}
        </button>
      </div>
    `;

    // Slide dot navigation
    ov.querySelectorAll('.s6-slide-dot').forEach(dot => {
      dot.onclick = () => {
        const idx = parseInt(dot.dataset.idx);
        if (idx <= currentSlide) {
          currentSlide = idx;
          render();
        }
      };
    });

    $('s6-btn-next').onclick = () => {
      if (isLast) {
        removeOverlay();
        onComplete();
      } else {
        currentSlide++;
        render();
      }
    };

    const prevBtn = $('s6-btn-prev');
    if (prevBtn) prevBtn.onclick = () => { currentSlide--; render(); };
  }

  const ov = makeOverlay();
  ov.innerHTML = '<div class="s6-card"></div>';
  document.body.appendChild(ov);
  render();
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 – Final MCQ (3 reflection questions)
// ─────────────────────────────────────────────────────────────────────────────
function showFinalMCQ(onComplete) {
  let currentQ   = 0;
  let wrongCount  = 0;
  let totalEarned = 0;

  function renderQ() {
    const q = stage6FinalQuiz[currentQ];
    const ov = document.getElementById('s6-overlay');

    ov.querySelector('.s6-card').innerHTML = `
      <div class="s6-header">
        <span class="s6-badge">🎓 QUIZ AKHIR</span>
        <h2 class="s6-title">Soal Refleksi ${currentQ + 1} / ${stage6FinalQuiz.length}</h2>
      </div>
      ${stepBar(2)}
      <div class="s6-question">${q.question}</div>
      <div class="s6-options" id="s6-opts"></div>
      <div class="s6-feedback hidden" id="s6-fb"></div>
      <button class="s6-btn hidden" id="s6-btn-next">
        ${currentQ < stage6FinalQuiz.length - 1 ? '→ Soal Berikutnya' : '🧴 Lihat Produk POC →'}
      </button>
    `;

    let answered = false;
    const opts = $('s6-opts');

    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 's6-option';
      btn.innerHTML = `<strong>${opt.label}.</strong> ${opt.text}`;
      btn.onclick = () => {
        if (answered) return;
        if (opt.correct) {
          answered = true;
          btn.classList.add('correct');
          opts.querySelectorAll('.s6-option').forEach(b => b.disabled = true);
          const pts = wrongCount === 0 ? 75 : wrongCount <= 1 ? 40 : 15;
          state.totalPoints += pts;
          totalEarned += pts;
          wrongCount = 0;
          updateHUD();
          showFeedback('s6-fb', true, q.explanation + `<br><br>🎉 +${pts} poin!`);
          $('s6-btn-next').classList.remove('hidden');
        } else {
          btn.classList.add('wrong');
          btn.disabled = true;
          wrongCount++;
          state.wrongAnswers = (state.wrongAnswers ?? 0) + 1;
          updateHUD();
          showFeedback('s6-fb', false, '❌ Bukan yang paling tepat. Coba jawaban lain!');
        }
      };
      opts.appendChild(btn);
    });

    $('s6-btn-next').onclick = () => {
      currentQ++;
      if (currentQ < stage6FinalQuiz.length) {
        renderQ();
      } else {
        removeOverlay();
        onComplete();
      }
    };
  }

  const ov = makeOverlay();
  ov.innerHTML = '<div class="s6-card"></div>';
  document.body.appendChild(ov);
  renderQ();
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 – POC Product Showcase
// ─────────────────────────────────────────────────────────────────────────────
function showProductShowcase(onComplete) {
  const ov = makeOverlay();
  ov.innerHTML = `
    <div class="s6-card">
      <div class="s6-header">
        <span class="s6-badge">🧴 PRODUK AKHIR</span>
        <h2 class="s6-title">${pocProduct.emoji} ${pocProduct.name}</h2>
        <p class="s6-subtitle">${pocProduct.description}</p>
      </div>
      ${stepBar(3)}

      <div class="s6-poc-section">
        <h4 class="s6-section-title">🌿 Kandungan Nutrisi per 100 mL POC</h4>
        <div class="s6-nutrient-grid">
          ${pocProduct.nutrients.map(n => `
            <div class="s6-nutrient-card">
              <span class="s6-nut-icon">${n.icon}</span>
              <span class="s6-nut-name">${n.name}</span>
              <span class="s6-nut-val">${n.value}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="s6-poc-section">
        <h4 class="s6-section-title">📋 Cara Penggunaan POC</h4>
        <div class="s6-usage-list">
          ${pocProduct.usageInstructions.map(u => `
            <div class="s6-usage-step">
              <span class="s6-usage-num">${u.step}</span>
              <span class="s6-usage-desc">${u.desc}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="s6-citation">📄 Referensi: ${pocProduct.citation}</div>

      <button class="s6-btn" id="s6-btn-to-rec">♻️ Lihat Rekomendasi Final →</button>
    </div>
  `;
  document.body.appendChild(ov);
  $('s6-btn-to-rec').onclick = () => { removeOverlay(); onComplete(); };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 – Recommendations + Final Score
// ─────────────────────────────────────────────────────────────────────────────
function showRecommendations(onDone) {
  const ov = makeOverlay();
  ov.innerHTML = `
    <div class="s6-card">
      <div class="s6-header">
        <span class="s6-badge">♻️ REKOMENDASI FINAL</span>
        <h2 class="s6-title">Rekomendasi Penerapan Solusi Vinasse</h2>
      </div>
      ${stepBar(4)}

      <div class="s6-rec-grid">
        ${recommendations.map(r => `
          <div class="s6-rec-card">
            <div class="s6-rec-icon">${r.icon}</div>
            <div class="s6-rec-title">${r.title}</div>
            <div class="s6-rec-text">${r.text}</div>
          </div>
        `).join('')}
      </div>

      <div class="s6-game-complete">
        <div class="s6-gc-trophy">🏆</div>
        <h2 class="s6-gc-title">SELAMAT! Semua Level Selesai!</h2>
        <p class="s6-gc-subtitle">
          Kamu telah berhasil menyelesaikan seluruh misi <b>3D BIOVINE</b>!<br>
          Dari mengidentifikasi fenomena pencemaran hingga merancang solusi
          <em>circular economy</em> berbasis sains.
        </p>

        <div class="s6-final-stats">
          <div class="s6-stat">
            <span class="s6-stat-icon">🎯</span>
            <span class="s6-stat-label">Total Poin</span>
            <span class="s6-stat-val gold">${state.totalPoints}</span>
          </div>
          <div class="s6-stat">
            <span class="s6-stat-icon">📚</span>
            <span class="s6-stat-label">Level Selesai</span>
            <span class="s6-stat-val">${state.currentLevel} / 6</span>
          </div>
          <div class="s6-stat">
            <span class="s6-stat-icon">🔬</span>
            <span class="s6-stat-label">Produk Akhir</span>
            <span class="s6-stat-val green">POC Vinasse ✔</span>
          </div>
        </div>

        <div class="s6-circular-badge">
          ♻️ <b>Circular Economy Achievement Unlocked!</b><br>
          <small>Tebu → Molasses → Etanol → Vinasse → Bioremediasi → POC → Tebu</small>
        </div>
      </div>

      <button class="s6-btn s6-btn-end" id="s6-btn-finish">
        🎓 Selesai — Kembali ke Layar Utama
      </button>
    </div>
  `;
  document.body.appendChild(ov);
  $('s6-btn-finish').onclick = () => {
    removeOverlay();
    if (onDone) onDone();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function stepBar(active) {
  const steps = [
    { n: 1, label: 'Presentasi' },
    { n: 2, label: 'Quiz Akhir' },
    { n: 3, label: 'Produk POC' },
    { n: 4, label: 'Rekomendasi' },
  ];
  return `<div class="s6-step-indicator">
    ${steps.map((s, i) => `
      ${i > 0 ? '<span class="s6-step-arrow">→</span>' : ''}
      <span class="s6-step ${s.n < active ? 'done' : s.n === active ? 'active' : ''}">
        ${s.n < active ? '✔ ' : ''}${s.n}. ${s.label}
      </span>
    `).join('')}
  </div>`;
}

function makeOverlay() {
  const el = document.createElement('div');
  el.id = 's6-overlay';
  el.className = 's6-overlay';
  return el;
}

function removeOverlay() {
  const el = $('s6-overlay');
  if (el) el.remove();
}

function showFeedback(elId, correct, msg) {
  const el = $(elId);
  if (!el) return;
  el.className = 's6-feedback ' + (correct ? 'correct' : 'wrong');
  el.innerHTML = msg;
  el.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
function injectCSS() {
  if ($('s6-styles')) return;
  const style = document.createElement('style');
  style.id = 's6-styles';
  style.textContent = `
    .s6-overlay {
      position:fixed;inset:0;background:rgba(4,8,16,0.97);
      display:flex;align-items:center;justify-content:center;
      z-index:500;overflow-y:auto;padding:20px 12px;
    }
    .s6-card {
      background:rgba(6,10,22,0.99);border:1px solid #3a3000;
      border-radius:16px;max-width:900px;width:100%;
      padding:26px 30px;color:#fff8e0;
      box-shadow:0 0 60px rgba(200,150,0,0.15);
    }
    .s6-header { text-align:center;margin-bottom:18px; }
    .s6-badge {
      background:rgba(200,150,0,0.12);border:1px solid #c0a000;
      color:#ffe040;padding:4px 14px;border-radius:20px;
      font-size:12px;letter-spacing:1px;
    }
    .s6-title  { margin:10px 0 4px;font-size:20px;color:#ffe880; }
    .s6-subtitle { color:#706040;font-size:13px;margin:0;line-height:1.5; }

    .s6-step-indicator {
      display:flex;align-items:center;justify-content:center;
      gap:6px;margin-bottom:20px;flex-wrap:wrap;
    }
    .s6-step {
      padding:4px 12px;border-radius:12px;font-size:12px;
      background:rgba(40,30,0,0.8);color:#504020;border:1px solid #3a2a00;
    }
    .s6-step.active { background:rgba(100,80,0,0.25);color:#ffe040;border-color:#c0a000; }
    .s6-step.done   { background:rgba(60,50,0,0.15);color:#90780a;border-color:#604000; }
    .s6-step-arrow  { color:#302a00;font-size:14px; }

    /* Slide presentation */
    .s6-slide-nav {
      display:flex;justify-content:center;gap:8px;margin-bottom:14px;flex-wrap:wrap;
    }
    .s6-slide-dot {
      width:40px;height:40px;border-radius:50%;font-size:16px;
      border:2px solid #3a2a00;background:rgba(30,22,0,0.8);
      cursor:pointer;transition:all 0.2s;
    }
    .s6-slide-dot:hover { border-color:#c0a000;background:rgba(60,50,0,0.4); }
    .s6-slide-dot.active { border-color:#ffe040;background:rgba(80,60,0,0.4); }
    .s6-slide-dot.done   { border-color:#806000;background:rgba(50,40,0,0.3);opacity:0.7; }

    .s6-slide-card {
      background:rgba(10,8,0,0.85);border:1px solid #3a2a00;
      border-radius:10px;padding:16px 18px;margin-bottom:14px;
    }
    .s6-slide-title {
      font-size:15px;font-weight:700;color:#ffe040;margin-bottom:12px;
      border-bottom:1px solid #3a2a00;padding-bottom:8px;
    }
    .s6-slide-checklist { display:flex;flex-direction:column;gap:6px;margin-bottom:12px; }
    .s6-check-item { display:flex;align-items:flex-start;gap:8px;font-size:13px;color:#c0b070; }
    .s6-check-mark { color:#40ff80;font-size:14px;flex-shrink:0;margin-top:1px; }
    .s6-slide-sample {
      font-size:13px;color:#9090c0;line-height:1.7;
      background:rgba(20,18,0,0.5);padding:10px 14px;border-radius:6px;
      border-left:4px solid #605000;
    }
    .s6-slide-footer {
      display:flex;justify-content:flex-end;gap:10px;margin-top:4px;
    }
    .s6-btn-prev {
      background:linear-gradient(135deg,#2a2000,#3a3000) !important;
    }

    /* MCQ */
    .s6-question {
      background:rgba(10,8,0,0.85);border-left:4px solid #c09000;
      padding:12px 16px;border-radius:6px;font-size:14px;
      line-height:1.7;color:#d8c888;margin-bottom:12px;
    }
    .s6-options { display:flex;flex-direction:column;gap:8px;margin-bottom:10px; }
    .s6-option {
      padding:10px 14px;border-radius:8px;border:2px solid #3a2a00;
      background:rgba(10,8,0,0.8);color:#a08060;cursor:pointer;
      text-align:left;font-size:13px;transition:all 0.2s;line-height:1.5;
    }
    .s6-option:hover:not(:disabled) { border-color:#ffe040;color:#ffe880; }
    .s6-option.correct { border-color:#2ecc71;background:rgba(20,80,30,0.2);color:#80ee90; }
    .s6-option.wrong   { border-color:#e74c3c;background:rgba(80,10,10,0.2);color:#ff8888; }
    .s6-option:disabled { opacity:0.6;cursor:default; }
    .s6-feedback {
      padding:10px 14px;border-radius:6px;font-size:13px;line-height:1.7;margin-bottom:8px;
    }
    .s6-feedback.hidden  { display:none; }
    .s6-feedback.correct { background:rgba(20,80,30,0.2);border-left:4px solid #2ecc71;color:#a0e8a0; }
    .s6-feedback.wrong   { background:rgba(80,10,10,0.2);border-left:4px solid #e74c3c;color:#ff9090; }

    .s6-btn {
      display:inline-block;margin-top:14px;padding:11px 26px;border-radius:10px;
      background:linear-gradient(135deg,#604000,#906000);
      color:#fff;font-size:15px;font-weight:700;border:none;cursor:pointer;transition:all 0.2s;
    }
    .s6-btn:hover { filter:brightness(1.2); }
    .s6-btn.hidden { display:none; }
    .s6-btn-end {
      background:linear-gradient(135deg,#005040,#008060);display:block;
      width:100%;text-align:center;margin-top:18px;
    }

    /* POC showcase */
    .s6-poc-section { margin-bottom:16px; }
    .s6-section-title { font-size:14px;font-weight:700;color:#ffe040;margin:0 0 10px; }
    .s6-nutrient-grid {
      display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;
    }
    .s6-nutrient-card {
      background:rgba(10,8,0,0.85);border:1px solid #3a2a00;
      border-radius:9px;padding:10px;text-align:center;
      display:flex;flex-direction:column;gap:4px;
    }
    .s6-nut-icon  { font-size:20px; }
    .s6-nut-name  { font-size:11px;color:#806040; }
    .s6-nut-val   { font-size:15px;font-weight:700;color:#ffe880; }
    .s6-usage-list { display:flex;flex-direction:column;gap:8px; }
    .s6-usage-step {
      display:flex;align-items:flex-start;gap:10px;
      background:rgba(10,8,0,0.6);border:1px solid #2a1a00;
      border-radius:7px;padding:8px 12px;
    }
    .s6-usage-num {
      background:rgba(100,70,0,0.3);border:1px solid #805000;
      color:#ffe040;width:22px;height:22px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:12px;font-weight:700;flex-shrink:0;
    }
    .s6-usage-desc { font-size:13px;color:#a09060;line-height:1.6; }
    .s6-citation { font-size:11px;color:#504030;margin-top:8px;font-style:italic; }

    /* Recommendations */
    .s6-rec-grid {
      display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
      gap:12px;margin-bottom:16px;
    }
    .s6-rec-card {
      background:rgba(10,8,0,0.85);border:1px solid #3a2a00;
      border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:6px;
    }
    .s6-rec-icon  { font-size:26px;text-align:center; }
    .s6-rec-title { font-size:14px;font-weight:700;color:#ffe040;text-align:center; }
    .s6-rec-text  { font-size:12px;color:#806040;line-height:1.5; }

    /* Game complete */
    .s6-game-complete {
      text-align:center;padding:22px 18px;border-radius:12px;
      background:linear-gradient(180deg,rgba(40,30,0,0.4),rgba(0,40,20,0.3));
      border:1px solid #806000;margin-top:8px;
    }
    .s6-gc-trophy { font-size:52px;margin-bottom:8px;filter:drop-shadow(0 0 12px #ffe040); }
    .s6-gc-title  { font-size:24px;color:#ffe040;margin:0 0 10px;
      text-shadow:0 0 20px rgba(255,220,0,0.5); }
    .s6-gc-subtitle { font-size:14px;color:#a09060;line-height:1.7;margin:0 0 16px; }

    .s6-final-stats {
      display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:14px;
    }
    .s6-stat {
      display:flex;flex-direction:column;align-items:center;gap:4px;
      background:rgba(20,16,0,0.6);border:1px solid #3a2a00;
      border-radius:10px;padding:10px 16px;min-width:110px;
    }
    .s6-stat-icon  { font-size:20px; }
    .s6-stat-label { font-size:11px;color:#504030; }
    .s6-stat-val   { font-size:18px;font-weight:800;color:#a0d8c0; }
    .s6-stat-val.gold  { color:#ffe040; }
    .s6-stat-val.green { color:#40ff80; }

    .s6-circular-badge {
      display:inline-block;padding:10px 20px;border-radius:10px;
      background:rgba(0,60,30,0.3);border:1px solid #00aa60;
      color:#40ff80;font-size:13px;line-height:1.8;
    }
    .s6-circular-badge small { color:#408060;font-size:11px; }
  `;
  document.head.appendChild(style);
}
