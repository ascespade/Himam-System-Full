# استكشاف أخطاء Webhook Verification - دليل شامل

## 🔴 المشكلة الحالية

```
(#2201) response does not match challenge, expected value="6736819", received="\u003C!DOCTYPE html..."
```

**السبب**: Meta يتوقع plain text challenge لكنه يحصل على HTML (من WAF أو Cloudflare في Render).

## ✅ الحلول المحتملة

### الحل 1: التأكد من إعدادات الووركفلو

تم إصلاح الووركفلو بالكامل:
- ✅ "Respond Verification" node يعيد plain text challenge
- ✅ تم إضافة `Content-Type: text/plain; charset=utf-8` header
- ✅ `responseBody` يستخرج challenge من query parameters مباشرة

**الخطوات:**
1. احفظ الووركفلو في n8n
2. فعّل الووركفلو (Toggle Switch → Active)
3. استخدم **Production URL** (`/webhook/whatsapp-webhook`) في Meta

### الحل 2: التحقق من WAF/Cloudflare في Render

المشكلة الأكثر احتمالاً هي أن WAF أو Cloudflare في Render يعيد HTML بدلاً من تمرير الطلب.

**الحلول:**
1. **إضافة Exception في Render:**
   - اذهب إلى Render Dashboard
   - ابحث عن إعدادات WAF أو Security
   - أضف exception لـ webhook URL: `/webhook/whatsapp-webhook`

2. **استخدام Custom Domain:**
   - إذا كان Render يستخدم Cloudflare، قد تحتاج إلى:
     - تعطيل Cloudflare Proxy (Orange Cloud → Gray Cloud)
     - أو إضافة Page Rule لـ webhook URL

3. **التحقق من Render Logs:**
   - اذهب إلى Render Dashboard → Logs
   - تحقق من طلبات Meta - هل تصل إلى n8n؟
   - تحقق من الردود - هل يعيد HTML أم plain text؟

### الحل 3: استخدام حل بديل - Webhook مباشر من Next.js

إذا استمرت المشكلة، يمكن استخدام Next.js API route كـ proxy:

1. **إنشاء API Route في Next.js:**
   ```typescript
   // app/api/whatsapp-verify/route.ts
   export async function GET(req: NextRequest) {
     const searchParams = req.nextUrl.searchParams
     const mode = searchParams.get('hub.mode')
     const token = searchParams.get('hub.verify_token')
     const challenge = searchParams.get('hub.challenge')
     
     const VERIFY_TOKEN = 'my-secret-token'
     
     if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
       return new NextResponse(challenge, {
         status: 200,
         headers: { 'Content-Type': 'text/plain; charset=utf-8' }
       })
     }
     
     return new NextResponse('Forbidden', { status: 403 })
   }
   ```

2. **استخدام هذا URL في Meta:**
   ```
   https://himam-system.vercel.app/api/whatsapp-verify
   ```

3. **هذا URL سيرسل POST requests إلى n8n:**
   - استخدم n8n webhook URL للإنتاج فقط
   - Meta verification → Next.js API
   - Meta messages → n8n webhook

### الحل 4: اختبار Webhook مباشرة

**من Terminal:**
```bash
curl -v "https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=test123"
```

**النتيجة المتوقعة:**
- Status: `200 OK`
- Content-Type: `text/plain; charset=utf-8`
- Body: `test123` (plain text فقط)

**إذا حصلت على HTML:**
- المشكلة في WAF/Cloudflare
- يجب إضافة exception أو تعطيل proxy

**إذا حصلت على JSON:**
- المشكلة في الووركفلو
- تحقق من "Respond Verification" node

**إذا حصلت على 404:**
- الووركفلو غير Active
- فعّل الووركفلو أولاً

## 📋 Checklist شامل

قبل محاولة التحقق في Meta:

- [ ] الووركفلو **Active** في n8n
- [ ] الووركفلو محفوظ (Saved)
- [ ] تستخدم **Production URL** (`/webhook/whatsapp-webhook`)
- [ ] **ليس** Test URL (`/webhook-test/whatsapp-webhook`)
- [ ] Verify Token متطابق (`my-secret-token`)
- [ ] جربت curl وظهر challenge كـ plain text
- [ ] تحققت من Render Logs - هل تصل الطلبات؟
- [ ] تحققت من إعدادات WAF في Render

## 🔧 خطوات استكشاف الأخطاء

### الخطوة 1: اختبار Webhook مباشرة

```bash
curl -v "https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=test123"
```

**تحليل النتيجة:**
- ✅ `200 OK` + `test123` (plain text) = الووركفلو يعمل ✅
- ❌ `200 OK` + HTML = WAF يعيد HTML ❌
- ❌ `200 OK` + JSON = الووركفلو يحتاج إصلاح ❌
- ❌ `404 Not Found` = الووركفلو غير Active ❌

### الخطوة 2: التحقق من Render Logs

1. اذهب إلى Render Dashboard
2. اختر n8n service
3. اذهب إلى Logs
4. جرب التحقق في Meta
5. تحقق من Logs - هل تظهر طلبات GET من Meta؟

### الخطوة 3: التحقق من n8n Executions

1. اذهب إلى n8n: `https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3`
2. اذهب إلى tab "Executions"
3. جرب التحقق في Meta
4. تحقق من Executions - هل تظهر execution جديدة؟

### الخطوة 4: إذا استمر الفشل

**الحل النهائي: استخدام Next.js API Route**

1. أنشئ API route في Next.js (كما في الحل 3)
2. استخدم هذا URL في Meta للتحقق
3. استخدم n8n webhook URL للرسائل فقط

---

**آخر تحديث**: 2025-12-06

**ملاحظة مهمة**: إذا استمرت المشكلة بعد كل الخطوات، المشكلة على الأرجح في WAF/Cloudflare في Render. يجب إضافة exception أو استخدام Next.js API route كـ proxy.

