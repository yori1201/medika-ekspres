# MEDIKA EKSPRES — CURRENT STATE

## Audit date
2026-09-29

## Repositories
- Frontend/main web: yori1201/medika-ekspres
- Backend source: yori1201/medika-ekspres-backend

## Observed architecture
- Static frontend HTML/CSS/JS.
- Frontend calls a Google Apps Script `/exec` endpoint.
- Google Sheets is the operational database.
- Apps Script performs geocoding, road-distance calculation, order persistence, vouchers, and dispatcher operations.
- Lalamove quotation logic exists in the backend source and is being mirrored into the Apps Script source tree.

## Important reconciliation
There are multiple historical implementations in the repositories. Historical Markdown files are reference material, not automatic implementation instructions.

The current locked pricing is newer than several existing code paths.

## Current risks found
1. Old pricing formula remained in frontend/backend.
2. Existing backend code used an internal outer-zone service-fee/margin-cap formula that conflicts with the current locked pricing.
3. Patient form still contained a Poliklinik field although the locked flow removed it.
4. Address landmark was not included in the address string sent for routing.
5. Server persistence previously accepted client distance/coordinates instead of making the server calculation authoritative.
6. Frontend and backend repositories contain different generations of Apps Script architecture.
7. Live public site could not be fetched from the current audit environment; deployment/runtime verification therefore remains pending.

## This branch
`fix/medika-baseline-2026-09-29`

Changes are intentionally isolated from `main` pending runtime verification.
