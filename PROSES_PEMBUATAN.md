# 🎮 Proses Pembuatan Game 3D-BIOVINE
### *Game Edukasi Interaktif Pencemaran Limbah Vinasse & Bioremediasi*

---

## Daftar Isi

1. [Latar Belakang & Tujuan](#1-latar-belakang--tujuan)
2. [Riset & Perencanaan Konten](#2-riset--perencanaan-konten)
3. [Perancangan Desain Game (GDD)](#3-perancangan-desain-game-gdd)
4. [Pemilihan Teknologi & Setup Proyek](#4-pemilihan-teknologi--setup-proyek)
5. [Arsitektur Kode](#5-arsitektur-kode)
6. [Pembuatan Dunia 3D — Per Stage](#6-pembuatan-dunia-3d--per-stage)
7. [Sistem Karakter & Kontrol](#7-sistem-karakter--kontrol)
8. [Sistem Soal & Poin](#8-sistem-soal--poin)
9. [Simulasi Interaktif (Stage 2)](#9-simulasi-interaktif-stage-2)
10. [Sistem Toko & Drag-to-Pour (Stage 3)](#10-sistem-toko--drag-to-pour-stage-3)
11. [IPAL Builder (Stage 4)](#11-ipal-builder-stage-4)
12. [Evaluasi & Presentasi (Stage 5 & 6)](#12-evaluasi--presentasi-stage-5--6)
13. [Sistem Tabrakan (Collision)](#13-sistem-tabrakan-collision)
14. [Antarmuka Pengguna (UI/HUD)](#14-antarmuka-pengguna-uihud)
15. [Database Lokal & Leaderboard](#15-database-lokal--leaderboard)
16. [Pengujian & Iterasi](#16-pengujian--iterasi)
17. [Build & Deployment](#17-build--deployment)

---

## 1. Latar Belakang & Tujuan

### Konteks Masalah

Desa Bekonang, Sukoharjo, merupakan kawasan industri etanol tradisional (*ciu*) yang sudah ada sejak zaman kolonial. Proses fermentasi dan distilasi molases (tetes tebu) menghasilkan limbah cair bernama **vinasse** — cairan berwarna hitam pekat, berbau menyengat, dan mengandung bahan organik tinggi dengan COD bisa mencapai 80.000–100.000 mg/L.

Limbah ini dibuang langsung ke anak Sungai Bengawan Solo tanpa pengolahan, menyebabkan:
- Nilai DO (Dissolved Oxygen) turun drastis → ikan mati
- TDS (Total Dissolved Solids) melonjak
- Produktivitas lahan persawahan di sekitar kawasan menurun

{Image: Peta kawasan industri ciu di Desa Bekonang, Sukoharjo}

{Image: Foto kondisi sungai yang tercemar limbah vinasse — air hitam pekat}

### Tujuan Game

Game **3D-BIOVINE** dirancang sebagai media pembelajaran berbasis *Problem-Based Learning* (PBL) untuk siswa SMA/mahasiswa, dengan tujuan:

1. Memahami parameter kualitas air (COD, BOD, DO, TDS, pH)
2. Mengidentifikasi dampak pencemaran limbah industri
3. Merancang solusi bioremediasi menggunakan mikroorganisme
4. Mensimulasikan desain reaktor IPAL sederhana
5. Mempresentasikan rekomendasi perbaikan lingkungan

---

## 2. Riset & Perencanaan Konten

### Pengumpulan Data Ilmiah

Sebelum baris kode pertama ditulis, dilakukan kajian literatur intensif:

| Sumber | Data yang Diambil |
|--------|-------------------|
| Zahra (2023) | Data kualitas air sungai: hulu, tengah, hilir — COD, DO, TDS, pH |
| Wijayanti et al. (2024) | Karakteristik fisik-kimia limbah vinasse Bekonang |
| Budiyono et al. (2013) | Bakteri metanogenik: *Methanomicrobium*, *Methanosarcina* |
| Haryati (2006) | Komposisi mikroba dalam limbah vinasse |
| Permen LH No. 5/2014 | Baku mutu effluent: COD ≤ 100 mg/L, BOD ≤ 40 mg/L |
| Thepsilvisut et al. (2024) | *Azolla microphylla* sebagai agen fitoremediasi |
| Rahmanta et al. (2025) | *Chlorella vulgaris* untuk degradasi melanoidin |

### Pengukuran Laboratorium

Tim melakukan pengukuran langsung menggunakan **TDS/DO Meter** pada sampel vinasse dengan volume berbeda, menghasilkan data yang dipakai dalam simulasi game:

| Volume Vinasse | DO (ppm) | TDS (ppm) | pH | Salinometer (‰) |
|:--------------:|:--------:|:---------:|:--:|:----------------:|
| 200 mL | 1,8 | 22 | 2,2 | 13 |
| 400 mL | 2,3 | 26 | 2,8 | 13,8 |
| 600 mL | 3,2 | 27 | 3,0 | 14 |
| 800 mL | 4,0 | 30,1 | 3,7 | 15 |

{Image: Dokumentasi pengukuran di laboratorium — TDS/DO Meter dicelupkan ke dalam sampel vinasse}

### Perancangan Kurikulum Game

Seluruh alur permainan mengikuti siklus **Problem-Based Learning**:

```
Identifikasi Masalah → Menemukan Akar Masalah → Menentukan Solusi
       ↓                                                ↓
Memberikan Rekomendasi ← Evaluasi ← Merancang Prototype
```

{Image: Diagram alur PBL yang menjadi kerangka desain game}

---

## 3. Perancangan Desain Game (GDD)

### Dokumen Rancangan (*Game Design Document*)

Sebelum pengembangan, seluruh konten ditulis dalam dokumen rancangan (`RancanganVR.md`) yang mencakup:

- Narasi per stage
- Soal-soal beserta kunci jawaban dan penjelasan
- Spesifikasi teknis karakter dan kontrol
- Diagram tata letak ruangan 3D

{Image: Screenshot dokumen RancanganVR.md — halaman pertama}

### Enam Stage Permainan

| Stage | Judul | Lokasi | Kompetensi |
|:-----:|-------|--------|-----------|
| 1 | The Investigator | Lab Sains | Identifikasi parameter pencemaran |
| 2 | Akar Masalah | Pabrik Etanol | Simulasi COD/BOD, proses destilasi |
| 3 | Menentukan Solusi | Kolam Remediasi | Pemilihan mikroorganisme, bioremediasi |
| 4 | Merancang Prototype | Workshop IPAL | Desain reaktor, pemilihan alat-bahan |
| 5 | Evaluasi | Lab Observasi | Analisis kegagalan percobaan |
| 6 | Rekomendasi | Ruang Kelas | Presentasi hasil akhir (POC) |

### Sistem Poin

```
Percobaan ke-1 benar  → 100 poin
Percobaan ke-2 benar  →  50 poin  (terpotong 50%)
Percobaan ke-3 benar  →  25 poin  (terpotong lagi)
Lebih dari 3 percobaan → permainan melanjutkan dengan poin minimum
```

---

## 4. Pemilihan Teknologi & Setup Proyek

### Stack Teknologi

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| **Three.js** | 0.160 | Rendering 3D (WebGL) |
| **Vite** | 5.x | Build tool, dev server dengan HMR |
| **JavaScript ES Modules** | — | Arsitektur modular |
| **HTML/CSS** | — | UI overlay (panel soal, HUD, simulasi) |
| **localStorage** | — | Simpan checkpoint & leaderboard |

Three.js dipilih karena ringan, tidak perlu server backend, dan bisa berjalan langsung di browser siswa tanpa instalasi.

### Inisialisasi Proyek

```bash
# Buat proyek Vite baru
npm create vite@latest 3d-BIOVINE -- --template vanilla

# Masuk direktori
cd 3d-BIOVINE

# Install dependencies
npm install three

# Jalankan dev server
npm run dev
```

{Image: Terminal menampilkan dev server Vite berjalan di localhost:5173}

### Struktur Direktori Akhir

```
3d-BIOVINE/
├── index.html          ← Entry point game
├── admin.html          ← Panel admin & leaderboard
├── package.json
├── vite.config.js
├── public/
│   └── synopsis/       ← Aset video/gambar statis
└── src/
    ├── main.js         ← Loop utama renderer & transisi level
    ├── state.js        ← Status global pemain
    ├── player.js       ← Karakter & kontrol (WASD + joystick)
    ├── collision.js    ← Sistem AABB collision
    ├── ui.js           ← Panel soal, HUD, layar profil
    ├── simulation.js   ← Simulasi interaktif Stage 2
    ├── stage3UI.js     ← UI toko & drag-to-pour Stage 3
    ├── stage4UI.js     ← IPAL Builder Stage 4
    ├── stage5UI.js     ← Panel evaluasi Stage 5
    ├── db.js           ← localStorage (checkpoint & leaderboard)
    ├── sheets.js       ← (opsional) Google Sheets integration
    ├── world.js        ← Dunia 3D Stage 1 (Lab)
    ├── world2.js       ← Dunia 3D Stage 2 (Pabrik)
    ├── world3.js       ← Dunia 3D Stage 3 (Kolam)
    ├── world4.js       ← Dunia 3D Stage 4 (Workshop)
    ├── world5.js       ← Dunia 3D Stage 5 (Lab Observasi)
    ├── style.css       ← Style global
    ├── data/
    │   ├── stage1_questions.json   ← Soal Stage 1
    │   └── stage2_questions.json   ← Soal Stage 2
    └── stages/
        ├── stage1.js   ← Logika konten Stage 1
        ├── stage2.js   ← Kalkulasi COD/BOD/pH
        ├── stage3.js   ← Data mikroorganisme & kalkulasi dosis
        ├── stage4.js   ← Data alat-bahan & evaluasi reaktor
        └── stage5.js   ← Skenario kegagalan
```

---

## 5. Arsitektur Kode

### Pola Desain Utama

Game menggunakan pola **module-per-concern** — setiap file bertanggung jawab atas satu aspek:

```
main.js  (orkestrator)
   ├── world*.js         → Three.js geometry & lighting
   ├── player.js         → Input & animasi karakter
   ├── collision.js      → Fisika tabrakan
   ├── ui.js / *UI.js    → Panel HTML overlay
   ├── stages/stage*.js  → Data konten & kalkulasi
   └── state.js          → Satu-satunya sumber kebenaran (single source of truth)
```

### Objek State Global

Semua progres pemain disimpan dalam satu objek `state` yang diekspor dari `state.js`:

```javascript
export const state = {
  playerName: '',
  currentLevel: 1,
  totalPoints: 0,
  levelAttempts: 0,
  sim: {               // Data simulasi Stage 2
    vinasseVol: null,
    initialCOD: null,
    ...
  },
  stage3: {            // Data Stage 3 (toko mikroorganisme)
    purchasedOrganism: null,
    valveOpened: false,
    ...
  },
  stage4: { ... },     // Data Stage 4 (IPAL builder)
  stage5: { ... },     // Data Stage 5 (evaluasi)
  completedRooms: [],  // Room hub tracking
};
```

### Animation Loop

`main.js` menjalankan loop render Three.js standar dengan delta time:

```javascript
function animate(timestamp) {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  
  player.update(delta);          // gerakkan karakter
  animateObjects(delta);          // animasikan objek interaktif
  checkInteractions();            // cek proximity trigger
  renderer.render(activeScene, camera);
}
```

{Image: Diagram alur animation loop — dari input hingga render}

---

## 6. Pembuatan Dunia 3D — Per Stage

### Filosofi Desain Visual

Semua objek 3D dibuat **secara prosedural** menggunakan primitif Three.js (`BoxGeometry`, `CylinderGeometry`, `SphereGeometry`) — tanpa file model eksternal (.glb/.fbx). Pendekatan ini menjaga ukuran bundle tetap kecil dan memudahkan iterasi cepat.

Palet warna tiap ruangan dibedakan untuk memberi nuansa berbeda:

| Stage | Palet Warna | Suasana |
|-------|-------------|---------|
| 1 — Lab | Biru-putih dingin | Saintifik, steril |
| 2 — Pabrik | Coklat-oranye | Industrial, hangat |
| 3 — Kolam | Hijau-coklat | Alam, outdoor |
| 4 — Workshop | Abu-baja | Teknis, workshop |
| 5 — Lab Obs. | Ungu gelap | Analitis, misterius |

---

### Stage 1 — Lab Sains (`world.js`)

{Image: Screenshot Stage 1 — ruangan lab dengan meja kerja dan objek soal mengambang}

Ruangan berukuran 60×40 unit dengan elemen utama:
- **3 meja lab tengah** — sebagai penanda zona navigasi
- **Meja dinding kiri-kanan** — bookshelves & rak peralatan
- **Lemari asam (fume hood)** — di sudut belakang
- **3 objek soal mengambang** — dipresentasikan sebagai bola berputar, masing-masing merepresentasikan satu fenomena pencemaran

Setiap objek soal punya animasi `animateQuestionObjects()` yang memutar bola perlahan dan membuat efek hover naik-turun.

---

### Stage 2 — Pabrik Etanol (`world2.js`)

{Image: Screenshot Stage 2 — pabrik dengan drum fermentor, destilator, dan kompor pemanas}

Elemen pabrik yang dibangun secara prosedural:

| Objek | Posisi | Geometri |
|-------|--------|----------|
| Drum Fermentor | (-18, 6) | Cylinder r=2.8 |
| Destilator (kolom distilasi) | (0, -12) | Cylinder r=1.5, tinggi |
| Kompor Pemanas | (18, 6) | Box 3.5×3 dengan material oranye |
| Barrel Molasses | (-26, -12) | Cylinder kecil berjejer |
| Rak NPK/Ragi | (28, -13) | Box bertumpuk |
| Uap destilasi | (0, -12) | Partikel setengah transparan |

---

### Stage 3 — Kolam Remediasi (`world3.js`)

{Image: Screenshot Stage 3 — kolam vinasse berwarna coklat dengan kran dan pipa}

Elemen utama:
- **Kolam vinasse** — bidang datar dengan material reflektif coklat kehitaman
- **Kran (valve object)** — objek interaktif yang bisa diputar pemain
- **Pipa inlet/outlet** — terhubung ke kolam
- Animasi `animateValveObject()` memutar handle kran saat aktif

---

### Stage 4 — Workshop IPAL (`world4.js`)

{Image: Screenshot Stage 4 — meja workshop dengan terminal komputer dan rak alat}

- **Meja kerja** dengan alat-alat yang tersusun
- **Terminal komputer** — objek interaktif untuk membuka IPAL Builder UI
- Animasi `animateTerminalObject()` membuat layar monitor berkedip

---

### Stage 5 — Lab Observasi (`world5.js`)

{Image: Screenshot Stage 5 — lab dengan mikroskop dan papan analisis}

- **Mikroskop** — objek interaktif utama (trigger untuk buka panel evaluasi)
- **Papan tulis** — menampilkan data percobaan yang "gagal"
- Animasi `animateScopeObject()` menggerakkan lensa mikroskop

---

## 7. Sistem Karakter & Kontrol

### Representasi Karakter (`player.js`)

Karakter pemain dibangun dari primitif Three.js membentuk figur humanoid sederhana:

```
  [kepala - sphere]
       |
  [badan - box]
  /           \
[lengan kiri]  [lengan kanan]
      |
[kaki kiri] [kaki kanan]
```

{Image: Karakter pemain tampak dari berbagai sudut}

### Sistem Input

Game mendukung **tiga mode input** secara bersamaan:

**1. Keyboard (WASD/Arrow Keys)**
```
W / ↑  → Maju
S / ↓  → Mundur
A / ←  → Geser kiri
D / →  → Geser kanan
E      → Interact (saat dekat objek)
```

**2. Virtual Joystick (Mobile/Touch)**

Untuk perangkat mobile, joystick virtual ditampilkan di sudut kiri bawah layar. Pemain menyentuh base joystick dan menggeser untuk mengontrol arah. Sumbu joystick dinormalisasi ke rentang `-1.0` hingga `1.0`.

{Image: Tampilan mobile controls — joystick virtual di layar smartphone}

**3. Gamepad (Controller)**

Support gamepad analog dengan dead-zone handling agar pergerakan halus dan tidak ada drift.

### Animasi Berjalan

Karakter menggunakan **procedural walk animation** — kaki dan lengan berayun berdasarkan nilai `_walkCycle` yang terus bertambah selama pemain bergerak:

```javascript
this._walkCycle += delta * moveSpeed * 4.0;
leftLeg.rotation.x  = Math.sin(this._walkCycle) * 0.4;
rightLeg.rotation.x = Math.sin(this._walkCycle + Math.PI) * 0.4;
leftArm.rotation.x  = Math.sin(this._walkCycle + Math.PI) * 0.3;
rightArm.rotation.x = Math.sin(this._walkCycle) * 0.3;
```

---

## 8. Sistem Soal & Poin

### Format Data Soal

Soal untuk Stage 1 dan 2 disimpan di file JSON terpisah (`src/data/stage1_questions.json`, `stage2_questions.json`):

```json
{
  "id": "s1q1",
  "title": "Fenomena 1 — Kualitas Air Sungai",
  "context": "Seorang peneliti mengamati data kualitas air...",
  "question": "Manakah evaluasi paling kritis mengenai data tersebut?",
  "tableData": [...],
  "options": [
    { "label": "A", "text": "...", "correct": false,
      "explanation": "..." },
    { "label": "B", "text": "...", "correct": true,
      "explanation": "✅ Benar! Limbah organik vinasse seharusnya..." },
    { "label": "C", "text": "...", "correct": false,
      "explanation": "..." }
  ]
}
```

### Alur Menjawab Soal

```
Pemain mendekati objek soal
        ↓
Panel soal muncul (HTML overlay)
        ↓
Pemain memilih jawaban
        ↓
   ┌─ Benar ─────────────────────────────────────┐
   │  + Tambah poin (100/50/25 sesuai percobaan) │
   │  + Tampilkan penjelasan ✅                  │
   │  + Lanjut ke soal berikutnya                │
   └─────────────────────────────────────────────┘
   ┌─ Salah ─────────────────────────────────────┐
   │  - Kurangi poin maksimum berikutnya          │
   │  + Tampilkan penjelasan ⛔                  │
   │  + Coba lagi (max 3x)                       │
   └─────────────────────────────────────────────┘
```

{Image: Screenshot panel soal dengan tabel data dan pilihan jawaban A/B/C}

---

## 9. Simulasi Interaktif (Stage 2)

Ini adalah bagian paling kompleks secara teknis — sebuah **mini-lab interaktif** yang mensimulasikan pengukuran dan aerasi vinasse.

### Empat Langkah Simulasi

```
[Step 1: Tuang Vinasse] → [Step 2: Ukur Parameter] → [Step 3: Aerasi] → [Step 4: Hasil]
```

---

### Step 1 — Drag-to-Pour Vinasse

{Image: Screenshot Step 1 — enam gelas berisi vinasse, tank di kanan, ghost gelas saat diseret}

Pemain memilih volume vinasse (200–800 mL), lalu **menyeret gelas-gelas** ke dalam tank menggunakan mouse/sentuhan.

**Mekanisme ghost div:**
```javascript
// Ghost mengikuti kursor, di-append ke document.body
// agar tidak ter-clip oleh overflow:hidden parent
const ghost = document.createElement('div');
ghost.className = 'sim-glass-ghost';
document.body.appendChild(ghost);

window.addEventListener('mousemove', (e) => {
  ghost.style.left = e.clientX + 'px';
  ghost.style.top  = e.clientY + 'px';
});
```

Saat ghost berada di atas tank, cairan dalam gelas "mengalir" ke tank secara bertahap.

---

### Step 2 — TDS/DO Meter Dip (Drag Probe)

{Image: Screenshot Step 2 — display unit (kiri) terhubung kabel ke probe, probe diseret ke beaker}

Desain menggunakan **dua tongkat** yang terhubung kabel SVG dekoratif:

- **Tongkat kiri** — unit display (statis): layar LCD hijau menampilkan pembacaan DO, TDS, pH, SAL
- **Tongkat kanan** — probe sensor (bisa diseret): pemain menyeretnya ke dalam beaker vinasse

Ketika probe dijatuhkan ke beaker:
1. Beaker berpendar hijau (`drop-hover` CSS)
2. Efek ripple pada permukaan cairan
3. Angka pada layar display **count-up** dari 0 ke nilai sebenarnya (animasi easing)
4. Kartu hasil muncul dengan status (danger/warn/good)

{Image: Screenshot setelah pengukuran — kartu DO, TDS, pH, Salinometer dengan kode warna merah/kuning/hijau}

---

### Step 3 — Simulasi Aerasi

{Image: Screenshot Step 3 — tank aerasi dengan gelembung udara dan animasi aerator}

Pemain mengaktifkan aerator dan memilih durasi aerasi (6, 12, 18, 24, 36, 48 jam). Semakin lama aerasi, semakin besar penurunan COD/BOD (dihitung di `stage2.js`).

**Formula kalkulasi aerasi:**
```javascript
// Efisiensi removal meningkat logaritmik terhadap durasi
const removalRate = 1 - Math.exp(-k * hours);
const finalCOD = initialCOD * (1 - removalRate * maxCODRemoval);
const finalBOD = initialBOD * (1 - removalRate * maxBODRemoval);
```

---

### Step 4 — Hasil Akhir

{Image: Screenshot Step 4 — tiga kartu ringkasan: volume vinasse, hasil meter, durasi aerasi + banner kepatuhan}

Menampilkan tiga kartu ringkasan:
1. 🧪 **Vinasse Dituang** — volume dalam mL
2. 📏 **Hasil TDS/DO Meter** — DO · TDS · pH · Salinometer
3. ⏱️ **Durasi Aerasi** — dalam jam

Banner di bawah menunjukkan apakah effluent **MEMENUHI** atau **BELUM MEMENUHI** baku mutu Permen LH No. 5/2014.

---

## 10. Sistem Toko & Drag-to-Pour (Stage 3)

### Toko Mikroorganisme

{Image: Screenshot toko Stage 3 — empat pilihan mikroorganisme dengan harga poin}

Empat pilihan tersedia dengan harga, deskripsi pigmen, dan efek bioremediasi berbeda:

| Organisme | Harga | Efek | Reward |
|-----------|-------|------|--------|
| *Azolla microphylla* | 50 poin | COD turun hingga 96% | ⭐⭐⭐ Tertinggi |
| *Chlorella vulgaris* | 40 poin | Memecah melanoidin & lignin | ⭐⭐ Sedang |
| *Spirulina platensis* | 40 poin | Menyerap nutrien, butuh pH basa | ⭐⭐ Sedang |
| *Nannochloropsis* | 30 poin | Hanya toleran air asin | ⭐ Hukuman |

### Drag-to-Pour Gelas Mikro

{Image: Screenshot Stage 3 — 6 gelas kecil berisi mikroorganisme, tank reaktor di kanan}

Setelah membeli, muncul **6 gelas kecil** berisi mikroorganisme. Pemain menyeret satu per satu ke dalam kolam vinasse menggunakan mekanisme drag yang sama dengan Step 1 simulasi.

Setiap gelas yang berhasil masuk ke kolam menambah counter. Jika semua dosis terpenuhi, kran dapat dibuka untuk lanjut ke stage berikutnya.

---

## 11. IPAL Builder (Stage 4)

{Image: Screenshot IPAL Builder — checklist alat dan bahan yang bisa dipilih}

Pemain memilih alat dan bahan dari daftar untuk membangun reaktor IPAL sederhana:

**Alat:**
- Aerator (1/2/3 unit — lebih banyak = lebih efisien)
- Aquarium/Bak/Kolam tertutup
- Pipa/Selang
- Penyaring
- Lampu (untuk mikroorganisme fotosintesis)

**Bahan:**
- Limbah Vinasse
- Mikroorganisme yang dipilih di Stage 3

Setelah memilih, sistem `evaluateReactor()` di `stage4.js` menghitung skor kelengkapan dan menampilkan umpan balik.

{Image: Screenshot hasil evaluasi reaktor — tabel skor kelengkapan per kategori}

---

## 12. Evaluasi & Presentasi (Stage 5 & 6)

### Stage 5 — Analisis Kegagalan

{Image: Screenshot Stage 5 — panel skenario kegagalan dengan pilihan penyebab}

Pemain disajikan skenario: "Percobaan sudah selesai — apa yang salah?" Beberapa skenario kegagalan disiapkan di `stage5.js`:
- Aerasi terlalu singkat
- Dosis mikroorganisme tidak tepat
- pH tidak dinetralkan terlebih dahulu
- Kontaminasi dari lingkungan eksternal

Pemain menganalisis dan memilih penyebab kegagalan yang paling tepat.

### Stage 6 — Presentasi Rekomendasi

{Image: Screenshot Stage 6 — panel checklist presentasi POC (Pupuk Organik Cair)}

Tahap final di ruang kelas virtual. Pemain menyelesaikan checklist presentasi:
- Definisi vinasse dan masalah pencemaran
- Hasil pengukuran parameter (TDS/DO/pH)
- Proses bioremediasi yang dilakukan
- Karakteristik POC (Pupuk Organik Cair) hasil akhir
- Rekomendasi penggunaan: encerkan 1:10 sebelum diaplikasikan ke tanaman

---

## 13. Sistem Tabrakan (Collision)

### Metode AABB

Sistem tabrakan menggunakan **Axis-Aligned Bounding Boxes** di bidang XZ (tanpa ketinggian). Setiap halangan direpresentasikan sebagai kotak dengan koordinat min/max:

```javascript
function box(cx, cz, halfWidth, halfDepth) {
  return {
    minX: cx - halfWidth, maxX: cx + halfWidth,
    minZ: cz - halfDepth, maxZ: cz + halfDepth
  };
}
```

### Resolusi Sliding

Sumbu X dan Z diselesaikan secara independen sehingga karakter bisa **meluncur** di sepanjang dinding tanpa tersangkut:

```javascript
// Coba gerak di X saja → jika bertabrakan, batalkan sumbu X
// Coba gerak di Z saja → jika bertabrakan, batalkan sumbu Z
// Hasilnya: sliding movement yang mulus
```

{Image: Diagram AABB collision — kotak merah halangan, lingkaran biru pemain}

### Radius Pemain

Pemain diperlakukan sebagai lingkaran dengan jari-jari `PLAYER_RADIUS = 0.65` unit, cocok untuk lebar lorong antar meja lab (±3 unit).

---

## 14. Antarmuka Pengguna (UI/HUD)

### Strategi Rendering

UI menggunakan **HTML div overlay** di atas canvas Three.js, bukan objek 3D. Ini memberikan keuntungan:
- Teks selalu tajam di semua resolusi
- Mudah di-style dengan CSS
- Aksesibel (screen reader friendly)

{Image: Diagram layer — canvas 3D di bawah, HTML overlay di atas}

### Komponen UI Utama

**Layar Profil / Input Nama**

{Image: Screenshot layar profil — form input nama sebelum mulai bermain}

**HUD (Heads-Up Display)**

```
┌─────────────────────────────────────────┐
│ 👤 [Nama Pemain]        ⭐ 250 poin     │
│ Stage 2                   [⏸ Pause]    │
└─────────────────────────────────────────┘
```

**Panel Soal**

{Image: Screenshot panel soal terbuka — tabel data fenomena, pertanyaan, pilihan A/B/C}

**Layar Level Complete**

{Image: Screenshot layar selesai level — bintang, poin yang diperoleh, tombol lanjut}

**Layar Game Complete**

{Image: Screenshot layar game selesai — total poin akhir, leaderboard}

---

### CSS Injeksi Dinamis

Setiap modul UI menyuntikkan style-nya sendiri dengan ID unik agar tidak duplikat:

```javascript
function injectCSS() {
  if (document.getElementById('sim-styles')) return; // sudah ada
  const style = document.createElement('style');
  style.id = 'sim-styles';
  style.textContent = `
    .sim-overlay { ... }
    .meter-layout { ... }
    /* ... */
  `;
  document.head.appendChild(style);
}
```

---

## 15. Database Lokal & Leaderboard

### Checkpoint System (`db.js`)

Progress pemain disimpan ke `localStorage` setelah setiap level selesai, sehingga pemain bisa melanjutkan permainan jika browser ditutup.

```javascript
export function saveCheckpoint(state) {
  localStorage.setItem('biovine_checkpoint', JSON.stringify({
    playerName:   state.playerName,
    currentLevel: state.currentLevel,
    totalPoints:  state.totalPoints,
    levelBreakdown: state.levelBreakdown,
  }));
}

export function loadCheckpoint() {
  const raw = localStorage.getItem('biovine_checkpoint');
  return raw ? JSON.parse(raw) : null;
}
```

### Leaderboard

Skor akhir disimpan ke array di localStorage dan ditampilkan di `admin.html` dalam bentuk tabel yang bisa diurutkan.

```javascript
export function saveScore(name, points) {
  const scores = JSON.parse(localStorage.getItem('biovine_scores') || '[]');
  scores.push({ name, points, date: new Date().toISOString() });
  scores.sort((a, b) => b.points - a.points);
  localStorage.setItem('biovine_scores', JSON.stringify(scores.slice(0, 50)));
}
```

{Image: Screenshot admin.html — tabel leaderboard dengan nama, poin, tanggal}

### Google Sheets Integration (Opsional)

`sheets.js` menyediakan fungsi `uploadLevelProgress()` untuk mengirim data progres ke Google Sheets via Apps Script, sehingga guru dapat memantau perkembangan seluruh siswa secara real-time.

{Image: Screenshot Google Sheets — data progres siswa dari seluruh kelas}

---

## 16. Pengujian & Iterasi

### Proses Iterasi Konten

Beberapa perubahan besar dilakukan berdasarkan feedback:

| Iterasi | Perubahan | Alasan |
|---------|-----------|--------|
| v1 | Titrasi KMnO₄ di Step 2 | Konsep awal — terlalu rumit |
| v2 | Diganti TDS/DO Meter | Sesuai dengan praktikum riil yang dilakukan tim |
| v1 | Satu sprinkler di Stage 3 | Visual kurang jelas |
| v2 | 6 gelas drag-to-pour | Lebih intuitif, ada umpan balik per gelas |
| v1 | Tabel COD/BOD di hasil Stage 2 | Tidak sesuai dengan parameter yang diukur |
| v2 | 3 kartu: vinasse, meter, aerasi | Lebih relevan dengan interaksi yang dilakukan |

### Pengujian di Berbagai Perangkat

| Perangkat | Resolusi | Status | Catatan |
|-----------|----------|--------|---------|
| Laptop 15" (Chrome) | 1920×1080 | ✅ | Optimal |
| Laptop 13" (Firefox) | 1366×768 | ✅ | — |
| iPad (Safari) | 1024×768 | ✅ | Touch joystick aktif |
| Smartphone Android | 390×844 | ✅ | Layout responsif |
| Smartphone iPhone | 375×812 | ✅ | — |

---

## 17. Build & Deployment

### Perintah Build

```bash
# Development
npm run dev       # → http://localhost:5173

# Production build
npm run build     # → dist/

# Preview hasil build
npm run preview   # → http://localhost:4173
```

### Output Build

```
dist/
├── index.html           (~1.5 KB)
├── admin.html           (~18 KB)
└── assets/
    ├── main-[hash].css  (~28 KB gzip: 6 KB)
    └── main-[hash].js   (~768 KB gzip: 202 KB)
```

Three.js merupakan mayoritas ukuran bundle. Ukuran ini masih wajar untuk game berbasis WebGL.

### Deployment

Folder `dist/` bisa langsung di-host di:
- **GitHub Pages** — gratis, cocok untuk distribusi ke siswa
- **Netlify / Vercel** — deploy otomatis dari Git push
- **File lokal** — cukup buka `index.html` di browser (perlu server lokal karena ES modules)

```bash
# Contoh deploy ke GitHub Pages
npm run build
git add dist -f
git commit -m "deploy"
git subtree push --prefix dist origin gh-pages
```

{Image: Screenshot game berjalan di browser — Stage 1 Lab, karakter pemain berdiri di tengah ruangan}

---

## Penutup

**3D-BIOVINE** adalah hasil perpaduan antara riset ilmiah yang mendalam tentang pencemaran vinasse di Bekonang, prinsip-prinsip pedagogi *Problem-Based Learning*, dan implementasi teknis Three.js yang seluruhnya berjalan di browser tanpa instalasi tambahan.

Game ini membuktikan bahwa teknologi web modern dapat digunakan untuk membuat media pembelajaran saintifik yang imersif, interaktif, dan berbasis data nyata — dapat diakses oleh siswa mana pun yang memiliki browser dan koneksi internet.

---

*Dokumen ini merupakan rekam jejak proses pembuatan untuk keperluan dokumentasi akademis dan pengembangan lanjutan.*
