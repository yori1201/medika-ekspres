# MEDIKA EKSPRES — Setup Telegram Order Notification

## Architecture
Patient → form → Apps Script createOrder → Sheets Orders (SUCCESS) → notifyTelegramNewOrder_ → Telegram Bot → Dispatcher

- Telegram is **non-blocking**. Sheets SUCCESS + Telegram FAIL = order still SUCCESS.
- Credentials only in **Apps Script → Project Settings → Script properties**.
- Never put BOT_TOKEN in frontend, config.js, or Git.

## Production deploy (required)

1. Open production Apps Script project (bound to MEDIKA_EKSPRES_Database_V2_3_Pilot).
2. **Files → + → Script** → name `Telegram` → paste contents of `apps-script/Telegram.gs`.
3. In the file that contains **createOrder** (after successful write to Orders, **not** on duplicate), add:

```javascript
try {
  notifyTelegramNewOrder_({
    orderId: /* order id */,
    name: /* patient name */,
    whatsapp: /* whatsapp */,
    doctor_name: /* or doctor */,
    full_address: /* or address */,
    distance_km: /* number */,
    pricing_category: /* e.g. EKSPRES+ */,
    patient_price: /* total charged */,
    paymentMethod: /* Tunai | QRIS */
  });
} catch (e) {
  Logger.log('Telegram notify ignored: ' + e);
}
```

4. Save project.
5. Set Script properties:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   Or run: `setTelegramCredentials('YOUR_BOT_TOKEN', 'YOUR_CHAT_ID');`
6. Run `testTelegramNotification` → check Telegram.
7. Deploy new version of existing web app (same URL). Authorize external request if prompted.

## Security
Do not commit real token/chat id. Do not log full token.
