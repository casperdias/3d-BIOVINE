import * as THREE from 'three';

// ── Classroom / Presentation hall dimensions ─────────────
export const HALL_W = 60;
export const HALL_D = 48;

// ── Interactive podium position ───────────────────────────
export const PODIUM_POS = new THREE.Vector3(0, 0, -16);

// ─────────────────────────────────────────────────────────
export function createClassroomScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c2848);   // bright classroom hall blue
  scene.fog = new THREE.FogExp2(0x182040, 0.010);

  scene.add(new THREE.AmbientLight(0xb0b8d0, 1.0));

  // Stage spotlight — brighter
  const spot = new THREE.SpotLight(0xfff8d0, 3.5, 55, Math.PI / 5, 0.35, 1.2);
  spot.position.set(0, 22, -10);
  spot.target.position.set(0, 0, -16);
  spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048);
  scene.add(spot);
  scene.add(spot.target);

  // Overhead fill — brighter
  const fill = new THREE.DirectionalLight(0x90a8d8, 1.0);
  fill.position.set(0, 20, 8);
  fill.castShadow = false;
  scene.add(fill);

  // Screen glow (back wall)
  const screenGlow = new THREE.PointLight(0x4060e0, 2.0, 36);
  screenGlow.position.set(0, 6, -22);
  scene.add(screenGlow);

  // Warm audience fill — brighter
  const audFill = new THREE.PointLight(0xd0b870, 1.2, 40);
  audFill.position.set(0, 4, 8);
  scene.add(audFill);

  return { scene };
}

// ─────────────────────────────────────────────────────────
export function buildClassroom(scene) {
  _buildRoom(scene);
  _buildSeatingArea(scene);
  _buildStage(scene);
  _buildProjectionScreen(scene);
  _buildPodium(scene);
  _buildDecoration(scene);
}

// ── Room shell ────────────────────────────────────────────
function _buildRoom(scene) {
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x18283a, roughness: 0.8 });
  const wallMat  = new THREE.MeshStandardMaterial({ color: 0x1a2a3c, roughness: 0.9 });
  const ceilMat  = new THREE.MeshStandardMaterial({ color: 0x0e1828, roughness: 1.0 });
  const stageMat = new THREE.MeshStandardMaterial({ color: 0x1e3040, roughness: 0.7 });

  const HW = HALL_W / 2;
  const HD = HALL_D / 2;
  const H  = 12;

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, HALL_D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W, HALL_D), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  scene.add(ceil);

  const wallConfigs = [
    { pos: [0, H/2, -HD], rot: [0, 0, 0],          size: [HALL_W, H] },
    { pos: [0, H/2,  HD], rot: [0, Math.PI, 0],    size: [HALL_W, H] },
    { pos: [-HW, H/2, 0], rot: [0,  Math.PI/2, 0], size: [HALL_D, H] },
    { pos: [ HW, H/2, 0], rot: [0, -Math.PI/2, 0], size: [HALL_D, H] },
  ];
  for (const w of wallConfigs) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...w.size), wallMat);
    mesh.position.set(...w.pos);
    mesh.rotation.set(...w.rot);
    scene.add(mesh);
  }

  // Raised stage platform
  const stagePlatform = new THREE.Mesh(new THREE.BoxGeometry(HALL_W, 0.4, 16), stageMat);
  stagePlatform.position.set(0, 0.2, -HD + 8);
  stagePlatform.receiveShadow = true;
  scene.add(stagePlatform);

  // Carpet on stage (different tone)
  const carpetMat = new THREE.MeshStandardMaterial({ color: 0x1a3050, roughness: 1.0 });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(HALL_W - 4, 14), carpetMat);
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.41, -HD + 8);
  scene.add(carpet);
}

