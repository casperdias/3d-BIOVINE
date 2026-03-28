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
    showShopPanel((purchasedId, livesLost) => {
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
    </div>
  `;
  document.body.appendChild(overlay);

  $('s3-shop-pts').textContent = state.totalPoints + ' poin';

  let purchasedId = null;
  let livesLost   = 0;

  const grid = $('s3-shop-grid');
  microorganisms.forEach(micro => {
    const card = document.createElement('div');
    card.className = 's3-micro-card';
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
      <button class="s3-buy-btn ${!canAfford ? 'disabled' : ''}"
              data-id="${micro.id}" ${!canAfford ? 'disabled' : ''}>
        Beli
      </button>
    `;
    grid.appendChild(card);
  });

  // Buy button handler
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.s3-buy-btn');
    if (!btn || btn.disabled || purchasedId) return;

    const micro = microorganisms.find(m => m.id === btn.dataset.id);
    if (!micro) return;

    // Deduct cost
    state.totalPoints -= micro.price;
    updateHUD();
    $('s3-shop-pts').textContent = state.totalPoints + ' poin';

    purchasedId = micro.id;

    // Disable all buy buttons
    grid.querySelectorAll('.s3-buy-btn').forEach(b => (b.disabled = true));

    // Highlight chosen card
    const chosenCard = btn.closest('.s3-micro-card');
    chosenCard.classList.add('chosen');

    // Show result
    const resultEl = $('s3-shop-result');
    resultEl.classList.remove('hidden');

    if (micro.outcome === 'punishment') {
      livesLost = 1;
      resultEl.className = 's3-shop-result punishment';
      resultEl.innerHTML = micro.punishmentText;
      // Still allow continuing (with punishment noted)
      setTimeout(() => $('s3-btn-to-lab').classList.remove('hidden'), 1000);
    } else {
      resultEl.className = 's3-shop-result ' +
        (micro.outcome === 'reward_high' ? 'reward-high' : 'reward-mid');
      resultEl.innerHTML = micro.rewardText;
      setTimeout(() => $('s3-btn-to-lab').classList.remove('hidden'), 800);
    }
  });

  $('s3-btn-to-lab').onclick = () => {
    removeOverlay();
    onComplete(purchasedId, livesLost);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 – Lab Calculation
// ─────────────────────────────────────────────────────────────────────────────
function showLabPanel(microId, onComplete) {
  const micro = microorganisms.find(m => m.id === microId) || microorganisms[0];

  const overlay = makeOverlay('s3-overlay');
  overlay.innerHTML = `
    <div class="s3-card">
      <div class="s3-header">
        <span class="s3-badge">🔬 LAB KALKULASI</span>
        <h2 class="s3-title">Menentukan Dosis & Waktu Perlakuan</h2>
        <p class="s3-subtitle">Mikroorganisme dipilih: <b>${micro.emoji} ${micro.name}</b></p>
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

      <div class="s3-lab-intro">
        <p>Setelah memilih mikroorganisme, kamu perlu menentukan:</p>
        <ul>
          <li>Berapa <b>dosis</b> (jumlah) mikroorganisme yang dibutuhkan per liter vinasse?</li>
          <li>Berapa <b>lama</b> waktu perlakuan yang diperlukan hingga kadar COD/BOD turun?</li>
        </ul>
        <p>Pilih volume vinasse yang akan diolah, lalu hitung kebutuhan mikrobanya.</p>
      </div>

      <!-- Volume selector -->
      <div class="s3-lab-section">
        <label class="s3-lab-label">📦 Volume Vinasse yang Akan Diolah</label>
        <div class="s3-vol-btns">
          ${[10, 50, 100, 500, 1000].map(v => `
            <button class="s3-vol-btn" data-vol="${v}">${v} L</button>
          `).join('')}
        </div>
      </div>

      <!-- Result card (hidden until volume chosen) -->
      <div class="s3-lab-result hidden" id="s3-lab-result">
        <div class="s3-calc-grid" id="s3-calc-grid"></div>
        <div class="s3-lab-notes" id="s3-lab-notes"></div>
      </div>

      <button class="s3-btn hidden" id="s3-btn-to-valve">🚰 Aktifkan Kran Vinasse →</button>
    </div>
  `;
  document.body.appendChild(overlay);

  let volChosen = false;

  overlay.querySelectorAll('.s3-vol-btn').forEach(btn => {
    btn.onclick = () => {
      overlay.querySelectorAll('.s3-vol-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const vol = parseInt(btn.dataset.vol);
      volChosen = true;

      const calc = calcMicroDose(microId, vol);
      const resultEl = $('s3-lab-result');
      const gridEl   = $('s3-calc-grid');
      const notesEl  = $('s3-lab-notes');
      resultEl.classList.remove('hidden');

      if (!calc) {
        gridEl.innerHTML = `
          <div class="s3-calc-card fail">
            <span class="s3-calc-icon">⛔</span>
            <span class="s3-calc-label">Tidak dapat digunakan</span>
            <span class="s3-calc-value">${micro.name} tidak cocok untuk vinasse</span>
          </div>
        `;
        notesEl.innerHTML = `⚠️ Pilihan mikroorganisme tidak valid untuk kondisi vinasse ini.`;
      } else {
        gridEl.innerHTML = [
          { icon: '⚗️', label: 'Volume Vinasse',  value: `${vol} L` },
          { icon: '🧫', label: 'Dosis Mikro',     value: `${calc.total} ${calc.unit}` },
          { icon: '⏱️', label: 'Durasi Perlakuan', value: calc.duration },
          { icon: '📉', label: 'Penurunan COD',   value: calc.codRemoval },
          { icon: '💧', label: 'Penurunan BOD',   value: calc.bodRemoval },
        ].map(p => `
          <div class="s3-calc-card">
            <span class="s3-calc-icon">${p.icon}</span>
            <span class="s3-calc-label">${p.label}</span>
            <span class="s3-calc-value">${p.value}</span>
          </div>
        `).join('');
        notesEl.innerHTML = `📝 <b>Catatan:</b> ${calc.notes}`;
      }

      $('s3-btn-to-valve').classList.remove('hidden');
    };
  });

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
