import * as THREE from 'three';

// ── Remediation Pond dimensions ──────────────────────────
export const POND_W = 60;   // width  (X)
export const POND_D = 50;   // depth  (Z)
const POND_H = 14;          // ceiling height

// ── Valve position (interactive) ─────────────────────────
export const VALVE_POS = new THREE.Vector3(0, 0, -10);

// ─────────────────────────────────────────────────────────
export function createPondScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);   // sunny-day sky blue
  scene.fog = new THREE.FogExp2(0xb0d8f0, 0.008);

  // Hemisphere light – sky blue top, warm ground bounce
  scene.add(new THREE.HemisphereLight(0x9ed4f8, 0x7a9a50, 1.1));

  // Overhead sun (high noon – bright warm white)
  const sun = new THREE.DirectionalLight(0xfff5cc, 2.4);
  sun.position.set(25, 40, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 140;
  sun.shadow.camera.left   = -44;
  sun.shadow.camera.right  =  44;
  sun.shadow.camera.top    =  44;
  sun.shadow.camera.bottom = -44;
  scene.add(sun);

  // Soft sky-blue fill from opposite side
  const skyFill = new THREE.DirectionalLight(0xb8d8ff, 0.6);
  skyFill.position.set(-20, 18, -15);
  scene.add(skyFill);

  // Subtle warm fill near pond surface
  const pondGlow = new THREE.PointLight(0xffe090, 0.8, 35);
  pondGlow.position.set(0, 5, 0);
  scene.add(pondGlow);

  // Small lamp near valve
  const valveLamp = new THREE.PointLight(0xffee99, 1.0, 18);
  valveLamp.position.set(VALVE_POS.x, 8, VALVE_POS.z);
  scene.add(valveLamp);

  return { scene };
}

// ─────────────────────────────────────────────────────────
export function buildPond(scene) {
  _buildGround(scene);
  _buildFences(scene);
  _buildPondReactor(scene);
  _buildPipeline(scene);
  _buildValve(scene);
  _buildVegetation(scene);
  _buildSky(scene);
}

// ── Ground plane ──────────────────────────────────────────
function _buildGround(scene) {
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x1c3a10 });
  const soil     = new THREE.MeshLambertMaterial({ color: 0x2a1e0a });

  // Main ground
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(POND_W * 2, POND_D * 2), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Dirt path connecting valve to reactor
  const pathMat = new THREE.MeshLambertMaterial({ color: 0x4a3820 });
  const path = new THREE.Mesh(new THREE.PlaneGeometry(3, 22), pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, 0);
  scene.add(path);
}

// ── Boundary fences ───────────────────────────────────────
function _buildFences(scene) {
  const postMat  = new THREE.MeshLambertMaterial({ color: 0x7a5530 });
  const wireMat  = new THREE.LineBasicMaterial({ color: 0x4a6040 });

  const HW = POND_W / 2;
  const HD = POND_D / 2;

  const corners = [
    [-HW, -HD], [HW, -HD], [HW, HD], [-HW, HD], [-HW, -HD],
  ];

  // Wire fence line
  const pts = corners.map(([x, z]) => new THREE.Vector3(x, 1.2, z));
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  scene.add(new THREE.Line(g, wireMat));

  // Fence posts every 8 units
  for (let side = 0; side < 4; side++) {
    const [ax, az] = corners[side];
    const [bx, bz] = corners[side + 1];
    const steps = Math.ceil(Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2) / 8);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 2.4, 5),
        postMat
      );
      post.position.set(ax + (bx - ax) * t, 1.2, az + (bz - az) * t);
      scene.add(post);
    }
  }
}

