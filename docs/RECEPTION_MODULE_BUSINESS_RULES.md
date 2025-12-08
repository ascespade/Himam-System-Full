# 🏛️ Business Rules & Workflow Management
# قواعد العمل وإدارة سير العمل

**التاريخ:** 2025-01-17  
**الحالة:** ⭐⭐⭐⭐⭐ (5/5) - احترافي كامل

---

## 📋 Business Rules Engine

### نظام القواعد الديناميكي

نظام قواعد تجارية ديناميكي قابل للتعديل من Admin، يحمي الموظفين من الأخطاء الإجرائية ويضمن اتباع اللوائح.

### أنواع القواعد:

1. **payment_required** - الدفع مطلوب
2. **insurance_approval_required** - موافقة التأمين مطلوبة
3. **first_visit_free** - أول زيارة مجانية
4. **session_data_complete** - اكتمال بيانات الجلسة
5. **insurance_template_match** - مطابقة قالب التأمين
6. **error_pattern_avoid** - تجنب نمط خطأ

### Actions:
- `allow` - السماح
- `block` - منع
- `warn` - تحذير
- `require_approval` - يتطلب موافقة

---

## 🔄 Workflow Rules

### Rule 1: أول زيارة كشف مجاني
```json
{
  "name": "أول زيارة كشف مجاني",
  "condition": {
    "and": [
      {"field": "patient.is_first_visit", "equals": true},
      {"field": "session.session_type", "equals": "consultation"}
    ]
  },
  "action": "allow"
}
```

### Rule 2: الدفع مطلوب قبل الجلسة
```json
{
  "name": "الدفع مطلوب قبل الجلسة",
  "condition": {
    "and": [
      {"field": "patient.is_first_visit", "not_equals": true},
      {"field": "payment.paid", "not_equals": true},
      {"field": "insurance.approved", "not_equals": true}
    ]
  },
  "action": "block"
}
```

### Rule 3: اكتمال بيانات الجلسة
```json
{
  "name": "التحقق من اكتمال بيانات الجلسة",
  "condition": {
    "field": "session.is_complete", "equals": false
  },
  "action": "block"
}
```

---

## 💳 Payment Verification Workflow

### قبل فتح الجلسة:
1. ✅ التحقق من أول زيارة (مجاني)
2. ✅ التحقق من حالة الدفع
3. ✅ التحقق من موافقة التأمين
4. ✅ تطبيق Business Rules
5. ✅ منع/السماح بناءً على النتيجة

### API: `POST /api/reception/payment/verify`
```typescript
{
  patient_id: string
  session_type: string
  service_type?: string
}

Response: {
  canProceed: boolean
  reason: string
  requiredActions: string[]
  paymentStatus: {
    paid: boolean
    amount: number
    insuranceApproved: boolean
  }
}
```

---

## 🏥 Insurance Approval Workflow

### قبل فتح الجلسة:
1. ✅ التحقق من وجود تأمين
2. ✅ التحقق من موافقة سابقة
3. ✅ طلب موافقة جديدة إذا لزم
4. ✅ ربط الموافقة بالجلسة

### APIs:
- `POST /api/reception/insurance/request-approval` - طلب موافقة
- `GET /api/reception/insurance/check-approval` - التحقق من الموافقة

---

## 🤖 AI Agent Validation

### التحقق من اكتمال بيانات الجلسة:

#### قبل حفظ الجلسة:
1. ✅ التحقق الأساسي (Basic Validation)
2. ✅ التحقق بواسطة AI Agent
3. ✅ التحقق ضد Templates الناجحة
4. ✅ التحقق من تجنب أنماط الرفض
5. ✅ منع الحفظ إذا البيانات غير مكتملة

#### API Integration:
```typescript
POST /api/doctor/insurance/ai-agent
{
  action: 'validate_session',
  session_data: SessionData,
  insurance_provider: string
}
```

---

## 📚 Template Learning System

