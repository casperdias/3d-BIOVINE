// ─────────────────────────────────────────────────────────────────────────────
// Stage 2 – Proses Produksi Etanol & Simulasi Pengolahan Vinasse
// Questions loaded from src/data/stage2_questions.json
// ─────────────────────────────────────────────────────────────────────────────
import questionsRaw from '../data/stage2_questions.json';

export const stage2 = {
  id: 2,
  title: 'Level 2 – Pabrik Etanol & Simulasi Vinasse',
  description: 'Jelajahi pabrik etanol dan simulasikan pengolahan limbah vinasse',
  phenomena: questionsRaw,
};

// ── Legacy inline phenomena kept for reference only ──────────────────────────
const _phenomenaInline = [
    {
      id: 1,
      title: 'Stasiun 1 – Drum Fermentor',
      context: `
        <b>🥁 Drum Fermentor</b> digunakan untuk mengencerkan kadar gula dalam
        <em>tetes tebu (molasses)</em> melalui proses fermentasi. Kadar gula awal
        molasses sangat tinggi dan perlu diencerkan hingga ~14% sebelum fermentasi
        dapat berlangsung efisien.<br><br>
        Bahan yang ditambahkan ke fermentor:<br>
        <ul style="margin:6px 0 0 16px">
          <li><b>Molasses</b> – sumber gula utama</li>
          <li><b>Urea & NPK</b> – nutrisi bagi ragi</li>
          <li><b>Ragi (Yeast)</b> – mikroorganisme fermentor</li>
          <li><b>Air hangat</b> – aktivator ragi (±30–35 °C)</li>
        </ul>
        <br>Ragi mengurai gula menjadi <b>etanol + CO₂</b>. CO₂ yang dihasilkan
        menyebabkan gelembung dan tekanan di dalam drum.
      `,
      question: `Mengapa kadar gula dalam molasses perlu diencerkan hingga sekitar 14% sebelum proses fermentasi?`,
      options: [
        {
          label: 'A',
          text: 'Kadar gula terlalu tinggi akan meracuni ragi (efek osmotik) sehingga fermentasi tidak optimal dan yield etanol menurun.',
          correct: true,
        },
        {
          label: 'B',
          text: 'Kadar gula tinggi mempercepat pertumbuhan ragi sehingga fermentasi selesai lebih cepat dan menghasilkan lebih banyak etanol.',
          correct: false,
        },
        {
          label: 'C',
          text: 'Pengenceran diperlukan semata-mata untuk mengurangi biaya produksi, bukan berpengaruh pada kualitas etanol.',
          correct: false,
        },
      ],
      explanation: `✅ <strong>Benar!</strong> Kadar gula yang terlalu tinggi menciptakan tekanan osmotik yang dapat membunuh atau menghambat ragi. Pada konsentrasi ~14%, ragi dapat bekerja optimal menghasilkan etanol. Jika terlalu pekat, efisiensi fermentasi turun drastis.`,
    },

    {
      id: 2,
      title: 'Stasiun 2 – Destilator',
      context: `
        <b>🌡️ Destilator</b> berfungsi memisahkan etanol dari campuran hasil
        fermentasi (wash) berdasarkan perbedaan titik didih.<br><br>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">
          <thead><tr style="background:rgba(46,204,113,0.2)">
            <th style="padding:4px 8px;text-align:left">Komponen</th>
            <th style="padding:4px 8px">Titik Didih</th>
            <th style="padding:4px 8px">Keterangan</th>
          </tr></thead>
          <tbody>
            <tr><td style="padding:4px 8px">Etanol (C₂H₅OH)</td><td style="padding:4px 8px;text-align:center">78,4 °C</td><td style="padding:4px 8px">Menguap lebih dulu</td></tr>
            <tr><td style="padding:4px 8px">Air (H₂O)</td><td style="padding:4px 8px;text-align:center">100 °C</td><td style="padding:4px 8px">Tertinggal sebagai vinasse</td></tr>
          </tbody>
        </table>
        <br>Sisa setelah distilasi inilah yang disebut <b>limbah vinasse</b> — cairan
        coklat kehitaman yang kaya bahan organik, sangat asam (pH 3–4), dengan
        COD 60.000–100.000 mg/L.
      `,
      question: `Limbah vinasse dihasilkan pada tahap mana dalam proses produksi etanol, dan mengapa kandungan organiknya sangat tinggi?`,
      options: [
        {
          label: 'A',
          text: 'Vinasse dihasilkan saat penambahan ragi; kandungan organik tinggi berasal dari nutrisi ragi yang tidak terpakai.',
          correct: false,
        },
        {
          label: 'B',
          text: 'Vinasse adalah residu distilasi — cairan yang tersisa setelah etanol diuapkan. Kandungan organik tinggi karena semua senyawa non-volatil (asam organik, melanoid, fenol) terkonsentrasi di dalamnya.',
          correct: true,
        },
        {
          label: 'C',
          text: 'Vinasse terbentuk selama fermentasi berlangsung dan kandungan organiknya berasal dari CO₂ yang larut kembali.',
          correct: false,
        },
      ],
      explanation: `✅ <strong>Benar!</strong> Distilasi menguapkan etanol, meninggalkan seluruh senyawa non-volatil terkonsentrasi dalam vinasse: asam asetat, asam laktat, gliserol, fenol, polifenol, dan melanoid. Inilah mengapa vinasse memiliki COD sangat tinggi dan pH rendah.`,
    },

    {
      id: 3,
      title: 'Stasiun 3 – Kompor Pemanas',
      context: `
        <b>🔥 Kompor Pemanas</b> memanaskan cairan fermentasi agar etanol menguap
        pada suhu 78,4 °C dan dialirkan ke kondenser untuk dikondensasikan kembali
        menjadi etanol cair.<br><br>
        Kontrol suhu sangat kritis:
        <ul style="margin:6px 0 0 16px">
          <li>Terlalu rendah (&lt;78°C): etanol tidak menguap sempurna → yield rendah</li>
          <li>Terlalu tinggi (&gt;100°C): air ikut menguap → kemurnian etanol turun</li>
          <li>Optimal 78–82°C: etanol teruapkan, air sebagian besar tertinggal</li>
        </ul>
        <br>Vinasse yang dihasilkan dari proses ini memiliki suhu tinggi (~70–80 °C)
        saat pertama keluar, kemudian mendingin hingga suhu ambient (~30 °C).
      `,
      question: `Apa yang terjadi jika suhu pemanasan pada destilasi diatur jauh di atas 100 °C?`,
      options: [
        {
          label: 'A',
          text: 'Etanol akan terdistilasi lebih cepat dan kemurniannya meningkat karena semua kotoran terbakar.',
          correct: false,
        },
        {
          label: 'B',
          text: 'Air akan ikut menguap bersama etanol, sehingga distilat yang terkumpul memiliki kadar air tinggi dan kemurnian etanol rendah.',
          correct: true,
        },
        {
          label: 'C',
          text: 'Proses distilasi akan berhenti karena etanol sudah terurai menjadi CO₂ dan H₂O pada suhu tersebut.',
          correct: false,
        },
      ],
      explanation: `✅ <strong>Benar!</strong> Di atas 100 °C, air (titik didih 100 °C) ikut menguap. Distilat menjadi campuran etanol-air dengan kadar etanol rendah. Untuk mendapatkan etanol dengan kemurnian tinggi, suhu harus dijaga seketat mungkin di kisaran titik didih etanol (78–82 °C).`,
    },
  ];
