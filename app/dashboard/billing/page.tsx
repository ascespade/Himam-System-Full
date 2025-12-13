'use client'

import Modal from '@/components/Modal'
import { CheckCircle, Eye, Plus, Printer, Search, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logError } from '@/shared/utils/logger'
import { toastError } from '@/shared/utils/toast'

interface Invoice {
  id: string
  invoice_number: string
  patient_id: string
  patient_name: string
  patient_phone: string
  total: number
  status: 'pending' | 'paid' | 'cancelled' | 'overdue'
  created_at: string
  due_date: string
}

interface InvoiceItem {
  description: string
  quantity: number
  price: number
}

export default function BillingPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Create Invoice Form State
  const [selectedPatient, setSelectedPatient] = useState('')
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, price: 0 }])
  const [patients, setPatients] = useState<any[]>([])

  useEffect(() => {
    fetchInvoices()
    fetchPatients()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/billing/invoices')
      const data = await res.json()
      if (data.success) {
        setInvoices(data.data || [])
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching invoices', error, { endpoint: '/dashboard/billing' })
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients')
      const data = await res.json()
      if (data.success) {
        setPatients(data.data || [])
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error fetching patients', error, { endpoint: '/dashboard/billing' })
    }
  }

  const handleCreateInvoice = async () => {
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient,
          items: invoiceItems
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowCreateModal(false)
        fetchInvoices()
        // Reset form
        setSelectedPatient('')
        setInvoiceItems([{ description: '', quantity: 1, price: 0 }])
      } else {
        const errorMessage = data.error || 'خطأ غير معروف'
        logError('Failed to create invoice', new Error(errorMessage), { endpoint: '/api/billing/invoices' })
        toastError('فشل إنشاء الفاتورة: ' + errorMessage)
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error creating invoice', error, { endpoint: '/dashboard/billing' })
    }
  }

  const updateInvoiceStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/billing/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (data.success) {
        fetchInvoices()
      }
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error updating invoice', error, { invoiceId: id, endpoint: '/dashboard/billing' })
    }
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || inv.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'overdue': return 'bg-red-100 text-red-700'
      case 'cancelled': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'مدفوع'
      case 'pending': return 'غير مدفوع'
      case 'overdue': return 'متأخر'
      case 'cancelled': return 'ملغي'
      default: return status
    }
  }

  const addItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    const newItems = [...invoiceItems]
    newItems.splice(index, 1)
    setInvoiceItems(newItems)
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...invoiceItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setInvoiceItems(newItems)
  }

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">الفواتير والمدفوعات</h1>
          <p className="text-gray-500 text-lg">إدارة الفواتير والتحصيل المالي</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          فاتورة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-gray-900">
            {invoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString()} ر.س
          </div>
          <div className="text-sm text-gray-500 mt-1">إجمالي الفواتير</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">
            {invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.total, 0).toLocaleString()} ر.س
          </div>
          <div className="text-sm text-gray-500 mt-1">المدفوعات المحصلة</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-yellow-600">
            {invoices.filter(i => i.status === 'pending').reduce((sum, inv) => sum + inv.total, 0).toLocaleString()} ر.س
          </div>
          <div className="text-sm text-gray-500 mt-1">مبالغ مستحقة</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-red-600">
            {invoices.filter(i => i.status === 'overdue').reduce((sum, inv) => sum + inv.total, 0).toLocaleString()} ر.س
          </div>
          <div className="text-sm text-gray-500 mt-1">متأخرات</div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="بحث برقم الفاتورة أو اسم المريض..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مدفوع</option>
            <option value="pending">غير مدفوع</option>
            <option value="overdue">متأخر</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">رقم الفاتورة</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المريض</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">التاريخ</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">المبلغ</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {loading ? 'جاري التحميل...' : 'لا توجد فواتير'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{inv.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{inv.patient_name}</div>
                      <div className="text-xs text-gray-400 mt-1">{inv.patient_phone}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(inv.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{inv.total.toLocaleString()} ر.س</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(inv.status)}`}>
                        {getStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="عرض">
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="طباعة">
                          <Printer size={18} />
                        </button>
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => updateInvoiceStatus(inv.id, 'paid')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="تسجيل دفع"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="إنشاء فاتورة جديدة"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">المريض</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">اختر المريض</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700">بنود الفاتورة</label>
              <button onClick={addItem} className="text-primary text-sm font-bold hover:underline">+ إضافة بند</button>
            </div>
            <div className="space-y-3">
              {invoiceItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="الوصف"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      placeholder="الكمية"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="السعر"
                      min="0"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  {invoiceItems.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>الإجمالي التقديري:</span>
              <span>{calculateTotal().toLocaleString()} ر.س</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCreateInvoice}
              disabled={!selectedPatient || calculateTotal() === 0}
              className="flex-1 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إنشاء الفاتورة
            </button>
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
