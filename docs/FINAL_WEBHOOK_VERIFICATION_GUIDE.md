# دليل نهائي: إصلاح Webhook Verification في Meta

## 🔴 المشكلة

```
(#2201) response does not match challenge, expected value="6736819", received="\u003C!DOCTYPE html..."
```

**السبب**: Meta يتوقع plain text challenge لكنه يحصل على HTML (من WAF أو Cloudflare).

## ✅ الحل النهائي

### الخطوة 1: تأكد من إعدادات الووركفلو

تم إصلاح الووركفلو بالكامل:
- ✅ "Respond Verification" node يعيد plain text challenge
- ✅ تم إضافة `Content-Type: text/plain; charset=utf-8` header
- ✅ تم تبسيط `responseBody` إلى `={{ $json.challenge }}`

### الخطوة 2: تفعيل الووركفلو في n8n

**⚠️ مهم جداً**: يجب تفعيل الووركفلو أولاً!

1. اذهب إلى: `https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3`
2. اضغط على **Toggle Switch** بجانب "Inactive"
3. انتظر حتى يظهر "Active" ✅
4. **احفظ** الووركفلو

### الخطوة 3: الحصول على Production Webhook URL

بعد تفعيل الووركفلو:

1. اضغط على node **"WhatsApp Webhook Verification"**
2. اذهب إلى tab **"Production URL"** (ليس Test URL)
3. انسخ الـ URL - يجب أن يكون:
   ```
   https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook
   ```
   ⚠️ **تأكد من `/webhook/` وليس `/webhook-test/`**

### الخطوة 4: تحديث Meta Developer Console

1. اذهب إلى [Meta Developer Console](https://developers.facebook.com/)
2. اختر WhatsApp App
3. اذهب إلى **Configuration** → **Webhooks**
4. في **"عنوان URL الاستدعاء" (Callback URL)**:
   - أدخل: `https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook`
   - ⚠️ تأكد من استخدام Production URL (`/webhook/`)
5. في **"تحقق من الرمز" (Verify Token)**:
   - أدخل: `my-secret-token`
6. اضغط **"تحقق وحفظ" (Verify and Save)**

### الخطوة 5: إذا استمر الفشل

إذا استمر فشل التحقق بعد كل الخطوات السابقة، المشكلة قد تكون:

#### أ) WAF أو Cloudflare يعيد HTML

**الحل**: 
- تحقق من إعدادات WAF في Render
- أضف exception لـ webhook URL
- أو استخدم webhook URL مباشرة بدون WAF

#### ب) الووركفلو غير Active

**الحل**:
- تأكد من أن الووركفلو **Active** في n8n
- جرب تفعيله مرة أخرى

#### ج) Verify Token غير متطابق

**الحل**:
- تحقق من أن `VERIFY_TOKEN` في node "Verify Webhook Token" = `my-secret-token`
- تحقق من أن نفس القيمة في Meta Developer Console

## 🧪 اختبار يدوي

### اختبار في n8n:

1. اضغط على **"Execute workflow"**
2. اختر **"from WhatsApp Webhook Verification"**
3. في **Query Parameters**، أضف:
   ```
   hub.mode=subscribe
   hub.verify_token=my-secret-token
   hub.challenge=test123
   ```
4. اضغط **Execute**
5. يجب أن ترى في Output:
   ```json
   {
     "challenge": "test123",
     "verified": true
   }
   ```
6. في "Respond Verification" node output، يجب أن ترى:
   ```
   test123
   ```
   (plain text، ليس JSON)

### اختبار من Terminal:

```bash
curl "https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=test123"
```

**النتيجة المتوقعة**: `test123` (plain text فقط، بدون JSON أو HTML)

## 📋 Checklist النهائي

قبل محاولة التحقق في Meta، تأكد من:

- [ ] الووركفلو **Active** في n8n
- [ ] الووركفلو محفوظ (Saved)
- [ ] تستخدم **Production URL** (`/webhook/whatsapp-webhook`)
- [ ] **ليس** Test URL (`/webhook-test/whatsapp-webhook`)
- [ ] Verify Token متطابق في n8n و Meta (`my-secret-token`)
- [ ] جربت Execute workflow في n8n ونجح
- [ ] جربت curl من Terminal وظهر challenge كـ plain text

## 🔧 استكشاف الأخطاء المتقدم

### ❌ المشكلة: "response does not match challenge"

**الأسباب المحتملة:**
1. WAF/Cloudflare يعيد HTML
2. الووركفلو غير Active
3. تستخدم Test URL بدلاً من Production URL
4. Verify Token غير متطابق

**الحلول:**
1. ✅ تأكد من أن الووركفلو Active
2. ✅ استخدم Production URL (`/webhook/`)
3. ✅ تحقق من Verify Token
4. ✅ جرب curl للتأكد من أن الرد plain text
5. ✅ تحقق من إعدادات WAF في Render

### ❌ المشكلة: الووركفلو Active لكن Meta لا يصل إليه

**الحل:**
- تحقق من n8n Executions - هل تظهر طلبات من Meta؟
- تحقق من Render Logs - هل تصل الطلبات؟
- تحقق من أن Production URL صحيح

---

**آخر تحديث**: 2025-12-06

**ملاحظة**: إذا استمرت المشكلة بعد كل الخطوات، قد تحتاج إلى:
1. التحقق من إعدادات WAF في Render
2. استخدام webhook URL مختلف
3. الاتصال بدعم Render لاستثناء webhook URL من WAF