// ── Audience seating ──────────────────────────────────────
function _buildSeatingArea(scene) {
  const deskMat  = new THREE.MeshStandardMaterial({ color: 0x263646, roughness: 0.7 });
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x1c2c3c, roughness: 0.8 });
  const HD = HALL_D / 2;

  const rows = 5;
  const cols = 7;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = -12 + col * 4;
      const z = 4 + row * 5;

      // Desk
      const desk = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 1.4), deskMat);
      desk.position.set(x, 2.1, z);
      desk.castShadow = true;
      scene.add(desk);

      // Chair seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.0), chairMat);
      seat.position.set(x, 1.5, z + 1.2);
      scene.add(seat);

      // Chair back
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 0.1), chairMat);
      back.position.set(x, 2.0, z + 1.65);
      scene.add(back);

      // Desk legs
      for (const [lx, lz] of [[-1.4, -0.5], [1.4, -0.5], [-1.4, 0.5], [1.4, 0.5]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.1, 0.1), chairMat);
        leg.position.set(x + lx, 1.05, z + lz);
        scene.add(leg);
      }
    }
  }
}

// ── Stage area ────────────────────────────────────────────
function _buildStage(scene) {
  // Stage edge trim
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x3a5070, roughness: 0.6, metalness: 0.2 });
  const HD = HALL_D / 2;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(HALL_W, 0.15, 0.2), trimMat);
  trim.position.set(0, 0.47, -HD + 16.1);
  scene.add(trim);

  // Floor spotlights (decorative circles)
  const spotMat = new THREE.MeshBasicMaterial({ color: 0xfff080, transparent: true, opacity: 0.5 });
  for (const x of [-8, 0, 8]) {
    const sp = new THREE.Mesh(new THREE.CircleGeometry(1.0, 16), spotMat);
    sp.rotation.x = -Math.PI / 2;
    sp.position.set(x, 0.42, -HD + 10);
    scene.add(sp);
  }
}

// ── Projection screen ─────────────────────────────────────
function _buildProjectionScreen(scene) {
  const HD = HALL_D / 2;
  const frameMat  = new THREE.MeshStandardMaterial({ color: 0x1a2a40, roughness: 0.7, metalness: 0.2 });
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0a1840, roughness: 0.1,
    emissive: new THREE.Color(0x040820), emissiveIntensity: 0.8,
  });

  // Frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(22, 12, 0.15), frameMat);
  frame.position.set(0, 7, -HD + 0.2);
  scene.add(frame);

  // Screen surface
  const screen = new THREE.Mesh(new THREE.BoxGeometry(21, 11.5, 0.08), screenMat);
  screen.position.set(0, 7, -HD + 0.28);
  scene.add(screen);

  // BIOVINE logo bars on screen (decorative)
  const logMat = new THREE.MeshBasicMaterial({ color: 0x40ccff });
  for (let i = 0; i < 5; i++) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(12 + i * 1.5, 0.3, 0.06), logMat);
    bar.position.set(0, 9.5 - i * 1.2, -HD + 0.34);
    scene.add(bar);
  }

  // Green accent (POC product highlight)
  const pocMat = new THREE.MeshBasicMaterial({ color: 0x40ff80 });
  const pocBar = new THREE.Mesh(new THREE.BoxGeometry(8, 1.5, 0.06), pocMat);
  pocBar.position.set(0, 4.5, -HD + 0.34);
  scene.add(pocBar);
}

