// ─────────────────────────────────────────────────────────────────────────────
// Stage 4 – IPAL Builder: Merancang Prototype Reaktor Vinasse
// Siswa merancang eksperimen menggunakan alat & bahan yang tersedia
// ─────────────────────────────────────────────────────────────────────────────

// ── Challenge question (opening MCQ before the builder) ──────────────────────
export const stage4Challenge = {
  title: '🔧 Tantangan Sebelum Merancang Reaktor',
  context: `
    Seorang siswa akan merancang reaktor sederhana untuk mengolah limbah vinasse
    dengan menggunakan <b>Azolla microphylla</b> hasil pemilihan di Level 3.<br><br>
    Azolla membutuhkan <b>cahaya matahari</b> untuk melakukan fotosintesis dan
    menghasilkan O₂ yang membantu degradasi polutan. Selain itu, proses aerasi
    dengan gelembung udara sangat membantu distribusi oksigen di seluruh cairan.<br><br>
    Siswa tersebut berencana:<br>
    <ol style="margin:6px 0 0 16px">
      <li>Menggunakan <b>aquarium tertutup</b> tanpa celah cahaya</li>
      <li>Memasang <b>3 aerator</b> sekaligus</li>
      <li><b>Tidak memasang lampu</b> karena mengira Azolla cukup hidup dari
        udara saja</li>
    </ol>
  `,
  question: `Evaluasi rancangan siswa tersebut — mengapa rancangannya kurang tepat untuk
    mengoptimalkan kinerja Azolla sebagai agen bioremediasi?`,
  options: [
    {
      label: 'A',
      text: 'Aquarium tertutup tanpa cahaya menyebabkan Azolla tidak dapat berfotosintesis, sehingga produksi O₂ terhenti dan kapasitas degradasi polutan menurun signifikan.',
      correct: true,
    },
    {
      label: 'B',
      text: '3 aerator terlalu banyak sehingga arus udara yang kuat akan menggulung dan menenggelamkan Azolla ke dasar aquarium.',
      correct: false,
    },
    {
      label: 'C',
      text: 'Aquarium tertutup justru lebih baik karena mencegah kontaminasi udara luar dan menjaga suhu optimal untuk Azolla.',
      correct: false,
    },
  ],
  explanation: `✅ <strong>Benar!</strong> Azolla adalah tanaman fotosintetik — ia <em>wajib</em>
    mendapat cahaya yang cukup (> 1000 lux) untuk menghasilkan O₂ dan menjalankan proses
    fitoremediasi secara efektif. Aquarium tertutup rapat tanpa pencahayaan tambahan akan
    menghentikan fotosintesis, membuat Azolla mati, dan proses bioremediasi gagal total.
    Rancangan yang benar: gunakan wadah terbuka/transparan + pasang lampu grow-light jika
    pencahayaan alami kurang.`,
};

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
// Evaluates which items the student selected and computes reactor performance
export function evaluateReactor(selectedIds) {
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
    feedback: `✅ Reaktor berhasil dirancang! Perkiraan penurunan COD: <b>${codReduction}%</b>, BOD: <b>${bodReduction}%</b>.`,
  };
}
