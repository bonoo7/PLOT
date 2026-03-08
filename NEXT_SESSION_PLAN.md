# خطة العمل للجلسة القادمة

## ما تم إنجازه (جلسة 2026-03-07) ✅ — مراجعة الكود الاحترافية الكاملة

### 🔐 إصلاحات أمنية حرجة:
1. **تأمين `/admin`** — middleware `adminAuth` يتحقق من `ADMIN_KEY` في header أو query
2. **حماية XSS** — `sanitizePlayerName()` تنظف أسماء اللاعبين من HTML/control chars
3. **فحص مدخلات Socket** — `validateInput()` على `submitAnswer`, `submitQualityVote`, `submitCulpritVote`
4. **تقييد CORS** — `allowedOrigins` من `.env` بدلاً من `origin: "*"`
5. **Rate Limiting** — `express-rate-limit`: 100 req/15min على `/admin`، 60 req/min على `/health`

### 🐛 إصلاحات Bugs:
6. **Race Condition في database.js** — Atomic Write + Promise Lock + مسار ديناميكي من `.env`
7. **معالج `gameEnded` مكرر** — دمج في معالج واحد يحفظ النتائج ثم يعيد تعيين اللعبة
8. **`resetGame()` ناقص** — يعيد تعيين جميع الحقول بما فيها `connecting`, `voteTieInfo`, إلخ
9. **Race Condition الأصوات** — `setLiveVotes` أصبحت تدعم functional updates
10. **`setLiveVotes` يخزّن دالة بدلاً من array** — إصلاح critical: `typeof updater === 'function' ? updater(state.liveVotes) : updater`

### ⚡ إصلاحات الأداء والجودة:
11. **تسرب ذاكرة NavigationBar** — Cleanup في `useEffect` مع `listener.remove()`
12. **Stale Closure في إعادة الاتصال** — refs لـ `roomCode` و `playerName`
13. **`Alert.alert` في hooks** — notification state آمن في المتجر (⚠️ يحتاج UI component)
14. **FlatList بدلاً من ScrollView** — أداء أفضل في قوائم التصويت
15. **useMemo لحساب الأصوات** — O(n) بدلاً من O(n²) في HostGameScreens
16. **Graceful Shutdown** — معالجة `SIGTERM`/`SIGINT`
17. **Health Check** — `GET /health` يُعيد حالة الخادم
18. **Structured Logging** — `winston` في `server/utils/logger.js`، ملفات في `server/logs/`
19. **18 Unit Test** — `server/__tests__/scoring.test.js` و `phases.test.js` — جميعها تعمل ✅
20. **Web rebuild** — bundle جديد `App-b4828d69...` مُجمَّع في `server/public/`

### 📄 تحديثات التوثيق:
- `ROADMAP.md` — قسم CRITICAL جديد + أولويات معاد ترتيبها
- `server/.env.example` — توثيق كامل لجميع متغيرات البيئة
- `NEXT_SESSION_PLAN.md` — هذا الملف

---

## فجوة تحتاج معالجة ⚠️

**Notification UI Component مفقود:**
- `notification` state موجود في `useGameStore` وجميع `Alert.alert` استُبدلت بـ `setNotification()`
- **لا يوجد component يعرض هذه الإشعارات بعد** ← المستخدمون لن يروا أي رسائل خطأ الآن
- الحل: إنشاء `plot-mobile/src/components/NotificationToast.js` يقرأ من `useGameStore().notification`
  ويُوضع في `AppContent` (App.js) مع `clearNotification()` بعد 3 ثوانٍ

---

## الخطوات القادمة 🚀

### 🔴 أولوية عالية — يجب قبل الإطلاق:

**1. NotificationToast Component**
- إنشاء مكوّن Toast/Banner يقرأ `useGameStore().notification`
- يظهر في أعلى الشاشة مع لون حسب النوع (info/warning/error)
- يختفي تلقائياً بعد 3 ثوانٍ أو عند الضغط عليه

**2. اختبار إعادة الاتصال الكاملة**
- اختبار الخروج والعودة في مراحل: Drafting, Voting, Discussion
- التحقق من أن الشاشة تتحدث لتتوافق مع المرحلة الحالية للهوست
- معالجة انقطاع الإنترنت الكامل

**3. Sentry Error Tracking**
- دمج `@sentry/react-native` للإنتاج
- تتبع الأخطاء تلقائياً مع context كامل

