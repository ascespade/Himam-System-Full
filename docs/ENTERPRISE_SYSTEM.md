# Enterprise System Documentation
# توثيق النظام الشامل على مستوى Enterprise

## نظرة عامة | Overview

تم تطوير نظام شامل على مستوى Enterprise يغطي جميع احتياجات مركز الهمم الطبي بجدة. النظام مصمم ليكون:
- **ذكي ومؤتمت بالكامل** - يعمل 24/7 بدون تدخل بشري
- **قابل للتوسع** - يدعم نمو المركز
- **آمن ومتوافق** - مع جميع المعايير الطبية
- **سهل الاستخدام** - واجهة بديهية لكل نوع مستخدم

---

## المكونات الرئيسية | Core Components

### 1. Role-Based Dashboards | لوحات التحكم حسب الدور

كل نوع مستخدم لديه Dashboard مخصص يعرض:
- **إحصائيات سريعة** - نظرة عامة على الأنشطة
- **رسوم بيانية** - تحليلات بصرية
- **جداول تفاعلية** - بيانات قابلة للتصفية
- **قوائم نشاط** - آخر الأحداث

**الملفات:**
- `app/dashboard/[role]/page.tsx` - Dashboard ديناميكي
- `components/DashboardWidget.tsx` - مكونات Widgets
- `app/api/dashboard/widgets/route.ts` - API للـ Widgets
- `app/api/dashboard/stats/route.ts` - API للإحصائيات

### 2. Workflow Engine | محرك التدفقات

نظام ذكي لإدارة التدفقات المؤتمتة:
- **تعريف التدفقات** - بدون كود
- **تنفيذ تلقائي** - بناءً على الأحداث
- **خطوات متعددة** - AI, Notifications, Records, etc.
- **مراقبة التنفيذ** - تتبع كل خطوة

**الملفات:**
- `src/lib/workflow-engine.ts` - محرك التنفيذ
- `app/api/workflows/route.ts` - إدارة التدفقات
- `app/dashboard/admin/workflows/page.tsx` - واجهة الإدارة

### 3. Activity Logging System | نظام السجلات

تسجيل شامل لكل نشاط في النظام:
- **تسجيل تلقائي** - من جميع APIs
- **فلترة متقدمة** - حسب النوع، المستخدم، التاريخ
- **تتبع كامل** - IP, User Agent, Metadata

**الملفات:**
- `src/lib/activity-logger.ts` - نظام التسجيل
- `app/api/activity-logs/route.ts` - API للسجلات

### 4. Configuration Management | إدارة الإعدادات

نظام ديناميكي لإدارة جميع إعدادات النظام:
- **بدون كود** - تعديل من واجهة المستخدم
- **فئات منظمة** - doctor, insurance, whatsapp, etc.
- **تعديل فوري** - بدون إعادة تشغيل

**الملفات:**
- `app/api/system/config/route.ts` - API للإعدادات
- `app/dashboard/admin/settings/page.tsx` - واجهة الإدارة

### 5. System Health Monitoring | مراقبة صحة النظام

مراقبة مستمرة لجميع مكونات النظام:
- **فحص دوري** - Database, API, WhatsApp, AI
- **حالات واضحة** - healthy, degraded, down
- **مقاييس مفصلة** - Response time, errors, etc.

**الملفات:**
- `app/api/system/health/route.ts` - فحص الصحة
- `app/dashboard/admin/monitor/page.tsx` - لوحة المراقبة

### 6. Alert System | نظام التنبيهات

نظام تنبيهات ذكي:
- **قواعد قابلة للتخصيص** - بدون كود
- **مستويات شدة** - info, warning, error, critical
- **قنوات متعددة** - Email, WhatsApp, SMS, In-App

**الملفات:**
- `app/api/alerts/route.ts` - API للتنبيهات
- `supabase/migrations/20250117_enterprise_system.sql` - جداول التنبيهات

### 7. WhatsApp Workflow System | نظام تدفقات الواتساب

نظام متقدم لإدارة ردود الواتساب:
- **اختيار AI Model** - GPT-4, Gemini, etc.
- **تدفقات قابلة للتخصيص** - حسب الكلمات المفتاحية
- **إجراءات تلقائية** - بعد الرد

**الملفات:**
- `app/api/whatsapp/workflows/route.ts` - إدارة التدفقات
- `supabase/migrations/20250117_enterprise_system.sql` - جدول التدفقات

### 8. Patient Visit Flow | تدفق زيارة المريض

ربط تلقائي من الاستقبال للطبيب:
- **تسجيل في الاستقبال** - إنشاء patient_visit
- **تأكيد للطبيب** - إشعار تلقائي
- **تحديد تلقائي** - PatientContext يحدد المريض

