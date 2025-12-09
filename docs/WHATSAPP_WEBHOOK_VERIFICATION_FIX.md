# إصلاح مشكلة Webhook Verification في Meta

## 🔴 المشكلة الحالية

Meta لا يقبل التحقق من webhook URL:
```
تعذر التحقق من صحة عنوان URL الاستدعاء أو رمز التحقق
```

## ✅ الحل خطوة بخطوة

### الخطوة 1: تفعيل الووركفلو في n8n

**⚠️ مهم جداً**: يجب تفعيل الووركفلو أولاً قبل التحقق في Meta!

1. اذهب إلى: `https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3`
2. اضغط على **Toggle Switch** بجانب "Inactive" لتفعيله
3. انتظر حتى يظهر "Active" ✅

### الخطوة 2: الحصول على Webhook URL الصحيح

بعد تفعيل الووركفلو:

1. في n8n، اضغط على node **"WhatsApp Webhook Verification"**
2. انسخ **Production URL** (ليس Test URL)
3. يجب أن يكون شكله: `https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook`
   - ⚠️ **ليس** `/webhook-test/` - هذا للاختبار فقط
   - ✅ **يجب أن يكون** `/webhook/` - هذا للإنتاج

### الخطوة 3: تحديث Verify Token في الووركفلو

1. في n8n، اضغط على node **"Verify Webhook Token"**
2. في الكود، غيّر:
   ```javascript
   const VERIFY_TOKEN = 'my-secret-token';
   ```
   إلى:
   ```javascript
   const VERIFY_TOKEN = 'my-secret-token'; // أو أي token تريده
   ```
3. **احفظ** الووركفلو

### الخطوة 4: تحديث Webhook في Meta Developer Console

1. اذهب إلى [Meta Developer Console](https://developers.facebook.com/)
2. اختر WhatsApp App
3. اذهب إلى **Configuration** → **Webhooks**
4. في **"عنوان URL الاستدعاء" (Callback URL)**:
   - أدخل: `https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook`
   - ⚠️ تأكد من استخدام `/webhook/` وليس `/webhook-test/`
5. في **"تحقق من الرمز" (Verify Token)**:
   - أدخل: `my-secret-token` (أو نفس القيمة التي استخدمتها في الخطوة 3)
6. اضغط **"تحقق وحفظ" (Verify and Save)**

### الخطوة 5: التحقق من النتيجة

إذا نجح التحقق:
- ✅ ستظهر رسالة نجاح في Meta
- ✅ الـ webhook URL سيظهر كـ "Verified"
- ✅ يمكنك تفعيل Webhook Fields (messages, message_status)

إذا فشل التحقق:
- ❌ تحقق من أن الووركفلو **Active** في n8n
- ❌ تحقق من أن الـ URL يستخدم `/webhook/` وليس `/webhook-test/`
- ❌ تحقق من أن Verify Token متطابق في n8n و Meta
- ❌ تأكد من أن الووركفلو يعمل (جرب Execute workflow)

## 🧪 اختبار Webhook Verification

### اختبار يدوي في n8n:

1. في n8n، اضغط على **"Execute workflow"**
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

### اختبار من Terminal:

```bash
curl "https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=test123"
```

**النتيجة المتوقعة**: `test123` (plain text)

## 📝 ملاحظات مهمة

1. **الووركفلو يجب أن يكون Active** قبل التحقق في Meta
2. **استخدم Production URL** (`/webhook/`) وليس Test URL (`/webhook-test/`)
3. **Verify Token يجب أن يكون متطابق** في n8n و Meta
4. **Meta يتوقع plain text challenge** - تم إصلاح هذا في الووركفلو ✅

## 🔧 استكشاف الأخطاء

### ❌ المشكلة: "تعذر التحقق من صحة عنوان URL"

**الحلول:**
1. ✅ تأكد من أن الووركفلو **Active** في n8n
2. ✅ استخدم Production URL (`/webhook/`) وليس Test URL
3. ✅ تحقق من أن Verify Token متطابق
4. ✅ جرب Execute workflow في n8n للتأكد من أنه يعمل

### ❌ المشكلة: "response does not match challenge"

**السبب**: Meta يتوقع plain text لكن يحصل على JSON أو HTML

**الحل**: ✅ تم إصلاح هذا - "Respond Verification" node يعيد plain text الآن

### ❌ المشكلة: الووركفلو لا يستقبل طلبات من Meta

**الحل:**
1. تحقق من أن الووركفلو Active
2. تحقق من Webhook Fields في Meta (يجب تفعيل `messages` و `message_status`)
3. تحقق من n8n Executions لمعرفة إذا كانت الطلبات تصل

---

**آخر تحديث**: 2025-12-06