### 🟡 أولوية متوسطة:

**4. تحسينات V2 البصرية**
- Paper texture overlay — `texture_paper.png` بـ opacity: 0.08 في `DossierLayout.js`
- Dog-ear على بطاقات `DossierCard` — تأثير الزاوية المطوية
- Stamp effect "سري للغاية" في modal الدور

**5. تحسين واجهة النتائج النهائية**
- إحصائيات مُفصّلة: أفضل سيناريو، أكثر المصوتين، جدول النقاط

**6. تحسين تجربة اللاعب المنفصل**
- إظهار "جاري إعادة الاتصال..." بصري أثناء محاولة الاتصال
- تعطيل الأزرار أثناء إعادة الاتصال

### 🟢 أولوية منخفضة:

**7. مؤثرات بصرية للقدرات** — أنيميشن flash/glow عند استخدام المحقق/المخرب

**8. Haptic feedback** — `expo-haptics` عند إرسال الإجابة وفتح modal الدور

**9. دعم 10+ لاعبين** — أدوار إضافية أو "مواطن عادي"

**10. نشر التطبيق** — بعد اكتمال الاختبارات والأمان

---

## نظام التصميم V2 "Classified Dossier" (مكتمل):
- **19+ ملف** في `plot-mobile/src/design-v2/` — يعمل موازياً لـ V1
- **ثيمان**: Light (ورق كرافت) + Dark (نوار) — V2 هو الافتراضي
- **CaseHeader**: modal ملف الدور + زر ثيم ☀️/🌙 + زر ريفرش ↺
- **استجابة كاملة**: جوال عمودي/أفقي + ويب ديسكتوب + RTL


### 🔐 إصلاحات أمنية حرجة (تم تطبيقها):
1. **تأمين `/admin`** — middleware `adminAuth` يتحقق من `ADMIN_KEY` في header
2. **حماية XSS** — `sanitizePlayerName()` تنظف كل أسماء اللاعبين
3. **فحص مدخلات Socket** — `validateInput()` على كل الأحداث الحساسة
4. **تقييد CORS** — `allowedOrigins` من `.env` بدلاً من `origin: "*"`
5. **`server/.env.example`** — توثيق كل متغيرات البيئة

### 🐛 إصلاحات Bugs حرجة (تم تطبيقها):
6. **Race Condition في database.js** — Atomic Write + Promise Lock + مسار ديناميكي
7. **معالج `gameEnded` مكرر** — دمج في معالج واحد يحفظ النتائج ثم يعيد تعيين اللعبة
8. **`resetGame()` ناقص** — يعيد تعيين جميع الحقول بما فيها `connecting`, `voteTieInfo`, إلخ
9. **Race Condition الأصوات** — Functional update: `setLiveVotes(prev => [...prev, data])`

### ⚡ إصلاحات أداء وجودة (تم تطبيقها):
10. **تسرب ذاكرة NavigationBar** — Cleanup في `useEffect` مع `listener.remove()`
11. **Stale Closure في إعادة الاتصال** — refs لـ `roomCode` و `playerName`
12. **`Alert.alert` خطر في hooks** — notification state آمن في المتجر
13. **FlatList بدلاً من ScrollView** — أداء أفضل في قوائم التصويت
14. **useMemo لحساب الأصوات** — O(n) بدلاً من O(n²) في HostGameScreens
15. **Graceful Shutdown** — معالجة `SIGTERM`/`SIGINT`
16. **Health Check** — `GET /health` يُعيد حالة الخادم

---

## التحسينات المقترحة لـ V2 (للنقاش والتنفيذ)

### 🔴 أولوية عالية — تحسينات بصرية مباشرة:

**1. Paper texture overlay**
- إضافة `texture_paper.png` كـ overlay شفاف (opacity: 0.08) فوق خلفية `c.bg`
- يُعطي إحساساً حقيقياً بالورق الكرافت
- سهل التنفيذ: ImageBackground في `DossierLayout.js`

**2. Dog-ear على البطاقات (DossierCard)**
- زاوية مطوية (مثلث) في الزاوية اليمنى العليا
- CSS-only: `borderTopRightRadius: 0` + مثلث absolute positioned
- يُعطي طابع الملفات والمستندات

**3. Stamp effect على CaseHeader**
- ختم دائري "سري للغاية" خلف بيانات الدور في الـ modal
- `position: absolute`, `opacity: 0.15`, `rotate: -15deg`

