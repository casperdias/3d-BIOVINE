// Central game state manager
export class GameManager {
  constructor() {
    this.points = 300; // Starting points
    this.currentStage = 'menu';
    this.completedStages = new Set();
    this.purchasedItems = new Set();
    this.selectedTools = new Set();
    this.selectedMaterials = new Set();
    this.phenomenaAnswered = new Set();

    // Callbacks
    this._onStageChange = null;
    this._onPointsChange = null;
  }

  onStageChange(cb) { this._onStageChange = cb; }
  onPointsChange(cb) { this._onPointsChange = cb; }

  addPoints(pts) {
    this.points += pts;
    if (this._onPointsChange) this._onPointsChange(this.points);
  }

  spendPoints(pts) {
    if (this.points < pts) return false;
    this.points -= pts;
    if (this._onPointsChange) this._onPointsChange(this.points);
    return true;
  }

  goToStage(stageName) {
    this.currentStage = stageName;
    if (this._onStageChange) this._onStageChange(stageName);
  }

  completeStage(stageName) {
    this.completedStages.add(stageName);
  }

  markPhenomenon(id) {
    this.phenomenaAnswered.add(id);
  }

  hasAnsweredAllPhenomena() {
    return this.phenomenaAnswered.size >= 3;
  }

  purchaseItem(id) {
    this.purchasedItems.add(id);
  }

  hasAllMicrobes() {
    return ['nitrosomonas', 'nitrobacter', 'aspergillus'].every(id => this.purchasedItems.has(id));
  }

  selectTool(id) { this.selectedTools.add(id); }
  selectMaterial(id) { this.selectedMaterials.add(id); }
}
