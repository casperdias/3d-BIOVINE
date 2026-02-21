// ─────────────────────────────────────────────────────────────────────────────
// Stage 3 – Menemukan Solusi: Valorisasi Vinasse dengan Mikroorganisme
// ─────────────────────────────────────────────────────────────────────────────

// ── Challenge question (answered BEFORE opening the shop) ────────────────────
export const stage3Challenge = {
  title: '🧫 Tantangan Sebelum Belanja Mikroorganisme',
  context: `
    Limbah vinasse dikenal memiliki <b>warna hitam pekat</b> karena kandungan pigmen
    <em>melanoidin</em> yang sulit terurai dan <em>senyawa fenolik</em> yang bersifat
    antimikroba.<br><br>
    Seorang siswa mencoba membuat <b>POC (Pupuk Organik Cair)</b> dari vinasse dengan
    memasukkan biostarter berisi <em>Staphylococcus aureus</em> dan <em>Streptococcus sp.</em>
    — dengan alasan bahwa kedua bakteri ini dikenal dapat menguraikan jaringan pada infeksi,
    sehingga dianggap juga mampu menguraikan bahan organik limbah dengan cepat.<br><br>
    Setelah <b>21 hari</b>, kadar COD dalam vinasse <b>tidak turun secara signifikan</b>
    dan warna cairan tetap hitam pekat — menandakan proses penguraian <b>gagal total</b>.
  `,
  question: `Berdasarkan karakteristik limbah dan fisiologi mikroba, evaluasi kesalahan yang dilakukan siswa tersebut dalam memilih mikroorganisme adalah…`,
  options: [
    {
      label: 'A',
      text: 'Mikroorganisme yang dipilih adalah bakteri patogen yang membutuhkan inang hidup, sehingga mereka mati karena tidak terdapat jaringan hidup di dalam limbah vinasse.',
      correct: false,
    },
    {
      label: 'B',
      text: 'Siswa tidak menggunakan mikroorganisme spesifik yang memiliki resistensi terhadap senyawa fenolik dan enzim khusus untuk memutus ikatan pigmen melanoidin.',
      correct: true,
    },
    {
      label: 'C',
      text: 'Kedua bakteri tersebut adalah bakteri anaerob obligat yang langsung mati saat terkena oksigen di permukaan limbah cair.',
      correct: false,
    },
  ],
  explanation: `✅ <strong>Benar!</strong> Vinasse mengandung <b>Melanoidin</b> dan <b>Fenol</b>.
    Senyawa fenolik bersifat bakterisidal bagi mikroba biasa yang tidak memiliki mekanisme
    pertahanan diri. Pengolahan vinasse membutuhkan mikroba yang mampu bertahan hidup di
    lingkungan mengandung racun fenol dengan kadar COD, BOD, dan pH yang tinggi.
    <em>S. aureus</em> dan <em>Streptococcus</em> tidak memiliki adaptasi tersebut.`,
};

