import * as THREE from 'three';

// ── Lab dimensions ─────────────────────────────────────
const LAB_W = 60;   // width  (X)
const LAB_D = 40;   // depth  (Z)
const LAB_H = 14;   // height (Y)

// ── Question object positions – on lab tables ──────────
export const QUESTION_POSITIONS = [
  new THREE.Vector3(-16, 0,  6),   // Fenomena 1 – left bench
  new THREE.Vector3(  0, 0, -6),   // Fenomena 2 – centre bench
  new THREE.Vector3( 16, 0,  6),   // Fenomena 3 – right bench
];

// ──────────────────────────────────────────────────────
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1f2e);   // dark indoor
  scene.fog = new THREE.Fog(0x1a1f2e, 40, 90);

  // ── Ambient – cool lab light ──────────────────────────
  scene.add(new THREE.AmbientLight(0xd0e8ff, 0.55));

  // ── Overhead fluorescent tubes ────────────────────────
  const fluorescentPositions = [
    [-18, LAB_H - 0.5,  8], [-18, LAB_H - 0.5, -8],
    [  0, LAB_H - 0.5,  8], [  0, LAB_H - 0.5, -8],
    [ 18, LAB_H - 0.5,  8], [ 18, LAB_H - 0.5, -8],
  ];
  for (const [lx, ly, lz] of fluorescentPositions) {
    const pt = new THREE.PointLight(0xe8f4ff, 1.2, 28);
    pt.position.set(lx, ly, lz);
    scene.add(pt);
  }

  // Key directional (simulates diffuse bounce)
  const key = new THREE.DirectionalLight(0xffffff, 0.5);
  key.position.set(10, 20, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  return { scene };
}

// ──────────────────────────────────────────────────────
export function buildWorld(scene) {
  _buildLabRoom(scene);
  _buildLabFurniture(scene);
  _buildLabDetails(scene);
}

// ── Room shell ─────────────────────────────────────────
function _buildLabRoom(scene) {
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.8, metalness: 0 });
  const wallMat  = new THREE.MeshStandardMaterial({ color: 0xdde3ec, roughness: 0.85, metalness: 0 });
  const ceilMat  = new THREE.MeshStandardMaterial({ color: 0xf5f5f8, roughness: 0.9,  metalness: 0 });
  const darkMat  = new THREE.MeshStandardMaterial({ color: 0x2a2f3d, roughness: 0.7,  metalness: 0.1 });

  // Floor with tile pattern
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(LAB_W, LAB_D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Tile grid lines
  const tileMat = new THREE.LineBasicMaterial({ color: 0xcccccc });
  for (let x = -LAB_W / 2; x <= LAB_W / 2; x += 3) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.01, -LAB_D / 2),
      new THREE.Vector3(x, 0.01,  LAB_D / 2),
    ]);
    scene.add(new THREE.Line(g, tileMat));
  }
  for (let z = -LAB_D / 2; z <= LAB_D / 2; z += 3) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-LAB_W / 2, 0.01, z),
      new THREE.Vector3( LAB_W / 2, 0.01, z),
    ]);
    scene.add(new THREE.Line(g, tileMat));
  }

  // Ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(LAB_W, LAB_D), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = LAB_H;
  scene.add(ceil);

  // Walls (back, front, left, right)
  const wallDefs = [
    { w: LAB_W, h: LAB_H, x: 0,          y: LAB_H / 2, z: -LAB_D / 2, ry: 0 },          // back
    { w: LAB_W, h: LAB_H, x: 0,          y: LAB_H / 2, z:  LAB_D / 2, ry: Math.PI },     // front
    { w: LAB_D, h: LAB_H, x: -LAB_W / 2, y: LAB_H / 2, z: 0,          ry: Math.PI / 2 }, // left
    { w: LAB_D, h: LAB_H, x:  LAB_W / 2, y: LAB_H / 2, z: 0,          ry: -Math.PI / 2 },// right
  ];
  for (const d of wallDefs) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h), wallMat);
    m.position.set(d.x, d.y, d.z);
    m.rotation.y = d.ry;
    scene.add(m);
  }

  // Skirting boards along bottom of walls
  const skirtMat = new THREE.MeshLambertMaterial({ color: 0xb0b8c8 });
  const skirtDefs = [
    { w: LAB_W, x: 0,          z: -LAB_D / 2 + 0.05, ry: 0 },
    { w: LAB_W, x: 0,          z:  LAB_D / 2 - 0.05, ry: Math.PI },
    { w: LAB_D, x: -LAB_W / 2 + 0.05, z: 0,           ry: Math.PI / 2 },
    { w: LAB_D, x:  LAB_W / 2 - 0.05, z: 0,           ry: -Math.PI / 2 },
  ];
  for (const d of skirtDefs) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(d.w, 0.5, 0.1), skirtMat);
    m.position.set(d.x, 0.25, d.z);
    m.rotation.y = d.ry;
    scene.add(m);
  }

  // Fluorescent light fixtures on ceiling
  const fixtureMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const tubeMat    = new THREE.MeshStandardMaterial({ color: 0xeefff0, emissive: 0xeefff0, emissiveIntensity: 0.9 });
  for (const [lx, , lz] of [
    [-18,0,8],[-18,0,-8],[0,0,8],[0,0,-8],[18,0,8],[18,0,-8],
  ]) {
    // Housing
    const housing = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 0.8), fixtureMat);
    housing.position.set(lx, LAB_H - 0.12, lz);
    scene.add(housing);
    // Glowing tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.6, 16), tubeMat);
    tube.rotation.z = Math.PI / 2;
    tube.position.set(lx, LAB_H - 0.3, lz);
    scene.add(tube);
  }

  // Door on front wall (centre)
  const doorFrameMat = new THREE.MeshLambertMaterial({ color: 0x8a9ab0 });
  const doorMat      = new THREE.MeshLambertMaterial({ color: 0x5a7a9a });
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 7.2, 0.15), doorFrameMat);
  doorFrame.position.set(0, 3.6, LAB_D / 2 - 0.05);
  scene.add(doorFrame);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.8, 6.8, 0.1), doorMat);
  door.position.set(0, 3.4, LAB_D / 2 - 0.04);
  scene.add(door);

  // Windows on back wall
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x6ab4e8, transparent: true, opacity: 0.35 });
  for (const wx of [-14, 0, 14]) {
    const winFrame = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 0.15), doorFrameMat);
    winFrame.position.set(wx, 8, -LAB_D / 2 + 0.05);
    scene.add(winFrame);
    const win = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.4, 0.08), glassMat);
    win.position.set(wx, 8, -LAB_D / 2 + 0.06);
    scene.add(win);
  }
}

