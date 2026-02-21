import * as THREE from 'three';

// ── Factory dimensions ─────────────────────────────────
const FAC_W = 70;   // width  (X)
const FAC_D = 50;   // depth  (Z)
const FAC_H = 18;   // height (Y)

// ── Question object positions – in front of machines ───
export const FACTORY_QUESTION_POSITIONS = [
  new THREE.Vector3(-18, 0, 10),   // Station 1 – Fermentor
  new THREE.Vector3(  0, 0, -8),   // Station 2 – Destilator
  new THREE.Vector3( 18, 0, 10),   // Station 3 – Kompor Pemanas
];

// ──────────────────────────────────────────────────────
export function createFactoryScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1208);   // dark industrial amber
  scene.fog = new THREE.Fog(0x1a1208, 35, 85);

  // Ambient – warm industrial glow
  scene.add(new THREE.AmbientLight(0xffe8b0, 0.4));

  // Industrial overhead lamps
  const lampPositions = [
    [-22, FAC_H - 1,  10], [-22, FAC_H - 1, -10],
    [  0, FAC_H - 1,  10], [  0, FAC_H - 1, -10],
    [ 22, FAC_H - 1,  10], [ 22, FAC_H - 1, -10],
  ];
  for (const [lx, ly, lz] of lampPositions) {
    const pt = new THREE.PointLight(0xffd080, 1.1, 30);
    pt.position.set(lx, ly, lz);
    scene.add(pt);
  }

  // Hot-glow from fermentor area
  const heatLight = new THREE.PointLight(0xff6600, 1.5, 18);
  heatLight.position.set(-18, 6, 8);
  scene.add(heatLight);

  const distLight = new THREE.PointLight(0x88aaff, 0.8, 14);
  distLight.position.set(0, 6, -6);
  scene.add(distLight);

  const key = new THREE.DirectionalLight(0xfff0cc, 0.4);
  key.position.set(10, 20, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  return { scene };
}

// ──────────────────────────────────────────────────────
export function buildFactory(scene) {
  _buildFactoryRoom(scene);
  _buildFactoryMachines(scene);
  _buildFactoryDetails(scene);
}

// ── Room shell ─────────────────────────────────────────
function _buildFactoryRoom(scene) {
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x5a5243, roughness: 0.9, metalness: 0 });
  const wallMat     = new THREE.MeshStandardMaterial({ color: 0x4a4030, roughness: 0.85, metalness: 0 });
  const roofMat     = new THREE.MeshStandardMaterial({ color: 0x2e261a, roughness: 0.9, metalness: 0 });

  // Concrete floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(FAC_W, FAC_D), concreteMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Floor seam lines
  const seamMat = new THREE.LineBasicMaterial({ color: 0x3a3220 });
  for (let x = -FAC_W / 2; x <= FAC_W / 2; x += 5) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0.01, -FAC_D / 2),
      new THREE.Vector3(x, 0.01,  FAC_D / 2),
    ]);
    scene.add(new THREE.Line(g, seamMat));
  }
  for (let z = -FAC_D / 2; z <= FAC_D / 2; z += 5) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-FAC_W / 2, 0.01, z),
      new THREE.Vector3( FAC_W / 2, 0.01, z),
    ]);
    scene.add(new THREE.Line(g, seamMat));
  }

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(FAC_W, FAC_D), roofMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = FAC_H;
  scene.add(ceiling);

  // Corrugated roof ridges (cosmetic)
  const ridgeMat = new THREE.MeshLambertMaterial({ color: 0x1e1610 });
  for (let x = -FAC_W / 2; x <= FAC_W / 2; x += 4) {
    const ridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.15, FAC_D),
      ridgeMat
    );
    ridge.position.set(x, FAC_H, 0);
    scene.add(ridge);
  }

  // Walls
  const wallThick = 0.6;
  const walls = [
    { pos: [0, FAC_H/2, -FAC_D/2], size: [FAC_W, FAC_H, wallThick] }, // back
    { pos: [0, FAC_H/2,  FAC_D/2], size: [FAC_W, FAC_H, wallThick] }, // front
    { pos: [-FAC_W/2, FAC_H/2, 0], size: [wallThick, FAC_H, FAC_D] }, // left
    { pos: [ FAC_W/2, FAC_H/2, 0], size: [wallThick, FAC_H, FAC_D] }, // right
  ];
  for (const w of walls) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
    m.position.set(...w.pos);
    scene.add(m);
  }

  // Structural pillars at corners
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x3a3020 });
  const pillarPositions = [
    [-FAC_W/2 + 1, FAC_H/2, -FAC_D/2 + 1],
    [ FAC_W/2 - 1, FAC_H/2, -FAC_D/2 + 1],
    [-FAC_W/2 + 1, FAC_H/2,  FAC_D/2 - 1],
    [ FAC_W/2 - 1, FAC_H/2,  FAC_D/2 - 1],
    [-FAC_W/2 + 1, FAC_H/2, 0],
    [ FAC_W/2 - 1, FAC_H/2, 0],
  ];
  for (const [px, py, pz] of pillarPositions) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, FAC_H, 1.2), pillarMat);
    pillar.position.set(px, py, pz);
    scene.add(pillar);
  }

  // Industrial lamps (lamp housing)
  const lampHouseMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  const bulbMat      = new THREE.MeshStandardMaterial({ color: 0xfff5c0, emissive: 0xffd060, emissiveIntensity: 1.2 });
  for (const [lx, , lz] of lampPositions) {
    const house = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.6), lampHouseMat);
    house.position.set(lx, FAC_H - 0.8, lz);
    scene.add(house);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 10), bulbMat);
    bulb.position.set(lx, FAC_H - 1.1, lz);
    scene.add(bulb);
  }
}

