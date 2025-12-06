# دليل إعداد واتساب بوت مع n8n - مركز الهمم

## 📋 نظرة عامة

هذا الدليل يشرح كيفية ربط واتساب بوت مع n8n لمركز الهمم. النظام يعمل كالتالي:

```
Meta WhatsApp → Next.js API → n8n Workflow → AI Response → WhatsApp Reply
```

## ✅ المتطلبات الأساسية

### 1. Meta WhatsApp Business API
- ✅ حساب Meta Business
- ✅ WhatsApp Business Account
- ✅ Phone Number ID
- ✅ Access Token (Permanent)
- ✅ Verify Token (اختر أي نص عشوائي)

### 2. n8n
- ✅ n8n مثبت ويعمل
- ✅ Webhook URL متاح (مثل: `https://your-n8n.com/webhook/whatsapp`)

### 3. Environment Variables
- ✅ جميع المتغيرات مضبوطة في Vercel

## 🚀 الخطوات التفصيلية

### الخطوة 1: إعداد Environment Variables في Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر مشروع `himam-system`
3. اذهب إلى **Settings** → **Environment Variables**
4. أضف المتغيرات التالية:

```env
# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=himam_center_2025_secure_token
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx  # من Meta Developer Console
WHATSAPP_PHONE_NUMBER_ID=123456789012345  # من Meta Developer Console

# n8n Webhook URL
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/whatsapp

# AI (اختياري)
GEMINI_API_KEY=your_gemini_api_key
```

**مهم:** بعد إضافة المتغيرات، يجب عمل **Redeploy** للمشروع.

### الخطوة 2: إعداد Webhook في Meta Developer Console

