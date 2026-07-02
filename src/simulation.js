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
      <!-- Header with Reset Button -->
      <div class="sim-header">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px;">
          <div>
            <span class="sim-badge">🔬 SIMULASI LAB</span>
          </div>
          <button class="sim-btn-reset" id="btn-sim-reset" title="Reset seluruh simulasi">🔄 Reset</button>
        </div>
        <h2 class="sim-title">Pengolahan Limbah Vinasse</h2>
        <p class="sim-subtitle">Ukur TDS, DO & pH — lalu uji efektivitas aerasi</p>
      </div>

      <!-- Persistent Beaker Container (stays visible across transitions) -->
      <div class="sim-persistent-beaker" id="persistent-beaker-zone">
        <div class="beaker-pour-row">
          <div class="beaker-drop-zone" id="beaker-drop-zone">
            <div class="beaker-drops" id="beaker-drops"></div>
            <div class="beaker-wrap">
              <div class="beaker" style="position: relative;">
                <div class="beaker-vinasse" id="beaker-vinasse"></div>
                <div class="beaker-water"   id="beaker-water"></div>
                <div class="beaker-scale">
                  ${[1000,800,600,400,200,0].map(l => `<span>${l}</span>`).join('')}
                </div>
                <!-- Bubble container for aerator visualization in Step 3 -->
                <div class="bubble-container" id="bubble-container"></div>
              </div>
            </div>
          </div>
          <div class="pour-readout">
            <div class="vol-display" id="vol-display">
              <div class="vol-display-row">
                <span class="vol-display-icon">🟤</span>
                <span><b><span id="vol-display-num">0</span> mL</b> Vinasse</span>
              </div>
              <div class="vol-display-row secondary">
                <span class="vol-display-icon">💧</span>
                <span><span id="vol-display-water">1000</span> mL Air Suling</span>
              </div>
            </div>
            <div class="beaker-drop-label" id="beaker-drop-label">Jatuhkan di sini</div>
            <div class="vol-legend" style="margin-top:10px">
              <span class="legend-box water-box"></span> Air suling
              <span class="legend-box vinasse-box"></span> Vinasse
            </div>
          </div>
        </div>
      </div>

      <!-- Step 1: Multi-glass drag-to-pour -->
      <div class="sim-step" id="sim-step-1">
        <div class="step-title">
          <span class="step-num">1</span>
          Tuangkan Vinasse ke dalam Beker — seret gelas ke beker
        </div>
        <!-- Row of vinasse glasses (5 × 200 mL) -->
        <div class="glasses-row-wrap">
          <div class="glasses-row" id="glasses-row">
            ${[0,1,2,3,4].map(i => `
              <div class="vinasse-glass" id="vglass-${i}" data-idx="${i}">
                <div class="vg-liquid" id="vglass-liq-${i}"></div>
                <div class="vg-label">200 mL</div>
              </div>
            `).join('')}
          </div>
          <div class="glasses-hint">↙️ Seret gelas ke BEKER KANAN untuk menuangkan vinasse</div>
        </div>
        <button class="sim-btn" id="btn-titrate" disabled>📏 Ukur Parameter →</button>
      </div>

      <!-- Step 2: TDS/DO Meter dip -->
      <div class="sim-step hidden" id="sim-step-2">
        <div class="step-title">
          <span class="step-num">2</span>
          Ukur Parameter — Celupkan TDS/DO Meter ke Beaker
        </div>
        <div class="meter-layout">
          <!-- Instruction -->
          <div class="meter-instruction" id="meter-instruction">
            ⤵️ Seret probe sensor ke BEAKER untuk mengukur TDS · DO · pH · SAL
          </div>
          <!-- Instrument row: display unit + cable + probe (positioned to interact with persistent beaker) -->
          <div class="meter-instrument-row-step2">
            <!-- Display unit (left stick, static) -->
            <div class="meter-display-unit">
              <div class="mdu-head">
                <div class="mdu-brand">TDS · DO · pH · SAL</div>
                <div class="mdu-screen">
                  <div class="mr-row"><span class="mr-lbl">DO</span><span class="mr-val" id="mr-do">—</span><span class="mr-unit">ppm</span></div>
                  <div class="mr-row"><span class="mr-lbl">TDS</span><span class="mr-val" id="mr-tds">—</span><span class="mr-unit">ppm</span></div>
                  <div class="mr-row"><span class="mr-lbl">pH</span><span class="mr-val" id="mr-ph">—</span></div>
                  <div class="mr-row"><span class="mr-lbl">SAL</span><span class="mr-val" id="mr-sal">—</span><span class="mr-unit">‰</span></div>
                </div>
              </div>
              <div class="mdu-stick"></div>
            </div>
            <!-- Cable (decorative) -->
            <svg class="meter-cable-svg" viewBox="0 0 80 40" preserveAspectRatio="none">
              <path d="M0,20 C20,6 60,34 80,20" stroke="#3a7a9a" stroke-width="2.5" fill="none" stroke-dasharray="5,4"/>
            </svg>
            <!-- Probe stick only (beaker is the persistent one above) -->
            <div class="meter-probe-stick" id="meter-probe-stick" title="Seret ke dalam larutan">
              <div class="mps-handle">⊕</div>
              <div class="mps-shaft"></div>
              <div class="mps-tip"></div>
            </div>
          </div>
          <!-- Results appear below after measurement -->
          <div class="meter-result-grid hidden" id="meter-result-grid"></div>
          <div class="meter-note hidden" id="meter-note"></div>
          <button class="sim-btn hidden" id="btn-go-aerate">💨 Lanjut ke Simulasi Aerasi →</button>
        </div>
      </div>

      <!-- Step 3: Aeration -->
      <div class="sim-step hidden" id="sim-step-3">
        <div class="step-title">
          <span class="step-num">3</span>
          Simulasi Aerasi Biodegradasi pada Beaker
        </div>

        <div class="aerator-controls-layout">
          <!-- Aerator controls (positioned above persistent beaker) -->
          <div class="aerator-controls">
            <label class="toggle-label">
              <span>Nyalakan Aerator</span>
              <label class="toggle-switch">
                <input type="checkbox" id="aerator-toggle">
                <span class="toggle-slider"></span>
              </label>
              <span id="aerator-status" class="status-off">MATI</span>
            </label>

            <div class="duration-wrap" id="duration-wrap">
              <label>Pilih Durasi Aerasi</label>
              <div class="duration-buttons">
                ${[6, 12, 24, 48, 72].map(h => `
                  <button class="dur-btn" data-hours="${h}">${h} jam</button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Aerator visual indicator (displayed above persistent beaker) -->
          <div class="aerator-visual-indicator" id="aerator-visual">
            <div class="aerator-machine" id="aerator-machine">
              <div class="motor-body"></div>
              <div class="motor-shaft"></div>
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
  let selectedVol   = 0;
  let initialData   = null;
  let selectedHours = null;
  let aeratorOn     = false;
  let pourCleanup   = null;  // cleanup drag listeners when leaving step 1

  // ── Step 1: multi-glass drag-to-pour ──
  {
    const GLASS_COUNT = 5;
    const GLASS_VOL   = 200;  // mL per glass
    const POUR_RATE   = 25;   // mL added per tick
    const TICK_MS     = 80;   // ms between ticks
    const glassVolumes = Array(GLASS_COUNT).fill(GLASS_VOL);

    selectedVol = 0;
    updateBeaker(0);

    // Ghost glass: follows cursor during drag (appended to body to escape overflow clipping)
    const ghost = document.createElement('div');
    ghost.id        = 'vg-ghost';
    ghost.className = 'vg-ghost hidden';
    ghost.innerHTML = '<div class="vg-ghost-liquid" id="vg-ghost-liquid"></div>';
    document.body.appendChild(ghost);

    let draggingIdx  = null;
    let pourInterval = null;
    let dropInterval = null;
    let isOverBeaker = false;

    function updateDisplay() {
      document.getElementById('vol-display-num').textContent   = selectedVol;
      document.getElementById('vol-display-water').textContent = 1000 - selectedVol;
    }

    function updateGlassVisual(i) {
      const liq = document.getElementById(`vglass-liq-${i}`);
      const el  = document.getElementById(`vglass-${i}`);
      if (!liq || !el) return;
      liq.style.height = (glassVolumes[i] / GLASS_VOL * 100) + '%';
      if (glassVolumes[i] <= 0) { el.classList.add('empty'); el.classList.remove('dragging'); }
    }

    function spawnDrop() {
      const dz = document.getElementById('beaker-drops');
      if (!dz) return;
      const drop = document.createElement('div');
      drop.className = 'sim-drop';
      drop.style.setProperty('--spread', ((Math.random() - 0.5) * 10) + 'px');
      drop.style.setProperty('--dur',    (0.28 + Math.random() * 0.24) + 's');
      dz.appendChild(drop);
      setTimeout(() => drop.remove(), 600);
    }

    function startPour() {
      if (pourInterval || draggingIdx === null) return;
      pourInterval = setInterval(() => {
        if (draggingIdx === null || glassVolumes[draggingIdx] <= 0 || selectedVol >= 1000) {
          stopPour(); return;
        }
        const add = Math.min(POUR_RATE, glassVolumes[draggingIdx], 1000 - selectedVol);
        glassVolumes[draggingIdx] -= add;
        selectedVol = Math.min(1000, selectedVol + add);
        updateBeaker(selectedVol);
        updateDisplay();
        $('btn-titrate').disabled = false;
        const gl = document.getElementById('vg-ghost-liquid');
        if (gl) gl.style.height = (glassVolumes[draggingIdx] / GLASS_VOL * 100) + '%';
        updateGlassVisual(draggingIdx);
      }, TICK_MS);
      dropInterval = setInterval(spawnDrop, 55);
    }

    function stopPour() {
      clearInterval(pourInterval);
      clearInterval(dropInterval);
      pourInterval = dropInterval = null;
    }

    function moveGhost(cx, cy) {
      ghost.style.left = (cx - 18) + 'px';
      ghost.style.top  = (cy - 64) + 'px';
      const dz = document.getElementById('beaker-drop-zone');
      if (!dz) return;
      const r = dz.getBoundingClientRect();
      const over = cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
      if (over !== isOverBeaker) {
        isOverBeaker = over;
        dz.classList.toggle('active', over);
        ghost.classList.toggle('tilting', over);
        if (over) startPour(); else stopPour();
      }
    }

    function startDrag(i, cx, cy) {
      if (glassVolumes[i] <= 0) return;
      draggingIdx = i;
      isOverBeaker = false;
      document.getElementById(`vglass-${i}`)?.classList.add('dragging');
      ghost.classList.remove('hidden');
      const gl = document.getElementById('vg-ghost-liquid');
      if (gl) gl.style.height = (glassVolumes[i] / GLASS_VOL * 100) + '%';
      moveGhost(cx, cy);
    }

    function endDrag() {
      if (draggingIdx === null) return;
      stopPour();
      updateGlassVisual(draggingIdx);
      document.getElementById(`vglass-${draggingIdx}`)?.classList.remove('dragging');
      draggingIdx = null;
      isOverBeaker = false;
      ghost.classList.add('hidden');
      ghost.classList.remove('tilting');
      document.getElementById('beaker-drop-zone')?.classList.remove('active');
      const lbl = document.getElementById('beaker-drop-label');
      if (lbl) lbl.textContent = selectedVol > 0
        ? `✓ ${selectedVol} mL dituang — seret gelas lagi untuk menambah`
        : 'Jatuhkan di sini';
    }

    for (let i = 0; i < GLASS_COUNT; i++) {
      const el = document.getElementById(`vglass-${i}`);
      if (!el) continue;
      el.addEventListener('mousedown',  e => { startDrag(i, e.clientX, e.clientY); e.preventDefault(); });
      el.addEventListener('touchstart', e => { startDrag(i, e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }, { passive: false });
    }

    function _onMouseMove(e) { if (draggingIdx !== null) moveGhost(e.clientX, e.clientY); }
    function _onMouseUp()    { endDrag(); }
    function _onTouchMove(e) { if (draggingIdx === null) return; moveGhost(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }
    function _onTouchEnd()   { endDrag(); }

    window.addEventListener('mousemove', _onMouseMove);
    window.addEventListener('mouseup',   _onMouseUp);
    window.addEventListener('touchmove', _onTouchMove, { passive: false });
    window.addEventListener('touchend',  _onTouchEnd);



    pourCleanup = () => {
      endDrag();
      window.removeEventListener('mousemove', _onMouseMove);
      window.removeEventListener('mouseup',   _onMouseUp);
      window.removeEventListener('touchmove', _onTouchMove);
      window.removeEventListener('touchend',  _onTouchEnd);
      const g = document.getElementById('vg-ghost');
      if (g) g.remove();
    };
  }

  // ── Step 1 → 2: Titrate (launches interactive titration) ──
  $('btn-titrate').onclick = () => {
    if (pourCleanup) { pourCleanup(); pourCleanup = null; }
    initialData = calcInitialParams(selectedVol);
    transitionStep('sim-step-1', 'sim-step-2');
    initMeterDip(selectedVol, initialData);
  };

  // ── Step 2 → 3: Go to aeration ──
  $('btn-go-aerate').onclick = () => {
    transitionStep('sim-step-2', 'sim-step-3');
    setAeratorLiquidColor(initialData);
  };

  // ── Reset button: Restart entire simulation ──
  $('btn-sim-reset').onclick = () => {
    // Clean up ghost glass and all event listeners
    const ghost = document.getElementById('vg-ghost');
    if (ghost) ghost.remove();
    if (pourCleanup) pourCleanup();
    $('sim-overlay').remove();
    showSimulation(onDone);
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
      $('btn-back-aerate').classList.remove('hidden');
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
// Meter readings lookup table (by vinasse volume)
// ─────────────────────────────────────────────────────────────────────────────
const METER_READINGS = {
  200: { doVal: 1.8, tds: 22,   ph: 2.2, sal: 13   },
  400: { doVal: 2.3, tds: 26,   ph: 2.8, sal: 13.8  },
  600: { doVal: 3.2, tds: 27,   ph: 3.0, sal: 14   },
  800: { doVal: 4.0, tds: 30.1, ph: 3.7, sal: 15   },
};

function getMeterReadings(vol) {
  const keys = [200, 400, 600, 800];
  if (vol <= 200) return { ...METER_READINGS[200] };
  if (vol >= 800) return { ...METER_READINGS[800] };
  let lo = 200, hi = 800;
  for (let i = 0; i < keys.length - 1; i++) {
    if (vol > keys[i] && vol <= keys[i + 1]) { lo = keys[i]; hi = keys[i + 1]; break; }
  }
  const t = (vol - lo) / (hi - lo);
  const a = METER_READINGS[lo], b = METER_READINGS[hi];
  return {
    doVal: parseFloat((a.doVal + (b.doVal - a.doVal) * t).toFixed(1)),
    tds:   parseFloat((a.tds   + (b.tds   - a.tds)   * t).toFixed(1)),
    ph:    parseFloat((a.ph    + (b.ph    - a.ph)     * t).toFixed(1)),
    sal:   parseFloat((a.sal   + (b.sal   - a.sal)    * t).toFixed(1)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TDS/DO Meter dip — Step 2
// ─────────────────────────────────────────────────────────────────────────────
function initMeterDip(vol, initialData) {
  const vinPct  = vol / 1000 * 100;
  const bkV     = $('meter-bk-vinasse');
  if (bkV) bkV.style.height = vinPct + '%';
  const lbl = $('meter-vol-label');
  if (lbl) lbl.textContent = vol + ' mL';
  const rippleEl = $('meter-bk-ripple');

  const readings  = getMeterReadings(vol);
  const probeEl   = $('meter-probe-stick');
  const beakerEl  = $('beaker-drop-zone');  // Use persistent beaker for drop zone
  let   probeUsed = false;
  let   ghost     = null;

  function cleanupDrag() {
    if (ghost) { ghost.remove(); ghost = null; }
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup',   onUp);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend',  onUp);
  }

  function clientXY(e) {
    return e.changedTouches ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
         : e.touches        ? { x: e.touches[0].clientX,        y: e.touches[0].clientY }
                            : { x: e.clientX,                    y: e.clientY };
  }

  function onMove(e) {
    if (!ghost) return;
    const { x, y } = clientXY(e);
    ghost.style.left = (x - 15) + 'px';
    ghost.style.top  = (y - 12) + 'px';
    const r = beakerEl.getBoundingClientRect();
    beakerEl.classList.toggle('drop-hover', x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  }

  function onTouchMove(e) { e.preventDefault(); onMove(e); }

  function onUp(e) {
    if (!ghost) return;
    const { x, y } = clientXY(e);
    const r   = beakerEl.getBoundingClientRect();
    const hit = x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    cleanupDrag();
    beakerEl.classList.remove('drop-hover');
    if (hit && !probeUsed) {
      probeUsed = true;
      probeEl.classList.add('probe-dipped');
      triggerMeasurement();
    } else {
      probeEl.style.opacity = '1';
    }
  }

  function startDrag(e) {
    if (probeUsed) return;
    e.preventDefault();
    probeEl.style.opacity = '0.35';
    ghost = document.createElement('div');
    ghost.className = 'meter-probe-ghost';
    ghost.innerHTML = '<div class="mps-handle">⊕</div><div class="mps-shaft"></div><div class="mps-tip"></div>';
    const { x, y } = clientXY(e);
    ghost.style.left = (x - 15) + 'px';
    ghost.style.top  = (y - 12) + 'px';
    document.body.appendChild(ghost);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend',  onUp);
  }

  function triggerMeasurement() {
    $('meter-instruction').textContent = 'Sensor mendeteksi parameter larutan…';

    setTimeout(() => {
      if (rippleEl) {
        rippleEl.classList.remove('ripple-active');
        void rippleEl.offsetWidth;
        rippleEl.classList.add('ripple-active');
      }
    }, 300);

    setTimeout(() => {
      countUpMeterVal('mr-do',  readings.doVal, 1200, 1);
      countUpMeterVal('mr-tds', readings.tds,   1200, 1);
      countUpMeterVal('mr-ph',  readings.ph,    1200, 2);
      countUpMeterVal('mr-sal', readings.sal,   1200, 1);
    }, 500);

    setTimeout(() => {
      $('meter-instruction').textContent = '✅ Pengukuran selesai — catat hasil parameter!';

      const grid = $('meter-result-grid');
      grid.innerHTML = [
        { icon: '💧', label: 'DO',          value: readings.doVal.toFixed(1) + ' ppm', sub: 'Dissolved Oxygen',      status: readings.doVal < 2 ? 'danger' : readings.doVal < 4 ? 'warn' : 'good' },
        { icon: '📊', label: 'TDS',         value: readings.tds.toFixed(1)   + ' ppm', sub: 'Total Dissolved Solids', status: readings.tds > 30 ? 'danger' : readings.tds > 25 ? 'warn' : 'good' },
        { icon: '⚗️', label: 'pH',          value: readings.ph.toFixed(1),             sub: readings.ph < 4 ? 'Sangat Asam ⚠️' : readings.ph < 6 ? 'Asam' : 'Mendekati Netral', status: readings.ph < 4 ? 'danger' : readings.ph < 6 ? 'warn' : 'good' },
        { icon: '🧂', label: 'Salinometer', value: readings.sal.toFixed(1)   + ' ‰',  sub: 'Kadar salinitas',        status: readings.sal > 15 ? 'danger' : readings.sal > 13 ? 'warn' : 'good' },
      ].map(p => `
        <div class="param-card ${p.status}">
          <span class="param-icon">${p.icon}</span>
          <span class="param-label">${p.label}</span>
          <span class="param-value">${p.value}</span>
          <span class="param-sub">${p.sub}</span>
        </div>
      `).join('');
      grid.classList.remove('hidden');

      const noteEl = $('meter-note');
      noteEl.innerHTML = `⚗️ <strong>Interpretasi:</strong> Dengan ${vol} mL vinasse,
        DO = <b>${readings.doVal.toFixed(1)} ppm</b>, TDS = <b>${readings.tds.toFixed(1)} ppm</b>,
        pH = <b>${readings.ph.toFixed(1)}</b> (${readings.ph < 4 ? 'sangat asam' : 'asam'}),
        Salinometer = <b>${readings.sal.toFixed(1)} ‰</b>.
        <div class="meter-source">📄 Sumber: Irmanto, et al. (2013)</div>`;
      noteEl.classList.remove('hidden');

      $('btn-go-aerate').classList.remove('hidden');
      $('btn-back-meter').classList.remove('hidden');
      setTimeout(() => $('btn-go-aerate').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    }, 1800);
  }

  probeEl.addEventListener('mousedown',  startDrag);
  probeEl.addEventListener('touchstart', startDrag, { passive: false });
}

function countUpMeterVal(id, to, durationMs, decimals) {
  const el = $(id);
  if (!el) return;
  const startTs = performance.now();
  const ease    = t => 1 - (1 - t) ** 2;
  function frame(now) {
    const t = Math.min(1, (now - startTs) / durationMs);
    el.textContent = (to * ease(t)).toFixed(decimals);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
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
// Aerator liquid colour (apply to persistent beaker)
// ─────────────────────────────────────────────────────────────────────────────
function setAeratorLiquidColor(data) {
  const el = $('beaker-vinasse');  // Apply to persistent beaker's vinasse element
  if (!el) return;
  // Dark brown for high COD, lighter for more dilute
  const ratio = Math.min(1, data.cod / 45000);
  const r = Math.round(60 + ratio * 60);
  const g = Math.round(20 + ratio * 5);
  const b = 0;
  el.style.background = `linear-gradient(180deg, rgba(${r},${g},${b},0.88) 0%, rgba(${Math.max(30, r-30)},${Math.max(10, g-10)},0,0.96) 100%)`;
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
  const grid   = $('results-grid');
  const banner = $('compliance-banner');
  const concl  = $('sim-conclusion');

  const r = getMeterReadings(vol);

  grid.innerHTML = `
    <div class="param-grid" style="margin-bottom:0">
      <div class="param-card neutral">
        <span class="param-icon">🧪</span>
        <span class="param-label">Vinasse Dituang</span>
        <span class="param-value">${vol} mL</span>
        <span class="param-sub">dari 1 000 mL total larutan</span>
      </div>
      <div class="param-card ${r.doVal < 2 ? 'danger' : r.doVal < 4 ? 'warn' : 'good'}">
        <span class="param-icon">📏</span>
        <span class="param-label">Hasil TDS/DO Meter</span>
        <span class="param-value">DO ${r.doVal.toFixed(1)} ppm</span>
        <span class="param-sub">TDS ${r.tds.toFixed(1)} ppm · pH ${r.ph.toFixed(1)} · SAL ${r.sal.toFixed(1)} ‰</span>
      </div>
      <div class="param-card neutral">
        <span class="param-icon">⏱️</span>
        <span class="param-label">Durasi Aerasi</span>
        <span class="param-value">${hours} Jam</span>
        <span class="param-sub">simulasi aerasi aerobik</span>
      </div>
    </div>
  `;

  banner.className = 'compliance-banner ' + (result.compliant ? 'compliant' : 'not-compliant');
  banner.innerHTML = result.compliant
    ? '✅ Effluent <strong>MEMENUHI</strong> baku mutu Permen LH No.5/2014 setelah aerasi!'
    : '⛔ Effluent <strong>BELUM MEMENUHI</strong> baku mutu — perlu pengolahan lanjut atau durasi aerasi lebih panjang.';

  concl.innerHTML = `
    <strong>📝 Kesimpulan:</strong> Dengan volume vinasse <b>${vol} mL</b> dan aerasi selama
    <b>${hours} jam</b>, pH meningkat dari <b>${initial.ph}</b> menjadi <b>${result.ph}</b>
    karena asam organik teroksidasi oleh mikroba aerob.
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
// Step transition helper – smooth with beaker continuity
// ─────────────────────────────────────────────────────────────────────────────
function transitionStep(fromId, toId) {
  const fromEl = $(fromId);
  const toEl   = $(toId);

  // Special handling: Step 1→2 smoothly transitions glasses away
  if (fromId === 'sim-step-1' && toId === 'sim-step-2') {
    const glassesRow = $('glasses-row-wrap');
    const titratBtn = $('btn-titrate');

    // Fade out glasses and button
    if (glassesRow) {
      glassesRow.style.opacity = '0';
      glassesRow.style.transform = 'translateY(-12px)';
      glassesRow.style.transition = 'all 0.3s ease';
      glassesRow.style.pointerEvents = 'none';
    }

    if (titratBtn) {
      titratBtn.style.opacity = '0';
      titratBtn.style.transform = 'translateY(8px)';
      titratBtn.style.transition = 'all 0.3s ease';
      titratBtn.style.pointerEvents = 'none';
    }

    // Hide Step 1 content, show Step 2
    setTimeout(() => {
      fromEl.classList.add('hidden');
      
      toEl.classList.remove('hidden');
      toEl.classList.add('step-enter');
      setTimeout(() => toEl.classList.remove('step-enter'), 400);
    }, 300);
  } else {
    // Standard transition for other steps
    fromEl.classList.add('step-exit');
    setTimeout(() => {
      fromEl.classList.add('hidden');
      fromEl.classList.remove('step-exit');
      toEl.classList.remove('hidden');
      toEl.classList.add('step-enter');
      setTimeout(() => toEl.classList.remove('step-enter'), 400);
    }, 300);
  }
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
      max-height: 85vh;
      overflow-y: auto;
    }
    .sim-header {
      text-align: center;
      margin-bottom: 28px;
      position: sticky;
      top: 0;
      background: rgba(12, 22, 40, 0.98);
      z-index: 10;
      padding-bottom: 12px;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(80, 120, 160, 0.2);
    }
    .sim-badge {
      background: rgba(0, 200, 255, 0.15);
      border: 1px solid #00c8ff;
      color: #00c8ff; padding: 4px 14px;
      border-radius: 20px; font-size: 12px; letter-spacing: 1px;
    }
    .sim-title { margin: 10px 0 4px; font-size: 22px; color: #a0d8ff; }
    .sim-subtitle { color: #7090a0; font-size: 13px; }

    /* ── Persistent Beaker Zone (stays visible across transitions) ────────── */
    .sim-persistent-beaker {
      margin: 20px 0;
      padding: 14px;
      background: rgba(10, 20, 30, 0.5);
      border: 1px solid rgba(80, 120, 160, 0.2);
      border-radius: 10px;
      transition: all 0.3s ease;
    }
    .sim-persistent-beaker.hidden { display: none; }

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

    /* ── Beaker continuity transitions ─────────────────── */
    .glasses-row-wrap { transition: opacity 0.3s ease, transform 0.3s ease; }
    .glasses-row-wrap.fade-out { opacity: 0; transform: translateY(-8px); }
    .glasses-hint { transition: opacity 0.3s ease; }
    .glasses-hint.fade-out { opacity: 0; }

    /* ── Volume buttons (kept for compat) ────────────── */
    .volume-selector { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
    .vol-btn {
      padding: 10px 18px; border-radius: 8px; border: 2px solid #1a4a6a;
      background: rgba(10, 30, 55, 0.8); color: #7ab0d8; cursor: pointer;
      font-size: 14px; font-weight: 600; transition: all 0.2s;
    }
    .vol-btn:hover { border-color: #00aaff; color: #00aaff; }
    .vol-btn.active { border-color: #00d4ff; color: #00d4ff; background: rgba(0,180,255,0.1); }

    /* ── Multi-glass drag-to-pour mechanic ─────────────── */
    .glasses-row-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px; }
    .glasses-row { display: flex; gap: 8px; align-items: flex-end; }
    .glasses-hint { font-size: 11px; color: #4a7a9a; font-style: italic; text-align: center; }
    .vinasse-glass {
      position: relative; width: 38px; height: 56px;
      border: 2px solid #7a3818; border-top: none; border-radius: 0 0 6px 6px;
      background: rgba(18, 6, 0, 0.82); overflow: hidden;
      cursor: grab; transition: box-shadow 0.2s, border-color 0.2s, opacity 0.3s;
      user-select: none;
    }
    .vinasse-glass:not(.empty):hover { box-shadow: 0 0 8px rgba(180,80,20,0.5); border-color: #bb6020; }
    .vinasse-glass.empty { opacity: 0.28; cursor: not-allowed; border-color: #3a2010; }
    .vinasse-glass.dragging { opacity: 0.45; cursor: grabbing; }
    .vg-liquid {
      position: absolute; bottom: 0; left: 0; right: 0; height: 85%;
      background: linear-gradient(180deg, rgba(195,78,5,0.88) 0%, rgba(120,36,0,0.96) 100%);
      transition: height 0.18s ease;
    }
    .vg-label {
      position: absolute; bottom: 2px; left: 0; right: 0;
      font-size: 7px; text-align: center; color: rgba(255,205,145,0.85);
      font-weight: 700; pointer-events: none; z-index: 2;
    }
    .vg-ghost {
      position: fixed; z-index: 9999; pointer-events: none;
      width: 38px; height: 56px;
      border: 2px solid #ff7020; border-top: none; border-radius: 0 0 8px 8px;
      background: rgba(18, 6, 0, 0.92); overflow: hidden;
      transform-origin: bottom center; transition: transform 0.18s;
      box-shadow: 0 0 16px rgba(220,100,20,0.7);
    }
    .vg-ghost.tilting { transform: rotate(-42deg); }
    .vg-ghost-liquid {
      position: absolute; bottom: 0; left: 0; right: 0;
      background: linear-gradient(180deg, rgba(200,85,5,0.9) 0%, rgba(140,40,0,0.97) 100%);
      transition: height 0.18s ease;
    }
    .beaker-pour-row { display: flex; align-items: flex-end; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; }
    .beaker-drop-zone {
      position: relative; padding: 10px 12px;
      border: 2px dashed rgba(80,120,160,0.3); border-radius: 12px;
      transition: border-color 0.2s, background 0.2s;
    }
    .beaker-drop-zone.active {
      border-color: rgba(0,210,120,0.75); background: rgba(0,80,55,0.14);
    }
    .beaker-drops {
      position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
      width: 30px; height: 40px; pointer-events: none; overflow: visible;
    }
    .beaker-drop-label { font-size: 10px; color: #4a6a8a; font-style: italic; text-align: center; margin-top: 4px; }
    .pour-readout { display: flex; flex-direction: column; gap: 8px; }
    .vol-display {
      background: rgba(10,25,45,0.9); border-radius: 10px; padding: 12px 16px;
      border: 1px solid #1a4a6a; min-width: 150px;
    }
    .vol-display-row { display: flex; align-items: center; gap: 8px; color: #a0c8e0; font-size: 14px; font-weight: 600; }
    .vol-display-row.secondary { margin-top: 6px; color: #607890; font-size: 13px; font-weight: 400; }
    .vol-display-icon { font-size: 18px; }
    .vol-display-tip { font-size: 11px; color: #4a7090; margin-top: 8px; font-style: italic; }
    .sim-btn-sm {
      padding: 6px 14px; border-radius: 8px;
      background: transparent; color: #607890;
      border: 1.5px solid #2a4a6a; font-size: 12px;
      cursor: pointer; transition: all 0.2s;
    }
    .sim-btn-sm:hover { border-color: #4a7a9a; color: #aac8e0; }
    .sim-drop {
      position: absolute; width: 5px; height: 9px;
      border-radius: 50% 50% 45% 45%; background: rgba(160, 65, 0, 0.92);
      left: calc(50% + var(--spread, 0px)); transform: translateX(-50%);
      animation: simDropFall var(--dur, 0.45s) ease-in forwards;
    }
    @keyframes simDropFall {
      from { transform: translateX(-50%) translateY(0);    opacity: 1; }
      to   { transform: translateX(-50%) translateY(80px); opacity: 0; }
    }

    /* ── Beaker visualisation ─────────────────────────── */
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

    /* ── Reset button ────────────────────────────────── */
    .sim-btn-reset {
      padding: 7px 16px; border-radius: 8px;
      background: rgba(100, 60, 60, 0.6);
      color: #d0a0a0; font-size: 13px; font-weight: 600;
      border: 1.5px solid rgba(200, 100, 100, 0.4);
      cursor: pointer; transition: all 0.2s;
    }
    .sim-btn-reset:hover {
      background: rgba(140, 80, 80, 0.8);
      border-color: rgba(220, 120, 120, 0.7);
      color: #ff9999;
    }

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

    /* ── Aerator panel (legacy - keeping for compat) ────────── */
    .aerator-panel { display: flex; gap: 28px; align-items: flex-start; flex-wrap: wrap; }
    
    /* ── Aerator controls layout (new - with persistent beaker) ──*/
    .aerator-controls-layout { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .aerator-visual-indicator { margin: 12px 0; }

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

    /* ── TDS/DO Meter (two-stick design) ────────────── */
    .meter-layout { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
    .meter-instrument-row { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
    .meter-instrument-row-step2 { display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
    /* --- Display unit (left stick) --- */
    .meter-display-unit { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
    .mdu-head {
      width: 108px; background: linear-gradient(180deg,#0a1e2e,#102838);
      border: 2px solid #2a6a7a; border-radius: 7px 7px 4px 4px;
      padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 5px;
    }
    .mdu-brand { font-size: 8px; color: #2a9a7a; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
    .mdu-screen {
      width: 100%; background: #040e06; border: 1px solid #1a4a2a;
      border-radius: 4px; padding: 5px 7px; display: flex; flex-direction: column; gap: 3px;
    }
    .mdu-stick { width: 14px; height: 68px; background: linear-gradient(180deg,#2a5a7a,#1a3a5a); border: 1px solid #3a7a9a; border-top: none; border-radius: 0 0 5px 5px; }
    .mr-row  { display: flex; align-items: baseline; gap: 3px; }
    .mr-lbl  { color: #2a8a5a; width: 26px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; flex-shrink: 0; }
    .mr-val  { color: #00ff8a; font-size: 16px; font-weight: 900; font-family: monospace; min-width: 36px; text-align: right; }
    .mr-unit { color: #2a7a5a; font-size: 9px; }
    /* --- Decorative cable --- */
    .meter-cable-svg { width: 80px; height: 40px; flex-shrink: 0; }
    /* --- Probe stick (no beaker, just probe) --- */
    .meter-probe-stick {
      display: flex; flex-direction: column; align-items: center;
      cursor: grab; user-select: none; transition: opacity 0.2s;
    }
    .meter-probe-stick:active { cursor: grabbing; }
    .meter-probe-stick.probe-dipped { opacity: 0.45; cursor: not-allowed; }
    .mps-handle {
      width: 30px; height: 22px;
      background: linear-gradient(180deg,#3a6a8a,#2a5a7a);
      border: 1.5px solid #4a8a9a; border-radius: 4px 4px 2px 2px;
      display: flex; align-items: center; justify-content: center; font-size: 12px; color: #88ccdd;
    }
    .mps-shaft { width: 6px; height: 50px; background: linear-gradient(180deg,#4a8aaa,#2a6a8a); border-left: 1px solid #5a9aaa; border-right: 1px solid #2a6a7a; }
    .mps-tip { width: 14px; height: 14px; background: radial-gradient(circle,#40ffaa,#00cc80); border-radius: 50%; box-shadow: 0 0 8px rgba(0,220,130,0.8); }
    /* Ghost (follows cursor while dragging) */
    .meter-probe-ghost { position: fixed; pointer-events: none; z-index: 9999; display: flex; flex-direction: column; align-items: center; }
    /* Beaker / drop zone */
    .meter-beaker-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .meter-beaker {
      position: relative; width: 86px; height: 110px;
      border: 2.5px solid #4a8a9a; border-top: none; border-radius: 0 0 10px 10px;
      overflow: hidden; background: rgba(8,22,35,0.5); transition: border-color 0.2s;
    }
    .meter-beaker.drop-hover { border-color: #00ff8a; box-shadow: 0 0 10px rgba(0,255,138,0.4); }
    .meter-bk-vinasse { position: absolute; bottom: 0; left: 0; right: 0; height: 0%; background: rgba(100,38,0,0.88); transition: height 0.6s ease; }
    .meter-bk-scale {
      position: absolute; right: 3px; top: 0; bottom: 0;
      display: flex; flex-direction: column; justify-content: space-between;
      font-size: 7px; color: #88aaaa; pointer-events: none; padding: 2px 0;
    }
    .meter-bk-ripple {
      position: absolute; left: 50%; transform: translateX(-50%);
      width: 16px; height: 8px; border: 1.5px solid rgba(255,255,255,0.55); border-radius: 50%;
      opacity: 0; pointer-events: none;
    }
    @keyframes rippleMeter {
      0%   { opacity: 0.9; transform: translateX(-50%) scale(1); }
      100% { opacity: 0;   transform: translateX(-50%) scale(5); }
    }
    .meter-bk-ripple.ripple-active { animation: rippleMeter 0.55s ease-out forwards; }
    .meter-bk-label { font-size: 11px; color: #4a7a9a; text-align: center; }
    .meter-instruction {
      background: rgba(10,25,45,0.7); border-left: 3px solid #1a6a8a;
      padding: 9px 12px; border-radius: 5px; font-size: 13px; color: #80a8c0; line-height: 1.5;
    }
    .meter-result-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 10px; }
    .meter-result-grid.hidden { display: none; }
    .meter-note {
      background: rgba(10,30,50,0.8); border-left: 4px solid #1a6a8a;
      padding: 10px 14px; border-radius: 6px; font-size: 13px; color: #a0c8d8; line-height: 1.6;
    }
    .meter-note.hidden { display: none; }
    .meter-source { margin-top: 7px; font-size: 11px; color: #4a7090; font-style: italic; }
    .sim-btn-back { display: inline-block; margin-top: 14px; margin-left: 8px; padding: 11px 20px; border-radius: 10px; background: rgba(100,100,100,0.3); color: #aaa; font-size: 14px; font-weight: 600; border: 1px solid rgba(100,100,100,0.5); cursor: pointer; transition: all 0.2s; }
    .sim-btn-back:hover { background: rgba(100,100,100,0.5); color: #ddd; }
    .sim-btn-back.hidden { display: none; }
    .sim-btn-back { display: inline-block; margin-top: 14px; padding: 11px 20px; border-radius: 10px; background: rgba(100,100,100,0.4); color: #ccc; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }
    .sim-btn-back:hover { background: rgba(120,120,120,0.6); color: #fff; }
    .sim-btn-back.hidden { display: none; }
    .titration-layout {
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

    /* ── Valve titration controls ─────────────────────────── */
    .tit-valve-section { display:flex; flex-direction:column; gap:10px; }
    .tit-valve-visual {
      display:flex; align-items:center; gap:14px;
      background:rgba(5,15,30,0.7); border:1px solid #1a3a5a;
      border-radius:10px; padding:10px 14px;
    }
    .tit-valve-wheel {
      width:46px; height:46px; border-radius:50%;
      border:3px solid #2a4a6a; background:rgba(10,25,45,0.9);
      position:relative; flex-shrink:0;
      transition:border-color 0.2s, box-shadow 0.2s;
    }
    .tit-valve-wheel::before {
      content:''; position:absolute;
      width:80%; height:4px; background:#2a4a6a;
      top:50%; left:10%; transform:translateY(-50%);
      border-radius:2px; transition:background 0.2s;
    }
    .tit-valve-wheel::after {
      content:''; position:absolute;
      width:4px; height:80%; background:#2a4a6a;
      left:50%; top:10%; transform:translateX(-50%);
      border-radius:2px; transition:background 0.2s;
    }
    .tit-valve-wheel.slow {
      border-color:#0088ff;
      animation:valveSpin 1.4s linear infinite;
    }
    .tit-valve-wheel.slow::before, .tit-valve-wheel.slow::after { background:#0088ff; }
    .tit-valve-wheel.fast {
      border-color:#ff4400;
      animation:valveSpin 0.28s linear infinite;
      box-shadow:0 0 12px rgba(255,80,0,0.5);
    }
    .tit-valve-wheel.fast::before, .tit-valve-wheel.fast::after { background:#ff6600; }
    @keyframes valveSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    .tit-valve-info { flex:1; min-width:0; }
    .tit-valve-label {
      font-size:13px; font-weight:800; color:#6080a0;
      letter-spacing:1px; transition:color 0.2s; margin-bottom:2px;
    }
    .tit-valve-sublabel { font-size:11px; color:#405060; line-height:1.4; }
    .tit-flow-indicator { font-size:12px; color:#5070a0; display:flex; align-items:center; gap:6px; }
    .tit-hold-row { display:flex; gap:8px; }
    .tit-valve-slow, .tit-valve-fast {
      flex:1; padding:10px 12px; border-radius:9px;
      font-size:13px; font-weight:700; cursor:pointer;
      transition:all 0.15s; user-select:none; -webkit-user-select:none;
    }
    .tit-valve-slow {
      background:linear-gradient(135deg,#0a3060,#0a5080);
      color:#70ccff; border:1px solid #0a60a0;
    }
    .tit-valve-slow:active { background:linear-gradient(135deg,#0a4080,#0a70b0); box-shadow:0 0 10px rgba(0,150,255,0.4); }
    .tit-valve-fast {
      background:linear-gradient(135deg,#3a1010,#6a2010);
      color:#ff9060; border:1px solid #802010;
    }
    .tit-valve-fast:active { background:linear-gradient(135deg,#502020,#9a3020); box-shadow:0 0 10px rgba(255,100,0,0.4); }
    .tit-valve-slow:disabled, .tit-valve-fast:disabled { opacity:0.35; cursor:default; }
    .tit-warning {
      background:rgba(80,50,0,0.3); border:1px solid #c08020;
      color:#ffc040; border-radius:7px; padding:8px 12px;
      font-size:13px; font-weight:600;
    }
    .tit-warning.hidden { display:none; }
    .tit-overflow {
      background:rgba(100,10,10,0.35); border:1px solid #cc2020;
      border-radius:8px; padding:12px 14px;
      display:flex; flex-direction:column; gap:8px;
    }
    .tit-overflow.hidden { display:none; }
    .tit-overflow-msg { font-size:13px; font-weight:700; color:#ff7070; }
    .tit-overflow-sub { font-size:12px; color:#ff9090; line-height:1.5; }
    @keyframes flaskShake {
      0%,100% { transform:translateX(0); }
      15%  { transform:translateX(-5px) rotate(-1.5deg); }
      30%  { transform:translateX(5px)  rotate( 1.5deg); }
      50%  { transform:translateX(-4px) rotate(-1deg); }
      70%  { transform:translateX(4px); }
    }
    .tit-flask.overflow-shake {
      animation:flaskShake 0.5s ease-in-out;
      border-color:#cc2020 !important;
      box-shadow:0 0 18px rgba(200,30,30,0.6);
    }
    .overflow-particle {
      position:absolute; width:5px; height:9px;
      background:rgba(160,0,220,0.75); border-radius:50%;
      pointer-events:none;
      animation:overflowSpill 1.2s ease-out forwards;
    }
    @keyframes overflowSpill {
      0%   { transform:translateY(0)     scaleY(1);   opacity:0.85; }
      50%  { transform:translateY(-20px) scaleY(1.3); opacity:0.5; }
      100% { transform:translateY(-50px) scaleY(0.4); opacity:0; }
    }
    /* keep titration CSS class names but hide unused elements gracefully */
    .titration-layout, .tit-apparatus, .tit-panel,
    .tit-burette, .tit-flask, .tit-valve-section { display: none; }
  `;

  const style = document.createElement('style');
  style.id = 'sim-styles';
  style.textContent = css;
  document.head.appendChild(style);
}
