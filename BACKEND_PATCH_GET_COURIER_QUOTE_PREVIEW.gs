/**
 * MEDIKA EKSPRES — additive preview quotation endpoint.
 * Does NOT create an order and does NOT change existing getCourierQuoteForOrder().
 * Requires the existing courierQuote_(pickup, destination) function in Courier.gs.
 */
function getCourierQuotePreview(payload) {
  payload = payload || {};
  const lat = Number(payload.latitude);
  const lng = Number(payload.longitude);
  const distanceKm = Number(payload.distance_km);
  const fullAddress = String(payload.full_address || '').trim();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('Koordinat tujuan tidak valid.');
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) throw new Error('Jarak pengantaran tidak valid.');
  if (distanceKm > 15) throw new Error('Di luar radius layanan maksimal 15 km.');

  const additionalKm = Math.max(0, Math.ceil(distanceKm - 5));
  const referenceFare = 25000 + (additionalKm * 4000);

  // Same Sandbox pickup currently used by the PASS order quotation flow.
  const pickup = {
    lat: -6.3629,
    lng: 106.8294,
    address: 'Rumah Sakit Universitas Indonesia, Depok'
  };
  const destination = { lat: lat, lng: lng, address: fullAddress };

  const quote = courierQuote_(pickup, destination);
  const courierCost = Number(
    quote.courier_cost ?? quote.price ?? quote.amount ?? quote.total ?? quote.totalFee
  );
  if (!Number.isFinite(courierCost) || courierCost < 0) throw new Error('Ongkir aktual kurir tidak valid.');

  const patientPrice = Math.min(referenceFare, courierCost + 30000);
  const margin = patientPrice - courierCost;
  if (margin > 30000) throw new Error('Margin melebihi batas.');

  // Patient-safe response: no provider, quotation ID, courier cost, margin, or formula.
  return {
    success: true,
    distance_km: distanceKm,
    patient_price: patientPrice
  };
}

/*
Tambahkan case ini di doPost(e), tepat sebelum default:

case 'getCourierQuotePreview':
  result = getCourierQuotePreview(body);
  break;
*/
