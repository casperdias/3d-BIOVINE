// ─────────────────────────────────────────────────────────────────────────────
// Stage 6 – Memberikan Rekomendasi Perbaikan Final
// Produk akhir: Pupuk Organik Cair (POC) — presentasi & rekomendasi
// ─────────────────────────────────────────────────────────────────────────────

// ── POC product data ──────────────────────────────────────────────────────────
export const pocProduct = {
  name: 'Pupuk Organik Cair (POC) Berbasis Vinasse',
  emoji: '🧴',
  description: `Vinasse yang telah diolah dengan Azolla microphylla menghasilkan cairan
    yang kaya unsur hara: nitrogen (N), fosfor (P), kalium (K), kalsium (Ca), dan
    magnesium (Mg) — sangat cocok sebagai pupuk organik cair (POC) untuk tanaman.`,
  nutrients: [
    { name: 'Nitrogen (N)',  value: '0.4–1.2%',  icon: '🌱' },
    { name: 'Fosfor (P₂O₅)', value: '0.3–0.8%', icon: '💜' },
    { name: 'Kalium (K₂O)',  value: '3.0–6.5%',  icon: '🟡' },
    { name: 'Kalsium (Ca)', value: '0.2–0.5%',   icon: '🔵' },
    { name: 'Magnesium (Mg)', value: '0.1–0.3%', icon: '🟢' },
  ],
  usageInstructions: [
    { step: 1, desc: 'Encerkan POC 1:10 dengan air bersih (10 mL POC + 90 mL air).' },
    { step: 2, desc: 'Siramkan ke area perakaran tanaman pada pagi atau sore hari.' },
    { step: 3, desc: 'Frekuensi: 1–2 kali seminggu selama masa pertumbuhan vegetatif.' },
    { step: 4, desc: 'Simpan POC dalam botol gelap, jauhkan dari sinar matahari langsung.' },
  ],
  citation: 'Bekonang ethanol distillery (PTPN XI); Marcelino et al., 2019; Rizky et al., 2017',
};

