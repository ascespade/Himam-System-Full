# تفعيل n8n Workflow - دليل سريع

## 🔴 المشكلة الحالية

```
(#2201) response does not match challenge, expected value="904410303", received="\u003C!DOCTYPE html>\n\u003Ch..."
```

**السبب**: Meta يحاول التحقق من webhook URL لكنه يحصل على HTML بدلاً من plain text challenge.

## ✅ الحل

### 1. عمل Redeploy في Vercel

تم إصلاح الكود في `app/api/whatsapp/route.ts`. يجب عمل redeploy:

```bash
# في Vercel Dashboard:
# 1. اذهب إلى Project Settings
# 2. اضغط "Redeploy" → "Redeploy"
```

أو من Terminal:
```bash
vercel --prod
```

### 2. التحقق من Webhook في Meta Developer Console

1. اذهب إلى [Meta Developer Console](https://developers.facebook.com/)
2. اختر WhatsApp App
3. اذهب إلى **Configuration** → **Webhooks**
4. اضغط **Verify and Save** على webhook URL:
   ```
   https://himam-system.vercel.app/api/whatsapp
   ```
5. **Verify Token**: `meta-webhook-verify-2025`

### 3. تفعيل Workflow في n8n

بعد التحقق من webhook في Meta:

1. اذهب إلى n8n: `https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3`
2. اضغط على toggle switch بجانب **"Inactive"** لتفعيله
3. يجب أن يعمل بدون أخطاء

## 🧪 اختبار

### 1. اختبار Webhook Verification

```bash
curl "https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=meta-webhook-verify-2025&hub.challenge=test123"
```

**النتيجة المتوقعة**: `test123` (plain text)

### 2. اختبار Workflow

1. أرسل رسالة إلى رقم واتساب
2. تحقق من n8n Executions
3. تحقق من استقبال رد تلقائي

## 📝 ملاحظات

- **Verify Token**: يجب أن يكون `meta-webhook-verify-2025` في قاعدة البيانات
- **Webhook URL**: `https://himam-system.vercel.app/api/whatsapp`
- **Response**: يجب أن يكون plain text (ليس JSON أو HTML)

---

**آخر تحديث**: 2025-12-06


