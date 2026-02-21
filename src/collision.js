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

// ─── Static obstacle list ──────────────────────────────
// All measurements taken directly from world.js geometry positions.
export const OBSTACLES = [

  // ── Room walls (thick slabs so the player can't squeeze through) ──
  //    Each wall is pushed 1 unit into the room so there's no gap.
  box(  0,           -(LAB_D/2),  LAB_W/2 + 2, 1.5 ),  // back wall
  box(  0,             LAB_D/2,   LAB_W/2 + 2, 1.5 ),  // front wall
  box( -(LAB_W/2),    0,          1.5,          LAB_D/2 + 2 ), // left wall
  box(   LAB_W/2,     0,          1.5,          LAB_D/2 + 2 ), // right wall

  // ── 3 central lab benches  (BoxGeometry 7 × 3, positioned in world.js) ──
  box( -16,  5,  3.6, 1.8 ),  // left bench
  box(   0, -6,  3.6, 1.8 ),  // centre bench
  box(  16,  5,  3.6, 1.8 ),  // right bench

  // ── Side bench left wall  (3 × 22, centre at x = -28, z = 0) ──
  box( -(LAB_W/2 - 2), 0,  2.0, 11.5 ),

  // ── Side bench right wall  (3 × 22, centre at x = 28, z = 0) ──
  box(  (LAB_W/2 - 2), 0,  2.0, 11.5 ),

  // ── Fume hood  (6.2 × 2.8 base, centre at x = -20, z = -18) ──
  box( -20, -(LAB_D/2 - 1.6),  3.5, 1.6 ),
];

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
