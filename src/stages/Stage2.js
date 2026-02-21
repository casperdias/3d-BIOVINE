import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { stage2Data } from '../data/questions.js';
import { createLighting, makeTextSprite, showToast } from '../utils.js';

export class Stage2 {
  constructor(canvas, overlay, hud, gameManager) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.hud = hud;
    this.gm = gameManager;
    this.animId = null;
    this.tourStep = 0;
    this.aerated = false;
    this.tourDone = false;
    this.time = 0;
  }

  init() {
    this._setupScene();
    this._buildFactory();
    this._setupHUD();
    this._showTour();
    this._animate();
  }

  _setupScene() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.025);

    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 100);
    this.camera.position.set(0, 6, 18);
    this.camera.lookAt(0, 2, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 30;

    createLighting(this.scene, 0x2a3a4a, 0xfff0cc);

    // Point lights for factory atmosphere
    const pointL1 = new THREE.PointLight(0x4488ff, 1.5, 15);
    pointL1.position.set(-5, 5, 0);
    this.scene.add(pointL1);
    const pointL2 = new THREE.PointLight(0xff6622, 1, 12);
    pointL2.position.set(5, 3, 0);
    this.scene.add(pointL2);

    this._onResize = () => {
      const w2 = this.canvas.clientWidth, h2 = this.canvas.clientHeight;
      this.camera.aspect = w2 / h2;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', this._onResize);
  }

  _buildFactory() {
    const scene = this.scene;

    // Floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.2, 20),
      new THREE.MeshLambertMaterial({ color: 0x2a2a3a })
    );
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x3a3a4a });
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 0.4), wallMat);
    wallBack.position.set(0, 7, -10);
    scene.add(wallBack);
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 14, 20), wallMat);
    wallL.position.set(-15, 7, 0);
    scene.add(wallL);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 14, 20), wallMat);
    wallR.position.set(15, 7, 0);
    scene.add(wallR);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.4, 20),
      new THREE.MeshLambertMaterial({ color: 0x222233 })
    );
    ceiling.position.y = 14;
    scene.add(ceiling);

    // === FERMENTATION TANKS ===
    const tankMat = new THREE.MeshLambertMaterial({ color: 0x8888aa });
    for (let i = 0; i < 3; i++) {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 5, 16), tankMat);
      tank.position.set(-8 + i * 4, 2.5, -5);
      tank.castShadow = true;
      scene.add(tank);

      // Liquid inside (transparent cylinder)
      const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(1.35, 1.35, 3, 16),
        new THREE.MeshLambertMaterial({ color: 0x8b4513, transparent: true, opacity: 0.7 })
      );
      liquid.position.set(-8 + i * 4, 1.5, -5);
      scene.add(liquid);

      // Tank label
      const lbl = makeTextSprite(`Tangki ${i + 1}`, { fontSize: 16, bgColor: 'rgba(30,30,60,0.85)' });
      lbl.scale.set(2, 0.45, 1);
      lbl.position.set(-8 + i * 4, 6, -5);
      scene.add(lbl);
    }

    // === DISTILLATION COLUMN ===
    const distMat = new THREE.MeshLambertMaterial({ color: 0xaaaacc });
    const distCol = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 8, 16), distMat);
    distCol.position.set(6, 4, -5);
    distCol.castShadow = true;
    scene.add(distCol);

    const distLabel = makeTextSprite('Kolom Distilasi', { fontSize: 16, bgColor: 'rgba(20,20,60,0.85)', fontColor: '#aaf' });
    distLabel.scale.set(2.5, 0.5, 1);
    distLabel.position.set(6, 9, -5);
    scene.add(distLabel);

    // Pipe from distillation
    const pipeMat = new THREE.MeshLambertMaterial({ color: 0x666688 });
    const pipeH = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 8), pipeMat);
    pipeH.rotation.z = Math.PI / 2;
    pipeH.position.set(9, 1.5, -5);
    scene.add(pipeH);

    // === VINASSE POOL ===
    const poolMat = new THREE.MeshLambertMaterial({ color: 0x3a1800 });
    const pool = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 4), poolMat);
    pool.position.set(11, 0.25, -5);
    scene.add(pool);

    const vinasseLiquid = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.3, 3.6),
      new THREE.MeshLambertMaterial({ color: 0x6b3300, transparent: true, opacity: 0.9 })
    );
    vinasseLiquid.position.set(11, 0.45, -5);
    scene.add(vinasseLiquid);
    this.vinasseLiquid = vinasseLiquid;

    const poolLabel = makeTextSprite('⚠ Limbah Vinasse', { fontSize: 18, bgColor: 'rgba(100,40,0,0.85)', fontColor: '#ffa040' });
    poolLabel.scale.set(3, 0.55, 1);
    poolLabel.position.set(11, 1.5, -5);
    scene.add(poolLabel);

    // === LAB TABLE (titration area) ===
    const tableMat = new THREE.MeshLambertMaterial({ color: 0x444455 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 3), tableMat);
    table.position.set(-8, 1, 3);
    table.receiveShadow = true;
    scene.add(table);

    // Lab equipment on table
    const glassColors = [0x88ccff, 0x88ffcc, 0xffcc88];
    const glassPositions = [[-10, 1.3, 3], [-8, 1.3, 3], [-6, 1.3, 3]];
    glassPositions.forEach(([x, y, z], i) => {
      const glass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.18, 0.7, 12),
        new THREE.MeshLambertMaterial({ color: glassColors[i], transparent: true, opacity: 0.7 })
      );
      glass.position.set(x, y, z);
      scene.add(glass);
    });

    const labLabel = makeTextSprite('Meja Titrasi', { fontSize: 16, bgColor: 'rgba(20,40,80,0.85)', fontColor: '#88ccff' });
    labLabel.scale.set(2, 0.45, 1);
    labLabel.position.set(-8, 2.5, 3);
    scene.add(labLabel);

    // Aerator machine
    const aeratorMat = new THREE.MeshLambertMaterial({ color: 0x2255aa });
    const aerator = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.2), aeratorMat);
    aerator.position.set(0, 0.6, 3);
    scene.add(aerator);

    const aeratorLabel = makeTextSprite('Aerator', { fontSize: 16, bgColor: 'rgba(10,30,80,0.85)', fontColor: '#66aaff' });
    aeratorLabel.scale.set(1.8, 0.42, 1);
    aeratorLabel.position.set(0, 2, 3);
    scene.add(aeratorLabel);

    // Bubble particles (for aerator animation)
    this.bubbles = [];
    for (let i = 0; i < 12; i++) {
      const b = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
      );
      b.position.set(11 + (Math.random() - 0.5) * 4, 0.3, -5 + (Math.random() - 0.5) * 3);
      b.userData.startY = b.position.y;
      b.userData.offset = Math.random() * Math.PI * 2;
      scene.add(b);
      this.bubbles.push(b);
    }
  }

  _setupHUD() {
    this.hud.setStage('Tahap 2: Akar Masalah');
    this.hud.setHint('🏭 Tur pabrik untuk memahami proses distilasi');
  }

  _showTour() {
    this.overlay.classList.add('active');
    this._renderTourStep();
  }

  _tourSteps = [
    {
      title: '🏭 Pabrik Etanol - Proses Distilasi',
      text: 'Selamat datang di pabrik etanol! Di sini tebu difermentasi untuk menghasilkan bioetanol. Proses distilasi memisahkan etanol dari limbah.',
      hint: '→ Selanjutnya: Limbah Vinasse'
    },
    {
      title: '⚠ Masalah: Limbah Vinasse',
      text: 'Setiap 1 liter etanol menghasilkan 10-15 liter vinasse! Vinasse memiliki COD 45.000 mg/L, BOD 28.000 mg/L, dan pH 4.2 — jauh di atas standar baku mutu.',
      hint: '→ Selanjutnya: Simulasi Titrasi'
    },
    {
      title: '🧪 Simulasi Laboratorium',
      text: 'Mari ukur parameter kunci limbah vinasse dan lihat apakah aerasi saja cukup untuk menurunkan kadar pencemar.',
      hint: '→ Buka Panel Lab'
    }
  ];

  _renderTourStep() {
    const step = this._tourSteps[this.tourStep];
    const isLast = this.tourStep === this._tourSteps.length - 1;

    this.overlay.innerHTML = `
      <div style="position:absolute;bottom:80px;left:50%;transform:translateX(-50%);pointer-events:all;width:90%;max-width:480px;">
        <div class="tour-panel">
          <h4>${step.title}</h4>
          <p>${step.text}</p>
          <p class="tour-step">Langkah ${this.tourStep + 1}/${this._tourSteps.length}</p>
          <button class="nav-btn" id="tour-next-btn">${isLast ? '🧪 Buka Lab' : 'Selanjutnya →'}</button>
        </div>
      </div>
      <button class="proceed-btn" id="stage2-proceed" style="display:none" disabled>Lanjut ke Tahap 3 ➜</button>
    `;

    document.getElementById('tour-next-btn').addEventListener('click', () => {
      if (this.tourStep < this._tourSteps.length - 1) {
        this.tourStep++;
        this._renderTourStep();
      } else {
        this._showLabPanel();
      }
    });
  }

  _showLabPanel() {
    this.tourDone = true;
    const d = stage2Data;
    this.overlay.innerHTML = `
      <div class="overlay-center" style="pointer-events:all;">
        <div class="lab-panel scrollable" style="max-height:85vh;">
          <h3>🧪 Simulasi Laboratorium Titrasi</h3>
          <p style="color:#94a3b8;font-size:0.88rem;margin-bottom:12px;">Nilai awal limbah vinasse dari pabrik:</p>
          <table class="data-table">
            <thead><tr><th>Parameter</th><th>Nilai Awal</th><th>Baku Mutu</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>COD</td><td class="bad">${d.initial.cod.toLocaleString()} mg/L</td><td>&lt; 300 mg/L</td><td class="bad">❌ Sangat Tinggi</td></tr>
              <tr><td>BOD</td><td class="bad">${d.initial.bod.toLocaleString()} mg/L</td><td>&lt; 150 mg/L</td><td class="bad">❌ Sangat Tinggi</td></tr>
              <tr><td>pH</td><td class="bad">${d.initial.ph}</td><td>6 – 9</td><td class="bad">❌ Sangat Asam</td></tr>
            </tbody>
          </table>

          <div id="aeration-section">
            <p style="color:#94a3b8;font-size:0.88rem;margin:12px 0 8px;">Coba tekan aerator untuk melihat efeknya:</p>
            <button class="aerator-btn" id="aerator-btn">💨 Nyalakan Aerator</button>
          </div>

          <div id="aeration-result" style="display:none">
            <p style="color:#94a3b8;font-size:0.88rem;margin:14px 0 8px;">Hasil setelah aerasi:</p>
            <table class="data-table">
              <thead><tr><th>Parameter</th><th>Setelah Aerasi</th><th>Baku Mutu</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td>COD</td><td class="bad">${d.afterAeration.cod.toLocaleString()} mg/L</td><td>&lt; 300 mg/L</td><td class="bad">❌ Masih Tinggi (-15%)</td></tr>
                <tr><td>BOD</td><td class="bad">${d.afterAeration.bod.toLocaleString()} mg/L</td><td>&lt; 150 mg/L</td><td class="bad">❌ Masih Tinggi (-21%)</td></tr>
                <tr><td>pH</td><td class="bad">${d.afterAeration.ph}</td><td>6 – 9</td><td class="bad">❌ Masih Asam</td></tr>
              </tbody>
            </table>
            <div style="background:rgba(239,68,68,0.1);border:1px solid #ef4444;border-radius:8px;padding:12px;margin-top:12px;color:#fca5a5;font-size:0.88rem;">
              ⚠ <strong>Kesimpulan:</strong> Aerasi saja tidak cukup! Penurunan COD hanya ~15%, BOD ~21%. 
              Kita membutuhkan <strong style="color:#4ade80">mikroorganisme</strong> untuk degradasi biologis yang efektif!
            </div>
            <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.3);border-radius:8px;padding:12px;margin-top:8px;color:#86efac;font-size:0.88rem;">
              🎯 Target dengan mikroorganisme: COD &lt;300 mg/L, BOD &lt;150 mg/L, pH 6-9
            </div>
          </div>

          <button class="proceed-btn" id="stage2-proceed" style="position:static;margin-top:20px;width:100%;display:none">
            Lanjut ke Tahap 3 ➜
          </button>
        </div>
      </div>
    `;

    document.getElementById('aerator-btn').addEventListener('click', () => {
      this._activateAerator();
    });
  }

  _activateAerator() {
    this.aerated = true;
    document.getElementById('aerator-btn').disabled = true;
    document.getElementById('aerator-btn').textContent = '✅ Aerator Aktif';
    document.getElementById('aeration-result').style.display = 'block';
    const proceedBtn = document.getElementById('stage2-proceed');
    if (proceedBtn) {
      proceedBtn.style.display = 'block';
      proceedBtn.addEventListener('click', () => {
        this.gm.completeStage('stage2');
        this.gm.goToStage('stage3');
      });
    }

    // Activate bubble animation
    this.bubblesActive = true;
    showToast('💨 Aerator dinyalakan!', 'info');
  }

  _animate() {
    this.animId = requestAnimationFrame(() => this._animate());
    this.time += 0.016;
    this.controls.update();

    // Bubble animation when aerator active
    if (this.bubblesActive && this.bubbles) {
      this.bubbles.forEach((b, i) => {
        b.material.opacity = 0.5 + Math.sin(this.time * 2 + b.userData.offset) * 0.3;
        b.position.y = b.userData.startY + ((this.time * 0.8 + b.userData.offset) % 1.5);
        if (b.position.y > 1.5) b.position.y = b.userData.startY;
      });
    }

    // Vinasse slight ripple
    if (this.vinasseLiquid) {
      this.vinasseLiquid.position.y = 0.45 + Math.sin(this.time * 0.5) * 0.01;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    this.overlay.classList.remove('active');
    this.overlay.innerHTML = '';
  }
}