// ── Lab benches & shelving ─────────────────────────────
function _buildLabFurniture(scene) {
  const benchTopMat  = new THREE.MeshStandardMaterial({ color: 0xf0f4e8, roughness: 0.55, metalness: 0.05 });
  const benchBodyMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.7,  metalness: 0.05 });
  const shelfMat     = new THREE.MeshStandardMaterial({ color: 0xd0d8e8, roughness: 0.6,  metalness: 0 });
  const metalMat     = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.4,  metalness: 0.5 });

  // ── 3 central lab benches (one per question station) ──
  const benchData = [
    { x: -16, z:  5 },
    { x:   0, z: -6 },
    { x:  16, z:  5 },
  ];
  for (const { x, z } of benchData) {
    // Cabinet body
    const body = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 3), benchBodyMat);
    body.position.set(x, 1.5, z);
    body.castShadow = true;
    scene.add(body);
    // Worktop
    const top = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.15, 3.2), benchTopMat);
    top.position.set(x, 3.08, z);
    top.castShadow = true;
    scene.add(top);
    // Legs (4 corners)
    for (const [lx, lz] of [[-3.2, -1.3], [3.2, -1.3], [-3.2, 1.3], [3.2, 1.3]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.2), metalMat);
      leg.position.set(x + lx, 1.5, z + lz);
      scene.add(leg);
    }
    // Drawer lines (decorative)
    for (let d = 0; d < 3; d++) {
      const drw = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 0.05), shelfMat);
      drw.position.set(x - 2.2 + d * 2.2, 1.8, z + 1.52);
      scene.add(drw);
    }
    // Sink basin (only on centre bench)
    if (x === 0) {
      const sinkMat  = new THREE.MeshStandardMaterial({ color: 0xccddee, roughness: 0.3, metalness: 0.3 });
      const sink = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.9), sinkMat);
      sink.position.set(2.5, 3.15, z);
      scene.add(sink);
      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 16), metalMat);
      tap.position.set(2.5, 3.55, z - 0.3);
      scene.add(tap);
      const tapHead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 14), metalMat);
      tapHead.position.set(2.5, 3.85, z);
      scene.add(tapHead);
    }
  }

  // ── Wall-mounted shelving on back wall ─────────────────
  for (let sx = -22; sx <= 22; sx += 11) {
    for (let sy = 0; sy < 3; sy++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 1.2), shelfMat);
      shelf.position.set(sx, 5 + sy * 2.2, -LAB_D / 2 + 0.8);
      scene.add(shelf);
      // Shelf brackets
      for (const bx of [-4, 4]) {
        const brk = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 1.0), metalMat);
        brk.position.set(sx + bx, 4.75 + sy * 2.2, -LAB_D / 2 + 0.8);
        scene.add(brk);
      }
    }
  }

  // ── Side bench along left wall ─────────────────────────
  const sideBody = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 22), benchBodyMat);
  sideBody.position.set(-LAB_W / 2 + 2, 1.5, 0);
  sideBody.castShadow = true;
  scene.add(sideBody);
  const sideTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 22.2), benchTopMat);
  sideTop.position.set(-LAB_W / 2 + 2, 3.08, 0);
  scene.add(sideTop);

  // ── Side bench along right wall ────────────────────────
  const sideBody2 = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 22), benchBodyMat);
  sideBody2.position.set(LAB_W / 2 - 2, 1.5, 0);
  sideBody2.castShadow = true;
  scene.add(sideBody2);
  const sideTop2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.15, 22.2), benchTopMat);
  sideTop2.position.set(LAB_W / 2 - 2, 3.08, 0);
  scene.add(sideTop2);

  // ── Fume hood on back wall (left side) ────────────────
  const hoodBodyMat  = new THREE.MeshStandardMaterial({ color: 0x6a7a8a, roughness: 0.6, metalness: 0.1 });
  const hoodGlassMat = new THREE.MeshStandardMaterial({ color: 0x88ccdd, transparent: true, opacity: 0.4, roughness: 0.1, metalness: 0 });
  const hood = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 2.5), hoodBodyMat);
  hood.position.set(-20, 4.5, -LAB_D / 2 + 1.5);
  scene.add(hood);
  const hoodGlass = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.08), hoodGlassMat);
  hoodGlass.position.set(-20, 4.8, -LAB_D / 2 + 2.8);
  scene.add(hoodGlass);
  const hoodBase = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3, 2.8), benchBodyMat);
  hoodBase.position.set(-20, 1.5, -LAB_D / 2 + 1.6);
  scene.add(hoodBase);
  const hoodTop2 = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.15, 2.8), benchTopMat);
  hoodTop2.position.set(-20, 3.08, -LAB_D / 2 + 1.6);
  scene.add(hoodTop2);
}