// ── End of legacy inline data ────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Simulasi vinasse: menghitung COD, BOD, pH awal berdasarkan volume yang dituang
// lalu simulasi aerasi dan hasilnya.
//
// Referensi nilai berdasarkan literatur (Zahra 2023, Budiyono et al 2013):
//   COD vinasse murni  : 90.000 mg/L
//   BOD vinasse murni  : 45.000 mg/L  (BOD/COD ratio ~0.5)
//   pH vinasse murni   : 3.8
//   Volume beaker lab  : 1000 mL (1 L)
// ─────────────────────────────────────────────────────────────────────────────

const VINASSE_COD  = 90000;  // mg/L
const VINASSE_BOD  = 45000;  // mg/L
const VINASSE_PH   = 3.8;
const WATER_PH     = 7.0;
const BEAKER_VOL   = 1000;   // mL

/**
 * Calculate initial parameters based on vinasse volume poured into beaker.
 * The rest of the beaker is filled with distilled water.
 *
 * @param {number} vinasseVol – volume of vinasse in mL (0–1000)
 * @returns {{ cod, bod, ph, dilutionFactor }}
 */
export function calcInitialParams(vinasseVol) {
  const v   = Math.max(0, Math.min(BEAKER_VOL, vinasseVol));
  const w   = BEAKER_VOL - v;
  const df  = v / BEAKER_VOL; // dilution factor

  const cod = Math.round(VINASSE_COD * df);
  const bod = Math.round(VINASSE_BOD * df);

  // pH mixing: weighted average of H+ concentrations
  const hVinasse = Math.pow(10, -VINASSE_PH);
  const hWater   = Math.pow(10, -WATER_PH);
  const hMix     = (hVinasse * v + hWater * w) / BEAKER_VOL;
  const ph       = Math.max(3.5, Math.min(7.0, -Math.log10(hMix)));

  return { cod, bod, ph: parseFloat(ph.toFixed(2)), dilutionFactor: df };
}

