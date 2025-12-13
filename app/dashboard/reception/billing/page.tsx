'use client'

/**
 * Reception Billing Page
 * Manage invoices and payments
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Calendar, Download, CheckCircle, Clock, AlertCircle, Search, Plus, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface Invoice {
  id: string
  invoice_number: string
  patient_id: string
  patient_name: string
  date: string
  due_date?: string
  amount: number
  paid_amount: number
  status: 'paid' | 'pending' | 'overdue' | 'partial'
  services: Array<{
    name: string
    quantity: number
    price: number
  }>
  payment_method?: string
  paid_date?: string
}

export default function ReceptionBillingPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'partial'>('all')

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/billing/invoices')
      const data = await res.json()
      if (data.success) {
        setInvoices(data.data || [])
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error loading invoices', error, { endpoint: '/dashboard/reception/billing' })
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      !searchTerm ||
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const totalPending = invoices.filter((i) => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0)
  const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0)
  const totalRevenue = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.paid_amount, 0)

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">جاري تحميل الفواتير...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الفواتير والمدفوعات</h1>
            <p className="text-gray-500 text-lg">إدارة الفواتير والمدفوعات</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/reception/billing/new')}
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            <Plus size={20} />
            فاتورة جديدة
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalPaid.toFixed(2)} ر.س</div>
          <div className="text-sm text-gray-500">المدفوع</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-100 text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalPending.toFixed(2)} ر.س</div>
          <div className="text-sm text-gray-500">قيد الانتظار</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalOverdue.toFixed(2)} ر.س</div>
          <div className="text-sm text-gray-500">متأخر</div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">{totalRevenue.toFixed(2)} ر.س</div>
          <div className="text-sm text-gray-500">إجمالي الإيرادات</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في الفواتير..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {(['all', 'paid', 'pending', 'overdue', 'partial'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' && 'الكل'}
                {status === 'paid' && 'مدفوعة'}
                {status === 'pending' && 'قيد الانتظار'}
                {status === 'overdue' && 'متأخرة'}
                {status === 'partial' && 'جزئية'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-500 text-lg mb-2">لا توجد فواتير</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign size={20} className="text-primary" />
                    <h3 className="text-xl font-bold text-gray-900">
                      فاتورة رقم: {invoice.invoice_number}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : invoice.status === 'overdue'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'pending' ? 'قيد الانتظار' : invoice.status === 'overdue' ? 'متأخرة' : 'جزئية'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div>
                      <strong>المريض:</strong> {invoice.patient_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{new Date(invoice.date).toLocaleDateString('ar-SA')}</span>
                    </div>
                    {invoice.due_date && (
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span>الاستحقاق: {new Date(invoice.due_date).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-left ml-4">
                  <div className="text-2xl font-bold text-gray-900">{invoice.amount.toFixed(2)} ر.س</div>
                  {invoice.paid_amount > 0 && (
                    <div className="text-sm text-gray-500">مدفوع: {invoice.paid_amount.toFixed(2)} ر.س</div>
                  )}
                  {invoice.payment_method && (
                    <div className="text-sm text-gray-500">طريقة الدفع: {invoice.payment_method}</div>
                  )}
                </div>
              </div>

              {/* Services */}
              {invoice.services && invoice.services.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">الخدمات:</h4>
                  <div className="space-y-2">
                    {invoice.services.map((service, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{service.name}</div>
                          <div className="text-gray-600">
                            {service.quantity} × {service.price.toFixed(2)} ر.س
                          </div>
                        </div>
                        <div className="font-medium text-gray-900">
                          {(service.quantity * service.price).toFixed(2)} ر.س
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={async () => {
                    try {
                      const { downloadInvoice } = await import('@/shared/utils/download')
                      await downloadInvoice(invoice.id)
                      toast.success('تم تحميل الفاتورة بنجاح')
                    } catch (error) {
                      toast.error('فشل تحميل الفاتورة')
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
                >
                  <Download size={16} />
                  تحميل
                </button>
                {invoice.status !== 'paid' && (
                  <button
                    onClick={() => router.push(`/dashboard/reception/billing/${invoice.id}/payment`)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm transition-colors"
                  >
                    تسجيل دفعة
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
