import * as THREE from 'three';

// ── Question object positions (one per phenomenon) ────
export const QUESTION_POSITIONS = [
  new THREE.Vector3(-5,  0,  10),   // Fenomena 1 – near paddies
  new THREE.Vector3(15,  0, -5),    // Fenomena 2 – toward river
  new THREE.Vector3(-18, 0, -12),   // Fenomena 3 – near houses
];

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.018);

  // ── Lighting ──────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xfff5e0, 0.6);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff0cc, 1.4);
  sun.position.set(80, 120, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 400;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xc8e8ff, 0.4);
  fill.position.set(-50, 40, -40);
  scene.add(fill);

  return { scene, sun };
}

export function buildWorld(scene) {
  // ── Ground / Fields ──────────────────────────────────
  const groundGeo = new THREE.PlaneGeometry(400, 400, 60, 60);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x6abf40 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Rice paddies (flat darker-green patches)
  const paddyMat = new THREE.MeshLambertMaterial({ color: 0x4e8a2e });
  const paddyPositions = [
    [-30, -20], [-10, -30], [10, -20], [30, -10],
    [-40, 10],  [-20, 20],  [20, 30],  [40, 20],
  ];
  for (const [px, pz] of paddyPositions) {
    const geo = new THREE.PlaneGeometry(18, 12);
    const mesh = new THREE.Mesh(geo, paddyMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(px, 0.05, pz);
    mesh.receiveShadow = true;
    scene.add(mesh);
    // Paddy grid lines
    addPaddyLines(scene, px, pz);
  }

  // ── River (brown-black polluted) ─────────────────────
  addRiver(scene);

  // ── Factory buildings ────────────────────────────────
  addFactory(scene);

  // ── Trees / vegetation ──────────────────────────────
  addTrees(scene);

  // ── Village houses ──────────────────────────────────
  addHouses(scene);

  // ── Pollution particles / foam ───────────────────────
  addPollutionParticles(scene);

  // ── Sky elements ─────────────────────────────────────
  addClouds(scene);
}

// ── Helper: paddy grid lines ──────────────────────────
function addPaddyLines(scene, cx, cz) {
  const mat = new THREE.LineBasicMaterial({ color: 0x3a6b1e });
  for (let i = -8; i <= 8; i += 4) {
    const pts = [
      new THREE.Vector3(cx - 9, 0.08, cz + i),
      new THREE.Vector3(cx + 9, 0.08, cz + i),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    scene.add(new THREE.Line(geo, mat));
  }
}

// ── Helper: river ────────────────────────────────────
function addRiver(scene) {
  // Main river channel – dirty brown
  const riverGeo = new THREE.PlaneGeometry(12, 300, 1, 50);
  const riverMat = new THREE.MeshLambertMaterial({
    color: 0x3d2006,
    transparent: true,
    opacity: 0.88,
  });
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(70, 0.02, 0);
  river.rotation.z = 0.18; // slight diagonal
  scene.add(river);

  // Foam / pollution layer
  const foamGeo = new THREE.PlaneGeometry(10, 295, 1, 40);
  const foamMat = new THREE.MeshLambertMaterial({
    color: 0x7a5320,
    transparent: true,
    opacity: 0.55,
  });
  const foam = new THREE.Mesh(foamGeo, foamMat);
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(70, 0.04, 0);
  foam.rotation.z = 0.18;
  scene.add(foam);

  // River banks
  const bankMat = new THREE.MeshLambertMaterial({ color: 0x9b7a3d });
  for (const side of [-1, 1]) {
    const bankGeo = new THREE.PlaneGeometry(5, 295);
    const bank = new THREE.Mesh(bankGeo, bankMat);
    bank.rotation.x = -Math.PI / 2;
    bank.rotation.z = 0.18;
    bank.position.set(70 + side * 8.5, 0.01, 0);
    scene.add(bank);
  }
}

// ── Helper: factory ──────────────────────────────────
function addFactory(scene) {
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xd4c89a });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

  // Main building
  const mainGeo = new THREE.BoxGeometry(30, 14, 20);
  const main = new THREE.Mesh(mainGeo, wallMat);
  main.position.set(50, 7, -50);
  main.castShadow = true;
  scene.add(main);

  // Roof
  const roofGeo = new THREE.BoxGeometry(32, 3, 22);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(50, 15.5, -50);
  scene.add(roof);

  // Side building
  const side2Geo = new THREE.BoxGeometry(16, 10, 14);
  const side2 = new THREE.Mesh(side2Geo, wallMat);
  side2.position.set(70, 5, -48);
  side2.castShadow = true;
  scene.add(side2);

  // Chimneys
  for (let i = 0; i < 3; i++) {
    const chimGeo = new THREE.CylinderGeometry(1.2, 1.5, 16, 12);
    const chim = new THREE.Mesh(chimGeo, darkMat);
    chim.position.set(42 + i * 5, 24, -50);
    chim.castShadow = true;
    scene.add(chim);

    // Smoke ring at top
    addSmoke(scene, 42 + i * 5, 32, -50);
  }

  // Waste pipe into river
  const pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
  const pipeMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
  const pipe = new THREE.Mesh(pipeGeo, pipeMat);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(65, 1, -45);
  scene.add(pipe);
}

