// ─────────────────────────────────────────────────────────────────────────────
// Stage 5 – Melakukan Evaluasi
// Siswa mengamati kegagalan/keberhasilan percobaan dan menganalisis penyebabnya
// ─────────────────────────────────────────────────────────────────────────────

// ── Possible failure scenarios based on reactor design choices ────────────────
// keyed by the 'failureId' which evaluateReactor can return

export const failureScenarios = [
  {
    id: 'no_light',
    title: 'Kegagalan: Azolla Tidak Dapat Berfotosintesis',
    emoji: '🌑',
    condition: r => !r.hasLight,
    symptom: 'Warna vinasse tetap hitam pekat setelah 7 hari. Azolla menguning dan mati pada hari ke-3.',
    cause: 'Aquarium tidak mendapat pencahayaan yang cukup (< 200 lux). Azolla tidak dapat melakukan fotosintesis sehingga tidak menghasilkan O₂.',
    theory: 'Azolla microphylla adalah fototrofi obligat — ia wajib mendapat cahaya (> 1000 lux) untuk mengaktifkan fotosistem II dan menghasilkan ATP yang diperlukan untuk pertumbuhan dan produksi eksudat enzimatis pengurai melanoidin.',
    fix: 'Pasang grow-light 1000–3000 lux, atau letakkan reaktor di bawah sinar matahari langsung.',
    scoreImpact: -15,
  },
  {
    id: 'low_aeration',
    title: 'Kegagalan: Aerasi Kurang — O₂ Tidak Mencukupi',
    emoji: '💧',
    condition: r => r.aerationLvl < 2,
    symptom: 'pH turun sangat lambat. Bau asam tetap tajam pada hari ke-5. COD hanya turun ~40%.',
    cause: 'Hanya 1 aerator yang digunakan. Distribusi O₂ tidak merata — zona anoksik terbentuk di sudut reaktor dan menghambat aktivitas Azolla.',
    theory: 'Proses aerob dalam bioremediasi sangat bergantung pada suplai O₂ terlarut (DO). Nilai DO optimal adalah > 4 mg/L. Dengan 1 aerator kecil, zona pusat reaktor mungkin cukup, tetapi sudut-sudut reaktor akan mengalami anoksia yang menghambat degradasi polutan.',
    fix: 'Tambahkan minimal 2 aerator dan atur posisi selang agar gelembung udara mencapai seluruh volume cairan.',
    scoreImpact: -10,
  },
  {
    id: 'no_buffer',
    title: 'Peringatan: pH Terlalu Asam di Awal',
    emoji: '⚗️',
    condition: r => !r.hasBuffer,
    symptom: 'Azolla tumbuh lambat pada minggu pertama. Beberapa tanaman mengalami klorosis (daun kuning) karena stres pH asam.',
    cause: 'Vinasse murni memiliki pH 3–4. Azolla bekerja optimal pada pH 5–7. Tanpa buffer pH, fase adaptasi berlangsung lama.',
    theory: 'Enzim nitrogenase pada simbiont Anabaena azollae sangat sensitif terhadap pH rendah. Pada pH < 4.5, aktivitas nitrogenase menurun drastis sehingga fiksasi N₂ dan produksi eksudat berhenti. Penambahan NaHCO₃ (buffer) membantu menstabilkan pH ke 5.5–6.5 pada fase awal.',
    fix: 'Tambahkan NaHCO₃ atau air kapur secukupnya hingga pH vinasse mencapai 5.5–6 sebelum inokulasi Azolla.',
    scoreImpact: -5,
  },
  {
    id: 'no_filter',
    title: 'Catatan: Effluen Belum Tersaring',
    emoji: '🕸️',
    condition: r => !r.hasFilter,
    symptom: 'Cairan effluen mengandung partikel biomassa Azolla yang terlepas, membuat cairan tampak keruh meski COD sudah turun.',
    cause: 'Tidak ada penyaring mekanik di akhir proses. Biomassa Azolla yang mati terlarut dan meningkatkan TSS (Total Suspended Solid) effluen.',
    theory: 'Standar baku mutu air limbah (PERMEN LH No. 5/2014) mensyaratkan TSS < 200 mg/L untuk buangan ke badan air. Tanpa filtrasi, meski COD/BOD sudah memenuhi syarat, TSS bisa melebihi batas.',
    fix: 'Pasang penyaring mesh 100–200 µm di outlet reaktor sebelum effluen dibuang atau diproses lanjut menjadi POC.',
    scoreImpact: 0,
  },
];

