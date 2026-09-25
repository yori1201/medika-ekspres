# MEDIKA EKSPRES — Web + Google Sheets Integrated V1

Paket ini sudah dikonfigurasi agar form order website dapat:
- menyimpan order ke Google Sheets `Orders`
- membaca tarif, radius, hospital coordinates, WhatsApp, dan instruksi pembayaran dari sheet `Config`
- menjalankan tarif Regular <= 5 km = Rp25.000
- menandai Express / Regular >5 km sebagai order yang memerlukan quote bila quote otomatis belum tersedia
- membuat Pin Lokasi berupa link Google Maps di spreadsheet
- menjaga status awal: Payment Pending, Pharmacy Waiting, Delivery Pending

Baca `SETUP_GOOGLE_SHEETS.md` untuk deployment.
