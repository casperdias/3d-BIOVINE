import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { stage1Questions } from '../data/questions.js';
import { QuizModal } from '../ui/QuizModal.js';
import { createGround, createLighting, makeTextSprite, showToast } from '../utils.js';

export class Stage1 {
  constructor(canvas, overlay, hud, gameManager) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.hud = hud;
    this.gm = gameManager;
    this.animId = null;
    this.interactives = [];
    this.quizActive = false;
  }

  init() {
    this._setupScene();
    this._buildEnvironment();
    this._setupInteraction();
    this._setupHUD();
    this._animate();
  }

  _setupScene() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 30, 80);

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 200);
    this.camera.position.set(0, 8, 22);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;

    createLighting(this.scene, 0x6090b0, 0xfffadd);

    this._onResize = () => {
      const w2 = this.canvas.clientWidth, h2 = this.canvas.clientHeight;
      this.camera.aspect = w2 / h2;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', this._onResize);
  }

  _buildEnvironment() {
    const scene = this.scene;

    // Ground
    createGround(scene, 0x4a7c3f, 80);

    // Sky gradient hint: add distant mountains
    const skyGeo = new THREE.SphereGeometry(70, 16, 8);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // === FACTORY BUILDING (background) ===
    const factoryBody = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x8c8c8c })
    );
    factoryBody.position.set(-8, 4, -10);
    factoryBody.castShadow = true;
    scene.add(factoryBody);

    // Factory chimney
    const chimneyGeo = new THREE.CylinderGeometry(0.5, 0.7, 6, 12);
    const chimneyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimney.position.set(-5, 9, -10);
    scene.add(chimney);

    // Factory smoke particles (simple spheres)
    for (let i = 0; i < 5; i++) {
      const smoke = new THREE.Mesh(
        new THREE.SphereGeometry(0.4 + i * 0.15, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.4 - i * 0.05 })
      );
      smoke.position.set(-5 + Math.random() * 0.6, 13 + i * 1.2, -10);
      scene.add(smoke);
    }

    // Factory label
    const factoryLabel = makeTextSprite('Pabrik Etanol', { fontSize: 22, bgColor: 'rgba(50,50,50,0.8)' });
    factoryLabel.scale.set(3, 0.7, 1);
    factoryLabel.position.set(-8, 9, -10);
    scene.add(factoryLabel);

    // === RIVER (Phenomenon 1) ===
    const riverMat = new THREE.MeshLambertMaterial({ color: 0x3d1f00, transparent: true, opacity: 0.9 });
    const river = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 3), riverMat);
    river.position.set(2, 0.1, 5);
    river.receiveShadow = true;
    scene.add(river);

    // River banks (slightly lighter)
    const bankMat = new THREE.MeshLambertMaterial({ color: 0x5c4a32 });
    const bankL = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 0.8), bankMat);
    bankL.position.set(2, 0.15, 6.4);
    scene.add(bankL);
    const bankR = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 0.8), bankMat);
    bankR.position.set(2, 0.15, 3.6);
    scene.add(bankR);

    // Pollution foam on river
    for (let i = 0; i < 6; i++) {
      const foam = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xf0c040, transparent: true, opacity: 0.6 })
      );
      foam.position.set(-6 + i * 2.5, 0.35, 5 + (Math.random() - 0.5));
      scene.add(foam);
    }

    // River clickable mesh (invisible larger hit area)
    const riverHitGeo = new THREE.BoxGeometry(20, 1.5, 5);
    const riverHitMat = new THREE.MeshLambertMaterial({ color: 0x3d1f00, transparent: true, opacity: 0.01 });
    const riverHit = new THREE.Mesh(riverHitGeo, riverHitMat);
    riverHit.position.set(2, 0.7, 5);
    scene.add(riverHit);

    // River label / exclamation
    const riverLabel = makeTextSprite('⚠ Sungai Tercemar - Klik!', { fontSize: 18, bgColor: 'rgba(180,60,0,0.85)', fontColor: '#fff' });
    riverLabel.scale.set(3.5, 0.6, 1);
    riverLabel.position.set(2, 2.2, 5);
    scene.add(riverLabel);

    this.interactives.push({ mesh: riverHit, id: 'phenomenon1', label: 'Pencemaran Sungai', questionIndex: 0 });

    // === SOIL CONTAMINATION (Phenomenon 2) ===
    const dirtMat = new THREE.MeshLambertMaterial({ color: 0x7a5c35 });
    const dirtPatch = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 5), dirtMat);
    dirtPatch.position.set(10, 0.07, 0);
    dirtPatch.receiveShadow = true;
    scene.add(dirtPatch);

    // Dead/yellow grass tufts
    for (let i = 0; i < 8; i++) {
      const tuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.15, 0.5, 5),
        new THREE.MeshLambertMaterial({ color: 0xc8a84b })
      );
      tuft.position.set(8 + Math.random() * 4, 0.25, -2 + Math.random() * 4);
      scene.add(tuft);
    }

    // Cracks (thin dark boxes)
    for (let i = 0; i < 4; i++) {
      const crack = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.05, 1.5 + Math.random()),
        new THREE.MeshLambertMaterial({ color: 0x3a2a10 })
      );
      crack.position.set(9 + i * 0.8, 0.18, -1 + Math.random() * 2);
      crack.rotation.y = Math.random() * 0.5;
      scene.add(crack);
    }

    const dirtHit = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.5, 5),
      new THREE.MeshLambertMaterial({ color: 0x7a5c35, transparent: true, opacity: 0.01 })
    );
    dirtHit.position.set(10, 0.7, 0);
    scene.add(dirtHit);

    const soilLabel = makeTextSprite('⚠ Tanah Rusak - Klik!', { fontSize: 18, bgColor: 'rgba(120,80,0,0.85)', fontColor: '#fff' });
    soilLabel.scale.set(3, 0.6, 1);
    soilLabel.position.set(10, 2.2, 0);
    scene.add(soilLabel);

    this.interactives.push({ mesh: dirtHit, id: 'phenomenon2', label: 'Kerusakan Tanah', questionIndex: 1 });

    // === ODOR / AIR QUALITY (Phenomenon 3) ===
    // Stench cloud near factory output pipe
    const pipeMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 3, 10), pipeMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(-2, 0.8, -2);
    scene.add(pipe);

    // Liquid coming out of pipe
    const liquid = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 1.5),
      new THREE.MeshLambertMaterial({ color: 0x5c3000, transparent: true, opacity: 0.85 })
    );
    liquid.position.set(-3.5, 0.2, -2);
    scene.add(liquid);

    // Gas clouds (yellow-green tints)
    for (let i = 0; i < 5; i++) {
      const cloud = new THREE.Mesh(
        new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0xb5e050, transparent: true, opacity: 0.35 + Math.random() * 0.2 })
      );
      cloud.position.set(-4 + (Math.random() - 0.5) * 3, 1.5 + i * 0.7, -2 + (Math.random() - 0.5) * 2);
      cloud.name = `cloud_${i}`;
      scene.add(cloud);
    }

    const odorHit = new THREE.Mesh(
      new THREE.BoxGeometry(5, 4, 4),
      new THREE.MeshLambertMaterial({ color: 0xb5e050, transparent: true, opacity: 0.01 })
    );
    odorHit.position.set(-4, 2, -2);
    scene.add(odorHit);

    const odorLabel = makeTextSprite('⚠ Bau Tidak Sedap - Klik!', { fontSize: 18, bgColor: 'rgba(50,100,0,0.85)', fontColor: '#fff' });
    odorLabel.scale.set(3.5, 0.6, 1);
    odorLabel.position.set(-4, 4.5, -2);
    scene.add(odorLabel);

    this.interactives.push({ mesh: odorHit, id: 'phenomenon3', label: 'Bau Tidak Sedap', questionIndex: 2 });

    // === TREES (decoration) ===
    this._addTrees(scene);

    // Store cloud refs for animation
    this.clouds = scene.children.filter(c => c.name && c.name.startsWith('cloud_'));
    this.foamMeshes = [];
    this.time = 0;
  }

  _addTrees(scene) {
    const positions = [[-15, 0, -5], [-14, 0, 5], [5, 0, -12], [14, 0, -8], [-18, 0, 10]];
    positions.forEach(([x, y, z]) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.35, 2, 8),
        new THREE.MeshLambertMaterial({ color: 0x8b5e3c })
      );
      trunk.position.set(x, 1, z);
      scene.add(trunk);
      const foliage = new THREE.Mesh(
        new THREE.SphereGeometry(1.8, 10, 10),
        new THREE.MeshLambertMaterial({ color: 0x2d6a4f })
      );
      foliage.position.set(x, 3.5, z);
      scene.add(foliage);
    });
  }

  _setupHUD() {
    this.hud.setStage('Tahap 1: Identifikasi Masalah');
    this.hud.setHint('🖱 Klik objek berwarna ⚠ untuk mengidentifikasi fenomena (0/3)');
    this._updateProgress();
  }

  _updateProgress() {
    const done = this.gm.phenomenaAnswered.size;
    this.hud.setHint(`🖱 Klik objek berwarna ⚠ untuk mengidentifikasi fenomena (${done}/3)`);

    // Update proceed button
    const proceedBtn = document.getElementById('stage1-proceed');
    if (proceedBtn) {
      proceedBtn.disabled = !this.gm.hasAnsweredAllPhenomena();
    }
  }

  _setupInteraction() {
    this.overlay.classList.add('active');
    this.overlay.innerHTML = `
      <button class="proceed-btn" id="stage1-proceed" disabled>Lanjut ke Tahap 2 ➜</button>
    `;

    document.getElementById('stage1-proceed').addEventListener('click', () => {
      if (this.gm.hasAnsweredAllPhenomena()) {
        this.gm.completeStage('stage1');
        this.gm.goToStage('stage2');
      }
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this._onMouseMove = (e) => {
      if (this.quizActive) return;
      const rect = this.canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);
      const meshes = this.interactives.map(i => i.mesh);
      const hits = raycaster.intersectObjects(meshes);
      this.canvas.style.cursor = hits.length > 0 ? 'pointer' : 'default';
    };

    this._onMouseClick = (e) => {
      if (this.quizActive) return;
      const rect = this.canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, this.camera);
      const meshes = this.interactives.map(i => i.mesh);
      const hits = raycaster.intersectObjects(meshes);
      if (hits.length > 0) {
        const item = this.interactives.find(i => i.mesh === hits[0].object);
        if (item) this._onPhenomenonClick(item);
      }
    };

    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('click', this._onMouseClick);
  }

  _onPhenomenonClick(item) {
    if (this.gm.phenomenaAnswered.has(item.id)) {
      showToast(`✅ ${item.label} sudah dijawab!`, 'success');
      return;
    }
    this.quizActive = true;
    this.controls.enabled = false;

    const quizContainer = document.createElement('div');
    this.overlay.appendChild(quizContainer);

    new QuizModal(quizContainer, stage1Questions[item.questionIndex], (pts) => {
      this.gm.addPoints(pts);
      this.gm.markPhenomenon(item.id);
      showToast(`+${pts} poin! Fenomena teridentifikasi.`, 'success');
      quizContainer.remove();
      this.quizActive = false;
      this.controls.enabled = true;
      this._markPhenomenonDone(item);
      this._updateProgress();
    });
  }

  _markPhenomenonDone(item) {
    // Change the hit mesh to green tint
    if (item.mesh && item.mesh.material) {
      item.mesh.material.color.setHex(0x00ff00);
      item.mesh.material.opacity = 0.15;
    }
  }

  _animate() {
    this.animId = requestAnimationFrame(() => this._animate());
    this.time += 0.016;
    this.controls.update();

    // Animate gas clouds
    if (this.clouds) {
      this.clouds.forEach((c, i) => {
        c.position.y += Math.sin(this.time + i) * 0.003;
        c.position.x += Math.sin(this.time * 0.5 + i) * 0.002;
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this._onResize);
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
      this.canvas.removeEventListener('click', this._onMouseClick);
    }
    this.renderer.dispose();
    this.overlay.classList.remove('active');
    this.overlay.innerHTML = '';
  }
}
