# مرجع سريع: إعدادات Meta WhatsApp Webhook

## 🎯 القيم المطلوبة في Meta Developer Console

### 1. Callback URL
```
https://himam-system.vercel.app/api/whatsapp
```

### 2. Verify Token
```
himam_center_2025_secure_token
```
*(أو أي نص تختاره - يجب أن يكون نفس القيمة في Vercel)*

### 3. Webhook Fields (Subscription Fields)
اختر:
- ✅ `messages`
- ✅ `message_status`

### 4. Phone Number ID
*(من صفحة API Setup - مثل: `123456789012345`)*

### 5. Access Token
*(من صفحة Access Tokens - Permanent Token)*

---

## 📍 أين تجد هذه القيم؟

### في Meta Developer Console:

1. **Callback URL & Verify Token:**
   - WhatsApp → Configuration → Webhook
   - أدخل URL و Token
   - اضغط "Verify and Save"

2. **Phone Number ID:**
   - WhatsApp → API Setup
   - انسخ "Phone number ID"

3. **Access Token:**
   - WhatsApp → API Setup → Access Tokens
   - Generate Token → انسخ الـ Token

4. **Webhook Fields:**
   - WhatsApp → Configuration → Webhook
   - في قسم "Webhook fields" اختر الحقول

---

## 🔗 الروابط المباشرة

بعد تسجيل الدخول إلى Meta Developer Console:

1. **WhatsApp Configuration:**
   `https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/configuration`

2. **API Setup:**
   `https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/api-setup`

3. **Access Tokens:**
   `https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/api-setup/access-tokens`

---

## ✅ خطوات سريعة

1. ✅ اذهب إلى Meta Developer Console
2. ✅ اختر تطبيقك → WhatsApp → Configuration
3. ✅ أدخل Callback URL: `https://himam-system.vercel.app/api/whatsapp`
4. ✅ أدخل Verify Token: `himam_center_2025_secure_token`
5. ✅ اضغط "Verify and Save"
6. ✅ اختر Webhook Fields: `messages`, `message_status`
7. ✅ اضغط "Subscribe"
8. ✅ انسخ Phone Number ID و Access Token
9. ✅ أضفهم في Vercel Environment Variables

---

**ملاحظة:** بعد إضافة Environment Variables في Vercel، يجب عمل **Redeploy** للمشروع.
