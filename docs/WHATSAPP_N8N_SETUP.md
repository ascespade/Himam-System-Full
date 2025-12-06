# دليل إعداد واتساب بوت مع n8n

## المتطلبات الأساسية

### 1. Meta WhatsApp Business API
- حساب Meta Business
- WhatsApp Business Account
- Phone Number ID
- Access Token
- Verify Token (يمكنك اختيار أي نص)

### 2. n8n
- n8n مثبت ويعمل
- Webhook URL متاح

## الخطوات التفصيلية

### الخطوة 1: إعداد Environment Variables في Vercel

اذهب إلى Vercel Dashboard → Project Settings → Environment Variables وأضف:

```env
# WhatsApp Business API
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# n8n Webhook URL
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/whatsapp
```

### الخطوة 2: إعداد Webhook في Meta Developer Console

1. اذهب إلى [Meta for Developers](https://developers.facebook.com/)
2. افتح تطبيقك → WhatsApp → Configuration
3. أضف Webhook URL:
   ```
   https://himam-system.vercel.app/api/whatsapp
   ```
4. أضف Verify Token (نفس القيمة في `WHATSAPP_VERIFY_TOKEN`)
5. اختر Subscription Fields:
   - ✅ `messages`
   - ✅ `message_status`

### الخطوة 3: إنشاء n8n Workflow

#### Option A: استقبال الرسائل من Next.js (موصى به)

1. افتح n8n
2. أنشئ workflow جديد باسم "WhatsApp Bot"
3. أضف **Webhook** node:
   - Method: POST
   - Path: `whatsapp`
   - Response Mode: Respond When Last Node Finishes
4. أضف **Function** node لمعالجة البيانات:
   ```javascript
   const data = $input.item.json;
   
   return {
     from: data.from,
     message: data.text,
     timestamp: data.timestamp,
     event: data.event
   };
   ```
5. أضف **IF** node للتحقق من نوع الرسالة
6. أضف **HTTP Request** node لإرسال رد عبر WhatsApp:
   - Method: POST
   - URL: `https://graph.facebook.com/v18.0/{{ $env.WHATSAPP_PHONE_NUMBER_ID }}/messages`
   - Authentication: Generic Credential Type → Header Auth
     - Name: `Authorization`
     - Value: `Bearer {{ $env.WHATSAPP_ACCESS_TOKEN }}`
   - Body:
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

#### Option B: استقبال مباشر من Meta (بدون Next.js)

1. أضف **Webhook** node:
   - URL: `https://your-n8n.com/webhook/meta-whatsapp`
   - Method: POST
2. أضف **Function** node لاستخراج البيانات:
   ```javascript
   const entry = $input.item.json.entry?.[0];
   const changes = entry?.changes?.[0];
   const value = changes?.value;
   const message = value?.messages?.[0];
   
   if (!message) return null;
   
   return {
     from: message.from,
     text: message.text?.body || '',
     timestamp: message.timestamp,
     messageId: message.id
   };
   ```
3. أضف باقي المعالجة...

### الخطوة 4: إضافة AI Response (اختياري)

1. أضف **OpenAI** أو **Google Gemini** node بعد استقبال الرسالة
2. أضف **Prompt**:
   ```
   أنت مساعد ذكي لمركز الهمم الطبي في جدة.
   الرد على رسالة العميل: {{ $json.message }}
   
   كن مهذباً ومحترفاً وقدم معلومات مفيدة عن المركز.
   ```
3. أضف **HTTP Request** node لإرسال الرد عبر WhatsApp

### الخطوة 5: ربط n8n مع Next.js

في Next.js API route (`/api/whatsapp/route.ts`)، الكود موجود بالفعل:

```typescript
if (process.env.N8N_WEBHOOK_URL) {
  await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'whatsapp_message',
      from,
      text,
      timestamp: message.timestamp,
    }),
  })
}
```

### الخطوة 6: اختبار النظام

1. **اختبار Webhook Verification:**
   ```
   GET https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test
   ```
   يجب أن يعيد `test`

2. **إرسال رسالة تجريبية:**
   - أرسل رسالة إلى رقم واتساب الخاص بك
   - تحقق من logs في Vercel
   - تحقق من n8n workflow execution

3. **اختبار الرد التلقائي:**
   - تأكد من أن n8n workflow يعمل
   - تحقق من إرسال الرد

## استكشاف الأخطاء

### المشكلة: Webhook لا يستقبل الرسائل
- ✅ تحقق من أن Webhook URL صحيح في Meta Console
- ✅ تحقق من Verify Token
- ✅ تحقق من أن Subscription Fields مفعلة
- ✅ تحقق من Vercel logs

### المشكلة: n8n لا يستقبل البيانات
- ✅ تحقق من `N8N_WEBHOOK_URL` في Vercel
- ✅ تحقق من أن n8n workflow نشط
- ✅ تحقق من n8n execution logs

### المشكلة: لا يمكن إرسال رسائل
- ✅ تحقق من `WHATSAPP_ACCESS_TOKEN`
- ✅ تحقق من `WHATSAPP_PHONE_NUMBER_ID`
- ✅ تحقق من أن الرقم مفعل في Meta
- ✅ تحقق من أن الرقم ليس في وضع "Test Mode" فقط

## نصائح إضافية

1. **استخدام Templates:**
   - يمكنك إرسال templates معتمدة من Meta
   - Templates تحتاج موافقة من Meta أولاً

2. **حفظ المحادثات:**
   - أضف Supabase node في n8n لحفظ الرسائل
   - أنشئ جدول `whatsapp_messages` في Supabase

3. **الردود الذكية:**
   - استخدم AI (Gemini/OpenAI) للردود التلقائية
   - أضف قاعدة بيانات للمعرفة (RAG)

4. **التكامل مع CRM:**
   - ربط الرسائل مع بيانات المرضى
   - إرسال إشعارات للمواعيد

## مثال Workflow JSON

يمكنك استيراد workflow جاهز من مجلد `n8n/whatsapp-bot.json` (سيتم إنشاؤه)