// Shared lamp positions referenced in room builder above
const lampPositions = [
  [-22, FAC_H - 1,  10], [-22, FAC_H - 1, -10],
  [  0, FAC_H - 1,  10], [  0, FAC_H - 1, -10],
  [ 22, FAC_H - 1,  10], [ 22, FAC_H - 1, -10],
];

// ── Machines ───────────────────────────────────────────
function _buildFactoryMachines(scene) {
  _buildFermentor(scene, -18, 0, 6);
  _buildDestilator(scene, 0, 0, -12);
  _buildKomporPemanas(scene, 18, 0, 6);
}

// ── Machine 1: Drum Fermentor ──────────────────────────
function _buildFermentor(scene, x, y, z) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);

  // Base platform
  const baseMat  = new THREE.MeshLambertMaterial({ color: 0x3c3020 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 5), baseMat);
  base.position.y = 0.2;
  grp.add(base);

  // Main drum body
  const drumMat  = new THREE.MeshStandardMaterial({ color: 0x708090, metalness: 0.7, roughness: 0.3 });
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 5.5, 24), drumMat);
  drum.position.y = 3.15;
  grp.add(drum);

  // Drum top dome
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), drumMat);
  dome.position.y = 5.9;
  grp.add(dome);

  // Drum bottom dome
  const domeBot = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), drumMat);
  domeBot.position.y = 0.4;
  grp.add(domeBot);

  // Horizontal ribs (weld rings)
  const ribMat = new THREE.MeshLambertMaterial({ color: 0x9090a0 });
  for (let ry = 1.5; ry <= 5.5; ry += 1.5) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(2.06, 0.09, 10, 40), ribMat);
    rib.rotation.x = Math.PI / 2;
    rib.position.y = ry + 0.5;
    grp.add(rib);
  }

  // Pipes
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x6688aa, metalness: 0.6, roughness: 0.4 });
  // Inlet pipe (top)
  const pipeIn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2, 16), pipeMat);
  pipeIn.position.set(0.8, 7.2, 0);
  grp.add(pipeIn);
  // Outlet pipe (bottom side)
  const pipeOut = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.8, 16), pipeMat);
  pipeOut.rotation.z = Math.PI / 2;
  pipeOut.position.set(-2.8, 1.2, 0);
  grp.add(pipeOut);
  // Pipe elbow (outlet)
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), pipeMat);
  elbow.position.set(-3.7, 1.2, 0);
  grp.add(elbow);
  // Pipe going down
  const pipeDn = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 16), pipeMat);
  pipeDn.position.set(-3.7, 0.6, 0);
  grp.add(pipeDn);

  // Valve
  const valveMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.5, roughness: 0.5 });
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16), valveMat);
  valve.rotation.z = Math.PI / 2;
  valve.position.set(-2.85, 2.5, 0);
  grp.add(valve);

  // CO2 vent pipe (top side)
  const ventPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.5, 16), pipeMat);
  ventPipe.position.set(-0.5, 8, 0);
  grp.add(ventPipe);

  // Bubble effect – stacked translucent spheres
  const bubbleMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff, transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0,
  });
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12 + i * 0.04, 12, 10), bubbleMat);
    b.position.set(-0.5, 8.8 + i * 0.28, 0);
    b.userData.bubbleIndex = i;
    grp.add(b);
  }

  // Label
  _makeLabel(grp, 'FERMENTOR\nDRUM', 0, 9.5, 0, 0xffa040);

  scene.add(grp);
  return grp;
}

