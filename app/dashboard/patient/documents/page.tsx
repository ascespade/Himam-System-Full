'use client'

/**
 * Patient Documents Page
 * View and manage medical documents
 */

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { FileText, Download, Calendar, User, Search, Filter, File, Image, FileImage } from 'lucide-react'

interface Document {
  id: string
  name: string
  type: string
  category: string
  date: string
  doctor_name?: string
  file_url: string
  file_size?: number
  description?: string
}

export default function PatientDocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const patientRes = await fetch(`/api/patients?user_id=${user.id}`)
      const patientData = await patientRes.json()
      if (patientData.success && patientData.data?.length > 0) {
        const patientInfo = patientData.data[0]

        const docsRes = await fetch(`/api/patients/${patientInfo.id}/documents`)
        const docsData = await docsRes.json()
        if (docsData.success) {
          setDocuments(docsData.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !searchTerm ||
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(documents.map((d) => d.category).filter(Boolean)))

  const getFileIcon = (type: string) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    if (type.includes('image')) return <Image size={20} className="text-blue-500" />
    if (type.includes('pdf')) return <FileText size={20} className="text-red-500" />
    return <File size={20} className="text-gray-500" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل المستندات...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">المستندات</h1>
        <p className="text-gray-500 text-lg">عرض وإدارة جميع المستندات الطبية</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في المستندات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="md:w-64">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">جميع الفئات</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد مستندات</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3 mb-4">
                {getFileIcon(document.type)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate mb-1">{document.name}</h3>
                  <p className="text-xs text-gray-500">{document.category}</p>
                </div>
              </div>

              {document.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{document.description}</p>
              )}

              <div className="space-y-2 text-xs text-gray-500 mb-4">
                {document.doctor_name && (
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    <span>{document.doctor_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{new Date(document.date).toLocaleDateString('ar-SA')}</span>
                </div>
                {document.file_size && (
                  <div className="flex items-center gap-2">
                    <File size={14} />
                    <span>{formatFileSize(document.file_size)}</span>
                  </div>
                )}
              </div>

              <a
                href={document.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Download size={16} />
                تحميل
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