// ── Helper: smoke ────────────────────────────────────
function addSmoke(scene, x, y, z) {
  const mat = new THREE.MeshLambertMaterial({
    color: 0x888888,
    transparent: true,
    opacity: 0.35,
  });
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.SphereGeometry(2 + i * 0.8, 8, 8);
    const s = new THREE.Mesh(geo, mat.clone());
    s.position.set(x + (Math.random() - 0.5) * 3, y + i * 3, z + (Math.random() - 0.5) * 3);
    s.userData.smoke = true;
    scene.add(s);
  }
}

// ── Helper: trees ────────────────────────────────────
function addTrees(scene) {
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
  const leafMat  = new THREE.MeshLambertMaterial({ color: 0x2d7a22 });
  const positions = [
    [-60,5],[-55,20],[-50,-10],[-65,-25],[0,50],[15,55],
    [-10,45],[-25,52],[80,30],[85,-10],[90,15],
  ];
  for (const [px, pz] of positions) {
    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 4, 8),
      trunkMat
    );
    trunk.position.set(px, 2, pz);
    trunk.castShadow = true;
    scene.add(trunk);
    // Canopy
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 10, 10),
      leafMat
    );
    canopy.position.set(px, 7, pz);
    canopy.castShadow = true;
    scene.add(canopy);
  }
}

// ── Helper: houses ────────────────────────────────────
function addHouses(scene) {
  const wallMat  = new THREE.MeshLambertMaterial({ color: 0xf5e6c8 });
  const roofMat  = new THREE.MeshLambertMaterial({ color: 0xc0392b });
  const housePts = [
    [-40, 40],[-25, 45],[-15, 38],[-5, 42],
    [-45,-42],[-30,-45],[0,-40],[15,-44],
  ];
  for (const [px, pz] of housePts) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), wallMat);
    wall.position.set(px, 2, pz);
    wall.castShadow = true;
    scene.add(wall);

    // Roof (pyramid-ish via cone)
    const roofGeo = new THREE.ConeGeometry(5, 3, 4);
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.rotation.y = Math.PI / 4;
    roofMesh.position.set(px, 5.5, pz);
    scene.add(roofMesh);
  }
}

// ── Helper: pollution particles ───────────────────────
export function addPollutionParticles(scene) {
  const count = 200;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3 + 0] = 65 + (Math.random() - 0.5) * 15;
    positions[i * 3 + 1] = 0.3 + Math.random() * 0.4;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 280;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x7a4b0f,
    size: 0.6,
    transparent: true,
    opacity: 0.7,
  });
  const particles = new THREE.Points(geo, mat);
  particles.userData.pollutionParticles = true;
  scene.add(particles);
  return particles;
}

// ── Helper: clouds ────────────────────────────────────
function addClouds(scene) {
  const cloudMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
  });
  const cloudData = [
    [[-20, 80, -60], 12],
    [[30, 90, -80], 16],
    [[-60, 75, -40], 10],
    [[60, 85, -70], 14],
  ];
  for (const [[cx, cy, cz], size] of cloudData) {
    for (let b = 0; b < 5; b++) {
      const geo = new THREE.SphereGeometry(size * (0.5 + Math.random() * 0.5), 8, 8);
      const mesh = new THREE.Mesh(geo, cloudMat);
      mesh.position.set(
        cx + (Math.random() - 0.5) * size * 2,
        cy + (Math.random() - 0.5) * 4,
        cz + (Math.random() - 0.5) * size
      );
      scene.add(mesh);
    }
  }
}