// ── Presentation slide data ───────────────────────────────────────────────────
export const presentationSlides = [
  {
    id: 'slide_1',
    title: 'Slide 1: Pendahuluan & Latar Belakang',
    icon: '📋',
    checklist: [
      'Apa itu vinasse dan mengapa berbahaya?',
      'Berapa kadar COD/BOD awal vinasse dari Pabrik Bekonang?',
      'Mengapa bioremediasi dipilih sebagai solusi?',
    ],
    sampleContent: `<b>Vinasse</b> adalah limbah cair hasil distilasi etanol dari molasses tebu.
      Pabrik Bekonang (PTPN XI) menghasilkan ~12 L vinasse per liter etanol. Kadar COD
      vinasse: 60.000–100.000 mg/L, jauh di atas baku mutu (300 mg/L). Pembuangan
      langsung ke sungai menyebabkan <em>eutrofikasi, kematian biota air,</em> dan
      pencemaran air tanah.`,
  },
  {
    id: 'slide_2',
    title: 'Slide 2: Metode Percobaan',
    icon: '🔬',
    checklist: [
      'Alat dan bahan yang digunakan',
      'Prosedur inokulasi Azolla',
      'Parameter yang diukur (COD, BOD, pH)',
      'Variasi konsentrasi Azolla yang diuji',
    ],
    sampleContent: `<b>Variabel bebas:</b> Konsentrasi Azolla (50, 100, 200 g/L vinasse).
      <b>Variabel terikat:</b> COD, BOD, pH akhir setelah 7 hari. <b>Kontrol:</b> vinasse
      tanpa Azolla. <b>Alat:</b> aquarium 20 L, 2 aerator, grow-light 1500 lux, pH meter,
      kit titrasi COD/BOD.`,
  },
  {
    id: 'slide_3',
    title: 'Slide 3: Hasil Percobaan',
    icon: '📊',
    checklist: [
      'Tabel COD, BOD, pH awal vs akhir',
      'Grafik penurunan COD per hari',
      'Foto perubahan warna vinasse',
      'Pengamatan kondisi Azolla',
    ],
    sampleContent: `
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:6px">
        <thead><tr style="background:rgba(0,150,80,0.2)">
          <th style="padding:5px 8px">Parameter</th>
          <th style="padding:5px 8px">Awal</th>
          <th style="padding:5px 8px">Akhir (7 hari)</th>
          <th style="padding:5px 8px">Efisiensi</th>
        </tr></thead>
        <tbody>
          <tr><td style="padding:4px 8px">COD (mg/L)</td><td>80.000</td><td>3.200</td><td style="color:#40ff80">96%</td></tr>
          <tr><td style="padding:4px 8px">BOD (mg/L)</td><td>40.000</td><td>2.400</td><td style="color:#40ff80">94%</td></tr>
          <tr><td style="padding:4px 8px">pH</td><td>3.5</td><td>6.8</td><td style="color:#40ff80">✔ Membaik</td></tr>
        </tbody>
      </table>
    `,
  },
  {
    id: 'slide_4',
    title: 'Slide 4: Produk POC & Manfaatnya',
    icon: '🧴',
    checklist: [
      'Kandungan nutrisi POC (N, P, K)',
      'Cara penggunaan POC',
      'Jenis tanaman yang cocok',
      'Perbandingan dengan pupuk kimia konvensional',
    ],
    sampleContent: `POC dari vinasse yang telah diolah mengandung K₂O 3–6.5% — lebih tinggi
      dari kebanyakan POC komersial. Kalium berperan penting dalam pembentukan umbi dan
      buah tanaman. Cocok digunakan untuk: <b>padi, tebu, sayuran, dan tanaman hortikultura.</b>
      Biaya produksi POC ~Rp 500/liter vs pupuk kalium konvensional ~Rp 8.000/kg.`,
  },
  {
    id: 'slide_5',
    title: 'Slide 5: Kesimpulan & Rekomendasi',
    icon: '✅',
    checklist: [
      'Apakah hipotesis terbukti?',
      'Keterbatasan penelitian',
      'Rekomendasi untuk skala industri',
      'Potensi ekonomi circular economy',
    ],
    sampleContent: `<b>Kesimpulan:</b> Bioremediasi dengan Azolla microphylla berhasil menurunkan
      COD vinasse hingga 96% dalam 7 hari — mendukung hipotesis awal. <b>Rekomendasi:</b>
      (1) Gunakan kolam terbuka dengan sinar matahari langsung untuk skala besar.
      (2) Integrasikan dengan Chlorella vulgaris untuk meningkatkan kadar N dan P pada POC.
      (3) Implementasikan di Pabrik Bekonang sebagai program <em>circular economy</em>:
      vinasse → bioremediasi → POC → pupuk kebun tebu.`,
  },
];

