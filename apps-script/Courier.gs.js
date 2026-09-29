/**
 * ============================================================
 * MEDIKA EKSPRES — COURIER ENGINE
 * Version: 2.3.3
 * Environment: Lalamove Sandbox
 *
 * Provider disembunyikan dari UI.
 * Dashboard hanya menerima:
 * - Ongkir Aktual
 * - Jarak
 * - Tarif Pasien
 * - Margin
 * ============================================================
 */


/**
 * Membuat signature HMAC untuk API kurir.
 * Menggunakan credential yang sudah tersimpan
 * di Script Properties.
 */
function courierGenerateSignature_(method, path, body) {

  const props = PropertiesService.getScriptProperties();

  const apiKey =
    props.getProperty('LALAMOVE_SANDBOX_API_KEY');

  const apiSecret =
    props.getProperty('LALAMOVE_SANDBOX_API_SECRET');

  if (!apiKey || !apiSecret) {
    throw new Error(
      'Credential courier Sandbox belum dikonfigurasi.'
    );
  }

  const timestamp = Date.now().toString();

  const rawSignature =
    timestamp + '\r\n' +
    method.toUpperCase() + '\r\n' +
    path + '\r\n\r\n' +
    (body || '');

  const signatureBytes =
    Utilities.computeHmacSha256Signature(
      rawSignature,
      apiSecret
    );

  const signature = signatureBytes
    .map(function(byte) {
      const value = byte < 0 ? byte + 256 : byte;
      return ('0' + value.toString(16)).slice(-2);
    })
    .join('');

  return {
    apiKey: apiKey,
    timestamp: timestamp,
    signature: signature
  };
}


/**
 * Request quotation ke courier.
 *
 * pickup:
 * {
 *   lat: -6.xxxxx,
 *   lng: 106.xxxxx,
 *   address: "..."
 * }
 *
 * destination:
 * {
 *   lat: -6.xxxxx,
 *   lng: 106.xxxxx,
 *   address: "..."
 * }
 */
function courierQuote_(pickup, destination) {

  if (!pickup || !destination) {
    throw new Error(
      'Pickup dan destination wajib tersedia.'
    );
  }

  if (
    pickup.lat === undefined ||
    pickup.lng === undefined ||
    destination.lat === undefined ||
    destination.lng === undefined
  ) {
    throw new Error(
      'Koordinat pickup/destination belum lengkap.'
    );
  }

  const baseUrl =
    'https://rest.sandbox.lalamove.com';

  const path =
    '/v3/quotations';

  const method =
    'POST';

  const payload = {
    data: {

      serviceType: 'MOTORCYCLE',

      language: 'id_ID',

      stops: [
        {
          coordinates: {
            lat: String(pickup.lat),
            lng: String(pickup.lng)
          },
          address: pickup.address || 'Pickup'
        },

        {
          coordinates: {
            lat: String(destination.lat),
            lng: String(destination.lng)
          },
          address:
            destination.address || 'Tujuan'
        }
      ],

      isRouteOptimized: false
    }
  };

  const body =
    JSON.stringify(payload);

  const auth =
    courierGenerateSignature_(
      method,
      path,
      body
    );

  const response =
    UrlFetchApp.fetch(
      baseUrl + path,
      {
        method: method,

        headers: {
          'Authorization':
            'hmac ' +
            auth.apiKey + ':' +
            auth.timestamp + ':' +
            auth.signature,

          'Market': 'ID',

          'Content-Type':
            'application/json'
        },

        payload: body,

        muteHttpExceptions: true
      }
    );

  const status =
    response.getResponseCode();

  const responseText =
    response.getContentText();

  let result;

  try {
    result =
      JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      'Response courier tidak valid.'
    );
  }


  if (status !== 201) {

    Logger.log(
      'Courier quotation error: ' +
      responseText
    );

    throw new Error(
      'Gagal mengambil ongkir. HTTP ' +
      status
    );
  }


  if (
    !result.data ||
    !result.data.priceBreakdown
  ) {
    throw new Error(
      'Ongkir tidak ditemukan pada response courier.'
    );
  }


  const price =
    Number(
      result.data.priceBreakdown.total
    );

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    throw new Error(
      'Nilai ongkir dari courier tidak valid.'
    );
  }


  return {

    success: true,

    courierCost: price,

    currency:
      result.data.priceBreakdown.currency ||
      'IDR',

    quotationId:
      result.data.quotationId || '',

    expiresAt:
      result.data.expiresAt || '',

    // Internal only.
    // Jangan ditampilkan pada UI pasien/dispatcher.
    provider: 'LALAMOVE'
  };
}


