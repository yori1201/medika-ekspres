# MEDIKA EKSPRES — AGENT RULES

## Mandatory workflow
READ → UNDERSTAND → VERIFY → AUDIT → PROPOSE → WAIT FOR APPROVAL → MODIFY → TEST.

## Rules
1. Existing working behavior is presumed intentional until verified.
2. Historical documentation is not an implementation instruction.
3. Never silently resolve conflicts between code and locked decisions.
4. Never redesign the UI unless explicitly requested.
5. Never expose internal courier cost, provider, margin, quotation ID, or internal fee to patients.
6. Pricing must be calculated server-side; client values are not authoritative.
7. API credentials must stay in environment/configuration secrets, never in frontend or committed source.
8. Any database schema change must preserve existing operational data.
9. Do not migrate Google Sheets to another database without explicit approval.
10. Backend deployment must be verified after source changes; a GitHub commit alone does not deploy Google Apps Script.
11. Before production rollout, test:
   - ≤5 km pricing
   - >5 km Lalamove quotation + distance surcharge
   - voucher discount
   - QRIS/Tunai equal total
   - duplicate order handling
   - address geocoding
   - dispatcher status transitions
   - courier quotation failure
12. If runtime deployment differs from GitHub source, stop and report the drift.

## Current change branch
`fix/medika-baseline-2026-09-29`
