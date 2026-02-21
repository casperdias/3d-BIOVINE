import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { microorganisms } from '../data/items.js';
import { stage1Questions } from '../data/questions.js';
import { QuizModal } from '../ui/QuizModal.js';
import { createLighting, makeTextSprite, showToast } from '../utils.js';

export class Stage3 {
  constructor(canvas, overlay, hud, gameManager) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.hud = hud;
    this.gm = gameManager;
    this.animId = null;
    this.time = 0;
    this.microbeMeshes = [];
    this.poured = false;
  }

  init() {
    this._setupScene();
    this._buildShop();
    this._setupHUD();
    this._showShop();
    this._animate();
  }

  _setupScene() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0d1a);

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    this.camera.position.set(0, 5, 16);
    this.camera.lookAt(0, 2, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 28;

    createLighting(this.scene, 0x1a1040, 0xfff5cc);

    // Colorful shop lights
    const colors = [0x8855ff, 0x55aaff, 0xff5588];
    colors.forEach((c, i) => {
      const pl = new THREE.PointLight(c, 1.2, 14);
      pl.position.set(-8 + i * 8, 6, 0);
      this.scene.add(pl);
    });

    this._onResize = () => {
      const w2 = this.canvas.clientWidth, h2 = this.canvas.clientHeight;
      this.camera.aspect = w2 / h2;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', this._onResize);
  }

  _buildShop() {
    const scene = this.scene;

    // Floor
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(30, 0.2, 20),
      new THREE.MeshLambertMaterial({ color: 0x1a0a2e })
    );
    floor.position.y = -0.1;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back wall
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x1a0a2e });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 0.4), wallMat);
    backWall.position.set(0, 6, -9);
    scene.add(backWall);

    // Side walls
    ['left', 'right'].forEach((side, i) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.4, 12, 20), wallMat);
      w.position.set(i === 0 ? -15 : 15, 6, 0);
      scene.add(w);
    });

    // SHELF UNITS (3 shelves for 3 microorganisms)
    microorganisms.forEach((micro, i) => {
      const shelfX = -8 + i * 8;

      // Shelf cabinet
      const cabinet = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 6, 2.5),
        new THREE.MeshLambertMaterial({ color: 0x2a1050 })
      );
      cabinet.position.set(shelfX, 3, -6);
      cabinet.castShadow = true;
      scene.add(cabinet);

      // Shelf border glow
      const edgeMat = new THREE.MeshLambertMaterial({ color: micro.color });
      const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.15, 2.7), edgeMat);
      edgeTop.position.set(shelfX, 6.1, -6);
      scene.add(edgeTop);

      // Microorganism jar / flask
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.6, 1.8, 12),
        new THREE.MeshLambertMaterial({ color: micro.color, transparent: true, opacity: 0.85 })
      );
      jar.position.set(shelfX, 4.2, -6);
      scene.add(jar);
      this.microbeMeshes.push(jar);

      // Jar lid
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.72, 0.2, 12),
        new THREE.MeshLambertMaterial({ color: 0xcccccc })
      );
      lid.position.set(shelfX, 5.2, -6);
      scene.add(lid);

      // Price tag
      const priceLabel = makeTextSprite(`${micro.icon} ${micro.price} Poin`, {
        fontSize: 20, bgColor: 'rgba(0,0,0,0.85)', fontColor: '#fbbf24', width: 220, height: 52
      });
      priceLabel.scale.set(2, 0.5, 1);
      priceLabel.position.set(shelfX, 6.8, -6);
      scene.add(priceLabel);

      const nameLabel = makeTextSprite(micro.name, {
        fontSize: 16, bgColor: 'rgba(30,10,60,0.85)', fontColor: '#c4b5fd', width: 280, height: 48
      });
      nameLabel.scale.set(2.8, 0.48, 1);
      nameLabel.position.set(shelfX, 7.6, -6);
      scene.add(nameLabel);
    });

    // === VINASSE POOL ===
    const poolFrame = new THREE.Mesh(
      new THREE.BoxGeometry(7, 0.5, 5),
      new THREE.MeshLambertMaterial({ color: 0x3a1800 })
    );
    poolFrame.position.set(0, 0.25, 4);
    scene.add(poolFrame);

    this.vinasseLiquid = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 0.3, 4.4),
      new THREE.MeshLambertMaterial({ color: 0x6b3300, transparent: true, opacity: 0.9 })
    );
    this.vinasseLiquid.position.set(0, 0.55, 4);
    scene.add(this.vinasseLiquid);

    const poolLabel = makeTextSprite('Kolam Vinasse', { fontSize: 18, bgColor: 'rgba(80,30,0,0.85)', fontColor: '#ffa040' });
    poolLabel.scale.set(2.5, 0.5, 1);
    poolLabel.position.set(0, 1.5, 4);
    scene.add(poolLabel);

    // Valve handle
    const valveMat = new THREE.MeshLambertMaterial({ color: 0xcc4400 });
    const valveWheel = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 8, 20), valveMat);
    valveWheel.position.set(4, 1.2, 4);
    scene.add(valveWheel);

    const valveLabel = makeTextSprite('🔴 Katup', { fontSize: 16, bgColor: 'rgba(100,30,0,0.85)', fontColor: '#ff8040' });
    valveLabel.scale.set(1.5, 0.4, 1);
    valveLabel.position.set(4, 2.2, 4);
    scene.add(valveLabel);
    this.valveLabel = valveLabel;
    this.valveMesh = valveWheel;

    // Store shopping info
    scene.shopTitle = makeTextSprite('🛒 Toko Mikroorganisme', {
      fontSize: 24, bgColor: 'rgba(20,0,50,0.9)', fontColor: '#a78bfa', width: 400, height: 64
    });
    scene.shopTitle.scale.set(5, 0.8, 1);
    scene.shopTitle.position.set(0, 10, -6);
    scene.add(scene.shopTitle);
  }

  _setupHUD() {
    this.hud.setStage('Tahap 3: Menentukan Solusi');
    this.hud.setHint('🛒 Beli ketiga jenis mikroorganisme untuk mengolah limbah vinasse');
  }

  _showShop() {
    this.overlay.classList.add('active');
    this._renderShop();
  }

  _renderShop() {
    const pts = this.gm.points;
    const total = microorganisms.reduce((s, m) => s + m.price, 0);

    this.overlay.innerHTML = `
      <div style="position:absolute;top:70px;right:20px;pointer-events:all;width:340px;">
        <div class="shop-panel">
          <h3>🛒 Toko Mikroorganisme</h3>
          <div class="shop-points-display">💰 Poin Anda: ${pts} | Total diperlukan: ${total} poin</div>

          ${pts < total ? `
            <div style="background:rgba(239,68,68,0.1);border:1px solid #ef4444;border-radius:8px;padding:10px;margin-bottom:12px;color:#fca5a5;font-size:0.82rem;">
              ⚠ Poin tidak cukup! Jawab kuis untuk mendapatkan poin tambahan.
              <button class="nav-btn" id="earn-points-btn" style="margin-top:8px;width:100%;display:block;">
                📝 Jawab Kuis (+Poin)
              </button>
            </div>
          ` : ''}

          <div class="shop-items">
            ${microorganisms.map(m => `
              <div class="shop-item">
                <div class="shop-item-info">
                  <h4>${m.icon} ${m.name}</h4>
                  <p>${m.description}</p>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                  <span class="shop-item-price">${m.price} ⭐</span>
                  <button class="buy-btn ${this.gm.purchasedItems.has(m.id) ? 'bought' : ''}"
                    data-id="${m.id}" data-price="${m.price}"
                    ${this.gm.purchasedItems.has(m.id) ? 'disabled' : (pts < m.price ? 'disabled' : '')}>
                    ${this.gm.purchasedItems.has(m.id) ? '✅ Dibeli' : 'Beli'}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          ${this.gm.hasAllMicrobes() ? `
            <div style="margin-top:14px;">
              <button class="aerator-btn" id="pour-btn" style="background:linear-gradient(135deg,#059669,#047857);">
                🧪 Tuangkan Mikroorganisme ke Kolam
              </button>
            </div>
          ` : `
            <div style="margin-top:12px;color:#94a3b8;font-size:0.82rem;text-align:center;">
              Beli semua 3 jenis mikroorganisme untuk melanjutkan (${this.gm.purchasedItems.size}/3)
            </div>
          `}

          ${this.poured ? `
            <button class="proceed-btn" id="stage3-proceed" style="position:static;margin-top:16px;width:100%;">
              🔧 Buka Katup → Tahap 4 ➜
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Buy buttons
    document.querySelectorAll('.buy-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const price = parseInt(btn.dataset.price);
        if (this.gm.spendPoints(price)) {
          this.gm.purchaseItem(id);
          showToast(`✅ ${microorganisms.find(m => m.id === id).name} dibeli!`, 'success');
          this._renderShop();
        } else {
          showToast('❌ Poin tidak cukup!', 'error');
        }
      });
    });

    const pourBtn = document.getElementById('pour-btn');
    if (pourBtn) {
      pourBtn.addEventListener('click', () => {
        this._pourMicrobes();
      });
    }

    const earnBtn = document.getElementById('earn-points-btn');
    if (earnBtn) {
      earnBtn.addEventListener('click', () => this._showEarnPointsQuiz());
    }

    const proceedBtn = document.getElementById('stage3-proceed');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        this.gm.completeStage('stage3');
        this.gm.goToStage('stage4');
      });
    }
  }

  _pourMicrobes() {
    this.poured = true;
    // Change pool color to green (bio-treated)
    if (this.vinasseLiquid) {
      this.vinasseLiquid.material.color.setHex(0x2d6a4f);
    }
    // Animate valve label
    if (this.valveLabel) {
      // update sprite text to green
    }
    showToast('🧫 Mikroorganisme berhasil dituangkan! Proses biologis dimulai.', 'success');
    this._renderShop();
  }

  _showEarnPointsQuiz() {
    const q = stage1Questions[Math.floor(Math.random() * stage1Questions.length)];
    const quizContainer = document.createElement('div');
    quizContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:200;pointer-events:all;';
    document.body.appendChild(quizContainer);

    new QuizModal(quizContainer, q, (pts) => {
      this.gm.addPoints(pts);
      showToast(`+${pts} poin didapat!`, 'success');
      quizContainer.remove();
      this._renderShop();
    });
  }

  _animate() {
    this.animId = requestAnimationFrame(() => this._animate());
    this.time += 0.016;
    this.controls.update();

    // Rotate microbe jars slightly
    this.microbeMeshes.forEach((jar, i) => {
      jar.rotation.y = this.time * 0.4 + i * (Math.PI * 2 / 3);
    });

    // Valve rotation hint
    if (this.valveMesh) {
      this.valveMesh.rotation.z = this.time * 0.5;
    }

    // Vinasse ripple
    if (this.vinasseLiquid) {
      this.vinasseLiquid.position.y = 0.55 + Math.sin(this.time * 0.6) * 0.015;
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