// ── Decorative lab items ───────────────────────────────
function _buildLabDetails(scene) {
  const glassMat    = new THREE.MeshStandardMaterial({ color: 0xaaddee, transparent: true, opacity: 0.7,  roughness: 0.05, metalness: 0.0 });
  const liquidMat   = new THREE.MeshStandardMaterial({ color: 0x3d8b40, transparent: true, opacity: 0.85, roughness: 0.15, metalness: 0   });
  const brownLiqMat = new THREE.MeshStandardMaterial({ color: 0x7a3c10, transparent: true, opacity: 0.85, roughness: 0.2,  metalness: 0   });
  const redLiqMat   = new THREE.MeshStandardMaterial({ color: 0xc0392b, transparent: true, opacity: 0.85, roughness: 0.15, metalness: 0   });
  const whiteMat    = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0 });
  const metalMat    = new THREE.MeshStandardMaterial({ color: 0x8899aa, roughness: 0.35, metalness: 0.6 });
  const labelMat    = new THREE.MeshStandardMaterial({ color: 0xfff5cc, roughness: 0.8 });

  // ── Bottles & flasks on back wall shelves ──────────────
  const bottleData = [
    { x: -24, y: 5.3,  z: -LAB_D/2 + 0.7, mat: liquidMat,   r: 0.22, h: 0.7 },
    { x: -22, y: 5.3,  z: -LAB_D/2 + 0.7, mat: brownLiqMat, r: 0.18, h: 0.9 },
    { x: -20, y: 5.3,  z: -LAB_D/2 + 0.7, mat: redLiqMat,   r: 0.2,  h: 0.75 },
    { x: -18, y: 5.3,  z: -LAB_D/2 + 0.7, mat: glassMat,    r: 0.16, h: 0.65 },
    { x: -13, y: 5.3,  z: -LAB_D/2 + 0.7, mat: brownLiqMat, r: 0.2,  h: 0.85 },
    { x: -11, y: 5.3,  z: -LAB_D/2 + 0.7, mat: liquidMat,   r: 0.25, h: 0.6 },
    { x:  -2, y: 5.3,  z: -LAB_D/2 + 0.7, mat: redLiqMat,   r: 0.18, h: 0.8 },
    { x:   0, y: 5.3,  z: -LAB_D/2 + 0.7, mat: glassMat,    r: 0.22, h: 0.7 },
    { x:   2, y: 5.3,  z: -LAB_D/2 + 0.7, mat: liquidMat,   r: 0.2,  h: 0.9 },
    { x:  10, y: 5.3,  z: -LAB_D/2 + 0.7, mat: brownLiqMat, r: 0.19, h: 0.7 },
    { x:  12, y: 5.3,  z: -LAB_D/2 + 0.7, mat: redLiqMat,   r: 0.21, h: 0.8 },
    { x:  22, y: 5.3,  z: -LAB_D/2 + 0.7, mat: glassMat,    r: 0.23, h: 0.65 },
    { x:  24, y: 5.3,  z: -LAB_D/2 + 0.7, mat: liquidMat,   r: 0.17, h: 0.9 },
    // second shelf row
    { x: -23, y: 7.5,  z: -LAB_D/2 + 0.7, mat: redLiqMat,   r: 0.2,  h: 0.8 },
    { x: -21, y: 7.5,  z: -LAB_D/2 + 0.7, mat: glassMat,    r: 0.18, h: 0.7 },
    { x:  -1, y: 7.5,  z: -LAB_D/2 + 0.7, mat: brownLiqMat, r: 0.22, h: 0.85 },
    { x:   1, y: 7.5,  z: -LAB_D/2 + 0.7, mat: liquidMat,   r: 0.2,  h: 0.7 },
    { x:  21, y: 7.5,  z: -LAB_D/2 + 0.7, mat: redLiqMat,   r: 0.19, h: 0.75 },
  ];
  for (const b of bottleData) {
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(b.r, b.r * 0.9, b.h, 20), b.mat);
    bottle.position.set(b.x, b.y + b.h / 2, b.z);
    scene.add(bottle);
    // Cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(b.r * 0.7, b.r * 0.7, 0.12, 20), whiteMat);
    cap.position.set(b.x, b.y + b.h + 0.06, b.z);
    scene.add(cap);
  }

  // ── Equipment on side benches ──────────────────────────
  // Left bench: centrifuge + microscope
  _addCentrifuge(scene, -LAB_W/2 + 2.5, 3.2, -6, metalMat, whiteMat);
  _addMicroscope(scene, -LAB_W/2 + 2.5, 3.2,  4, metalMat, whiteMat);

  // Right bench: hot plate + some beakers
  _addHotPlate(scene, LAB_W/2 - 2.5, 3.2, -5, metalMat);
  for (let i = 0; i < 4; i++) {
    const bkMat = i % 2 === 0 ? brownLiqMat : glassMat;
    const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.5, 20), bkMat);
    bk.position.set(LAB_W/2 - 2.5 + (i - 1.5) * 0.7, 3.5, 5 + (i % 2) * 0.6);
    scene.add(bk);
  }

  // ── Safety poster on right wall ────────────────────────
  const posterMat = new THREE.MeshLambertMaterial({ color: 0xffe082 });
  const poster = new THREE.Mesh(new THREE.BoxGeometry(3.5, 5, 0.06), posterMat);
  poster.position.set(LAB_W/2 - 0.06, 6, 10);
  poster.rotation.y = -Math.PI / 2;
  scene.add(poster);
  const posterSprite = _makeTextSprite('⚠ KESELAMATAN\nLABORATORIUM', 0xe53935);
  posterSprite.scale.set(4, 1.6, 1);
  posterSprite.position.set(LAB_W/2 - 0.3, 6.5, 10);
  scene.add(posterSprite);

  // ── Lab coat hanger on left wall ───────────────────────
  const hangerPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 16), metalMat);
  hangerPost.position.set(-LAB_W/2 + 0.2, 9, 14);
  hangerPost.rotation.z = Math.PI / 2;
  scene.add(hangerPost);
  for (const hx of [-0.5, 0, 0.5]) {
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 12, 24, Math.PI), metalMat);
    hook.position.set(-LAB_W/2 + 0.25, 8.6, 14 + hx);
    hook.rotation.y = Math.PI / 2;
    scene.add(hook);
  }
  // Lab coat (simplified flat shape)
  const coatMat = new THREE.MeshLambertMaterial({ color: 0xfafafa });
  const coat = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.5, 1.5), coatMat);
  coat.position.set(-LAB_W/2 + 0.28, 7.8, 14);
  scene.add(coat);

  // ── Waste bins on floor ────────────────────────────────
  const binMat  = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
  const bin2Mat = new THREE.MeshLambertMaterial({ color: 0xf39c12 });
  for (const [bx, bz, bm] of [[-8, 14, binMat], [8, 14, bin2Mat]]) {
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.38, 1.0, 20), bm);
    bin.position.set(bx, 0.5, bz);
    scene.add(bin);
  }

  // ── Fire extinguisher on right wall ───────────────────
  const extMat = new THREE.MeshLambertMaterial({ color: 0xc0392b });
  const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.1, 20), extMat);
  ext.position.set(LAB_W/2 - 0.8, 1.8, -14);
  scene.add(ext);
  const extTop = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.3, 20), metalMat);
  extTop.position.set(LAB_W/2 - 0.8, 2.5, -14);
  scene.add(extTop);

  // ── Clock on back wall ─────────────────────────────────
  const clockMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 24), clockMat);
  clock.rotation.x = Math.PI / 2;
  clock.position.set(8, 10.5, -LAB_D/2 + 0.1);
  scene.add(clock);
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 12, 40), metalMat);
  clockRim.rotation.x = Math.PI / 2;
  clockRim.position.set(8, 10.5, -LAB_D/2 + 0.12);
  scene.add(clockRim);
}