### التعلم من المطالبات الناجحة:

1. **تتبع المطالبات المنجحة**
   - استخراج الحقول المطلوبة
   - استخراج الأنماط الناجحة
   - حساب معدل النجاح

2. **تحديث Templates تلقائياً**
   - دمج الحقول الجديدة
   - تحديث الأنماط
   - زيادة معدل النجاح

3. **استخدام Templates**
   - اقتراح الحقول المطلوبة
   - تحذير من أنماط الرفض
   - ضمان أعلى معدل موافقة

### API: `POST /api/doctor/sessions`
- بعد حفظ جلسة ناجحة → يتعلم تلقائياً
- بعد موافقة تأمين → يتعلم من المطالبة

---

## 🚫 Error Pattern Learning

### تجنب الأخطاء السابقة:

1. **تتبع أسباب الرفض**
   - تسجيل أسباب الرفض
   - استخراج الأنماط
   - إضافة للـ rejection_patterns

2. **التحذير من الأنماط**
   - التحقق من البيانات ضد rejection_patterns
   - تحذير قبل الحفظ
   - اقتراحات للتحسين

---

## 🔧 Admin Rules Management

### صفحة إدارة القواعد: `/dashboard/admin/business-rules`

#### Features:
- ✅ عرض جميع القواعد
- ✅ إضافة قاعدة جديدة
- ✅ تعديل قاعدة موجودة
- ✅ حذف قاعدة
- ✅ تفعيل/تعطيل قاعدة
- ✅ تعديل الأولوية

#### API:
- `GET /api/admin/business-rules` - قائمة القواعد
- `POST /api/admin/business-rules` - إنشاء قاعدة
- `PUT /api/admin/business-rules/[id]` - تحديث قاعدة
- `DELETE /api/admin/business-rules/[id]` - حذف قاعدة

---

## 🔄 Complete Workflow

### Workflow: من الاستقبال للطبيب (مع القواعد)

```
1. المريض يصل → /dashboard/reception/queue
2. إضافة للطابور → POST /api/reception/queue
3. عند إرسال للطبيب:
   ✅ التحقق من الدفع → POST /api/reception/payment/verify
   ✅ التحقق من موافقة التأمين
   ✅ تطبيق Business Rules
   ✅ إذا فشل → عرض modal للدفع/الموافقة
   ✅ إذا نجح → POST /api/reception/queue/[id]/confirm-to-doctor
4. إنشاء patient_visit
5. الطبيب يستقبل → /dashboard/doctor/current-patient
6. بدء الجلسة → /dashboard/doctor/sessions/new
   ✅ التحقق من اكتمال البيانات (AI Agent)
   ✅ التحقق ضد Templates
   ✅ منع الحفظ إذا غير مكتمل
7. حفظ الجلسة → POST /api/doctor/sessions
   ✅ التعلم من الجلسة الناجحة
   ✅ تحديث Templates
```

---

## 📊 Database Tables

### 1. `business_rules`
- القواعد الديناميكية القابلة للتعديل

### 2. `insurance_claim_templates`
- Templates للتعلم من المطالبات الناجحة

### 3. `insurance_approvals`
- تتبع موافقات التأمين

### 4. `session_validation_logs`
- سجلات التحقق من الجلسات

### 5. `error_patterns`
- أنماط الأخطاء لتجنبها

---

## ✅ Checklist

### Business Rules:
- [x] Business Rules Engine
- [x] Payment Verification
- [x] Insurance Approval Workflow
- [x] AI Agent Validation
- [x] Template Learning System
- [x] Error Pattern Learning
- [x] Admin Rules Management

### Integration:
- [x] Integration مع confirm-to-doctor
- [x] Integration مع sessions creation
- [x] UI للتحقق من الدفع
- [x] UI لإدارة القواعد

---

**تم إعداد الوثيقة بواسطة:** AI Assistant  
**التاريخ:** 2025-01-17
