// ─────────────────────────────────────────────────────────────────────────────
// Stage 4 – IPAL Builder: Merancang Prototype Reaktor Vinasse
// Siswa merancang eksperimen menggunakan alat & bahan yang tersedia
// ─────────────────────────────────────────────────────────────────────────────

// ── Equipment catalogue (alat) ────────────────────────────────────────────────
export const equipmentList = [
  {
    id: 'aerator_1',
    category: 'alat',
    name: 'Aerator (1 unit)',
    emoji: '💨',
    desc: 'Pompa udara kecil untuk mensuplai O₂ ke dalam cairan. 1 unit = aerasi lemah.',
    effect: { aerationLevel: 1 },
    required: true,
  },
  {
    id: 'aerator_2',
    category: 'alat',
    name: 'Aerator (2 unit)',
    emoji: '💨💨',
    desc: 'Dua pompa udara — aerasi sedang, O₂ terdistribusi lebih merata.',
    effect: { aerationLevel: 2 },
    required: false,
  },
  {
    id: 'aerator_3',
    category: 'alat',
    name: 'Aerator (3 unit)',
    emoji: '💨💨💨',
    desc: 'Tiga pompa udara — aerasi maksimal, O₂ penuh, pH lebih cepat turun.',
    effect: { aerationLevel: 3 },
    required: false,
  },
  {
    id: 'aquarium',
    category: 'alat',
    name: 'Aquarium / Bak Kolam',
    emoji: '🪣',
    desc: 'Wadah penampung cairan vinasse. Diletakkan dalam kondisi tertutup rapat saat percobaan berjalan.',
    effect: { hasContainer: true },
    required: true,
  },
  {
    id: 'selang',
    category: 'alat',
    name: 'Pipa / Selang',
    emoji: '🔩',
    desc: 'Menghubungkan aerator ke dalam cairan. Diperlukan agar gelembung udara sampai ke dasar.',
    effect: { hasHose: true },
    required: true,
  },
  {
    id: 'listrik',
    category: 'alat',
    name: 'Aliran Listrik',
    emoji: '⚡',
    desc: 'Sumber daya untuk aerator dan lampu. Wajib jika menggunakan peralatan listrik.',
    effect: { hasPower: true },
    required: true,
  },
  {
    id: 'penyaring',
    category: 'alat',
    name: 'Penyaring',
    emoji: '🕸️',
    desc: 'Filter mekanik untuk menyaring biomassa Azolla atau partikel kasar setelah perlakuan.',
    effect: { hasFilter: true },
    required: false,
  },
  {
    id: 'lampu',
    category: 'alat',
    name: 'Lampu (Grow-light)',
    emoji: '💡',
    desc: 'Pencahayaan tambahan > 1000 lux untuk mendukung fotosintesis Azolla. Sangat dianjurkan.',
    effect: { hasLight: true },
    required: false,
  },
];

// ── Materials catalogue (bahan) ───────────────────────────────────────────────
export const materialList = [
  {
    id: 'vinasse',
    category: 'bahan',
    name: 'Limbah Vinasse',
    emoji: '🪣',
    desc: 'Bahan utama — limbah cair dari distilasi etanol. COD awal ±80.000 mg/L, pH 3–4.',
    required: true,
  },
  {
    id: 'azolla_bio',
    category: 'bahan',
    name: 'Azolla microphylla (biomassa)',
    emoji: '🌿',
    desc: 'Agen bioremediasi utama. Dosis: 200 g biomassa segar per 1 L vinasse.',
    required: true,
  },
  {
    id: 'air_pengencer',
    category: 'bahan',
    name: 'Air Pengencer',
    emoji: '💧',
    desc: 'Untuk mengencerkan vinasse ke konsentrasi yang optimal bagi pertumbuhan Azolla.',
    required: false,
  },
  {
    id: 'buffer_ph',
    category: 'bahan',
    name: 'Buffer pH (NaHCO₃)',
    emoji: '🧪',
    desc: 'Meningkatkan pH vinasse ke 5–7 agar Azolla dapat hidup pada fase awal inokulasi.',
    required: false,
  },
];

// ── Procedure steps (prosedur) ────────────────────────────────────────────────
export const procedureSteps = [
  {
    step: 1,
    icon: '🪣',
    title: 'Siapkan Wadah',
    desc: 'Masukkan air limbah vinasse ke dalam aquarium/bak/kolam yang sudah disiapkan.',
    requires: ['aquarium', 'vinasse'],
  },
  {
    step: 2,
    icon: '🧫',
    title: 'Ukur Parameter Awal',
    desc: 'Ukur kadar COD, BOD dengan titrasi; pH menggunakan kertas lakmus atau pH meter.',
    requires: [],
  },
  {
    step: 3,
    icon: '🌿',
    title: 'Tambahkan Mikroorganisme',
    desc: 'Tambahkan Azolla microphylla dengan 3 variasi konsentrasi (10%, 50%, 100% dosis referensi). Jika cair: pengenceran; jika padat: tambahkan bibit terlebih dahulu.',
    requires: ['azolla_bio'],
  },
  {
    step: 4,
    icon: '💨',
    title: 'Nyalakan Aerator',
    desc: 'Nyalakan aerator yang telah terhubung selang. Sesuaikan kecepatan aerasi sesuai jumlah aerator yang dipilih.',
    requires: ['aerator_1', 'selang', 'listrik'],
  },
  {
    step: 5,
    icon: '💡',
    title: 'Tambahkan Pencahayaan',
    desc: 'Pasang grow-light karena Azolla membutuhkan cahaya untuk fotosintesis. Target: > 1000 lux.',
    requires: ['lampu'],
  },
  {
    step: 6,
    icon: '🔒',
    title: 'Tutup & Jalankan',
    desc: 'Tutup aquarium dan biarkan aerator terus menyala tanpa terputus selama 7 hari (durasi berdasarkan literatur).',
    requires: ['aquarium'],
  },
  {
    step: 7,
    icon: '🔬',
    title: 'Amati Perubahan',
    desc: 'Catat perubahan warna, bau, dan kondisi Azolla setiap hari. Warna vinasse berubah dari hitam → coklat muda menandakan penurunan melanoidin.',
    requires: [],
  },
  {
    step: 8,
    icon: '📊',
    title: 'Ukur Parameter Akhir',
    desc: 'Ukur COD, BOD, dan pH akhir. Bandingkan dengan nilai awal untuk menghitung persentase penurunan.',
    requires: [],
  },
  {
    step: 9,
    icon: '📝',
    title: 'Tulis Laporan',
    desc: 'Susun laporan penelitian: latar belakang, metode, hasil (tabel COD/BOD awal-akhir), pembahasan, dan kesimpulan.',
    requires: [],
  },
];

