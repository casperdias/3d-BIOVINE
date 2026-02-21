import * as THREE from 'three';

// ── Workshop / Lab scene dimensions ─────────────────────
export const WORKSHOP_W = 56;
export const WORKSHOP_D = 44;

// ── Interactive terminal position ─────────────────────────
export const TERMINAL_POS = new THREE.Vector3(0, 0, -14);

// ─────────────────────────────────────────────────────────
export function createWorkshopScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1a2a);
  scene.fog = new THREE.FogExp2(0x0a1520, 0.022);

  // Ambient – cool blue workshop glow
  scene.add(new THREE.AmbientLight(0x4080c0, 0.4));

  // Main overhead fluorescent
  const overHead = new THREE.DirectionalLight(0xd0e8ff, 0.85);
  overHead.position.set(0, 20, 5);
  overHead.castShadow = true;
  overHead.shadow.mapSize.set(2048, 2048);
  overHead.shadow.camera.near = 0.5;
  overHead.shadow.camera.far = 80;
  overHead.shadow.camera.left  = -30;
  overHead.shadow.camera.right =  30;
  overHead.shadow.camera.top   =  30;
  overHead.shadow.camera.bottom = -30;
  scene.add(overHead);

  // Warm accent light from the terminal side
  const termLight = new THREE.PointLight(0x40aaff, 1.4, 20);
  termLight.position.set(TERMINAL_POS.x, 4, TERMINAL_POS.z);
  scene.add(termLight);

  // Side fill
  const fill = new THREE.DirectionalLight(0x6080a0, 0.3);
  fill.position.set(-18, 10, -10);
  scene.add(fill);

  return { scene };
}

// ─────────────────────────────────────────────────────────
export function buildWorkshop(scene) {
  _buildRoom(scene);
  _buildWorkbenches(scene);
  _buildEquipmentShelves(scene);
  _buildTerminal(scene);
  _buildDecoration(scene);
}

// ── Room shell ────────────────────────────────────────────
function _buildRoom(scene) {
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a2230, roughness: 0.9, metalness: 0.05 });
  const wallMat  = new THREE.MeshStandardMaterial({ color: 0x1c2c3c, roughness: 0.85, metalness: 0.0 });
  const ceilMat  = new THREE.MeshStandardMaterial({ color: 0x111820, roughness: 1.0, metalness: 0.0 });

  const HW = WORKSHOP_W / 2;
  const HD = WORKSHOP_D / 2;
  const H  = 10;

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(WORKSHOP_W, WORKSHOP_D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(WORKSHOP_W, WORKSHOP_D), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  scene.add(ceil);

  // Walls
  const wallConfigs = [
    { pos: [0, H/2, -HD], rot: [0, 0, 0],         size: [WORKSHOP_W, H] },
    { pos: [0, H/2,  HD], rot: [0, Math.PI, 0],   size: [WORKSHOP_W, H] },
    { pos: [-HW, H/2, 0], rot: [0,  Math.PI/2, 0], size: [WORKSHOP_D, H] },
    { pos: [ HW, H/2, 0], rot: [0, -Math.PI/2, 0], size: [WORKSHOP_D, H] },
  ];
  for (const w of wallConfigs) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...w.size), wallMat);
    mesh.position.set(...w.pos);
    mesh.rotation.set(...w.rot);
    scene.add(mesh);
  }

  // Ceiling grid lights (decorative strips)
  const lightStripMat = new THREE.MeshBasicMaterial({ color: 0x90c8ff });
  for (let x = -18; x <= 18; x += 12) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 18), lightStripMat);
    strip.position.set(x, H - 0.05, 0);
    scene.add(strip);
  }

  // Floor grid lines
  const lineMat = new THREE.LineBasicMaterial({ color: 0x1a3050 });
  for (let x = -HW; x <= HW; x += 4) {
    const pts = [new THREE.Vector3(x, 0.01, -HD), new THREE.Vector3(x, 0.01, HD)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
  for (let z = -HD; z <= HD; z += 4) {
    const pts = [new THREE.Vector3(-HW, 0.01, z), new THREE.Vector3(HW, 0.01, z)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
  }
}

// ── Work benches with equipment on top ───────────────────
function _buildWorkbenches(scene) {
  const benchMat   = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.7 });
  const legMat     = new THREE.MeshStandardMaterial({ color: 0x1a2830, roughness: 0.8 });
  const aquMat     = new THREE.MeshStandardMaterial({
    color: 0x2080a0, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.1,
  });
  const vinasseMat = new THREE.MeshStandardMaterial({
    color: 0x200a00, transparent: true, opacity: 0.85, roughness: 0.3,
  });
  const aerMat     = new THREE.MeshStandardMaterial({ color: 0x404a50, roughness: 0.5, metalness: 0.3 });

  const benches = [
    { x: -16, z: 2 },
    { x:   0, z: 2 },
    { x:  16, z: 2 },
  ];

  benches.forEach(({ x, z }) => {
    // Bench surface
    const top = new THREE.Mesh(new THREE.BoxGeometry(8, 0.15, 3.5), benchMat);
    top.position.set(x, 3.1, z);
    top.castShadow = true;
    top.receiveShadow = true;
    scene.add(top);

    // Legs
    for (const [lx, lz] of [[-3.5, -1.4], [3.5, -1.4], [-3.5, 1.4], [3.5, 1.4]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.1, 0.15), legMat);
      leg.position.set(x + lx, 1.55, z + lz);
      scene.add(leg);
    }

    // Aquarium on bench
    const aq = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 1.6), aquMat);
    aq.position.set(x - 1, 4.1, z);
    scene.add(aq);

    // Vinasse in aquarium
    const liquid = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.5), vinasseMat);
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.set(x - 1, 3.42, z);
    scene.add(liquid);

    // Aerator pump box
    const aer = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), aerMat);
    aer.position.set(x + 2.2, 3.35, z - 0.5);
    scene.add(aer);

    // Aerator tube
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x80a090, roughness: 0.6 });
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), tubeMat);
    tube.position.set(x + 1.8, 3.75, z - 0.5);
    scene.add(tube);
  });
}

