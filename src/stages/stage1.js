// Stage 1 – Vinasse Waste Pollution, Bekonang Industrial Area
export const stage1 = {
  id: 1,
  title: 'Level 1 – Pencemaran Limbah Vinasse',
  description: 'Kawasan industri ciu Bekonang, dekat Sungai Bengawan Solo',
  phenomena: [
    /* ─────────────────── FENOMENA 1 ─────────────────── */
    {
      id: 1,
      title: 'Fenomena 1',
      context: `Seorang peneliti lingkungan mengamati data kualitas air sungai di tiga stasiun pengamatan: hulu, tengah, dan hilir aliran anak Sungai Bengawan Solo yang berdekatan dengan pabrik etanol di Bekonang.`,
      tableData: {
        headers: ['Stasiun', 'Suhu (°C)', 'pH', 'DO (mg/L)', 'COD (mg/L)', 'TDS (mg/L)'],
        rows: [
          { label: 'Hulu',   values: ['30,39', '7,26', '8,38',  '80.000', '777'],   classes: ['', '', 'blue', '', ''] },
          { label: 'Tengah', values: ['31,17', '6,96', '1,90',  '90.000', '1.343'], classes: ['', '', 'red', '', 'red'] },
          { label: 'Hilir',  values: ['29,63', '7,36', '11,12', '100.000','1.300'], classes: ['', '', '', 'red', ''] },
        ],
        note: 'Biru: rata-rata terendah | Merah: rata-rata tertinggi. Sumber: Zahra, 2023',
      },
      question: `Berdasarkan data, Stasiun Tengah menunjukkan nilai TDS melonjak drastis menjadi 1.343 mg/L, namun nilai DO justru berada di angka 1,90 mg/L dengan COD 90.000 mg/L. Jika diketahui sumber pencemar adalah limbah vinasse yang kaya bahan organik, manakah evaluasi paling kritis mengenai data tersebut?`,
      options: [
        {
          label: 'A',
          text: 'Tingginya TDS disebabkan oleh mineral anorganik, sedangkan seluruh bakteri telah terurai oleh bakteri dari hulu ke tengah.',
          correct: false,
        },
        {
          label: 'B',
          text: 'Masuknya limbah vinasse seharusnya meningkatkan TDS, DO, dan COD secara simultan.',
          correct: false,
        },
        {
          label: 'C',
          text: 'TDS, COD, dan DO memiliki hubungan yang terbalik; semakin banyak zat terlarut, semakin sedikit oksigen yang dibutuhkan.',
          correct: false,
        },
        {
          label: 'D',
          text: 'Limbah organik vinasse berkontribusi pada kenaikan TDS dan COD. Jika TDS dan COD naik tajam karena limbah masuk, DO seharusnya turun drastis karena oksigen terpakai untuk dekomposisi bahan organik tersebut.',
          correct: true,
        },
      ],
      correctKey: 'D',
      explanation: `✅ <strong>Jawaban benar!</strong><br>Limbah organik vinasse meningkatkan TDS (padatan terlarut organik) dan COD (kebutuhan oksigen kimia). Bakteri pengurai mengonsumsi oksigen terlarut (DO) untuk mendekomposisi bahan organik tersebut, sehingga DO turun drastis di Stasiun Tengah — konsisten dengan data DO 1,90 mg/L.`,
    },

    /* ─────────────────── FENOMENA 2 ─────────────────── */
    {
      id: 2,
      title: 'Fenomena 2',
      context: `Berdasarkan data Stasiun Tengah: TDS = 1.343 mg/L, COD = 90.000 mg/L, dan DO = 1,90 mg/L. Komponen apakah yang paling dominan menyusun nilai TDS tersebut?`,
      tableData: null,
      standardTable: {
        title: 'Baku Mutu Air Limbah Industri Bir/Etanol (Permen LH No.5/2014)',
        headers: ['Parameter', 'Kadar Maks (mg/L)', 'Beban Maks (g/hL)'],
        rows: [
          ['BOD₅', '40', '24,0'],
          ['COD',   '100','60,0'],
          ['TSS',   '40', '24,0'],
          ['pH',    '6,0 – 9,0', '—'],
          ['Debit limbah maks', '—', '6 hL/hL produk'],
        ],
      },
      question: `Berdasarkan data Stasiun Tengah (TDS = 1.343 mg/L, COD = 90.000 mg/L, DO = 1,90 mg/L), komponen apakah yang paling dominan menyusun nilai TDS tersebut?`,
      options: [
        {
          label: 'A',
          text: 'Bakteri coliform dan mikroorganisme pengurai yang terlarut dalam air.',
          correct: false,
        },
        {
          label: 'B',
          text: 'Ion anorganik seperti K⁺, Ca²⁺, dan Cl⁻ yang tidak dapat dioksidasi secara kimia.',
          correct: true,
        },
        {
          label: 'C',
          text: 'Suspensi padatan lumpur yang belum mengendap dan terbawa aliran sungai.',
          correct: false,
        },
      ],
      correctKey: 'B',
      explanation: `✅ <strong>Jawaban benar!</strong><br>Limbah vinasse mengandung ion anorganik (K⁺, Ca²⁺, Cl⁻, dll.) yang terlarut sempurna dan tidak terdeteksi oleh uji COD. Ion-ion inilah yang mendominasi nilai TDS, sementara COD yang tinggi mencerminkan kandungan organik yang terpisah. Bakteri tidak diukur sebagai TDS, dan lumpur termasuk TSS bukan TDS.`,
    },

    /* ─────────────────── FENOMENA 3 ─────────────────── */
    {
      id: 3,
      title: 'Fenomena 3',
      context: `Perhatikan grafik produktivitas lahan persawahan padi di sekitar kawasan industri Bekonang yang mendapat paparan limbah vinasse:`,
      tableData: null,
      riceGraph: true,
      question: `Manakah interpretasi ilmiah yang paling tepat menjelaskan mekanisme penyebab fenomena perubahan hasil panen padi tersebut?`,
      options: [
        {
          label: 'A',
          text: 'Kenaikan hasil panen di Tahun ke-2 terjadi karena suplai bahan organik berada di bawah ambang batas pencemaran sehingga memperkaya hara tanah (N, P, K). Namun pada Tahun ke-3, akumulasi pH > 9 dan COD > 100 mg/L telah menyebabkan kerusakan jaringan akar padi.',
          correct: true,
        },
        {
          label: 'B',
          text: 'Penurunan hasil panen pada Tahun ke-3 disebabkan oleh kurangnya pasokan air, karena tingginya nilai COD menyebabkan air menjadi kental dan sulit diserap oleh akar tanaman.',
          correct: false,
        },
        {
          label: 'C',
          text: 'Peningkatan hasil panen pada Tahun ke-2 disebabkan oleh bakteri patogen dalam limbah yang memicu mutasi genetik pada padi menjadi varietas unggul, sedangkan penurunan di Tahun ke-3 adalah fase kematian alami bakteri tersebut.',
          correct: false,
        },
      ],
      correctKey: 'A',
      explanation: `✅ <strong>Jawaban benar!</strong><br>Pada Tahun ke-2, COD ~80 mg/L dan pH tanah ~8,6 masih dalam toleransi padi. Bahan organik vinasse mengandung N, P, dan K yang justru menyuburkan tanah. Tahun ke-3, saat COD >100 mg/L dan pH >9, kondisi tanah menjadi toksik: ion logam larut meracuni akar dan penyerapan Fosfor (P) terhambat, sehingga hasil panen anjlok.`,
    },
  ],
};