// ── Equipment builders ─────────────────────────────────
function _addCentrifuge(scene, x, y, z, metalMat, whiteMat) {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.7, 0.7, 24), whiteMat);
  body.position.set(x, y + 0.35, z);
  scene.add(body);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.12, 24), metalMat);
  lid.position.set(x, y + 0.76, z);
  scene.add(lid);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 14), metalMat);
  knob.position.set(x, y + 0.88, z);
  scene.add(knob);
}

function _addMicroscope(scene, x, y, z, metalMat, whiteMat) {
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.55), metalMat);
  base.position.set(x, y + 0.06, z);
  scene.add(base);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 0.12), metalMat);
  arm.position.set(x, y + 0.76, z - 0.1);
  scene.add(arm);
  const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.5, 16), metalMat);
  eyepiece.position.set(x, y + 1.7, z - 0.15);
  eyepiece.rotation.z = 0.4;
  scene.add(eyepiece);
  const objective = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.35, 16), whiteMat);
  objective.position.set(x + 0.05, y + 0.75, z + 0.05);
  scene.add(objective);
}

function _addHotPlate(scene, x, y, z, metalMat) {
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.6, metalness: 0.15 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 1.0), plateMat);
  plate.position.set(x, y + 0.09, z);
  scene.add(plate);
  const surface = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.04, 20), metalMat);
  surface.position.set(x, y + 0.2, z);
  scene.add(surface);
  // Hot glow (orange circle)
  const hotMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff6600, emissiveIntensity: 0.6, transparent: true, opacity: 0.7 });
  const hot = new THREE.Mesh(new THREE.CircleGeometry(0.3, 20), hotMat);
  hot.rotation.x = -Math.PI / 2;
  hot.position.set(x, y + 0.22, z);
  scene.add(hot);
  // Flask on top
  const flaskMat = new THREE.MeshLambertMaterial({ color: 0xaaddee, transparent: true, opacity: 0.8 });
  const flask = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), flaskMat);
  flask.position.set(x, y + 0.55, z);
  scene.add(flask);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.35, 20), flaskMat);
  neck.position.set(x, y + 0.9, z);
  scene.add(neck);
}

