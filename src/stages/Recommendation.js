import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createLighting, makeTextSprite } from '../utils.js';

export class Recommendation {
  constructor(canvas, overlay, hud, gameManager) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.hud = hud;
    this.gm = gameManager;
    this.animId = null;
    this.time = 0;
  }

  init() {
    this._setupScene();
    this._buildPresentationRoom();
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
    this.scene.background = new THREE.Color(0x0a1628);

    this.camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 100);
    this.camera.position.set(0, 5, 16);
    this.camera.lookAt(0, 3, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;

    createLighting(this.scene, 0x0a2040, 0xffffff);

    // Celebration lights
    const celebColors = [0x4ade80, 0x60a5fa, 0xf59e0b, 0xa78bfa];
    celebColors.forEach((c, i) => {
      const pl = new THREE.PointLight(c, 1.8, 18);
      pl.position.set(Math.cos(i * Math.PI / 2) * 8, 4, Math.sin(i * Math.PI / 2) * 8);
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

  _buildPresentationRoom() {
    const scene = this.scene;

    // Circular stage
    const stage = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5, 0.3, 32),
      new THREE.MeshLambertMaterial({ color: 0x1a3a2a })
    );
    stage.position.y = 0.15;
    scene.add(stage);

    // Podium
    const podium = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2, 1),
      new THREE.MeshLambertMaterial({ color: 0x2d4a3e })
    );
    podium.position.set(0, 1.3, 0);
    scene.add(podium);

    // Product bottle (pupuk organik cair)
    const bottle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 2, 12),
      new THREE.MeshLambertMaterial({ color: 0x4ade80, transparent: true, opacity: 0.85 })
    );
    bottle.position.set(0, 3.3, 0);
    scene.add(bottle);
    this.bottle = bottle;

    const bottleNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.3, 0.5, 12),
      new THREE.MeshLambertMaterial({ color: 0x22c55e })
    );
    bottleNeck.position.set(0, 4.55, 0);
    scene.add(bottleNeck);

    const bottleCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.2, 12),
      new THREE.MeshLambertMaterial({ color: 0x16a34a })
    );
    bottleCap.position.set(0, 4.9, 0);
    scene.add(bottleCap);

    const productLabel = makeTextSprite('🌿 BIOVINE PLUS', {
      fontSize: 22, bgColor: 'rgba(0,80,30,0.9)', fontColor: '#86efac', width: 280, height: 58
    });
    productLabel.scale.set(3, 0.6, 1);
    productLabel.position.set(0, 5.8, 0);
    scene.add(productLabel);

    const subLabel = makeTextSprite('Pupuk Organik Cair dari Limbah Vinasse', {
      fontSize: 16, bgColor: 'rgba(0,60,20,0.85)', fontColor: '#a7f3d0', width: 420, height: 48
    });
    subLabel.scale.set(5, 0.55, 1);
    subLabel.position.set(0, 6.8, 0);
    scene.add(subLabel);

    // Confetti spheres (celebration)
    this.confetti = [];
    const confettiColors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff6bff];
    for (let i = 0; i < 30; i++) {
      const conf = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 6),
        new THREE.MeshLambertMaterial({ color: confettiColors[i % confettiColors.length] })
      );
      const r = 3 + Math.random() * 8;
      const angle = Math.random() * Math.PI * 2;
      conf.position.set(
        Math.cos(angle) * r,
        1 + Math.random() * 8,
        Math.sin(angle) * r
      );
      conf.userData.baseY = conf.position.y;
      conf.userData.speed = 0.5 + Math.random();
      conf.userData.offset = Math.random() * Math.PI * 2;
      scene.add(conf);
      this.confetti.push(conf);
    }

    // Audience seats (simplified boxes)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.1, 0.8),
        new THREE.MeshLambertMaterial({ color: 0x1a3040 })
      );
      seat.position.set(Math.cos(angle) * 9, 0.1, Math.sin(angle) * 9);
      scene.add(seat);
    }
  }

  _setupHUD() {
    this.hud.setStage('Rekomendasi: Presentasi Produk');
    this.hud.setHint('🎉 Selamat! Anda berhasil merancang solusi untuk limbah vinasse!');
  }

  _showPanel() {
    this.overlay.classList.add('active');
    const totalStages = 6;
    const completed = this.gm.completedStages.size;
    const score = this.gm.points;
    const grade = score >= 800 ? 'A' : score >= 600 ? 'B' : score >= 400 ? 'C' : 'D';

    this.overlay.innerHTML = `
      <div class="overlay-center" style="pointer-events:all;">
        <div class="rec-panel scrollable">
          <h2>🎉 SELAMAT!</h2>
          <p>Anda telah berhasil menyelesaikan semua tahapan 3D BIOVINE!</p>
          <div class="score-display">${score} ⭐</div>
          <p style="color:#fbbf24;font-size:1.1rem;font-weight:700;">Nilai: ${grade} (${completed}/${totalStages} tahap selesai)</p>

          <div class="rec-items">
            <div class="rec-item">
              <strong>🔍 Masalah Teridentifikasi:</strong> Limbah vinasse dari pabrik etanol menyebabkan pencemaran sungai, 
              kerusakan tanah (pH 4.2), dan bau tak sedap dari gas H₂S dan CH₄.
            </div>
            <div class="rec-item">
              <strong>🌱 Solusi Ditentukan:</strong> Pengolahan biologis menggunakan kombinasi 
              Nitrosomonas, Nitrobacter, dan Aspergillus niger.
            </div>
            <div class="rec-item">
              <strong>⚗️ Prototipe Dirancang:</strong> Reaktor biologis dengan inokulasi bakteri dosis 10% (v/v), 
              inkubasi 14 hari, menghasilkan penurunan COD dari 45.000 → 220 mg/L.
            </div>
            <div class="rec-item">
              <strong>🌿 Produk: BIOVINE PLUS</strong> — Pupuk Organik Cair dari limbah vinasse yang 
              sudah memenuhi baku mutu (COD &lt;300, BOD &lt;150, pH 6-9).
            </div>
            <div class="rec-item">
              <strong>♻️ Manfaat Ganda:</strong> Mengurangi pencemaran lingkungan sekaligus menghasilkan 
              pupuk organik cair bernilai ekonomis untuk pertanian.
            </div>
          </div>

          <p style="color:#64748b;font-size:0.82rem;margin-top:12px;">
            "Solusi inovatif untuk masalah lingkungan: mengubah limbah menjadi berkah!"
          </p>

          <button class="restart-btn" id="restart-btn">🔄 Main Lagi</button>
        </div>
      </div>
    `;

    document.getElementById('restart-btn').addEventListener('click', () => {
      location.reload();
    });
  }

  _animate() {
    this.animId = requestAnimationFrame(() => this._animate());
    this.time += 0.016;
    this.controls.update();

    // Float the product bottle
    if (this.bottle) {
      this.bottle.position.y = 3.3 + Math.sin(this.time) * 0.15;
      this.bottle.rotation.y = this.time * 0.5;
    }

    // Animate confetti
    if (this.confetti) {
      this.confetti.forEach(c => {
        c.position.y = c.userData.baseY + Math.sin(this.time * c.userData.speed + c.userData.offset) * 0.5;
        c.rotation.y += 0.03;
      });
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