// ── Machine 2: Destilator (column still) ──────────────
function _buildDestilator(scene, x, y, z) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);

  const metalMat  = new THREE.MeshStandardMaterial({ color: 0xaabbcc, metalness: 0.8, roughness: 0.25 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x556677, metalness: 0.7, roughness: 0.35 });
  const pipeMat   = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.6, roughness: 0.4 });

  // Base
  const base = new THREE.Mesh(new THREE.BoxGeometry(4, 0.4, 4), darkMetal);
  base.position.y = 0.2;
  grp.add(base);

  // Main column
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 8, 24), metalMat);
  column.position.y = 4.4;
  grp.add(column);

  // Column sections (bubble caps / trays)
  for (let cy = 1.5; cy <= 7.5; cy += 1.2) {
    const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.12, 24), darkMetal);
    tray.position.y = cy;
    grp.add(tray);
  }

  // Condenser coil at top
  const condBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.5, 20), darkMetal);
  condBase.position.y = 9.2;
  grp.add(condBase);

  // Coil representation using torus rings
  const coilMat = new THREE.MeshStandardMaterial({ color: 0x88aacc, metalness: 0.8, roughness: 0.2 });
  for (let ci = 0; ci < 4; ci++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 12, 36), coilMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.y = 9.1 + ci * 0.28;
    grp.add(coil);
  }

  // Condenser top cap
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.7, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), darkMetal);
  cap.position.y = 10.2;
  grp.add(cap);

  // Feed pipe (vinasse in)
  const feedPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 16), pipeMat);
  feedPipe.rotation.z = Math.PI / 2;
  feedPipe.position.set(-1.85, 6.5, 0);
  grp.add(feedPipe);

  // Steam riser pipe at top
  const steamPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 16), pipeMat);
  steamPipe.position.set(0.5, 11, 0);
  grp.add(steamPipe);

  // Ethanol output pipe (side)
  const ethPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2, 16), pipeMat);
  ethPipe.rotation.z = Math.PI / 2;
  ethPipe.position.set(1.8, 9.6, 0);
  grp.add(ethPipe);

  // Vinasse waste pipe (bottom)
  const wastePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 16), pipeMat);
  wastePipe.position.set(0.8, 0.3, 0);
  grp.add(wastePipe);

  // Collection barrel for vinasse
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, metalness: 0.3, roughness: 0.7 });
  const barrel    = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.6, 1.2, 20), barrelMat);
  barrel.position.set(0.8, -0.2, 0);
  grp.add(barrel);
  const barrelLid = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.08, 20), darkMetal);
  barrelLid.position.set(0.8, 0.42, 0);
  grp.add(barrelLid);

  // Liquid level indicator tube (glass)
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xaaddff, transparent: true, opacity: 0.5 });
  const indicator = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4, 16), glassMat);
  indicator.position.set(-0.92, 3, 0.7);
  grp.add(indicator);
  const liquidLevel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.5, 16),
    new THREE.MeshStandardMaterial({ color: 0x60a0c0, transparent: true, opacity: 0.7 })
  );
  liquidLevel.position.set(-0.92, 2.25, 0.7);
  grp.add(liquidLevel);

  _makeLabel(grp, 'DESTILATOR\nKOLOM', 0, 11.5, 0, 0x80ccff);

  scene.add(grp);
  return grp;
}

