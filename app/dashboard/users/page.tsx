'use client'

import { useState } from 'react'
import { UserPlus, MoreVertical, Shield, Mail, Phone } from 'lucide-react'

export default function UsersPage() {
  const [users] = useState([
    { id: 1, name: 'أحمد محمد', email: 'ahmed@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'سارة علي', email: 'sara@example.com', role: 'Doctor', status: 'Active' },
    { id: 3, name: 'خالد عمر', email: 'khaled@example.com', role: 'Reception', status: 'Offline' },
  ])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">إدارة المستخدمين</h1>
          <p className="text-gray-500 text-sm">إدارة صلاحيات الموظفين والأطباء</p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
          <UserPlus size={18} />
          <span>إضافة مستخدم</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-64">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width={18} height={18}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="بحث عن مستخدم..." className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex gap-2 text-sm text-gray-500">
            <span className="font-bold text-gray-900">{users.length}</span> مستخدم
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-right">
              <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">المستخدم</th>
              <th className="px-6 py-4 font-medium text-gray-5 text-xs uppercase">الدور</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">الحالة</th>
              <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">آخر ظهور</th>
              <th className="px-6 py-4 text-left font-medium text-gray-500 text-xs uppercase">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-primary" />
                    <span className="text-sm font-medium">{user.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">Just now</td>
                <td className="px-6 py-4 text-left">
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                    <MoreVertical size={18} />
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
