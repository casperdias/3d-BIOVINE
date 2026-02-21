// Menu / splash screen (no Three.js scene needed)
export class Menu {
  constructor(overlay, gameManager) {
    this.overlay = overlay;
    this.gm = gameManager;
  }

  show() {
    this.overlay.classList.add('active');
    this.overlay.innerHTML = `
      <div class="menu-screen">
        <div class="menu-logo">🌿 3D BIOVINE</div>
        <div class="menu-subtitle">Game Edukasi 3D tentang Limbah Vinasse &amp; Solusinya</div>
        <div class="menu-tagline">"Belajar Sambil Bermain – Selamatkan Lingkungan dari Vinasse!"</div>

        <button class="menu-btn" id="start-btn">▶ MULAI PERMAINAN</button>

        <div class="menu-stages">
          <div class="stage-badge"><span>Tahap 1</span>Identifikasi Masalah</div>
          <div class="stage-badge"><span>Tahap 2</span>Akar Masalah</div>
          <div class="stage-badge"><span>Tahap 3</span>Solusi</div>
          <div class="stage-badge"><span>Tahap 4</span>Prototipe</div>
          <div class="stage-badge"><span>Evaluasi</span>Analisis</div>
          <div class="stage-badge"><span>Rekomendasi</span>Presentasi</div>
        </div>

        <div style="margin-top:32px;color:#475569;font-size:0.8rem;text-align:center;">
          Poin awal: <strong style="color:#fbbf24">300</strong> | Gunakan klik untuk berinteraksi dengan objek 3D
        </div>
      </div>
    `;

    document.getElementById('start-btn').addEventListener('click', () => {
      this.hide();
      this.gm.goToStage('stage1');
    });
  }

  hide() {
    this.overlay.classList.remove('active');
    this.overlay.innerHTML = '';
  }
}
