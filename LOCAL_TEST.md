# LOCAL TEST — MEDIKA EKSPRES

**Mode:** LOCAL FRONTEND → PRODUCTION BACKEND  
**Do not use for production deploy.**

## Start server

```bash
cd /path/to/medika-ekspres
python3 -m http.server 8080
```

Open: http://localhost:8080/form.html

## Suggested test data

| Field | Value |
|-------|--------|
| Nama | LOCAL CTIO TEST |
| WhatsApp | 6289990006666 |
| Dokter | dr Local CTIO |
| Alamat | Margo City, Jl. Margonda Raya |
| Kecamatan | Beji |
| Kelurahan | (pilih salah satu) |
| Payment | Tunai |
| Consent | checked |

## Expected result

1. Jarak & tarif muncul (contoh area Margonda ~7.29 km / Rp37.000).
2. Submit berhasil → modal Order ID.
3. Baris baru di spreadsheet `MEDIKA_EKSPRES_Database_V2_3_Pilot` → tab **Orders**.
