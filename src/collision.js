// ─────────────────────────────────────────────────────────────────────────────
// Collision system – axis-aligned bounding boxes (AABB) in the XZ plane.
// Each obstacle is { minX, maxX, minZ, maxZ }.
// The player is treated as a circle with PLAYER_RADIUS.
//
// resolveCollision(pos, desiredDx, desiredDz)
//   → returns { dx, dz } after pushing the player out of any overlapping box.
//   Axes are resolved independently so the player slides along surfaces.
// ─────────────────────────────────────────────────────────────────────────────

export const PLAYER_RADIUS = 0.65; // half-width of player collision circle

// Helper: build an AABB from centre + half-extents
function box(cx, cz, hw, hd) {
  return { minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd };
}

// ─── Lab room constants (must match world.js) ──────────
const LAB_W = 60;
const LAB_D = 40;

// ─── Factory room constants (must match world2.js) ────
const FAC_W = 70;
const FAC_D = 50;

// ─── Static obstacle list – Lab (Level 1) ─────────────
export const LAB_OBSTACLES = [

  // ── Room walls ──
  box(  0,           -(LAB_D/2),  LAB_W/2 + 2, 1.5 ),  // back wall
  box(  0,             LAB_D/2,   LAB_W/2 + 2, 1.5 ),  // front wall
  box( -(LAB_W/2),    0,          1.5,          LAB_D/2 + 2 ), // left wall
  box(   LAB_W/2,     0,          1.5,          LAB_D/2 + 2 ), // right wall

  // ── 3 central lab benches ──
  box( -16,  5,  3.6, 1.8 ),
  box(   0, -6,  3.6, 1.8 ),
  box(  16,  5,  3.6, 1.8 ),

  // ── Side benches ──
  box( -(LAB_W/2 - 2), 0,  2.0, 11.5 ),
  box(  (LAB_W/2 - 2), 0,  2.0, 11.5 ),

  // ── Fume hood ──
  box( -20, -(LAB_D/2 - 1.6),  3.5, 1.6 ),
];

// ─── Static obstacle list – Factory (Level 2) ─────────
export const FACTORY_OBSTACLES = [

  // ── Room walls ──
  box(  0,           -(FAC_D/2),  FAC_W/2 + 2, 1.5 ),  // back wall
  box(  0,             FAC_D/2,   FAC_W/2 + 2, 1.5 ),  // front wall
  box( -(FAC_W/2),    0,          1.5,          FAC_D/2 + 2 ), // left wall
  box(   FAC_W/2,     0,          1.5,          FAC_D/2 + 2 ), // right wall

  // ── Fermentor drum (cylinder r=2, centre at -18, 6) ──
  box( -18, 6,  2.8, 2.8 ),

  // ── Destilator column (cylinder r=1, centre at 0, -12) ──
  box(   0, -12, 2.0, 2.5 ),

  // ── Kompor Pemanas (box 3.5×3, centre at 18, 6) ──
  box( 18,  6,  2.5, 2.5 ),

  // ── Molasses barrel area ──
  box( -26, -12, 4.0, 6.0 ),

  // ── NPK/Ragi storage area ──
  box(  28, -13, 3.0, 6.0 ),
];

// ─── Static obstacle list – Pond (Level 3) ────────────
// Matches world3.js: POND_W=60, POND_D=50, pond reactor at centre, valve at (0,0,-10)
const POND_W3 = 60;
const POND_D3 = 50;

export const POND_OBSTACLES = [

  // ── Area boundary fences ──
  box(  0,           -(POND_D3/2),  POND_W3/2 + 2, 1.5 ),  // north fence
  box(  0,             POND_D3/2,   POND_W3/2 + 2, 1.5 ),  // south fence
  box( -(POND_W3/2),   0,           1.5,            POND_D3/2 + 2 ),  // west fence
  box(   POND_W3/2,    0,           1.5,            POND_D3/2 + 2 ),  // east fence

  // ── Pond reactor (22×16 pool, walls ~0.6 thick) ──
  box(  0,  -8,  11.6, 0.8 ),  // north wall of pond
  box(  0,   8,  11.6, 0.8 ),  // south wall of pond
  box(-11,   0,  0.8,   8.6 ),  // west wall of pond
  box( 11,   0,  0.8,   8.6 ),  // east wall of pond

  // ── Valve stand (at 0, 0, -10) ──
  box(  0, -10,  0.8, 0.8 ),
];

// Active obstacle set – switched at level transition
export let OBSTACLES = LAB_OBSTACLES;

export function setFactoryObstacles() {
  OBSTACLES = FACTORY_OBSTACLES;
}

export function setPondObstacles() {
  OBSTACLES = POND_OBSTACLES;
}

export function setLabObstacles() {
  OBSTACLES = LAB_OBSTACLES;
}

// ─── Static obstacle list – Workshop (Level 4) ────────
// WORKSHOP_W=56, WORKSHOP_D=44, terminal at (0, 0, -14)
const WORKSHOP_W4 = 56;
const WORKSHOP_D4 = 44;

