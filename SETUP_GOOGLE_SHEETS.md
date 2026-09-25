# MEDIKA EKSPRES — Konfigurasi Web + Google Sheets

## Hasil integrasi
Form web menulis langsung ke sheet `Orders` dan membaca setting operasional dari sheet `Config`.

Kolom Orders yang dipakai:
`Order ID | Timestamp | Nama Pasien | No WhatsApp | Dokter | Alamat Lengkap | Patokan / Detail | Pin Lokasi | Jarak (KM) | Layanan | Hasil Cek Ongkir | Final Charge | Metode Bayar | Status Bayar | Status Farmasi | Status Delivery | Courier | Tracking / POD | Catatan Dispatcher`

## STEP 1 — Buat Google Sheet
1. Upload `MEDIKA_EKSPRES_Order_Database_Web_Integrated.xlsx` ke Google Drive.
2. Klik kanan > Open with > Google Sheets.
3. Pastikan ada sheet `Orders`, `Config`, dan `Dashboard`.

## STEP 2 — Pasang Apps Script
1. Dari Google Sheets pilih **Extensions > Apps Script**.
2. Hapus kode default.
3. Copy seluruh isi `apps-script/Code.gs`.
4. Save.

Script ini **bound ke spreadsheet**, jadi tidak perlu mengisi Spreadsheet ID.

## STEP 3 — Deploy API
1. Klik **Deploy > New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone** (diperlukan karena form pasien bersifat publik).
5. Deploy dan izinkan permission.
6. Copy URL yang berakhir dengan `/exec`.

Contoh:
`https://script.google.com/macros/s/AKfycb.../exec`

## STEP 4 — Hubungkan website
Buka `config.js`, lalu isi:

```js
SHEETS_ENDPOINT: "PASTE_URL_WEB_APP_DI_SINI",
```

Jangan gunakan URL `/dev`. Gunakan URL deployment `/exec`.

## STEP 5 — Atur Config langsung dari spreadsheet
Website membaca setting berikut dari sheet `Config`:
- Minimum Charge
- Regular Radius (KM)
- Default Regular Charge
- WhatsApp PIC
- Hospital Name
- Hospital Latitude
- Hospital Longitude
- QRIS Instruction
- E-Wallet Instruction
- Bank Transfer Instruction
- Cash Instruction

Setelah endpoint terpasang, perubahan nilai Config bisa dilakukan dari Google Sheets tanpa mengedit kode website.

## STEP 6 — Tes end-to-end
1. Jalankan website via web server (jangan hanya double-click file HTML jika geolocation dibutuhkan).
2. Isi form test.
3. Klik Konfirmasi Pengantaran.
4. Buka sheet `Orders`.
5. Pastikan order masuk pada baris kosong pertama.
6. Test Reguler <= 5 km: Final Charge harus Rp25.000.
7. Test Express / >5 km tanpa quote: Final Charge dibiarkan kosong dan Catatan Dispatcher menandai bahwa ongkir perlu dikonfirmasi.
8. Setelah dispatcher mengisi `Hasil Cek Ongkir`, Final Charge dapat diisi/ditetapkan sesuai minimum charge Rp25.000.

## Preview lokal
Dari folder project:

```bash
python3 -m http.server 8080
```

Buka:
`http://localhost:8080/`

## Catatan keamanan pilot
- Jangan masukkan diagnosis atau detail resep ke form publik.
- Data yang dikumpulkan hanya untuk kebutuhan operasional pengantaran.
- Apps Script public endpoint cukup untuk pilot ringan; bila volume meningkat, pindahkan backend ke server/API dengan authentication dan rate limiting.