1. اذهب إلى [Meta for Developers](https://developers.facebook.com/)
2. اختر تطبيقك أو أنشئ تطبيق جديد
3. اذهب إلى **WhatsApp** → **Configuration**
4. في قسم **Webhook**:
   - **Callback URL**: `https://himam-system.vercel.app/api/whatsapp`
   - **Verify Token**: `himam_center_2025_secure_token` (نفس القيمة في Vercel)
   - اضغط **Verify and Save**

5. في قسم **Webhook fields**، اختر:
   - ✅ `messages`
   - ✅ `message_status`
   - ✅ `message_reactions` (اختياري)

6. اضغط **Subscribe** لتفعيل Webhook

### الخطوة 3: إنشاء n8n Workflow

#### الطريقة 1: استيراد Workflow الجاهز (موصى به)

1. افتح n8n
2. اذهب إلى **Workflows** → **Import from File**
3. اختر ملف `n8n/whatsapp-bot.json`
4. احفظ Workflow باسم "WhatsApp Bot - مركز الهمم"

#### الطريقة 2: إنشاء Workflow يدوياً

1. **أنشئ Webhook Node:**
   - Type: **Webhook**
   - Method: **POST**
   - Path: `whatsapp`
   - Response Mode: **Respond When Last Node Finishes**
   - اضغط **Listen for Test Event** لنسخ Webhook URL

2. **أضف Code Node لمعالجة البيانات:**
   ```javascript
   const data = $input.item.json;
   
   return {
     from: data.from,
     message: data.text || '',
     timestamp: data.timestamp,
     event: data.event || 'whatsapp_message'
   };
   ```

3. **أضف IF Node للتحقق:**
   - Condition: `message` is not empty

4. **أضف Google Gemini Node (للردود الذكية):**
   - Model: `gemini-pro`
   - Prompt:
     ```
     أنت مساعد ذكي لمركز الهمم الطبي في جدة.
     
     المركز متخصص في:
     - جلسات تخاطب
     - تعديل السلوك
     - العلاج الوظيفي
     - التكامل الحسي
     
     الرد على: {{ $json.message }}
     
     كن مهذباً ومحترفاً. الرد بالعربية.
     ```

5. **أضف HTTP Request Node لإرسال الرد:**
   - Method: **POST**
   - URL: `https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages`
   - Authentication: **Header Auth**
     - Name: `Authorization`
     - Value: `Bearer {{ $env.WHATSAPP_ACCESS_TOKEN }}`
   - Body (JSON):
     ```json
     {
       "messaging_product": "whatsapp",
       "to": "{{ $('Process Message').item.json.from }}",
       "type": "text",
       "text": {
         "body": "{{ $json.response }}"
       }
     }
     ```

6. **أضف Respond to Webhook Node:**
   - Response Body: `{ "ok": true }`

### الخطوة 4: إعداد Credentials في n8n

1. اذهب إلى **Credentials** في n8n
2. أضف **HTTP Header Auth**:
   - Name: `WhatsApp API Auth`
   - Header Name: `Authorization`
   - Header Value: `Bearer YOUR_ACCESS_TOKEN`

3. أضف **Google Gemini API** (إذا كنت تستخدم AI):
   - Name: `Google Gemini(PaLM) Api account`
   - API Key: من Google AI Studio

### الخطوة 5: تفعيل Workflow

1. في n8n، اضغط **Active** لتفعيل Workflow
2. انسخ **Webhook URL** من Webhook Node
3. أضف هذا الـ URL في Vercel Environment Variables:
   ```
   N8N_WEBHOOK_URL=https://your-n8n.com/webhook/whatsapp
   ```

### الخطوة 6: اختبار النظام

#### اختبار 1: Webhook Verification
افتح في المتصفح:
```
https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=himam_center_2025_secure_token&hub.challenge=test123
```

يجب أن يعيد: `test123`

#### اختبار 2: إرسال رسالة
1. أرسل رسالة إلى رقم واتساب الخاص بك
2. تحقق من **Vercel Logs**:
   - اذهب إلى Vercel → Project → **Deployments** → **Functions** → `/api/whatsapp`
   - يجب أن ترى log: `Processing WhatsApp message`

3. تحقق من **n8n Executions**:
   - اذهب إلى n8n → **Executions**
   - يجب أن ترى execution جديد

#### اختبار 3: الرد التلقائي
- إذا كان كل شيء مضبوط، يجب أن تستقبل رد تلقائي من البوت

## 🔧 استكشاف الأخطاء

### ❌ المشكلة: Webhook لا يستقبل الرسائل

**الحل:**
1. تحقق من أن Webhook URL صحيح في Meta Console
2. تحقق من Verify Token (يجب أن يكون متطابق)
3. تحقق من أن Subscription Fields مفعلة
4. تحقق من Vercel Logs للأخطاء

### ❌ المشكلة: n8n لا يستقبل البيانات

**الحل:**
1. تحقق من `N8N_WEBHOOK_URL` في Vercel
2. تأكد من أن Workflow نشط في n8n
3. تحقق من n8n Execution Logs
4. جرب Webhook URL مباشرة:
   ```bash
   curl -X POST https://your-n8n.com/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"from":"966501234567","text":"test","timestamp":"123456"}'
   ```

### ❌ المشكلة: لا يمكن إرسال رسائل

**الحل:**
1. تحقق من `WHATSAPP_ACCESS_TOKEN` (يجب أن يكون Permanent Token)
2. تحقق من `WHATSAPP_PHONE_NUMBER_ID`
3. تحقق من أن الرقم مفعل في Meta
4. تحقق من أن الرقم ليس في "Test Mode" فقط (يحتاج Business Verification)

### ❌ المشكلة: الرسائل لا تصل

**الحل:**
1. تأكد من أن الرقم المرسل إليه مسجل في Meta (للاختبار)
2. في Test Mode، يمكنك إرسال رسائل فقط للأرقام المسجلة
3. للرسائل العامة، تحتاج Business Verification

## 📱 نصائح متقدمة

### 1. حفظ المحادثات في قاعدة البيانات

أضف **Supabase Node** في n8n:

```javascript
// بعد استقبال الرسالة
const { data, error } = await supabase
  .from('whatsapp_messages')
  .insert([{
    from: $json.from,
    message: $json.message,
    timestamp: $json.timestamp,
    direction: 'incoming'
  }])
```

### 2. ربط الرسائل مع بيانات المرضى

أضف **IF Node** للتحقق من رقم المريض:

```javascript
// البحث عن المريض
const { data: patient } = await supabase
  .from('patients')
  .select('*')
  .eq('phone', $json.from)
  .single()

if (patient) {
  // إضافة معلومات المريض للسياق
  return { ...$json, patient }
}
```

### 3. استخدام Templates المعتمدة

للرسائل التلقائية، استخدم Templates:

```json
{
  "messaging_product": "whatsapp",
  "to": "966501234567",
  "type": "template",
  "template": {
    "name": "appointment_reminder",
    "language": { "code": "ar" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "أحمد" },
          { "type": "text", "text": "2025-01-28" }
        ]
      }
    ]
  }
}
```

### 4. إضافة RAG (Retrieval Augmented Generation)

استخدم **Vector Store** في n8n لتحسين الردود:

1. أضف **Supabase Vector Store** node
2. أضف **Retriever** node
3. أضف **AI Agent** node مع Retriever كـ tool

## 📊 مراقبة النظام

### Vercel Logs
- اذهب إلى Vercel → Project → **Functions** → `/api/whatsapp`
- راقب الأخطاء والاستجابات

### n8n Executions
- اذهب إلى n8n → **Executions**
- راقب نجاح/فشل Workflows

### Meta Webhook Status
- اذهب إلى Meta Developer Console → **Webhooks**
- تحقق من حالة Webhook (Active/Inactive)

## ✅ Checklist النهائي

- [ ] Environment Variables مضبوطة في Vercel
- [ ] Webhook مضبوط في Meta Console
- [ ] n8n Workflow منشأ ومفعل
- [ ] Webhook URL مضاف في Vercel
- [ ] Credentials مضبوطة في n8n
- [ ] Webhook Verification يعمل
- [ ] الرسائل تستقبل بنجاح
- [ ] الردود التلقائية تعمل
- [ ] النظام يعمل في Production

## 🎯 الخطوات التالية

1. **إضافة Templates:** أنشئ templates معتمدة من Meta
2. **تحسين AI:** أضف RAG للمعرفة
3. **ربط مع CRM:** ربط الرسائل مع بيانات المرضى
4. **إشعارات المواعيد:** إرسال تذكيرات تلقائية
5. **تحليلات:** تتبع المحادثات والإحصائيات

---

**دعم:** إذا واجهت مشاكل، تحقق من:
- [Vercel Logs](https://vercel.com/dashboard)
- [n8n Executions](https://your-n8n.com/executions)
- [Meta Developer Console](https://developers.facebook.com/)