/**
 * ============================================================
 * TEST
 * ============================================================
 *
 * Hanya meminta quotation.
 * TIDAK membuat order courier.
 */
function testCourierQuote() {

  /*
   * Menggunakan koordinat test yang sebelumnya
   * berhasil digunakan pada Sandbox.
   *
   * Jangan digunakan sebagai pickup production.
   */

  const pickup = {
    lat: -6.3629,
    lng: 106.8294,
    address:
      'Rumah Sakit Universitas Indonesia, Depok'
  };

  const destination = {
    lat: -6.372967,
    lng: 106.8344235,
    address:
      'Margo City, Jalan Margonda Raya, Depok'
  };


  const result =
    courierQuote_(
      pickup,
      destination
    );


  /*
   * LOG YANG DITAMPILKAN
   *
   * Provider dan credential tidak dicetak.
   */

  Logger.log(
    JSON.stringify(
      {
        success:
          result.success,

        ongkirAktual:
          result.courierCost,

        currency:
          result.currency,

        quotationAvailable:
          !!result.quotationId
      },
      null,
      2
    )
  );


  if (
    result.success &&
    result.courierCost >= 0
  ) {

    Logger.log(
      'PASS — Ongkir Aktual berhasil diperoleh.'
    );

  } else {

    throw new Error(
      'Test Ongkir Aktual gagal.'
    );
  }
}
/**
 * ============================================================
 * MEDIKA EKSPRES
 * ORDER → ONGKIR AKTUAL
 * ============================================================
 */
/**
 * ============================================================
 * MEDIKA EKSPRES
 * ORDER → ONGKIR AKTUAL → PRICING FINAL
 * ============================================================
 *
 * PRICING LOCK:
 *
 * 0–5 km
 *   Tarif dasar = Rp25.000
 *
 * >5–15 km
 *   Tarif acuan =
 *   Rp25.000 + Rp4.000 × ceil(distance - 5)
 *
 * ONGKIR KURIR:
 *   Diambil dari quotation aktual API.
 *   BUKAN berdasarkan asumsi tarif/km.
 *
 * MARGIN:
 *   Maksimum Rp30.000.
 *
 * TARIF FINAL:
 *   MIN(tarif acuan, ongkir aktual + Rp30.000)
 *
 * RADIUS MAKSIMUM:
 *   15 km
 * ============================================================
 */

