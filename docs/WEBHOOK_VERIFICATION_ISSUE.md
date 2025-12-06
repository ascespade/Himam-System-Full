# ⚠️ مشكلة التحقق من Webhook في Meta

## 🔴 المشكلة

Meta Developer Console يعيد خطأ:
```
تعذر التحقق من صحة عنوان URL الاستدعاء أو رمز التحقق
```

عند محاولة التحقق من webhook URL:
```
https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook
```

## 🔍 السبب

عند اختبار webhook بـ `curl`، يعيد HTML (صفحة n8n) بدلاً من plain text challenge. هذا يعني أن:

1. **Render لا يوجّه الطلبات إلى webhook بشكل صحيح**
2. **أو webhook غير مسجل في n8n**
3. **أو الووركفلو غير Active**

## ✅ الحلول الممكنة

### الحل 1: التحقق من أن الووركفلو Active

1. اذهب إلى n8n UI: `https://n8n-9q4d.onrender.com`
2. افتح الووركفلو: "AlHimam AI WhatsApp Assistant (Dynamic)"
3. تأكد من أن الووركفلو **Active** (الزر الأخضر في الأعلى)
4. إذا كان غير Active، اضغط على زر التفعيل

### الحل 2: استخدام Test Mode أولاً

1. في n8n UI، افتح الووركفلو
2. اضغط على **"Test"** في الأعلى (بجانب Active)
3. انسخ **Test Webhook URL** (سيظهر في Webhook node)
4. استخدم Test URL في Meta Developer Console:
   ```
   https://n8n-9q4d.onrender.com/webhook-test/whatsapp-webhook
   ```
5. بعد التحقق الناجح، فعّل الووركفلو في Production
6. استخدم Production URL:
   ```
   https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook
   ```

### الحل 3: التحقق من Webhook Path

تأكد من أن:
- **Path**: `whatsapp-webhook`
- **HTTP Method**: `GET`
- **Response Mode**: `lastNode` أو `responseNode`

### الحل 4: استخدام ngrok (للاختبار المحلي)

إذا كان n8n يعمل محلياً:

```bash
ngrok http 5678
```

ثم استخدم ngrok URL في Meta:
```
https://xxxx.ngrok.io/webhook/whatsapp-webhook
```

## 🧪 اختبار Webhook يدوياً

### اختبار 1: Test URL

```bash
curl "https://n8n-9q4d.onrender.com/webhook-test/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=test123"
```

**النتيجة المتوقعة**: `test123` (plain text) ✅

### اختبار 2: Production URL

```bash
curl "https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=test123"
```

**النتيجة المتوقعة**: `test123` (plain text) ✅

**إذا كانت النتيجة HTML**: الووركفلو غير Active أو webhook غير مسجل ❌

## 📋 خطوات التحقق في Meta

1. **افتح Meta Developer Console**
   - اذهب إلى: https://developers.facebook.com/
   - اختر WhatsApp App → Configuration → Webhooks

2. **استخدم Test URL أولاً** (إذا كان الووركفلو في Test Mode)
   ```
   https://n8n-9q4d.onrender.com/webhook-test/whatsapp-webhook
   ```

3. **أو استخدم Production URL** (إذا كان الووركفلو Active)
   ```
   https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook
   ```

4. **Verify Token**: `my-secret-token`

5. **اضغط "تحقق وحفظ" (Verify and Save)**

## ⚠️ ملاحظات مهمة

1. **الووركفلو يجب أن يكون Active** قبل التحقق
2. **Meta يحتاج إلى plain text response** (ليس JSON)
3. **Response يجب أن يكون challenge value** فقط
4. **إذا فشل التحقق، جرب Test URL أولاً**

## 🔧 إعدادات Webhook Node الحالية

- **Node**: WhatsApp Webhook Verification
- **Type**: Webhook
- **HTTP Method**: GET
- **Path**: `whatsapp-webhook`
- **Response Mode**: `lastNode`
- **Response Data**: `firstEntryJson`
- **Response Code**: 200

## 📞 إذا استمرت المشكلة

1. تحقق من logs في n8n
2. تحقق من Render logs
3. جرب Test Mode أولاً
4. تأكد من أن الووركفلو Active

---

**آخر تحديث**: 2025-12-06


