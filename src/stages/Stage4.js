import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { labTools, labMaterials, requiredTools, requiredMaterials } from '../data/items.js';
import { createLighting, makeTextSprite, showToast } from '../utils.js';

const PRACTICUM_STEPS = [
  {
    step: 1,
    title: 'Langkah 1: Pengukuran Awal',
    desc: 'Ukur COD, BOD, dan pH awal limbah vinasse menggunakan pH meter dan spektrofotometer.',
    cod: 45000, bod: 28000, ph: 4.2
  },
  {
    step: 2,
    title: 'Langkah 2: Penetralan pH',
    desc: 'Tambahkan CaCO₃ untuk menetralkan pH agar mencapai kondisi optimal bagi bakteri.',
    cod: 44500, bod: 27500, ph: 6.5
  },
  {
    step: 3,
    title: 'Langkah 3: Inokulasi Bakteri',
    desc: 'Tambahkan campuran Nitrosomonas, Nitrobacter, dan Aspergillus niger ke reaktor.',
    cod: 25000, bod: 15000, ph: 6.8
  },
  {
    step: 4,
    title: 'Langkah 4: Inkubasi 7 Hari',
    desc: 'Inkubasi selama 7 hari pada suhu 30°C dengan aerasi. Bakteri mendegradasi bahan organik.',
    cod: 5000, bod: 3000, ph: 7.0
  },
  {
    step: 5,
    title: 'Langkah 5: Pengukuran Akhir',
    desc: 'Setelah 14 hari, ukur kembali parameter. Hasil: COD, BOD turun drastis → pupuk organik cair!',
    cod: 220, bod: 110, ph: 7.2
  }
];