---

### 🟡 أولوية متوسطة — حركة وتفاعل:

**4. Staggered entrance animation**
- عند دخول الشاشة: العناصر تظهر واحداً تلو الآخر (delay متتالي)
- `useEntranceAnimation.js` موجود — يمكن تفعيله في V2
- يُعطي إحساساً بالتهيؤ والجاهزية

**5. أنيميشن تبديل الثيم**
- عند الضغط على ☀️/🌙: fade transition بدلاً من التغيير الفجائي
- `Animated.timing` بـ 250ms

**6. Ability use animation**
- عند استخدام المحقق أو المخرب: flash/glow قصير (300ms)
- يُعزز اللحظة الدرامية

---

### 🟢 أولوية منخفضة — ميزات إضافية:

**7. Ink noise overlay للوضع الداكن**
**8. Toast notifications** — استبدال modals صغيرة بـ toast
**9. Haptic feedback** — `expo-haptics`
**10. Skeleton loading**

---

## الخطوات القادمة 🚀

### أولوية عالية 🔴
1. **اختبار وحدات**: كتابة `scoring.test.js` و `phases.test.js` باستخدام jest
2. **Sentry Error Tracking**: دمج أداة تتبع الأخطاء للإنتاج
3. **Rate Limiting**: `express-rate-limit` على الخادم
4. **عرض notification state**: إضافة مكوّن Toast/Banner يقرأ من `useGameStore().notification`
5. **اختبار إعادة الاتصال الكاملة**: التحقق من أن الإصلاحات الجديدة تعمل في جميع المراحل

### أولوية متوسطة 🟡
6. **تحسينات V2 البصرية**: Paper texture, Dog-ear, Stamp effects
7. **تكامل الأفاتار مع الخادم**
8. **مؤثرات صوتية**

### أولوية منخفضة 🟢
9. **نشر التطبيق** (بعد اكتمال الاختبارات والأمان)
10. **دعم 10+ لاعبين**


### نظام التصميم V2 "Classified Dossier" (مكتمل):
1. **19+ ملف** في `plot-mobile/src/design-v2/` — يعمل موازياً لـ V1
2. **تخطيط ثلاثي ثابت**: topZone (CaseHeader) + centerZone + bottomZone
3. **ثيمان**: Light (ورق كرافت) + Dark (نوار)
4. **استجابة كاملة**: جوال عمودي/أفقي + ويب ديسكتوب + RTL
5. **CaseHeader**: modal ملف الدور + زر ثيم ☀️/🌙 + زر ريفرش ↺
6. **V2 الافتراضي الآن**: `designVersion: 'v2'` في `useGameStore.js`
7. **إصلاح `start_fixed.js`**: قتل المنفذ المشغول + Ctrl+C

---

## التحسينات المقترحة لـ V2 (للنقاش والتنفيذ)

### 🔴 أولوية عالية — تحسينات بصرية مباشرة:

**1. Paper texture overlay**
- إضافة `texture_paper.png` كـ overlay شفاف (opacity: 0.08) فوق خلفية `c.bg`
- يُعطي إحساساً حقيقياً بالورق الكرافت
- سهل التنفيذ: ImageBackground في `DossierLayout.js`

**2. Dog-ear على البطاقات (DossierCard)**
- زاوية مطوية (مثلث) في الزاوية اليمنى العليا
- CSS-only: `borderTopRightRadius: 0` + مثلث absolute positioned
- يُعطي طابع الملفات والمستندات

**3. Stamp effect على CaseHeader**
- ختم دائري "سري للغاية" خلف بيانات الدور في الـ modal
- `position: absolute`, `opacity: 0.15`, `rotate: -15deg`

---

### 🟡 أولوية متوسطة — حركة وتفاعل:

**4. Staggered entrance animation**
- عند دخول الشاشة: العناصر تظهر واحداً تلو الآخر (delay متتالي)
- `useEntranceAnimation.js` موجود — يمكن تفعيله في V2
- يُعطي إحساساً بالتهيؤ والجاهزية

**5. أنيميشن تبديل الثيم**
- عند الضغط على ☀️/🌙: fade transition بدلاً من التغيير الفجائي
- `Animated.timing` بـ 250ms

**6. Ability use animation**
- عند استخدام المحقق أو المخرب: flash/glow قصير (300ms)
- يُعزز اللحظة الدرامية