/**
 * Simulate aeration effect on COD, BOD, and pH.
 * Aerasi (aerobic biodegradation):
 *   - BOD removal follows first-order kinetics: BOD_t = BOD_0 * e^(-k*t)
 *   - COD removal ~60% of BOD removal (only biodegradable fraction)
 *   - pH rises toward neutral as organic acids are oxidised
 *
 * @param {{ cod, bod, ph }} initial
 * @param {number} durationHours – aeration time (0–72 h)
 * @returns {{ cod, bod, ph, bodRemoval, codRemoval }}
 */
export function calcAfterAeration(initial, durationHours) {
  const k    = 0.08;  // first-order BOD removal rate constant (h⁻¹) – typical aerobic
  const t    = Math.max(0, Math.min(72, durationHours));

  const bodFinal = Math.round(initial.bod * Math.exp(-k * t));
  const bodRemoved = initial.bod - bodFinal;

  // COD: biodegradable fraction (≈55%) follows same removal; rest is recalcitrant
  const codBiodeg    = initial.cod * 0.55;
  const codRecalcit  = initial.cod * 0.45;
  const codBiodegFinal = codBiodeg * Math.exp(-k * t);
  const codFinal     = Math.round(codBiodegFinal + codRecalcit);

  // pH recovery: organic acids oxidised → pH drifts toward 6.5–7
  const phFinal = parseFloat(
    Math.min(6.8, initial.ph + (6.8 - initial.ph) * (1 - Math.exp(-k * 0.5 * t)))
      .toFixed(2)
  );

  const bodRemovalPct = initial.bod > 0
    ? Math.round((bodRemoved / initial.bod) * 100) : 0;
  const codRemovalPct = initial.cod > 0
    ? Math.round(((initial.cod - codFinal) / initial.cod) * 100) : 0;

  // Compliance check vs Permen LH No.5/2014 (BOD ≤40 mg/L, COD ≤100 mg/L)
  const compliant = bodFinal <= 40 && codFinal <= 100;

  return {
    cod: codFinal,
    bod: bodFinal,
    ph: phFinal,
    bodRemovalPct,
    codRemovalPct,
    compliant,
  };
}
