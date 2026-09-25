# MEDIKA EKSPRES V3 Alpha

LOCK:
- Hero image: hero-v3-locked.png
- Responsive landing: image uses object-fit: contain (no forced crop).
- Patient flow: 4 steps only.
- Existing backend endpoint/config retained.
- Live patient fare uses getCourierQuotePreview.
- On final submit, order is created first, then existing getCourierQuote is called to persist current courier/pricing data for that order.

Important:
- The included BACKEND_PATCH_GET_COURIER_QUOTE_PREVIEW.gs still needs to be installed/routed in Apps Script before live fare testing.