// ── Equipment shelves along the back wall ────────────────
function _buildEquipmentShelves(scene) {
  const shelfMat  = new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 0.8 });
  const itemMat1  = new THREE.MeshStandardMaterial({ color: 0x405060, roughness: 0.6, metalness: 0.2 });
  const itemMat2  = new THREE.MeshStandardMaterial({ color: 0x603020, roughness: 0.7 });
  const labelMat  = new THREE.MeshBasicMaterial({ color: 0x40ffcc });

  const HD = WORKSHOP_D / 2;

  // 3 shelf units on the back wall
  for (let sx = -18; sx <= 18; sx += 18) {
    // Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 0.2), shelfMat);
    frame.position.set(sx, 3, -HD + 0.15);
    scene.add(frame);

    // Shelves
    for (let sh = 0; sh < 3; sh++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.08, 0.5), shelfMat);
      shelf.position.set(sx, 1.2 + sh * 2, -HD + 0.45);
      scene.add(shelf);

      // Items on shelves
      for (let ix = -2; ix <= 2; ix++) {
        const h = 0.3 + Math.random() * 0.5;
        const item = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, h, 8),
          ix % 2 === 0 ? itemMat1 : itemMat2
        );
        item.position.set(sx + ix * 1.4, 1.25 + sh * 2 + h / 2, -HD + 0.5);
        scene.add(item);
      }

      // Label marker
      const lbl = new THREE.Mesh(new THREE.BoxGeometry(6, 0.06, 0.08), labelMat);
      lbl.position.set(sx, 1.18 + sh * 2, -HD + 0.6);
      scene.add(lbl);
    }
  }
}