**الملفات:**
- `app/api/reception/queue/[id]/confirm-to-doctor/route.ts` - تأكيد للطبيب
- `app/api/doctor/patient-visit/route.ts` - جلب زيارة المريض
- `src/contexts/PatientContext.tsx` - تحديث لدعم auto-select

### 9. Insurance Claims Automation | أتمتة مطالبات التأمين

نظام شامل لأتمتة مطالبات التأمين:
- **إنشاء تلقائي** - عند موافقة الطبيب على خطة علاجية
- **تحليل AI** - لردود شركات التأمين
- **تعلم من الماضي** - تحسين تلقائي
- **إشعارات WhatsApp** - للمريض وولي الأمر

**الملفات:**
- `app/api/insurance/claims/auto-generate/route.ts` - إنشاء تلقائي
- `app/api/insurance/claims/[id]/analyze-response/route.ts` - تحليل الردود

### 10. Session Bulk Management | إدارة الجلسات الجماعية

إدارة ذكية للجلسات:
- **تأجيل يوم كامل** - بضغطة واحدة
- **إعادة جدولة** - مع إشعارات تلقائية
- **إلغاء جماعي** - مع تحديث المواعيد

**الملفات:**
- `app/api/doctor/sessions/bulk-manage/route.ts` - إدارة جماعية

---

## Database Schema | هيكل قاعدة البيانات

### الجداول الجديدة:

1. **activity_logs** - سجلات الأنشطة
2. **workflow_definitions** - تعريفات التدفقات
3. **workflow_executions** - تنفيذ التدفقات
4. **dashboard_configurations** - إعدادات Dashboards
5. **analytics_cache** - ذاكرة التحليلات
6. **whatsapp_workflows** - تدفقات الواتساب
7. **system_health** - صحة النظام
8. **alert_rules** - قواعد التنبيهات
9. **alert_instances** - حالات التنبيهات
10. **user_preferences** - تفضيلات المستخدمين
11. **scheduled_tasks** - المهام المجدولة
12. **task_execution_logs** - سجلات المهام

---

## كيفية الاستخدام | Usage Guide

### للمدير (Admin):

1. **لوحة المراقبة**: `/dashboard/admin/monitor`
   - مراقبة صحة النظام
   - عرض التنبيهات النشطة
   - تتبع الأنشطة

2. **إدارة الإعدادات**: `/dashboard/admin/settings`
   - تعديل جميع إعدادات النظام
   - إضافة إعدادات جديدة

3. **إدارة التدفقات**: `/dashboard/admin/workflows`
   - إنشاء تدفقات جديدة
   - تفعيل/تعطيل التدفقات

### للطبيب (Doctor):

1. **Dashboard مخصص**: `/dashboard/doctor`
   - إحصائيات المرضى
   - الجلسات اليوم
   - الخطط المعلقة

2. **إدارة الجلسات**: `/dashboard/doctor/sessions`
   - إنشاء جلسات جديدة
   - إدارة جماعية للجلسات

### للاستقبال (Reception):

1. **Dashboard الاستقبال**: `/dashboard/reception`
   - طابور اليوم
   - المواعيد
   - مرضى جدد

2. **تأكيد للطبيب**: 
   - من صفحة الطابور
   - زر "تأكيد للطبيب"
   - يتم إشعار الطبيب تلقائياً

---

## الميزات المتقدمة | Advanced Features

### 1. AI Learning System
النظام يتعلم من الماضي:
- **أنماط الرفض** - من شركات التأمين
- **المعلومات الناقصة** - في المطالبات
- **تحسين تلقائي** - للاقتراحات

### 2. Real-time Updates
تحديثات فورية:
- **Supabase Realtime** - للأنشطة والإشعارات
- **WebSocket** - للداشبورد
- **Auto-refresh** - كل 30 ثانية

### 3. Security & Compliance
أمان شامل:
- **RLS Policies** - لكل جدول
- **Activity Logging** - لكل إجراء
- **Audit Trail** - تتبع كامل

---

## الخطوات التالية | Next Steps

1. **تطبيق Migration** - على قاعدة البيانات
2. **اختبار Dashboards** - لكل نوع مستخدم
3. **إنشاء Workflows** - للتدفقات المطلوبة
4. **تكوين Alerts** - للتنبيهات المهمة
5. **ضبط الإعدادات** - حسب احتياجات المركز

---

## الدعم | Support

للمساعدة أو الاستفسارات:
- راجع التوثيق الكامل في `/docs`
- تحقق من Logs في `/dashboard/admin/monitor`
- راجع Activity Logs في `/api/activity-logs`

---

**تم التطوير بواسطة:** AI Assistant  
**التاريخ:** 2025-01-17  
**الإصدار:** Enterprise v1.0

