// ─────────────────────────────────────────────────────────────────────────────
// Stage 4 UI – IPAL Builder: Merancang Prototype Reaktor Vinasse
// Steps: Builder → Konsentrasi/Ulangan → Prosedur → Hasil
// ─────────────────────────────────────────────────────────────────────────────
import { equipmentList, materialList, procedureSteps, evaluateReactor } from './stages/stage4.js';
import { state } from './state.js';
import { updateHUD } from './ui.js';

const $ = id => document.getElementById(id);

export function showStage4(onDone) {
  injectCSS();
  removeOverlay();
  showBuilderPanel(selectedIds => {
    showConcentrationPanel(selectedIds, cfg => {
      const result = evaluateReactor(selectedIds, cfg);
      state.stage4.selectedItems  = selectedIds;
      state.stage4.reactorResult  = result;
      state.stage4.concentrationCfg = cfg;
      showProcedurePanel(result, () => {
        showResultPanel(result, onDone);
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 – Equipment & Material Selector (the "builder")
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
      ${stepBar(1)}

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
    removeOverlay();
    onComplete([...selected]);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 – Concentration / Ulangan / Dosis Configuration
// ─────────────────────────────────────────────────────────────────────────────
function showConcentrationPanel(selectedIds, onComplete) {
  const ov = makeOverlay();
  ov.innerHTML = `
    <div class="s4-card">
      <div class="s4-header">
        <span class="s4-badge">🧪 PERLAKUAN & ULANGAN</span>
        <h2 class="s4-title">Rancangan Percobaan: Konsentrasi, Ulangan & Dosis</h2>
        <p class="s4-subtitle">Tentukan variasi konsentrasi Azolla, jumlah ulangan, dan lama perlakuan sesuai rancangan penelitianmu.</p>
      </div>
      ${stepBar(2)}

      <!-- Concentration tiers -->
      <div class="s4-cfg-section">
        <div class="s4-cfg-label">🌿 Variasi Konsentrasi Azolla (pilih 3 taraf)</div>
        <p class="s4-cfg-hint">Geser setiap slider untuk mengatur konsentrasi relatif terhadap dosis referensi (200 g/L).
          Standar praktikum: 10%, 50%, 100%.</p>
        <div class="s4-conc-sliders" id="s4-conc-sliders"></div>
        <div class="s4-conc-preview" id="s4-conc-preview"></div>
      </div>

      <!-- Repetitions -->
      <div class="s4-cfg-section">
        <div class="s4-cfg-label">🔁 Jumlah Ulangan (Replikasi)</div>
        <p class="s4-cfg-hint">Lebih banyak ulangan = data lebih valid secara statistik. Minimal 3 ulangan disarankan.</p>
        <div class="s4-rep-btns" id="s4-rep-btns">
          ${[1,2,3,4,5].map(n => `<button class="s4-rep-btn${n===3?' active':''}" data-rep="${n}">${n}×</button>`).join('')}
        </div>
        <div class="s4-rep-feedback" id="s4-rep-feedback"></div>
      </div>

      <!-- Duration -->
      <div class="s4-cfg-section">
        <div class="s4-cfg-label">⏱️ Lama Perlakuan</div>
        <p class="s4-cfg-hint">Durasi inkubasi dengan aerasi aktif. Literatur: 7–15 hari optimal untuk Azolla.</p>
        <div class="s4-dur-btns" id="s4-dur-btns">
          ${[3,5,7,10,14].map(d => `<button class="s4-dur-btn${d===7?' active':''}" data-day="${d}">${d} hari</button>`).join('')}
        </div>
        <div class="s4-dur-feedback" id="s4-dur-feedback"></div>
      </div>

      <button class="s4-btn" id="s4-btn-cfg-done">📋 Lanjut ke Prosedur →</button>
    </div>
  `;
  document.body.appendChild(ov);

  // ── Concentration sliders (3 tiers) ──
  const defaultConc = [10, 50, 100];
  const concVals    = [...defaultConc];
  const sliderWrap  = $('s4-conc-sliders');

  function renderConcPreview() {
    $('s4-conc-preview').innerHTML = concVals.map((c, i) => {
      const gPerL = (200 * c / 100).toFixed(1);
      return `<div class="s4-conc-pill">
        <span class="s4-conc-pill-label">T${i+1}</span>
        <b>${c}%</b> <span class="s4-conc-pill-sub">(${gPerL} g/L)</span>
      </div>`;
    }).join('');
  }

  for (let i = 0; i < 3; i++) {
    const row = document.createElement('div');
    row.className = 's4-slider-row';
    row.innerHTML = `
      <span class="s4-slider-tier">T${i+1}</span>
      <input type="range" class="s4-slider" min="5" max="200" step="5"
             value="${defaultConc[i]}" id="s4-slider-${i}">
      <span class="s4-slider-val" id="s4-slval-${i}">${defaultConc[i]}%</span>
    `;
    sliderWrap.appendChild(row);
    document.getElementById(`s4-slider-${i}`).addEventListener('input', e => {
      concVals[i] = parseInt(e.target.value);
      $(`s4-slval-${i}`).textContent = concVals[i] + '%';
      renderConcPreview();
    });
  }
  renderConcPreview();

  // ── Repetition buttons ──
  let repCount = 3;
  const repMsgs = { 1:'⚠️ 1 ulangan tidak memenuhi syarat validitas statistik.', 2:'⚠️ 2 ulangan cukup minimal.', 3:'✅ 3 ulangan — standar minimum penelitian ilmiah.', 4:'✅ 4 ulangan — lebih baik, data makin valid.', 5:'✅ 5 ulangan — sangat baik untuk replikasi!' };
  function renderRepFeedback() {
    $('s4-rep-feedback').innerHTML = repMsgs[repCount] || '';
    $('s4-rep-feedback').className = 's4-rep-feedback ' + (repCount >= 3 ? 'good' : 'warn');
  }
  $('s4-rep-btns').querySelectorAll('.s4-rep-btn').forEach(btn => {
    btn.onclick = () => {
      $('s4-rep-btns').querySelectorAll('.s4-rep-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      repCount = parseInt(btn.dataset.rep);
      renderRepFeedback();
    };
  });
  renderRepFeedback();

  // ── Duration buttons ──
  let durDays = 7;
  const durMsgs = { 3:'⚠️ 3 hari terlalu singkat untuk degradasi Azolla yang signifikan.', 5:'🟡 5 hari: penurunan mulai terlihat tetapi belum optimal.', 7:'✅ 7 hari: sesuai rekomendasi literatur (Rizky et al., 2017).', 10:'✅ 10 hari: lebih optimal, terutama jika aerasi sedang.', 14:'✅ 14 hari: maksimal untuk hasil terbaik pada dosis rendah.' };
  function renderDurFeedback() {
    $('s4-dur-feedback').innerHTML = durMsgs[durDays] || '';
    $('s4-dur-feedback').className = 's4-dur-feedback ' + (durDays >= 7 ? 'good' : durDays >= 5 ? 'warn' : 'bad');
  }
  $('s4-dur-btns').querySelectorAll('.s4-dur-btn').forEach(btn => {
    btn.onclick = () => {
      $('s4-dur-btns').querySelectorAll('.s4-dur-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      durDays = parseInt(btn.dataset.day);
      renderDurFeedback();
    };
  });
  renderDurFeedback();

  $('s4-btn-cfg-done').onclick = () => {
    removeOverlay();
    onComplete({ concentrations: [...concVals], repetitions: repCount, duration: durDays });
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
      <div class="s4-cfg-summary" id="s4-cfg-summary"></div>
      <button class="s4-btn" id="s4-btn-proc-done">✅ Selesai Baca — Lihat Hasil Reaktor →</button>
    </div>
  `;
  document.body.appendChild(ov);

  // Show user's concentration config as a reminder
  const cfg = state.stage4?.concentrationCfg;
  if (cfg) {
    $('s4-cfg-summary').innerHTML = `
      <div class="s4-info-box">
        Rancangan kamu: Konsentrasi <b>${cfg.concentrations.join('%, ')}%</b>
        · Ulangan <b>${cfg.repetitions}×</b> · Durasi <b>${cfg.duration} hari</b>
      </div>`;
  }

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
// Step 4 – Reactor Build Result (interactive/visual)
// ─────────────────────────────────────────────────────────────────────────────
function showResultPanel(result, onDone) {
  const ov = makeOverlay();
  const cfg = state.stage4?.concentrationCfg || { concentrations:[10,50,100], repetitions:3, duration:7 };

  ov.innerHTML = `
    <div class="s4-card">
      <div class="s4-header">
        <span class="s4-badge">⚗️ HASIL RANCANGAN REAKTOR</span>
        <h2 class="s4-title">Simulasi Performa Reaktor Vinassemu</h2>
      </div>
      ${stepBar(4)}

      ${!result.success ? `
        <div class="s4-result-box fail">
          <div class="s4-result-icon">❌</div>
          <div class="s4-result-feedback">${result.feedback}</div>
          <ul class="s4-missing-list">${result.missing.map(m => `<li>⚠️ ${m}</li>`).join('')}</ul>
        </div>
        <div class="s4-retry-hint">Kembali untuk melengkapi rancangan reaktormu.</div>
      ` : `
        <!-- Reactor diagram -->
        <div class="s4-reactor-wrap" id="s4-reactor-wrap">
          <div class="s4-reactor-diagram">
            <!-- Lamp indicator -->
            <div class="s4-rd-lamp ${result.hasLight ? 'on' : 'off'}" id="s4-rd-lamp">
              ${result.hasLight ? '💡' : '🔦'}
              <span>${result.hasLight ? 'Lampu ON' : 'Tanpa Lampu'}</span>
            </div>
            <!-- Aquarium body -->
            <div class="s4-rd-tank" id="s4-rd-tank">
              <div class="s4-rd-liquid" id="s4-rd-liquid"></div>
              <div class="s4-rd-azolla" id="s4-rd-azolla"></div>
              <div class="s4-rd-bubbles" id="s4-rd-bubbles"></div>
              <div class="s4-rd-tank-label">Reaktor Vinasse</div>
            </div>
            <!-- Aerator units -->
            <div class="s4-rd-aerators">
              ${Array.from({length: result.aerationLvl || 1}, (_, i) => `
                <div class="s4-rd-aer-unit" style="animation-delay:${i*0.4}s">💨</div>
              `).join('')}
              <span class="s4-rd-aer-label">Aerator ×${result.aerationLvl || 1}</span>
            </div>
          </div>

          <!-- Animated run button -->
          <button class="s4-btn s4-run-btn" id="s4-run-sim">▶ Jalankan Simulasi Reaktor</button>
          <p class="s4-run-hint">Klik untuk melihat simulasi penurunan COD & BOD selama ${cfg.duration} hari</p>
        </div>

        <!-- Results (hidden until sim runs) -->
        <div class="s4-sim-results hidden" id="s4-sim-results">
          <div class="s4-grade-badge" style="color:${result.gradeColor}">${result.grade}</div>

          <!-- COD/BOD bar charts animated -->
          <div class="s4-perf-bars" id="s4-perf-bars">
            <div class="s4-bar-section-title">📊 Rata-rata Penurunan Parameter (semua konsentrasi)</div>
            <div class="s4-bar-row">
              <span class="s4-bar-label">📉 Penurunan COD</span>
              <div class="s4-bar-track"><div class="s4-bar-fill" id="s4-bar-cod" style="width:0%;background:${result.gradeColor}"></div></div>
              <span class="s4-bar-val" id="s4-val-cod">0%</span>
            </div>
            <div class="s4-bar-row">
              <span class="s4-bar-label">💧 Penurunan BOD</span>
              <div class="s4-bar-track"><div class="s4-bar-fill" id="s4-bar-bod" style="width:0%;background:${result.gradeColor}"></div></div>
              <span class="s4-bar-val" id="s4-val-bod">0%</span>
            </div>
          </div>

          <!-- Per-concentration table -->
          <div class="s4-conc-table-wrap">
            <div class="s4-cfg-label">🧪 Hasil Per Variasi Konsentrasi</div>
            <table class="s4-conc-table">
              <thead><tr>
                <th>Taraf</th><th>Konsentrasi</th><th>Dosis (g/L)</th>
                <th>COD turun</th><th>BOD turun</th><th>Keterangan</th>
              </tr></thead>
              <tbody id="s4-conc-tbody"></tbody>
            </table>
          </div>

          <!-- Design tags -->
          <div class="s4-design-tags">
            ${result.hasLight  ? '<span class="s4-tag green">💡 Lampu ✔</span>' : '<span class="s4-tag red">💡 Tanpa Lampu</span>'}
            ${result.hasFilter ? '<span class="s4-tag green">🕸️ Filter ✔</span>' : '<span class="s4-tag gray">🕸️ Tanpa Filter</span>'}
            ${result.hasBuffer ? '<span class="s4-tag green">⚗️ Buffer pH ✔</span>' : '<span class="s4-tag gray">⚗️ Tanpa Buffer</span>'}
            <span class="s4-tag blue">💨 Aerasi ${result.aerationLvl || 1} unit</span>
            <span class="s4-tag blue">🔁 ${cfg.repetitions}× ulangan</span>
            <span class="s4-tag blue">⏱️ ${cfg.duration} hari</span>
          </div>

          <div class="s4-level-complete">
            <div class="s4-complete-icon">🎉</div>
            <h3>Level 4 Selesai!</h3>
            <p>Reaktor berhasil dirancang dan disimulasikan. Saatnya melakukan evaluasi pada Level 5.</p>
            <div class="s4-final-score">Total Poin: <span>${state.totalPoints}</span></div>
          </div>
        </div>
      `}

      <button class="s4-btn ${result.success ? 'hidden' : ''}" id="s4-btn-finish">
        ${result.success ? '➡️ Lanjut ke Level 5 – Evaluasi' : '🔄 Coba Lagi'}
      </button>
    </div>
  `;
  document.body.appendChild(ov);

  if (!result.success) {
    $('s4-btn-finish').onclick = () => { removeOverlay(); showStage4(onDone); };
    return;
  }

  // ── Simulation run ──
  let simRan = false;
  $('s4-run-sim').onclick = () => {
    if (simRan) return;
    simRan = true;
    $('s4-run-sim').disabled = true;
    $('s4-run-sim').textContent = '⏳ Simulasi berjalan…';

    // Animate aquarium: liquid colour change + bubbles + azolla layer
    const liquid  = $('s4-rd-liquid');
    const azolla  = $('s4-rd-azolla');
    const bubbles = $('s4-rd-bubbles');
    bubbles.classList.add('active');
    liquid.classList.add('treating');
    azolla.classList.add('growing');

    // After 2s reveal results with animated bars
    setTimeout(() => {
      $('s4-run-sim').textContent = '✅ Simulasi Selesai';
      $('s4-sim-results').classList.remove('hidden');

      // Build per-concentration table
      const tbody = $('s4-conc-tbody');
      tbody.innerHTML = '';
      result.perConcentration.forEach((row, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>T${i+1}</td>
          <td>${row.conc}%</td>
          <td>${(200 * row.conc / 100).toFixed(1)} g/L</td>
          <td style="color:${result.gradeColor}">${row.cod}%</td>
          <td style="color:${result.gradeColor}">${row.bod}%</td>
          <td style="font-size:11px;color:#6090a0">${row.note}</td>
        `;
        tbody.appendChild(tr);
      });

      // Animate bars
      setTimeout(() => {
        $('s4-bar-cod').style.width = Math.min(100, result.codReduction) + '%';
        $('s4-val-cod').textContent  = result.codReduction + '%';
        $('s4-bar-bod').style.width = Math.min(100, result.bodReduction) + '%';
        $('s4-val-bod').textContent  = result.bodReduction + '%';
      }, 100);

      // Show finish button
      setTimeout(() => {
        const finBtn = document.createElement('button');
        finBtn.className = 's4-btn';
        finBtn.style.marginTop = '8px';
        finBtn.textContent = '➡️ Lanjut ke Level 5 – Evaluasi';
        finBtn.onclick = () => { removeOverlay(); if (onDone) onDone(); };
        $('s4-sim-results').appendChild(finBtn);
        finBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 900);
    }, 2200);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function stepBar(active) {
  const steps = [
    { n: 1, label: 'Builder' },
    { n: 2, label: 'Konsentrasi' },
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

// showFeedback kept for potential future use
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

    /* Concentration config panel */
    .s4-cfg-section {
      background:rgba(6,16,34,0.7);border:1px solid #1a3a5a;
      border-radius:10px;padding:14px 16px;margin-bottom:14px;
    }
    .s4-cfg-label {
      font-size:13px;font-weight:700;color:#60aaff;margin-bottom:4px;
    }
    .s4-cfg-hint { font-size:12px;color:#506070;margin:0 0 10px;line-height:1.5; }
    .s4-conc-sliders { display:flex;flex-direction:column;gap:8px;margin-bottom:10px; }
    .s4-slider-row { display:flex;align-items:center;gap:10px; }
    .s4-slider-tier { font-size:12px;font-weight:700;color:#40aaff;width:22px;flex-shrink:0; }
    .s4-slider {
      flex:1;accent-color:#0080cc;
      cursor:pointer;
    }
    .s4-slider-val { font-size:13px;font-weight:700;color:#a0c8e0;width:44px;text-align:right;flex-shrink:0; }
    .s4-conc-preview { display:flex;gap:10px;flex-wrap:wrap;margin-top:4px; }
    .s4-conc-pill {
      background:rgba(0,40,80,0.4);border:1px solid #0060a0;
      border-radius:8px;padding:5px 10px;font-size:13px;color:#80c0e0;
    }
    .s4-conc-pill-label { font-size:10px;color:#40aaff;margin-right:4px; }
    .s4-conc-pill-sub   { font-size:11px;color:#506070; }
    /* Rep/Duration group buttons */
    .s4-rep-btns, .s4-dur-btns {
      display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;
    }
    .s4-rep-btn, .s4-dur-btn {
      padding:6px 16px;border-radius:8px;border:2px solid #1a3a5a;
      background:rgba(6,16,34,0.8);color:#6090b0;cursor:pointer;
      font-size:13px;font-weight:600;transition:all 0.15s;
    }
    .s4-rep-btn.active, .s4-dur-btn.active {
      border-color:#0080cc;background:rgba(0,50,100,0.3);color:#40aaff;
    }
    .s4-rep-feedback, .s4-dur-feedback {
      font-size:12px;line-height:1.5;padding:4px 0;
    }
    .s4-rep-feedback.good, .s4-dur-feedback.good { color:#40cc80; }
    .s4-rep-feedback.warn, .s4-dur-feedback.warn { color:#e0a020; }
    .s4-rep-feedback.bad,  .s4-dur-feedback.bad  { color:#ff6060; }
    /* Info box */
    .s4-info-box {
      background:rgba(0,40,80,0.2);border-left:4px solid #0070c0;
      padding:8px 14px;border-radius:6px;font-size:13px;color:#80b8e0;
      margin-bottom:12px;line-height:1.6;
    }
    .s4-bar-section-title {
      font-size:12px;color:#4080a0;grid-column:1/-1;margin-bottom:4px;
    }

    /* Reactor diagram */
    .s4-reactor-wrap { display:flex;flex-direction:column;align-items:center;gap:12px;margin:12px 0; }
    .s4-reactor-diagram {
      display:flex;align-items:flex-end;gap:20px;
      background:rgba(5,12,25,0.6);border:1px solid #1a3a5a;
      border-radius:12px;padding:14px 20px;
    }
    /* Lamp */
    .s4-rd-lamp {
      display:flex;flex-direction:column;align-items:center;gap:4px;
      font-size:22px;color:#8090a0;font-size:12px;
    }
    .s4-rd-lamp.on  { color:#ffe060;text-shadow:0 0 10px #ffe040; }
    .s4-rd-lamp.off { color:#404050;opacity:0.5; }
    /* Tank */
    .s4-rd-tank {
      width:160px;height:100px;border:3px solid #4a6a8a;border-radius:6px;
      background:rgba(5,15,30,0.7);position:relative;overflow:hidden;
    }
    .s4-rd-liquid {
      position:absolute;bottom:0;left:0;right:0;height:70%;
      background:rgba(60,20,5,0.85);
      transition:background 2s ease;
    }
    .s4-rd-liquid.treating { background:rgba(30,60,10,0.6); }
    .s4-rd-azolla {
      position:absolute;bottom:70%;left:0;right:0;height:0%;
      background:rgba(40,140,40,0.6);
      transition:height 2s ease;
    }
    .s4-rd-azolla.growing { height:15%; }
    .s4-rd-bubbles { position:absolute;inset:0;pointer-events:none; }
    .s4-rd-tank-label {
      position:absolute;bottom:4px;left:0;right:0;
      text-align:center;font-size:10px;color:rgba(255,255,255,0.3);
    }
    /* Animated bubbles via pseudo element injected by JS class */
    .s4-rd-bubbles.active::before,
    .s4-rd-bubbles.active::after {
      content:'';position:absolute;
      width:6px;height:6px;border-radius:50%;
      background:rgba(80,200,255,0.35);
      bottom:0;animation:rdBubbleRise 1.4s ease-in infinite;
    }
    .s4-rd-bubbles.active::before { left:35%;animation-delay:0s; }
    .s4-rd-bubbles.active::after  { left:60%;animation-delay:0.7s; }
    @keyframes rdBubbleRise {
      0%   { transform:translateY(0);opacity:.7; }
      100% { transform:translateY(-90px);opacity:0; }
    }
    /* Aerator units */
    .s4-rd-aerators {
      display:flex;flex-direction:column;align-items:center;gap:4px;
    }
    .s4-rd-aer-unit {
      font-size:20px;
      animation:aerPulse 1.2s ease-in-out infinite;
    }
    @keyframes aerPulse {
      0%,100% { opacity:.6;transform:scale(1); }
      50%      { opacity:1;transform:scale(1.15); }
    }
    .s4-rd-aer-label { font-size:11px;color:#4080a0;margin-top:2px; }
    .s4-run-btn { font-size:16px;padding:12px 32px; }
    .s4-run-hint { font-size:12px;color:#405060;margin:0; }
    .s4-sim-results { margin-top:10px; }
    .s4-sim-results.hidden { display:none; }
    /* Concentration table */
    .s4-conc-table-wrap { margin:12px 0; }
    .s4-conc-table {
      width:100%;border-collapse:collapse;font-size:12px;
    }
    .s4-conc-table th {
      background:rgba(0,40,80,0.4);color:#60aaff;
      padding:6px 8px;border:1px solid #1a3a5a;text-align:left;
    }
    .s4-conc-table td {
      padding:5px 8px;border:1px solid #0e2040;color:#90b8d0;
    }
    .s4-conc-table tr:nth-child(even) td { background:rgba(0,20,40,0.2); }
  `;
  document.head.appendChild(style);
}
