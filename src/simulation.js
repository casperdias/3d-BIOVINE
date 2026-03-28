// ─────────────────────────────────────────────────────────────────────────────
// Level 2 Simulation – COD / BOD / pH interactive panel
// ─────────────────────────────────────────────────────────────────────────────
import { calcInitialParams, calcAfterAeration } from './stages/stage2.js';
import { state } from './state.js';

const $ = id => document.getElementById(id);

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point – called from ui.js after all 3 factory stations are done
// ─────────────────────────────────────────────────────────────────────────────
export function showSimulation(onDone) {
  injectSimulationCSS();

  // Remove stale overlay if present
  const old = $('sim-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'sim-overlay';
  overlay.className = 'sim-overlay';
  overlay.innerHTML = buildSimHTML();
  document.body.appendChild(overlay);

  // Give the DOM a tick to render, then wire events
  requestAnimationFrame(() => {
    wireSimulation(overlay, onDone);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML template
// ─────────────────────────────────────────────────────────────────────────────
function buildSimHTML() {
  return `
    <div class="sim-card">
      <!-- Header -->
      <div class="sim-header">
        <span class="sim-badge">🔬 SIMULASI LAB</span>
        <h2 class="sim-title">Pengolahan Limbah Vinasse</h2>
        <p class="sim-subtitle">Ukur COD, BOD & pH — lalu uji efektivitas aerasi</p>
      </div>

      <!-- Step 1: Volume selector -->
      <div class="sim-step" id="sim-step-1">
        <div class="step-title">
          <span class="step-num">1</span>
          Pilih Volume Vinasse yang Dituangkan ke Beker (1 000 mL)
        </div>
        <div class="volume-selector">
          ${[200, 400, 600, 800, 1000].map(v => `
            <button class="vol-btn" data-vol="${v}">${v} mL</button>
          `).join('')}
        </div>
        <div class="vol-preview" id="vol-preview">
          <div class="beaker-wrap">
            <div class="beaker">
              <div class="beaker-vinasse" id="beaker-vinasse"></div>
              <div class="beaker-water"   id="beaker-water"></div>
              <div class="beaker-scale">
                ${[1000,800,600,400,200,0].map(l => `<span>${l}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="vol-legend">
            <span class="legend-box water-box"></span> Air suling
            <span class="legend-box vinasse-box"></span> Vinasse
          </div>
        </div>
        <button class="sim-btn" id="btn-titrate" disabled>🧪 Lakukan Titrasi →</button>
      </div>

      <!-- Step 2: Interactive titration -->
      <div class="sim-step hidden" id="sim-step-2">
        <div class="step-title">
          <span class="step-num">2</span>
          Titrasi COD — Uji Konsumsi KMnO₄
        </div>
        <div class="titration-layout">
          <!-- Left: lab apparatus (burette above flask) -->
          <div class="tit-apparatus">
            <div class="tit-label-sm">Buret KMnO₄</div>
            <div class="tit-burette" id="tit-burette">
              <div class="tit-burette-liquid" id="tit-burette-liquid"></div>
              <div class="tit-burette-scale">
                ${[0,5,10,15,20,25].map(v => `<span>${v}</span>`).join('')}
              </div>
            </div>
            <div class="tit-tip-col">
              <div class="tit-tip-line"></div>
              <div class="tit-drop" id="tit-drop"></div>
            </div>
            <div class="tit-flask" id="tit-flask">
              <div class="tit-flask-liquid" id="tit-flask-liquid"></div>
              <div class="tit-ripple" id="tit-ripple"></div>
            </div>
            <div class="tit-label-sm" style="margin-top:5px">Sampel Vinasse (Erlenmeyer)</div>
            <div class="tit-vol-display">
              <span id="tit-vol-reading">0,00</span> mL terpakai
            </div>
          </div>

          <!-- Right: controls & status -->
          <div class="tit-panel">
            <div class="tit-reagent-box">
              <div class="tit-reagent-dot"></div>
              <div>
                <b>KMnO₄</b> — Kalium Permanganat<br>
                <span>Reagen pengoksidasi (ungu). Langsung terdekolorisasi saat bertemu bahan organik sampel, hingga semua teroksidasi — itulah titik akhir titrasi.</span>
              </div>
            </div>
            <div class="tit-status" id="tit-status">
              <span style="color:#b070d8">●</span>
              KMnO₄ langsung terdekolorisasi — masih ada bahan organik yang belum teroksidasi
            </div>
            <div class="tit-ep-notice hidden" id="tit-ep-notice">
              🎯 <b>Titik Akhir!</b> Warna merah muda muncul pertama kali — semua bahan organik telah teroksidasi oleh KMnO₄!
            </div>
            <div class="tit-drop-row">
              <button class="tit-btn tit-primary" id="btn-add-drop">💧 +1 Tetes</button>
              <button class="tit-btn tit-secondary" id="btn-fast-drops">⚡ +5 Tetes</button>
            </div>
            <button class="sim-btn hidden" id="btn-confirm-endpoint"
              style="margin-top:14px;width:100%;background:linear-gradient(135deg,#1a6040,#2a9060)">
              ✅ Catat Titik Akhir Titrasi
            </button>
          </div>
        </div>

        <!-- Revealed after endpoint is confirmed -->
        <div class="tit-results hidden" id="tit-results">
          <div class="tit-results-heading">📊 Hasil Pengukuran Parameter Awal</div>
          <div class="param-grid" id="initial-params"></div>
          <div class="titration-note" id="titration-note"></div>
          <button class="sim-btn" id="btn-go-aerate">💨 Lanjut ke Simulasi Aerasi →</button>
        </div>
      </div>

      <!-- Step 3: Aeration -->
      <div class="sim-step hidden" id="sim-step-3">
        <div class="step-title">
          <span class="step-num">3</span>
          Simulasi Aerasi (Biodegradasi Aerobik)
        </div>

        <div class="aerator-panel">
          <div class="aerator-visual" id="aerator-visual">
            <div class="aerator-tank">
              <div class="aerator-liquid" id="aerator-liquid"></div>
              <div class="bubble-container" id="bubble-container"></div>
            </div>
            <div class="aerator-machine" id="aerator-machine">
              <div class="motor-body"></div>
              <div class="motor-shaft"></div>
            </div>
          </div>

          <div class="aerator-controls">
            <label class="toggle-label">
              <span>Aerator</span>
              <label class="toggle-switch">
                <input type="checkbox" id="aerator-toggle">
                <span class="toggle-slider"></span>
              </label>
              <span id="aerator-status" class="status-off">MATI</span>
            </label>

            <div class="duration-wrap" id="duration-wrap">
              <label>Durasi Aerasi</label>
              <div class="duration-buttons">
                ${[6, 12, 24, 48, 72].map(h => `
                  <button class="dur-btn" data-hours="${h}">${h} jam</button>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <button class="sim-btn hidden" id="btn-calc-result">📊 Hitung Hasil Pengolahan →</button>
      </div>

      <!-- Step 4: Results -->
      <div class="sim-step hidden" id="sim-step-4">
        <div class="step-title">
          <span class="step-num">4</span>
          Hasil Pengolahan & Evaluasi
        </div>
        <div class="results-grid" id="results-grid">
          <!-- populated by JS -->
        </div>
        <div class="compliance-banner" id="compliance-banner"></div>
        <div class="sim-conclusion" id="sim-conclusion"></div>

        <button class="sim-btn hidden" id="btn-sim-finish" style="margin-top:8px">✅ Selesai Level 2 →</button>
      </div>

    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Event wiring
// ─────────────────────────────────────────────────────────────────────────────
function wireSimulation(overlay, onDone) {
  let selectedVol  = null;
  let initialData  = null;
  let selectedHours = null;
  let aeratorOn    = false;

  // ── Step 1: volume buttons ──
  overlay.querySelectorAll('.vol-btn').forEach(btn => {
    btn.onclick = () => {
      overlay.querySelectorAll('.vol-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedVol = parseInt(btn.dataset.vol);
      $('btn-titrate').disabled = false;
      updateBeaker(selectedVol);
    };
  });

  // ── Step 1 → 2: Titrate (launches interactive titration) ──
  $('btn-titrate').onclick = () => {
    initialData = calcInitialParams(selectedVol);
    transitionStep('sim-step-1', 'sim-step-2');
    initTitration(selectedVol, initialData);
  };

  // ── Step 2 → 3: Go to aeration ──
  $('btn-go-aerate').onclick = () => {
    transitionStep('sim-step-2', 'sim-step-3');
    setAeratorLiquidColor(initialData);
  };

  // ── Step 3: Aerator toggle ──
  $('aerator-toggle').onchange = function () {
    aeratorOn = this.checked;
    const statusEl = $('aerator-status');
    statusEl.textContent = aeratorOn ? 'NYALA' : 'MATI';
    statusEl.className   = aeratorOn ? 'status-on' : 'status-off';
    $('aerator-machine').classList.toggle('running', aeratorOn);
    toggleBubbles(aeratorOn);
    if (aeratorOn) $('duration-wrap').classList.remove('locked');
    else {
      $('duration-wrap').classList.add('locked');
      selectedHours = null;
      overlay.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
      $('btn-calc-result').classList.add('hidden');
    }
  };

  // ── Step 3: Duration buttons ──
  overlay.querySelectorAll('.dur-btn').forEach(btn => {
    btn.onclick = () => {
      if (!aeratorOn) return;
      overlay.querySelectorAll('.dur-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedHours = parseInt(btn.dataset.hours);
      $('btn-calc-result').classList.remove('hidden');
    };
  });

  // ── Step 3 → 4: Calculate results ──
  $('btn-calc-result').onclick = () => {
    const result = calcAfterAeration(initialData, selectedHours);
    transitionStep('sim-step-3', 'sim-step-4');
    renderResults(initialData, result, selectedVol, selectedHours);
    $('btn-sim-finish').classList.remove('hidden');
    $('btn-sim-finish').onclick = () => {
      $('sim-overlay').remove();
      if (onDone) onDone();
    };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Titration mini-game — runs during Step 2
// Drops of KMnO₄ are added; at endpointDrops the flask turns pink (endpoint).
// More vinasse volume → higher COD → more drops needed (proportional).
// ─────────────────────────────────────────────────────────────────────────────
function initTitration(vol, data) {
  const endpointDrops = Math.round(vol / 50);   // 4 drops (200 mL) … 20 drops (1000 mL)
  const dropVolMl     = 0.05;                    // 0.05 mL per drop
  let currentDrops    = 0;
  let pendingAnim     = false;

  // Initialise flask colour: dark brown proportional to dilution
  const d = data.dilutionFactor;
  $('tit-flask-liquid').style.background =
    `rgb(${Math.round(55 + d * 55)}, ${Math.round(15 + d * 15)}, 3)`;
  $('tit-burette-liquid').style.height = '90%';

  function addDrops(n) {
    if (pendingAnim) return;
    const toAdd = Math.min(n, endpointDrops - currentDrops);
    if (toAdd <= 0) return;
    pendingAnim    = true;
    currentDrops  += toAdd;

    // Animate a drop falling from the burette tip
    const dropEl = $('tit-drop');
    dropEl.classList.remove('falling');
    void dropEl.offsetWidth;           // force reflow so animation restarts
    dropEl.classList.add('falling');

    setTimeout(() => {
      pendingAnim = false;

      // Deplete burette level
      const pct = Math.max(8, 90 - (currentDrops / endpointDrops) * 78);
      $('tit-burette-liquid').style.height = pct + '%';

      // Update mL reading
      $('tit-vol-reading').textContent =
        (currentDrops * dropVolMl).toFixed(2).replace('.', ',');

      // Ripple in flask
      triggerRipple();

      if (currentDrops >= endpointDrops) {
        // Endpoint: flask turns light pink
        $('tit-flask-liquid').style.background = 'rgba(255, 155, 185, 0.88)';
        $('tit-status').style.display          = 'none';
        $('tit-ep-notice').classList.remove('hidden');
        $('btn-add-drop').disabled             = true;
        $('btn-fast-drops').disabled           = true;
        $('btn-confirm-endpoint').classList.remove('hidden');
      }
    }, 560);
  }

  $('btn-add-drop').onclick   = () => addDrops(1);
  $('btn-fast-drops').onclick = () => addDrops(5);

  $('btn-confirm-endpoint').onclick = () => {
    const res = $('tit-results');
    res.classList.remove('hidden');
    renderInitialParams(data, vol);
    setTimeout(() => res.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  };
}

function triggerRipple() {
  const r = $('tit-ripple');
  if (!r) return;
  r.classList.remove('ripple-active');
  void r.offsetWidth;
  r.classList.add('ripple-active');
}

// ─────────────────────────────────────────────────────────────────────────────
// Beaker visualisation
// ─────────────────────────────────────────────────────────────────────────────
function updateBeaker(vol) {
  const totalH  = 100; // % height of beaker interior
  const vinPct  = (vol / 1000) * totalH;
  const watPct  = totalH - vinPct;

  const vinEl  = $('beaker-vinasse');
  const watEl  = $('beaker-water');

  // Vinasse sits at the bottom
  vinEl.style.height = vinPct + '%';
  vinEl.style.bottom = '0%';

  // Water sits directly on top of vinasse (not overlapping)
  watEl.style.height = watPct + '%';
  watEl.style.bottom = vinPct + '%';
}

// ─────────────────────────────────────────────────────────────────────────────
// Titration parameter cards
// ─────────────────────────────────────────────────────────────────────────────
function renderInitialParams(data, vol) {
  const grid = $('initial-params');
  const note = $('titration-note');

  grid.innerHTML = [
    {
      icon: '🧫', label: 'COD', value: data.cod.toLocaleString('id-ID') + ' mg/L',
      sub: 'Chemical Oxygen Demand',
      status: data.cod > 1000 ? 'danger' : data.cod > 300 ? 'warn' : 'good',
    },
    {
      icon: '🦠', label: 'BOD', value: data.bod.toLocaleString('id-ID') + ' mg/L',
      sub: 'Biochemical Oxygen Demand',
      status: data.bod > 400 ? 'danger' : data.bod > 100 ? 'warn' : 'good',
    },
    {
      icon: '⚗️', label: 'pH', value: data.ph.toFixed(2),
      sub: `${data.ph < 5 ? 'Sangat Asam ⚠️' : data.ph < 6.5 ? 'Asam' : 'Mendekati Netral'}`,
      status: data.ph < 5 ? 'danger' : data.ph < 6.5 ? 'warn' : 'good',
    },
    {
      icon: '📏', label: 'Faktor Pengenceran', value: `1 : ${(1 / data.dilutionFactor).toFixed(1)}`,
      sub: `${vol} mL vinasse dalam 1 000 mL`,
      status: 'neutral',
    },
  ].map(p => `
    <div class="param-card ${p.status}">
      <span class="param-icon">${p.icon}</span>
      <span class="param-label">${p.label}</span>
      <span class="param-value">${p.value}</span>
      <span class="param-sub">${p.sub}</span>
    </div>
  `).join('');

  note.innerHTML = `
    ⚗️ <strong>Interpretasi:</strong> Dengan ${vol} mL vinasse (selebihnya air suling),
    COD = <b>${data.cod.toLocaleString('id-ID')} mg/L</b> dan BOD = <b>${data.bod.toLocaleString('id-ID')} mg/L</b>.
    Baku mutu effluent industri: COD ≤ 100 mg/L, BOD ≤ 40 mg/L (Permen LH No.5/2014).
    ${data.cod > 100
      ? '⛔ Sampel <strong>jauh melebihi</strong> baku mutu — perlu pengolahan intensif.'
      : '✅ Sampel sudah memenuhi batas COD.'}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Aerator liquid colour
// ─────────────────────────────────────────────────────────────────────────────
function setAeratorLiquidColor(data) {
  const el = $('aerator-liquid');
  if (!el) return;
  // Dark brown for high COD, lighter for more dilute
  const ratio = Math.min(1, data.cod / 45000);
  const r = Math.round(60 + ratio * 60);
  const g = Math.round(20 + ratio * 5);
  const b = 0;
  el.style.background = `rgb(${r},${g},${b})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bubble animation
// ─────────────────────────────────────────────────────────────────────────────
function toggleBubbles(on) {
  const container = $('bubble-container');
  if (!container) return;
  container.innerHTML = '';
  if (!on) return;

  for (let i = 0; i < 14; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    b.style.left = (5 + Math.random() * 85) + '%';
    b.style.animationDuration = (1.2 + Math.random() * 2) + 's';
    b.style.animationDelay    = (Math.random() * 2) + 's';
    b.style.width  = b.style.height = (4 + Math.random() * 8) + 'px';
    container.appendChild(b);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Results grid
// ─────────────────────────────────────────────────────────────────────────────
function renderResults(initial, result, vol, hours) {
  const grid     = $('results-grid');
  const banner   = $('compliance-banner');
  const concl    = $('sim-conclusion');

  const params = [
    {
      icon: '🧫', label: 'COD',
      before: initial.cod.toLocaleString('id-ID') + ' mg/L',
      after:  result.cod.toLocaleString('id-ID')  + ' mg/L',
      removal: result.codRemovalPct + '%',
      limit: '≤ 100 mg/L',
      pass: result.cod <= 100,
    },
    {
      icon: '🦠', label: 'BOD',
      before: initial.bod.toLocaleString('id-ID') + ' mg/L',
      after:  result.bod.toLocaleString('id-ID')  + ' mg/L',
      removal: result.bodRemovalPct + '%',
      limit: '≤ 40 mg/L',
      pass: result.bod <= 40,
    },
    {
      icon: '⚗️', label: 'pH',
      before: initial.ph.toFixed(2),
      after:  result.ph.toFixed(2),
      removal: '+' + (result.ph - initial.ph).toFixed(2),
      limit: '6.0 – 9.0',
      pass: result.ph >= 6.0 && result.ph <= 9.0,
    },
  ];

  grid.innerHTML = `
    <div class="results-header-row">
      <span>Parameter</span><span>Sebelum</span><span>Sesudah</span><span>Removal %</span><span>Baku Mutu</span><span>Status</span>
    </div>
    ${params.map(p => `
      <div class="results-row ${p.pass ? 'pass' : 'fail'}">
        <span>${p.icon} ${p.label}</span>
        <span>${p.before}</span>
        <span>${p.after}</span>
        <span>${p.removal}</span>
        <span>${p.limit}</span>
        <span>${p.pass ? '✅' : '⛔'}</span>
      </div>
    `).join('')}
  `;

  banner.className = 'compliance-banner ' + (result.compliant ? 'compliant' : 'not-compliant');
  banner.innerHTML = result.compliant
    ? '✅ Effluent <strong>MEMENUHI</strong> baku mutu Permen LH No.5/2014 setelah aerasi!'
    : `⛔ Effluent <strong>BELUM MEMENUHI</strong> baku mutu — perlu pengolahan lanjut atau durasi aerasi lebih panjang.`;

  concl.innerHTML = `
    <strong>📝 Kesimpulan:</strong> Dengan volume vinasse <b>${vol} mL</b> dan aerasi selama
    <b>${hours} jam</b>, diperoleh penurunan COD sebesar <b>${result.codRemovalPct}%</b> dan
    BOD sebesar <b>${result.bodRemovalPct}%</b>. pH meningkat dari <b>${initial.ph}</b>
    menjadi <b>${result.ph}</b> karena asam organik teroksidasi oleh mikroba aerob.
    ${result.compliant
      ? 'Pengolahan ini efektif dan limbah sudah layak dibuang ke badan air penerima.'
      : 'Disarankan menambah durasi aerasi atau menggunakan teknologi lanjutan (koagulasi/MBBR) agar sesuai regulasi.'}
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation MCQ at the end of simulation
// ─────────────────────────────────────────────────────────────────────────────
// (eval question removed)
// ─────────────────────────────────────────────────────────────────────────────
const _unused_evalQuestion = {
  text: `Berdasarkan simulasi aerasi yang kamu lakukan, faktor utama apa yang menentukan seberapa besar penurunan BOD/COD limbah vinasse?`,
  options: [
    {
      label: 'A',
      text: 'Warna limbah vinasse — semakin gelap warna vinasse, semakin sulit didegradasi secara aerobik.',
      correct: false,
    },
    {
      label: 'B',
      text: 'Durasi aerasi dan ketersediaan oksigen — semakin lama aerasi, semakin banyak bahan organik yang diurai bakteri aerob.',
      correct: true,
    },
    {
      label: 'C',
      text: 'Volume vinasse yang digunakan — lebih banyak vinasse selalu menghasilkan removal yang lebih besar secara absolut.',
      correct: false,
    },
  ],
  explanation: `✅ <strong>Benar!</strong> Aerasi menyuplai oksigen bagi bakteri aerob untuk mengurai bahan organik (BOD/COD). Semakin lama waktu aerasi (dan pasokan O₂ cukup), semakin besar persentase removal yang dicapai, mendekati batas kemampuan biodegradasi aerobik (~55–60% COD, ~90%+ BOD pada aerasi optimal).`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Step transition helper
// ─────────────────────────────────────────────────────────────────────────────
function transitionStep(fromId, toId) {
  const fromEl = $(fromId);
  const toEl   = $(toId);

  fromEl.classList.add('step-exit');
  setTimeout(() => {
    fromEl.classList.add('hidden');
    fromEl.classList.remove('step-exit');
    toEl.classList.remove('hidden');
    toEl.classList.add('step-enter');
    setTimeout(() => toEl.classList.remove('step-enter'), 400);
  }, 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline CSS injection (keeps simulation styles self-contained)
// ─────────────────────────────────────────────────────────────────────────────
function injectSimulationCSS() {
  if (document.getElementById('sim-styles')) return;

  const css = `
    /* ── Simulation overlay ───────────────────────────── */
    .sim-overlay {
      position: fixed; inset: 0;
      background: rgba(5, 12, 25, 0.96);
      display: flex; align-items: center; justify-content: center;
      z-index: 400; overflow-y: auto; padding: 24px 12px;
    }
    .sim-card {
      background: rgba(12, 22, 40, 0.98);
      border: 1px solid #1a4a6a;
      border-radius: 16px;
      max-width: 820px; width: 100%;
      padding: 28px 32px;
      color: #e0eeff;
      box-shadow: 0 0 40px rgba(0, 120, 200, 0.25);
    }
    .sim-header { text-align: center; margin-bottom: 28px; }
    .sim-badge {
      background: rgba(0, 200, 255, 0.15);
      border: 1px solid #00c8ff;
      color: #00c8ff; padding: 4px 14px;
      border-radius: 20px; font-size: 12px; letter-spacing: 1px;
    }
    .sim-title { margin: 10px 0 4px; font-size: 22px; color: #a0d8ff; }
    .sim-subtitle { color: #7090a0; font-size: 13px; }

    /* ── Steps ────────────────────────────────────────── */
    .sim-step { margin-top: 16px; }
    .sim-step.hidden { display: none; }
    .step-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 15px; font-weight: 700; color: #80c8ff;
      margin-bottom: 16px;
    }
    .step-num {
      background: #0a4070; color: #40aaff;
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 800; flex-shrink: 0;
    }
    @keyframes stepEnter { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: none; } }
    @keyframes stepExit  { from { opacity:1; transform: none; } to { opacity:0; transform: translateY(-8px); } }
    .step-enter { animation: stepEnter 0.4s ease forwards; }
    .step-exit  { animation: stepExit  0.3s ease forwards; }

    /* ── Volume buttons ───────────────────────────────── */
    .volume-selector { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
    .vol-btn {
      padding: 10px 18px; border-radius: 8px; border: 2px solid #1a4a6a;
      background: rgba(10, 30, 55, 0.8); color: #7ab0d8; cursor: pointer;
      font-size: 14px; font-weight: 600; transition: all 0.2s;
    }
    .vol-btn:hover { border-color: #00aaff; color: #00aaff; }
    .vol-btn.active { border-color: #00d4ff; color: #00d4ff; background: rgba(0,180,255,0.1); }

    /* ── Beaker visualisation ─────────────────────────── */
    .vol-preview { display: flex; align-items: center; gap: 20px; margin-bottom: 18px; }
    .beaker-wrap { display: flex; flex-direction: column; align-items: center; }
    .beaker {
      position: relative; width: 70px; height: 140px;
      border: 3px solid #88bbcc; border-top: none;
      border-radius: 0 0 8px 8px;
      overflow: hidden; background: rgba(20, 50, 70, 0.3);
    }
    .beaker-scale {
      position: absolute; right: 4px; top: 0; bottom: 0;
      display: flex; flex-direction: column; justify-content: space-between;
      font-size: 8px; color: #88aaaa; pointer-events: none;
      padding: 2px 0;
    }
    .beaker-water {
      position: absolute; left: 0; right: 0;
      background: rgba(100, 170, 220, 0.5);
      transition: height 0.5s ease, bottom 0.5s ease;
      border-bottom: 1px solid rgba(120, 200, 255, 0.4);
    }
    .beaker-vinasse {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: rgba(100, 40, 0, 0.85);
      transition: height 0.5s ease;
      border-top: 1px solid rgba(160, 80, 20, 0.6);
    }
    .vol-legend { font-size: 12px; color: #8090a0; line-height: 1.8; }
    .legend-box { display: inline-block; width: 12px; height: 12px; margin-right: 4px; vertical-align: middle; border-radius: 2px; }
    .water-box   { background: rgba(100, 170, 220, 0.8); }
    .vinasse-box { background: rgba(100, 40, 0, 0.9); }

    /* ── Sim button ───────────────────────────────────── */
    .sim-btn {
      display: inline-block; margin-top: 14px;
      padding: 11px 26px; border-radius: 10px;
      background: linear-gradient(135deg, #0a5080, #0a8080);
      color: #fff; font-size: 15px; font-weight: 700;
      border: none; cursor: pointer; transition: all 0.2s;
    }
    .sim-btn:hover:not(:disabled) { filter: brightness(1.2); }
    .sim-btn:disabled { opacity: 0.4; cursor: default; }
    .sim-btn.hidden { display: none; }

    /* ── Parameter cards ──────────────────────────────── */
    .param-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px; margin-bottom: 14px;
    }
    .param-card {
      background: rgba(10, 25, 45, 0.9); border-radius: 10px;
      padding: 12px 14px; border-left: 4px solid #444;
      display: flex; flex-direction: column; gap: 3px;
    }
    .param-card.danger { border-left-color: #e74c3c; }
    .param-card.warn   { border-left-color: #f39c12; }
    .param-card.good   { border-left-color: #2ecc71; }
    .param-card.neutral{ border-left-color: #3498db; }
    .param-icon  { font-size: 20px; }
    .param-label { font-size: 11px; color: #7090a0; text-transform: uppercase; letter-spacing: 0.5px; }
    .param-value { font-size: 18px; font-weight: 800; color: #d0f0ff; }
    .param-sub   { font-size: 11px; color: #8090a0; }

    .titration-note {
      background: rgba(10, 30, 50, 0.8); border-left: 4px solid #1a6a8a;
      padding: 10px 14px; border-radius: 6px; font-size: 13px;
      color: #a0c8d8; margin-bottom: 4px; line-height: 1.6;
    }

    /* ── Aerator panel ────────────────────────────────── */
    .aerator-panel { display: flex; gap: 28px; align-items: flex-start; flex-wrap: wrap; }
    .aerator-visual { flex-shrink: 0; }
    .aerator-tank {
      width: 150px; height: 100px;
      border: 3px solid #4a6a7a; border-top: none;
      border-radius: 0 0 10px 10px;
      background: rgba(5, 20, 35, 0.8);
      position: relative; overflow: hidden;
    }
    .aerator-liquid {
      position: absolute; bottom: 0; left: 0; right: 0; height: 70%;
      background: rgba(80, 30, 5, 0.85);
      transition: background 1s;
    }
    .bubble-container { position: absolute; inset: 0; pointer-events: none; }
    .bubble {
      position: absolute; bottom: 0;
      background: rgba(180, 220, 255, 0.5);
      border-radius: 50%;
      animation: bubbleRise linear infinite;
    }
    @keyframes bubbleRise {
      from { bottom: 0; opacity: 0.7; }
      to   { bottom: 100%; opacity: 0; transform: translateX(8px); }
    }
    .aerator-machine {
      width: 150px; height: 40px;
      background: linear-gradient(180deg, #3a4a5a, #2a3540);
      border-radius: 6px; display: flex; align-items: center;
      padding: 0 12px; gap: 10px; margin-top: 4px;
      border: 2px solid #4a6a7a;
    }
    .motor-body {
      width: 22px; height: 22px; border-radius: 50%;
      background: #607080; border: 3px solid #9ab0c0;
    }
    .motor-shaft {
      flex: 1; height: 6px; background: #607080; border-radius: 3px;
    }
    .aerator-machine.running .motor-body {
      background: #80c040; border-color: #a0ff60;
      box-shadow: 0 0 10px rgba(120, 255, 60, 0.6);
      animation: motorSpin 0.4s linear infinite;
    }
    @keyframes motorSpin {
      from { transform: rotate(0deg); } to { transform: rotate(360deg); }
    }

    .aerator-controls { flex: 1; min-width: 220px; }
    .toggle-label {
      display: flex; align-items: center; gap: 12px;
      font-size: 14px; font-weight: 600; color: #a0c8d8; margin-bottom: 18px;
    }
    .toggle-switch { position: relative; width: 46px; height: 24px; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; inset: 0; cursor: pointer;
      background: #2a3a4a; border-radius: 24px; transition: 0.3s;
    }
    .toggle-slider:before {
      content: ''; position: absolute;
      width: 18px; height: 18px; border-radius: 50%;
      background: #8090a0; left: 3px; top: 3px; transition: 0.3s;
    }
    .toggle-switch input:checked + .toggle-slider { background: #0a6040; }
    .toggle-switch input:checked + .toggle-slider:before {
      background: #40ff80; transform: translateX(22px);
      box-shadow: 0 0 8px rgba(60, 255, 100, 0.7);
    }
    .status-on  { color: #40ff80; font-weight: 800; }
    .status-off { color: #ff5540; font-weight: 800; }

    .duration-wrap label { font-size: 13px; color: #7090a0; margin-bottom: 8px; display: block; }
    .duration-wrap.locked { opacity: 0.4; pointer-events: none; }
    .duration-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
    .dur-btn {
      padding: 8px 14px; border-radius: 7px;
      border: 2px solid #1a3a5a; background: rgba(10, 25, 45, 0.8);
      color: #7090a0; cursor: pointer; font-size: 13px; transition: all 0.2s;
    }
    .dur-btn:hover { border-color: #0088cc; color: #00aaff; }
    .dur-btn.active { border-color: #00ccff; color: #00ccff; background: rgba(0, 150, 200, 0.12); }

    /* ── Results table ────────────────────────────────── */
    .results-grid {
      display: grid; gap: 1px; border-radius: 8px; overflow: hidden;
      border: 1px solid #1a3a5a; margin-bottom: 14px;
    }
    .results-header-row,
    .results-row {
      display: grid;
      grid-template-columns: 1.4fr 1.2fr 1.2fr 0.9fr 1fr 0.6fr;
      gap: 0; padding: 8px 12px; font-size: 13px; align-items: center;
    }
    .results-header-row {
      background: rgba(10, 40, 70, 0.9); color: #7090a0;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .results-row { background: rgba(8, 20, 38, 0.8); color: #c0d8e8; }
    .results-row:nth-child(even) { background: rgba(10, 25, 45, 0.8); }
    .results-row.pass  { border-left: 3px solid #2ecc71; }
    .results-row.fail  { border-left: 3px solid #e74c3c; }

    .compliance-banner {
      padding: 10px 16px; border-radius: 8px; font-size: 14px;
      margin-bottom: 12px; text-align: center;
    }
    .compliance-banner.compliant {
      background: rgba(30, 100, 40, 0.25); border: 1px solid #2ecc71; color: #80ee90;
    }
    .compliance-banner.not-compliant {
      background: rgba(100, 20, 20, 0.25); border: 1px solid #e74c3c; color: #ff8888;
    }

    .sim-conclusion {
      background: rgba(10, 30, 50, 0.8); border-left: 4px solid #1a6080;
      padding: 10px 14px; border-radius: 6px; font-size: 13px;
      color: #a0c8d8; line-height: 1.7; margin-bottom: 16px;
    }

    /* ── Eval question ────────────────────────────────── */
    .sim-question-wrap { border-top: 1px solid #1a3a5a; padding-top: 18px; }
    .sim-question {
      background: rgba(10, 25, 45, 0.8); border-left: 4px solid #e67e22;
      padding: 10px 14px; border-radius: 6px; font-size: 14px;
      color: #d8e8f0; margin-bottom: 12px; line-height: 1.6;
    }
    .sim-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
    .sim-option-btn {
      padding: 10px 14px; border-radius: 8px;
      border: 2px solid #1a3a5a; background: rgba(10, 25, 45, 0.8);
      color: #c0d8e8; cursor: pointer; text-align: left; font-size: 14px;
      transition: all 0.2s;
    }
    .sim-option-btn:hover:not(:disabled) { border-color: #00aaff; color: #00d4ff; }
    .sim-option-btn.correct { border-color: #2ecc71; background: rgba(30, 100, 40, 0.2); color: #80ee90; }
    .sim-option-btn.wrong   { border-color: #e74c3c; background: rgba(100, 20, 20, 0.2); color: #ff8888; }
    .sim-option-btn:disabled { opacity: 0.65; cursor: default; }

    .sim-feedback {
      padding: 10px 14px; border-radius: 6px; font-size: 13px;
      line-height: 1.6; margin-bottom: 8px;
    }
    .sim-feedback.hidden  { display: none; }
    .sim-feedback.correct { background: rgba(30, 100, 40, 0.2); border-left: 4px solid #2ecc71; color: #a0e8a0; }
    .sim-feedback.wrong   { background: rgba(100, 20, 20, 0.2); border-left: 4px solid #e74c3c; color: #ff9090; }

    /* ── Titration step ───────────────────────────────── */
    .titration-layout {
      display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;
      margin-bottom: 16px;
    }
    .tit-apparatus {
      display: flex; flex-direction: column; align-items: center; flex-shrink: 0;
    }
    .tit-label-sm { font-size: 11px; color: #6080a0; text-align: center; margin-bottom: 4px; }
    .tit-burette {
      width: 30px; height: 150px;
      border: 2px solid #5a7a9a; border-radius: 3px 3px 0 0;
      position: relative; overflow: hidden;
      background: rgba(5, 10, 20, 0.5);
    }
    .tit-burette-liquid {
      position: absolute; top: 0; left: 0; right: 0;
      background: linear-gradient(180deg, rgba(80,0,150,.9), rgba(160,0,230,.9));
      transition: height .4s ease;
    }
    .tit-burette-scale {
      position: absolute; right: 2px; top: 0; bottom: 0;
      display: flex; flex-direction: column; justify-content: space-between;
      font-size: 7px; color: rgba(255,255,255,.35); pointer-events: none; padding: 2px 0;
    }
    .tit-tip-col {
      display: flex; flex-direction: column; align-items: center; position: relative;
    }
    .tit-tip-line { width: 7px; height: 26px; background: linear-gradient(180deg,#4a6a8a,#3a5a7a); }
    .tit-drop {
      position: absolute; top: 18px;
      width: 10px; height: 13px;
      background: rgba(160, 0, 240, 0.9);
      border-radius: 50% 50% 60% 60%;
      opacity: 0;
    }
    @keyframes titDropFall {
      0%   { opacity: 1; transform: translateY(0)    scaleY(1);   }
      40%  { opacity: 1; transform: translateY(28px) scaleY(1.1); }
      100% { opacity: 0; transform: translateY(82px) scaleY(0.7); }
    }
    .tit-drop.falling { animation: titDropFall .55s ease-in forwards; }
    .tit-flask {
      width: 120px; height: 88px;
      border: 2px solid #5a7a9a; border-radius: 4px 4px 12px 12px;
      position: relative; overflow: hidden;
      background: rgba(5, 15, 25, 0.4);
    }
    .tit-flask-liquid {
      position: absolute; bottom: 0; left: 0; right: 0; height: 65%;
      transition: background 1s ease;
    }
    .tit-ripple {
      position: absolute; bottom: 62%; left: 50%; transform: translateX(-50%);
      width: 10px; height: 5px;
      border: 1.5px solid rgba(255,255,255,.45); border-radius: 50%;
      opacity: 0; pointer-events: none;
    }
    @keyframes rippleSpread {
      0%   { opacity: .8; transform: translateX(-50%) scale(1); }
      100% { opacity: 0;  transform: translateX(-50%) scale(5); }
    }
    .tit-ripple.ripple-active { animation: rippleSpread .5s ease-out forwards; }
    .tit-vol-display { font-size: 12px; color: #7090a0; margin-top: 7px; text-align: center; }
    .tit-vol-display span { font-size: 15px; font-weight: 700; color: #90b8d0; }
    .tit-panel { flex: 1; min-width: 200px; }
    .tit-reagent-box {
      display: flex; gap: 10px; align-items: flex-start;
      background: rgba(70,0,120,.12); border: 1px solid rgba(120,0,200,.3);
      border-radius: 8px; padding: 10px 12px; margin-bottom: 14px;
      font-size: 13px; color: #b0a0d0; line-height: 1.5;
    }
    .tit-reagent-dot {
      width: 18px; height: 18px; border-radius: 50%;
      background: rgba(140,0,220,.85); border: 1px solid rgba(200,100,255,.5);
      flex-shrink: 0; margin-top: 2px;
    }
    .tit-status {
      background: rgba(10,25,45,.7); border-left: 3px solid rgba(120,0,200,.5);
      padding: 9px 12px; border-radius: 5px;
      font-size: 13px; color: #a090c0; margin-bottom: 14px; line-height: 1.5;
    }
    .tit-ep-notice {
      background: rgba(30,80,40,.25); border: 1px solid #2ecc71; color: #80ee90;
      padding: 9px 12px; border-radius: 7px; font-size: 13px; margin-bottom: 14px;
    }
    .tit-ep-notice.hidden { display: none; }
    .tit-drop-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .tit-btn {
      padding: 10px 18px; border-radius: 9px; border: none; cursor: pointer;
      font-size: 14px; font-weight: 700; transition: all .2s;
    }
    .tit-primary   { background: linear-gradient(135deg,#1a4a8a,#1a6aaa); color: #fff; }
    .tit-primary:hover:not(:disabled)   { filter: brightness(1.2); }
    .tit-secondary { background: rgba(50,20,80,.7); border: 1px solid rgba(120,0,200,.5); color:#c090e0; }
    .tit-secondary:hover:not(:disabled) { border-color: rgba(180,60,255,.7); color:#d8b0ff; }
    .tit-btn:disabled { opacity: .4; cursor: default; }
    .tit-results { margin-top: 20px; }
    .tit-results.hidden { display: none; }
    .tit-results-heading {
      font-size: 14px; font-weight: 700; color: #60b0d0;
      margin-bottom: 12px; padding-top: 16px; border-top: 1px solid #1a3a5a;
    }
  `;

  const style = document.createElement('style');
  style.id = 'sim-styles';
  style.textContent = css;
  document.head.appendChild(style);
}