// ── Microorganism shop catalogue ─────────────────────────────────────────────
// outcome: 'reward_high' | 'reward_mid' | 'punishment'
export const microorganisms = [
  {
    id: 'azolla',
    name: 'Azolla microphylla',
    emoji: '🌿',
    price: 50,
    pigment: 'Klorofil a+b (hijau)',
    description: `Paku air (fern) akuatik yang bersimbiosis dengan sianobakteri
      <em>Anabaena azollae</em>. Melalui fotosintesis menghasilkan O₂ ke limbah.
      Akarnya mengeluarkan <em>eksudat rizosfer</em> yang mengandung enzim pengurai
      bahan organik. Efektif menurunkan BOD dan COD — potensi penurunan COD hingga
      <b>96%</b> melalui fitoremediasi.`,
    citation: 'Thepsilvisut et al., 2024; Rizky et al., 2017',
    outcome: 'reward_high',
    rewardText: `🏆 <b>Pilihan Terbaik!</b> <em>Azolla</em> adalah agen fitoremediasi yang sangat
      efektif untuk vinasse. Akar dan eksudat rizosfernya mampu menyerap polutan organik,
      nutrisi, dan menurunkan COD hingga <b>96%</b>. Nilai poin bonus diberikan!`,
  },
  {
    id: 'nannochloropsis',
    name: 'Nannochloropsis',
    emoji: '🔴',
    price: 30,
    pigment: 'Klorofil a + karotenoid (hijau kekuningan)',
    description: `Mikroalga laut berukuran sangat kecil (~2–5 µm) dengan dinding sel
      yang sangat kuat. Kaya akan pigmen karotenoid. Hidup pada lingkungan dengan
      <b>salinitas tinggi</b>. Umumnya spesies laut; tidak toleran terhadap air tawar.`,
    citation: 'Puente-Padilla et al., 2025',
    outcome: 'punishment',
    punishmentText: `⛔ <b>Pilihan Salah!</b> <em>Nannochloropsis</em> adalah spesies laut yang
      membutuhkan salinitas tinggi. Vinasse adalah limbah industri gula/etanol berbasis
      air tawar — lingkungan ini tidak sesuai dan alga akan mati sebelum bekerja.
      Kamu kehilangan 1 nyawa!`,
  },
  {
    id: 'spirulina',
    name: 'Spirulina platensis',
    emoji: '🌀',
    price: 40,
    pigment: 'Fikosianin (biru), klorofil a (hijau)',
    description: `Sianobakteri filamen dengan pertumbuhan relatif cepat. Bersifat
      <em>fotoheterotrof</em> — membutuhkan cahaya dan CO₂. Menyukai kondisi
      <b>pH basa</b> (pH 8–11). Mengandung karbohidrat tinggi dan pigmen fikosianin
      yang khas berwarna biru.`,
    citation: 'Asghari et al., 2016; Sinaga et al., 2020; Yuliandri et al., 2013',
    outcome: 'reward_mid',
    rewardText: `👍 <b>Pilihan Cukup Baik.</b> <em>Spirulina</em> memang efektif menyerap
      nutrien, namun ia menyukai kondisi pH basa sementara vinasse umumnya asam (pH 3–5).
      Perlu pengkondisian pH terlebih dahulu. Skor sedang diberikan.`,
  },
  {
    id: 'chlorella',
    name: 'Chlorella vulgaris',
    emoji: '💚',
    price: 40,
    pigment: 'Klorofil a+b, karotenoid (hijau)',
    description: `Mikroalga <em>kosmopolitan</em> yang toleran terhadap lingkungan tercemar.
      Memiliki <b>fitohormon dan poliamin</b> untuk adaptasi ekosistem air tercemar.
      Mampu memecah <b>lignin dan senyawa melanoidin</b>. Dapat hidup pada kondisi
      anaerobik. Banyak digunakan dalam penelitian bioremediasi vinasse.`,
    citation: 'Hallmann et al., 2016; Rahmanta et al., 2025',
    outcome: 'reward_mid',
    rewardText: `👍 <b>Pilihan Baik!</b> <em>Chlorella vulgaris</em> adalah mikroalga
      kosmopolitan yang toleran dan mampu memecah melanoidin. Sangat relevan untuk
      bioremediasi vinasse. Skor sedang diberikan.`,
  },
];

// ── Lab calculation data ──────────────────────────────────────────────────────
// Dosis & waktu perlakuan per 1 L vinasse, per mikroorganisme
// Values from literature (rounded for pedagogy)
export const labCalcData = {
  azolla: {
    dose: '200 g biomassa segar / L vinasse',
    duration: '7 hari',
    codRemoval: '96%',
    bodRemoval: '94%',
    notes: 'Pertahankan cahaya cukup (> 1000 lux) dan suhu 25–30 °C.',
  },
  nannochloropsis: {
    dose: '—',
    duration: '—',
    codRemoval: '~0%',
    bodRemoval: '~0%',
    notes: '⛔ Tidak cocok untuk vinasse air tawar. Alga akan mati dalam 24 jam.',
  },
  spirulina: {
    dose: '1 g biomassa kering / L vinasse (+ buffer pH 8)',
    duration: '14 hari',
    codRemoval: '55%',
    bodRemoval: '60%',
    notes: 'Perlu netralisasi pH vinasse ke 7–8 sebelum inokulasi.',
  },
  chlorella: {
    dose: '0.5 g biomassa kering / L vinasse',
    duration: '10 hari',
    codRemoval: '70%',
    bodRemoval: '75%',
    notes: 'Pertahankan kondisi anaerob-fakultatif. Berikan CO₂ setiap 2 hari.',
  },
};

// ── Vinasse volume options for the valve simulation ───────────────────────────
// How many units of microorganism needed for the chosen vinasse volume
export function calcMicroDose(microId, vinasseLiters) {
  const base = labCalcData[microId];
  if (!base || base.codRemoval === '~0%') return null;

  // Parse numeric dose from the dose string
  const doseMatch = base.dose.match(/^([\d.]+)\s*(g\s*biomassa\s*(?:segar|kering))/i);
  const dosePerLitre = doseMatch ? parseFloat(doseMatch[1]) : 0.5;
  const unit = doseMatch ? doseMatch[2].trim() : 'g';

  return {
    total: (dosePerLitre * vinasseLiters).toFixed(1),
    unit,
    duration: base.duration,
    codRemoval: base.codRemoval,
    bodRemoval: base.bodRemoval,
    notes: base.notes,
  };
}
