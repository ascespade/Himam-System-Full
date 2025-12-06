# 📘 دليل استخدام Production Webhook

## 🔗 Production Webhook URL

```
https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook
```

## ⚠️ متطلبات مهمة

**يجب أن يكون الووركفلو Active في n8n قبل استخدام Production URL!**

- ✅ الووركفلو Active → Production URL يعمل
- ❌ الووركفلو غير Active → Production URL يعيد HTML (404)

## 📋 خطوات الإعداد في Meta Developer Console

### 1. تفعيل الووركفلو في n8n أولاً

1. اذهب إلى: `https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3`
2. اضغط على **Toggle Switch** بجانب "Inactive" لتفعيله
3. تأكد من أن الووركفلو **Active** ✅

### 2. إعداد Webhook في Meta Developer Console

1. اذهب إلى [Meta Developer Console](https://developers.facebook.com/)
2. اختر **WhatsApp App** الخاص بك
3. اذهب إلى **Configuration** → **Webhooks**
4. في **"عنوان URL الاستدعاء" (Callback URL)**:
   ```
   https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook
   ```
   ⚠️ **تأكد من استخدام Production URL (`/webhook/` وليس `/webhook-test/`)**
5. في **"تحقق من الرمز" (Verify Token)**:
   ```
   my-secret-token
   ```
6. اضغط **"تحقق وحفظ" (Verify and Save)**
7. ✅ **التحقق يجب أن ينجح!**

### 3. تفعيل Webhook Fields

في Meta Developer Console → Webhooks، فعّل الحقول التالية:

- ✅ `messages` - لاستقبال الرسائل
- ✅ `message_status` - لتتبع حالة الرسائل (اختياري)

## 🧪 اختبار Production Webhook

### اختبار 1: Webhook Verification (GET Request)

```bash
curl "https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=test123"
```

**النتيجة المتوقعة**: `test123` (plain text) ✅

**إذا حصلت على HTML**: الووركفلو غير Active ❌

### اختبار 2: استقبال رسالة WhatsApp (POST Request)

عندما يرسل مستخدم رسالة إلى رقم WhatsApp الخاص بك، Meta سيرسل POST request إلى webhook:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "PHONE_NUMBER",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "USER_NAME"
                },
                "wa_id": "USER_PHONE_NUMBER"
              }
            ],
            "messages": [
              {
                "from": "USER_PHONE_NUMBER",
                "id": "MESSAGE_ID",
                "timestamp": "TIMESTAMP",
                "text": {
                  "body": "MESSAGE_TEXT"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**الووركفلو سيقوم بـ:**
1. استقبال الرسالة من Meta
2. استخراج النص ورقم المرسل
3. تحميل المحادثة السابقة من Supabase
4. بناء prompt للـ AI
5. الحصول على رد من Gemini AI
6. حفظ المحادثة في Supabase
7. إرسال الرد إلى المستخدم عبر WhatsApp API
8. تقييم جودة الرد (اختياري)
9. حفظ في قاعدة المعرفة (اختياري)

## 📝 ملاحظات مهمة

### Production URL vs Test URL

| الميزة | Production URL | Test URL |
|--------|---------------|----------|
| **URL** | `/webhook/whatsapp-webhook` | `/webhook-test/whatsapp-webhook` |
| **يعمل عندما** | الووركفلو Active | بعد تفعيل workflow في test mode |
| **الاستخدام** | للإنتاج | للاختبار فقط |
| **البيانات** | يتم حفظها | لا يتم حفظها |

### Verify Token

- **الـ Token**: `my-secret-token`
- يجب أن يكون متطابق في:
  - Meta Developer Console
  - "Verify Webhook Token" node في n8n workflow

### Webhook Fields

- **`messages`**: مطلوب - لاستقبال الرسائل
- **`message_status`**: اختياري - لتتبع حالة الرسائل (تم الإرسال، تم القراءة، إلخ)

## 🔧 استكشاف الأخطاء

### المشكلة: Webhook يعيد HTML بدلاً من challenge

**السبب**: الووركفلو غير Active

**الحل**:
1. اذهب إلى n8n workflow
2. فعّل الووركفلو (Toggle Switch)
3. جرب التحقق مرة أخرى

### المشكلة: "response does not match challenge"

**السبب**: 
- Verify Token غير متطابق
- أو الووركفلو غير Active

**الحل**:
1. تأكد من أن Verify Token متطابق في Meta و n8n
2. تأكد من أن الووركفلو Active
3. جرب التحقق مرة أخرى

### المشكلة: لا تصل رسائل WhatsApp

**السبب**: 
- Webhook Fields غير مفعّلة
- أو الووركفلو غير Active

**الحل**:
1. تأكد من تفعيل `messages` field في Meta
2. تأكد من أن الووركفلو Active
3. تحقق من n8n Executions - هل تظهر executions جديدة؟

## 📊 مراقبة Webhook

### في n8n

1. اذهب إلى: `https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3`
2. اذهب إلى tab **"Executions"**
3. ستظهر جميع executions (الرسائل المستلمة)

### في Meta Developer Console

1. اذهب إلى **Configuration** → **Webhooks**
2. اضغط على **"Test"** بجانب webhook URL
3. يمكنك إرسال رسالة تجريبية

## ✅ Checklist

**قبل استخدام Production Webhook:**

- [ ] ✅ الووركفلو **Active** في n8n
- [ ] ✅ Webhook URL في Meta: `https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook`
- [ ] ✅ Verify Token متطابق: `my-secret-token`
- [ ] ✅ Webhook Fields مفعّلة: `messages`
- [ ] ✅ التحقق نجح في Meta

**بعد الإعداد:**

- [ ] ✅ curl يعيد plain text challenge
- [ ] ✅ إرسال رسالة تجريبية يعمل
- [ ] ✅ الرد التلقائي يعمل

---

**آخر تحديث**: 2025-12-06

**ملاحظة**: Production Webhook يعمل فقط عندما يكون الووركفلو Active في n8n!

