import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { stage4Questions } from '../data/questions.js';
import { QuizModal } from '../ui/QuizModal.js';
import { createLighting, makeTextSprite } from '../utils.js';

export class Evaluation {
  constructor(canvas, overlay, hud, gameManager) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.hud = hud;
    this.gm = gameManager;
    this.animId = null;
    this.time = 0;
    this.currentQ = 0;
    this.allAnswered = false;
  }

  init() {
    this._setupScene();
    this._buildScene();
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
    this.scene.background = new THREE.Color(0x12102a);

    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 100);
    this.camera.position.set(0, 5, 14);
    this.camera.lookAt(0, 2, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;

    createLighting(this.scene, 0x1a1040, 0xffeecc);

    const warmLight = new THREE.PointLight(0xf59e0b, 1.5, 20);
    warmLight.position.set(0, 8, 0);
    this.scene.add(warmLight);

    this._onResize = () => {
      const w2 = this.canvas.clientWidth, h2 = this.canvas.clientHeight;
      this.camera.aspect = w2 / h2;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', this._onResize);
  }

  _buildScene() {
    const scene = this.scene;

    // Floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.2, 20),
      new THREE.MeshLambertMaterial({ color: 0x1e1b4b })
    );
    floor.position.y = -0.1;
    scene.add(floor);

    // Presentation screen
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(10, 6, 0.1),
      new THREE.MeshLambertMaterial({ color: 0xfef3c7 })
    );
    screen.position.set(0, 4, -8);
    scene.add(screen);

    const screenLabel = makeTextSprite('EVALUASI PERCOBAAN', {
      fontSize: 22, bgColor: 'rgba(245,158,11,0.1)', fontColor: '#d97706', width: 420, height: 55
    });
    screenLabel.scale.set(7, 0.9, 1);
    screenLabel.position.set(0, 7.5, -8);
    scene.add(screenLabel);

    // Data charts (simplified as colored boxes)
    const chartColors = [0xef4444, 0xf59e0b, 0x4ade80];
    const chartHeights = [5, 3, 0.5];
    chartColors.forEach((c, i) => {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, chartHeights[i], 0.3),
        new THREE.MeshLambertMaterial({ color: c })
      );
      bar.position.set(-3 + i * 3, chartHeights[i] / 2 + 0.1, -7.5);
      scene.add(bar);

      const lbl = makeTextSprite(['Awal', 'Aerasi', 'Mikro'][i], {
        fontSize: 14, bgColor: 'rgba(20,10,40,0.8)', width: 140, height: 38
      });
      lbl.scale.set(1.4, 0.38, 1);
      lbl.position.set(-3 + i * 3, chartHeights[i] + 0.9, -7.5);
      scene.add(lbl);
    });

    // Microscope
    const microscopeMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const microBase = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 0.8), microscopeMat);
    microBase.position.set(-6, 0.1, 2);
    scene.add(microBase);
    const microBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 10), microscopeMat);
    microBody.position.set(-6, 1.2, 2);
    scene.add(microBody);

    // Failure beaker (red tinted)
    const failBeaker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.35, 1, 12),
      new THREE.MeshLambertMaterial({ color: 0xff4444, transparent: true, opacity: 0.7 })
    );
    failBeaker.position.set(6, 0.5, 2);
    scene.add(failBeaker);

    const failLabel = makeTextSprite('❌ pH Terlalu Asam', {
      fontSize: 14, bgColor: 'rgba(100,0,0,0.85)', fontColor: '#fca5a5'
    });
    failLabel.scale.set(2.5, 0.45, 1);
    failLabel.position.set(6, 1.8, 2);
    scene.add(failLabel);
  }

  _setupHUD() {
    this.hud.setStage('Evaluasi: Analisis Kegagalan');
    this.hud.setHint('📊 Analisis mengapa percobaan bisa gagal dan solusinya');
  }

  _showPanel() {
    this.overlay.classList.add('active');
    this._renderPanel();
  }

  _renderPanel() {
    this.overlay.innerHTML = `
      <div style="position:absolute;top:70px;right:20px;pointer-events:all;width:420px;max-height:85vh;overflow-y:auto;">
        <div class="eval-panel">
          <h3>📊 Melakukan Evaluasi</h3>
          <p style="color:#94a3b8;font-size:0.88rem;margin-bottom:16px;">
            Analisis grafik menunjukkan bahwa aerasi saja tidak efektif. 
            Jawab pertanyaan berikut untuk memahami kegagalan percobaan:
          </p>

          ${!this.allAnswered ? `
            <div id="eval-quiz-area">
              <p style="color:#fbbf24;font-size:0.9rem;margin-bottom:12px;">
                Pertanyaan ${this.currentQ + 1}/${stage4Questions.length}:
              </p>
              <button class="aerator-btn" id="start-quiz-btn" style="background:linear-gradient(135deg,#d97706,#b45309);">
                📝 Jawab Pertanyaan Evaluasi
              </button>
            </div>
          ` : `
            <div style="background:rgba(74,222,128,0.1);border:1px solid #4ade80;border-radius:8px;padding:14px;margin-bottom:16px;color:#86efac;font-size:0.88rem;">
              ✅ <strong>Evaluasi selesai!</strong><br>
              Anda telah memahami penyebab kegagalan percobaan dan solusinya.
            </div>
            <div style="background:rgba(245,158,11,0.1);border:1px solid #f59e0b;border-radius:8px;padding:12px;margin-bottom:16px;color:#fde68a;font-size:0.85rem;">
              <strong>Temuan Evaluasi:</strong><br>
              1. pH 4.2 terlalu asam → bakteri tidak aktif<br>
              2. Perlu penetralan pH terlebih dahulu (CaCO₃)<br>
              3. Aerasi perlu dikombinasikan dengan biologi
            </div>
            <button class="aerator-btn" id="proceed-rec-btn" style="background:linear-gradient(135deg,#059669,#047857);">
              Lanjut ke Rekomendasi ➜
            </button>
          `}
        </div>
      </div>
    `;

    const startBtn = document.getElementById('start-quiz-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this._startQuiz());
    }

    const proceedBtn = document.getElementById('proceed-rec-btn');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        this.gm.completeStage('evaluation');
        this.gm.goToStage('recommendation');
      });
    }
  }

  _startQuiz() {
    const q = stage4Questions[this.currentQ];
    const quizContainer = document.createElement('div');
    quizContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:200;pointer-events:all;';
    document.body.appendChild(quizContainer);

    new QuizModal(quizContainer, q, (pts) => {
      this.gm.addPoints(pts);
      quizContainer.remove();
      this.currentQ++;
      if (this.currentQ >= stage4Questions.length) {
        this.allAnswered = true;
      }
      this._renderPanel();
    });
  }

  _animate() {
    this.animId = requestAnimationFrame(() => this._animate());
    this.time += 0.016;
    this.controls.update();
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
