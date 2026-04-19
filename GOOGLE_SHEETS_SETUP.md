# Setup Google Sheets untuk 3d-BIOVINE

Panduan ini menjelaskan cara menghubungkan game 3d-BIOVINE ke Google Sheets agar progress pemain terupload otomatis setiap menyelesaikan level.

---

## Langkah 1 – Buat Google Sheet baru

1. Buka [https://sheets.google.com](https://sheets.google.com) dan login dengan akun Google.
2. Klik **"+"** untuk membuat spreadsheet baru.
3. Beri nama spreadsheet, misalnya: **`BIOVINE Leaderboard`**.
4. Di baris pertama (header), isi kolom-kolom berikut **persis** seperti ini:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Timestamp | Nama Pemain | Total Poin | Poin Level 1 | Poin Level 2 | Poin Level 3 | Poin Level 4 | Poin Level 5 | Level Selesai |

> Klik sel **A1** lalu ketik `Timestamp`, lanjut ke B1 ketik `Nama Pemain`, dst.

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

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    var playerName    = String(data.playerName    || '').trim();
    var totalPoints   = Number(data.totalPoints   || 0);
    var completedRooms = (data.completedRooms || []).join(', ');

    var lvl = {
      1: data.level1Points != null ? data.level1Points : '-',
      2: data.level2Points != null ? data.level2Points : '-',
      3: data.level3Points != null ? data.level3Points : '-',
      4: data.level4Points != null ? data.level4Points : '-',
      5: data.level5Points != null ? data.level5Points : '-',
    };

    var timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

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
      // Update baris yang sudah ada
      sheet.getRange(existingRow, 1, 1, newRow.length).setValues([newRow]);
    } else {
      // Tambah baris baru
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
| Perlu update Apps Script | Setelah edit kode, klik **Deploy → Manage deployments → Edit** lalu pilih **New version** |

---

## Struktur Data yang Dikirim Game

Setiap kali pemain menyelesaikan satu level, game mengirim data berikut:

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
