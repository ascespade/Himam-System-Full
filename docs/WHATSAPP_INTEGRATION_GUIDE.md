# 📘 دليل تكامل WhatsApp مع النظام

## ✅ ما تم إنجازه

### 1. Workflow جديد في n8n
- **Workflow ID**: `ZjCwW2WthPoFWXvQ`
- **الاسم**: "AlHimam WhatsApp Integration (Database Connected)"
- **Webhook Path**: `whatsapp-integration`
- **Production URL**: `https://n8n-9q4d.onrender.com/webhook/whatsapp-integration`

**المكونات:**
1. **Webhook Receiver**: يستقبل POST requests من النظام
2. **Load WhatsApp Settings**: يحمّل الإعدادات من قاعدة البيانات (Supabase)
3. **Extract Message**: يستخرج الرسالة من payload
4. **Save Conversation**: يحفظ المحادثة في قاعدة البيانات
5. **Send WhatsApp Reply**: يرسل رد عبر WhatsApp API
6. **Respond to Webhook**: يرد على webhook

### 2. API Endpoints لإدارة الإعدادات

#### GET `/api/whatsapp/settings`
- جلب جميع الإعدادات (للمسؤولين)

#### GET `/api/whatsapp/settings/active`
- جلب الإعدادات النشطة

#### POST `/api/whatsapp/settings`
- إنشاء إعدادات جديدة

#### PUT `/api/whatsapp/settings/[id]`
- تحديث إعدادات موجودة

#### DELETE `/api/whatsapp/settings/[id]`
- حذف/تعطيل إعدادات

### 3. شاشة الإعدادات

**المسار**: `/dashboard/settings`

**المميزات:**
- ✅ عرض الإعدادات النشطة
- ✅ تعديل الإعدادات
- ✅ إنشاء إعدادات جديدة
- ✅ تفعيل/تعطيل الإعدادات
- ✅ حفظ الإعدادات في قاعدة البيانات

**الحقول:**
- Verify Token
- Access Token
- Phone Number ID
- Webhook URL
- n8n Webhook URL
- Active Status

### 4. التكامل مع WhatsApp API

**الميزات:**
- ✅ استقبال الرسائل من Meta
- ✅ إرسال الرسائل عبر Meta API
- ✅ حفظ المحادثات في قاعدة البيانات
- ✅ استخدام الإعدادات من قاعدة البيانات (بدلاً من environment variables)

## 📋 خطوات الإعداد

### الخطوة 1: إعداد قاعدة البيانات

1. تأكد من أن جدول `whatsapp_settings` موجود في Supabase
2. أضف إعدادات أولية:

```sql
INSERT INTO whatsapp_settings (
  verify_token,
  access_token,
  phone_number_id,
  webhook_url,
  n8n_webhook_url,
  is_active
) VALUES (
  'your-verify-token',
  'your-access-token',
  'your-phone-number-id',
  'https://your-domain.com/api/whatsapp',
  'https://n8n-9q4d.onrender.com/webhook/whatsapp-integration',
  true
);
```

### الخطوة 2: إعداد Meta Developer Console

1. اذهب إلى [Meta Developer Console](https://developers.facebook.com/)
2. اختر WhatsApp App
3. في **Configuration** → **Webhooks**:
   - **Callback URL**: `https://your-domain.com/api/whatsapp`
   - **Verify Token**: نفس القيمة في قاعدة البيانات
   - **Webhook Fields**: فعّل `messages` و `message_status`

### الخطوة 3: تفعيل n8n Workflow

1. اذهب إلى: `https://n8n-9q4d.onrender.com/workflow/ZjCwW2WthPoFWXvQ`
2. اضغط على **Toggle Switch** لتفعيل الووركفلو
3. تأكد من أن الووركفلو **Active** ✅

### الخطوة 4: تحديث الإعدادات في النظام

1. اذهب إلى: `/dashboard/settings`
2. أدخل الإعدادات:
   - **Verify Token**: من Meta Developer Console
   - **Access Token**: من Meta Developer Console
   - **Phone Number ID**: من Meta Developer Console
   - **Webhook URL**: URL الخاص بـ webhook في النظام
   - **n8n Webhook URL**: `https://n8n-9q4d.onrender.com/webhook/whatsapp-integration`
   - **Active**: ✅
3. اضغط **حفظ الإعدادات**

### الخطوة 5: تحديث n8n Webhook URL في قاعدة البيانات

بعد تفعيل workflow، انسخ Production Webhook URL من n8n وأضفه في الإعدادات.

## 🔄 تدفق العمل

1. **المستخدم يرسل رسالة على WhatsApp**
   ↓
2. **Meta يرسل webhook إلى النظام** (`/api/whatsapp`)
   ↓
3. **النظام يرسل webhook إلى n8n** (`/webhook/whatsapp-integration`)
   ↓
4. **n8n Workflow:**
   - يحمّل الإعدادات من قاعدة البيانات
   - يستخرج الرسالة
   - يحفظ المحادثة في قاعدة البيانات
   - يرسل رد عبر WhatsApp API
   ↓
5. **المستخدم يستلم الرد على WhatsApp**

## 🧪 الاختبار

### اختبار 1: API Endpoints

```bash
# جلب الإعدادات النشطة
curl https://your-domain.com/api/whatsapp/settings/active

# جلب جميع الإعدادات
curl https://your-domain.com/api/whatsapp/settings
```

### اختبار 2: n8n Workflow

```bash
# اختبار webhook
curl -X POST https://n8n-9q4d.onrender.com/webhook/whatsapp-integration \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "966501234567",
            "text": {"body": "مرحبا"},
            "id": "test123"
          }]
        }
      }]
    }]
  }'
```

### اختبار 3: إرسال رسالة على WhatsApp

1. أرسل رسالة إلى رقم WhatsApp المرتبط
2. تحقق من أن الرسالة تم حفظها في `conversation_history`
3. تحقق من أن الرد تم إرساله

## 📝 ملاحظات مهمة

1. **الإعدادات من قاعدة البيانات**: النظام يستخدم الإعدادات من قاعدة البيانات أولاً، ثم يلجأ إلى environment variables كـ fallback
2. **إعداد واحد نشط فقط**: يمكن أن يكون هناك إعداد واحد نشط فقط في كل وقت
3. **Security**: Access Token مخزن في قاعدة البيانات - تأكد من حماية قاعدة البيانات
4. **n8n Workflow**: يجب أن يكون Active ليعمل webhook

## 🔧 Troubleshooting

### المشكلة: Webhook لا يعمل
- تحقق من أن workflow Active في n8n
- تحقق من أن webhook URL صحيح في الإعدادات
- تحقق من logs في n8n

### المشكلة: الرسائل لا تُرسل
- تحقق من Access Token في الإعدادات
- تحقق من Phone Number ID
- تحقق من logs في n8n

### المشكلة: الإعدادات لا تُحفظ
- تحقق من RLS policies في Supabase
- تحقق من أن المستخدم لديه صلاحيات الكتابة

## 📚 الملفات المهمة

- **Workflow**: `n8n/workflow-ZjCwW2WthPoFWXvQ.json`
- **API Routes**: 
  - `app/api/whatsapp/route.ts`
  - `app/api/whatsapp/settings/route.ts`
  - `app/api/whatsapp/settings/[id]/route.ts`
  - `app/api/whatsapp/settings/active/route.ts`
- **Settings Page**: `app/dashboard/settings/page.tsx`
- **Repository**: `src/infrastructure/supabase/repositories/whatsapp-settings.repository.ts`
- **Database Migration**: `supabase/migrations/002_create_whatsapp_settings.sql`

