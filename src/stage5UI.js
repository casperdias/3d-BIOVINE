// ─────────────────────────────────────────────────────────────────────────────
// Stage 5 UI – Melakukan Evaluasi
// Steps: Failure Analysis → MCQ Evaluation → Debrief
// ─────────────────────────────────────────────────────────────────────────────
import { failureScenarios, stage5Questions } from './stages/stage5.js';
import { state } from './state.js';
import { updateHUD } from './ui.js';

const $ = id => document.getElementById(id);

export function showStage5(onDone) {
  injectCSS();
  removeOverlay();
  showFailureAnalysis(() => {
    showEvalMCQ(() => {
      showDebrief(onDone);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 – Failure / Success Analysis cards based on reactor design
// ─────────────────────────────────────────────────────────────────────────────
function showFailureAnalysis(onComplete) {
  const result = state.stage4.reactorResult || {};

  // Collect relevant scenarios
  const found = failureScenarios.filter(s => s.condition(result));

  const ov = makeOverlay();
  ov.innerHTML = `
    <div class="s5-card">
      <div class="s5-header">
        <span class="s5-badge">🔍 LEVEL 5 – EVALUASI PERCOBAAN</span>
        <h2 class="s5-title">Apa yang Terjadi pada Reaktormu?</h2>
        <p class="s5-subtitle">Analisis kegagalan dan keberhasilan percobaan berdasarkan desain yang kamu buat.</p>
      </div>
      ${stepBar(1)}

      ${found.length === 0 ? `
        <div class="s5-success-banner">
          <div class="s5-success-icon">🏆</div>
          <h3>Reaktor Sempurna!</h3>
          <p>Desain reaktormu sudah sangat baik — tidak ditemukan kegagalan kritis.
            Reaktor berjalan optimal dengan semua komponen terpenuhi.</p>
        </div>
      ` : `
        <div class="s5-analysis-intro">
          📋 Ditemukan <b>${found.length}</b> poin evaluasi pada reaktormu. Pelajari setiap temuan:
        </div>
        <div class="s5-scenario-list" id="s5-scen-list"></div>
      `}

      <button class="s5-btn" id="s5-btn-to-mcq">
        🧪 Lanjut ke Evaluasi MCQ →
      </button>
    </div>
  `;
  document.body.appendChild(ov);

  if (found.length > 0) {
    const list = $('s5-scen-list');
    found.forEach((s, i) => {
      const card = document.createElement('div');
      card.className = 's5-scenario-card';
      card.innerHTML = `
        <div class="s5-scen-header" onclick="this.parentElement.classList.toggle('open')">
          <span class="s5-scen-emoji">${s.emoji}</span>
          <span class="s5-scen-title">${s.title}</span>
          <span class="s5-scen-chevron">▼</span>
        </div>
        <div class="s5-scen-body">
          <div class="s5-scen-row"><span class="s5-scen-lbl">🔎 Gejala</span><p>${s.symptom}</p></div>
          <div class="s5-scen-row"><span class="s5-scen-lbl">⚙️ Penyebab</span><p>${s.cause}</p></div>
          <div class="s5-scen-row"><span class="s5-scen-lbl">📚 Teori</span><p>${s.theory}</p></div>
          <div class="s5-scen-row fix"><span class="s5-scen-lbl">✅ Solusi</span><p>${s.fix}</p></div>
        </div>
      `;
      // Open first card by default
      if (i === 0) card.classList.add('open');
      list.appendChild(card);
    });
  }

  $('s5-btn-to-mcq').onclick = () => { removeOverlay(); onComplete(); };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 – Evaluation MCQ (3 questions)
// ─────────────────────────────────────────────────────────────────────────────
function showEvalMCQ(onComplete) {
  let currentQ  = 0;
  let wrongCount = 0;
  let totalEarned = 0;

  function renderQuestion() {
    const q = stage5Questions[currentQ];
    const ov = document.getElementById('s5-overlay');

    ov.querySelector('.s5-card').innerHTML = `
      <div class="s5-header">
        <span class="s5-badge">🧪 EVALUASI MCQ</span>
        <h2 class="s5-title">Soal ${currentQ + 1} / ${stage5Questions.length}</h2>
      </div>
      ${stepBar(2)}
      <div class="s5-question">${q.question}</div>
      <div class="s5-options" id="s5-opts"></div>
      <div class="s5-feedback hidden" id="s5-fb"></div>
      <button class="s5-btn hidden" id="s5-btn-next">
        ${currentQ < stage5Questions.length - 1 ? '→ Soal Berikutnya' : '✅ Selesai Evaluasi'}
      </button>
    `;

    let answered = false;
    const opts = $('s5-opts');

    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 's5-option';
      btn.innerHTML = `<strong>${opt.label}.</strong> ${opt.text}`;
      btn.onclick = () => {
        if (answered) return;
        if (opt.correct) {
          answered = true;
          btn.classList.add('correct');
          opts.querySelectorAll('.s5-option').forEach(b => b.disabled = true);
          const pts = wrongCount === 0 ? 50 : wrongCount <= 1 ? 25 : 10;
          state.totalPoints += pts;
          totalEarned += pts;
          wrongCount = 0;
          updateHUD();
          showFeedback('s5-fb', true, q.explanation + `<br><br>🎉 +${pts} poin!`);
          $('s5-btn-next').classList.remove('hidden');
        } else {
          btn.classList.add('wrong');
          btn.disabled = true;
          wrongCount++;
          state.wrongAnswers = (state.wrongAnswers ?? 0) + 1;
          updateHUD();
          showFeedback('s5-fb', false, '❌ Bukan jawaban yang paling tepat. Coba pilihan lain!');
        }
      };
      opts.appendChild(btn);
    });

    $('s5-btn-next').onclick = () => {
      currentQ++;
      if (currentQ < stage5Questions.length) {
        renderQuestion();
      } else {
        removeOverlay();
        onComplete();
      }
    };
  }

  const ov = makeOverlay();
  ov.innerHTML = '<div class="s5-card"></div>';
  document.body.appendChild(ov);
  renderQuestion();
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 – Debrief & Level Complete
// ─────────────────────────────────────────────────────────────────────────────
function showDebrief(onDone) {
  const result = state.stage4.reactorResult || {};

  const ov = makeOverlay();
  ov.innerHTML = `
    <div class="s5-card">
      <div class="s5-header">
        <span class="s5-badge">📊 RINGKASAN EVALUASI</span>
        <h2 class="s5-title">Kesimpulan Percobaan Reaktor Vinasse</h2>
      </div>
      ${stepBar(3)}

      <div class="s5-debrief-grid">
        <div class="s5-debrief-card">
          <div class="s5-deb-icon">📉</div>
          <div class="s5-deb-label">Efisiensi COD</div>
          <div class="s5-deb-value" style="color:${result.gradeColor||'#a0e8d8'}">${result.codReduction || 0}%</div>
        </div>
        <div class="s5-debrief-card">
          <div class="s5-deb-icon">💧</div>
          <div class="s5-deb-label">Efisiensi BOD</div>
          <div class="s5-deb-value" style="color:${result.gradeColor||'#a0e8d8'}">${result.bodReduction || 0}%</div>
        </div>
        <div class="s5-debrief-card">
          <div class="s5-deb-icon">⭐</div>
          <div class="s5-deb-label">Nilai Reaktor</div>
          <div class="s5-deb-value" style="color:${result.gradeColor||'#a0e8d8'}">${result.grade || '—'}</div>
        </div>
        <div class="s5-debrief-card">
          <div class="s5-deb-icon">🏅</div>
          <div class="s5-deb-label">Total Poin</div>
          <div class="s5-deb-value" style="color:#ffe040">${state.totalPoints}</div>
        </div>
      </div>

      <div class="s5-conclusion">
        <h4>💡 Kesimpulan Ilmiah</h4>
        <p>Bioremediasi dengan <b>Azolla microphylla</b> terbukti efektif menurunkan kadar COD dan BOD pada limbah vinasse.
          Efisiensi maksimal tercapai dengan kombinasi: pencahayaan cukup, aerasi multi-unit, dan pengkondisian pH awal.
          Namun, nilai akhir COD belum memenuhi baku mutu PERMEN LH No. 5/2014 (300 mg/L) — artinya perlakuan
          lanjutan seperti koagulasi atau wetland buatan masih diperlukan untuk aplikasi skala industri.</p>
        <p>Produk akhir proses ini adalah <b>Pupuk Organik Cair (POC)</b> kaya kalium yang dapat
          digunakan kembali di perkebunan tebu — sebuah pendekatan <em>circular economy</em>!</p>
      </div>

      <div class="s5-level-complete">
        <div class="s5-complete-icon">🎉</div>
        <h3>Level 5 Selesai!</h3>
        <p>Evaluasi percobaan selesai. Sekarang saatnya mempresentasikan hasil dan memberikan rekomendasi!</p>
        <div class="s5-final-score">Total Poin: <span>${state.totalPoints}</span></div>
      </div>

      <button class="s5-btn" id="s5-btn-finish">🎤 Lanjut ke Level 6 – Presentasi →</button>
    </div>
  `;
  document.body.appendChild(ov);
  $('s5-btn-finish').onclick = () => { removeOverlay(); if (onDone) onDone(); };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function stepBar(active) {
  const steps = [
    { n: 1, label: 'Analisis' },
    { n: 2, label: 'MCQ' },
    { n: 3, label: 'Kesimpulan' },
  ];
  return `<div class="s5-step-indicator">
    ${steps.map((s, i) => `
      ${i > 0 ? '<span class="s5-step-arrow">→</span>' : ''}
      <span class="s5-step ${s.n < active ? 'done' : s.n === active ? 'active' : ''}">
        ${s.n < active ? '✔ ' : ''}${s.n}. ${s.label}
      </span>
    `).join('')}
  </div>`;
}

function makeOverlay() {
  const el = document.createElement('div');
  el.id = 's5-overlay';
  el.className = 's5-overlay';
  return el;
}

function removeOverlay() {
  const el = $('s5-overlay');
  if (el) el.remove();
}

function showFeedback(elId, correct, msg) {
  const el = $(elId);
  if (!el) return;
  el.className = 's5-feedback ' + (correct ? 'correct' : 'wrong');
  el.innerHTML = msg;
  el.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
function injectCSS() {
  if ($('s5-styles')) return;
  const style = document.createElement('style');
  style.id = 's5-styles';
  style.textContent = `
    .s5-overlay {
      position:fixed;inset:0;background:rgba(5,8,18,0.97);
      display:flex;align-items:center;justify-content:center;
      z-index:500;overflow-y:auto;padding:20px 12px;
    }
    .s5-card {
      background:rgba(6,14,28,0.99);border:1px solid #2a3060;
      border-radius:16px;max-width:860px;width:100%;
      padding:26px 30px;color:#dde8ff;
      box-shadow:0 0 50px rgba(60,0,200,0.12);
    }
    .s5-header { text-align:center;margin-bottom:18px; }
    .s5-badge {
      background:rgba(60,0,180,0.15);border:1px solid #6040cc;
      color:#9080ff;padding:4px 14px;border-radius:20px;
      font-size:12px;letter-spacing:1px;
    }
    .s5-title  { margin:10px 0 4px;font-size:20px;color:#b0a0ff; }
    .s5-subtitle { color:#5060a0;font-size:13px;margin:0; }

    .s5-step-indicator {
      display:flex;align-items:center;justify-content:center;
      gap:6px;margin-bottom:20px;flex-wrap:wrap;
    }
    .s5-step {
      padding:4px 12px;border-radius:12px;font-size:12px;
      background:rgba(20,20,60,0.8);color:#404070;border:1px solid #2a2a5a;
    }
    .s5-step.active { background:rgba(40,20,100,0.3);color:#8070ff;border-color:#6050cc; }
    .s5-step.done   { background:rgba(20,10,60,0.15);color:#5050a0;border-color:#3030a0; }
    .s5-step-arrow  { color:#303050;font-size:14px; }

    .s5-success-banner {
      text-align:center;padding:20px;border-radius:10px;
      background:rgba(0,80,40,0.2);border:1px solid #00aa60;margin-bottom:16px;
    }
    .s5-success-banner h3 { color:#40ff80;margin:6px 0; }
    .s5-success-banner p  { font-size:13px;color:#70a880; }
    .s5-success-icon { font-size:36px;margin-bottom:4px; }

    .s5-analysis-intro {
      font-size:13px;color:#8090c0;
      background:rgba(10,10,40,0.6);padding:10px 14px;border-radius:6px;
      border-left:4px solid #5040cc;margin-bottom:14px;
    }

    .s5-scenario-list { display:flex;flex-direction:column;gap:8px;margin-bottom:14px; }
    .s5-scenario-card {
      background:rgba(8,8,28,0.9);border:1px solid #2a2a5a;border-radius:10px;overflow:hidden;
    }
    .s5-scen-header {
      display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;
      background:rgba(20,18,60,0.6);user-select:none;
    }
    .s5-scen-header:hover { background:rgba(30,25,70,0.8); }
    .s5-scen-emoji { font-size:20px; }
    .s5-scen-title { flex:1;font-size:14px;font-weight:700;color:#9090d8; }
    .s5-scen-chevron { color:#5050a0;font-size:12px;transition:transform 0.2s; }
    .s5-scenario-card.open .s5-scen-chevron { transform:rotate(180deg); }
    .s5-scen-body {
      display:none;padding:12px 14px;
      border-top:1px solid #1a1a4a;
    }
    .s5-scenario-card.open .s5-scen-body { display:block; }
    .s5-scen-row { margin-bottom:10px; }
    .s5-scen-row p { font-size:13px;color:#7080a0;line-height:1.6;margin:4px 0 0 0; }
    .s5-scen-lbl {
      font-size:11px;font-weight:700;color:#7070c0;
      background:rgba(20,20,60,0.5);padding:2px 8px;border-radius:8px;
    }
    .s5-scen-row.fix .s5-scen-lbl { color:#40ff80;background:rgba(0,60,20,0.3); }
    .s5-scen-row.fix p { color:#60c890; }

    .s5-question {
      background:rgba(8,8,30,0.85);border-left:4px solid #7060cc;
      padding:12px 16px;border-radius:6px;font-size:14px;
      line-height:1.7;color:#c0c8e8;margin-bottom:12px;
    }
    .s5-options { display:flex;flex-direction:column;gap:8px;margin-bottom:10px; }
    .s5-option {
      padding:10px 14px;border-radius:8px;border:2px solid #2a2a5a;
      background:rgba(8,8,30,0.8);color:#8090c0;cursor:pointer;
      text-align:left;font-size:13px;transition:all 0.2s;line-height:1.5;
    }
    .s5-option:hover:not(:disabled) { border-color:#7060ff;color:#a090ff; }
    .s5-option.correct { border-color:#2ecc71;background:rgba(20,80,30,0.2);color:#80ee90; }
    .s5-option.wrong   { border-color:#e74c3c;background:rgba(80,10,10,0.2);color:#ff8888; }
    .s5-option:disabled { opacity:0.6;cursor:default; }
    .s5-feedback {
      padding:10px 14px;border-radius:6px;font-size:13px;line-height:1.7;margin-bottom:8px;
    }
    .s5-feedback.hidden  { display:none; }
    .s5-feedback.correct { background:rgba(20,80,30,0.2);border-left:4px solid #2ecc71;color:#a0e8a0; }
    .s5-feedback.wrong   { background:rgba(80,10,10,0.2);border-left:4px solid #e74c3c;color:#ff9090; }

    .s5-btn {
      display:inline-block;margin-top:14px;padding:11px 26px;border-radius:10px;
      background:linear-gradient(135deg,#2a1070,#3a20a0);
      color:#fff;font-size:15px;font-weight:700;border:none;cursor:pointer;transition:all 0.2s;
    }
    .s5-btn:hover { filter:brightness(1.2); }
    .s5-btn.hidden { display:none; }

    /* Debrief */
    .s5-debrief-grid {
      display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:12px 0;
    }
    .s5-debrief-card {
      background:rgba(8,8,30,0.9);border:1px solid #2a2a5a;
      border-radius:10px;padding:12px;text-align:center;
    }
    .s5-deb-icon  { font-size:22px;margin-bottom:4px; }
    .s5-deb-label { font-size:11px;color:#5060a0;margin-bottom:6px; }
    .s5-deb-value { font-size:20px;font-weight:800; }

    .s5-conclusion {
      background:rgba(8,8,30,0.85);border-left:4px solid #5040cc;
      padding:12px 16px;border-radius:6px;margin:12px 0;
    }
    .s5-conclusion h4 { color:#9080ff;margin:0 0 8px;font-size:14px; }
    .s5-conclusion p  { font-size:13px;color:#7080a0;line-height:1.7;margin:0 0 8px; }
    .s5-conclusion p:last-child { margin:0; }

    .s5-level-complete {
      margin-top:16px;text-align:center;padding:16px;border-radius:10px;
      background:rgba(40,20,100,0.2);border:1px solid #6040cc;
    }
    .s5-complete-icon { font-size:38px;margin-bottom:6px; }
    .s5-level-complete h3 { color:#a090ff;margin:0 0 8px;font-size:20px; }
    .s5-level-complete p  { font-size:13px;color:#6070a0;line-height:1.6;margin:0 0 10px; }
    .s5-final-score { font-size:18px;font-weight:700;color:#ffe040;margin-bottom:8px; }
  `;
  document.head.appendChild(style);
}
