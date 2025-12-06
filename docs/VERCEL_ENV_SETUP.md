# إعداد Environment Variables في Vercel

## ⚠️ المشكلة: Webhook Verification Failed

إذا رأيت خطأ "تعذر التحقق من صحة عنوان URL الاستدعاء" في Meta Console، السبب عادة هو:

1. **Environment Variables غير موجودة في Vercel**
2. **القيم غير متطابقة**
3. **لم يتم عمل Redeploy بعد إضافة المتغيرات**

## ✅ الحل خطوة بخطوة

### الخطوة 1: إضافة Environment Variables في Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر مشروع `himam-system`
3. اذهب إلى **Settings** → **Environment Variables**
4. أضف المتغيرات التالية **بالضبط**:

```env
WHATSAPP_VERIFY_TOKEN=himam_center_2025_secure_token
```

**مهم جداً:**
- ✅ القيمة يجب أن تكون **نفسها تماماً** في Meta Console
- ✅ لا توجد مسافات إضافية قبل أو بعد
- ✅ حساس لحالة الأحرف (Case Sensitive)

### الخطوة 2: إضافة باقي المتغيرات

```env
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/whatsapp
```

### الخطوة 3: Redeploy المشروع

**هذا مهم جداً!** بعد إضافة Environment Variables:

1. اذهب إلى **Deployments**
2. اضغط على **⋮** بجانب آخر deployment
3. اختر **Redeploy**
4. أو اذهب إلى **Settings** → **Git** واضغط **Redeploy**

### الخطوة 4: التحقق من Vercel Logs

1. اذهب إلى **Deployments** → اختر آخر deployment
2. اضغط على **Functions** → `/api/whatsapp`
3. تحقق من Logs للتأكد من أن المتغيرات موجودة

## 🔍 اختبار Webhook Verification

### اختبار 1: من المتصفح

افتح هذا الرابط في المتصفح:
```
https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=himam_center_2025_secure_token&hub.challenge=test123
```

**النتيجة المتوقعة:** يجب أن يعيد `test123` (نص عادي، ليس JSON)

### اختبار 2: من Terminal

```bash
curl "https://himam-system.vercel.app/api/whatsapp?hub.mode=subscribe&hub.verify_token=himam_center_2025_secure_token&hub.challenge=test123"
```

**النتيجة المتوقعة:** `test123`

### اختبار 3: من Meta Console

1. اذهب إلى Meta Developer Console
2. WhatsApp → Configuration → Webhook
3. أدخل:
   - **Callback URL**: `https://himam-system.vercel.app/api/whatsapp`
   - **Verify Token**: `himam_center_2025_secure_token`
4. اضغط **"تحقق وحفظ"** (Verify and Save)

**النتيجة المتوقعة:** ✅ Verified (بدون خطأ)

## 🐛 استكشاف الأخطاء

### خطأ: "Forbidden" عند الاختبار

**السبب:** `WHATSAPP_VERIFY_TOKEN` غير موجود أو مختلف

**الحل:**
1. تحقق من Vercel Environment Variables
2. تأكد من أن القيمة متطابقة تماماً
3. عمل Redeploy
4. جرب الاختبار مرة أخرى

### خطأ: "Challenge missing"

**السبب:** Meta لم يرسل challenge parameter

**الحل:**
- هذا طبيعي في بعض الحالات
- تأكد من أن URL صحيح
- جرب مرة أخرى

### خطأ: "Invalid verify token"

**السبب:** القيمة مختلفة

**الحل:**
1. انسخ القيمة من Meta Console
2. الصقها في Vercel (بدون مسافات)
3. عمل Redeploy

## 📋 Checklist

- [ ] Environment Variables موجودة في Vercel
- [ ] `WHATSAPP_VERIFY_TOKEN` = `himam_center_2025_secure_token`
- [ ] القيمة متطابقة تماماً (بدون مسافات)
- [ ] تم عمل Redeploy بعد إضافة المتغيرات
- [ ] الاختبار من المتصفح يعيد `test123`
- [ ] Meta Console يعرض ✅ Verified

## 🔗 روابط مفيدة

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Meta Webhook Setup](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)

---

**ملاحظة:** بعد أي تغيير في Environment Variables، يجب **دائماً** عمل Redeploy!