// ── Question Interactive Objects ─────────────────────
// Each phenomenon is a thematic 3D prop on a lab bench.
export function createQuestionObjects(scene) {
  const objects = [];

  // ── Fenomena 1 – Water Quality Analysis Bench ──────────
  {
    const pos = QUESTION_POSITIONS[0];
    const group = new THREE.Group();
    group.position.copy(pos);

    const glassMat    = new THREE.MeshLambertMaterial({ color: 0xaaddee, transparent: true, opacity: 0.75 });
    const brownLiq    = new THREE.MeshLambertMaterial({ color: 0x6b3a10, transparent: true, opacity: 0.9 });
    const metalMat    = new THREE.MeshLambertMaterial({ color: 0x8899aa });
    const whiteMat    = new THREE.MeshLambertMaterial({ color: 0xfafafa });

    // Bench top surface (on top of the existing bench)
    const mat = new THREE.MeshLambertMaterial({ color: 0xf0f4e8 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.12, 2.8), mat);
    top.position.set(0, 3.14, 0);
    group.add(top);

    // Test tube rack with 5 tubes (brown/polluted water samples)
    const rackMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    const rack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 0.45), rackMat);
    rack.position.set(-1.5, 3.3, 0.2);
    group.add(rack);
    for (let i = 0; i < 5; i++) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.55, 16), brownLiq);
      tube.position.set(-2.2 + i * 0.42, 3.62, 0.2);
      group.add(tube);
    }

    // Erlenmeyer flask with brown liquid (vinasse water sample)
    const flaskBody = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), glassMat);
    flaskBody.position.set(0.8, 3.62, -0.3);
    group.add(flaskBody);
    const flaskNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.45, 20), glassMat);
    flaskNeck.position.set(0.8, 4.05, -0.3);
    group.add(flaskNeck);
    const liquidFill = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 16), brownLiq);
    liquidFill.position.set(0.8, 3.58, -0.3);
    group.add(liquidFill);

    // DO meter probe (vertical rod going into beaker)
    const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 16), metalMat);
    probe.position.set(0.8, 4.2, -0.3);
    group.add(probe);
    // Meter display box
    const meter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.15), whiteMat);
    meter.position.set(0.8, 4.85, -0.3);
    group.add(meter);

    // Clipboard with data sheet
    const boardMat = new THREE.MeshLambertMaterial({ color: 0xfff8e7 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.05), boardMat);
    board.position.set(2.3, 3.85, -0.5);
    board.rotation.y = -0.3;
    group.add(board);
    const clipMat = new THREE.MeshLambertMaterial({ color: 0x8899aa });
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.06), clipMat);
    clip.position.set(2.3, 4.34, -0.46);
    clip.rotation.y = -0.3;
    group.add(clip);

    // Overhead label
    const labelSprite = _makeTextSprite('❓ Fenomena 1 — Kualitas Air', 0x00d4ff);
    labelSprite.position.set(0, 3.2, 0);
    group.add(labelSprite);

    const doneSprite = _makeTextSprite('✅ Selesai', 0x2ecc71);
    doneSprite.position.set(0, 4.2, 0);
    doneSprite.visible = false;
    group.add(doneSprite);

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff, emissive: 0x00d4ff, emissiveIntensity: 0.5,
      transparent: true, opacity: 0.25, side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), glowMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.02;
    group.add(disc);

    scene.add(group);
    objects.push({ group, glowMat, idx: 0, pos, done: false, doneSprite,
      _probe: probe, _meter: meter,
    });
  }

  // ── Fenomena 2 – TDS / Ion Analysis Bench ─────────────
  {
    const pos = QUESTION_POSITIONS[1];
    const group = new THREE.Group();
    group.position.copy(pos);

    const glassMat  = new THREE.MeshLambertMaterial({ color: 0xaaddee, transparent: true, opacity: 0.7 });
    const brownLiq  = new THREE.MeshLambertMaterial({ color: 0x5a2e08, transparent: true, opacity: 0.9 });
    const greenLiq  = new THREE.MeshLambertMaterial({ color: 0x1a7a3a, transparent: true, opacity: 0.85 });
    const metalMat  = new THREE.MeshLambertMaterial({ color: 0x8899aa });
    const whiteMat  = new THREE.MeshLambertMaterial({ color: 0xfafafa });
    const warnMat   = new THREE.MeshLambertMaterial({ color: 0xf39c12 });

    const top = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.12, 2.8),
      new THREE.MeshLambertMaterial({ color: 0xf0f4e8 }));
    top.position.set(0, 3.14, 0);
    group.add(top);

    // TDS meter (handheld device)
    const tdsMeterBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.9, 0.14), whiteMat);
    tdsMeterBody.position.set(-2.0, 3.75, 0);
    group.add(tdsMeterBody);
    const tdsScreen = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.05), new THREE.MeshLambertMaterial({ color: 0x1a2a1a }));
    tdsScreen.position.set(-2.0, 3.88, 0.1);
    group.add(tdsScreen);
    const tdsProbe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 16), metalMat);
    tdsProbe.position.set(-2.0, 3.05, 0);
    group.add(tdsProbe);

    // Large beaker with brown vinasse
    const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.8, 20), glassMat);
    beaker.position.set(-0.5, 3.7, 0.2);
    group.add(beaker);
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.6, 20), brownLiq);
    liq.position.set(-0.5, 3.6, 0.2);
    group.add(liq);

    // Ion diagram poster on back wall (small version on stand)
    const standMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 14), metalMat);
    stand.position.set(1.2, 3.9, -0.7);
    group.add(stand);
    const signboard = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.05), new THREE.MeshLambertMaterial({ color: 0xfff8e7 }));
    signboard.position.set(1.2, 4.85, -0.7);
    group.add(signboard);
    // Ion labels on signboard
    const ionSprite = _makeTextSprite('K⁺  Ca²⁺  Cl⁻', 0x1a7a3a);
    ionSprite.scale.set(2.8, 0.75, 1);
    ionSprite.position.set(1.2, 4.92, -0.6);
    group.add(ionSprite);

    // Conductivity meter
    const condMeter = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.22), whiteMat);
    condMeter.position.set(2.2, 3.4, 0);
    group.add(condMeter);
    const condScreen = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.06), new THREE.MeshLambertMaterial({ color: 0x0a1a0a }));
    condScreen.position.set(2.2, 3.44, 0.14);
    group.add(condScreen);

    // 2 sample bottles (one brown, one clear)
    for (const [bx, bm] of [[2.8, brownLiq], [3.3, glassMat]]) {
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.7, 20), bm);
      bottle.position.set(bx, 3.55, -0.5);
      group.add(bottle);
    }

    const labelSprite = _makeTextSprite('❓ Fenomena 2 — Komposisi TDS', 0xff9900);
    labelSprite.position.set(0, 3.2, 0);
    group.add(labelSprite);

    const doneSprite = _makeTextSprite('✅ Selesai', 0x2ecc71);
    doneSprite.position.set(0, 4.2, 0);
    doneSprite.visible = false;
    group.add(doneSprite);

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xff9900, emissive: 0xff9900, emissiveIntensity: 0.5,
      transparent: true, opacity: 0.25, side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), glowMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.02;
    group.add(disc);

    scene.add(group);
    objects.push({ group, glowMat, idx: 1, pos, done: false, doneSprite,
      _beaker: beaker, _liq: liq,
    });
  }

  // ── Fenomena 3 – Rice / Soil Analysis Bench ───────────
  {
    const pos = QUESTION_POSITIONS[2];
    const group = new THREE.Group();
    group.position.copy(pos);

    const soilMat    = new THREE.MeshLambertMaterial({ color: 0x7a5c2e });
    const healthyMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 });
    const weakMat    = new THREE.MeshLambertMaterial({ color: 0xa8c040 });
    const deadMat    = new THREE.MeshLambertMaterial({ color: 0xb5651d });
    const glassMat   = new THREE.MeshLambertMaterial({ color: 0xaaddee, transparent: true, opacity: 0.7 });
    const whiteMat   = new THREE.MeshLambertMaterial({ color: 0xfafafa });
    const metalMat   = new THREE.MeshLambertMaterial({ color: 0x8899aa });

    const top = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.12, 2.8),
      new THREE.MeshLambertMaterial({ color: 0xf0f4e8 }));
    top.position.set(0, 3.14, 0);
    group.add(top);

    // 3 small soil trays with rice plants (Tahun 1, 2, 3)
    const trayData = [
      { x: -2.0, mat: healthyMat, height: 0.9,  label: 'Thn 1\n62%',  lColor: 0x4caf50 },
      { x:  0.0, mat: weakMat,    height: 1.1, label: 'Thn 2\n78%',  lColor: 0xa8c040 },
      { x:  2.0, mat: deadMat,    height: 0.35, label: 'Thn 3\n34%',  lColor: 0xe74c3c },
    ];
    for (const col of trayData) {
      // Soil tray
      const tray = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.9), soilMat);
      tray.position.set(col.x, 3.35, 0.2);
      group.add(tray);
      // Rice stems (2 per tray)
      for (let s = -1; s <= 1; s += 2) {
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, col.height, 5), col.mat);
        const sx = col.x + s * 0.22;
        stem.position.set(sx, 3.45 + col.height / 2, 0.2);
        group.add(stem);
        const panicle = new THREE.Mesh(
          new THREE.SphereGeometry(col.height > 0.8 ? 0.14 : 0.06, 12, 8), col.mat);
        panicle.position.set(sx + (col.mat === deadMat ? 0.1 : 0), 3.45 + col.height + 0.08, 0.2);
        group.add(panicle);
      }
      // Year label sprite above tray
      const ySpr = _makeTextSprite(col.label, col.lColor);
      ySpr.scale.set(2.0, 0.75, 1);
      ySpr.position.set(col.x, 3.45 + col.height + 0.6, 0.2);
      group.add(ySpr);
    }

    // pH meter
    const phBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.14), whiteMat);
    phBody.position.set(-2.9, 3.65, -0.4);
    group.add(phBody);
    const phProbe = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 16), metalMat);
    phProbe.position.set(-2.9, 3.12, -0.4);
    group.add(phProbe);
    const phScreen = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.05), new THREE.MeshLambertMaterial({ color: 0x0a1a0a }));
    phScreen.position.set(-2.9, 3.72, -0.33);
    group.add(phScreen);

    // Soil sample beaker (brown)
    const brownLiq = new THREE.MeshLambertMaterial({ color: 0x7a5c2e, transparent: true, opacity: 0.9 });
    const soilBeaker = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.6, 20), glassMat);
    soilBeaker.position.set(2.8, 3.55, -0.4);
    group.add(soilBeaker);
    const soilLiq = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.38, 20), brownLiq);
    soilLiq.position.set(2.8, 3.44, -0.4);
    group.add(soilLiq);

    // Chart clipboard showing bar graph
    const boardMat = new THREE.MeshLambertMaterial({ color: 0xfff8e7 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.05), boardMat);
    board.position.set(3.2, 3.95, -0.6);
    board.rotation.y = -0.25;
    group.add(board);
    // Bar graph drawn on board (3 colored bars)
    const barColors = [0x4caf50, 0xa8c040, 0xe74c3c];
    const barHeights = [0.22, 0.3, 0.1];
    for (let i = 0; i < 3; i++) {
      const barMat = new THREE.MeshLambertMaterial({ color: barColors[i] });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, barHeights[i], 0.04), barMat);
      bar.position.set(3.05 + i * 0.2, 3.5 + barHeights[i] / 2, -0.57);
      bar.rotation.y = -0.25;
      group.add(bar);
    }

    const labelSprite = _makeTextSprite('❓ Fenomena 3 — Panen Padi', 0x44ff88);
    labelSprite.position.set(0, 3.2, 0);
    group.add(labelSprite);

    const doneSprite = _makeTextSprite('✅ Selesai', 0x2ecc71);
    doneSprite.position.set(0, 4.4, 0);
    doneSprite.visible = false;
    group.add(doneSprite);

    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x44ff88, emissive: 0x44ff88, emissiveIntensity: 0.5,
      transparent: true, opacity: 0.25, side: THREE.DoubleSide,
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), glowMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.02;
    group.add(disc);

    scene.add(group);
    objects.push({ group, glowMat, idx: 2, pos, done: false, doneSprite,
      _stems: group.children,
    });
  }

  return objects;
}

