export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">مركز الحميم الطبي</h3>
            <p className="text-gray-400">
              منصة ذكية لإدارة المرضى والمواعيد والتواصل الآمن مع الأخصائيين.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/" className="hover:text-white transition">الرئيسية</a></li>
              <li><a href="/patients" className="hover:text-white transition">المرضى</a></li>
              <li><a href="/dashboard/admin" className="hover:text-white transition">لوحة التحكم</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">اتصل بنا</h3>
            <p className="text-gray-400">
              جدة، المملكة العربية السعودية<br />
              البريد الإلكتروني: info@al-himam.com.sa
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} مركز الحميم الطبي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  )
}

