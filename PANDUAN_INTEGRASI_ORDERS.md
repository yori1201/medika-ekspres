# MEDIKA EKSPRES — Integrasi spreadsheet OPERASIONAL PILOT

1. Backup spreadsheet **MEDIKA EKSPRES — OPERASIONAL PILOT**. Jangan upload atau gunakan workbook XLSX bawaan paket ini sebagai database aktif.
2. Buka spreadsheet operasional yang sudah ada, pilih Extensions > Apps Script. Tempel isi `apps-script/Code.gs` ke proyek Apps Script yang terikat pada spreadsheet tersebut. Jika sudah ada kode lain, backup dulu.
3. Deploy > New deployment > Web app > Execute as Me > Anyone. Endpoint publik berisiko spam dan data pribadi; gunakan hanya untuk uji terbatas, tambahkan perlindungan abuse sebelum publikasi luas.
4. Salin URL `/exec` ke `SHEETS_ENDPOINT` dalam `config.js`, tanpa mengubah konfigurasi lainnya. Setelah edit script, deploy versi baru.
5. Jalankan website melalui server lokal (`python3 -m http.server 8080`), isi **data fiktif** dan kirim. Tunggu sampai halaman menampilkan nomor referensi. Cocokkan dengan baris baru di tab `ORDERS`.
6. Backend mempertahankan kolom A:N dan menambah O:S: Rumah Sakit, Persetujuan Data, Layanan, Jarak Estimasi, Ongkir Perlu Konfirmasi. Kolom Tarif dibiarkan kosong sampai dispatcher mengonfirmasi biaya. Status obat tidak dinyatakan READY otomatis.
7. Jika verifikasi gagal, website menampilkan nomor referensi dan meminta pemeriksaan manual; jangan langsung kirim ulang. Permintaan dengan nomor yang sama tidak membuat duplikat.
8. Tidak ada uji live Google Sheets dalam paket ini. Uji end-to-end dengan data fiktif sebelum digunakan pasien. Pilihan metode bayar pada form harus disesuaikan dengan metode yang benar-benar aktif.

CATATAN: form masih 9 langkah karena paket sebelumnya menyertakan pilihan layanan Reguler/Ekspres. Ini dipertahankan agar alur tarif lama tidak diam-diam diubah. GPS menghitung jarak garis lurus, bukan jarak jalan kurir. Jangan menganggap angka itu sebagai tarif final.