export class Stage4 {
  constructor(canvas, overlay, hud, gameManager) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.hud = hud;
    this.gm = gameManager;
    this.animId = null;
    this.time = 0;
    this.practicumStep = 0;
    this.phase = 'tools'; // tools → materials → design → practicum
  }

  init() {
    this._setupScene();
    this._buildLab();
    this._setupHUD();
    this._showPanel();
    this._animate();
  }

  _setupScene() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f9f0);
    this.scene.fog = new THREE.Fog(0xf0f9f0, 25, 60);

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    this.camera.position.set(0, 7, 18);
    this.camera.lookAt(0, 2, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 30;

    createLighting(this.scene, 0xddf0dd, 0xfff8f0);

    // Lab ceiling lights
    for (let i = -2; i <= 2; i++) {
      const pl = new THREE.PointLight(0xffffff, 0.8, 12);
      pl.position.set(i * 5, 8, 0);
      this.scene.add(pl);
    }

    this._onResize = () => {
      const w2 = this.canvas.clientWidth, h2 = this.canvas.clientHeight;
      this.camera.aspect = w2 / h2;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', this._onResize);
  }

  _buildLab() {
    const scene = this.scene;

    // Floor (white lab tiles)
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xe8f5e8 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 20), floorMat);
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Tile pattern
    for (let i = -7; i <= 7; i++) {
      for (let j = -5; j <= 5; j++) {
        if ((i + j) % 2 === 0) {
          const tile = new THREE.Mesh(
            new THREE.BoxGeometry(1.9, 0.02, 1.9),
            new THREE.MeshLambertMaterial({ color: 0xd0e8d0 })
          );
          tile.position.set(i * 2, 0.01, j * 2);
          scene.add(tile);
        }
      }
    }

    // Walls
    const wallMat = new THREE.MeshLambertMaterial({ color: 0xf0f9f0 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 0.4), wallMat);
    backWall.position.set(0, 6, -9);
    scene.add(backWall);

    // Lab benches
    const benchMat = new THREE.MeshLambertMaterial({ color: 0xd4e8d4 });
    [-8, 0, 8].forEach(x => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 2.5), benchMat);
      bench.position.set(x, 1, -4);
      bench.castShadow = true;
      scene.add(bench);

      [-2, 2].forEach(dx => {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 1, 0.15),
          new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        leg.position.set(x + dx, 0.5, -4);
        scene.add(leg);
      });
    });

    // Reactor tank (main experiment vessel)
    this.reactor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 3, 20),
      new THREE.MeshLambertMaterial({ color: 0xaaccaa, transparent: true, opacity: 0.7 })
    );
    this.reactor.position.set(0, 1.5, 2);
    this.reactor.castShadow = true;
    scene.add(this.reactor);

    // Liquid in reactor
    this.reactorLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.2, 20),
      new THREE.MeshLambertMaterial({ color: 0x6b3300, transparent: true, opacity: 0.85 })
    );
    this.reactorLiquid.position.set(0, 0.2, 2);
    scene.add(this.reactorLiquid);

    const reactorLabel = makeTextSprite('Reaktor Biologis', {
      fontSize: 18, bgColor: 'rgba(0,100,0,0.8)', fontColor: '#90ee90'
    });
    reactorLabel.scale.set(2.8, 0.52, 1);
    reactorLabel.position.set(0, 3.5, 2);
    scene.add(reactorLabel);

    // Lab equipment (visual only)
    this._addLabEquipment(scene);

    // Whiteboard
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(8, 4, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    board.position.set(0, 6, -8.7);
    scene.add(board);

    const boardLabel = makeTextSprite('Rancangan Pupuk Organik Cair dari Vinasse', {
      fontSize: 16, bgColor: 'rgba(240,255,240,0.9)', fontColor: '#155724', width: 500, height: 50
    });
    boardLabel.scale.set(6, 0.6, 1);
    boardLabel.position.set(0, 7.2, -8.5);
    scene.add(boardLabel);
  }

  _addLabEquipment(scene) {
    // Beakers on bench
    const beakerColors = [0x88ccff, 0xff9966, 0x88ffcc, 0xffcc88];
    const positions = [[-9.5, 1.25, -4], [-8.5, 1.25, -4], [-7.5, 1.25, -4]];
    positions.forEach(([x, y, z], i) => {
      const beaker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.18, 0.55, 12),
        new THREE.MeshLambertMaterial({ color: beakerColors[i], transparent: true, opacity: 0.7 })
      );
      beaker.position.set(x, y, z);
      scene.add(beaker);
    });

    // pH meter
    const phmeter = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 1.2, 0.25),
      new THREE.MeshLambertMaterial({ color: 0x444488 })
    );
    phmeter.position.set(1, 1.7, -4);
    scene.add(phmeter);

    // Spectrophotometer
    const spectro = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x334455 })
    );
    spectro.position.set(9, 1.4, -4);
    scene.add(spectro);

    // Aerator pump
    const aerPump = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 0.6),
      new THREE.MeshLambertMaterial({ color: 0x2255aa })
    );
    aerPump.position.set(-1, 2.8, 2);
    scene.add(aerPump);

    // Aerator tube
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6),
      new THREE.MeshLambertMaterial({ color: 0x666666 })
    );
    tube.position.set(-0.5, 1.8, 2);
    tube.rotation.z = Math.PI / 4;
    scene.add(tube);
  }

  _setupHUD() {
    this.hud.setStage('Tahap 4: Merancang Prototipe');
    this.hud.setHint('🔬 Pilih alat dan bahan untuk membuat pupuk organik cair');
  }

  _showPanel() {
    this.overlay.classList.add('active');
    if (this.phase === 'tools') this._renderToolSelection();
    else if (this.phase === 'materials') this._renderMaterialSelection();
    else if (this.phase === 'design') this._renderDesign();
    else if (this.phase === 'practicum') this._renderPracticum();
  }

  _renderToolSelection() {
    this.overlay.innerHTML = `
      <div style="position:absolute;top:70px;right:20px;pointer-events:all;width:380px;max-height:85vh;overflow-y:auto;">
        <div class="stage4-panel">
          <h3>🔬 Pilih Alat Laboratorium</h3>
          <p style="color:#374151;font-size:0.85rem;margin-bottom:14px;">
            Pilih alat yang diperlukan untuk membuat pupuk organik cair (pilih minimal 5):
          </p>
          <div class="tool-grid" id="tool-grid">
            ${labTools.map(t => `
              <div class="tool-item ${this.gm.selectedTools.has(t.id) ? 'selected' : ''}" data-id="${t.id}">
                <span class="icon">${t.icon}</span>
                ${t.name}
                <div style="font-size:0.7rem;color:#6b7280;margin-top:3px;">${t.description}</div>
              </div>
            `).join('')}
          </div>
          <div id="tool-count" style="color:#374151;font-size:0.85rem;margin-bottom:12px;">
            Dipilih: ${this.gm.selectedTools.size}/${requiredTools.length} alat wajib
          </div>
          <button class="aerator-btn" id="next-tools-btn"
            style="background:linear-gradient(135deg,#16a34a,#059669);"
            ${this._checkToolsSelected() ? '' : 'disabled'}>
            Pilih Bahan → 
          </button>
        </div>
      </div>
    `;

    document.querySelectorAll('.tool-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        if (this.gm.selectedTools.has(id)) {
          this.gm.selectedTools.delete(id);
          el.classList.remove('selected');
        } else {
          this.gm.selectTool(id);
          el.classList.add('selected');
        }
        document.getElementById('tool-count').textContent =
          `Dipilih: ${this.gm.selectedTools.size}/${requiredTools.length} alat wajib`;
        document.getElementById('next-tools-btn').disabled = !this._checkToolsSelected();
      });
    });

    document.getElementById('next-tools-btn').addEventListener('click', () => {
      this.phase = 'materials';
      this._renderMaterialSelection();
    });
  }

  _checkToolsSelected() {
    return requiredTools.every(id => this.gm.selectedTools.has(id));
  }

  _renderMaterialSelection() {
    this.overlay.innerHTML = `
      <div style="position:absolute;top:70px;right:20px;pointer-events:all;width:380px;">
        <div class="stage4-panel">
          <h3>🧴 Pilih Bahan Percobaan</h3>
          <p style="color:#374151;font-size:0.85rem;margin-bottom:14px;">Pilih semua bahan yang diperlukan:</p>
          <div class="tool-grid" id="mat-grid">
            ${labMaterials.map(m => `
              <div class="tool-item ${this.gm.selectedMaterials.has(m.id) ? 'selected' : ''}" data-id="${m.id}">
                <span class="icon">${m.icon}</span>
                ${m.name}
                <div style="font-size:0.7rem;color:#6b7280;margin-top:3px;">${m.description}</div>
              </div>
            `).join('')}
          </div>
          <div id="mat-count" style="color:#374151;font-size:0.85rem;margin-bottom:12px;">
            Dipilih: ${this.gm.selectedMaterials.size}/${requiredMaterials.length} bahan wajib
          </div>
          <button class="aerator-btn" id="next-mats-btn"
            style="background:linear-gradient(135deg,#16a34a,#059669);"
            ${this._checkMatsSelected() ? '' : 'disabled'}>
            Rancang Prosedur →
          </button>
        </div>
      </div>
    `;

    document.querySelectorAll('#mat-grid .tool-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        if (this.gm.selectedMaterials.has(id)) {
          this.gm.selectedMaterials.delete(id);
          el.classList.remove('selected');
        } else {
          this.gm.selectMaterial(id);
          el.classList.add('selected');
        }
        document.getElementById('mat-count').textContent =
          `Dipilih: ${this.gm.selectedMaterials.size}/${requiredMaterials.length} bahan wajib`;
        document.getElementById('next-mats-btn').disabled = !this._checkMatsSelected();
      });
    });

    document.getElementById('next-mats-btn').addEventListener('click', () => {
      this.phase = 'design';
      this._renderDesign();
    });
  }

  _checkMatsSelected() {
    return requiredMaterials.every(id => this.gm.selectedMaterials.has(id));
  }

  _renderDesign() {
    this.overlay.innerHTML = `
      <div style="position:absolute;top:70px;right:20px;pointer-events:all;width:400px;max-height:85vh;overflow-y:auto;">
        <div class="stage4-panel">
          <h3>📋 Rancangan Prosedur Praktikum</h3>
          
          <div style="margin-bottom:14px;">
            <label style="color:#374151;font-size:0.85rem;font-weight:600;">Perlakuan:</label>
            <select id="treatment-select" style="width:100%;padding:8px;border-radius:6px;border:1px solid #d1fae5;margin-top:4px;font-size:0.9rem;">
              <option value="">-- Pilih Perlakuan --</option>
              <option value="P0">P0: Kontrol (tanpa bakteri)</option>
              <option value="P1">P1: Dosis bakteri 5% (v/v)</option>
              <option value="P2">P2: Dosis bakteri 10% (v/v)</option>
              <option value="P3">P3: Dosis bakteri 15% (v/v)</option>
            </select>
          </div>

          <div style="margin-bottom:14px;">
            <label style="color:#374151;font-size:0.85rem;font-weight:600;">Ulangan:</label>
            <select id="rep-select" style="width:100%;padding:8px;border-radius:6px;border:1px solid #d1fae5;margin-top:4px;font-size:0.9rem;">
              <option value="">-- Pilih Jumlah Ulangan --</option>
              <option value="3">3 kali ulangan</option>
              <option value="4">4 kali ulangan</option>
            </select>
          </div>

          <div style="margin-bottom:14px;">
            <label style="color:#374151;font-size:0.85rem;font-weight:600;">Dosis Optimal:</label>
            <select id="dose-select" style="width:100%;padding:8px;border-radius:6px;border:1px solid #d1fae5;margin-top:4px;font-size:0.9rem;">
              <option value="">-- Pilih Dosis Optimal --</option>
              <option value="5">5% (v/v)</option>
              <option value="10">10% (v/v) ← Direkomendasikan</option>
              <option value="15">15% (v/v)</option>
            </select>
          </div>

          <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:8px;padding:12px;margin-bottom:14px;font-size:0.82rem;color:#374151;">
            <strong>Parameter Pengamatan:</strong><br>
            • COD (Chemical Oxygen Demand)<br>
            • BOD (Biological Oxygen Demand)<br>
            • pH larutan<br>
            • Hari ke-0, 3, 7, 10, 14
          </div>

          <button class="aerator-btn" id="start-practicum-btn"
            style="background:linear-gradient(135deg,#16a34a,#059669);"
            disabled>
            ▶ Mulai Simulasi Praktikum
          </button>
        </div>
      </div>
    `;

    const checkReady = () => {
      const t = document.getElementById('treatment-select').value;
      const r = document.getElementById('rep-select').value;
      const d = document.getElementById('dose-select').value;
      document.getElementById('start-practicum-btn').disabled = !(t && r && d);
    };

    ['treatment-select', 'rep-select', 'dose-select'].forEach(id => {
      document.getElementById(id).addEventListener('change', checkReady);
    });

    document.getElementById('start-practicum-btn').addEventListener('click', () => {
      this.phase = 'practicum';
      this.practicumStep = 0;
      this._renderPracticum();
    });
  }

  _renderPracticum() {
    const step = PRACTICUM_STEPS[this.practicumStep];
    const isLast = this.practicumStep === PRACTICUM_STEPS.length - 1;

    this.overlay.innerHTML = `
      <div style="position:absolute;top:70px;right:20px;pointer-events:all;width:400px;max-height:88vh;overflow-y:auto;">
        <div class="lab-panel">
          <h3>⚗️ Simulasi Praktikum</h3>
          
          <div class="step-indicator">
            ${PRACTICUM_STEPS.map((_, i) => `
              <div class="step-dot ${i < this.practicumStep ? 'done' : i === this.practicumStep ? 'active' : ''}"></div>
            `).join('')}
          </div>

          <h4 style="color:#60a5fa;margin:12px 0 8px;">${step.title}</h4>
          <p style="color:#94a3b8;font-size:0.88rem;line-height:1.6;margin-bottom:14px;">${step.desc}</p>

          <table class="data-table">
            <thead><tr><th>Parameter</th><th>Nilai</th><th>Status</th></tr></thead>
            <tbody>
              <tr>
                <td>COD</td>
                <td class="${step.cod > 300 ? 'bad' : 'good'}">${step.cod.toLocaleString()} mg/L</td>
                <td class="${step.cod > 300 ? 'bad' : 'good'}">${step.cod > 300 ? '❌' : '✅'}</td>
              </tr>
              <tr>
                <td>BOD</td>
                <td class="${step.bod > 150 ? 'bad' : 'good'}">${step.bod.toLocaleString()} mg/L</td>
                <td class="${step.bod > 150 ? 'bad' : 'good'}">${step.bod > 150 ? '❌' : '✅'}</td>
              </tr>
              <tr>
                <td>pH</td>
                <td class="${(step.ph >= 6 && step.ph <= 9) ? 'good' : 'bad'}">${step.ph}</td>
                <td class="${(step.ph >= 6 && step.ph <= 9) ? 'good' : 'bad'}">${(step.ph >= 6 && step.ph <= 9) ? '✅' : '❌'}</td>
              </tr>
            </tbody>
          </table>

          ${isLast ? `
            <div style="background:rgba(74,222,128,0.1);border:1px solid #4ade80;border-radius:8px;padding:12px;margin-top:12px;color:#86efac;font-size:0.88rem;">
              🎉 <strong>Berhasil!</strong> Limbah vinasse berhasil diolah menjadi pupuk organik cair!
              COD dan BOD sudah di bawah baku mutu.
            </div>
            <button class="aerator-btn" id="proceed-eval-btn" style="background:linear-gradient(135deg,#16a34a,#059669);margin-top:14px;">
              Lanjut ke Evaluasi ➜
            </button>
          ` : `
            <button class="aerator-btn" id="next-step-btn" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);margin-top:14px;">
              ${step.step < PRACTICUM_STEPS.length ? `Lanjut: Langkah ${step.step + 1} →` : ''}
            </button>
          `}
        </div>
      </div>
    `;

    // Update reactor color based on step
    if (this.reactorLiquid) {
      const colors = [0x6b3300, 0x8b6500, 0x5c7a3a, 0x3a7a3a, 0x2d6a4f];
      this.reactorLiquid.material.color.setHex(colors[this.practicumStep] || 0x2d6a4f);
      // Raise liquid level
      const height = 0.2 + this.practicumStep * 0.3;
      this.reactorLiquid.scale.y = 1 + this.practicumStep * 2;
      this.reactorLiquid.position.y = height;
    }

    const nextBtn = document.getElementById('next-step-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.practicumStep++;
        this._renderPracticum();
      });
    }

    const evalBtn = document.getElementById('proceed-eval-btn');
    if (evalBtn) {
      evalBtn.addEventListener('click', () => {
        this.gm.completeStage('stage4');
        this.gm.goToStage('evaluation');
      });
    }
  }

  _animate() {
    this.animId = requestAnimationFrame(() => this._animate());
    this.time += 0.016;
    this.controls.update();

    // Reactor bubble animation
    if (this.reactor) {
      this.reactor.rotation.y = this.time * 0.1;
    }
    if (this.reactorLiquid) {
      this.reactorLiquid.position.y = (0.2 + this.practicumStep * 0.3) + Math.sin(this.time) * 0.02;
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
