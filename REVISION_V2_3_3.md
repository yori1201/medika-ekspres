# V2.3.3 Patient Live Fare

Frontend changes only:
- 0–15 km: summary shows distance + final patient delivery total.
- Summary CTA becomes `Lanjut ke Pembayaran →`.
- >15 km: blocked as outside service radius.
- Patient UI does not expose courier provider, courier cost, reference fare, margin, margin cap, or quotation ID.
- Existing form submission/order creation remains in its original final step.

Backend requirement:
- Add `getCourierQuotePreview(payload)` from `BACKEND_PATCH_GET_COURIER_QUOTE_PREVIEW.gs`.
- Add its single `doPost` route before `default`.
- Existing order-based courier quotation and pricing functions remain untouched.
