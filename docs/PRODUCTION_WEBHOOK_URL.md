# 🔗 Production Webhook URL

## ✅ الووركفلو Active الآن!

## 📍 Production Webhook URL

```
https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook
```

## 🔑 Verify Token

```
my-secret-token
```

## 📋 خطوات الإعداد في Meta Developer Console

1. اذهب إلى [Meta Developer Console](https://developers.facebook.com/)
2. اختر **WhatsApp App** الخاص بك
3. اذهب إلى **Configuration** → **Webhooks**
4. في **"عنوان URL الاستدعاء" (Callback URL)**:
   ```
   https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook
   ```
5. في **"تحقق من الرمز" (Verify Token)**:
   ```
   my-secret-token
   ```
6. اضغط **"تحقق وحفظ" (Verify and Save)**
7. فعّل **Webhook Fields**:
   - ✅ `messages` - لاستقبال الرسائل

## 🧪 اختبار Webhook

```bash
curl "https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=test123"
```

**النتيجة المتوقعة**: `test123` (plain text) ✅

---

**آخر تحديث**: 2025-12-06
**حالة الووركفلو**: ✅ Active

