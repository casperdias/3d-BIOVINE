// Quiz questions for each stage
export const stage1Questions = [
  {
    id: 'phenomenon1',
    title: 'Fenomena 1: Pencemaran Sungai',
    question: 'Apa yang menyebabkan sungai berubah warna menjadi coklat kehitaman dan berbau busuk?',
    options: [
      'A) Sampah plastik',
      'B) Limbah vinasse dari pabrik etanol',
      'C) Hujan deras',
      'D) Alga hijau'
    ],
    answer: 1, // index 1 = B
    explanation: 'Limbah vinasse mengandung BOD tinggi (28.000 mg/L) dan COD (45.000 mg/L) yang menyebabkan perubahan warna dan bau pada sungai.'
  },
  {
    id: 'phenomenon2',
    title: 'Fenomena 2: Kerusakan Tanah',
    question: 'Mengapa tanah di sekitar pabrik menjadi keras dan tidak subur?',
    options: [
      'A) Kurang air',
      'B) Terlalu banyak pupuk',
      'C) Limbah vinasse dengan pH sangat asam (4-4.5)',
      'D) Perubahan iklim'
    ],
    answer: 2, // index 2 = C
    explanation: 'Vinasse memiliki pH 4-4.5 yang sangat asam, merusak struktur tanah dan mematikan mikroorganisme tanah yang bermanfaat.'
  },
  {
    id: 'phenomenon3',
    title: 'Fenomena 3: Bau Tidak Sedap',
    question: 'Apa yang menyebabkan bau tidak sedap di sekitar pabrik fermentasi bioetanol?',
    options: [
      'A) Asap kendaraan',
      'B) Pembakaran sampah',
      'C) Gas metana dan H₂S dari limbah vinasse',
      'D) Pestisida'
    ],
    answer: 2, // index 2 = C
    explanation: 'Proses dekomposisi anaerobik limbah vinasse menghasilkan gas metana (CH₄) dan hidrogen sulfida (H₂S) yang berbau sangat menyengat.'
  }
];

export const stage2Data = {
  initial: { cod: 45000, bod: 28000, ph: 4.2 },
  afterAeration: { cod: 38000, bod: 22000, ph: 4.8 },
  withMicrobes: { cod: 250, bod: 120, ph: 7.2 },
  standard: { cod: 300, bod: 150, ph: '6-9' }
};

export const stage4Questions = [
  {
    id: 'eval1',
    title: 'Evaluasi: Kegagalan Percobaan',
    question: 'Jika nilai COD tidak turun setelah penambahan bakteri, kemungkinan penyebabnya adalah?',
    options: [
      'A) Terlalu banyak air',
      'B) Kondisi pH terlalu asam sehingga bakteri tidak aktif',
      'C) Suhu terlalu dingin',
      'D) Bakteri terlalu banyak'
    ],
    answer: 1,
    explanation: 'Bakteri memerlukan pH optimal 6-7 untuk bekerja efektif. Pada pH 4.2, bakteri tidak dapat berkembang dan bekerja dengan baik.'
  },
  {
    id: 'eval2',
    title: 'Evaluasi: Optimasi Proses',
    question: 'Apa langkah pertama yang harus dilakukan sebelum menambahkan bakteri ke limbah vinasse?',
    options: [
      'A) Menambahkan gula',
      'B) Memanaskan limbah',
      'C) Menetralkan pH dengan penambahan kapur (CaCO₃)',
      'D) Menyaring limbah'
    ],
    answer: 2,
    explanation: 'Penetralan pH dengan CaCO₃ sangat penting untuk menciptakan kondisi optimal bagi pertumbuhan bakteri pengolah limbah.'
  }
];
