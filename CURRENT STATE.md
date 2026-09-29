# MEDIKA EKSPRES — CURRENT STATE

## Audit / sync date
2026-09-29

## Repositories
- Frontend/main web: `yori1201/medika-ekspres` (branch `main`)
- Backend live: Google Apps Script Web App (source **not** fully mirrored in this repo)
- Historical backend repo `yori1201/medika-ekspres-backend`: not accessible (404)

## Observed architecture (runtime-verified)
- Static frontend HTML/CSS/JS (Vercel production + local static server).
- Frontend calls production Apps Script `/exec` endpoint from `config.js`.
- Google Sheets is the operational database.
- Live backend accepts `doctor_name` + `full_address` (not the obsolete `doctor`/`address`/`area` contract in archived `Code.gs`).

## Production endpoint
```
https://script.google.com/macros/s/AKfycbwl3LG_IW3XVA1IOizlOfcczFUVOZEOYqgILt38iYbZC6-AOPCkaZxeB9O-Dzd1U8Q-/exec
```

## Database
- Name: `MEDIKA_EKSPRES_Database_V2_3_Pilot`
- ID: `1S3b6JX73G3df_XFwdT3QrKiaaC1TknxRsqSfypHNwdw`
- Orders tab: authoritative

## Source drift (important)
GitHub `apps-script/Code.gs` ≠ live Apps Script.  
See `SOURCE_OF_TRUTH.md` and `apps-script/README.md`.

## Local test mode
Local frontend may point to the production Apps Script endpoint for controlled user testing.  
Label: **LOCAL FRONTEND → PRODUCTION BACKEND**.  
Do not deploy repository Apps Script to production without reconciliation.
