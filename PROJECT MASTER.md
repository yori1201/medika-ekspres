# MEDIKA EKSPRES — PROJECT MASTER

## Purpose
MEDIKA EKSPRES adalah layanan koordinasi pengantaran obat dari Instalasi Farmasi RSUI kepada pasien setelah obat dinyatakan READY.

## Product position
- B2B2C hospital-to-patient medicine delivery.
- MEDIKA EKSPRES menangani registrasi pengantaran, alamat, tarif, dispatcher, koordinasi kurir, tracking/POD, dan komunikasi.
- Instalasi Farmasi/RS tetap memegang otoritas klinis dan farmasi.
- MEDIKA EKSPRES bukan pengganti instalasi farmasi.

## Current product
- Public site: https://medikaekspres.my.id/
- Frontend repository: yori1201/medika-ekspres
- Backend repository: yori1201/medika-ekspres-backend
- Operational data model: Google Sheets + Google Apps Script.
- Frontend deployment: Cloudflare.
- Backend deployment: Google Apps Script web app.

## Locked patient flow
1. Data Penerima: Nama, WhatsApp, Dokter.
2. Alamat Pengantaran: alamat lengkap, kecamatan, kelurahan, patokan/detail.
3. Ringkasan & Tarif: jarak, voucher, tarif, potongan, total bayar.
4. Pembayaran & Konfirmasi: QRIS atau Tunai.

## Engineering principle
Preserve working behavior and visual identity. Do not redesign or migrate architecture unless explicitly approved.
