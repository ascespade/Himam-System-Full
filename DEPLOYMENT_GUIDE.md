# 🚀 دليل إعداد بيئة Deploy على Ubuntu Server

## ✅ ما تم إنجازه

تم إعداد السيرفر كبيئة deploy كاملة مع الميزات التالية:

### 📦 البرامج المثبتة

- ✅ **Node.js v22.21.1** - آخر إصدار
- ✅ **PM2 v6.0.14** - Process Manager مع auto-restart
- ✅ **tmux** - للجلسات المستمرة
- ✅ **screen** - بديل للجلسات المستمرة
- ✅ **Git, curl, wget** - أدوات أساسية

### 🔧 الإعدادات المطبقة

1. **SSH Keepalive** - منع قطع الاتصال
2. **PM2 Auto-start** - إعادة تشغيل التطبيقات تلقائياً
3. **tmux/screen** - جلسات مستمرة حتى بعد قطع SSH
4. **Network Stability** - تحسين استقرار الاتصال
5. **Deployment Directories** - هيكل مجلدات منظم

---

## 📁 هيكل المجلدات

```
/home/ubuntu/
├── apps/          # التطبيقات المثبتة
├── logs/          # ملفات السجلات
├── backups/       # النسخ الاحتياطية
└── scripts/       # سكريبتات مساعدة
    ├── deploy.sh
    └── start-session.sh
```

---

## 🎯 الاستخدام السريع

### 1. بدء جلسة tmux مستمرة

```bash
# بدء جلسة جديدة
tmux new -s deploy

# أو استخدام السكريبت
/home/ubuntu/scripts/start-session.sh deploy

# إعادة الاتصال بالجلسة
tmux attach -t deploy

# فصل الجلسة (تبقى تعمل في الخلفية)
# اضغط: Ctrl+B ثم D
```

### 2. نشر تطبيق مع PM2

```bash
# الانتقال لمجلد التطبيق
cd /home/ubuntu/apps/your-app

# إنشاء ملف ecosystem.config.js
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'your-app',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

# بدء التطبيق
pm2 start ecosystem.config.js

# حفظ الإعدادات (لإعادة التشغيل التلقائي)
pm2 save

# التحقق من الحالة
pm2 status
pm2 logs
```

### 3. استخدام سكريبت Deploy

```bash
# نشر تطبيق باستخدام السكريبت
/home/ubuntu/scripts/deploy.sh your-app

# السكريبت يقوم تلقائياً بـ:
# - تثبيت dependencies (npm ci)
# - بناء المشروع (npm run build)
# - إعادة تشغيل PM2
```

---

## 🔄 إدارة PM2

### الأوامر الأساسية

```bash
# بدء تطبيق
pm2 start app.js
pm2 start ecosystem.config.js

# إيقاف تطبيق
pm2 stop app-name
pm2 stop all

# إعادة تشغيل
pm2 restart app-name
pm2 restart all

# حذف من PM2
pm2 delete app-name

# عرض الحالة
pm2 status
pm2 list

# عرض السجلات
pm2 logs
pm2 logs app-name
pm2 logs --lines 100

# مراقبة الأداء
pm2 monit

# حفظ الإعدادات (مهم!)
pm2 save

# إعادة تحميل بدون downtime
pm2 reload app-name
```

### إعدادات Auto-restart

PM2 مُعد تلقائياً لإعادة تشغيل التطبيقات عند:
- ✅ إعادة تشغيل السيرفر
- ✅ تعطل التطبيق
- ✅ استهلاك ذاكرة عالي
- ✅ خطأ في الكود

---

## 🖥️ استخدام tmux للجلسات المستمرة

### الأوامر الأساسية

```bash
# بدء جلسة جديدة
tmux new -s session-name

# إعادة الاتصال
tmux attach -t session-name

# عرض الجلسات
tmux ls

# فصل الجلسة (تبقى تعمل)
# اضغط: Ctrl+B ثم D

# إنهاء جلسة
tmux kill-session -t session-name
```

### اختصارات مفيدة

- `Ctrl+B` ثم `D` - فصل الجلسة
- `Ctrl+B` ثم `C` - نافذة جديدة
- `Ctrl+B` ثم `N` - الانتقال للنافذة التالية
- `Ctrl+B` ثم `P` - الانتقال للنافذة السابقة
- `Ctrl+B` ثم `%` - تقسيم عمودي
- `Ctrl+B` ثم `"` - تقسيم أفقي

