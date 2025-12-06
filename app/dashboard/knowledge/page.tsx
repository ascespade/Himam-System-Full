'use client'

import { useState } from 'react'
import { FileText, Trash, Search, Upload } from 'lucide-react'

export default function KnowledgeBasePage() {
  const [documents] = useState([
    { id: 1, title: 'سياسة الخصوصية.pdf', type: 'PDF', size: '2.5 MB', date: '2023-10-01' },
    { id: 2, title: 'دليل الموظف.docx', type: 'DOCX', size: '1.2 MB', date: '2023-09-15' },
    { id: 3, title: 'أسئلة شائعة عن التوحد', type: 'TEXT', size: '15 KB', date: '2023-11-20' },
  ])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">قاعدة المعرفة</h1>
          <p className="text-gray-500 text-sm">إدارة المستندات والملفات الخاصة بالذكاء الاصطناعي والموظفين</p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
          <Upload size={18} />
          <span>رفع ملف جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="بحث في المستندات..." className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-right">
              <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">اسم الملف</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">النوع</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">الحجم</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">التاريخ</th>
              <th className="px-6 py-4 text-left font-medium text-gray-500 text-xs uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                      <FileText size={20} />
                    </div>
                    <span className="font-bold text-gray-900">{doc.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold font-mono">{doc.type}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">{doc.size}</td>
                <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">{doc.date}</td>
                <td className="px-6 py-4 text-left">
                  <button className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
