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
