import * as THREE from 'three';

// ── Observation lab (evaluation room) dimensions ─────────
export const OBSLAB_W = 52;
export const OBSLAB_D = 40;

// ── Interactive microscope position ──────────────────────
export const SCOPE_POS = new THREE.Vector3(0, 0, -12);

// ─────────────────────────────────────────────────────────
export function createObsLabScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1420);
  scene.fog = new THREE.FogExp2(0x080f18, 0.020);

  scene.add(new THREE.AmbientLight(0x6090c0, 0.35));

  // Main light — cool blue-white
  const main = new THREE.DirectionalLight(0xc0d8ff, 0.9);
  main.position.set(5, 18, 8);
  main.castShadow = true;
  main.shadow.mapSize.set(2048, 2048);
  main.shadow.camera.near = 0.5;
  main.shadow.camera.far = 80;
  main.shadow.camera.left  = -28;
  main.shadow.camera.right =  28;
  main.shadow.camera.top   =  28;
  main.shadow.camera.bottom = -28;
  scene.add(main);

  // Warm microscope lamp glow
  const scopeLight = new THREE.PointLight(0xffcc60, 1.6, 16);
  scopeLight.position.set(SCOPE_POS.x, 5, SCOPE_POS.z);
  scene.add(scopeLight);

  // Accent fill from left
  const fill = new THREE.DirectionalLight(0x4060a0, 0.25);
  fill.position.set(-15, 8, -5);
  scene.add(fill);

  return { scene };
}

// ─────────────────────────────────────────────────────────
export function buildObsLab(scene) {
  _buildRoom(scene);
  _buildAnalysisBenches(scene);
  _buildMicroscope(scene);
  _buildResultsBoard(scene);
  _buildDecoration(scene);
}

// ── Room shell ────────────────────────────────────────────
function _buildRoom(scene) {
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x16202e, roughness: 0.85, metalness: 0.05 });
  const wallMat  = new THREE.MeshStandardMaterial({ color: 0x182434, roughness: 0.9 });
  const ceilMat  = new THREE.MeshStandardMaterial({ color: 0x0e1a28, roughness: 1.0 });

  const HW = OBSLAB_W / 2;
  const HD = OBSLAB_D / 2;
  const H  = 9;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(OBSLAB_W, OBSLAB_D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(OBSLAB_W, OBSLAB_D), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  scene.add(ceil);

  const wallConfigs = [
    { pos: [0, H/2, -HD], rot: [0, 0, 0],          size: [OBSLAB_W, H] },
    { pos: [0, H/2,  HD], rot: [0, Math.PI, 0],    size: [OBSLAB_W, H] },
    { pos: [-HW, H/2, 0], rot: [0,  Math.PI/2, 0], size: [OBSLAB_D, H] },
    { pos: [ HW, H/2, 0], rot: [0, -Math.PI/2, 0], size: [OBSLAB_D, H] },
  ];
  for (const w of wallConfigs) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...w.size), wallMat);
    mesh.position.set(...w.pos);
    mesh.rotation.set(...w.rot);
    scene.add(mesh);
  }

  // Tile grid on floor
  const tileMat = new THREE.LineBasicMaterial({ color: 0x1a2a3a });
  for (let x = -HW; x <= HW; x += 3) {
    const pts = [new THREE.Vector3(x, 0.01, -HD), new THREE.Vector3(x, 0.01, HD)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), tileMat));
  }
  for (let z = -HD; z <= HD; z += 3) {
    const pts = [new THREE.Vector3(-HW, 0.01, z), new THREE.Vector3(HW, 0.01, z)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), tileMat));
  }

  // LED strip on ceiling perimeter
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x60a8ff });
  for (const [x, z, rw, rd] of [
    [0, -HD + 0.1, OBSLAB_W, 0.1],
    [0,  HD - 0.1, OBSLAB_W, 0.1],
    [-HW + 0.1, 0, 0.1, OBSLAB_D],
    [ HW - 0.1, 0, 0.1, OBSLAB_D],
  ]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.06, rd), ledMat);
    strip.position.set(x, H - 0.05, z);
    scene.add(strip);
  }
}

