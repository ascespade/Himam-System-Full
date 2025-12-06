# إعداد n8n Workflow للواتساب

## 🔗 Workflow URL
**Workflow ID**: `8zRVOFoZDzV9JjDA`  
**URL**: `https://n8n-9q4d.onrender.com/workflow/8zRVOFoZDzV9JjDA`

## 📋 الإعدادات المطلوبة

### 1. Webhook Node Configuration

**WhatsApp Webhook (Verification):**
- **HTTP Method**: `GET`
- **Path**: `whatsapp-ai` (أو أي path تختاره)
- **Response Mode**: `Immediately`
- **URL**: `https://n8n-9q4d.onrender.com/webhook/whatsapp-ai`

**Verify Webhook Token:**
- يجب أن يتحقق من `hub.verify_token` = `meta-webhook-verify-2025`
- يجب أن يعيد `hub.challenge` value

**Respond Verification:**
- يجب أن يعيد challenge value كـ plain text (ليس JSON)

### 2. WhatsApp Trigger Node

**Configuration:**
- **Webhook URL**: `https://n8n-9q4d.onrender.com/webhook/whatsapp-ai`
- **Method**: `POST`
- **Path**: `whatsapp-ai`

**Expected Input from Next.js:**
```json
{
  "event": "whatsapp_message",
  "from": "966501234567",
  "text": "مرحبا",
  "timestamp": "1234567890"
}
```

### 3. Load Config from DB

يجب أن يقرأ الإعدادات من Supabase:
- **Table**: `whatsapp_settings`
- **Filter**: `is_active = true`
- **Fields**: `access_token`, `phone_number_id`, `verify_token`

### 4. Send WhatsApp Node

**Configuration:**
- **URL**: `https://graph.facebook.com/v18.0/{{ $json.phone_number_id }}/messages`
- **Method**: `POST`
- **Headers**:
  - `Authorization`: `Bearer {{ $json.access_token }}`
  - `Content-Type`: `application/json`
- **Body**:
```json
{
  "messaging_product": "whatsapp",
  "to": "{{ $json.from }}",
  "type": "text",
  "text": {
    "body": "{{ $json.response }}"
  }
}
```

## ✅ Checklist لتفعيل Workflow

### قبل التفعيل:
- [ ] Webhook Node مضبوط بشكل صحيح
- [ ] Verify Token = `meta-webhook-verify-2025`
- [ ] Challenge response يعيد plain text
- [ ] Supabase credentials مضبوطة
- [ ] WhatsApp API credentials مضبوطة
- [ ] Google Gemini credentials مضبوطة (إذا كان مستخدماً)

### خطوات التفعيل:
1. **افتح Workflow**: `https://n8n-9q4d.onrender.com/workflow/8zRVOFoZDzV9JjDA`
2. **تحقق من Webhook Node**:
   - اضغط على Webhook Node
   - تأكد من أن Path = `whatsapp-ai`
   - اضغط "Listen for test event" للتحقق
3. **تحقق من Verify Webhook Token**:
   - يجب أن يتحقق من `hub.verify_token`
   - يجب أن يعيد `hub.challenge`
4. **تفعيل Workflow**:
   - اضغط "Active" toggle في الأعلى
   - تأكد من أن Workflow أصبح Active (أخضر)
5. **اختبار**:
   - أرسل رسالة إلى رقم واتساب
   - تحقق من Executions في n8n

## 🔧 حل مشكلة Webhook Verification

### المشكلة:
```
(#2201) response does not match challenge, expected value="1989270154", received="<!DOCTYPE html>..."
```

### الحل:
1. **في Next.js API** (`/api/whatsapp`):
   - يجب أن يعيد challenge value كـ **plain text** (ليس JSON)
   - Content-Type: `text/plain`

2. **في n8n Verify Webhook Token Node**:
   - يجب أن يقرأ `hub.challenge` من query parameters
   - يجب أن يعيد نفس القيمة كـ plain text

3. **في n8n Respond Verification Node**:
   - يجب أن يعيد challenge value مباشرة
   - لا تستخدم JSON.stringify

## 📝 ملاحظات مهمة

1. **Webhook URL**: 
   - Test: `https://n8n-9q4d.onrender.com/webhook-test/whatsapp-ai`
   - Production: `https://n8n-9q4d.onrender.com/webhook/whatsapp-ai`

2. **Next.js API**:
   - URL: `https://himam-system.vercel.app/api/whatsapp`
   - يرسل البيانات إلى n8n عند استقبال رسالة

3. **Database Settings**:
   - جميع الإعدادات في `whatsapp_settings` table
   - `n8n_webhook_url` = `https://n8n-9q4d.onrender.com/webhook/whatsapp-ai`

## 🧪 اختبار Workflow

### اختبار 1: Webhook Verification
```bash
curl "https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=meta-webhook-verify-2025&hub.challenge=test123"
```
**النتيجة المتوقعة:** `test123` (plain text)

### اختبار 2: n8n Webhook
```bash
curl -X POST https://n8n-9q4d.onrender.com/webhook/whatsapp-ai \
  -H "Content-Type: application/json" \
  -d '{"event":"whatsapp_message","from":"966501234567","text":"test","timestamp":"123456"}'
```

### اختبار 3: كامل
1. أرسل رسالة إلى رقم واتساب
2. تحقق من Vercel Logs
3. تحقق من n8n Executions
4. تحقق من استقبال رد تلقائي

---

**آخر تحديث:** 2025-12-06  
**Workflow ID:** `8zRVOFoZDzV9JjDA`  
**Status:** ✅ جاهز للتفعيل

