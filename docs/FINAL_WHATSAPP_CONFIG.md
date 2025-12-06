# ✅ الإعدادات النهائية - WhatsApp + n8n Integration

## 📋 ملخص الإعدادات الكاملة

### 1. قاعدة البيانات (Supabase)

**جدول: `whatsapp_settings`**

| الحقل | القيمة |
|-------|--------|
| **verify_token** | `meta-webhook-verify-2025` |
| **access_token** | `EAAekiSTO6eMBP38y3arfKP4MgrDi3UZB1Ggf59m693ZAN5BZBUm1TxggP9UsqASsnyBMwZBL0camlZALmDnD5yngKdGGFvEiLtsIUgtByWRvnZCJqZAeDI4iGGXbpCLpqyMwNLb8Dr7kS37254kdZCRnlv2XPcmyQ3poXO6kZA7iO0TpR0v5UOVd8ZBObKu8mG7yWPZAQZDZD` |
| **phone_number_id** | `843049648895545` |
| **webhook_url** | `https://himam-system.vercel.app/api/whatsapp` |
| **n8n_webhook_url** | `https://n8n-9q4d.onrender.com/webhook-test/whatsapp-ai` |
| **is_active** | `true` |

### 2. Meta Developer Console

**Webhook Configuration:**
- **Callback URL**: `https://himam-system.vercel.app/api/whatsapp`
- **Verify Token**: `meta-webhook-verify-2025`
- **Webhook Fields**: 
  - ✅ `messages`
  - ✅ `message_status`

**API Setup:**
- **Phone Number ID**: `843049648895545`
- **Access Token**: Permanent Token (مخزن في قاعدة البيانات)

### 3. n8n Workflow

**Webhook Node:**
- **URL**: `https://n8n-9q4d.onrender.com/webhook-test/whatsapp-ai`
- **Method**: `POST`
- **Path**: `whatsapp-ai`
- **Authentication**: `None`
- **Response Mode**: `Immediately`

**Workflow Status:**
- ✅ يجب أن يكون Workflow **Active**
- ✅ Webhook Node يجب أن يكون **Listening**

### 4. Vercel Environment Variables

**مطلوب:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://gpcxowqljayhkxyybfqu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**اختياري (Fallback):**
```env
WHATSAPP_VERIFY_TOKEN=meta-webhook-verify-2025
WHATSAPP_ACCESS_TOKEN=EAAekiSTO6eMBP38y3arfKP4MgrDi3UZB1Ggf59m693ZAN5BZBUm1TxggP9UsqASsnyBMwZBL0camlZALmDnD5yngKdGGFvEiLtsIUgtByWRvnZCJqZAeDI4iGGXbpCLpqyMwNLb8Dr7kS37254kdZCRnlv2XPcmyQ3poXO6kZA7iO0TpR0v5UOVd8ZBObKu8mG7yWPZAQZDZD
WHATSAPP_PHONE_NUMBER_ID=843049648895545
N8N_WEBHOOK_URL=https://n8n-9q4d.onrender.com/webhook-test/whatsapp-ai
```

## 🔄 Flow الكامل

```
1. Meta WhatsApp → Webhook → Next.js API (/api/whatsapp)
2. Next.js API → قراءة الإعدادات من Supabase
3. Next.js API → إرسال البيانات إلى n8n Webhook
4. n8n Workflow → معالجة الرسالة
5. n8n Workflow → إرسال رد عبر WhatsApp API
```

## ✅ Checklist النهائي

### قاعدة البيانات
- [x] جدول `whatsapp_settings` موجود
- [x] إعدادات نشطة (`is_active = true`)
- [x] جميع القيم محدثة
- [x] RLS policies مفعلة

### Meta Console
- [ ] Webhook URL مضبوط: `https://himam-system.vercel.app/api/whatsapp`
- [ ] Verify Token مضبوط: `meta-webhook-verify-2025`
- [ ] Webhook Fields محددة: `messages`, `message_status`
- [ ] Webhook Verified و Subscribed
- [ ] Phone Number ID: `843049648895545`
- [ ] Access Token: Permanent Token

### Vercel
- [ ] Environment Variables مضبوطة (Supabase على الأقل)
- [ ] آخر deployment ناجح
- [ ] Functions تعمل بدون أخطاء

### n8n
- [ ] Workflow منشأ ومفعل
- [ ] Webhook Node نشط و Listening
- [ ] Webhook URL: `https://n8n-9q4d.onrender.com/webhook-test/whatsapp-ai`
- [ ] Credentials مضبوطة (Google Gemini إذا كان مستخدماً)
- [ ] HTTP Request Node لإرسال ردود WhatsApp

### الاختبار
- [ ] Webhook Verification يعمل
- [ ] استقبال رسالة يعمل
- [ ] n8n يستقبل البيانات
- [ ] الرد التلقائي يعمل

## 🧪 خطوات الاختبار

### 1. اختبار Webhook Verification
```bash
curl "https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=meta-webhook-verify-2025&hub.challenge=test123"
```
**النتيجة المتوقعة:** `test123`

### 2. اختبار n8n Webhook
```bash
curl -X POST https://n8n-9q4d.onrender.com/webhook-test/whatsapp-ai \
  -H "Content-Type: application/json" \
  -d '{"event":"whatsapp_message","from":"966501234567","text":"test","timestamp":"123456"}'
```

### 3. اختبار كامل
1. أرسل رسالة إلى رقم واتساب
2. تحقق من Vercel Logs
3. تحقق من n8n Executions
4. تحقق من استقبال رد تلقائي

## 🔧 استكشاف الأخطاء

### المشكلة: Webhook Verification Failed
**الحل:**
1. تحقق من Vercel Logs
2. تأكد من أن Supabase Environment Variables موجودة
3. عمل Redeploy في Vercel
4. تحقق من أن Verify Token متطابق تماماً

### المشكلة: n8n لا يستقبل البيانات
**الحل:**
1. تحقق من أن Workflow نشط
2. تحقق من Webhook URL في قاعدة البيانات
3. تحقق من n8n Logs
4. جرب Webhook URL مباشرة

### المشكلة: لا يمكن إرسال رسائل
**الحل:**
1. تحقق من Access Token (يجب أن يكون Permanent)
2. تحقق من Phone Number ID
3. تحقق من أن الرقم مفعل في Meta

## 📝 ملاحظات مهمة

1. **الإعدادات ديناميكية**: جميع الإعدادات تُقرأ من قاعدة البيانات أولاً، ثم Environment Variables كـ fallback
2. **n8n Webhook**: يمكن تحديثه من قاعدة البيانات بدون redeploy
3. **Security**: Access Token محفوظ في قاعدة البيانات مع RLS policies
4. **Monitoring**: راقب Vercel Logs و n8n Executions بانتظام

---

**آخر تحديث:** 2025-12-06
**الحالة:** ✅ جاهز للاختبار

