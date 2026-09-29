# MEDIKA EKSPRES — SOURCE OF TRUTH

**Updated:** 2026-09-29  
**Authority:** CTIO (runtime-verified)  
**Status:** Production frontend + production Apps Script endpoint verified end-to-end.

---

## 1. Frontend

| Item | Value |
|------|--------|
| Repository | `yori1201/medika-ekspres` |
| Branch | `main` |
| Production URL | https://medika-ekspres.vercel.app/form.html |
| Local URL | http://localhost:8080/form.html |
| Runtime config | `config.js` → `SHEETS_ENDPOINT` |

**Production Apps Script endpoint (DO NOT CHANGE without CEO approval):**
```
https://script.google.com/macros/s/AKfycbwl3LG_IW3XVA1IOizlOfcczFUVOZEOYqgILt38iYbZC6-AOPCkaZxeB9O-Dzd1U8Q-/exec
```

---

## 2. Backend (Production Runtime)

| Item | Value |
|------|--------|
| Type | Google Apps Script Web App (`/exec`) |
| Endpoint | See above (from production `config.js`) |
| Repository mirror | **OUT OF DATE** — `apps-script/Code.gs` is NOT the live source |
| Deploy policy | **Do not deploy `apps-script/Code.gs` to production until reconciled with the live Apps Script project** |

### createOrder request contract (LIVE, verified)

```json
{
  "action": "createOrder",
  "orderId": "ME-<base36timestamp>-<random>",
  "name": "string",
  "whatsapp": "628xxxxxxxxxx",
  "doctor_name": "string",
  "full_address": "string (alamat + landmark + kelurahan + kecamatan)",
  "paymentMethod": "QRIS | Tunai",
  "consent": true,
  "voucherCode": "optional"
}
```

### createOrder success response (LIVE, verified)

```json
{
  "success": true,
  "data": {
    "orderId": "ME-...",
    "order_id": "ME-...",
    "patient_id": "PT-...",
    "address_id": "ADR-...",
    "distance_km": 7.29,
    "pricing_category": "EKSPRES+",
    "base_fare": 37000,
    "discount_amount": 0,
    "patient_price": 37000,
    "requires_manual_quote": false
  },
  "error": null
}
```

### calculateDelivery request / response (LIVE, verified)

Request:
```json
{ "action": "calculateDelivery", "full_address": "..." }
```

Response data fields include:
`full_address`, `latitude`, `longitude`, `distance_km`, `distance_text`, `duration_text`, `pricing_category`, `base_fare`, `patient_price`, `requires_manual_quote`

### Obsolete GitHub contract (DO NOT USE)

`apps-script/Code.gs` historically required:
`doctor`, `address`, `area`, `distanceKm`

That contract is **obsolete** relative to production. Frontend correctly sends `doctor_name` + `full_address`.

---

## 3. Database

| Item | Value |
|------|--------|
| Spreadsheet name | `MEDIKA_EKSPRES_Database_V2_3_Pilot` |
| Spreadsheet ID | `1S3b6JX73G3df_XFwdT3QrKiaaC1TknxRsqSfypHNwdw` |
| Orders tab | `Orders` (authoritative) |
| Patients tab | `Patients` |
| Addresses tab | `Addresses` |

### Orders key fields (LIVE)

`order_id`, `created_at`, `patient_id`, `address_id`, `patient_name`, `whatsapp`, `doctor_name`, `full_address`, `latitude`, `longitude`, `distance_km`, `pricing_category`, `delivery_zone`, `base_fare`, `voucher_code`, `discount_amount`, `patient_price`, `payment_method`, `payment_status`, `medicine_status`, `order_status`, `courier_provider`, `courier_cost`, ...

Verified test row: `ME-MUMLL545-3917` (CTIO Runtime Test, 2026-09-29).

---

## 4. Architecture (actual)

```
Patient Browser
    ↓
Frontend (static HTML/JS) — Vercel production OR localhost
    ↓
config.js → SHEETS_ENDPOINT
    ↓
Google Apps Script Web App (/exec)  [LIVE — source not in this repo]
    ↓
Backend functions (createOrder, calculateDelivery, voucherApply, ...)
    ↓
Google Sheets: MEDIKA_EKSPRES_Database_V2_3_Pilot
    ↓
Orders / Patients / Addresses
```

---

## 5. Business rules (locked — do not change without CEO)

- ≤5 km: patient price Rp25.000
- >5 km: pricing engine / quotation (patient sees final fare only)
- Payment: QRIS, Tunai only
- Patient UI must not show courier provider, courier cost, margin, or internal fees
- Consent required
- Voucher supported

---

## 6. Critical warnings

1. **GITHUB `apps-script/Code.gs` ≠ LIVE Apps Script.**  
   Do not deploy repository Apps Script files to production until the live project source has been exported and reconciled.

2. Local test mode intentionally uses the **production backend endpoint** so Yori can verify form → Sheets without deploying a new backend.

3. Internal fields (`courier_provider`, `courier_cost`) may exist in the database for operations. They must remain hidden from patient UI.