// ── Machine 3: Kompor Pemanas (industrial burner) ─────
function _buildKomporPemanas(scene, x, y, z) {
  const grp = new THREE.Group();
  grp.position.set(x, y, z);

  const ironMat   = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6, roughness: 0.5 });
  const brickMat  = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
  const hotMat    = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0xff3300, emissiveIntensity: 0.9 });
  const panMat    = new THREE.MeshStandardMaterial({ color: 0x707070, metalness: 0.8, roughness: 0.3 });

  // Brick furnace body
  const furnace = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2, 3), brickMat);
  furnace.position.y = 1.0;
  grp.add(furnace);

  // Iron grate top
  const grate = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.15, 3), ironMat);
  grate.position.y = 2.08;
  grp.add(grate);
  // Grate slots
  for (let gx = -1.4; gx <= 1.4; gx += 0.5) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 2.5), new THREE.MeshLambertMaterial({ color: 0x222222 }));
    slot.position.set(gx, 2.08, 0);
    grp.add(slot);
  }

  // Burner fire glow
  const fire1 = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.2, 14), hotMat);
  fire1.position.y = 2.9;
  grp.add(fire1);
  const fire2 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 14), hotMat.clone());
  fire2.position.set(0.6, 2.85, 0.4);
  grp.add(fire2);

  // Boiling pot on top
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.0, 1.4, 24), panMat);
  pot.position.y = 3.75;
  grp.add(pot);

  // Pot contents (liquid)
  const liquidMat = new THREE.MeshStandardMaterial({ color: 0x7c4a10, transparent: true, opacity: 0.85 });
  const liquid    = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, 0.8, 24), liquidMat);
  liquid.position.y = 3.85;
  grp.add(liquid);

  // Steam wisps
  const steamMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true, opacity: 0.25 });
  for (let s = 0; s < 3; s++) {
    const steam = new THREE.Mesh(new THREE.SphereGeometry(0.25 + s * 0.12, 12, 10), steamMat);
    steam.position.set((s - 1) * 0.4, 5.0 + s * 0.5, (s - 1) * 0.3);
    steam.userData.steamIndex = s;
    grp.add(steam);
  }

  // Pressure gauge
  const gaugeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.5 });
  const gauge    = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20), gaugeMat);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(1.5, 3.2, -1.4);
  grp.add(gauge);
  const gaugeFace = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  gaugeFace.rotation.x = -Math.PI / 2;
  gaugeFace.position.set(1.5, 3.21, -1.62);
  grp.add(gaugeFace);

  // Chimney (smoke outlet)
  const chimneyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
  const chimney    = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 3, 20), chimneyMat);
  chimney.position.set(-1.2, 3.5, -1.2);
  grp.add(chimney);

  // Smoke particles
  const smokeMat = new THREE.MeshStandardMaterial({ color: 0x888888, transparent: true, opacity: 0.2 });
  for (let sm = 0; sm < 4; sm++) {
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.18 + sm * 0.1, 12, 10), smokeMat);
    smoke.position.set(-1.2, 5.0 + sm * 0.6, -1.2);
    smoke.userData.smokeIndex = sm;
    grp.add(smoke);
  }

  _makeLabel(grp, 'KOMPOR\nPEMANAS', 0, 7.5, 0, 0xff8844);

  scene.add(grp);
  return grp;
}

