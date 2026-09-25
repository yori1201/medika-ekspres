# MEDIKA EKSPRES V2.1 — Pilot Execution

## Fitur yang sudah ditambahkan
- Pickup fixed dari konfigurasi RSUI.
- Geocoding alamat + jarak jalan (driving) menggunakan Apps Script Maps Service.
- Pricing engine locked: 0–5 km Rp25.000; >5–10 km Rp25.000 + Rp4.000/km tambahan (ceil); >10 km Manual Quote = ongkir provider + Rp10.000, dibulatkan ke atas Rp1.000 oleh backend saat dispatcher mengisi ongkir.
- Database otomatis `PATIENTS`, `ADDRESSES`, `ORDERS`.
- Repeat order: lookup menggunakan kombinasi nama + WhatsApp, lalu alamat tersimpan dapat dipilih/autofill.
- Koordinat, jarak jalan, zona pengiriman, dan alamat tersimpan untuk penggunaan ulang.
- Zona pengiriman membantu grouping order READY untuk multiple delivery.
- `dispatcher.html` menampilkan order READY per Zona Pengiriman dan menandai kandidat multiple delivery.

## Setup
1. Buka Google Sheet operasional pilot yang sudah digunakan.
2. Extensions > Apps Script.
3. Ganti isi `Code.gs` dengan `apps-script/Code.gs` versi paket ini.
4. Deploy > Manage deployments > Edit deployment > New version > Deploy.
5. Copy URL `/exec` dan isi `SHEETS_ENDPOINT` pada `config.js`.
6. Pastikan sheet `Config` memiliki koordinat pickup RSUI yang benar. Jika belum, backend memakai fallback di `Code.gs`/`config.js`; jangan go-live sebelum koordinat pickup diverifikasi.
7. Buka `form.html`, test alamat 0–5 km, 5–10 km, dan >10 km.
8. Ubah status Pharmacy Status menjadi `Ready` pada ORDERS untuk mengetes `dispatcher.html`.

## Config keys yang didukung
`HOSPITAL_NAME`, `PICKUP_LABEL`, `HOSPITAL_LAT`, `HOSPITAL_LNG`, `REGULAR_RADIUS_KM`, `AUTO_RADIUS_MAX_KM`, `REGULAR_CHARGE`, `EXTRA_KM_RATE`, `OUTER_ZONE_SERVICE_FEE`, `PIC_WHATSAPP`.

## Catatan pilot
- Lookup repeat patient meminta **Nama + WhatsApp** cocok untuk mengurangi paparan alamat dari pencarian nomor saja. Untuk produksi, tambahkan OTP/authentication.
- Zona Pengiriman saat ini memakai `area/kecamatan` yang diinput sebagai label utama; jika kosong, sistem memakai sektor arah (Utara/Timur/Selatan/Barat). Setelah data pilot terkumpul, ganti dengan polygon/cluster zona berbasis data order nyata.
- Multiple delivery masih semi-otomatis sesuai lock: sistem mengelompokkan kandidat; dispatcher memutuskan penggabungan.
- API kurir belum di-hardwire ke provider. >10 km tetap Manual Quote dan provider fare dimasukkan dispatcher.

## Update V2.2 — Dispatcher Voucher & Tarif >10 km
- Voucher tidak diinput pasien. Voucher dipilih dan diterapkan oleh dispatcher.
- Sheet `VOUCHERS` dibuat otomatis oleh Apps Script. Contoh awal: `PILOT10K` nominal Rp10.000.
- Kolom Orders baru: `Voucher Code`, `Discount Amount`, `Base Fare`.
- Order >10 km: dispatcher memasukkan provider + ongkir aktual. Sistem menghitung `ceil((ongkir + Rp10.000)/Rp1.000)*Rp1.000`, lalu menampilkan total final.
- Voucher diterapkan setelah base fare tersedia; total pasien = base fare - diskon.
- Untuk production, batasi akses `dispatcher.html` dan endpoint update dispatcher dengan autentikasi/otorisasi.