---

## 🌐 تحسين استقرار الاتصال

### إعدادات SSH Keepalive

تم تطبيق الإعدادات التالية على SSH:

```
ClientAliveInterval 60
ClientAliveCountMax 10
TCPKeepAlive yes
```

هذا يعني:
- ✅ إرسال keepalive كل 60 ثانية
- ✅ إعادة المحاولة 10 مرات قبل قطع الاتصال
- ✅ الاتصال يبقى نشط حتى مع انقطاع مؤقت

### إعدادات Network

تم تطبيق إعدادات TCP لتحسين الاستقرار:

```bash
# عرض الإعدادات
cat /etc/sysctl.d/99-network-stability.conf

# تطبيق الإعدادات
sudo sysctl -p /etc/sysctl.d/99-network-stability.conf
```

---

## 📝 مثال كامل: نشر تطبيق Next.js

```bash
# 1. إنشاء مجلد التطبيق
mkdir -p /home/ubuntu/apps/my-nextjs-app
cd /home/ubuntu/apps/my-nextjs-app

# 2. نسخ الكود (أو clone من Git)
git clone https://github.com/your-repo/app.git .

# 3. تثبيت dependencies
npm ci

# 4. بناء المشروع
npm run build

# 5. إنشاء ملف PM2
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'my-nextjs-app',
    script: 'npm',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/ubuntu/logs/my-app-err.log',
    out_file: '/home/ubuntu/logs/my-app-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

# 6. بدء التطبيق
pm2 start ecosystem.config.js

# 7. حفظ الإعدادات
pm2 save

# 8. التحقق من الحالة
pm2 status
pm2 logs my-nextjs-app
```

---

## 🔍 مراقبة الأداء

### PM2 Monitor

```bash
# مراقبة مباشرة
pm2 monit

# إحصائيات مفصلة
pm2 describe app-name

# عرض استخدام الموارد
pm2 show app-name
```

### System Monitoring

```bash
# استخدام الذاكرة والمعالج
htop

# استخدام الشبكة
iftop

# استخدام القرص
iotop
```

---

## 🔄 التحديثات والصيانة

### تحديث التطبيق

```bash
# 1. الانتقال لمجلد التطبيق
cd /home/ubuntu/apps/your-app

# 2. سحب آخر التحديثات
git pull

# 3. تثبيت dependencies الجديدة
npm ci

# 4. إعادة البناء
npm run build

# 5. إعادة تشغيل PM2
pm2 restart your-app

# أو استخدام سكريبت deploy
/home/ubuntu/scripts/deploy.sh your-app
```

### النسخ الاحتياطي

```bash
# نسخ احتياطي للتطبيق
cp -r /home/ubuntu/apps/your-app /home/ubuntu/backups/your-app-$(date +%Y%m%d)

# نسخ احتياطي للقاعدة البيانات (إن وجدت)
# حسب نوع قاعدة البيانات المستخدمة
```

---

## 🛠️ استكشاف الأخطاء

### التطبيق لا يعمل

```bash
# التحقق من حالة PM2
pm2 status

# عرض السجلات
pm2 logs your-app --lines 50

# التحقق من الأخطاء
pm2 logs your-app --err

# إعادة تشغيل
pm2 restart your-app
```

### الاتصال انقطع

```bash
# إعادة الاتصال بـ tmux
tmux attach -t deploy

# أو التحقق من الجلسات
tmux ls
```

### PM2 لا يبدأ تلقائياً

```bash
# إعادة إعداد auto-start
pm2 unstartup systemd
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

---

## 📚 موارد إضافية

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [tmux Cheat Sheet](https://tmuxcheatsheet.com/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

---

## ✅ Checklist قبل Deploy

- [ ] التطبيق مبني بنجاح (`npm run build`)
- [ ] ملف `ecosystem.config.js` موجود وصحيح
- [ ] متغيرات البيئة (`.env`) محددة
- [ ] PM2 يبدأ التطبيق بنجاح (`pm2 start`)
- [ ] PM2 محفوظ (`pm2 save`)
- [ ] السجلات تعمل (`pm2 logs`)
- [ ] التطبيق يستجيب على البورت المحدد
- [ ] النسخ الاحتياطي تم

---

**تاريخ الإعداد**: $(date)
**الحالة**: ✅ جاهز للاستخدام