export const WORKSHOP_OBSTACLES = [
  // Room walls
  box(  0,               -(WORKSHOP_D4/2),  WORKSHOP_W4/2 + 2, 1.5 ),
  box(  0,                (WORKSHOP_D4/2),  WORKSHOP_W4/2 + 2, 1.5 ),
  box( -(WORKSHOP_W4/2),  0,                1.5, WORKSHOP_D4/2 + 2 ),
  box(  (WORKSHOP_W4/2),  0,                1.5, WORKSHOP_D4/2 + 2 ),
  // 3 work benches (z ≈ 2)
  box( -16, 2,  4.5, 2.0 ),
  box(   0, 2,  4.5, 2.0 ),
  box(  16, 2,  4.5, 2.0 ),
  // Terminal pedestal at (0, 0, -14)
  box(  0, -14,  1.4, 1.4 ),
  // Equipment shelves on back wall
  box( -18, -(WORKSHOP_D4/2 - 0.5),  4.5, 0.8 ),
  box(   0, -(WORKSHOP_D4/2 - 0.5),  4.5, 0.8 ),
  box(  18, -(WORKSHOP_D4/2 - 0.5),  4.5, 0.8 ),
  // Cabinets right wall
  box( (WORKSHOP_W4/2 - 1.5), -10,  1.5, 1.5 ),
  box( (WORKSHOP_W4/2 - 1.5),  10,  1.5, 1.5 ),
];

// ─── Static obstacle list – Observation Lab (Level 5) ─
// OBSLAB_W=52, OBSLAB_D=40, microscope at (~0.8, 0, -12)
const OBSLAB_W5 = 52;
const OBSLAB_D5 = 40;

export const OBSLAB_OBSTACLES = [
  // Room walls
  box(  0,              -(OBSLAB_D5/2),  OBSLAB_W5/2 + 2, 1.5 ),
  box(  0,               (OBSLAB_D5/2),  OBSLAB_W5/2 + 2, 1.5 ),
  box( -(OBSLAB_W5/2),   0,              1.5, OBSLAB_D5/2 + 2 ),
  box(  (OBSLAB_W5/2),   0,              1.5, OBSLAB_D5/2 + 2 ),
  // 3 analysis benches (z ≈ 6)
  box( -14, 6,  4.0, 2.0 ),
  box(   0, 6,  4.0, 2.0 ),
  box(  14, 6,  4.0, 2.0 ),
  // Microscope stand at (0.8, 0, -12)
  box(  0.8, -12,  1.8, 1.8 ),
  // Storage cabinets right wall
  box( (OBSLAB_W5/2 - 1.0), -12,  1.5, 1.5 ),
  box( (OBSLAB_W5/2 - 1.0),   0,  1.5, 1.5 ),
  box( (OBSLAB_W5/2 - 1.0),  12,  1.5, 1.5 ),
];

// ─── Static obstacle list – Classroom (Level 6) ───────
// HALL_W=60, HALL_D=48, podium at (0, 0, -16)
const HALL_W6 = 60;
const HALL_D6 = 48;

export const CLASSROOM_OBSTACLES = [
  // Room walls
  box(  0,            -(HALL_D6/2),  HALL_W6/2 + 2, 1.5 ),
  box(  0,             (HALL_D6/2),  HALL_W6/2 + 2, 1.5 ),
  box( -(HALL_W6/2),   0,            1.5, HALL_D6/2 + 2 ),
  box(  (HALL_W6/2),   0,            1.5, HALL_D6/2 + 2 ),
  // Desk rows (5 rows × approx width)
  box(  0, 4,   16, 1.5 ),
  box(  0, 9,   16, 1.5 ),
  box(  0, 14,  16, 1.5 ),
  box(  0, 19,  16, 1.5 ),
  box(  0, 24,  16, 1.5 ),
  // Podium at (0, 0, -16)
  box(  0, -16,  1.8, 1.0 ),
  // Projection screen area (back wall shelf)
  box(  0, -(HALL_D6/2 - 0.5),  HALL_W6/2 + 1, 0.5 ),
  // Plants at stage
  box( -18, -(HALL_D6/2 - 3),  1.2, 1.2 ),
  box(  18, -(HALL_D6/2 - 3),  1.2, 1.2 ),
];

export function setWorkshopObstacles() {
  OBSTACLES = WORKSHOP_OBSTACLES;
}

export function setObsLabObstacles() {
  OBSTACLES = OBSLAB_OBSTACLES;
}

export function setClassroomObstacles() {
  OBSTACLES = CLASSROOM_OBSTACLES;
}

// ─────────────────────────────────────────────────────────────────────────────
// resolveCollision
//   pos     – THREE.Vector3 (current position, will be mutated)
//   dx, dz  – desired movement this frame
// Returns the (possibly clipped) { dx, dz } to apply.
// ─────────────────────────────────────────────────────────────────────────────
export function resolveCollision(pos, dx, dz) {
  const R = PLAYER_RADIUS;

  // ── Try X movement first ──────────────────────────────
  let nx = pos.x + dx;
  for (const o of OBSTACLES) {
    if (nx + R > o.minX && nx - R < o.maxX &&
        pos.z + R > o.minZ && pos.z - R < o.maxZ) {
      // Push out on X
      if (dx > 0) nx = o.minX - R;
      else         nx = o.maxX + R;
      dx = nx - pos.x;
    }
  }

  // ── Then Z movement ───────────────────────────────────
  let nz = pos.z + dz;
  for (const o of OBSTACLES) {
    if (nx + R > o.minX && nx - R < o.maxX &&
        nz + R > o.minZ && nz - R < o.maxZ) {
      // Push out on Z
      if (dz > 0) nz = o.minZ - R;
      else         nz = o.maxZ + R;
      dz = nz - pos.z;
    }
  }

  return { dx, dz };
}
