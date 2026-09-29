# MEDIKA EKSPRES — LOCKED DECISIONS

## Pricing
- ≤5 km: Rp25.000 flat.
- >5 km: actual Lalamove API quotation + Rp4.000 × ceil(distance − 5 km).
- Example: 14.48 km with Rp23.600 Lalamove quotation => Rp23.600 + (10 × Rp4.000) = Rp63.600.
- Voucher reduces the delivery charge.
- Total Bayar = Tarif Pengantaran − Potongan Voucher.
- QRIS and Tunai use the same Total Bayar.
- Patient UI must never expose Lalamove cost, provider, margin, internal fee, quotation ID, or internal pricing components.

## Radius
- Current automatic patient flow: maximum 15 km.
- >15 km requires dispatcher confirmation / is not payable through the normal patient flow.

## Patient form
- No Poliklinik field in the locked V3 patient flow.
- No service-selection field.
- No patient pin-location UI.
- Backend may still store latitude/longitude obtained from geocoding/routing.
- Address must support Depok kecamatan and dependent kelurahan.
- Patokan/detail is supported.

## Payment
- QRIS.
- Tunai.
- No other payment options in the patient flow.

## Visual
- Existing MEDIKA EKSPRES visual identity is locked.
- Do not redesign without explicit approval.

## Change control
Any conflict between code, historical documentation, or a new proposal and this file must be reported before changing the locked decision.
