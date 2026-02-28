// ─────────────────────────────────────────────────────────────────────────────
// db.js – localStorage-backed persistence (acts as a lightweight DB)
//  • Scores   – permanent leaderboard across all sessions
//  • Checkpoint – last saved position for the current player
// ─────────────────────────────────────────────────────────────────────────────

const SCORES_KEY     = 'biovine_scores';
const CHECKPOINT_KEY = 'biovine_checkpoint';

// ── Scores ───────────────────────────────────────────────────────────────────

/**
 * Append a completed-game record to the leaderboard.
 * @param {{ playerName:string, totalPoints:number, levelBreakdown:object[], completedAt:string }} record
 */
export function saveScore({ playerName, totalPoints, levelBreakdown, completedAt }) {
  const scores = getAllScores();
  scores.push({ playerName, totalPoints, levelBreakdown, completedAt });
  // Keep at most 200 entries so localStorage doesn't grow unbounded
  if (scores.length > 200) scores.splice(0, scores.length - 200);
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  } catch (e) {
    console.warn('[db] saveScore failed:', e);
  }
}

/**
 * Return all stored score records (newest-first when sorted externally).
 * @returns {Array}
 */
export function getAllScores() {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Delete all stored scores.  Used by the admin page "Reset" action.
 */
export function clearAllScores() {
  localStorage.removeItem(SCORES_KEY);
}

// ── Checkpoint ────────────────────────────────────────────────────────────────

/**
 * Persist the player's mid-run progress so they can resume later.
 * @param {{ playerName:string, currentLevel:number, totalPoints:number, levelBreakdown:object[] }} data
 */
export function saveCheckpoint({ playerName, currentLevel, totalPoints, levelBreakdown }) {
  const payload = {
    playerName,
    currentLevel,
    totalPoints,
    levelBreakdown: levelBreakdown || [],
    savedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('[db] saveCheckpoint failed:', e);
  }
}

/**
 * Load a previously saved checkpoint, or null if none exists.
 * @returns {{ playerName:string, currentLevel:number, totalPoints:number, levelBreakdown:object[], savedAt:string }|null}
 */
export function loadCheckpoint() {
  try {
    const raw = localStorage.getItem(CHECKPOINT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Erase the saved checkpoint (called on game-complete or "New Game").
 */
export function clearCheckpoint() {
  localStorage.removeItem(CHECKPOINT_KEY);
}