// ── Question Interactive Objects ─────────────────────
// Returns array of { group, glowMat, ringMat, idx, labelSprite }
export function createQuestionObjects(scene) {
  const labels = ['❓ Fenomena 1', '❓ Fenomena 2', '❓ Fenomena 3'];
  const colors  = [0x00d4ff, 0xff9900, 0x44ff88];
  const objects = [];

  QUESTION_POSITIONS.forEach((pos, idx) => {
    const group = new THREE.Group();
    group.position.copy(pos);

    // Base platform
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.0, 0.4, 16), baseMat);
    base.position.y = 0.2;
    base.castShadow = true;
    group.add(base);

    // Pillar
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x16213e });
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 4, 12), pillarMat);
    pillar.position.y = 2.4;
    pillar.castShadow = true;
    group.add(pillar);

    // Glowing orb
    const glowMat = new THREE.MeshStandardMaterial({
      color: colors[idx],
      emissive: colors[idx],
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.3,
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), glowMat);
    orb.position.y = 5.0;
    orb.castShadow = true;
    group.add(orb);

    // Rotating ring
    const ringMat = new THREE.MeshStandardMaterial({
      color: colors[idx],
      emissive: colors[idx],
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 8, 40), ringMat);
    ring.position.y = 5.0;
    group.add(ring);

    // Second tilted ring
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 8, 40), ringMat.clone());
    ring2.position.y = 5.0;
    ring2.rotation.x = Math.PI / 3;
    group.add(ring2);

    // Ground glow disc
    const discMat = new THREE.MeshStandardMaterial({
      color: colors[idx],
      emissive: colors[idx],
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(2.5, 32), discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.05;
    group.add(disc);

    // Floating label sprite
    const sprite = _makeTextSprite(labels[idx], colors[idx]);
    sprite.position.y = 7.0;
    group.add(sprite);

    // Check-mark sprite (hidden initially)
    const doneSprite = _makeTextSprite('✅ Selesai', 0x2ecc71);
    doneSprite.position.y = 8.2;
    doneSprite.visible = false;
    group.add(doneSprite);

    scene.add(group);
    objects.push({
      group,
      glowMat,
      ringMat,
      ring,
      ring2,
      orb,
      discMat,
      idx,
      pos,
      done: false,
      doneSprite,
    });
  });

  return objects;
}

// ── Sprite text helper ────────────────────────────────
function _makeTextSprite(text, hexColor) {
  const cv = document.createElement('canvas');
  cv.width = 320; cv.height = 72;
  const ctx = cv.getContext('2d');

  // Background pill
  ctx.fillStyle = 'rgba(10,20,40,0.85)';
  ctx.beginPath();
  ctx.roundRect(4, 8, 312, 56, 16);
  ctx.fill();

  // Border
  const r = (hexColor >> 16) & 0xff;
  const g = (hexColor >>  8) & 0xff;
  const b =  hexColor        & 0xff;
  ctx.strokeStyle = `rgb(${r},${g},${b})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(4, 8, 312, 56, 16);
  ctx.stroke();

  // Text
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.font = 'bold 24px Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 160, 36);

  const tex = new THREE.CanvasTexture(cv);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(5.0, 1.1, 1);
  return sprite;
}

// ── Animate question objects (call each frame) ────────
export function animateQuestionObjects(objects, t) {
  for (const obj of objects) {
    // Float orb
    obj.orb.position.y = 5.0 + Math.sin(t * 1.8 + obj.idx * 1.1) * 0.25;

    // Spin rings
    obj.ring.rotation.y  = t * 0.8 + obj.idx;
    obj.ring2.rotation.z = t * 0.6 + obj.idx * 0.7;

    // Pulse glow
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.5 + obj.idx * 1.3);
    obj.glowMat.emissiveIntensity = obj.done ? 0.1 : 0.4 + pulse * 0.6;
    obj.discMat.opacity           = obj.done ? 0.08 : 0.2 + pulse * 0.2;
  }
}