// ── Bioremediasi reactor (large open pond + containment) ─
function _buildPondReactor(scene) {
  const wallMat     = new THREE.MeshLambertMaterial({ color: 0x3a3830 });
  const innerMat    = new THREE.MeshLambertMaterial({ color: 0x2a2818 });
  const vinasseMat  = new THREE.MeshLambertMaterial({
    color: 0x180800, transparent: true, opacity: 0.92
  });
  const cleanMat    = new THREE.MeshLambertMaterial({
    color: 0x0a3010, transparent: true, opacity: 0.85
  });

  // ── Outer containment walls ──
  const wt = 0.6;   // wall thickness
  const pw = 22;    // pond width
  const pd = 16;    // pond depth (Z)
  const ph = 1.5;   // wall height

  // North wall
  const wN = new THREE.Mesh(new THREE.BoxGeometry(pw + wt * 2, ph, wt), wallMat);
  wN.position.set(0, ph / 2, -(pd / 2));
  scene.add(wN);
  // South wall
  const wS = wN.clone();
  wS.position.set(0, ph / 2, pd / 2);
  scene.add(wS);
  // East wall
  const wE = new THREE.Mesh(new THREE.BoxGeometry(wt, ph, pd), wallMat);
  wE.position.set(pw / 2, ph / 2, 0);
  scene.add(wE);
  // West wall
  const wW = wE.clone();
  wW.position.set(-pw / 2, ph / 2, 0);
  scene.add(wW);

  // Floor of pond (lower than ground)
  const pondFloor = new THREE.Mesh(new THREE.PlaneGeometry(pw, pd), innerMat);
  pondFloor.rotation.x = -Math.PI / 2;
  pondFloor.position.y = 0.01;
  scene.add(pondFloor);

  // Vinasse liquid surface (dark)
  const liquidSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(pw - wt * 2, pd - wt * 2),
    vinasseMat
  );
  liquidSurface.rotation.x = -Math.PI / 2;
  liquidSurface.position.y = 0.8;
  scene.add(liquidSurface);

  // ── Divider (separating dirty → clean zone) ──
  const divider = new THREE.Mesh(new THREE.BoxGeometry(wt, ph, pd), wallMat);
  divider.position.set(4, ph / 2, 0);
  scene.add(divider);

  // Clean effluent section (right side)
  const cleanSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(pw / 2 - 4 - wt * 1.5, pd - wt * 2),
    cleanMat
  );
  cleanSurface.rotation.x = -Math.PI / 2;
  cleanSurface.position.set(pw / 2 - (pw / 4 - 2 + wt * 0.5) - 1.5, 0.8, 0);
  scene.add(cleanSurface);

  // ── Pond label sign ──
  _makeLabelPost(scene, 'REAKTOR\nBIOREMEDIASI', 0, 2.5, -pd / 2 - 1.2, 0x40ff80);
}

// ── Pipeline from valve to pond ───────────────────────────
function _buildPipeline(scene) {
  const pipeMat  = new THREE.MeshLambertMaterial({ color: 0x507060 });
  const bracketM = new THREE.MeshLambertMaterial({ color: 0x304030 });

  // Horizontal pipe running along Z axis
  const pipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 14, 20),
    pipeMat
  );
  pipe.rotation.x = Math.PI / 2;
  pipe.position.set(-1.2, 1.8, -3);   // slightly left of centre
  scene.add(pipe);

  // Elbow turn (cosmetic box at pond wall)
  const elbow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), pipeMat);
  elbow.position.set(-1.2, 1.8, -8);
  scene.add(elbow);

  // Vertical drop into pond
  const dropPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 2.0, 20),
    pipeMat
  );
  dropPipe.position.set(-1.2, 0.8, -8.2);
  scene.add(dropPipe);

  // Pipe brackets
  for (const z of [-2, -5, -8]) {
    const bkt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.15), bracketM);
    bkt.position.set(-0.7, 2.1, z);
    scene.add(bkt);
  }
}

// ── Valve assembly (interactable prop) ────────────────────
function _buildValve(scene) {
  const bodyMat   = new THREE.MeshLambertMaterial({ color: 0x8a3010 });
  const wheelMat  = new THREE.MeshLambertMaterial({ color: 0xcc4a20 });
  const standMat  = new THREE.MeshLambertMaterial({ color: 0x303830 });

  const vx = VALVE_POS.x;
  const vz = VALVE_POS.z;

  // Stand pole
  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 3.5, 16),
    standMat
  );
  stand.position.set(vx, 1.75, vz);
  scene.add(stand);

  // Valve body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.0, 0.8, 1.2),
    bodyMat
  );
  body.position.set(vx, 3.5, vz);
  scene.add(body);

  // Wheel (handwheel shape — flat torus)
  const wheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.1, 12, 32),
    wheelMat
  );
  wheel.position.set(vx, 3.5, vz - 0.7);
  wheel.rotation.x = Math.PI / 2;
  scene.add(wheel);

  // Wheel spokes
  for (let i = 0; i < 4; i++) {
    const spoke = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.0, 14),
      wheelMat
    );
    spoke.rotation.z = (i / 4) * Math.PI;
    spoke.position.set(vx, 3.5, vz - 0.7);
    scene.add(spoke);
  }

  // Label
  _makeLabelPost(scene, 'KRAN\nVINASSE', vx, 5.5, vz, 0xffa060);
}

