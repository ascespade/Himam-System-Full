# ⚡ تفعيل الووركفلو بسرعة

## الخطوات السريعة

1. **افتح الووركفلو في n8n:**
   ```
   https://n8n-9q4d.onrender.com/workflow/YCZ3lqYrNxWylyg3
   ```

2. **اضغط على Toggle Switch** بجانب "Inactive" لتفعيله

3. **إذا ظهر خطأ من Meta:**
   - تجاهل الخطأ (webhook محقق في Meta بالفعل ✅)
   - أو اضغط "Activate Anyway"

4. **تأكد من أن الووركفلو Active** ✅

## اختبار بعد التفعيل

بعد التفعيل، جرب:

```bash
curl "https://n8n-9q4d.onrender.com/webhook/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=my-secret-token&hub.challenge=test123"
```

**النتيجة المتوقعة**: `test123` (plain text) ✅

---

**ملاحظة**: لا يمكن تفعيل الووركفلو من MCP tools - يجب تفعيله من n8n UI.

