/*
 * LOCAL-ONLY voucher mock.
 * Never used outside localhost/127.0.0.1.
 * Test codes:
 *   MEDIKA10 -> 10% discount, max Rp25.000
 *   MEDIKA25 -> Rp25.000 discount
 *   MEDIKA50 -> Rp50.000 discount
 */
window.MEDIKA_LOCAL_VOUCHER_API = async function(payload){
  const code = String(payload?.voucherCode || payload?.voucher_code || "").trim().toUpperCase();
  const baseFare = Number(payload?.baseFare);

  if (!code) throw new Error("Kode voucher wajib diisi.");
  if (!Number.isFinite(baseFare) || baseFare < 0) throw new Error("Tarif dasar tidak valid.");

  const rules = {
    MEDIKA10: {type:"percent", value:10, max:25000},
    MEDIKA25: {type:"fixed", value:25000},
    MEDIKA50: {type:"fixed", value:50000}
  };

  const rule = rules[code];
  if (!rule) throw new Error("Voucher lokal tidak ditemukan. Gunakan MEDIKA10, MEDIKA25, atau MEDIKA50.");

  let discount = rule.type === "percent"
    ? Math.floor(baseFare * rule.value / 100)
    : rule.value;

  if (rule.max) discount = Math.min(discount, rule.max);
  discount = Math.min(Math.max(0, discount), baseFare);

  return {
    ok: true,
    voucherCode: code,
    baseFare,
    discount,
    finalFare: Math.max(0, baseFare - discount)
  };
};
