# Setup Google Sheets untuk 3d-BIOVINE

Panduan ini menjelaskan cara menghubungkan game 3d-BIOVINE ke Google Sheets agar progress pemain terupload otomatis setiap menyelesaikan level.

---

## Langkah 1 – Buat Google Sheet baru

1. Buka [https://sheets.google.com](https://sheets.google.com) dan login dengan akun Google.
2. Klik **"+"** untuk membuat spreadsheet baru.
3. Beri nama spreadsheet, misalnya: **`BIOVINE Leaderboard`**.

### Sheet 1 – Leaderboard (tab default)

Di tab pertama (bisa dinamai `Leaderboard`), isi header baris pertama **persis** seperti ini:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Timestamp | Nama Pemain | Total Poin | Poin Level 1 | Poin Level 2 | Poin Level 3 | Poin Level 4 | Poin Level 5 | Level Selesai |

> Klik sel **A1** lalu ketik `Timestamp`, lanjut ke B1 ketik `Nama Pemain`, dst.

### Sheet 2 – Kelompok (tab baru untuk hasil percobaan)

4. Di bagian bawah spreadsheet, klik **ikon "+"** untuk menambah tab baru.
5. Klik kanan tab baru → **Rename** → ketik **`Kelompok`** (huruf kapital K, tanpa spasi).
6. Di tab `Kelompok`, isi header baris pertama seperti ini:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z | AA |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|----|
| Timestamp | Nama Pemain (Game) | Nomor Kelompok | Kelas | Nama Anggota | Mikroorganisme | Intensitas Cahaya | Suhu Ruang | Awal-DG Warna | Awal-DG Bau | Awal-DG Kekeruhan | Awal-DG PH | Awal-DG Salinitas | Awal-DG TDS | Awal-DG COD | Awal-DG BOD | Awal-DG DO | Awal-TP Warna | Awal-TP Bau | Awal-TP Kekeruhan | Awal-TP PH | Awal-TP Salinitas | Awal-TP TDS | Awal-TP COD | Awal-TP BOD | Awal-TP DO | *(lanjut Akhir-DG & Akhir-TP kolom AB–AQ)* |

> Kolom Akhir-DG dan Akhir-TP mengikuti urutan yang sama (Warna, Bau, Kekeruhan, PH, Salinitas, TDS, COD, BOD, DO) untuk masing-masing treatment.

### Sheet 3 – Esai (tab baru untuk jawaban Level 5)

7. Tambah satu tab lagi dengan cara yang sama, beri nama **`Esai`**.
8. Di tab `Esai`, isi header baris pertama seperti ini:

| A | B | C |
|---|---|---|
| Timestamp | Nama Pemain (Game) | Jawaban Esai |

---

## Langkah 2 – Buka Apps Script editor

1. Di spreadsheet yang baru dibuat, klik menu **Extensions → Apps Script**.
2. Tab baru akan terbuka dengan editor kode Google Apps Script.
3. Hapus semua kode yang ada di editor (biasanya ada fungsi `myFunction` kosong).

---

## Langkah 3 – Paste kode Apps Script

Paste seluruh kode berikut ke dalam editor:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    var timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    // ── Route: hasil percobaan kelompok → sheet "Kelompok" ──────────────
    if (data.sheet === 'Kelompok') {
      var kSheet = ss.getSheetByName('Kelompok');
      if (!kSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet "Kelompok" tidak ditemukan.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      function obs(obj, key) { return obj && obj[key] ? obj[key] : '-'; }

      var aD = data.awalDengan  || {};
      var aT = data.awalTanpa   || {};
      var kD = data.akhirDengan || {};
      var kT = data.akhirTanpa  || {};
      var cols = ['warna','bau','keruh','ph','sal','tds','cod','bod','do'];

      var row = [
        timestamp,
        String(data.playerName       || '-'),
        String(data.nomorKelompok    || '-'),
        String(data.kelas            || '-'),
        String(data.namaAnggota      || '-'),
        String(data.mikroorganisme   || '-'),
        String(data.intensitasCahaya || '-'),
        String(data.suhuRuang        || '-'),
      ];
      // Awal-DG, Awal-TP, Akhir-DG, Akhir-TP (9 kolom masing-masing)
      cols.forEach(function(c) { row.push(obs(aD, c)); });
      cols.forEach(function(c) { row.push(obs(aT, c)); });
      cols.forEach(function(c) { row.push(obs(kD, c)); });
      cols.forEach(function(c) { row.push(obs(kT, c)); });

      kSheet.appendRow(row);

      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Route: jawaban esai Level 5 → sheet "Esai" ───────────────────────
    if (data.sheet === 'Esai') {
      var eSheet = ss.getSheetByName('Esai');
      if (!eSheet) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet "Esai" tidak ditemukan.' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      eSheet.appendRow([
        timestamp,
        String(data.playerName  || '-'),
        String(data.essayAnswer || '-'),
      ]);

      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── Default route: progress level → sheet "Leaderboard" ─────────────
    var sheet = ss.getSheetByName('Leaderboard') || ss.getActiveSheet();

    var playerName     = String(data.playerName    || '').trim();
    var totalPoints    = Number(data.totalPoints   || 0);
    var completedRooms = (data.completedRooms || []).join(', ');

    var lvl = {
      1: data.level1Points != null ? data.level1Points : '-',
      2: data.level2Points != null ? data.level2Points : '-',
      3: data.level3Points != null ? data.level3Points : '-',
      4: data.level4Points != null ? data.level4Points : '-',
      5: data.level5Points != null ? data.level5Points : '-',
    };

    var newRow = [
      timestamp,
      playerName,
      totalPoints,
      lvl[1], lvl[2], lvl[3], lvl[4], lvl[5],
      completedRooms
    ];

    // Cari baris dengan nama pemain yang sama (case-insensitive)
    var values = sheet.getDataRange().getValues();
    var existingRow = -1;
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][1]).toLowerCase() === playerName.toLowerCase()) {
        existingRow = i + 1; // getRange pakai 1-based index
        break;
      }
    }

    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, newRow.length).setValues([newRow]);
    } else {
      sheet.appendRow(newRow);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Untuk test apakah deployment berhasil — buka URL langsung di browser
function doGet(e) {
  return ContentService
    .createTextOutput('BIOVINE Sheets API aktif.')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

> **Penting:** Setelah mengganti kode, wajib buat **versi deployment baru**.
> Klik **Deploy → Manage deployments → Edit (ikon pensil)** → pilih **New version** → klik **Deploy**.
> URL tidak berubah — tidak perlu update `src/sheets.js`.

4. Klik ikon **Save** (💾) atau tekan `Ctrl+S`. Beri nama project, misalnya `BIOVINE API`.

---

## Langkah 4 – Deploy sebagai Web App

1. Klik tombol **Deploy** di pojok kanan atas → pilih **New deployment**.
2. Klik ikon ⚙️ di samping "Select type" → pilih **Web app**.
3. Isi form deployment:
   - **Description:** `BIOVINE Sheets API v1`
   - **Execute as:** `Me` (akun Google kamu)
   - **Who has access:** **`Anyone`** ← wajib agar game bisa mengirim data tanpa login
4. Klik **Deploy**.
5. Google akan meminta izin akses — klik **Authorize access**, pilih akun Google kamu.
   - Jika muncul peringatan "This app isn't verified", klik **Advanced → Go to BIOVINE API (unsafe)** → klik **Allow**.
6. Setelah berhasil, akan muncul **Web app URL** seperti ini:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
7. **Copy URL tersebut** — ini yang akan dipasang ke game.

---

## Langkah 5 – Pasang URL di game

1. Buka file `src/sheets.js` di project 3d-BIOVINE.
2. Cari baris ini:
   ```javascript
   const SCRIPT_URL = '';
   ```
3. Ganti dengan URL yang kamu copy tadi:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Simpan file.

---

## Langkah 6 – Test

1. Jalankan game dengan `npm run dev`.
2. Masukkan nama pemain dan selesaikan salah satu level.
3. Buka Google Sheet — data pemain seharusnya sudah muncul dalam beberapa detik.

### Troubleshooting

| Masalah | Solusi |
|---|---|
| Data tidak muncul di sheet | Pastikan `SCRIPT_URL` sudah diisi dan deployment "Who has access" = **Anyone** |
| Muncul error di console browser | Periksa URL sudah benar, coba buka URL-nya langsung di browser (harus tampil teks "BIOVINE Sheets API aktif.") |
| Row tidak terupdate, malah tambah baris baru | Pastikan nama pemain diisi **sama persis** (case tidak masalah, tapi spasi di awal/akhir harus sama) |
| Data percobaan masuk ke Leaderboard, bukan Kelompok | Pastikan nama tab sheet adalah **`Kelompok`** (huruf K kapital, tanpa spasi) dan kode Apps Script sudah diupdate ke versi baru |
| Jawaban esai tidak muncul di sheet | Pastikan tab **`Esai`** sudah dibuat dan kode Apps Script sudah diperbarui ke versi terbaru |
| Perlu update Apps Script | Setelah edit kode, klik **Deploy → Manage deployments → Edit** lalu pilih **New version** |

---

## Struktur Data yang Dikirim Game

### 1. Progress Level (dikirim otomatis setiap level selesai)

```json
{
  "playerName": "Nama Pemain",
  "totalPoints": 350,
  "completedLevel": 3,
  "thisLevelPoints": 100,
  "level1Points": 75,
  "level2Points": 50,
  "level3Points": 100,
  "level4Points": null,
  "level5Points": null,
  "completedRooms": [1, 2, 3],
  "timestamp": "2026-04-19T08:00:00.000Z"
}
```

Level yang belum diselesaikan akan tampil sebagai `-` di sheet.

### 2. Hasil Percobaan Kelompok (dikirim saat klik "Upload Hasil Percobaan")

```json
{
  "sheet": "Kelompok",
  "playerName": "Nama Pemain (Game)",
  "nomorKelompok": "3",
  "kelas": "X-IPA-2",
  "namaAnggota": "Budi, Ani, Citra",
  "timestamp": "2026-05-10T08:00:00.000Z",
  "mikroorganisme": "Azolla pinnata",
  "intensitasCahaya": "1200 lux",
  "suhuRuang": "27 °C",
  "awalDengan":  { "warna": "coklat", "bau": "menyengat", "keruh": "tinggi", "ph": "4.2", "sal": "2.1", "tds": "3200", "cod": "4800", "bod": "2100", "do": "1.2" },
  "awalTanpa":   { "warna": "coklat", "bau": "menyengat", "keruh": "tinggi", "ph": "4.1", "sal": "2.0", "tds": "3150", "cod": "4750", "bod": "2080", "do": "1.1" },
  "akhirDengan": { "warna": "kuning", "bau": "berkurang", "keruh": "sedang", "ph": "6.8", "sal": "0.8", "tds": "980",  "cod": "320",  "bod": "180",  "do": "5.4" },
  "akhirTanpa":  { "warna": "coklat", "bau": "menyengat", "keruh": "tinggi", "ph": "4.2", "sal": "2.0", "tds": "3100", "cod": "4700", "bod": "2050", "do": "1.2" }
}
```

Data ini akan masuk ke tab **Kelompok** di spreadsheet, bukan Leaderboard.
Kolom yang tidak diisi oleh pengguna akan tersimpan sebagai tanda hubung (`–`).

### 3. Jawaban Esai Level 5 (dikirim otomatis saat siswa submit esai)

```json
{
  "sheet": "Esai",
  "playerName": "Nama Pemain (Game)",
  "essayAnswer": "Jawaban panjang siswa tentang mengapa bakteri sering gagal...",
  "timestamp": "2026-05-10T08:00:00.000Z"
}
```

Data ini masuk ke tab **Esai** — satu baris per siswa setiap kali mereka menyelesaikan Level 5.