function getCourierQuoteForOrder(orderId) {

  if (!orderId) {
    throw new Error('order_id wajib diisi.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Orders');

  if (!sheet) {
    throw new Error('Sheet Orders tidak ditemukan.');
  }

  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    throw new Error('Belum ada order.');
  }

  const headers = data[0].map(function(header) {
    return String(header).trim();
  });

  const col = {};

  headers.forEach(function(header, index) {
    col[header] = index;
  });


  // ==========================================================
  // VALIDASI KOLOM
  // ==========================================================

  const requiredColumns = [
    'order_id',
    'full_address',
    'latitude',
    'longitude',
    'distance_km',
    'courier_cost',
    'courier_provider',
    'updated_at',
    'patient_price'
  ];

  requiredColumns.forEach(function(name) {

    if (col[name] === undefined) {

      throw new Error(
        'Kolom Orders tidak ditemukan: ' + name
      );

    }

  });


  // ==========================================================
  // CARI ORDER
  // ==========================================================

  let rowIndex = -1;
  let row = null;

  for (let i = 1; i < data.length; i++) {

    if (
      String(data[i][col.order_id]).trim() ===
      String(orderId).trim()
    ) {

      rowIndex = i + 1;
      row = data[i];

      break;

    }

  }


  if (!row) {

    throw new Error(
      'Order tidak ditemukan: ' + orderId
    );

  }


  // ==========================================================
  // DATA ORDER
  // ==========================================================

  const destinationLat =
    Number(row[col.latitude]);

  const destinationLng =
    Number(row[col.longitude]);

  const destinationAddress =
    String(
      row[col.full_address] || ''
    ).trim();

  const distanceKm =
    Number(row[col.distance_km]);


  if (
    !Number.isFinite(destinationLat) ||
    !Number.isFinite(destinationLng)
  ) {

    throw new Error(
      'Koordinat pasien belum valid.'
    );

  }


  if (
    !Number.isFinite(distanceKm) ||
    distanceKm <= 0
  ) {

    throw new Error(
      'distance_km belum valid.'
    );

  }


  // ==========================================================
  // BATAS RADIUS MEDIKA EKSPRES
  // ==========================================================

  const MAX_RADIUS_KM = 15;

  if (distanceKm > MAX_RADIUS_KM) {

    throw new Error(
      'Jarak ' +
      distanceKm +
      ' km berada di luar radius maksimum 15 km.'
    );

  }


  // ==========================================================
  // TARIF ACUAN MEDIKA
  // ==========================================================

  const BASE_FARE = 25000;
  const RATE_PER_KM = 4000;
  const MAX_MARGIN = 30000;

  let referenceFare = BASE_FARE;
  let additionalKm = 0;


  if (distanceKm > 5) {

    additionalKm =
      Math.ceil(distanceKm - 5);

    referenceFare =
      BASE_FARE +
      (additionalKm * RATE_PER_KM);

  }


  // ==========================================================
  // PICKUP SANDBOX
  //
  // Tetap menggunakan konfigurasi pickup yang sudah PASS.
  // Production nanti dipindahkan ke Config.
  // ==========================================================

  const pickup = {

    lat: -6.3629,
    lng: 106.8294,

    address:
      'Rumah Sakit Universitas Indonesia, Depok'

  };


  const destination = {

    lat: destinationLat,
    lng: destinationLng,
    address: destinationAddress

  };


  // ==========================================================
  // REQUEST QUOTATION AKTUAL
  // ==========================================================

  const quote =
    courierQuote_(
      pickup,
      destination
    );


  if (!quote || !quote.success) {

    throw new Error(
      'Quotation ongkir aktual gagal diperoleh.'
    );

  }


  const courierCost =
    Number(quote.courierCost);


  if (
    !Number.isFinite(courierCost) ||
    courierCost < 0
  ) {

    throw new Error(
      'Nilai ongkir aktual tidak valid.'
    );

  }


  // ==========================================================
  // HITUNG TARIF FINAL
  // ==========================================================

  const maximumPriceByMargin =
    courierCost + MAX_MARGIN;


  const patientPrice =
    Math.min(
      referenceFare,
      maximumPriceByMargin
    );


  const margin =
    patientPrice - courierCost;


  // ==========================================================
  // SAFETY CHECK
  // ==========================================================

  if (margin > MAX_MARGIN) {

    throw new Error(
      'Safety check gagal: margin melebihi Rp30.000.'
    );

  }


  // ==========================================================
  // SIMPAN KE ORDERS
  // ==========================================================

  sheet
    .getRange(
      rowIndex,
      col.courier_cost + 1
    )
    .setValue(courierCost);


  // Provider INTERNAL.
  // Tidak ditampilkan pada UI pasien/dispatcher.

  sheet
    .getRange(
      rowIndex,
      col.courier_provider + 1
    )
    .setValue('LALAMOVE');


  sheet
    .getRange(
      rowIndex,
      col.patient_price + 1
    )
    .setValue(patientPrice);


  sheet
    .getRange(
      rowIndex,
      col.updated_at + 1
    )
    .setValue(new Date());


  SpreadsheetApp.flush();


  // ==========================================================
  // RESPONSE AMAN UNTUK DISPATCHER
  // ==========================================================

  return {

    success: true,

    order_id:
      String(orderId),

    distance_km:
      distanceKm,

    additional_km:
      additionalKm,

    reference_fare:
      referenceFare,

    courier_cost:
      courierCost,

    patient_price:
      patientPrice,

    margin:
      margin,

    margin_cap:
      MAX_MARGIN,

    quotation_available:
      !!quote.quotationId

  };

}


/**
 * ============================================================
 * TEST ORDER ME-000001
 * ============================================================
 */

function testCourierQuoteForOrder() {

  const orderId = 'ME-000001';

  const result =
    getCourierQuoteForOrder(orderId);


  Logger.log(
    JSON.stringify(
      {

        success:
          result.success,

        order_id:
          result.order_id,

        distance_km:
          result.distance_km,

        additionalKm:
          result.additional_km,

        tarifAcuan:
          result.reference_fare,

        ongkirAktual:
          result.courier_cost,

        tarifPasien:
          result.patient_price,

        margin:
          result.margin,

        marginCap:
          result.margin_cap,

        quotationAvailable:
          result.quotation_available

      },
      null,
      2
    )
  );


  if (
    !result.success ||
    result.margin > 30000
  ) {

    throw new Error(
      'TEST GAGAL — Pricing tidak valid.'
    );

  }


  Logger.log(
    'PASS — Order → Ongkir → Pricing MEDIKA berhasil.'
  );

}