// ── Factory details (barrels, piping, signs) ───────────
function _buildFactoryDetails(scene) {
  // Rows of molasses barrels
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x5a3010, metalness: 0.2, roughness: 0.8 });
  const bandMat   = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.4 });

  const barrelPositions = [
    [-28, 0, -16], [-28, 0, -12], [-28, 0, -8],
    [-24, 0, -16], [-24, 0, -12], [-24, 0, -8],
  ];
  for (const [bx, , bz] of barrelPositions) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.65, 1.5, 20), barrelMat);
    b.position.set(bx, 0.75, bz);
    scene.add(b);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 10, 28), bandMat);
    band.rotation.x = Math.PI / 2;
    band.position.set(bx, 1.2, bz);
    scene.add(band);
    const band2 = band.clone();
    band2.position.set(bx, 0.4, bz);
    scene.add(band2);
  }

  // "MOLASSES" sign
  _makeLabel3D(scene, 'MOLASSES\nSTORAGE', -26, 3.2, -12, 0xffaa22, 1.8);

  // NPK/Urea sacks
  const sackMat = new THREE.MeshLambertMaterial({ color: 0x5080c0 });
  const sackPositions = [
    [28, 0, -18], [28, 0, -15], [28, 0, -12],
  ];
  for (const [sx, , sz] of sackPositions) {
    const sack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), sackMat);
    sack.position.set(sx, 0.25, sz);
    scene.add(sack);
    const sack2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), sackMat);
    sack2.position.set(sx + 0.9, 0.25, sz);
    scene.add(sack2);
  }
  _makeLabel3D(scene, 'NPK / UREA', 29, 2.8, -15, 0x88aaff, 1.6);

  // Yeast canisters
  const canMat = new THREE.MeshStandardMaterial({ color: 0xccaa40, metalness: 0.5 });
  for (let ci = 0; ci < 3; ci++) {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 20), canMat);
    can.position.set(28, 0.45, -6 + ci * 1.2);
    scene.add(can);
  }
  _makeLabel3D(scene, 'RAGI\n(YEAST)', 29, 2.4, -5, 0xffdd80, 1.5);

  // Safety signs on wall
  _makeWarningSign(scene, -FAC_W / 2 + 0.8, 5, -10, '⚠️ BAHAYA\nGAS BERTEKANAN');
  _makeWarningSign(scene, -FAC_W / 2 + 0.8, 5,  10, '🔥 AREA\nPANAS');
  _makeWarningSign(scene,  FAC_W / 2 - 0.8, 5, -10, '☣️ LIMBAH\nVINASSE');

  // Process flow arrows on floor
  _buildProcessArrow(scene, -18, 0.05, 5,  0); // Fermentor → centre
  _buildProcessArrow(scene,  -9, 0.05, 3, -Math.PI / 4); // centre → Destilator
  _buildProcessArrow(scene,   9, 0.05, 3,  Math.PI / 4); // Destilator → Kompor

  // Overhead pipes connecting machines
  _buildOverheadPipes(scene);

  // Drip tray (vinasse collection) under destilator
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
  const tray    = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.15, 2.5), trayMat);
  tray.position.set(0, 0.08, -12);
  scene.add(tray);
  const vinasseLiquid = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.08, 2.3),
    new THREE.MeshStandardMaterial({ color: 0x3a1800, transparent: true, opacity: 0.9 })
  );
  vinasseLiquid.position.set(0, 0.12, -12);
  scene.add(vinasseLiquid);
}

// ── Overhead pipe network ──────────────────────────────
function _buildOverheadPipes(scene) {
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x9999aa, metalness: 0.6, roughness: 0.4 });

  // Fermentor to Destilator
  const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 22, 16), pipeMat);
  seg1.rotation.z = Math.PI / 2;
  seg1.position.set(-9, 11, 0);
  scene.add(seg1);

  // Destilator up
  const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 5, 16), pipeMat);
  seg2.position.set(0, 8.5, -12);
  scene.add(seg2);

  // Destilator to Kompor Pemanas
  const seg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 20, 16), pipeMat);
  seg3.rotation.z = Math.PI / 2;
  seg3.position.set(9, 11, 0);
  scene.add(seg3);

  // Vertical drops at machines
  for (const [px, pz] of [[-18, 6], [0, -12], [18, 6]]) {
    const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3, 16), pipeMat);
    drop.position.set(px, 9.5, pz);
    scene.add(drop);
  }
}

// ── Process flow arrow (flat on floor) ────────────────
function _buildProcessArrow(scene, x, y, z, rot) {
  const arrowMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
  const shaft    = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 5), arrowMat);
  shaft.position.set(x, y, z);
  shaft.rotation.y = rot;
  scene.add(shaft);

  const head = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 4), arrowMat);
  head.rotation.x = Math.PI / 2;
  head.rotation.z = rot;
  head.position.set(
    x + Math.sin(rot) * 3,
    y,
    z + Math.cos(rot) * -3
  );
  scene.add(head);
}

