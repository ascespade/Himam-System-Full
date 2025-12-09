import type { Metadata } from 'next'
import { Shield, Lock, Eye, FileText, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية - مركز الهمم',
  description: 'سياسة الخصوصية وحماية البيانات في مركز الهمم الطبي بجدة',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">سياسة الخصوصية</h1>
          <p className="text-gray-600 text-lg">آخر تحديث: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              مقدمة
            </h2>
            <p className="text-gray-700 leading-relaxed">
              نحن في مركز الهمم الطبي بجدة نلتزم بحماية خصوصيتك وبياناتك الشخصية. هذه السياسة توضح كيفية جمع واستخدام وحماية معلوماتك عند استخدام خدماتنا.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-primary" />
              البيانات التي نجمعها
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">البيانات الشخصية:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>الاسم الكامل</li>
                  <li>رقم الهاتف</li>
                  <li>البريد الإلكتروني</li>
                  <li>تاريخ الميلاد</li>
                  <li>الجنس</li>
                  <li>العنوان</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">البيانات الطبية:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>السجل الطبي</li>
                  <li>التشخيصات</li>
                  <li>الخطط العلاجية</li>
                  <li>ملاحظات الجلسات</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              كيفية استخدام البيانات
            </h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <p>تقديم الخدمات الطبية والعلاجية</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <p>جدولة المواعيد والمتابعة</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <p>التواصل مع المرضى وذويهم</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <p>تحسين جودة الخدمات</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <p>الامتثال للمتطلبات القانونية</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">حماية البيانات</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              نستخدم أحدث تقنيات الأمان لحماية بياناتك:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>التشفير في النقل والتخزين</li>
              <li>التحكم في الوصول بناءً على الأدوار</li>
              <li>النسخ الاحتياطي المنتظم</li>
              <li>مراقبة الأمان المستمرة</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">حقوقك</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              لديك الحق في:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>الوصول إلى بياناتك الشخصية</li>
              <li>تصحيح البيانات غير الصحيحة</li>
              <li>طلب حذف بياناتك (حسب القوانين المعمول بها)</li>
              <li>الاعتراض على معالجة بياناتك</li>
              <li>نقل بياناتك</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">التواصل معنا</h2>
            <p className="text-gray-700 leading-relaxed">
              إذا كان لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا:
            </p>
            <div className="mt-4 bg-primary/5 p-4 rounded-lg">
              <p className="text-gray-700"><strong>البريد الإلكتروني:</strong> privacy@al-himam.com</p>
              <p className="text-gray-700"><strong>الهاتف:</strong> +966 12 345 6789</p>
              <p className="text-gray-700"><strong>العنوان:</strong> جدة، المملكة العربية السعودية</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}