// ── Podium (interactive) ──────────────────────────────────
function _buildPodium(scene) {
  const podMat    = new THREE.MeshStandardMaterial({ color: 0x1e3852, roughness: 0.5, metalness: 0.3 });
  const topMat    = new THREE.MeshStandardMaterial({ color: 0x2a4870, roughness: 0.4, metalness: 0.4 });
  const accentMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
  const micMat    = new THREE.MeshStandardMaterial({ color: 0x404840, roughness: 0.4, metalness: 0.7 });

  const px = PODIUM_POS.x;
  const pz = PODIUM_POS.z;

  // Podium body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.5, 1.4), podMat);
  body.position.set(px, 1.75, pz);
  body.castShadow = true;
  scene.add(body);

  // Angled reading surface
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 1.2), topMat);
  top.position.set(px, 3.55, pz);
  top.rotation.x = -0.25;
  scene.add(top);

  // Front accent line
  const accent = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.06), accentMat);
  accent.position.set(px, 2.5, pz - 0.72);
  scene.add(accent);

  // Microphone stand
  const micStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), micMat
  );
  micStand.position.set(px - 0.4, 4.2, pz);
  micStand.rotation.z = 0.25;
  scene.add(micStand);

  // Mic head
  const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), micMat);
  micHead.position.set(px - 0.7, 4.7, pz);
  scene.add(micHead);

  // POC bottle on podium (product display)
  const bottleMat = new THREE.MeshStandardMaterial({ color: 0x1a5a40, roughness: 0.4, metalness: 0.1 });
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.8, 12), bottleMat);
  bottle.position.set(px + 0.6, 3.97, pz);
  scene.add(bottle);

  // Bottle cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 10),
    new THREE.MeshStandardMaterial({ color: 0x40a060, roughness: 0.5 }));
  cap.position.set(px + 0.6, 4.42, pz);
  scene.add(cap);

  // Label on podium
  const lblMat = new THREE.MeshBasicMaterial({ color: 0x40ffaa });
  const lbl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.06), lblMat);
  lbl.position.set(px, 1.5, pz - 0.73);
  scene.add(lbl);
}

// ── Classroom decorations ─────────────────────────────────
function _buildDecoration(scene) {
  const HW = HALL_W / 2;
  const HD = HALL_D / 2;

  // Curtain side pillars
  const curtainMat = new THREE.MeshStandardMaterial({ color: 0x1a2840, roughness: 1.0 });
  for (const x of [-HW + 1.5, HW - 1.5]) {
    const curtain = new THREE.Mesh(new THREE.BoxGeometry(2.0, 10, 0.2), curtainMat);
    curtain.position.set(x, 5, -HD + 4);
    scene.add(curtain);
  }

  // Award trophies shelf (back corner)
  const trophyMat = new THREE.MeshStandardMaterial({ color: 0xc0a020, roughness: 0.4, metalness: 0.8 });
  const shelfMat  = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.8 });
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 0.8), shelfMat);
  shelf.position.set(-HW + 3.5, 5, -HD + 1);
  scene.add(shelf);
  for (let i = 0; i < 3; i++) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 0.3, 10), trophyMat);
    base.position.set(-HW + 1.5 + i * 2, 5.2, -HD + 1);
    scene.add(base);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.15, 0.6, 10), trophyMat);
    cup.position.set(-HW + 1.5 + i * 2, 5.7, -HD + 1);
    scene.add(cup);
  }

  // Plants at stage corners
  const potMat  = new THREE.MeshStandardMaterial({ color: 0x6a4020, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x1a7030, roughness: 1.0 });
  for (const x of [-18, 18]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.8, 12), potMat);
    pot.position.set(x, 0.4, -HD + 3);
    scene.add(pot);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 10), leafMat);
    leaf.position.set(x, 1.7, -HD + 3);
    scene.add(leaf);
  }
}

// ── Podium interactive object ─────────────────────────────
export function createPodiumObject(scene) {
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00, transparent: true, opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const glowMesh = new THREE.Mesh(
    new THREE.TorusGeometry(1.2, 0.22, 10, 32),
    glowMat
  );
  glowMesh.position.set(PODIUM_POS.x, 6.0, PODIUM_POS.z);
  glowMesh.rotation.x = Math.PI / 2;
  scene.add(glowMesh);

  const spriteMat = new THREE.SpriteMaterial({ color: 0x2ecc71 });
  const doneSprite = new THREE.Sprite(spriteMat);
  doneSprite.scale.set(1.5, 1.5, 1.5);
  doneSprite.position.set(PODIUM_POS.x, 7.2, PODIUM_POS.z);
  doneSprite.visible = false;
  scene.add(doneSprite);

  return {
    idx: 0,
    pos: { x: PODIUM_POS.x, z: PODIUM_POS.z },
    done: false,
    glowMat,
    glowMesh,
    doneSprite,
    isPodium: true,
  };
}

export function animatePodiumObject(obj, t) {
  if (!obj || obj.done) return;
  obj.glowMat.opacity = 0.4 + 0.3 * Math.sin(t * 3.2);
  obj.glowMesh.rotation.z = t * 1.0;
}
