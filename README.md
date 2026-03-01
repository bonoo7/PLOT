# الحبكة - The Plot Game 🎮

لعبة حفلة تفاعلية تجمع بين الاستنتاج والخداع والإقناع لـ 3-8 لاعبين.

## ⚡ البدء السريع

### المتطلبات
- Node.js v22+
- تطبيق Expo Go (للموبايل)

### التثبيت والتشغيل

```bash
git clone https://github.com/YourUsername/plot-game.git
cd plot-game
npm install
npm start
```

يقوم `npm start` بـ:
1. ✅ تشغيل خادم Node.js على المنفذ 3000
2. ✅ تشغيل Expo على المنفذ 19000

### الوصول إلى اللعبة

| الجهاز | الرابط |
|--------|--------|
| Host (PC) | `http://localhost:3000` |
| Admin Dashboard | `http://localhost:3000/admin` |
| Player (Mobile) | Expo Go + QR Code |

---

## 🆕 آخر التحديثات (v3.0.0)

### إعادة هيكلة الخادم الكاملة
تم تقسيم `server/index.js` من ~2500 سطر إلى وحدات صغيرة ومتخصصة:
- `server/state.js` → إدارة حالة الغرف المشتركة
- `server/routes/adminRoutes.js` → لوحة التحكم الإدارية
- `server/game/phases.js` → منطق مراحل اللعبة (21 دالة)
- `server/sockets/registerHandlers.js` → معالجة أحداث Socket.IO

### إصلاحات الاستقرار
- ✅ إصلاح انهيار الخادم عند انتهاء الجولة الأخيرة
- ✅ إضافة معالج `uncaughtException` لمنع توقف الخادم
- ✅ إصلاح `generateRoomCode` بعد الهيكلة
- ✅ إصلاح استخدام `ioInstance` بدلاً من `io` في modules منفصلة

---

## 🎮 كيفية اللعب

### 1. الإعداد
- **المضيف (PC):** ينشئ غرفة ويشارك الرمز (4 حروف). يضغط **"🤖 تعبئة بوتات"** لملء الفراغات.
- **اللاعبون (Mobile):** يدخلون الرمز واسمهم.
- **التدريب الفردي:** اختر دورك، وسيملأ النظام الغرفة ببوتات آلياً.

### 2. الأدوار (V4)

| الفريق | الدور | الميزة |
|--------|-------|---------|
| 🔵 العدالة | المحقق | يفحص لاعباً — يصله الرد عند النقاش |
| 🔵 العدالة | الشاهد | يرى كلمات مفتاحية |
| 🔵 العدالة | العرّاف | ينسخ القصة الحقيقية تلقائياً |
| 🔵 العدالة | الوزير | يعرف المحقق والمستفيد |
| 🔴 الجريمة | الجاني | يعرف القصة كاملاً |
| 🔴 الجريمة | العقل المدبر | يعرف فريق الجريمة ويوجّه الرشاوى |
| 🔴 الجريمة | المخرب | يقلب نتيجة فحص المحقق |
| 🔴 الجريمة | المستفيد | يبدأ بنقاط إضافية |

### 3-6. مراحل اللعب
**الكتابة (90ث)** → **العرض التشويقي** → **النقاش (120ث)** → **التصويت** → **النتائج**

---

## 📁 هيكل المشروع

```
plot/
├── server/
│   ├── index.js                 # Bootstrap (~50 سطر)
│   ├── state.js                 # rooms state
│   ├── database.js              # JSON Database
│   ├── game/
│   │   └── phases.js            # منطق مراحل اللعبة
│   ├── sockets/
│   │   └── registerHandlers.js  # Socket.IO events
│   ├── routes/
│   │   └── adminRoutes.js       # /admin dashboard
│   ├── logic/
│   │   ├── scoring.js           # حساب النقاط
│   │   └── offers.js            # نظام العروض
│   ├── utils/serverUtils.js     # دوال مساعدة
│   ├── botAI.js                 # محرك الذكاء الاصطناعي
│   ├── githubAI.js              # GitHub Models API
│   ├── roles.js                 # تعريفات الأدوار
│   └── scenarios.js             # سيناريوهات اللعبة
├── plot-mobile/
│   ├── App.js
│   └── src/
│       ├── screens/             # شاشات اللعبة
│       ├── components/          # UI Components
│       ├── hooks/
│       │   ├── useGameSocket.js # Socket Context
│       │   └── useGameStore.js  # Zustand State
│       └── navigation/          # AppNavigator
└── docs/
```

---

## 🛠 التكنولوجيا

| المكون | التقنية |
|--------|---------|
| Backend | Node.js + Express |
| Real-time | Socket.IO |
| Mobile/Web | React Native (Expo) |
| State | Zustand |
| AI | GitHub Models API (GPT-4o-mini) |
| Database | JSON (db.json) |

---

## 📚 التوثيق

- [`GDD.md`](GDD.md) — تصميم اللعبة الكامل
- [`TECHNICAL_IMPLEMENTATION.md`](TECHNICAL_IMPLEMENTATION.md) — التفاصيل التقنية

---

- **Version**: 3.0.0
- **Last Updated**: 2026-03-01

**استمتع باللعبة! 🎉**
