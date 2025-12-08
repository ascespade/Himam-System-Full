'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Notification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  type: string
  entity_type?: string
  entity_id?: string
}

export default function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchNotifications()

    // Subscribe to real-time notifications
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel(`notifications:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => {
            // Check if notification already exists to avoid duplicates
            if (prev.some(n => n.id === newNotification.id)) {
              return prev
            }
            return [newNotification, ...prev]
          })
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1)
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications(prev => prev.map(n => 
            n.id === updatedNotification.id ? updatedNotification : n
          ))
          if (updatedNotification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const deletedId = payload.old.id
          setNotifications(prev => {
            const deleted = prev.find(n => n.id === deletedId)
            if (deleted && !deleted.is_read) {
              setUnreadCount(count => Math.max(0, count - 1))
            }
            return prev.filter(n => n.id !== deletedId)
          })
        })
        .subscribe()

      return channel
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      if (data.success) {
        setNotifications(data.data)
        setUnreadCount(data.data.filter((n: Notification) => !n.is_read).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PUT' })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'PUT' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      setNotifications(prev => prev.filter(n => n.id !== id))
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === id)
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev
      })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationLink = (notification: Notification): string | null => {
    if (!notification.entity_type || !notification.entity_id) return null
    
    // Special handling for conversations (entity_id is phone number)
    if (notification.entity_type === 'conversation') {
      return `/dashboard/chat`
    }
    
    const links: Record<string, (id: string) => string> = {
      appointment: (id) => `/dashboard/appointments/${id}`,
      invoice: (id) => `/dashboard/billing/invoices/${id}`,
      insurance_claim: (id) => `/dashboard/insurance/claims/${id}`,
      patient: (id) => `/dashboard/patients/${id}`,
      lab_result: (id) => `/dashboard/medical-records/lab/${id}`,
      prescription: (id) => `/dashboard/medical-records/prescriptions/${id}`
    }

    return links[notification.entity_type]?.(notification.entity_id) || null
  }

  const filteredNotifications = filterType
    ? notifications.filter(n => n.type === filterType)
    : notifications

  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)))

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-900">الإشعارات</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <>
                      <span className="text-xs text-primary font-bold">{unreadCount} جديد</span>
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:text-primary-dark font-medium px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                      >
                        تحديد الكل كمقروء
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* Filter by type */}
              {notificationTypes.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterType(null)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                      filterType === null
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    الكل
                  </button>
                  {notificationTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`text-xs px-2 py-1 rounded-lg transition-colors capitalize ${
                        filterType === type
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  {filterType ? `لا توجد إشعارات من نوع ${filterType}` : 'لا توجد إشعارات'}
                </div>
              ) : (
                filteredNotifications.map(notification => {
                  const link = getNotificationLink(notification)
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold ${!notification.is_read ? 'text-primary' : 'text-gray-900'}`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 capitalize">{notification.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {new Date(notification.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="حذف"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-primary hover:text-primary-dark font-medium"
                          >
                            تحديد كمقروء
                          </button>
                        )}
                        {link && (
                          <a
                            href={link}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                          >
                            عرض التفاصيل →
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
