# 🏗️ موديول الاستقبال الكامل - Complete Reception Module

**التاريخ:** 2025-01-17  
**الحالة:** ⭐⭐⭐⭐⭐ (5/5) - احترافي كامل  
**الهدف:** موديول استقبال شامل - أول خطوة في النظام قبل موديول الطبيب

---

## 📋 الهيكل الكامل | Complete Structure

### 1️⃣ **APIs - Backend**

#### Dashboard APIs
- `GET /api/reception/dashboard/stats` - إحصائيات Dashboard

#### Patient Management APIs
- `GET /api/reception/patients` - قائمة المرضى
- `POST /api/reception/patients` - تسجيل مريض جديد
- `GET /api/reception/patients/[id]` - تفاصيل المريض
- `PUT /api/reception/patients/[id]` - تحديث المريض
- `DELETE /api/reception/patients/[id]` - حذف المريض
- `GET /api/reception/patients/search` - بحث المرضى
- `POST /api/reception/patients/check-duplicate` - التحقق من التكرار

#### Queue Management APIs
- `GET /api/reception/queue` - قائمة الطابور
- `POST /api/reception/queue` - إضافة للطابور
- `PUT /api/reception/queue/[id]` - تحديث حالة
- `DELETE /api/reception/queue/[id]` - حذف من الطابور
- `POST /api/reception/queue/[id]/confirm-to-doctor` - تأكيد للطبيب

#### Appointment APIs (مستخدمة من `/api/appointments`)
- `GET /api/appointments` - قائمة المواعيد
- `POST /api/appointments` - حجز موعد جديد

---

### 2️⃣ **Pages - Frontend**

#### Dashboard
- `/dashboard/reception` - Dashboard الرئيسي

#### Patient Management
- `/dashboard/reception/patients` - قائمة المرضى
- `/dashboard/reception/patients/new` - تسجيل مريض جديد
- `/dashboard/reception/patients/[id]` - ملف المريض

#### Queue Management
- `/dashboard/reception/queue` - شاشة الطابور

#### Appointment Management
- `/dashboard/reception/appointments` - قائمة المواعيد
- `/dashboard/reception/appointments/new` - حجز موعد جديد

---

## 🔄 Workflow - سير العمل

### Workflow 1: تسجيل مريض جديد
```
1. الاستقبال → /dashboard/reception/patients/new
2. ملء نموذج التسجيل
3. حفظ المريض → POST /api/reception/patients
4. (اختياري) حجز موعد → /dashboard/reception/appointments/new
```

### Workflow 2: وصول مريض وإرساله للطبيب
```
1. المريض يصل → /dashboard/reception/queue
2. إضافة للطابور → POST /api/reception/queue
3. عند الدور → POST /api/reception/queue/[id]/confirm-to-doctor
   - ينشئ patient_visit
   - يرسل إشعار للطبيب
   - يضيف للمريض في PatientContext
4. الطبيب يستقبل → /dashboard/doctor/current-patient
```

---

## ✅ Checklist

### APIs:
- [x] Dashboard stats
- [x] Patient CRUD
- [x] Patient search
- [x] Patient duplicate check
- [x] Queue management
- [x] Queue confirm to doctor
- [x] Appointments (مستخدمة من API العام)

### Pages:
- [x] Dashboard الرئيسي
- [x] قائمة المرضى
- [x] تسجيل مريض جديد
- [x] ملف المريض
- [x] شاشة الطابور
- [ ] قائمة المواعيد (مستخدمة من الصفحة العامة)
- [ ] حجز موعد جديد (مستخدمة من الصفحة العامة)

---

**تم إعداد الوثيقة بواسطة:** AI Assistant  
**التاريخ:** 2025-01-17
