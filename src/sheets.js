// ─────────────────────────────────────────────────────────────────────────────
// sheets.js – Upload player progress to Google Sheets via Apps Script Web App
//
// HOW TO USE:
//   1. Follow GOOGLE_SHEETS_SETUP.md to deploy your Apps Script web app
//   2. Paste the deployed URL below as SCRIPT_URL
//   3. Upload is fire-and-forget; failures are silently logged to console
// ─────────────────────────────────────────────────────────────────────────────

import { state } from './state.js';

// ── Configuration ─────────────────────────────────────────────────────────────
// Paste your Google Apps Script deployment URL here after following the setup guide.
// Example: 'https://script.google.com/macros/s/AKfycb.../exec'
const SCRIPT_URL = '';

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Upload the player's current progress after completing a level.
 * Uses no-cors mode so no preflight is needed — response is not readable,
 * but the data is written to the sheet successfully.
 *
 * @param {number} completedLevel - The level number just finished (1–5)
 */
export function uploadLevelProgress(completedLevel) {
  if (!SCRIPT_URL) {
    // URL not configured yet — skip silently
    return;
  }

  const { playerName, totalPoints, levelBreakdown, completedRooms } = state;

  // Build per-level points map from levelBreakdown array
  const lvlPoints = { 1: null, 2: null, 3: null, 4: null, 5: null };
  levelBreakdown.forEach(entry => {
    lvlPoints[entry.level] = entry.points;
  });

  // Points earned specifically on the level just completed
  const thisLevelPoints = lvlPoints[completedLevel] ?? 0;

  const payload = {
    playerName,
    totalPoints,
    completedLevel,
    thisLevelPoints,
    level1Points: lvlPoints[1],
    level2Points: lvlPoints[2],
    level3Points: lvlPoints[3],
    level4Points: lvlPoints[4],
    level5Points: lvlPoints[5],
    completedRooms,
    timestamp: new Date().toISOString(),
  };

  // Send as text/plain to avoid CORS preflight (no-cors mode)
  fetch(SCRIPT_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify(payload),
  }).catch(err => {
    console.warn('[sheets] Upload failed (network error):', err);
  });
}