// ── Analysis benches with beakers & samples ──────────────
function _buildAnalysisBenches(scene) {
  const benchMat   = new THREE.MeshStandardMaterial({ color: 0x283848, roughness: 0.7 });
  const legMat     = new THREE.MeshStandardMaterial({ color: 0x182030, roughness: 0.8 });
  const sampleMats = [
    new THREE.MeshStandardMaterial({ color: 0x1a0500, transparent: true, opacity: 0.9 }), // dark vinasse
    new THREE.MeshStandardMaterial({ color: 0x5a2800, transparent: true, opacity: 0.8 }), // mid
    new THREE.MeshStandardMaterial({ color: 0x80b840, transparent: true, opacity: 0.7 }), // clean
  ];
  const beakerMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff, transparent: true, opacity: 0.3, roughness: 0.05, metalness: 0.05,
  });

  const benchPositions = [[-14, 6], [0, 6], [14, 6]];
  benchPositions.forEach(([bx, bz], bi) => {
    // Bench surface
    const top = new THREE.Mesh(new THREE.BoxGeometry(7, 0.12, 3), benchMat);
    top.position.set(bx, 3.1, bz);
    top.castShadow = true;
    top.receiveShadow = true;
    scene.add(top);

    // Legs
    for (const [lx, lz] of [[-3, -1.2], [3, -1.2], [-3, 1.2], [3, 1.2]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.1, 0.12), legMat);
      leg.position.set(bx + lx, 1.55, bz + lz);
      scene.add(leg);
    }

    // Beakers with different sample colours
    for (let i = 0; i < 3; i++) {
      const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.8, 12), beakerMat);
      beaker.position.set(bx - 1.8 + i * 1.8, 3.56, bz - 0.5);
      scene.add(beaker);

      const liquidH = 0.3 + i * 0.1;
      const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.27, 0.25, liquidH, 12),
        sampleMats[i]
      );
      liquid.position.set(bx - 1.8 + i * 1.8, 3.17 + liquidH / 2, bz - 0.5);
      scene.add(liquid);
    }

    // Notebook on bench
    const nbMat = new THREE.MeshStandardMaterial({ color: 0x20406a, roughness: 0.9 });
    const nb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.9), nbMat);
    nb.position.set(bx + 2.5, 3.18, bz + 0.5);
    scene.add(nb);

    // pH meter stick
    const meterMat = new THREE.MeshStandardMaterial({ color: 0x40c0a0, roughness: 0.5, metalness: 0.3 });
    const meter = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8), meterMat);
    meter.position.set(bx - 2.8, 3.75, bz);
    meter.rotation.z = 0.3;
    scene.add(meter);
  });
}

// ── Microscope (central interactive object) ──────────────
function _buildMicroscope(scene) {
  const baseMat  = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.5, metalness: 0.5 });
  const armMat   = new THREE.MeshStandardMaterial({ color: 0x202830, roughness: 0.5, metalness: 0.6 });
  const lensMat  = new THREE.MeshStandardMaterial({ color: 0x4080c0, roughness: 0.1, metalness: 0.8 });
  const eyeMat   = new THREE.MeshStandardMaterial({ color: 0x2040a0, roughness: 0.1, metalness: 0.9 });

  const sx = SCOPE_POS.x;
  const sz = SCOPE_POS.z;

  // Stand platform
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.5, 3), baseMat);
  base.position.set(sx, 0.25, sz);
  base.castShadow = true;
  scene.add(base);

  // Vertical arm
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.0, 0.4), armMat);
  arm.position.set(sx - 0.8, 2.25, sz);
  arm.castShadow = true;
  scene.add(arm);

  // Horizontal arm
  const hArm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.35), armMat);
  hArm.position.set(sx + 0.1, 4.1, sz);
  scene.add(hArm);

  // Lens barrel
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.2, 16), lensMat);
  lens.position.set(sx + 0.8, 3.4, sz);
  scene.add(lens);

  // Objective lens tip
  const obj = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.5, 12), lensMat);
  obj.position.set(sx + 0.8, 2.55, sz);
  scene.add(obj);

  // Eyepiece
  const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 12), eyeMat);
  eye.position.set(sx + 0.8, 4.85, sz);
  scene.add(eye);

  // Stage (where slide goes)
  const stage = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 1.0), baseMat);
  stage.position.set(sx + 0.8, 2.3, sz);
  scene.add(stage);

  // Lamp glow circle under eyepiece
  const glowMat2 = new THREE.MeshBasicMaterial({ color: 0xffcc40, transparent: true, opacity: 0.7 });
  const glow2 = new THREE.Mesh(new THREE.CircleGeometry(0.25, 16), glowMat2);
  glow2.rotation.x = -Math.PI / 2;
  glow2.position.set(sx + 0.8, 2.34, sz);
  scene.add(glow2);
}