// ── Warning sign helper ────────────────────────────────
function _makeWarningSign(scene, x, y, z, text) {
  const signMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
  const sign    = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.06), signMat);
  sign.position.set(x, y, z);
  if (x < 0) sign.rotation.y = Math.PI / 2;
  else        sign.rotation.y = -Math.PI / 2;
  scene.add(sign);
  _makeLabel3D(scene, text, x, y, z, 0x222222, 1.2, sign.rotation.y);
}

// ─── Sprite-label helpers ─────────────────────────────
function _makeLabel(parent, text, x, y, z, color = 0xffffff) {
  const lines = text.split('\n');
  const canvas = document.createElement('canvas');
  canvas.width  = 256;
  canvas.height = 64 * lines.length;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const hex = '#' + color.toString(16).padStart(6, '0');
  ctx.fillStyle = hex;
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  lines.forEach((line, i) => {
    ctx.fillText(line, 128, 32 + i * 64);
  });

  const tex  = new THREE.CanvasTexture(canvas);
  const mat  = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.5, 1.0 * lines.length, 1);
  sprite.position.set(x, y, z);
  parent.add(sprite);
}

function _makeLabel3D(scene, text, x, y, z, color = 0xffffff, scale = 2, rotY = 0) {
  const lines = text.split('\n');
  const canvas = document.createElement('canvas');
  canvas.width  = 256;
  canvas.height = 64 * lines.length;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const hex = '#' + color.toString(16).padStart(6, '0');
  ctx.fillStyle = hex;
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => ctx.fillText(line, 128, 32 + i * 64));

  const tex    = new THREE.CanvasTexture(canvas);
  const mat    = new THREE.SpriteMaterial({ map: tex, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale * lines.length * 0.7 + 1, scale * 0.7 * lines.length * 0.5 + 0.5, 1);
  sprite.position.set(x, y, z);
  scene.add(sprite);
}

// ──────────────────────────────────────────────────────
// Animated question objects for factory stations
// ──────────────────────────────────────────────────────
export function createFactoryQuestionObjects(scene) {
  const objs = [];
  const positions = FACTORY_QUESTION_POSITIONS;

  const props = [
    { idx: 0, pos: positions[0], label: '❓ Stasiun 1',  color: 0xff8833 },
    { idx: 1, pos: positions[1], label: '❓ Stasiun 2',  color: 0x88ccff },
    { idx: 2, pos: positions[2], label: '❓ Stasiun 3',  color: 0xffdd44 },
  ];

  for (const p of props) {
    const grp = new THREE.Group();
    grp.position.copy(p.pos);

    // Floating glow orb
    const glowMat = new THREE.MeshStandardMaterial({
      color: p.color,
      emissive: p.color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75,
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), glowMat);
    orb.position.y = 4;
    grp.add(orb);

    // Halo ring
    const ringMat = new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.4 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.06, 12, 28), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 4;
    grp.add(ring);

    // "Done" checkmark (hidden initially)
    const doneMat = new THREE.SpriteMaterial({
      map: (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const cx = c.getContext('2d');
        cx.font = '48px serif';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillText('✅', 32, 32);
        return new THREE.CanvasTexture(c);
      })(),
      depthTest: false,
    });
    const doneSprite = new THREE.Sprite(doneMat);
    doneSprite.scale.set(1.5, 1.5, 1);
    doneSprite.position.y = 5.2;
    doneSprite.visible = false;
    grp.add(doneSprite);

    // Station label
    _makeLabel(grp, p.label, 0, 5.8, 0, p.color);

    scene.add(grp);
    objs.push({ group: grp, glowMat, idx: p.idx, pos: p.pos, done: false, doneSprite });
  }

  return objs;
}

export function animateFactoryObjects(objs, t) {
  for (const obj of objs) {
    if (obj.done) continue;

    const grp = obj.group;
    // Float orb
    const orb = grp.children[0];
    if (orb) orb.position.y = 4 + Math.sin(t * 2 + obj.idx * 1.5) * 0.25;

    // Spin ring
    const ring = grp.children[1];
    if (ring) ring.rotation.y = t * 0.8 + obj.idx * 2.1;

    // Pulse glow
    obj.glowMat.emissiveIntensity = 0.4 + Math.sin(t * 3 + obj.idx) * 0.3;
  }

  // Animate steam and smoke across the scene (parent scene)
  // Done via world2 animate pass – find all children tagged
}
