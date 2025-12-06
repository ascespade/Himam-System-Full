# إعدادات Meta WhatsApp Webhook - بالتفصيل

## 📍 الخطوات الكاملة لإعداد Webhook في Meta Developer Console

### الخطوة 1: الوصول إلى Meta Developer Console

1. اذهب إلى: https://developers.facebook.com/
2. سجل الدخول بحساب Meta Business
3. اختر **My Apps** من القائمة العلوية
4. اختر تطبيقك أو أنشئ تطبيق جديد:
   - اضغط **Create App**
   - اختر **Business** كـ App Type
   - أدخل اسم التطبيق (مثل: "مركز الهمم WhatsApp Bot")
   - أدخل معلومات الاتصال

### الخطوة 2: إضافة WhatsApp Product

1. في لوحة التحكم للتطبيق، اذهب إلى **Add Products**
2. ابحث عن **WhatsApp** واضغط **Set Up**
3. سيتم توجيهك إلى صفحة WhatsApp Configuration

### الخطوة 3: الحصول على Phone Number ID و Access Token

#### أ. Phone Number ID:
1. في صفحة WhatsApp Configuration
2. اذهب إلى **API Setup** في القائمة الجانبية
3. ستجد **Phone number ID** - انسخ هذا الرقم (مثل: `123456789012345`)

#### ب. Access Token:
1. في نفس صفحة **API Setup**
2. ستجد **Temporary access token** (للاختبار فقط - ينتهي بعد 24 ساعة)
3. للحصول على **Permanent Token**:
   - اذهب إلى **WhatsApp** → **API Setup** → **Access Tokens**
   - اضغط **Generate Token**
   - اختر System User أو Page
   - انسخ الـ Token

### الخطوة 4: إعداد Webhook

#### أ. Callback URL:
```
https://himam-system.vercel.app/api/whatsapp
```

**مهم:** 
- يجب أن يكون URL يعمل (HTTPS فقط)
- يجب أن يكون متاحاً من الإنترنت (ليس localhost)

#### ب. Verify Token:
```
himam_center_2025_secure_token
```

**مهم:**
- اختر أي نص عشوائي قوي
- يجب أن يكون نفس القيمة في Vercel Environment Variables
- مثال: `himam_center_2025_secure_token` أو `my_secure_token_12345`

#### ج. Webhook Fields (Subscription Fields):

اختر الحقول التالية:
- ✅ **messages** - لاستقبال الرسائل الواردة
- ✅ **message_status** - لمعرفة حالة الرسائل المرسلة
- ✅ **message_reactions** (اختياري) - لردود الفعل على الرسائل

### الخطوة 5: تفعيل Webhook

1. بعد إدخال Callback URL و Verify Token
2. اضغط **Verify and Save**
3. Meta سيرسل طلب GET للتحقق:
   ```
   GET https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=himam_center_2025_secure_token&hub.challenge=random_string
   ```
4. إذا كان كل شيء صحيح، سترى ✅ **Verified**
5. اضغط **Subscribe** لتفعيل Webhook

## 📋 ملخص القيم المطلوبة

### في Meta Developer Console:

| الحقل | القيمة |
|-------|--------|
| **Callback URL** | `https://himam-system.vercel.app/api/whatsapp` |
| **Verify Token** | `himam_center_2025_secure_token` (أو أي نص تختاره) |
| **Webhook Fields** | `messages`, `message_status` |
| **Phone Number ID** | `123456789012345` (من API Setup) |
| **Access Token** | `EAAxxxxxxxxxxxxx` (من Access Tokens) |

### في Vercel Environment Variables:

```env
WHATSAPP_VERIFY_TOKEN=himam_center_2025_secure_token
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/whatsapp
```

## 🔍 اختبار Webhook

### اختبار 1: Verification Test

افتح في المتصفح:
```
https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=himam_center_2025_secure_token&hub.challenge=test123
```

**النتيجة المتوقعة:** يجب أن يعيد `test123`

### اختبار 2: إرسال رسالة

1. أرسل رسالة إلى رقم واتساب الخاص بك
2. تحقق من Vercel Logs:
   - اذهب إلى Vercel → Project → Deployments → Functions → `/api/whatsapp`
   - يجب أن ترى log للرسالة المستلمة

### اختبار 3: n8n Workflow

1. تحقق من n8n Executions
2. يجب أن ترى execution جديد عند استقبال رسالة

## ⚠️ استكشاف الأخطاء

### خطأ: "Webhook verification failed"

**الأسباب المحتملة:**
1. Verify Token غير متطابق
2. URL غير متاح
3. Next.js API route لا يعمل

**الحل:**
- تحقق من `WHATSAPP_VERIFY_TOKEN` في Vercel
- تأكد من أن URL يعمل (جرب في المتصفح)
- تحقق من Vercel Logs

### خطأ: "Webhook not receiving messages"

**الأسباب المحتملة:**
1. Webhook غير مفعل (لم تضغط Subscribe)
2. Subscription Fields غير محددة
3. الرقم في Test Mode فقط

**الحل:**
- اضغط **Subscribe** في Meta Console
- تأكد من تحديد `messages` في Webhook Fields
- للرسائل العامة، تحتاج Business Verification

### خطأ: "Cannot send messages"

**الأسباب المحتملة:**
1. Access Token منتهي (Temporary token)
2. Phone Number ID خاطئ
3. الرقم غير مفعل

**الحل:**
- استخدم Permanent Token
- تحقق من Phone Number ID
- تأكد من تفعيل الرقم في Meta

## 📱 معلومات إضافية

### Test Phone Numbers

في Test Mode، يمكنك إرسال رسائل فقط للأرقام المسجلة:
1. اذهب إلى **WhatsApp** → **API Setup**
2. في قسم **To**, أضف رقم للاختبار
3. أرسل رسالة إلى هذا الرقم

### Business Verification

للرسائل العامة (غير Test Mode):
1. اذهب إلى **App Review** → **Permissions and Features**
2. اطلب **whatsapp_business_messaging** permission
3. أكمل Business Verification
4. بعد الموافقة، يمكنك إرسال رسائل لأي رقم

## ✅ Checklist النهائي

- [ ] Meta Developer Console: تطبيق منشأ
- [ ] WhatsApp Product: مضاف ومفعل
- [ ] Phone Number ID: موجود ومنسوخ
- [ ] Access Token: Permanent Token منشأ
- [ ] Callback URL: `https://himam-system.vercel.app/api/whatsapp`
- [ ] Verify Token: نفس القيمة في Vercel
- [ ] Webhook Fields: `messages`, `message_status` محددة
- [ ] Webhook: Verified و Subscribed
- [ ] Vercel Environment Variables: جميع القيم مضبوطة
- [ ] Test: Webhook verification يعمل
- [ ] Test: استقبال رسالة يعمل

---

**رابط مباشر:** https://developers.facebook.com/apps → اختر تطبيقك → WhatsApp → Configuration

