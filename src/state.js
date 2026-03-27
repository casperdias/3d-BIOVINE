// Game State
export const state = {
  playerName: '',
  currentLevel: 1,
  totalPoints: 0,
  levelAttempts: 0,       // attempts on current level (max 3)
  levelPoints: 0,         // points earned this level
  phenomenonIndex: 0,     // 0, 1, 2 for the 3 phenomena in stage 1/2
  answered: false,
  wrongAnswers: 0,        // wrong answers within current question attempt

  // Per-level point breakdown — populated when each level is completed
  // Each entry: { level: Number, label: String, points: Number }
  levelBreakdown: [],

  // Snapshot of totalPoints at the beginning of the current level
  // (used to compute how many points were earned during that level)
  pointsAtLevelStart: 0,

  // Level 2 simulation state
  sim: {
    vinasseVol:   null,    // mL selected
    initialCOD:   null,
    initialBOD:   null,
    initialPH:    null,
    aeratorOn:    false,
    durationHours: null,
    finalCOD:     null,
    finalBOD:     null,
    finalPH:      null,
    compliant:    false,
  },

  // Level 3 – microorganism shop + valve state
  stage3: {
    challengeAnswered:  false,
    purchasedOrganism:  null,   // organism id string
    purchaseCost:       0,
    valveOpened:        false,
    bonusPoints:        0,
  },

  // Level 4 – IPAL builder state
  stage4: {
    selectedItems:  [],
    reactorResult:  null,   // evaluateReactor() output
    terminalDone:   false,
  },

  // Level 5 – evaluation state
  stage5: {
    scopeDone: false,
  },
};

export function resetLevelState() {
  state.levelAttempts = 0;
  state.levelPoints = 0;
  state.phenomenonIndex = 0;
  state.answered = false;
  state.wrongAnswers = 0;
}

export function resetSimState() {
  state.sim = {
    vinasseVol:    null,
    initialCOD:    null,
    initialBOD:    null,
    initialPH:     null,
    aeratorOn:     false,
    durationHours: null,
    finalCOD:      null,
    finalBOD:      null,
    finalPH:       null,
    compliant:     false,
  };
}

export function resetStage3State() {
  state.stage3 = {
    challengeAnswered: false,
    purchasedOrganism: null,
    purchaseCost:      0,
    valveOpened:       false,
    bonusPoints:       0,
  };
}

export function resetStage4State() {
  state.stage4 = {
    selectedItems: [],
    reactorResult: null,
    terminalDone:  false,
  };
}

export function resetStage5State() {
  state.stage5 = { scopeDone: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-level score recording
// Call at the moment a level's scoring is finalised (before transitioning).
// ─────────────────────────────────────────────────────────────────────────────
export const LEVEL_LABELS = {
  1: 'Level 1 – Lab Sains',
  2: 'Level 2 – Pabrik Etanol',
  3: 'Level 3 – Kolam Remediasi',
  4: 'Level 4 – Workshop IPAL',
  5: 'Level 5 – Lab Observasi',
};

/**
 * Push the points earned during the just-completed level into levelBreakdown.
 * `state.pointsAtLevelStart` must be set at the beginning of each level.
 */
export function recordLevelPoints(levelNum) {
  const earned = state.totalPoints - state.pointsAtLevelStart;
  state.levelBreakdown.push({
    level:  levelNum,
    label:  LEVEL_LABELS[levelNum] || `Level ${levelNum}`,
    points: earned,
  });
}