// ── Results board on back wall ────────────────────────────
function _buildResultsBoard(scene) {
  const HD = OBSLAB_D / 2;
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x0c2040, roughness: 0.9 });
  const headerMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
  const rowMats = [
    new THREE.MeshBasicMaterial({ color: 0xff4040 }),  // before
    new THREE.MeshBasicMaterial({ color: 0x40ff80 }),  // after
  ];

  // Board background
  const board = new THREE.Mesh(new THREE.BoxGeometry(18, 5.5, 0.1), boardMat);
  board.position.set(0, 4.5, -HD + 0.12);
  scene.add(board);

  // Header bar
  const header = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.35, 0.08), headerMat);
  header.position.set(0, 6.95, -HD + 0.17);
  scene.add(header);

  // Data rows (before / after)
  for (let row = 0; row < 2; row++) {
    const rowBar = new THREE.Mesh(new THREE.BoxGeometry(15, 0.25, 0.06), rowMats[row]);
    rowBar.position.set(0, 6.0 - row * 1.2, -HD + 0.17);
    scene.add(rowBar);

    // Bar chart segments
    const widths = row === 0 ? [8.0, 6.4, 0.4] : [0.6, 0.5, 0.1];
    for (let col = 0; col < 3; col++) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(widths[col], 0.55, 0.06),
        rowMats[row]
      );
      bar.position.set(-7.5 + widths[col] / 2 + col * 5.2, 5.0 - row * 1.2, -HD + 0.17);
      scene.add(bar);
    }
  }
}

// ── Decorations ───────────────────────────────────────────
function _buildDecoration(scene) {
  const HW = OBSLAB_W / 2;
  const HD = OBSLAB_D / 2;

  // Storage cabinets right wall
  const cabMat = new THREE.MeshStandardMaterial({ color: 0x283a38, roughness: 0.85 });
  for (const z of [-12, 0, 12]) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5.0, 2.0), cabMat);
    cab.position.set(HW - 1.0, 2.5, z);
    cab.castShadow = true;
    scene.add(cab);
  }

  // Waste bins near front
  const binMat = new THREE.MeshStandardMaterial({ color: 0x3a4030, roughness: 0.9 });
  for (const x of [-8, 8]) {
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.9, 10), binMat);
    bin.position.set(x, 0.45, HD - 2);
    scene.add(bin);
  }
}

// ── Microscope interactive object ─────────────────────────
export function createScopeObject(scene) {
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffcc00, transparent: true, opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const glowMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.2, 10, 32),
    glowMat
  );
  glowMesh.position.set(SCOPE_POS.x + 0.8, 5.8, SCOPE_POS.z);
  glowMesh.rotation.x = Math.PI / 2;
  scene.add(glowMesh);

  const spriteMat = new THREE.SpriteMaterial({ color: 0x2ecc71 });
  const doneSprite = new THREE.Sprite(spriteMat);
  doneSprite.scale.set(1.5, 1.5, 1.5);
  doneSprite.position.set(SCOPE_POS.x + 0.8, 7.0, SCOPE_POS.z);
  doneSprite.visible = false;
  scene.add(doneSprite);

  return {
    idx: 0,
    pos: { x: SCOPE_POS.x + 0.8, z: SCOPE_POS.z },
    done: false,
    glowMat,
    glowMesh,
    doneSprite,
    isScope: true,
  };
}

export function animateScopeObject(obj, t) {
  if (!obj || obj.done) return;
  obj.glowMat.opacity = 0.4 + 0.28 * Math.sin(t * 3.8);
  obj.glowMesh.rotation.z = t * 1.3;
}
