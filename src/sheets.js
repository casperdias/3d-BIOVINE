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
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbys_sNNVIFJCQGmvNHUMuiLpZGINttOvNN5LnIJ8z5Gak8h8KQ8BdTo342_K5H05RxbXw/exec';

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

/**
 * Upload a group's real-life experiment results to the "Kelompok" sheet.
 * Returns a Promise so the UI can react to success/failure.
 * Note: because no-cors is used, the response is always opaque — the Promise
 * resolves on any network-level success and rejects only on network failure.
 *
 * @param {Object} data - Experiment data collected from the form
 * @returns {Promise<void>}
 */
export function uploadExperimentResult(data) {
  if (!SCRIPT_URL) {
    return Promise.resolve();
  }

  const payload = {
    sheet: 'Kelompok',   // discriminator for Apps Script routing
    ...data,
  };

  return fetch(SCRIPT_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify(payload),
  }).catch(err => {
    console.warn('[sheets] Experiment upload failed (network error):', err);
    throw err;   // re-throw so caller's .catch() fires
  });
}

/**
 * Upload a student's Level 5 essay answer to the "Esai" sheet.
 * Fire-and-forget — no UI feedback needed.
 *
 * @param {{ playerName:string, essayAnswer:string, timestamp:string }} data
 */
export function uploadEssayResult(data) {
  if (!SCRIPT_URL) return;

  const payload = {
    sheet: 'Esai',
    playerName:  data.playerName  || '',
    essayAnswer: data.essayAnswer || '',
    timestamp:   data.timestamp   || new Date().toISOString(),
  };

  fetch(SCRIPT_URL, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body:    JSON.stringify(payload),
  }).catch(err => {
    console.warn('[sheets] Essay upload failed (network error):', err);
  });
}
