// HUD overlay - points + stage label + hints
export class HUD {
  constructor(container, gameManager) {
    this.container = container;
    this.gm = gameManager;
    this._render();
    this.gm.onPointsChange(() => this._updatePoints());
  }

  _render() {
    this.container.innerHTML = `
      <div class="hud-stage" id="hud-stage">Tahap 1</div>
      <div class="hud-points" id="hud-points">⭐ ${this.gm.points} Poin</div>
      <div class="hud-hint" id="hud-hint" style="display:none"></div>
    `;
    this.stageEl = document.getElementById('hud-stage');
    this.pointsEl = document.getElementById('hud-points');
    this.hintEl = document.getElementById('hud-hint');
  }

  _updatePoints() {
    if (this.pointsEl) this.pointsEl.textContent = `⭐ ${this.gm.points} Poin`;
  }

  setStage(label) {
    if (this.stageEl) this.stageEl.textContent = label;
  }

  setHint(text) {
    if (!this.hintEl) return;
    if (text) {
      this.hintEl.textContent = text;
      this.hintEl.style.display = 'block';
    } else {
      this.hintEl.style.display = 'none';
    }
  }

  show() { this.container.style.display = 'block'; }
  hide() { this.container.style.display = 'none'; }
}
