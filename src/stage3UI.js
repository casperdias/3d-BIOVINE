// ─────────────────────────────────────────────────────────────────────────────
// Stage 3 UI – Tantangan → Toko Mikroorganisme → Lab Kalkulasi → Kran Vinasse
// ─────────────────────────────────────────────────────────────────────────────
import { stage3Challenge, microorganisms, calcMicroDose } from './stages/stage3.js';
import { state } from './state.js';
import { updateHUD } from './ui.js';

const $ = id => document.getElementById(id);

// ─────────────────────────────────────────────────────────────────────────────
// Main entry – called from main.js after Level 2 simulation completes
// ─────────────────────────────────────────────────────────────────────────────
export function showStage3(onDone) {
  injectStage3CSS();
  removeOverlay();

  // Step 1: Challenge question → then shop
  showChallengePanel(() => {
    // Challenge done → open shop
    showShopPanel((purchasedId) => {
      // Shop done → lab calculation
      showLabPanel(purchasedId, () => {
        // Lab done → valve
        showValvePanel(onDone);
      });
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 – Challenge MCQ
// ─────────────────────────────────────────────────────────────────────────────
function showChallengePanel(onComplete) {
  const overlay = makeOverlay('s3-overlay');
  overlay.innerHTML = `
    <div class="s3-card" id="s3-challenge-card">
      <div class="s3-header">
        <span class="s3-badge">🧪 LEVEL 3 – MENEMUKAN SOLUSI</span>
        <h2 class="s3-title">Tantangan: Pilih Mikroorganisme yang Tepat</h2>
      </div>

      <div class="s3-step-indicator">
        <span class="s3-step active">1. Tantangan</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step">2. Toko</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step">3. Lab</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step">4. Kran Vinasse</span>
      </div>

      <div class="s3-context" id="s3-ctx"></div>
      <div class="s3-question" id="s3-q"></div>
      <div class="s3-options"  id="s3-opts"></div>
      <div class="s3-feedback hidden" id="s3-fb"></div>
      <button class="s3-btn hidden" id="s3-next-challenge">
        🛒 Lanjut ke Toko Mikroorganisme →
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  $('s3-ctx').innerHTML = stage3Challenge.context;
  $('s3-q').innerHTML   = `<strong>❓ Pertanyaan:</strong><br>${stage3Challenge.question}`;

  const opts = $('s3-opts');
  let answered = false;

  stage3Challenge.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 's3-option';
    btn.innerHTML = `<strong>${opt.label}.</strong> ${opt.text}`;
    btn.onclick = () => {
      if (answered) return;
      if (opt.correct) {
        answered = true;
        btn.classList.add('correct');
        opts.querySelectorAll('.s3-option').forEach(b => (b.disabled = true));

        // Award bonus points (same rule as other stages)
        const wrong = state.wrongAnswers ?? 0;
        const pts   = wrong === 0 ? 100 : wrong <= 2 ? 50 : 25;
        state.totalPoints += pts;
        state.levelAttempts++;
        updateHUD();

        showFeedback('s3-fb', true, stage3Challenge.explanation + `<br><br>🎉 +${pts} poin tambahan!`);
        $('s3-next-challenge').classList.remove('hidden');
      } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        state.wrongAnswers = (state.wrongAnswers ?? 0) + 1;
        updateHUD();
        showFeedback('s3-fb', false, '❌ Kurang tepat. Coba pilihan lain!');
      }
    };
    opts.appendChild(btn);
  });

  $('s3-next-challenge').onclick = () => {
    removeOverlay();
    onComplete();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 – Microorganism Shop
// ─────────────────────────────────────────────────────────────────────────────
function showShopPanel(onComplete) {
  const overlay = makeOverlay('s3-overlay');
  overlay.innerHTML = `
    <div class="s3-card s3-shop-card">
      <div class="s3-header">
        <span class="s3-badge">🛒 TOKO MIKROORGANISME</span>
        <h2 class="s3-title">Pilih Mikroorganisme untuk Bioremediasi Vinasse</h2>
        <p class="s3-subtitle">Poin kamu saat ini: <span id="s3-shop-pts" class="s3-pts-badge"></span>
        — Pilih mikroorganisme yang sesuai dengan karakteristik vinasse (air tawar, pH asam, melanoidin).</p>
      </div>

      <div class="s3-step-indicator">
        <span class="s3-step done">✔ Tantangan</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step active">2. Toko</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step">3. Lab</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step">4. Kran Vinasse</span>
      </div>

      <div class="s3-shop-grid" id="s3-shop-grid"></div>

      <div class="s3-shop-result hidden" id="s3-shop-result"></div>
      <button class="s3-btn hidden" id="s3-btn-to-lab">🔬 Lanjut ke Lab Kalkulasi →</button>
      <button class="s3-btn s3-btn-restart hidden" id="s3-btn-restart">
        🔄 Poin tidak cukup — Mulai dari Awal
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  let purchasedId = null;

  // ── Helper: rebuild the grid reflecting current points ──
  function renderGrid() {
    const grid = $('s3-shop-grid');
    grid.innerHTML = '';
    microorganisms.forEach(micro => {
      const card = document.createElement('div');
      card.className = 's3-micro-card';
      // Already bought the correct one — lock everything
      if (purchasedId && micro.id === purchasedId) {
        card.classList.add('chosen');
      }
      const canAfford = state.totalPoints >= micro.price;

      card.innerHTML = `
        <div class="s3-micro-img-wrap"><img src="${micro.image}" alt="${micro.name}" class="s3-micro-img"></div>
        <div class="s3-micro-name">${micro.name}</div>
        <div class="s3-micro-pigment">🔬 Pigmen: ${micro.pigment}</div>
        <div class="s3-micro-desc">${micro.description}</div>
        <div class="s3-micro-citation">📄 ${micro.citation}</div>
        <div class="s3-micro-price ${canAfford ? '' : 'unaffordable'}">
          💰 ${micro.price} poin
          ${!canAfford ? '<span class="s3-not-enough">(poin tidak cukup)</span>' : ''}
        </div>
        <button class="s3-buy-btn ${(!canAfford || purchasedId) ? 'disabled' : ''}"
                data-id="${micro.id}" ${(!canAfford || purchasedId) ? 'disabled' : ''}>
          ${purchasedId && micro.id === purchasedId ? '✅ Dipilih' : 'Beli'}
        </button>
      `;
      grid.appendChild(card);
    });
  }

  renderGrid();
  $('s3-shop-pts').textContent = state.totalPoints + ' poin';

  // ── Buy handler (delegated) ──
  $('s3-shop-grid').addEventListener('click', e => {
    const btn = e.target.closest('.s3-buy-btn');
    if (!btn || btn.disabled || purchasedId) return;

    const micro = microorganisms.find(m => m.id === btn.dataset.id);
    if (!micro) return;

    // Deduct cost
    state.totalPoints -= micro.price;
    updateHUD();
    $('s3-shop-pts').textContent = state.totalPoints + ' poin';

    const resultEl = $('s3-shop-result');
    resultEl.classList.remove('hidden');

    if (micro.outcome === 'punishment') {
      // Wrong choice — show punishment, let them try again
      resultEl.className = 's3-shop-result punishment';
      resultEl.innerHTML = micro.punishmentText +
        `<br><br>💡 <b>Coba lagi</b> — pilih mikroorganisme yang lebih tepat!`;

      // Re-render grid so affordability reflects new point total
      renderGrid();
      $('s3-shop-pts').textContent = state.totalPoints + ' poin';

      // Check if any non-punishment organism is still affordable
      const canStillBuy = microorganisms
        .filter(m => m.outcome !== 'punishment')
        .some(m => state.totalPoints >= m.price);

      if (!canStillBuy) {
        // Can't afford any correct choice — show restart button
        resultEl.innerHTML += `<br><br>⛔ <b>Poin kamu tidak cukup</b> untuk membeli mikroorganisme yang tepat.`;
        $('s3-btn-restart').classList.remove('hidden');
      }
    } else {
      // Correct choice
      purchasedId = micro.id;
      resultEl.className = 's3-shop-result ' +
        (micro.outcome === 'reward_high' ? 'reward-high' : 'reward-mid');
      resultEl.innerHTML = micro.rewardText;
      renderGrid();
      setTimeout(() => $('s3-btn-to-lab').classList.remove('hidden'), 800);
    }
  });

  $('s3-btn-to-lab').onclick = () => {
    removeOverlay();
    onComplete(purchasedId);
  };

  $('s3-btn-restart').onclick = () => {
    window.location.reload();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 – Lab Calculation + Sprinkler simulation
// ─────────────────────────────────────────────────────────────────────────────
function showLabPanel(microId, onComplete) {
  const micro = microorganisms.find(m => m.id === microId) || microorganisms[0];

  const overlay = makeOverlay('s3-overlay');
  overlay.innerHTML = `
    <div class="s3-card">
      <div class="s3-header">
        <span class="s3-badge">🔬 LAB KALKULASI</span>
        <h2 class="s3-title">Tuangkan Mikroorganisme ke Vinasse</h2>
        <p class="s3-subtitle">Mikroorganisme dipilih: <b>${micro.name}</b></p>
      </div>

      <div class="s3-step-indicator">
        <span class="s3-step done">✔ Tantangan</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step done">✔ Toko</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step active">3. Lab</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step">4. Kran Vinasse</span>
      </div>

      <!-- Volume selector -->
      <div class="s3-lab-section">
        <label class="s3-lab-label">📦 Pilih Volume Vinasse yang Akan Diolah</label>
        <div class="s3-vol-btns">
          ${[10, 50, 100, 500, 1000].map(v => `
            <button class="s3-vol-btn" data-vol="${v}">${v} L</button>
          `).join('')}
        </div>
      </div>

      <!-- Sprinkler scene (hidden until volume picked) -->
      <div class="s3-sprinkler-scene hidden" id="s3-sprinkler-scene">
        <div class="s3-spk-label" id="s3-spk-dose-label"></div>
        <!-- Interactive spray zone — tahan klik + geser mouse untuk menuangkan -->
        <div class="s3-spray-zone" id="s3-spray-zone">
          <div class="s3-sprinkler-head" id="s3-spk-head">
            <div class="s3-spk-body"></div>
            <div class="s3-spk-nozzles">
              ${Array.from({length: 7}, () => '<div class="s3-spk-nozzle"></div>').join('')}
            </div>
          </div>
          <div class="s3-spk-particles" id="s3-spk-particles"></div>
          <div class="s3-spk-tank">
            <div class="s3-spk-vinasse"></div>
            <div class="s3-spk-micro-layer" id="s3-spk-micro-layer"></div>
            <div class="s3-spk-target-line" id="s3-spk-target-line"></div>
            <div class="s3-spk-tank-label">Kolam Vinasse</div>
          </div>
        </div>
        <p class="s3-pour-hint" id="s3-pour-hint">🖱️ Tahan klik + gerakkan mouse di area ini untuk menuangkan</p>
        <div class="s3-pour-counter hidden" id="s3-pour-counter">
          Dituangkan: <b id="s3-poured-amt">0.0</b> <span id="s3-poured-unit"></span>
          &nbsp;/&nbsp; Target: <b id="s3-target-amt"></b> <span id="s3-target-unit"></span>
        </div>
        <div class="s3-pour-progress-wrap hidden" id="s3-pour-progress-wrap">
          <div class="s3-pour-bar-fill" id="s3-pour-bar-fill"></div>
          <div class="s3-pour-target-mark"></div>
        </div>
        <div class="s3-pour-feedback hidden" id="s3-pour-feedback"></div>
        <button class="s3-btn hidden" id="s3-btn-confirm-pour">✅ Konfirmasi Takaran</button>
      </div>

      <!-- Result cards (hidden until pour complete) -->
      <div class="s3-lab-result hidden" id="s3-lab-result">
        <div class="s3-calc-grid" id="s3-calc-grid"></div>
        <div class="s3-lab-notes" id="s3-lab-notes"></div>
      </div>

      <button class="s3-btn hidden" id="s3-btn-to-valve">🚰 Aktifkan Kran Vinasse →</button>
    </div>
  `;
  document.body.appendChild(overlay);

  let selectedVol    = null;
  let pouredAmount   = 0;
  let isPouring      = false;
  let startedPouring = false;
  let lastParticleAt = 0;

  const colourMap = {
    azolla: '#4ecb47', nannochloropsis: '#c8b820',
    spirulina: '#2ab8d8', chlorella: '#38d878',
  };
  const colour = colourMap[micro.id] || '#80e880';

  // ── Volume selection ──────────────────────────────────────────
  overlay.querySelectorAll('.s3-vol-btn').forEach(btn => {
    btn.onclick = () => {
      overlay.querySelectorAll('.s3-vol-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedVol = parseInt(btn.dataset.vol);
      const calc  = calcMicroDose(microId, selectedVol);

      // Reset all pour state
      pouredAmount   = 0;
      isPouring      = false;
      startedPouring = false;
      $('s3-lab-result').classList.add('hidden');
      $('s3-btn-to-valve').classList.add('hidden');
      $('s3-spk-micro-layer').style.transition = 'none';
      $('s3-spk-micro-layer').style.height = '0%';
      $('s3-spk-head').classList.remove('spk-active');
      $('s3-spk-particles').innerHTML = '';
      $('s3-pour-counter').classList.add('hidden');
      $('s3-pour-progress-wrap').classList.add('hidden');
      $('s3-pour-feedback').classList.add('hidden');
      $('s3-btn-confirm-pour').classList.add('hidden');
      $('s3-pour-hint').classList.remove('hidden');
      $('s3-poured-amt').textContent = '0.0';
      $('s3-pour-bar-fill').style.width = '0%';

      if (calc) {
        $('s3-target-amt').textContent  = calc.total;
        $('s3-target-unit').textContent = calc.unit;
        $('s3-poured-unit').textContent = calc.unit;
        $('s3-spk-target-line').style.display = '';
      } else {
        $('s3-spk-target-line').style.display = 'none';
      }

      $('s3-spk-dose-label').innerHTML = calc
        ? `Dosis yang dibutuhkan: <b>${calc.total} ${calc.unit}</b> untuk ${selectedVol} L vinasse`
        : `⛔ ${micro.name} tidak cocok untuk vinasse ini`;

      $('s3-sprinkler-scene').classList.remove('hidden');
      $('s3-sprinkler-scene').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
  });

  // ── Helper: show result cards ─────────────────────────────────
  function showLabResults(calc) {
    const gridEl  = $('s3-calc-grid');
    const notesEl = $('s3-lab-notes');
    if (!calc) {
      gridEl.innerHTML = `
        <div class="s3-calc-card fail">
          <span class="s3-calc-icon">⛔</span>
          <span class="s3-calc-label">Tidak dapat digunakan</span>
          <span class="s3-calc-value">${micro.name} tidak cocok untuk vinasse ini</span>
        </div>`;
      notesEl.innerHTML = `⚠️ Pilihan mikroorganisme tidak valid untuk kondisi vinasse ini.`;
    } else {
      gridEl.innerHTML = [
        { icon: '⚗️', label: 'Volume Vinasse',  value: `${selectedVol} L` },
        { icon: '🧫', label: 'Dosis Mikro',     value: `${calc.total} ${calc.unit}` },
        { icon: '⏱️', label: 'Durasi Perlakuan', value: calc.duration },
        { icon: '📉', label: 'Penurunan COD',   value: calc.codRemoval },
        { icon: '💧', label: 'Penurunan BOD',   value: calc.bodRemoval },
      ].map(p => `
        <div class="s3-calc-card">
          <span class="s3-calc-icon">${p.icon}</span>
          <span class="s3-calc-label">${p.label}</span>
          <span class="s3-calc-value">${p.value}</span>
        </div>`).join('');
      notesEl.innerHTML = `📝 <b>Catatan:</b> ${calc.notes}`;
    }
    $('s3-lab-result').classList.remove('hidden');
    $('s3-btn-to-valve').classList.remove('hidden');
    $('s3-lab-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Helper: reset a failed pour attempt ───────────────────────
  function resetPourAttempt() {
    setTimeout(() => {
      pouredAmount   = 0;
      startedPouring = false;
      $('s3-spk-micro-layer').style.transition = 'none';
      $('s3-spk-micro-layer').style.height = '0%';
      $('s3-poured-amt').textContent = '0.0';
      $('s3-pour-bar-fill').style.width = '0%';
      $('s3-pour-counter').classList.add('hidden');
      $('s3-pour-progress-wrap').classList.add('hidden');
      $('s3-btn-confirm-pour').classList.add('hidden');
      $('s3-pour-hint').classList.remove('hidden');
      $('s3-pour-feedback').classList.add('hidden');
      $('s3-spk-head').classList.remove('spk-active');
      $('s3-spk-particles').innerHTML = '';
    }, 2500);
  }

  // ── Mouse spray interaction ───────────────────────────────────
  const sprayZone = $('s3-spray-zone');

  sprayZone.addEventListener('mousedown', e => {
    isPouring = true;
    e.preventDefault();
  });
  document.addEventListener('mouseup', () => { isPouring = false; });
  sprayZone.addEventListener('mouseleave', () => {
    $('s3-spk-head').classList.remove('spk-active');
  });

  sprayZone.addEventListener('mousemove', e => {
    if (!selectedVol) return;
    const rect = sprayZone.getBoundingClientRect();
    const relX = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));

    // Sprinkler head tracks mouse X
    $('s3-spk-head').style.left = (relX * 100) + '%';

    if (!isPouring) return;

    const calc       = calcMicroDose(microId, selectedVol);
    const targetDose = calc ? parseFloat(calc.total) : 0;

    if (!startedPouring) {
      startedPouring = true;
      $('s3-pour-hint').classList.add('hidden');
      if (targetDose) {
        $('s3-pour-counter').classList.remove('hidden');
        $('s3-pour-progress-wrap').classList.remove('hidden');
      }
      $('s3-btn-confirm-pour').classList.remove('hidden');
    }

    $('s3-spk-head').classList.add('spk-active');

    if (targetDose) {
      // Each move tick adds a small dose increment (~180 ticks to reach target)
      const gramsPerTick = targetDose / 180;
      pouredAmount = Math.min(pouredAmount + gramsPerTick, targetDose * 2);
      $('s3-poured-amt').textContent = pouredAmount.toFixed(1);

      // Tank micro layer (0 → 30% height at double dose)
      const fillH = Math.min(pouredAmount / (targetDose * 2), 1) * 30;
      $('s3-spk-micro-layer').style.transition = 'none';
      $('s3-spk-micro-layer').style.height = fillH + '%';
      $('s3-spk-micro-layer').style.background = colour;

      // Progress bar — target marker sits at ~67% of bar width (= 100% dose / 150% max)
      const barPct = Math.min(pouredAmount / (targetDose * 1.5), 1) * 100;
      $('s3-pour-bar-fill').style.width = barPct + '%';
      const ratio = pouredAmount / targetDose;
      $('s3-pour-bar-fill').style.background =
        ratio < 0.7  ? '#20a0d0' :
        ratio < 0.8  ? '#60d060' :
        ratio <= 1.2 ? '#00e870' :
        ratio <= 1.5 ? '#e8a020' : '#e04020';
    }

    // Throttled particle spawn (max ~25/sec)
    const now = Date.now();
    if (now - lastParticleAt > 40) {
      lastParticleAt = now;
      const p = document.createElement('div');
      p.className = 's3-spk-drop';
      const spread = -40 + Math.random() * 80;
      const dur    = 0.45 + Math.random() * 0.35;
      p.style.cssText = `
        --spread-x: ${spread}px; --dur: ${dur}s;
        background: ${colour};
        left: calc(${relX * 100}% + ${spread * 0.2}px);
      `;
      $('s3-spk-particles').appendChild(p);
      setTimeout(() => p.remove(), dur * 1000 + 80);
    }
  });

  // Touch support (mobile)
  sprayZone.addEventListener('touchstart',  e => { isPouring = true;  e.preventDefault(); }, { passive: false });
  sprayZone.addEventListener('touchend',    ()  => { isPouring = false; });
  sprayZone.addEventListener('touchmove', e => {
    e.preventDefault();
    const t  = e.touches[0];
    const me = new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY });
    sprayZone.dispatchEvent(me);
  }, { passive: false });

  // ── Confirm button ────────────────────────────────────────────
  $('s3-btn-confirm-pour').onclick = () => {
    const calc       = calcMicroDose(microId, selectedVol);
    const feedbackEl = $('s3-pour-feedback');
    feedbackEl.classList.remove('hidden');
    $('s3-btn-confirm-pour').classList.add('hidden');

    if (!calc) {
      feedbackEl.className = 's3-pour-feedback punishment';
      feedbackEl.innerHTML = '⚠️ Mikroorganisme ini tidak cocok — hasilnya tidak optimal.';
      setTimeout(() => showLabResults(null), 1200);
      return;
    }

    const targetDose = parseFloat(calc.total);
    const ratio      = pouredAmount / targetDose;

    if (ratio < 0.8) {
      feedbackEl.className = 's3-pour-feedback wrong';
      feedbackEl.innerHTML = `⚠️ <b>Kurang!</b> Kamu menuangkan <b>${pouredAmount.toFixed(1)} ${calc.unit}</b>,
        padahal target <b>${calc.total} ${calc.unit}</b>. Geser mouse lebih lama!`;
      resetPourAttempt();
    } else if (ratio > 1.2) {
      feedbackEl.className = 's3-pour-feedback wrong';
      feedbackEl.innerHTML = `⚠️ <b>Terlalu banyak!</b> Kamu menuangkan <b>${pouredAmount.toFixed(1)} ${calc.unit}</b>,
        target hanya <b>${calc.total} ${calc.unit}</b>. Coba lagi!`;
      resetPourAttempt();
    } else {
      feedbackEl.className = 's3-pour-feedback correct';
      feedbackEl.innerHTML = `✅ <b>Tepat!</b> <b>${pouredAmount.toFixed(1)} ${calc.unit}</b> — sesuai dosis bioremediasi!`;
      $('s3-spk-head').classList.remove('spk-active');
      $('s3-spk-micro-layer').style.transition = 'height 1.2s ease';
      $('s3-spk-micro-layer').style.height = '30%';
      setTimeout(() => showLabResults(calc), 1500);
    }
  };

  $('s3-btn-to-valve').onclick = () => {
    removeOverlay();
    onComplete();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 – Valve activation + Level Complete
// ─────────────────────────────────────────────────────────────────────────────
function showValvePanel(onDone) {
  const overlay = makeOverlay('s3-overlay');
  overlay.innerHTML = `
    <div class="s3-card s3-valve-card">
      <div class="s3-header">
        <span class="s3-badge">🚰 AKTIVASI KRAN VINASSE</span>
        <h2 class="s3-title">Saatnya Memulai Bioremediasi!</h2>
      </div>

      <div class="s3-step-indicator">
        <span class="s3-step done">✔ Tantangan</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step done">✔ Toko</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step done">✔ Lab</span>
        <span class="s3-step-arrow">→</span>
        <span class="s3-step active">4. Kran Vinasse</span>
      </div>

      <div class="s3-valve-scene" id="s3-valve-scene">
        <!-- Animated pipe and valve -->
        <div class="s3-pipe s3-pipe-top"></div>
        <div class="s3-valve-body" id="s3-valve-body">
          <div class="s3-valve-wheel" id="s3-valve-wheel">⊕</div>
          <div class="s3-valve-label">KRAN<br>VINASSE</div>
        </div>
        <div class="s3-pipe s3-pipe-bottom"></div>
        <div class="s3-flow-container" id="s3-flow">
          <!-- Flow animated with CSS when valve open -->
        </div>
        <div class="s3-tank" id="s3-tank">
          <div class="s3-tank-liquid" id="s3-tank-liquid"></div>
          <div class="s3-tank-label">Reaktor<br>Bioremediasi</div>
        </div>
      </div>

      <div class="s3-valve-instruction" id="s3-valve-instr">
        Klik tombol di bawah untuk membuka kran dan mengalirkan vinasse ke reaktor bioremediasi!
      </div>

      <button class="s3-btn s3-valve-btn" id="s3-btn-open-valve">
        🔓 Buka Kran Vinasse
      </button>

      <div class="s3-level-complete hidden" id="s3-level-complete">
        <div class="s3-complete-icon">🎉</div>
        <h3>Level 3 Selesai!</h3>
        <p>Vinasse mengalir ke reaktor bioremediasi. Mikroorganisme pilihanmu akan bekerja
           memecah melanoidin dan polutan organik dalam vinasse.</p>
        <div class="s3-final-score">
          Total Poin: <span id="s3-final-pts"></span>
        </div>
        <button class="s3-btn" id="s3-btn-finish">✅ Lanjut ke Level 4 →</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  let valveOpen = false;

  $('s3-btn-open-valve').onclick = () => {
    if (valveOpen) return;
    valveOpen = true;

    // Animate valve
    const wheel = $('s3-valve-wheel');
    wheel.style.animation = 'valveSpin 0.8s ease forwards';

    const flow = $('s3-flow');
    flow.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const drop = document.createElement('div');
      drop.className = 's3-drop';
      drop.style.animationDelay = (i * 0.12) + 's';
      drop.style.left = (30 + Math.random() * 30) + '%';
      flow.appendChild(drop);
    }
    flow.classList.add('flowing');

    // Fill tank
    setTimeout(() => {
      $('s3-tank-liquid').style.height = '75%';
    }, 600);

    $('s3-btn-open-valve').disabled = true;
    $('s3-btn-open-valve').textContent = '✅ Kran Terbuka';
    $('s3-valve-instr').textContent = 'Vinasse mengalir ke reaktor bioremediasi…';

    setTimeout(() => {
      $('s3-level-complete').classList.remove('hidden');
      $('s3-final-pts').textContent = state.totalPoints + ' poin';
    }, 1800);
  };

  $('s3-btn-finish').onclick = () => {
    removeOverlay();
    if (onDone) onDone();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeOverlay(id) {
  const el = document.createElement('div');
  el.id = id;
  el.className = 's3-overlay';
  return el;
}

function removeOverlay() {
  const el = $('s3-overlay');
  if (el) el.remove();
}

function showFeedback(elId, correct, msg) {
  const el = $(elId);
  if (!el) return;
  el.className = 's3-feedback ' + (correct ? 'correct' : 'wrong');
  el.innerHTML = msg;
  el.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
function injectStage3CSS() {
  if ($('s3-styles')) return;

  const css = `
    /* ── Overlay ─────────────────────────────────────── */
    .s3-overlay {
      position: fixed; inset: 0;
      background: rgba(5, 12, 20, 0.97);
      display: flex; align-items: center; justify-content: center;
      z-index: 500; overflow-y: auto; padding: 20px 12px;
    }
    .s3-card {
      background: rgba(10, 20, 35, 0.99);
      border: 1px solid #1a4060;
      border-radius: 16px;
      max-width: 860px; width: 100%;
      padding: 26px 30px;
      color: #ddeeff;
      box-shadow: 0 0 50px rgba(0,150,255,0.15);
    }
    .s3-shop-card { max-width: 1040px; }

    /* ── Header ──────────────────────────────────────── */
    .s3-header { text-align: center; margin-bottom: 20px; }
    .s3-badge {
      background: rgba(0,200,100,0.12); border: 1px solid #00c864;
      color: #00e870; padding: 4px 14px; border-radius: 20px;
      font-size: 12px; letter-spacing: 1px;
    }
    .s3-title   { margin: 10px 0 4px; font-size: 20px; color: #a0f0c0; }
    .s3-subtitle { color: #7090a0; font-size: 13px; margin: 0; }
    .s3-pts-badge {
      background: rgba(255,200,0,0.15); border: 1px solid #ffc800;
      color: #ffe040; padding: 2px 10px; border-radius: 12px;
      font-weight: 700;
    }

    /* ── Step indicator ──────────────────────────────── */
    .s3-step-indicator {
      display: flex; align-items: center; justify-content: center;
      gap: 6px; margin-bottom: 20px; flex-wrap: wrap;
    }
    .s3-step {
      padding: 4px 12px; border-radius: 12px; font-size: 12px;
      background: rgba(20,40,60,0.8); color: #507090;
      border: 1px solid #1a3a5a;
    }
    .s3-step.active { background: rgba(0,100,60,0.25); color: #40e890; border-color: #00c864; }
    .s3-step.done   { background: rgba(0,100,60,0.1);  color: #40a870; border-color: #007040; }
    .s3-step-arrow  { color: #304050; font-size: 14px; }

    /* ── Context / question ──────────────────────────── */
    .s3-context {
      background: rgba(8,20,38,0.8); border-left: 4px solid #00a060;
      padding: 12px 16px; border-radius: 6px; font-size: 14px;
      line-height: 1.7; color: #b0d8c0; margin-bottom: 14px;
    }
    .s3-question {
      background: rgba(8,20,38,0.8); border-left: 4px solid #e67e22;
      padding: 10px 16px; border-radius: 6px; font-size: 14px;
      line-height: 1.6; color: #d8e0cc; margin-bottom: 12px;
    }

    /* ── Options ─────────────────────────────────────── */
    .s3-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
    .s3-option {
      padding: 10px 14px; border-radius: 8px;
      border: 2px solid #1a3a5a; background: rgba(8,20,38,0.8);
      color: #b0c8d8; cursor: pointer; text-align: left;
      font-size: 13px; transition: all 0.2s; line-height: 1.5;
    }
    .s3-option:hover:not(:disabled) { border-color: #00aaff; color: #00d4ff; }
    .s3-option.correct { border-color: #2ecc71; background: rgba(30,100,40,0.2); color: #80ee90; }
    .s3-option.wrong   { border-color: #e74c3c; background: rgba(100,20,20,0.2); color: #ff8888; }
    .s3-option:disabled { opacity: 0.6; cursor: default; }

    /* ── Feedback ────────────────────────────────────── */
    .s3-feedback {
      padding: 10px 14px; border-radius: 6px; font-size: 13px;
      line-height: 1.7; margin-bottom: 8px;
    }
    .s3-feedback.hidden  { display: none; }
    .s3-feedback.correct { background: rgba(30,100,40,0.2); border-left: 4px solid #2ecc71; color: #a0e8a0; }
    .s3-feedback.wrong   { background: rgba(100,20,20,0.2); border-left: 4px solid #e74c3c; color: #ff9090; }

    /* ── Button ──────────────────────────────────────── */
    .s3-btn {
      display: inline-block; margin-top: 14px;
      padding: 11px 26px; border-radius: 10px;
      background: linear-gradient(135deg, #0a6030, #0a8040);
      color: #fff; font-size: 15px; font-weight: 700;
      border: none; cursor: pointer; transition: all 0.2s;
    }
    .s3-btn:hover:not(:disabled) { filter: brightness(1.2); }
    .s3-btn:disabled { opacity: 0.4; cursor: default; }
    .s3-btn.hidden   { display: none; }
    .s3-btn-restart  { background: linear-gradient(135deg, #7a0a0a, #b01414); margin-left: 10px; }

    /* ── Shop grid ───────────────────────────────────── */
    .s3-shop-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px; margin-bottom: 16px;
    }
    .s3-micro-card {
      background: rgba(8, 20, 38, 0.9); border: 2px solid #1a3a5a;
      border-radius: 12px; padding: 14px; display: flex;
      flex-direction: column; gap: 6px; transition: border-color 0.2s;
    }
    .s3-micro-card.chosen { border-color: #00e870; background: rgba(0,60,30,0.25); }
    .s3-micro-img-wrap { text-align: center; margin-bottom: 2px; }
    .s3-micro-img { width: 100%; max-height: 110px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
    .s3-micro-name   { font-size: 15px; font-weight: 700; color: #c0e8d8; text-align: center; }
    .s3-micro-pigment { font-size: 11px; color: #6090a0; font-style: italic; }
    .s3-micro-desc   { font-size: 12px; color: #8090a0; line-height: 1.5; flex: 1; }
    .s3-micro-citation { font-size: 10px; color: #506070; }
    .s3-micro-price  { font-size: 13px; font-weight: 700; color: #ffe040; }
    .s3-micro-price.unaffordable { color: #886040; }
    .s3-not-enough   { color: #cc6633; font-size: 11px; margin-left: 4px; }
    .s3-buy-btn {
      margin-top: 4px; padding: 7px 0; border-radius: 7px; width: 100%;
      border: 2px solid #00a060; background: rgba(0,80,40,0.25);
      color: #40e880; cursor: pointer; font-size: 13px; font-weight: 700;
      transition: all 0.2s;
    }
    .s3-buy-btn:hover:not(:disabled) { background: rgba(0,120,60,0.4); }
    .s3-buy-btn.disabled, .s3-buy-btn:disabled { opacity: 0.35; cursor: default; border-color: #2a4a3a; color: #4a7a5a; }

    /* ── Shop result banner ──────────────────────────── */
    .s3-shop-result {
      padding: 12px 16px; border-radius: 8px; margin: 10px 0; font-size: 14px; line-height: 1.7;
    }
    .s3-shop-result.hidden     { display: none; }
    .s3-shop-result.reward-high { background: rgba(0,100,50,0.25); border: 1px solid #00c864; color: #80ff90; }
    .s3-shop-result.reward-mid  { background: rgba(0,80,120,0.2); border: 1px solid #0088cc; color: #80ccff; }
    .s3-shop-result.punishment  { background: rgba(140,10,10,0.25); border: 1px solid #cc2222; color: #ff8080; }

    /* ── Lab section ─────────────────────────────────── */
    .s3-lab-intro {
      background: rgba(8,20,38,0.8); border-left: 4px solid #1a80a0;
      padding: 12px 16px; border-radius: 6px; font-size: 13px;
      color: #a0c0d8; line-height: 1.7; margin-bottom: 16px;
    }
    .s3-lab-intro ul { margin: 6px 0 0 16px; }
    .s3-lab-section  { margin-bottom: 16px; }
    .s3-lab-label    { font-size: 13px; color: #7090a0; display: block; margin-bottom: 8px; }
    .s3-vol-btns     { display: flex; gap: 8px; flex-wrap: wrap; }
    .s3-vol-btn {
      padding: 8px 16px; border-radius: 7px;
      border: 2px solid #1a3a5a; background: rgba(8,20,38,0.8);
      color: #6090a0; cursor: pointer; font-size: 13px; font-weight: 600;
      transition: all 0.2s;
    }
    .s3-vol-btn:hover  { border-color: #00aaff; color: #00ccff; }
    .s3-vol-btn.active { border-color: #00e870; color: #00e870; background: rgba(0,100,50,0.15); }

    /* ── Calc result grid ────────────────────────────── */
    .s3-lab-result { margin-top: 10px; }
    .s3-calc-grid  {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px; margin-bottom: 10px;
    }
    .s3-calc-card {
      background: rgba(8,20,38,0.9); border: 1px solid #1a3a5a;
      border-radius: 9px; padding: 10px 12px;
      display: flex; flex-direction: column; gap: 4px; align-items: center;
    }
    .s3-calc-card.fail { border-color: #cc2222; }
    .s3-calc-icon  { font-size: 20px; }
    .s3-calc-label { font-size: 11px; color: #6090a0; text-align: center; }
    .s3-calc-value { font-size: 15px; font-weight: 700; color: #a0e8d8; text-align: center; }
    .s3-lab-notes  {
      background: rgba(8,20,38,0.8); border-left: 4px solid #1a6080;
      padding: 8px 14px; border-radius: 6px; font-size: 12px;
      color: #80a8c0; line-height: 1.6;
    }

    /* ── Sprinkler / spray zone ──────────────────────── */
    .s3-sprinkler-scene { margin: 12px 0 6px; }
    .s3-sprinkler-scene.hidden { display: none; }
    .s3-spk-label {
      font-size: 13px; color: #80b0c8; text-align: center;
      margin-bottom: 10px;
    }
    /* Interactive spray zone */
    .s3-spray-zone {
      position: relative;
      width: 100%; max-width: 360px; height: 200px;
      margin: 0 auto;
      cursor: crosshair;
      user-select: none; -webkit-user-select: none;
      border: 2px dashed rgba(80,160,180,0.2);
      border-radius: 12px;
      background: rgba(0,5,10,0.3);
      transition: border-color 0.2s;
    }
    .s3-spray-zone:hover { border-color: rgba(80,160,180,0.45); }
    /* Sprinkler head — tracks mouse X via JS */
    .s3-spray-zone .s3-sprinkler-head {
      position: absolute; top: 8px;
      transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center;
      z-index: 3; pointer-events: none;
      transition: left 0.04s linear;
    }
    .s3-spk-body {
      width: 48px; height: 22px;
      background: linear-gradient(180deg, #5a7a8a, #3a5060);
      border-radius: 6px 6px 0 0; border: 2px solid #6a8a9a;
    }
    .s3-spk-nozzles {
      display: flex; gap: 4px; background: #2a3a4a;
      padding: 4px 6px; border-radius: 0 0 8px 8px;
      border: 2px solid #3a5060; border-top: none;
    }
    .s3-spk-nozzle {
      width: 5px; height: 8px;
      background: #8ab0c0; border-radius: 0 0 3px 3px;
    }
    .s3-sprinkler-head.spk-active .s3-spk-nozzle {
      background: #40d8ff;
      box-shadow: 0 0 6px rgba(60, 220, 255, 0.8);
    }
    /* Particle container — fills the spray zone above the tank */
    .s3-spray-zone .s3-spk-particles {
      position: absolute; top: 55px; left: 0; right: 0; bottom: 80px;
      overflow: hidden; pointer-events: none;
    }
    .s3-spk-drop {
      position: absolute; top: 0;
      width: 5px; height: 10px;
      border-radius: 50% 50% 60% 60%;
      opacity: 0.85;
      animation: spkFall var(--dur, 0.7s) ease-in forwards;
    }
    @keyframes spkFall {
      0%   { transform: translateY(0)  translateX(0)                scaleY(1);   opacity: .9; }
      70%  { opacity: .8; }
      100% { transform: translateY(65px) translateX(var(--spread-x)) scaleY(1.3); opacity: 0; }
    }
    /* Vinasse tank — pinned to bottom of spray zone */
    .s3-spray-zone .s3-spk-tank {
      position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
      width: 240px; height: 75px;
      border: 3px solid #4a6a7a; border-top: none;
      border-radius: 0 0 12px 12px;
      background: rgba(5, 15, 25, 0.6);
      overflow: hidden;
    }
    .s3-spk-vinasse {
      position: absolute; bottom: 0; left: 0; right: 0; height: 55%;
      background: rgba(70, 28, 5, 0.85);
    }
    .s3-spk-micro-layer {
      position: absolute; bottom: 55%; left: 0; right: 0; height: 0%;
    }
    /* Target line — shows where correct dose fills to */
    .s3-spk-target-line {
      position: absolute; left: 0; right: 0; bottom: 70%;
      height: 2px; background: rgba(255, 220, 0, 0.8);
      z-index: 4; pointer-events: none;
    }
    .s3-spk-target-line::after {
      content: 'TARGET';
      position: absolute; right: 4px; top: -10px;
      font-size: 8px; font-weight: 700; color: #ffd040; letter-spacing: 0.5px;
    }
    .s3-spk-tank-label {
      position: absolute; bottom: 4px; left: 0; right: 0;
      text-align: center; font-size: 10px; color: rgba(255,255,255,0.3);
      pointer-events: none;
    }
    /* Pour status row */
    .s3-pour-hint {
      margin: 8px 0 0; font-size: 12px; color: #6090a8; text-align: center;
    }
    .s3-pour-counter {
      margin: 8px 0 0; text-align: center; font-size: 13px; color: #a0c8e0;
    }
    .s3-pour-counter.hidden { display: none; }
    /* Progress bar */
    .s3-pour-progress-wrap {
      position: relative; height: 14px;
      background: rgba(10,20,30,0.6); border-radius: 7px;
      margin: 8px 0; overflow: visible;
    }
    .s3-pour-progress-wrap.hidden { display: none; }
    .s3-pour-bar-fill {
      height: 100%; width: 0%; border-radius: 7px;
      transition: width 0.08s, background 0.25s;
    }
    /* Target marker on progress bar at 66.7% (= 100% / 150% max) */
    .s3-pour-target-mark {
      position: absolute; top: -3px; bottom: -3px; left: 66.7%; width: 3px;
      background: rgba(255,220,0,0.9); border-radius: 2px; pointer-events: none;
    }
    .s3-pour-target-mark::after {
      content: '▲'; position: absolute; bottom: -12px; left: 50%;
      transform: translateX(-50%); font-size: 9px; color: #ffd040;
    }
    /* Pour feedback banners */
    .s3-pour-feedback {
      margin: 8px 0; padding: 10px 14px; border-radius: 8px;
      font-size: 13px; line-height: 1.6;
    }
    .s3-pour-feedback.hidden     { display: none; }
    .s3-pour-feedback.correct    { background: rgba(0,80,40,0.3);   border: 1px solid #00c864; color: #80ff90; }
    .s3-pour-feedback.wrong      { background: rgba(140,30,10,0.25); border: 1px solid #cc4422; color: #ff9060; }
    .s3-pour-feedback.punishment { background: rgba(140,10,10,0.25); border: 1px solid #cc2222; color: #ff8080; }

    /* ── Valve scene ─────────────────────────────────── */
    .s3-valve-card { max-width: 600px; }
    .s3-valve-scene {
      display: flex; flex-direction: column; align-items: center;
      gap: 0; margin: 16px auto; width: 160px; position: relative;
    }
    .s3-pipe {
      width: 28px; height: 40px;
      background: linear-gradient(90deg, #4a6070, #6a8090, #4a6070);
      border-radius: 4px; position: relative; z-index: 1;
    }
    .s3-valve-body {
      background: linear-gradient(180deg, #3a4a5a, #2a3540);
      border: 3px solid #4a6a7a; border-radius: 8px;
      width: 80px; padding: 8px 6px; text-align: center;
      position: relative; z-index: 2;
    }
    .s3-valve-wheel {
      font-size: 28px; color: #e05010; cursor: pointer;
      display: inline-block; transition: color 0.4s;
      transform-origin: center;
    }
    .s3-valve-label { font-size: 9px; color: #8090a0; line-height: 1.2; }
    @keyframes valveSpin {
      0%   { transform: rotate(0deg);   color: #e05010; }
      50%  { transform: rotate(180deg); color: #ff8020; }
      100% { transform: rotate(360deg); color: #40e870; }
    }
    .s3-tank {
      width: 120px; height: 90px; margin-top: 0;
      border: 3px solid #4a7a6a; border-top: none;
      border-radius: 0 0 10px 10px;
      background: rgba(5,20,15,0.8); position: relative; overflow: hidden;
    }
    .s3-tank-liquid {
      position: absolute; bottom: 0; left: 0; right: 0; height: 0;
      background: linear-gradient(180deg, rgba(100,40,5,0.6), rgba(60,20,0,0.9));
      transition: height 1.4s ease;
    }
    .s3-tank-label {
      position: absolute; inset: 0; display: flex; align-items: center;
      justify-content: center; font-size: 10px; color: #6090a0; text-align: center;
      pointer-events: none;
    }
    /* Flow drops */
    .s3-flow-container {
      width: 28px; height: 30px; position: relative; overflow: hidden;
    }
    .s3-drop {
      position: absolute; width: 5px; height: 10px;
      background: rgba(80,30,0,0.8); border-radius: 3px;
      animation: dropFall 0.6s linear infinite;
      opacity: 0;
    }
    @keyframes dropFall {
      from { top: -10px; opacity: 1; }
      to   { top: 100%;  opacity: 0; }
    }
    .s3-flow-container.flowing .s3-drop { opacity: 1; }

    .s3-valve-instruction {
      text-align: center; font-size: 13px; color: #7090a0;
      margin: 8px 0 0; line-height: 1.5;
    }
    .s3-valve-btn {
      background: linear-gradient(135deg, #8a2010, #c04020);
      display: block; margin: 10px auto 0;
    }
    .s3-valve-btn:hover:not(:disabled) { filter: brightness(1.25); }

    /* ── Level complete ──────────────────────────────── */
    .s3-level-complete {
      margin-top: 18px; text-align: center;
      padding: 18px; border-radius: 10px;
      background: rgba(0,80,40,0.2); border: 1px solid #00c864;
    }
    .s3-level-complete.hidden { display: none; }
    .s3-complete-icon { font-size: 40px; margin-bottom: 6px; }
    .s3-level-complete h3 { color: #40ff80; margin: 0 0 8px; font-size: 20px; }
    .s3-level-complete p  { font-size: 13px; color: #80a890; line-height: 1.6; margin: 0 0 12px; }
    .s3-final-score {
      font-size: 18px; font-weight: 700; color: #ffe040; margin-bottom: 10px;
    }
  `;

  const style = document.createElement('style');
  style.id = 's3-styles';
  style.textContent = css;
  document.head.appendChild(style);
}