---

### 🟢 أولوية منخفضة — ميزات إضافية:

**7. Ink noise overlay للوضع الداكن**
- grain texture خفيف فوق الخلفية الداكنة
- `SVG featurblend` أو `base64` noise image

**8. Toast notifications**
- استبدال modals صغيرة بـ toast مضغوط من أعلى
- يناسب رسائل مثل "تم إرسال إجابتك ✓"

**9. Haptic feedback**
- `expo-haptics` عند: إرسال الإجابة، فتح modal الدور، نتيجة القدرة
- متاح فقط على iOS/Android

**10. Skeleton loading**
- عند انتظار بيانات الخادم: هيكل شاشة خفيف
- يمنع وميض الشاشة الفارغة

---

## خطوات سابقة لا تزال ذات أولوية 🔴

### اختبار إعادة الاتصال الكاملة:
- اختبار الخروج والعودة في مراحل: Drafting, Voting, Discussion
- التحقق من أن الشاشة تُحدَّث بالكامل لتتوافق مع المرحلة الحالية للهوست
- معالجة انقطاع الإنترنت الكامل (ليس فقط الخروج من التطبيق)

### تحسين تجربة اللاعب المنفصل:
- إظهار رسالة "جاري إعادة الاتصال..." أثناء محاولة الاتصال
- منع الضغط على الأزرار أثناء إعادة الاتصال


### جلسة 2026-02-23 (إعادة الاتصال والتزامن):
1. **إصلاح إعادة الاتصال**:
   - إضافة `AppState` لمراقبة عودة التطبيق من الخلفية.
   - إرسال `joinRoom` تلقائياً عند العودة لمزامنة الشاشة مع الهوست.
   - إصلاح تعليق اللعبة عند انفصال لاعب أثناء التصويت.

2. **التلميح ثابت في مرحلة النقاش**:
   - التلميح يُحفظ في state ويظهر في `DiscussionScreen`.
   - مدة عرضه في العرض التشويقي ارتفعت من 5 إلى 15 ثانية.

3. **رمز الغرفة ثابت في شاشات الهوست**:
   - `MinimalLayout` يعرض `roomCode` badge في جميع شاشات المضيف.

4. **عرض المصوتين مع السيناريوهات**:
   - كل سيناريو في الشريط السفلي يعرض أسماء من صوّتوا له.

5. **ترتيب أولوية الأدوار**:
   - الجاني → الشاهد → المحقق → المخرب → الوزير → المستفيد → العراف → العقل المدبر.

### جلسات سابقة:
- إصلاحات الخادم والاستقرار (Syntax Errors، Legacy Handlers).
- ضبط الأدوار والقدرات V4 (Detective، Saboteur، Seer، Witness).
- إصلاح واجهة العميل (newRoundStarted، roundContinued).
- نظام العروض والرشاوى (Beneficiary → Mastermind → Target).
- واجهة بصرية موحدة (Noir Theme).

---

## الخطوات القادمة 🚀

### أولوية عالية 🔴
1. **اختبار إعادة الاتصال الكاملة**:
   - اختبار الخروج والعودة في مراحل مختلفة (Drafting, Voting, Discussion).
   - التحقق من أن الشاشة تتحدث بالكامل لتتوافق مع المرحلة الحالية للهوست.
   - معالجة حالة انقطاع الإنترنت الكاملة (ليس فقط الخروج من التطبيق).

2. **تحسين تجربة اللاعب المنفصل**:
   - إظهار رسالة واضحة "جاري إعادة الاتصال..." أثناء محاولة الاتصال.
   - منع الضغط على الأزرار أثناء إعادة الاتصال.

### أولوية متوسطة 🟡
3. **موازنة الأدوار والقدرات**:
   - مراجعة شاملة لتأثير كل قدرة على توازن اللعبة.

4. **تحسين واجهة النتائج النهائية**:
   - إضافة إحصائيات مُفصّلة في نهاية اللعبة (أفضل سيناريو، أكثر المصوتين...).

### أولوية منخفضة 🟢
5. **مؤثرات بصرية للقدرات**:
   - أنيميشن عند استخدام قدرة الجاني، المحقق، المخرب.

6. **دعم أكثر من 8 لاعبين**:
   - إضافة أدوار إضافية أو "مواطن عادي" لتكملة العدد.
