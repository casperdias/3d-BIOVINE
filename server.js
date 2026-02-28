// ─────────────────────────────────────────────────────────────────────────────
// 3D BIOVINE – API Server
// Stores scores and checkpoints in local JSON files (cross-device DB).
//
// Endpoints:
//   GET    /api/scores              → all scores
//   POST   /api/scores              → append a score record
//   DELETE /api/scores              → wipe all scores
//
//   GET    /api/checkpoint/:name    → checkpoint for that player name (or null)
//   POST   /api/checkpoint          → save/update checkpoint
//   DELETE /api/checkpoint/:name    → delete checkpoint for that name
// ─────────────────────────────────────────────────────────────────────────────

import express     from 'express';
import cors        from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath }    from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Data directory & files ────────────────────────────────────────────────────
const DATA_DIR         = resolve(__dirname, 'data');
const SCORES_FILE      = resolve(DATA_DIR, 'scores.json');
const CHECKPOINTS_FILE = resolve(DATA_DIR, 'checkpoints.json');

if (!existsSync(DATA_DIR))         mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(SCORES_FILE))      writeFileSync(SCORES_FILE,      '[]',  'utf8');
if (!existsSync(CHECKPOINTS_FILE)) writeFileSync(CHECKPOINTS_FILE, '{}',  'utf8');

// ── JSON helpers ──────────────────────────────────────────────────────────────
function readJSON(file)       { return JSON.parse(readFileSync(file, 'utf8')); }
function writeJSON(file, data){ writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ── Scores ────────────────────────────────────────────────────────────────────
app.get('/api/scores', (_req, res) => {
  res.json(readJSON(SCORES_FILE));
});

app.post('/api/scores', (req, res) => {
  const scores = readJSON(SCORES_FILE);
  scores.push(req.body);
  // Keep at most 500 records
  if (scores.length > 500) scores.splice(0, scores.length - 500);
  writeJSON(SCORES_FILE, scores);
  res.json({ ok: true });
});

app.delete('/api/scores', (_req, res) => {
  writeJSON(SCORES_FILE, []);
  res.json({ ok: true });
});

// ── Checkpoints ───────────────────────────────────────────────────────────────
app.get('/api/checkpoint/:name', (req, res) => {
  const checkpoints = readJSON(CHECKPOINTS_FILE);
  res.json(checkpoints[req.params.name] ?? null);
});

app.post('/api/checkpoint', (req, res) => {
  const checkpoints = readJSON(CHECKPOINTS_FILE);
  if (!req.body?.playerName) return res.status(400).json({ error: 'playerName required' });
  checkpoints[req.body.playerName] = {
    ...req.body,
    savedAt: new Date().toISOString(),
  };
  writeJSON(CHECKPOINTS_FILE, checkpoints);
  res.json({ ok: true });
});

app.delete('/api/checkpoint/:name', (req, res) => {
  const checkpoints = readJSON(CHECKPOINTS_FILE);
  delete checkpoints[req.params.name];
  writeJSON(CHECKPOINTS_FILE, checkpoints);
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`[BIOVINE API] Running at http://localhost:${PORT}`)
);