// ── Reactor outcome evaluator ─────────────────────────────────────────────────
// Evaluates which items the student selected and computes reactor performance.
// concConfig = { concentrations: [c1,c2,c3] (% of 200 g/L), repetitions, duration }
export function evaluateReactor(selectedIds, concConfig) {
  const sel = new Set(selectedIds);

  const hasContainer = sel.has('aquarium');
  const hasAerator   = sel.has('aerator_1') || sel.has('aerator_2') || sel.has('aerator_3');
  const aerationLvl  = sel.has('aerator_3') ? 3 : sel.has('aerator_2') ? 2 : sel.has('aerator_1') ? 1 : 0;
  const hasHose      = sel.has('selang');
  const hasPower     = sel.has('listrik');
  const hasLight     = sel.has('lampu');
  const hasFilter    = sel.has('penyaring');
  const hasOrganism  = sel.has('azolla_bio');
  const hasVinasse   = sel.has('vinasse');
  const hasBuffer    = sel.has('buffer_ph');

  // Missing critical items
  const missing = [];
  if (!hasContainer)  missing.push('Aquarium/Bak (wadah wajib)');
  if (!hasAerator)    missing.push('Aerator (aerasi wajib untuk O₂)');
  if (!hasHose)       missing.push('Pipa/Selang (penghubung aerator)');
  if (!hasPower)      missing.push('Aliran Listrik (sumber daya aerator)');
  if (!hasOrganism)   missing.push('Azolla microphylla (agen bioremediasi)');
  if (!hasVinasse)    missing.push('Limbah Vinasse (bahan utama)');

  if (missing.length > 0) {
    return {
      success: false,
      codReduction: 0,
      bodReduction: 0,
      grade: 'Gagal',
      gradeColor: '#ff4444',
      missing,
      feedback: `❌ Rancangan tidak lengkap! Item yang kurang: ${missing.join(', ')}.`,
    };
  }

  // Base performance from literature
  let codReduction = 60;   // base without light
  let bodReduction = 58;

  // Aerator bonus
  if (aerationLvl >= 2) { codReduction += 12; bodReduction += 10; }
  if (aerationLvl >= 3) { codReduction += 8;  bodReduction += 6;  }

  // Light bonus (Azolla needs photosynthesis)
  if (hasLight) { codReduction += 16; bodReduction += 14; }

  // Buffer pH bonus (helps Azolla survive early stage)
  if (hasBuffer) { codReduction += 8;  bodReduction += 8;  }

  // Filter bonus (improves final effluent quality)
  if (hasFilter) { codReduction += 4; }

  // Cap at Azolla's theoretical max
  codReduction = Math.min(codReduction, 96);
  bodReduction = Math.min(bodReduction, 94);

  let grade, gradeColor;
  if (codReduction >= 85) { grade = 'Sangat Baik ⭐⭐⭐'; gradeColor = '#40ff80'; }
  else if (codReduction >= 70) { grade = 'Baik ⭐⭐'; gradeColor = '#a0c840'; }
  else { grade = 'Cukup ⭐'; gradeColor = '#e0a020'; }

  // Per-concentration breakdown
  // Higher concentration → slightly closer to max reduction (diminishing returns above 100%)
  const concentrations = (concConfig && concConfig.concentrations) || [10, 50, 100];
  const duration       = (concConfig && concConfig.duration) || 7;
  const durationFactor = Math.min(1, 0.6 + duration / 25); // 7d → 0.88, 14d → 1.0

  const perConcentration = concentrations.map(conc => {
    // Scale factor: 10% conc → ~40% efficacy; 50% → ~75%; 100% → 100%
    const scale   = Math.min(1, 0.4 + (conc / 100) * 0.6) * durationFactor;
    const codTier = Math.round(codReduction * scale);
    const bodTier = Math.round(bodReduction * scale);
    let note;
    if (conc <= 15)       note = 'Dosis sangat rendah; penurunan terbatas';
    else if (conc <= 40)  note = 'Dosis rendah; penurunan sedang';
    else if (conc <= 80)  note = 'Dosis moderat; efisiensi cukup baik';
    else if (conc <= 110) note = 'Dosis optimal; performa terbaik';
    else                  note = 'Dosis lebih; tidak banyak tambahan manfaat';
    return { conc, cod: codTier, bod: bodTier, note };
  });

  return {
    success: true,
    aerationLvl,
    hasLight,
    hasFilter,
    hasBuffer,
    codReduction,
    bodReduction,
    grade,
    gradeColor,
    missing: [],
    feedback: `✅ Reaktor berhasil dirancang! Perkiraan penurunan COD rata-rata: <b>${codReduction}%</b>, BOD: <b>${bodReduction}%</b>.`,
    perConcentration,
  };
}