// ── Final MCQ (reflection questions) ─────────────────────────────────────────
export const stage6FinalQuiz = [
  {
    id: 'fq1',
    question: `POC dari vinasse mengandung K₂O (kalium) yang sangat tinggi (3–6.5%).
      Mengapa kalium yang tinggi dalam POC ini sangat menguntungkan jika digunakan
      sebagai pupuk pada perkebunan tebu di sekitar Pabrik Bekonang?`,
    options: [
      {
        label: 'A',
        text: 'Kalium membantu penyerapan air oleh akar, tetapi tidak berpengaruh pada pembentukan gula dalam batang tebu.',
        correct: false,
      },
      {
        label: 'B',
        text: 'Kalium berperan kunci dalam translokasi sukrosa dari daun ke batang dan pembentukan dinding sel — langsung meningkatkan rendemen gula tebu.',
        correct: true,
      },
      {
        label: 'C',
        text: 'Kalium dalam POC vinasse berbentuk KCl yang bersifat toksik jika dosisnya terlalu tinggi dan selalu merusak tanaman.',
        correct: false,
      },
    ],
    explanation: `✅ <b>Tepat!</b> Kalium (K⁺) adalah kation paling penting dalam produksi tebu.
      Ia mengaktifkan enzim sukrosa sintase dan membantu translokasi hasil fotosintesis
      (sukrosa) dari source (daun) ke sink (batang). Kandungan K₂O tinggi dalam POC
      vinasse menciptakan <em>circular economy</em> yang sempurna: limbah pabrik etanol
      kembali menjadi pupuk untuk kebun tebu yang menghasilkan molasses bahan baku etanol.`,
  },
  {
    id: 'fq2',
    question: `Jika efisiensi penurunan COD oleh Azolla adalah 96% (dari 80.000 mg/L
      menjadi 3.200 mg/L), tetapi baku mutu pembuangan limbah adalah 300 mg/L —
      apa rekomendasi yang paling tepat untuk mencapai baku mutu tersebut?`,
    options: [
      {
        label: 'A',
        text: 'Menambah lebih banyak Azolla karena efisiensi 96% berarti hanya perlu ditambah 4% lagi.',
        correct: false,
      },
      {
        label: 'B',
        text: 'Menerapkan sistem pengolahan bertahap: bioremediasi Azolla sebagai primary treatment, dilanjutkan koagulasi-flokulasi atau wetland buatan sebagai polishing step.',
        correct: true,
      },
      {
        label: 'C',
        text: 'COD 3.200 mg/L sudah aman karena sudah jauh turun dari 80.000 mg/L, sehingga bisa langsung dibuang ke sungai.',
        correct: false,
      },
    ],
    explanation: `✅ <b>Benar!</b> Bioremediasi biologis umumnya efektif sebagai
      <em>primary/secondary treatment</em> tetapi sulit mencapai efisiensi > 99% yang
      dibutuhkan untuk baku mutu sangat ketat (300 mg/L). Sistem <em>multi-stage</em>
      yang menggabungkan bioremediasi + koagulasi (tawas/PAC) + filtrasi atau
      <em>constructed wetland</em> adalah solusi realistis untuk industri.`,
  },
  {
    id: 'fq3',
    question: `Dalam konsep <em>circular economy</em>, manfaat ganda apa yang diperoleh
      jika vinasse dari Pabrik Bekonang diubah menjadi POC yang digunakan kembali
      di kebun tebu?`,
    options: [
      {
        label: 'A',
        text: 'Hanya manfaat lingkungan — mengurangi limbah cair yang mencemari Sungai Bengawan Solo.',
        correct: false,
      },
      {
        label: 'B',
        text: 'Hanya manfaat ekonomi — mengurangi biaya pembelian pupuk kimia kalium.',
        correct: false,
      },
      {
        label: 'C',
        text: 'Manfaat ganda: (1) lingkungan — mengurangi pencemaran sungai; (2) ekonomi — penghematan pupuk; (3) pertanian — meningkatkan kesuburan tanah kebun tebu secara organik.',
        correct: true,
      },
    ],
    explanation: `✅ <b>Benar!</b> Konsep <em>circular economy</em> pada vinasse-POC mencakup
      tiga dimensi sekaligus: <b>planet</b> (zero liquid discharge, tidak ada limbah ke sungai),
      <b>profit</b> (nilai ekonomi POC kalium tinggi ≈ Rp 2–4 juta/ton), dan <b>people</b>
      (petani tebu mendapat pupuk murah organik yang meningkatkan produktivitas lahan
      jangka panjang tanpa ketergantungan pupuk kimia).`,
  },
];

// ── Recommendation cards (shown at end) ──────────────────────────────────────
export const recommendations = [
  {
    icon: '🏭',
    title: 'Skala Industri',
    text: 'Terapkan sistem bioremediasi Azolla bertingkat (cascade pond) di Pabrik Bekonang untuk mengolah 40 m³ vinasse/hari.',
  },
  {
    icon: '🌾',
    title: 'Distribusi POC',
    text: 'Distribusikan POC vinasse ke petani tebu mitra PTPN XI sebagai substitusi pupuk KCl dengan harga terjangkau.',
  },
  {
    icon: '🔬',
    title: 'Penelitian Lanjutan',
    text: 'Kombinasikan Azolla + Chlorella dalam sistem co-culture untuk meningkatkan kadar N dan P pada POC.',
  },
  {
    icon: '♻️',
    title: 'Circular Economy',
    text: 'Dokumentasikan model bisnis: tebu → molasses → etanol → vinasse → POC → tebu. Daftarkan sebagai program PROPER KLHK.',
  },
];