// ── Central interactive terminal (IPAL builder) ───────────
function _buildTerminal(scene) {
  const standMat  = new THREE.MeshStandardMaterial({ color: 0x1a2830, roughness: 0.6, metalness: 0.3 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x001830, roughness: 0.1, metalness: 0.2,
    emissive: new THREE.Color(0x0040a0), emissiveIntensity: 0.5 });
  const frameMat  = new THREE.MeshStandardMaterial({ color: 0x303840, roughness: 0.5, metalness: 0.5 });
  const keyMat    = new THREE.MeshStandardMaterial({ color: 0x2a3240, roughness: 0.8 });

  const tx = TERMINAL_POS.x;
  const tz = TERMINAL_POS.z;

  // Pedestal
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 3.4, 16), standMat);
  ped.position.set(tx, 1.7, tz);
  ped.castShadow = true;
  scene.add(ped);

  // Monitor frame
  const mframe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.12), frameMat);
  mframe.position.set(tx, 4.4, tz);
  scene.add(mframe);

  // Screen
  const screen = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.06), screenMat);
  screen.position.set(tx, 4.4, tz - 0.04);
  scene.add(screen);

  // Keyboard tray
  const kbd = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.7), keyMat);
  kbd.position.set(tx, 3.55, tz + 0.3);
  scene.add(kbd);

  // Keyboard keys (decorative rows)
  const keyRowMat = new THREE.MeshBasicMaterial({ color: 0x40c8ff });
  for (let row = 0; row < 3; row++) {
    const keyRow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 0.08), keyRowMat);
    keyRow.position.set(tx, 3.59, tz + 0.12 + row * 0.16);
    scene.add(keyRow);
  }

  // Label sign above terminal
  const signMat = new THREE.MeshBasicMaterial({ color: 0x00aaff });
  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 0.08), signMat);
  sign.position.set(tx, 5.7, tz);
  scene.add(sign);

  // IPAL text indicator (bright accent)
  const accentMat = new THREE.MeshBasicMaterial({ color: 0x40ffff });
  const accent = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.1), accentMat);
  accent.position.set(tx - 1.3, 4.4, tz - 0.1);
  scene.add(accent);
}

// ── Decorations (posters, plants, cabinets) ───────────────
function _buildDecoration(scene) {
  const HW = WORKSHOP_W / 2;
  const HD = WORKSHOP_D / 2;

  // Safety cabinets
  const cabMat = new THREE.MeshStandardMaterial({ color: 0x384a38, roughness: 0.8 });
  for (const [x, z] of [[HW - 1.5, -HD + 1.2], [HW - 1.5, HD - 1.2]]) {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.0, 1.6), cabMat);
    cab.position.set(x, 2.5, z);
    cab.castShadow = true;
    scene.add(cab);
    // Door handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xa0a060, metalness: 0.8, roughness: 0.2 }));
    handle.position.set(x - 0.7, 2.5, z - 0.85);
    scene.add(handle);
  }

  // Poster frames on left wall
  const posterMat  = new THREE.MeshStandardMaterial({ color: 0x1a4060, roughness: 0.9 });
  const posterAcct = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
  for (const z of [-10, 0, 10]) {
    const poster = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.0, 2.2), posterMat);
    poster.position.set(-HW + 0.08, 4.5, z);
    scene.add(poster);
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.4, 0.08), posterAcct);
    line.position.set(-HW + 0.1, 5.2, z);
    scene.add(line);
  }

  // Small plants on floor corners
  const potMat  = new THREE.MeshStandardMaterial({ color: 0x6a4020, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1a6020, roughness: 1.0 });
  for (const [x, z] of [[-HW + 2, HD - 2], [-HW + 2, -HD + 2]]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.7, 12), potMat);
    pot.position.set(x, 0.35, z);
    scene.add(pot);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 8), leafMat);
    leaf.position.set(x, 1.4, z);
    scene.add(leaf);
  }
}

// ── Interactive terminal object ────────────────────────────
export function createTerminalObject(scene) {
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x00ccff, transparent: true, opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const glowMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.2, 10, 32),
    glowMat
  );
  glowMesh.position.set(TERMINAL_POS.x, 6.2, TERMINAL_POS.z);
  glowMesh.rotation.x = Math.PI / 2;
  scene.add(glowMesh);

  const spriteMat = new THREE.SpriteMaterial({ color: 0x2ecc71 });
  const doneSprite = new THREE.Sprite(spriteMat);
  doneSprite.scale.set(1.5, 1.5, 1.5);
  doneSprite.position.set(TERMINAL_POS.x, 7.2, TERMINAL_POS.z);
  doneSprite.visible = false;
  scene.add(doneSprite);

  return {
    idx: 0,
    pos: { x: TERMINAL_POS.x, z: TERMINAL_POS.z },
    done: false,
    glowMat,
    glowMesh,
    doneSprite,
    isTerminal: true,
  };
}

export function animateTerminalObject(obj, t) {
  if (!obj || obj.done) return;
  obj.glowMat.opacity = 0.4 + 0.3 * Math.sin(t * 4.0);
  obj.glowMesh.rotation.z = t * 1.5;
}
