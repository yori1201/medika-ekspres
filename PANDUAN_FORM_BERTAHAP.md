# MEDIKA EKSPRES — Form Bertahap

- `index.html` dan seluruh aset visual tidak diubah. `form.html` sekarang menampilkan satu pertanyaan per layar (9 langkah: delapan pertanyaan yang disepakati + pilihan layanan).
- Formulir menambahkan `hospital`, `area`, dan persetujuan ke payload. Backend `apps-script/Code.gs` menulis tiga kolom tambahan T:V ke sheet `Orders` pada workbook bawaan paket ini.
- PENTING: `config.js` masih memiliki `SHEETS_ENDPOINT: ""`. Belum terhubung ke Google Sheets dan belum ada pengujian pengiriman nyata. Ikuti `SETUP_GOOGLE_SHEETS.md`, deploy Apps Script versi baru, lalu isi URL `/exec`.
- Workbook dalam ZIP ini menggunakan tab `Orders` dan `Config`, BUKAN tab `ORDERS` pada spreadsheet operasional lain. Jangan mengarahkan script ke spreadsheet operasional lain tanpa membuat pemetaan kolomnya terlebih dahulu.
- Karena pengiriman browser menggunakan `no-cors`, respons Google Apps Script tidak dapat dibaca: halaman hanya dapat menyatakan permintaan terkirim, bukan memastikan baris tersimpan. Periksa sheet dengan pesanan uji sebelum operasional; untuk bukti sukses otomatis diperlukan backend/proxy yang memberi respons terverifikasi.
- Jika endpoint kosong, data hanya disimpan di localStorage demo dan pesan peringatan ditampilkan, bukan diklaim sudah masuk Google Sheets.
- Konfirmasikan metode pembayaran yang benar-benar aktif dan identitas rumah sakit sebelum publikasi. Jangan meminta informasi resep atau diagnosis.
