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

// Active obstacle set – switched at level transition
export let OBSTACLES = LAB_OBSTACLES;

export function setFactoryObstacles() {
  OBSTACLES = FACTORY_OBSTACLES;
}

export function setLabObstacles() {
  OBSTACLES = LAB_OBSTACLES;
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