// ── Stage 5 MCQ questions (self-evaluation questions) ─────────────────────────
export const stage5Questions = [
  {
    id: 'q1',
    question: `Setelah 7 hari percobaan, warna vinasse berubah dari hitam pekat menjadi
      coklat kekuningan. Namun nilai COD akhir masih 12.000 mg/L (baku mutu: 300 mg/L).
      Apa penyebab paling logis berdasarkan desain reaktormu?`,
    options: [
      {
        label: 'A',
        text: 'Azolla bekerja dengan baik tetapi waktu 7 hari terlalu singkat untuk menurunkan COD ke batas baku mutu.',
        correct: true,
      },
      {
        label: 'B',
        text: 'COD tidak bisa diturunkan dengan cara biologis; diperlukan proses kimia seperti koagulasi.',
        correct: false,
      },
      {
        label: 'C',
        text: 'Perubahan warna membuktikan COD sudah turun ke batas aman meski alat ukur salah.',
        correct: false,
      },
    ],
    explanation: `✅ <b>Tepat!</b> Perubahan warna (melanoidin terdegradasi) adalah indikator
      kualitatif yang baik, tetapi penurunan COD dari 80.000 ke baku mutu 300 mg/L membutuhkan
      efisiensi > 99.6%. Azolla hanya mampu mencapai ~96% dalam kondisi optimal — artinya
      perlakuan lanjutan (misal: koagulasi-flokulasi atau wetland buatan) masih diperlukan.`,
  },
  {
    id: 'q2',
    question: `Pada hari ke-2 percobaan, Azolla mulai menguning dan sebagian mengambang
      tak beraturan. Indikator mana yang PALING akurat menjelaskan kondisi ini?`,
    options: [
      {
        label: 'A',
        text: 'Azolla sudah selesai bekerja dan menguning adalah tahap akhir siklus hidupnya yang normal.',
        correct: false,
      },
      {
        label: 'B',
        text: 'pH vinasse terlalu asam (< 4.5) menyebabkan stres pada Azolla sehingga klorofil rusak dan daun menguning (klorosis).',
        correct: true,
      },
      {
        label: 'C',
        text: 'Aerasi yang terlalu kuat membuat Azolla berputar terus dan mengalami kerusakan mekanik.',
        correct: false,
      },
    ],
    explanation: `✅ <b>Benar!</b> Klorosis (daun menguning) pada Azolla adalah tanda stres pH.
      Azolla tumbuh optimal pada pH 5–7. Vinasse murni (pH 3–4) merusak membran sel dan
      menghambat sintesis klorofil. Solusinya: pre-treatment pH sebelum inokulasi.`,
  },
  {
    id: 'q3',
    question: `Sesuai dengan hasil pengukuran, nilai BOD akhir percobaan adalah 2.400 mg/L
      sementara COD akhir 8.000 mg/L. Rasio BOD/COD = 0.30. Apa kesimpulan yang dapat ditarik?`,
    options: [
      {
        label: 'A',
        text: 'Rasio BOD/COD < 0.4 menunjukkan bahwa sisa polutan masih bersifat sulit terurai (refractory) dan kurang biodegradabel.',
        correct: true,
      },
      {
        label: 'B',
        text: 'Rasio BOD/COD yang rendah berarti air sudah sangat bersih karena sebagian besar BOD sudah habis terdegradasi.',
        correct: false,
      },
      {
        label: 'C',
        text: 'BOD dan COD tidak memiliki hubungan matematis — kedua parameter diukur secara independen.',
        correct: false,
      },
    ],
    explanation: `✅ <b>Tepat!</b> Rasio BOD/COD mengindikasikan biodegradabilitas limbah.
      BOD/COD > 0.5 = mudah terurai secara biologis. BOD/COD = 0.3 menunjukkan sisa polutan
      bersifat <em>refractory</em> (sulit terurai) — kemungkinan sisa melanoidin dan
      senyawa fenolik yang tidak terdegradasi sempurna oleh Azolla. Perlakuan lanjutan
      seperti ozonasi atau UV diperlukan.`,
  },
];
