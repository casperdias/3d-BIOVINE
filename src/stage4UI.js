// ─────────────────────────────────────────────────────────────────────────────
// Stage 4 UI – IPAL Builder: Merancang Prototype Reaktor Vinasse
// Steps: Challenge MCQ → Equipment/Material Selector → Procedure Review → Build Result
// ─────────────────────────────────────────────────────────────────────────────
import { stage4Challenge, equipmentList, materialList, procedureSteps, evaluateReactor } from './stages/stage4.js';
import { state } from './state.js';
import { updateHUD } from './ui.js';

const $ = id => document.getElementById(id);

export function showStage4(onDone) {
  injectCSS();
  removeOverlay();
  showChallengePanel(() => {
    showBuilderPanel(result => {
      showProcedurePanel(result, () => {
        showResultPanel(result, onDone);
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 – Challenge MCQ
// ─────────────────────────────────────────────────────────────────────────────
function showChallengePanel(onComplete) {
  const ov = makeOverlay();
  ov.innerHTML = `
    <div class="s4-card">
      <div class="s4-header">
        <span class="s4-badge">🔧 LEVEL 4 – IPAL BUILDER</span>
        <h2 class="s4-title">Tantangan: Merancang Reaktor yang Benar</h2>
      </div>
      ${stepBar(1)}
      <div class="s4-context" id="s4-ctx"></div>
      <div class="s4-question" id="s4-q"></div>
      <div class="s4-options"  id="s4-opts"></div>
      <div class="s4-feedback hidden" id="s4-fb"></div>
      <button class="s4-btn hidden" id="s4-next-ch">🛠️ Lanjut ke Builder Reaktor →</button>
    </div>
  `;
  document.body.appendChild(ov);

  $('s4-ctx').innerHTML = stage4Challenge.context;
  $('s4-q').innerHTML   = `<strong>❓ Pertanyaan:</strong><br>${stage4Challenge.question}`;

  const opts = $('s4-opts');
  let answered = false;

  stage4Challenge.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 's4-option';
    btn.innerHTML = `<strong>${opt.label}.</strong> ${opt.text}`;
    btn.onclick = () => {
      if (answered) return;
      if (opt.correct) {
        answered = true;
        btn.classList.add('correct');
        opts.querySelectorAll('.s4-option').forEach(b => b.disabled = true);
        const wrong = state.wrongAnswers ?? 0;
        const pts   = wrong === 0 ? 100 : wrong <= 2 ? 50 : 25;
        state.totalPoints += pts;
        state.levelAttempts++;
        updateHUD();
        showFeedback('s4-fb', true, stage4Challenge.explanation + `<br><br>🎉 +${pts} poin!`);
        $('s4-next-ch').classList.remove('hidden');
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        state.wrongAnswers = (state.wrongAnswers ?? 0) + 1;
        updateHUD();
        showFeedback('s4-fb', false, '❌ Kurang tepat. Coba pilihan lain!');
      }
    };
    opts.appendChild(btn);
  });

  $('s4-next-ch').onclick = () => { removeOverlay(); onComplete(); };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 – Equipment & Material Selector (the "builder")
// ─────────────────────────────────────────────────────────────────────────────
function showBuilderPanel(onComplete) {
  const allItems = [...equipmentList, ...materialList];

  const ov = makeOverlay();
  ov.innerHTML = `
    <div class="s4-card s4-builder-card">
      <div class="s4-header">
        <span class="s4-badge">🛠️ BUILDER REAKTOR</span>
        <h2 class="s4-title">Pilih Alat & Bahan untuk Reaktor Vinassemu</h2>
        <p class="s4-subtitle">Centang semua komponen yang ingin kamu masukkan ke dalam rancangan reaktor.
          Item wajib ditandai <span class="s4-required-tag">WAJIB</span>.</p>
      </div>
      ${stepBar(2)}

      <div class="s4-builder-grid" id="s4-builder-grid"></div>

      <div class="s4-selection-summary" id="s4-sel-summary">
        <span id="s4-sel-count">0 item dipilih</span>
        <span id="s4-sel-aerator" class="s4-aer-badge hidden">💨 Aerasi: —</span>
      </div>

      <button class="s4-btn" id="s4-btn-build">⚗️ Lihat Prosedur & Bangun Reaktor →</button>
    </div>
  `;
  document.body.appendChild(ov);

  const selected = new Set(
    allItems.filter(i => i.required).map(i => i.id)
  );

  function renderGrid() {
    const grid = $('s4-builder-grid');
    grid.innerHTML = '';

    // Render alat first, then bahan
    for (const category of ['alat', 'bahan']) {
      const catLabel = document.createElement('div');
      catLabel.className = 's4-cat-label';
      catLabel.textContent = category === 'alat' ? '🔩 ALAT' : '🧪 BAHAN';
      grid.appendChild(catLabel);

      const items = allItems.filter(i => i.category === category);
      items.forEach(item => {
        const isSelected = selected.has(item.id);
        const card = document.createElement('div');
        card.className = `s4-item-card${isSelected ? ' selected' : ''}`;
        card.dataset.id = item.id;

        // For aerator, only one version can be selected at a time
        const isAeratorFamily = item.id.startsWith('aerator_');

        card.innerHTML = `
          <div class="s4-item-check">${isSelected ? '☑' : '☐'}</div>
          <div class="s4-item-emoji">${item.emoji}</div>
          <div class="s4-item-name">${item.name}
            ${item.required ? '<span class="s4-required-tag">WAJIB</span>' : ''}
          </div>
          <div class="s4-item-desc">${item.desc}</div>
        `;

        card.onclick = () => {
          if (item.required) return; // required items can't be deselected

          if (isAeratorFamily) {
            // Deselect all other aerators first
            ['aerator_1', 'aerator_2', 'aerator_3'].forEach(a => selected.delete(a));
          }

          if (selected.has(item.id)) {
            selected.delete(item.id);
          } else {
            selected.add(item.id);
          }
          updateSummary();
          renderGrid();
        };
        grid.appendChild(card);
      });
    }
  }

  function updateSummary() {
    $('s4-sel-count').textContent = `${selected.size} item dipilih`;
    const aerBadge = $('s4-sel-aer-badge');
    const aerLvl = selected.has('aerator_3') ? 3 : selected.has('aerator_2') ? 2 : selected.has('aerator_1') ? 1 : 0;
    const aerEl = $('s4-sel-aerator');
    if (aerLvl > 0) {
      aerEl.textContent = `💨 Aerasi: ${aerLvl} unit`;
      aerEl.classList.remove('hidden');
    } else {
      aerEl.classList.add('hidden');
    }
  }

  renderGrid();
  updateSummary();

  $('s4-btn-build').onclick = () => {
    const result = evaluateReactor([...selected]);
    // save to state
    state.stage4.selectedItems = [...selected];
    state.stage4.reactorResult = result;
    removeOverlay();
    onComplete(result);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 – Procedure Review (read-through of 9 steps)
// ─────────────────────────────────────────────────────────────────────────────
function showProcedurePanel(result, onComplete) {
  const ov = makeOverlay();
  ov.innerHTML = `
    <div class="s4-card">
      <div class="s4-header">
        <span class="s4-badge">📋 PROSEDUR PRAKTIKUM</span>
        <h2 class="s4-title">Langkah-langkah Percobaan Reaktor Vinasse</h2>
        <p class="s4-subtitle">Baca setiap langkah percobaan, lalu klik <b>Selesai Baca</b> untuk melanjutkan.</p>
      </div>
      ${stepBar(3)}
      <div class="s4-procedure-list" id="s4-proc-list"></div>
      <button class="s4-btn" id="s4-btn-proc-done">✅ Selesai Baca — Lihat Hasil Reaktor →</button>
    </div>
  `;
  document.body.appendChild(ov);

  const list = $('s4-proc-list');
  procedureSteps.forEach(step => {
    const div = document.createElement('div');
    div.className = 's4-proc-step';
    div.innerHTML = `
      <div class="s4-proc-icon">${step.icon}</div>
      <div class="s4-proc-body">
        <div class="s4-proc-title">Langkah ${step.step}: ${step.title}</div>
        <div class="s4-proc-desc">${step.desc}</div>
      </div>
    `;
    list.appendChild(div);
  });

  $('s4-btn-proc-done').onclick = () => { removeOverlay(); onComplete(); };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 – Reactor Build Result
// ─────────────────────────────────────────────────────────────────────────────
function showResultPanel(result, onDone) {
  const ov = makeOverlay();

  const barCOD = Math.min(100, result.codReduction || 0);
  const barBOD = Math.min(100, result.bodReduction || 0);

  ov.innerHTML = `
    <div class="s4-card">
      <div class="s4-header">
        <span class="s4-badge">⚗️ HASIL RANCANGAN REAKTOR</span>
        <h2 class="s4-title">Performa Reaktor Vinassemu</h2>
      </div>
      ${stepBar(4)}

      <div class="s4-result-box ${result.success ? 'success' : 'fail'}">
        <div class="s4-result-icon">${result.success ? '✅' : '❌'}</div>
        <div class="s4-result-feedback">${result.feedback}</div>
        ${!result.success ? `<ul class="s4-missing-list">${result.missing.map(m => `<li>⚠️ ${m}</li>`).join('')}</ul>` : ''}
      </div>

      ${result.success ? `
        <div class="s4-grade-badge" style="color:${result.gradeColor}">
          ${result.grade}
        </div>

        <div class="s4-perf-bars">
          <div class="s4-bar-row">
            <span class="s4-bar-label">📉 Penurunan COD</span>
            <div class="s4-bar-track">
              <div class="s4-bar-fill" style="width:${barCOD}%;background:${result.gradeColor}"></div>
            </div>
            <span class="s4-bar-val">${barCOD}%</span>
          </div>
          <div class="s4-bar-row">
            <span class="s4-bar-label">💧 Penurunan BOD</span>
            <div class="s4-bar-track">
              <div class="s4-bar-fill" style="width:${barBOD}%;background:${result.gradeColor}"></div>
            </div>
            <span class="s4-bar-val">${barBOD}%</span>
          </div>
        </div>

        <div class="s4-design-tags">
          ${result.hasLight  ? '<span class="s4-tag green">💡 Lampu ✔</span>' : '<span class="s4-tag red">💡 Tanpa Lampu</span>'}
          ${result.hasFilter ? '<span class="s4-tag green">🕸️ Filter ✔</span>' : '<span class="s4-tag gray">🕸️ Tanpa Filter</span>'}
          ${result.hasBuffer ? '<span class="s4-tag green">⚗️ Buffer pH ✔</span>' : '<span class="s4-tag gray">⚗️ Tanpa Buffer</span>'}
          <span class="s4-tag blue">💨 Aerasi ${result.aerationLvl || 1} unit</span>
        </div>

        <div class="s4-level-complete">
          <div class="s4-complete-icon">🎉</div>
          <h3>Level 4 Selesai!</h3>
          <p>Reaktor berhasil dirancang. Sekarang saatnya mengamati hasilnya dan melakukan evaluasi.</p>
          <div class="s4-final-score">Total Poin: <span>${state.totalPoints}</span></div>
        </div>
      ` : `
        <div class="s4-retry-hint">
          Kembali ke Level 4 untuk memperbaiki rancangan reaktormu.
        </div>
      `}

      <button class="s4-btn" id="s4-btn-finish">
        ${result.success ? '➡️ Lanjut ke Level 5 – Evaluasi' : '🔄 Coba Lagi'}
      </button>
    </div>
  `;
  document.body.appendChild(ov);

  $('s4-btn-finish').onclick = () => {
    removeOverlay();
    if (result.success && onDone) onDone();
    else if (!result.success) {
      // Restart the builder
      showStage4(onDone);
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function stepBar(active) {
  const steps = [
    { n: 1, label: 'Tantangan' },
    { n: 2, label: 'Builder' },
    { n: 3, label: 'Prosedur' },
    { n: 4, label: 'Hasil' },
  ];
  return `<div class="s4-step-indicator">
    ${steps.map((s, i) => `
      ${i > 0 ? '<span class="s4-step-arrow">→</span>' : ''}
      <span class="s4-step ${s.n < active ? 'done' : s.n === active ? 'active' : ''}">
        ${s.n < active ? '✔ ' : ''}${s.n}. ${s.label}
      </span>
    `).join('')}
  </div>`;
}

function makeOverlay() {
  const el = document.createElement('div');
  el.id = 's4-overlay';
  el.className = 's4-overlay';
  return el;
}

function removeOverlay() {
  const el = $('s4-overlay');
  if (el) el.remove();
}

function showFeedback(elId, correct, msg) {
  const el = $(elId);
  if (!el) return;
  el.className = 's4-feedback ' + (correct ? 'correct' : 'wrong');
  el.innerHTML = msg;
  el.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
function injectCSS() {
  if ($('s4-styles')) return;
  const style = document.createElement('style');
  style.id = 's4-styles';
  style.textContent = `
    .s4-overlay {
      position:fixed;inset:0;background:rgba(5,10,22,0.97);
      display:flex;align-items:center;justify-content:center;
      z-index:500;overflow-y:auto;padding:20px 12px;
    }
    .s4-card {
      background:rgba(8,18,34,0.99);border:1px solid #1a3a60;
      border-radius:16px;max-width:860px;width:100%;
      padding:26px 30px;color:#ddeeff;
      box-shadow:0 0 50px rgba(0,100,255,0.12);
    }
    .s4-builder-card { max-width:1000px; }
    .s4-header { text-align:center;margin-bottom:18px; }
    .s4-badge {
      background:rgba(0,100,200,0.15);border:1px solid #0080d0;
      color:#40ccff;padding:4px 14px;border-radius:20px;
      font-size:12px;letter-spacing:1px;
    }
    .s4-title  { margin:10px 0 4px;font-size:20px;color:#80ccff; }
    .s4-subtitle { color:#607090;font-size:13px;margin:0; }

    .s4-step-indicator {
      display:flex;align-items:center;justify-content:center;
      gap:6px;margin-bottom:20px;flex-wrap:wrap;
    }
    .s4-step {
      padding:4px 12px;border-radius:12px;font-size:12px;
      background:rgba(20,40,70,0.8);color:#405070;border:1px solid #1a3a5a;
    }
    .s4-step.active { background:rgba(0,60,120,0.3);color:#40aaff;border-color:#0080cc; }
    .s4-step.done   { background:rgba(0,60,100,0.15);color:#4080a0;border-color:#004060; }
    .s4-step-arrow  { color:#304050;font-size:14px; }

    .s4-context {
      background:rgba(6,16,34,0.85);border-left:4px solid #0080c0;
      padding:12px 16px;border-radius:6px;font-size:14px;
      line-height:1.7;color:#90c8e0;margin-bottom:14px;
    }
    .s4-question {
      background:rgba(6,16,34,0.85);border-left:4px solid #e07020;
      padding:10px 16px;border-radius:6px;font-size:14px;
      line-height:1.6;color:#d8ddc8;margin-bottom:12px;
    }
    .s4-options { display:flex;flex-direction:column;gap:8px;margin-bottom:10px; }
    .s4-option {
      padding:10px 14px;border-radius:8px;border:2px solid #1a3a5a;
      background:rgba(6,16,34,0.8);color:#90b0c8;cursor:pointer;
      text-align:left;font-size:13px;transition:all 0.2s;line-height:1.5;
    }
    .s4-option:hover:not(:disabled) { border-color:#0090ff;color:#40ccff; }
    .s4-option.correct { border-color:#2ecc71;background:rgba(20,80,30,0.2);color:#80ee90; }
    .s4-option.wrong   { border-color:#e74c3c;background:rgba(80,10,10,0.2);color:#ff8888; }
    .s4-option:disabled { opacity:0.6;cursor:default; }
    .s4-feedback {
      padding:10px 14px;border-radius:6px;font-size:13px;
      line-height:1.7;margin-bottom:8px;
    }
    .s4-feedback.hidden  { display:none; }
    .s4-feedback.correct { background:rgba(20,80,30,0.2);border-left:4px solid #2ecc71;color:#a0e8a0; }
    .s4-feedback.wrong   { background:rgba(80,10,10,0.2);border-left:4px solid #e74c3c;color:#ff9090; }

    .s4-btn {
      display:inline-block;margin-top:14px;padding:11px 26px;border-radius:10px;
      background:linear-gradient(135deg,#0a3a70,#0a5090);
      color:#fff;font-size:15px;font-weight:700;border:none;cursor:pointer;
      transition:all 0.2s;
    }
    .s4-btn:hover:not(:disabled) { filter:brightness(1.2); }
    .s4-btn:disabled { opacity:0.4;cursor:default; }
    .s4-btn.hidden   { display:none; }

    /* Builder grid */
    .s4-builder-grid {
      display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
      gap:10px;margin-bottom:14px;max-height:54vh;overflow-y:auto;
      padding-right:4px;
    }
    .s4-cat-label {
      grid-column:1/-1;font-size:12px;font-weight:700;color:#40aaff;
      letter-spacing:2px;padding:6px 0 2px;border-bottom:1px solid #1a3a5a;
    }
    .s4-item-card {
      background:rgba(6,18,38,0.9);border:2px solid #1a3a5a;
      border-radius:10px;padding:12px;cursor:pointer;
      transition:border-color 0.2s,background 0.2s;
      display:flex;flex-direction:column;gap:4px;
    }
    .s4-item-card:hover { border-color:#0080cc; }
    .s4-item-card.selected { border-color:#40aaff;background:rgba(0,40,80,0.3); }
    .s4-item-check { font-size:18px;color:#40aaff; }
    .s4-item-emoji { font-size:24px;text-align:center; }
    .s4-item-name  { font-size:13px;font-weight:700;color:#90c8e0; }
    .s4-item-desc  { font-size:11px;color:#506070;line-height:1.5; }
    .s4-required-tag {
      background:rgba(0,60,120,0.3);border:1px solid #0060aa;
      color:#60aaff;font-size:10px;padding:1px 6px;border-radius:8px;
      margin-left:4px;vertical-align:middle;
    }
    .s4-selection-summary {
      display:flex;align-items:center;gap:12px;
      font-size:13px;color:#6090b0;margin:4px 0 8px;
    }
    .s4-aer-badge {
      background:rgba(0,60,100,0.2);border:1px solid #0060a0;
      color:#40aaff;padding:3px 10px;border-radius:10px;font-size:12px;
    }
    .s4-aer-badge.hidden { display:none; }

    /* Procedure */
    .s4-procedure-list {
      display:flex;flex-direction:column;gap:10px;
      max-height:55vh;overflow-y:auto;padding-right:4px;
    }
    .s4-proc-step {
      display:flex;gap:12px;align-items:flex-start;
      background:rgba(6,16,34,0.85);border:1px solid #1a3a5a;
      border-radius:8px;padding:10px 14px;
    }
    .s4-proc-icon  { font-size:22px;flex-shrink:0; }
    .s4-proc-title { font-size:13px;font-weight:700;color:#80b8d8;margin-bottom:4px; }
    .s4-proc-desc  { font-size:12px;color:#7090a0;line-height:1.6; }

    /* Result */
    .s4-result-box {
      padding:14px 18px;border-radius:10px;margin:10px 0;
      font-size:14px;line-height:1.7;
    }
    .s4-result-box.success { background:rgba(0,80,40,0.2);border:1px solid #00aa60;color:#80ffa0; }
    .s4-result-box.fail    { background:rgba(100,10,10,0.2);border:1px solid #aa2020;color:#ff9090; }
    .s4-result-icon { font-size:26px;margin-bottom:6px; }
    .s4-missing-list { margin:8px 0 0 16px;font-size:13px;color:#ff9090; }
    .s4-grade-badge {
      text-align:center;font-size:22px;font-weight:800;margin:10px 0;
      text-shadow:0 0 12px currentColor;
    }
    .s4-perf-bars { display:flex;flex-direction:column;gap:10px;margin:12px 0; }
    .s4-bar-row { display:flex;align-items:center;gap:10px; }
    .s4-bar-label { font-size:13px;color:#7090b0;width:160px;flex-shrink:0; }
    .s4-bar-track {
      flex:1;height:14px;background:rgba(10,20,40,0.8);
      border-radius:7px;overflow:hidden;border:1px solid #1a3a5a;
    }
    .s4-bar-fill  { height:100%;border-radius:7px;transition:width 0.8s ease; }
    .s4-bar-val   { font-size:14px;font-weight:700;color:#a0c8e0;width:44px;text-align:right; }
    .s4-design-tags { display:flex;flex-wrap:wrap;gap:8px;margin:10px 0; }
    .s4-tag {
      padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;
    }
    .s4-tag.green { background:rgba(0,80,40,0.25);color:#40ff80;border:1px solid #00aa60; }
    .s4-tag.red   { background:rgba(80,10,10,0.2);color:#ff8080;border:1px solid #aa3030; }
    .s4-tag.gray  { background:rgba(30,40,50,0.3);color:#607080;border:1px solid #2a3a4a; }
    .s4-tag.blue  { background:rgba(0,50,100,0.25);color:#60aaff;border:1px solid #0060a0; }
    .s4-level-complete {
      margin-top:16px;text-align:center;padding:16px;border-radius:10px;
      background:rgba(0,60,120,0.2);border:1px solid #0080c0;
    }
    .s4-complete-icon { font-size:38px;margin-bottom:6px; }
    .s4-level-complete h3 { color:#40aaff;margin:0 0 8px;font-size:20px; }
    .s4-level-complete p  { font-size:13px;color:#7090a0;line-height:1.6;margin:0 0 10px; }
    .s4-final-score { font-size:18px;font-weight:700;color:#ffe040;margin-bottom:8px; }
    .s4-retry-hint {
      text-align:center;color:#7090a0;font-size:13px;margin:10px 0;
    }
  `;
  document.head.appendChild(style);
}