// ── Sprite text helper ────────────────────────────────
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
    if (obj.done) {
      obj.glowMat.emissiveIntensity = 0.15 + Math.sin(t * 1.2) * 0.05;
      obj.glowMat.opacity = 0.12;
      continue;
    }

    // Pulse the ground glow disc
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + obj.idx * 1.3);
    obj.glowMat.emissiveIntensity = 0.3 + pulse * 0.5;
    obj.glowMat.opacity = 0.15 + pulse * 0.15;

    if (obj.idx === 0) {
      // Fenomena 1: DO probe bobs slightly (measuring motion)
      if (obj._probe) obj._probe.position.y = 4.2 + Math.sin(t * 1.4) * 0.12;
      if (obj._meter) obj._meter.position.y = 4.85 + Math.sin(t * 1.4) * 0.12;
    }

    if (obj.idx === 1) {
      // Fenomena 2: beaker liquid level ripples (scale Y)
      if (obj._liq) {
        const s = 1.0 + Math.sin(t * 2.5) * 0.04;
        obj._liq.scale.set(1, s, 1);
      }
    }

    if (obj.idx === 2) {
      // Fenomena 3: gentle group sway
      obj.group.rotation.z = Math.sin(t * 0.6) * 0.008;
    }

    // Very subtle float for all benches
    obj.group.position.y = Math.sin(t * 0.5 + obj.idx) * 0.04;
  }
}
