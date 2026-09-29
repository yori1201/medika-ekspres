# apps-script/ — Repository Status

**Status:** ARCHIVE / DRIFT DOCUMENTED  

Files in this folder (`Code.gs`, `Courier.gs.js`) are **not** guaranteed to match the live Google Apps Script deployment used by production.

## Production endpoint (live)

```
https://script.google.com/macros/s/AKfycbwl3LG_IW3XVA1IOizlOfcczFUVOZEOYqgILt38iYbZC6-AOPCkaZxeB9O-Dzd1U8Q-/exec
```

## What was verified at runtime (2026-09-29)

- Frontend `doctor_name` + `full_address` payload is accepted by live backend.
- Orders are written to spreadsheet `MEDIKA_EKSPRES_Database_V2_3_Pilot` tab `Orders`.
- Response format is `{ success, data, error }` with `patient_price`, `patient_id`, `address_id`.

## Policy

1. Do **not** deploy these files to production without exporting and diffing the live Apps Script project first.
2. Treat `SOURCE_OF_TRUTH.md` at repo root as the contract reference for frontend integration.
3. To reconcile: export live Apps Script → replace this folder → review → only then redeploy.
