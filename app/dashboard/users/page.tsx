'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, Calendar, ChevronRight, ChevronLeft, X, Save, Eye, EyeOff, ArrowUpDown } from 'lucide-react'
import Modal from '@/components/Modal'

interface User {
  id: string
  name: string
  email: string
  phone: string
  role: string
  created_at: string
  last_login?: string
  updated_at?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'patient', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'role'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(searchTerm && { search: searchTerm })
      })
      
      const res = await fetch(`/api/users?${params}`)
      const data = await res.json()
      if (data.success) {
        // Sort locally for now (can be moved to backend)
        let sorted = [...(data.data || [])]
        sorted.sort((a, b) => {
          let aVal: string | number = a[sortBy] as string | number
          let bVal: string | number = b[sortBy] as string | number
          if (sortBy === 'created_at') {
            aVal = new Date(aVal as string).getTime()
            bVal = new Date(bVal as string).getTime()
          }
          return sortOrder === 'asc' 
            ? (aVal > bVal ? 1 : -1)
            : (aVal < bVal ? 1 : -1)
        })
        setUsers(sorted)
        if (data.pagination) {
          setPagination(data.pagination)
        }
      } else {
        setError(data.error || 'فشل تحميل المستخدمين')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, selectedRole, searchTerm, sortBy, sortOrder])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAddUser = () => {
    setFormData({ name: '', email: '', phone: '', role: 'patient', password: '' })
    setShowAddModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: ''
    })
    setShowEditModal(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const saveUser = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (!formData.name || !formData.email || !formData.phone) {
        setError('جميع الحقول مطلوبة')
        return
      }

      const url = selectedUser ? `/api/users/${selectedUser.id}` : '/api/users'
      const method = selectedUser ? 'PUT' : 'POST'
      const body = selectedUser 
        ? { name: formData.name, email: formData.email, phone: formData.phone, role: formData.role }
        : { ...formData }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        setSuccess(selectedUser ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح')
        setShowAddModal(false)
        setShowEditModal(false)
        setFormData({ name: '', email: '', phone: '', role: 'patient', password: '' })
        setSelectedUser(null)
        setTimeout(() => {
          fetchUsers()
          setSuccess(null)
        }, 1000)
      } else {
        setError(data.error || 'فشل الحفظ')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      setError('حدث خطأ في الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedUser) return

    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        setSuccess('تم حذف المستخدم بنجاح')
        setShowDeleteModal(false)
        setSelectedUser(null)
        setTimeout(() => {
          fetchUsers()
          setSuccess(null)
        }, 1000)
      } else {
        setError(data.error || 'فشل الحذف')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('حدث خطأ في الحذف')
    } finally {
      setSaving(false)
    }
  }

  const handleSort = (field: 'name' | 'created_at' | 'role') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const roles = [
    { value: 'all', label: 'الكل' },
    { value: 'admin', label: 'مدير' },
    { value: 'doctor', label: 'طبيب' },
    { value: 'staff', label: 'موظف' },
    { value: 'patient', label: 'مريض' }
  ]

  const roleLabels: Record<string, string> = {
    admin: 'مدير',
    doctor: 'طبيب',
    staff: 'موظف',
    patient: 'مريض'
  }

  if (loading && users.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">إدارة المستخدمين</h1>
        <p className="text-gray-500 text-lg">عرض وإدارة جميع المستخدمين في النظام</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ابحث عن مستخدم..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>

          {/* Add Button */}
          <button 
            onClick={handleAddUser}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            إضافة مستخدم
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-gray-900">{pagination.total}</div>
          <div className="text-sm text-gray-500 mt-1">إجمالي المستخدمين</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-primary">{users.filter(u => u.role === 'doctor').length}</div>
          <div className="text-sm text-gray-500 mt-1">الأطباء</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-blue-600">{users.filter(u => u.role === 'staff').length}</div>
          <div className="text-sm text-gray-500 mt-1">الموظفين</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">{users.filter(u => u.role === 'patient').length}</div>
          <div className="text-sm text-gray-500 mt-1">المرضى</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    الاسم
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">البريد الإلكتروني</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">الهاتف</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                  <button 
                    onClick={() => handleSort('role')}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    الدور
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700">
                  <button 
                    onClick={() => handleSort('created_at')}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    تاريخ التسجيل
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {loading ? 'جاري التحميل...' : 'لا توجد نتائج'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{user.name}</div>
                          {user.last_login && (
                            <div className="text-xs text-gray-400 mt-1">
                              آخر دخول: {new Date(user.last_login).toLocaleDateString('ar-SA')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={16} className="text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone size={16} className="text-gray-400" />
                        {user.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'doctor' ? 'bg-primary/10 text-primary' :
                        user.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="text-sm text-gray-600">
            عرض {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <div className="px-4 py-2 text-sm font-bold text-gray-700">
              صفحة {pagination.page} من {pagination.totalPages}
            </div>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => {
          setShowAddModal(false)
          setShowEditModal(false)
          setFormData({ name: '', email: '', phone: '', role: 'patient', password: '' })
          setSelectedUser(null)
          setError(null)
        }}
        title={selectedUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
        size="md"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الكامل</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="أدخل الاسم الكامل"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+966XXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الدور</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {roles.filter(r => r.value !== 'all').map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          {!selectedUser && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="كلمة المرور"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={saveUser}
              disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={() => {
                setShowAddModal(false)
                setShowEditModal(false)
                setFormData({ name: '', email: '', phone: '', role: 'patient', password: '' })
                setSelectedUser(null)
                setError(null)
              }}
              className="px-6 py-3 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
          setError(null)
        }}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <p className="text-gray-700">
            هل أنت متأكد من حذف المستخدم <strong>{selectedUser?.name}</strong>؟
            <br />
            <span className="text-sm text-gray-500">لا يمكن التراجع عن هذا الإجراء.</span>
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={confirmDelete}
              disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {saving ? 'جاري الحذف...' : 'حذف'}
            </button>
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedUser(null)
                setError(null)
              }}
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
