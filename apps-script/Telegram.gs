/**
 * MEDIKA EKSPRES — Telegram order notification (server-side only)
 * Credentials: Script Properties TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Never put tokens in frontend or Git commits.
 * Telegram failure MUST NOT fail createOrder.
 */

function telegramConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    token: String(props.getProperty('TELEGRAM_BOT_TOKEN') || '').trim(),
    chatId: String(props.getProperty('TELEGRAM_CHAT_ID') || '').trim()
  };
}

function telegramEnabled_() {
  const c = telegramConfig_();
  return !!(c.token && c.chatId);
}

/**
 * Non-blocking notify after successful Orders persist.
 * Safe to call from createOrder_; never throws to caller.
 */
function notifyTelegramNewOrder_(order) {
  try {
    if (!order || !order.orderId) return { ok: false, skipped: true, reason: 'no_order' };
    if (!telegramEnabled_()) {
      Logger.log('Telegram skip: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set');
      return { ok: false, skipped: true, reason: 'not_configured' };
    }
    const cache = CacheService.getScriptCache();
    const cacheKey = 'tg_notified_' + String(order.orderId);
    if (cache.get(cacheKey)) {
      Logger.log('Telegram skip duplicate: ' + order.orderId);
      return { ok: true, skipped: true, reason: 'duplicate' };
    }
    const text = buildTelegramOrderMessage_(order);
    const result = sendTelegramMessage_(text);
    if (result && result.ok) {
      cache.put(cacheKey, '1', 21600);
    }
    return result;
  } catch (err) {
    Logger.log('Telegram notification failed: ' + (err && err.message ? err.message : err));
    return { ok: false, error: String(err && err.message ? err.message : err) };
  }
}

function buildTelegramOrderMessage_(o) {
  const orderId = o.orderId || o.order_id || '—';
  const name = o.name || o.patient_name || '—';
  const wa = o.whatsapp || o.phone || '—';
  const doctor = o.doctor_name || o.doctor || '—';
  const address = o.full_address || o.address || '—';
  const km = o.distance_km != null ? o.distance_km : (o.distanceKm != null ? o.distanceKm : '—');
  const category = o.pricing_category || o.operationalZone || o.pricingCategory || '—';
  const total = o.patient_price != null ? o.patient_price : (o.finalFare != null ? o.finalFare : (o.finalCharge != null ? o.finalCharge : '—'));
  const pay = o.paymentMethod || o.payment_method || '—';
  const when = o.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
  const totalFmt = formatTelegramRp_(total);
  const kmFmt = (typeof km === 'number' && isFinite(km)) ? km.toFixed(2) + ' km' : String(km);

  return [
    '🚨 ORDER BARU — MEDIKA EKSPRES',
    '',
    'Order ID: ' + orderId,
    'Pasien: ' + name,
    'WhatsApp: ' + wa,
    'Dokter: ' + doctor,
    'Alamat: ' + address,
    'Jarak: ' + kmFmt,
    'Layanan: ' + category,
    'Total: ' + totalFmt,
    'Pembayaran: ' + pay,
    'Status: ORDER BARU',
    'Waktu: ' + when
  ].join('\n');
}

function formatTelegramRp_(n) {
  if (n === '—' || n == null || n === '') return '—';
  const num = Number(n);
  if (!isFinite(num)) return String(n);
  return 'Rp' + Math.round(num).toLocaleString('id-ID');
}

function sendTelegramMessage_(text) {
  const c = telegramConfig_();
  if (!c.token || !c.chatId) return { ok: false, skipped: true, reason: 'not_configured' };
  const url = 'https://api.telegram.org/bot' + c.token + '/sendMessage';
  const payload = {
    chat_id: c.chatId,
    text: String(text || ''),
    disable_web_page_preview: true
  };
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code < 200 || code >= 300) {
    Logger.log('Telegram HTTP ' + code + ': ' + body);
    return { ok: false, status: code, body: body };
  }
  try {
    const json = JSON.parse(body);
    if (!json.ok) {
      Logger.log('Telegram API error: ' + body);
      return { ok: false, body: body };
    }
    return { ok: true };
  } catch (e) {
    Logger.log('Telegram parse error: ' + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * One-time setup — run from Apps Script editor:
 * setTelegramCredentials('BOT_TOKEN', 'CHAT_ID')
 */
function setTelegramCredentials(botToken, chatId) {
  if (!botToken || !chatId) throw new Error('botToken and chatId required');
  PropertiesService.getScriptProperties().setProperties({
    TELEGRAM_BOT_TOKEN: String(botToken).trim(),
    TELEGRAM_CHAT_ID: String(chatId).trim()
  }, false);
  return { ok: true, message: 'Telegram credentials saved to Script Properties' };
}

/** Manual test from editor after setTelegramCredentials */
function testTelegramNotification() {
  return notifyTelegramNewOrder_({
    orderId: 'ME-TELEGRAM-TEST',
    name: 'TELEGRAM TEST',
    whatsapp: '6289990008888',
    doctor_name: 'dr Telegram Test',
    full_address: 'Margo City, Jl. Margonda Raya, Beji, Depok',
    distance_km: 7.29,
    pricing_category: 'EKSPRES+',
    patient_price: 37000,
    paymentMethod: 'Tunai'
  });
}
