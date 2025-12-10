# حالة Realtime لجداول الواتساب

## ✅ Realtime مفعّل على جميع الجداول

تم تفعيل Supabase Realtime على جميع جداول الواتساب التالية:

### الجداول المفعّلة:

1. **`whatsapp_conversations`** ✅
   - تحديثات فورية عند إنشاء/تحديث المحادثات
   - تحديثات عند تغيير الحالة، عدد الرسائل غير المقروءة، إلخ

2. **`whatsapp_messages`** ✅
   - تحديثات فورية عند إرسال/استقبال رسائل جديدة
   - تحديثات عند تغيير حالة الرسالة (sent → delivered → read)

3. **`whatsapp_settings`** ✅
   - تحديثات عند تغيير إعدادات الواتساب

4. **`whatsapp_templates`** ✅
   - تحديثات عند إنشاء/تحديث/حذف القوالب

5. **`whatsapp_scheduled_messages`** ✅
   - تحديثات عند جدولة/إرسال/إلغاء الرسائل المجدولة

6. **`whatsapp_analytics`** ✅
   - تحديثات عند تحديث التحليلات

## 🔄 كيفية الاستخدام في Frontend

### مثال: الاستماع لتحديثات المحادثات

```typescript
import { supabase } from '@/lib/supabase'

// Subscribe to conversations
const channel = supabase
  .channel('whatsapp_conversations_live')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'whatsapp_conversations',
    },
    (payload) => {
      console.log('Conversation updated:', payload)
      // Update your UI
    }
  )
  .subscribe()

// Subscribe to messages for a specific conversation
const messagesChannel = supabase
  .channel(`whatsapp_messages_${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'whatsapp_messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      console.log('New message:', payload)
      // Add message to chat UI
    }
  )
  .subscribe()
```

## 📊 الفرق بين Conversation و Messages

### Conversation (المحادثة)
- **الغرض**: الحاوية/السياق للمحادثة مع رقم هاتف معين
- **المحتوى**:
  - رقم الهاتف (`phone_number`)
  - الحالة (`status`: active, archived, blocked)
  - آخر رسالة (`last_message_at`)
  - عدد الرسائل غير المقروءة (`unread_count`)
  - من المعين له (`assigned_to`)
  - ملاحظات وعلامات (`notes`, `tags`)
  - ربط بالمريض (`patient_id`)

### Messages (الرسائل)
- **الغرض**: الرسائل الفعلية داخل المحادثة
- **المحتوى**:
  - المحتوى (`content`)
  - النوع (`message_type`: text, image, audio, video, document, location)
  - الاتجاه (`direction`: inbound, outbound)
  - الحالة (`status`: sent, delivered, read, failed)
  - التوقيت (`created_at`, `delivered_at`, `read_at`)
  - ربط بالمحادثة (`conversation_id`)

### العلاقة
```
Conversation (1) ──< (N) Messages
```

**مثال:**
- محادثة واحدة مع `966581421483` تحتوي على 62 رسالة (31 inbound + 31 outbound)

## ✅ التحقق من الحالة

```sql
-- Check Realtime status
SELECT 
  tablename,
  'Realtime Enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename LIKE 'whatsapp%'
ORDER BY tablename;
```

## 📅 التاريخ

- **التفعيل**: 2025-01-15
- **Migration**: `enable_whatsapp_realtime_and_migrate_data`
- **الحالة**: ✅ مفعّل ومختبر

