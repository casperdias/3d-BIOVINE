# 3d-BIOVINE Project Guidelines

## Project Overview

An interactive 3D educational game built with **Three.js + Vite** about vinasse waste pollution and environmental remediation in Indonesia (Bekonang region). Players complete 6 stages to learn about COD/BOD/pH water quality parameters, Azolla-based bioremediation, and IPAL reactor design. UI text is in Indonesian.

## Build & Dev Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

Entry points: `index.html` (game) and `admin.html` (admin/leaderboard tools).

## Architecture

### Module Responsibilities

| File pattern | Responsibility |
|---|---|
| `src/world*.js` | Three.js scene setup — geometry, lighting, materials for each level |
| `src/stages/stage*.js` | Content data — questions, phenomena, challenge configs, explanations |
| `src/*UI.js` | HTML overlay panels rendered on top of the 3D canvas |
| `src/state.js` | Single global `state` object — all player progress, level flags, sim results |
| `src/player.js` | `PlayerCharacter` class — WASD/touch controls, walk animations |
| `src/collision.js` | AABB (2D XZ plane) collision — per-level obstacle arrays, `resolveCollision()` |
| `src/simulation.js` | Level 2 COD/BOD/pH calculator panel |
| `src/db.js` | localStorage persistence — leaderboard (`saveScore`) and checkpoints |
| `src/main.js` | Entry point — renderer, animation loop, scene swapping, level transitions |

### Six Stages

1. **Lab** – MCQ on vinasse pollution parameters (data from `stage1_questions.json`)
2. **Factory** – Ethanol production MCQ + interactive COD/BOD/pH simulation
3. **Remediation Pond** – Microorganism shop (buy Azolla); `stage3UI.js` overlay
4. **Workshop** – IPAL reactor equipment builder; `stage4UI.js` overlay
5. **Observation Lab** – Failure scenario analysis; `stage5UI.js` overlay
6. **Classroom** – Final presentation checklist; `stage6UI.js` overlay

## Conventions

### Scene/Object Naming
Follow the established export pattern per world:
```js
export function createXxxScene()     // THREE.js setup, returns { scene }
export function buildXxx(scene)      // Add static geometry
export function createXxxObject(scene) // Interactive 3D trigger objects
export function animateXxxObject(obj, delta) // Per-frame animation
export function getXxxObstacles()    // Return AABB obstacle array for collision
```

### State Pattern
Always read/write player progress via the `state` object from `src/state.js`. Use `resetLevelState()` and `resetSimState()` for cleanup. Never store level progression in local variables outside of `state`.

### UI Overlays (Stages 3–6)
Stage-specific overlays inject `<div>` panels into the DOM and are controlled by their `*UI.js` module. Keep 3D world logic and HTML overlay logic in separate files.

### Collision
Obstacles are plain objects `{ x, z, w, d }` (center + half-extents in XZ). Add new room obstacles to the relevant `*_OBSTACLES` array in `src/collision.js`. Player radius is `PLAYER_RADIUS = 0.65`.

### Question Data
MCQ content for stages 1–2 lives in `src/data/stage*_questions.json`:
```json
{ "id", "title", "context", "question", "options": [{ "label", "text", "correct", "explanation" }], "tableData" }
```
Stages 3–6 define their challenge data inline in the `stage*.js` files.

### Points System
- Stages 1–2: MCQ-based, up to 3 attempts, points deducted per wrong answer
- Stages 3–6: Task-based, bonus points for optimal choices
- Final `state.totalPoints` saved to localStorage leaderboard via `db.js`
