# ✅ خطوات تفعيل WhatsApp Bot - دليل نهائي

## 🎯 الحالة الحالية

✅ **Webhook يعمل بشكل صحيح**
- تم إصلاح الكود في `app/api/whatsapp/route.ts`
- Webhook يعيد plain text challenge كما هو متوقع
- تم عمل commit و push للتغييرات

## 📋 الخطوات النهائية للتفعيل

### 1️⃣ التحقق من Webhook في Meta Developer Console

1. اذهب إلى [Meta Developer Console](https://developers.facebook.com/)
2. اختر **WhatsApp App** الخاص بك
3. اذهب إلى **Configuration** → **Webhooks**
4. في قسم **Webhooks**:
   - **Callback URL**: `https://himam-system.vercel.app/api/whatsapp`
   - **Verify Token**: `meta-webhook-verify-2025`
5. اضغط **Verify and Save**
6. تأكد من تفعيل **Webhook Fields**:
   - ✅ `messages`
   - ✅ `message_status`

**النتيجة المتوقعة**: ✅ **Verified** (بدون أخطاء)

---

### 2️⃣ تفعيل Workflow في n8n

1. اذهب إلى: `https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3`
2. اضغط على **Toggle Switch** بجانب **"Inactive"** لتفعيله
3. يجب أن يظهر **"Active"** بدون أخطاء

**النتيجة المتوقعة**: ✅ **Workflow Active**

---

### 3️⃣ التحقق من الإعدادات في قاعدة البيانات

تأكد من وجود إعدادات صحيحة في جدول `whatsapp_settings`:

```sql
SELECT * FROM whatsapp_settings WHERE is_active = true;
```

**القيم المطلوبة:**
- `verify_token`: `meta-webhook-verify-2025`
- `access_token`: (Permanent Token من Meta)
- `phone_number_id`: `843049648895545`
- `webhook_url`: `https://himam-system.vercel.app/api/whatsapp`
- `n8n_webhook_url`: `https://n8n-9q4d.onrender.com/webhook/whatsapp-ai`
- `is_active`: `true`

---

## 🧪 الاختبار

### اختبار 1: Webhook Verification

```bash
curl "https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=meta-webhook-verify-2025&hub.challenge=test123"
```

**النتيجة المتوقعة**: `test123` (plain text)

### اختبار 2: إرسال رسالة واتساب

1. أرسل رسالة إلى رقم واتساب الخاص بك
2. تحقق من **Vercel Logs**:
   - يجب أن تظهر رسالة استقبال
   - يجب أن تظهر إرسال إلى n8n
3. تحقق من **n8n Executions**:
   - يجب أن تظهر execution جديدة
   - يجب أن تكون ناجحة (✅)
4. تحقق من استقبال **رد تلقائي** من البوت

---

## 🔧 استكشاف الأخطاء

### ❌ المشكلة: Meta Webhook Verification Failed

**الأعراض:**
```
(#2201) response does not match challenge
```

**الحل:**
1. ✅ تم إصلاح الكود (يعيد plain text الآن)
2. تأكد من عمل **Redeploy** في Vercel (إذا لم يتم تلقائياً)
3. تحقق من أن `verify_token` في قاعدة البيانات = `meta-webhook-verify-2025`
4. جرب التحقق مرة أخرى في Meta Console

---

### ❌ المشكلة: n8n Workflow لا يستقبل البيانات

**الأعراض:**
- لا تظهر executions جديدة في n8n
- رسائل واتساب لا تصل إلى n8n

**الحل:**
1. تحقق من أن Workflow **Active**
2. تحقق من `n8n_webhook_url` في قاعدة البيانات:
   ```sql
   SELECT n8n_webhook_url FROM whatsapp_settings WHERE is_active = true;
   ```
3. اختبر n8n webhook مباشرة:
   ```bash
   curl -X POST https://n8n-9q4d.onrender.com/webhook/whatsapp-ai \
     -H "Content-Type: application/json" \
     -d '{"test":"data"}'
   ```
4. تحقق من Vercel Logs لمعرفة إذا كانت البيانات تُرسل إلى n8n

---

### ❌ المشكلة: لا يمكن إرسال ردود تلقائية

**الأعراض:**
- n8n يستقبل البيانات لكن لا يرسل ردود

**الحل:**
1. تحقق من **Send AI Reply2** node في n8n:
   - Access Token صحيح
   - Phone Number ID صحيح
   - Request body صحيح
2. تحقق من **Chat Memory2** node:
   - Session Key يعمل بشكل صحيح
   - Table name: `conversation_history`
3. تحقق من **Gemini Chat Model** credentials في n8n

---

## 📝 ملاحظات مهمة

1. **الإعدادات ديناميكية**: جميع الإعدادات تُقرأ من قاعدة البيانات أولاً
2. **Fallback**: إذا فشل الاتصال بقاعدة البيانات، يستخدم Environment Variables
3. **Security**: Access Token محفوظ في قاعدة البيانات مع RLS policies
4. **Monitoring**: راقب Vercel Logs و n8n Executions بانتظام

---

## ✅ Checklist النهائي

### Meta Developer Console
- [ ] Webhook URL: `https://himam-system.vercel.app/api/whatsapp`
- [ ] Verify Token: `meta-webhook-verify-2025`
- [ ] Webhook Verified ✅
- [ ] Webhook Fields: `messages`, `message_status`
- [ ] Phone Number ID: `843049648895545`

### قاعدة البيانات (Supabase)
- [ ] جدول `whatsapp_settings` موجود
- [ ] إعدادات نشطة (`is_active = true`)
- [ ] جميع القيم محدثة وصحيحة
- [ ] RLS policies مفعلة

### Vercel
- [ ] آخر deployment ناجح
- [ ] Environment Variables موجودة (Supabase على الأقل)
- [ ] Webhook يعمل (تم اختباره)

### n8n
- [ ] Workflow Active ✅
- [ ] Webhook Node Listening
- [ ] جميع Nodes مضبوطة بشكل صحيح
- [ ] Credentials موجودة (Gemini, Supabase)

### الاختبار
- [ ] Webhook Verification يعمل
- [ ] إرسال رسالة واتساب يعمل
- [ ] استقبال رد تلقائي يعمل
- [ ] البيانات تُحفظ في `conversation_history`

---

**آخر تحديث**: 2025-12-06  
**الحالة**: ✅ جاهز للتفعيل