// ── Vegetation (decorative plants & algae mats) ──────────
function _buildVegetation(scene) {
  const fernMat   = new THREE.MeshLambertMaterial({ color: 0x1a6020 });
  const azollaMat = new THREE.MeshLambertMaterial({
    color: 0x2a8040, transparent: true, opacity: 0.80
  });

  // Azolla floating mats on the clean side of the pond
  const matPositions = [
    [-7, -4], [-8, 0], [-7, 3], [-9, -2],
  ];
  for (const [x, z] of matPositions) {
    const mat = new THREE.Mesh(
      new THREE.PlaneGeometry(2 + Math.random() * 1.5, 1.2 + Math.random()),
      azollaMat
    );
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(x, 0.85, z);
    scene.add(mat);
  }

  // Ferns around the perimeter
  const fernPositions = [
    [-24, -18], [-20, 18], [22, -14], [26, 8],
    [-28, 4],  [16, 20],  [-12, -20], [18, -20],
  ];
  for (const [x, z] of fernPositions) {
    _makeFern(scene, x, z, fernMat);
  }

  // Bamboo fence decoration
  const bamMat = new THREE.MeshLambertMaterial({ color: 0x8ab040 });
  for (let i = -3; i <= 3; i++) {
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 3.5 + Math.random(), 6),
      bamMat
    );
    stalk.position.set(-28 + i * 0.4, 1.75, -22 + Math.random() * 2);
    scene.add(stalk);
  }
}

function _makeFern(scene, x, z, mat) {
  const h = 0.6 + Math.random() * 0.5;
  const base = new THREE.Mesh(
    new THREE.ConeGeometry(0.6 + Math.random() * 0.3, h, 6),
    mat
  );
  base.position.set(x, h / 2, z);
  scene.add(base);
}

// ── Sky dome ─────────────────────────────────────────────
function _buildSky(scene) {
  // Sunny-day sky dome
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x6ab4e8, side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 20, 14), skyMat);
  scene.add(sky);

  // Sun disc — positioned in the -Z half (where player faces when approaching valve)
  // and +Z half (visible at spawn). Primary sun toward -Z.
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffde0, side: THREE.DoubleSide });
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(8, 24), sunMat);
  sunDisc.position.set(30, 22, -88);
  sunDisc.lookAt(0, 14, 0); // face toward camera eye height
  scene.add(sunDisc);

  // Sun halo (slightly larger, more transparent)
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xfff5a0, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const halo = new THREE.Mesh(new THREE.CircleGeometry(13, 24), haloMat);
  halo.position.copy(sunDisc.position);
  halo.rotation.copy(sunDisc.rotation);
  scene.add(halo);

  // Cloud puffs — spread across both front and rear sky, at low elevation (y≈20-24)
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xfafafa, transparent: true, opacity: 0.88, side: THREE.DoubleSide });
  [
    // in front of valve side (-Z)
    [  0, 22, -85, 1.1],
    [-35, 20, -78, 0.9],
    [ 50, 21, -80, 1.0],
    // spawn-side (+Z)
    [-30, 22,  85, 1.0],
    [ 35, 20,  80, 0.85],
    // side views
    [-90, 21,  10, 0.9],
    [ 90, 20, -5,  0.8],
  ].forEach(([cx, cy, cz, s]) => {
    const normal = new THREE.Vector3(cx, cy, cz).normalize();
    [-1, 0, 1].forEach(ox => {
      const right = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0,1,0)).normalize();
      const offset = right.clone().multiplyScalar(ox * 7 * s);
      const c = new THREE.Mesh(new THREE.SphereGeometry(5 * s, 8, 6), cloudMat);
      c.position.set(cx + offset.x, cy + (ox === 0 ? 2 * s : 0), cz + offset.z);
      scene.add(c);
    });
  });
}

// ── Valve interactable object (same shape as world.js questionObjects) ────────
export function createValveObject(scene) {
  // Glow ring above the valve
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff8020, transparent: true, opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const glowMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.25, 10, 32),
    glowMat
  );
  glowMesh.position.set(VALVE_POS.x, 5.5, VALVE_POS.z);
  glowMesh.rotation.x = Math.PI / 2;
  scene.add(glowMesh);

  // ✔ done sprite (hidden until activated)
  const spriteMat = new THREE.SpriteMaterial({ color: 0x2ecc71 });
  const doneSprite = new THREE.Sprite(spriteMat);
  doneSprite.scale.set(1.5, 1.5, 1.5);
  doneSprite.position.set(VALVE_POS.x, 7, VALVE_POS.z);
  doneSprite.visible = false;
  scene.add(doneSprite);

  return {
    idx: 0,
    pos: { x: VALVE_POS.x, z: VALVE_POS.z },
    done: false,
    glowMat,
    glowMesh,
    doneSprite,
    isValve: true,
  };
}

// ── Animate valve glow ─────────────────────────────────────
export function animateValveObject(valveObj, t) {
  if (!valveObj || valveObj.done) return;
  valveObj.glowMat.opacity   = 0.4 + 0.35 * Math.sin(t * 3.5);
  valveObj.glowMesh.rotation.z = t * 1.2;
}

// ── Helper: floating label text (using a flat 3D box for now) ─────────────────
function _makeLabelPost(scene, _text, x, y, z, colour) {
  // Small colour-coded cube as a sign placeholder (canvas texture avoided for bundle size)
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.8, 0.1),
    new THREE.MeshBasicMaterial({ color: colour })
  );
  sign.position.set(x, y, z);
  scene.add(sign);
}
