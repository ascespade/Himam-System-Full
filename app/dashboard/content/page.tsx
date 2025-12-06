'use client'

import { useEffect, useState } from 'react'
import { Edit2, Eye, Plus, FileText } from 'lucide-react'

export default function ContentPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/content')
        const json = await res.json()
        if (json.error) throw new Error(json.error)
        setPosts(json.items)
      } catch (e: any) {
        console.error(e)
        setError(e.message ?? 'فشل تحميل المحتوى')
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">إدارة المحتوى</h1>
          <p className="text-gray-500 text-sm">نشر المقالات وقصص النجاح على الموقع</p>
        </div>
        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus size={18} />
          <span>مقال جديد</span>
        </button>
      </div>

      {/* Loading / error */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin text-primary" width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" strokeOpacity={0.2} />
            <path d="M22 12a10 10 0 0 1-10 10" />
          </svg>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl">
          <p>⚠️ {error}</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{posts.filter(p => p.status === 'Published').length}</h3>
                <p className="text-gray-500 text-sm">مقال منشور</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{posts.reduce((a, p) => a + (p.views || 0), 0)}</h3>
                <p className="text-gray-500 text-sm">إجمالي المشاهدات</p>
              </div>
            </div>
          </div>

          {/* Posts table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-right">
                  <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">العنوان</th>
                  <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">التصنيف</th>
                  <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">المشاهدات</th>
                  <th className="px-6 py-4 font-medium text-gray-500 text-xs uppercase">الحالة</th>
                  <th className="px-6 py-4 text-left font-medium text-gray-500 text-xs uppercase">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{post.title}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">{post.category}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500" dir="ltr">{post.views}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${post.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {post.status === 'Published' ? 'منشور' : 'مسودة'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-primary transition-colors">
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
