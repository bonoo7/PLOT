# التوثيق التقني - مشروع الحبكة

## حالة المشروع الحالية (الإصدار 3.2.0)

### آخر التحديثات (2026-03-04 — v3.2.0 — نظام التصميم V2 "Classified Dossier"):
- ✅ **نظام تصميم V2 كامل**: 19+ ملف في `plot-mobile/src/design-v2/` — يعمل موازياً لـ V1
- ✅ **تخطيط ثلاثي ثابت**: topZone / centerZone / bottomZone بلا تمرير
- ✅ **ثيمان light/dark**: ألوان ورق كرافت للفاتح، نوار داكن للداكن
- ✅ **استجابة كاملة**: جوال عمودي/أفقي + ويب ديسكتوب
- ✅ **CaseHeader**: modal ملف الدور كامل + زر ثيم + زر ريفرش في كل شاشة
- ✅ **V2 الافتراضي**: `designVersion: 'v2'` في `useGameStore.js`
- ✅ **إصلاح `start_fixed.js`**: قتل المنفذ المشغول تلقائياً + Ctrl+C

---

## نظام التصميم V2 — التوثيق الكامل

### البنية المعمارية

#### 1. التخطيط الثلاثي (`DossierLayout.js`)
```
SafeAreaView [root] — flex: 1, backgroundColor: c.bg
  └── View [inner] — flex: 1, width: '100%', maxWidth: contentMaxW, alignSelf: 'center'
        ├── View [topZone]    — CaseHeader: كود الغرفة / الدور / المرحلة
        ├── View [centerZone] — محتوى الشاشة المتغير (flex: 1)
        └── View [bottomZone] — أزرار الإجراءات
```

**`contentMaxW`**: `isDesktop ? 900 : '100%'` — فقط web desktop بعرض ≥ 900px يُقيَّد. كل الأجهزة الأخرى تستخدم 100% من العرض.

#### 2. الألوان (`tokens/index.js`)

| Token | Light | Dark |
|-------|-------|------|
| `bg` | `#E8DDB5` (ورق كرافت) | `#080D18` (نوار) |
| `surface` | `#F5EDD8` | `#111927` |
| `text` | `#1A0E04` | `#D4C5A0` |
| `red` / `accent` | `#B22222` | `#CC2200` |
| `gold` | `#9B7A2C` | `#D4AF37` |
| `green` | `#2E5E2E` | `#4A9B4A` |
| `blue` | `#1A3A5C` | `#2A6FAD` |

#### 3. `useLayout()` Hook
```js
const { width, height, isLandscape, isWeb, isDesktop, isTablet, isMobile, contentMaxW } = useLayout();
```
يُستخدم في كل شاشة للتكيف مع الوضع الأفقي والعمودي وحجم الشاشة.

#### 4. `CaseHeader.js` — الشريط العلوي
**الأوضاع الثلاثة:**
- `mode='host'`: كود الغرفة (pill أحمر) + المرحلة + الجولة
- `mode='player'`: إيموجي الدور + الاسم (قابل للنقر لـ modal) + رقم اللاعب
- `mode='neutral'`: عنوان + subtitle + كود الغرفة اختياري

**Modal ملف الدور** (يفتح عند النقر على الدور في وضع player):
- الاسم + الإيموجي + الفريق (جريمة/عدالة)
- الوصف (`roleData.description`)
- الهدف (`roleData.goal`)
- معلومة سرية (`roleData.info`)
- القدرة (`roleData.ability`)
- تلميح سري (`roleData.secretHint`)
- نتيجة القدرة (`roleData.abilityResult`) — يظهر بعد استخدام القدرة

**أزرار الخدمات** (تظهر دائماً في اليمين):
- `☀️/🌙` — تبديل الثيم (`setThemeMode`)
- `↺` — ريفرش (web: `window.location.reload()` ، native: navigate → RoleSelect)

#### 5. بيانات الدور المُرسلة من الخادم
```js
// server/sockets/registerHandlers.js — حدث roleAssigned
{
  role: 'DETECTIVE',
  roleName: 'المحقق',
  description: '...',   // ← ليس roleDescription
  team: 'JUSTICE',
  emoji: '🕵️',
  goal: '...',
  ability: '...',        // ← ليس abilityDescription
  info: '...',           // معلومة سرية خاصة بالسيناريو
  secretHint: '...',
  round: 1,
  totalRounds: 3,
}
```

#### 6. التبديل بين V1 و V2
```js
// useGameStore.js
designVersion: 'v2',        // الافتراضي الآن
setDesignVersion: (v) => set({ designVersion: v })

// App.js
const designVersion = useGameStore(s => s.designVersion);
return designVersion === 'v2' ? <AppNavigatorV2 /> : <AppNavigator />;
```
- من V2 → V1: زر "← V1" في `RoleSelectScreen` (V2)
- من V1 → V2: زر "🆕 تصميم V2" في `RoleSelectScreen` (V1)

#### 7. `start_fixed.js` — إصلاح تعارض المنفذ
عند تشغيل `npm start` وكان المنفذ 3000 مشغولاً:
1. يسأل "هل تريد قتل العملية؟"
2. يستخدم `netstat -ano` لإيجاد PID
3. يستخدم `taskkill /PID /F` لإيقاف العملية
4. ينتظر 800ms ثم يتحقق من تحرر المنفذ
5. إذا فشل: ينتقل للمنفذ التالي تلقائياً
6. إصلاح Ctrl+C داخل readline (SIGINT handler)

---

### آخر التحديثات (2026-03-02 — v2.9.0 — Identity, Blitz Colors, Tie Banner):
- ✅ **كود الغرفة دائماً ظاهر**: `GameHeader.js` يعرض header مبسط لشاشات الهوست بدون roleData.
- ✅ **نتيجة القدرة في هوية اللاعب**: نقطة ذهبية + قسم في modal الدور يعرض نتيجة التحقيق/التخريب.
- ✅ **تلوين الكلمات المملوءة (Blitz)**: `getHighlightedParts()` في `ScenarioRevealCard` + إرسال `template` من الخادم.
- ✅ **بانر التعادل للهوست**: `voteTieInfo` في الـ store + بانر برتقالي في `HostVotingScreen`.
- ✅ **إصلاح ReferenceError**: `toggleTheme` ينتقل قبل الـ early returns في `GameHeader`.

### آخر التحديثات (2026-03-01 — v2.8.0 — Ability Notification Unification):
- ✅ **توحيد التنبيهات**: حذف `Alert.alert()` من `abilityResult`، استبداله بـ `setPendingAbilityResult`.
- ✅ **مكوّن `ScenarioRevealCard`** (جديد): بطاقة سيناريو مع author badge (أعلى) و voter badges (أسفل) بـ negative margins.
- ✅ **`InvestigationNote.js` موسّع**: يدعم 4 أنواع قدرات بـ `getConfig()`.
- ✅ **إصلاح نتيجة المحقق**: حارس `isPending` يتجاهل الـ placeholder.
- ✅ **`abilityResultSeen` flag**: التنبيه مرة واحدة فقط في الجولة.

### آخر التحديثات (2026-03-01 — v2.7.0 — Bot Avatars & Admin Fixes):
- ✅ **نظام أفاتار البوتات**: مكونات `Avatar.js`, `AvatarEditor.js`, `AvatarLayers.js` — أفاتار SVG قابلة للتخصيص مع أنيميشن.
- ✅ **توليد أفاتار عشوائي**: `generateRandomBotAvatar` في `registerHandlers.js` يضمن تميزاً بصرياً لكل بوت.
- ✅ **إصلاح لوحة المشرف**: إزالة علامات الهروب من قالب HTML في `adminRoutes.js` لعرض البيانات الفعلية.
- ✅ **إحصائيات دقيقة للوحة المشرف**: `roomList.reduce` لحساب اللاعبين البشر والبوتات.
- ✅ **تحديث `PlayerBadge`**: يدعم الآن الأفاتار الكاملة.
- ✅ **تحسين `TrainingScreens`**: هوامش مناسبة وعرض الأفاتار في لوبي التدريب.


- ✅ **توحيد `PlayerBadge`**: تُستخدم في Lobby, Voting, Discussion بدلاً من عرض الأسماء النصية.
- ✅ **أصول بصرية جديدة**: 2 خلفية Noir محسّنة + 8 صور أدوار عالية الجودة + `texture_paper.png`.
- ✅ **`ScreenWrapper.js`** (جديد): غلاف شاشة موحد.
- ✅ **`constants/theme.js`** (جديد): ثوابت ثيم مشتركة.
- ✅ **`ShowcaseScreen.js`** (جديد): شاشة عرض المكونات للمطورين.
- ✅ **تنظيف الأصول القديمة**: حذف صور الأدوار القديمة ذات الهاشات المختلفة.

### آخر التحديثات (2026-03-01 — v2.5.0 — Complete Server Modularization):
- ✅ **تقسيم `server/index.js`**: من ~2500 سطر إلى 5 وحدات متخصصة (`state.js`, `game/phases.js`, `sockets/registerHandlers.js`, `routes/adminRoutes.js`, `utils/serverUtils.js`).
- ✅ **استخراج `useGameSocket.js`**: هوك React (569 سطر) لإدارة Socket بعيداً عن `App.js`.
- ✅ **`DraftingScreen.js`** (جديد): شاشة مستقلة لمرحلة الكتابة (Classic & Blitz).
- ✅ **`AppNavigator.js`** (جديد): نظام تنقل مركزي بـ React Navigation.
- ✅ **`useGameStore.js`** (جديد): متجر Zustand لإدارة الحالة.
- ✅ **معالج `uncaughtException`**: يمنع تعطل الخادم الكامل.
- ✅ **`test_game_flow.js`** (جديد): سكريبت اختبار تدفق اللعبة.
- ✅ **حذف ملفات النسخ الاحتياطية**: إزالة `App.js.backup` و `App.js.old`.

### آخر التحديثات (2026-02-26 - Results Redesign & Bot Fixes):
- ✅ **إعادة تصميم شاشة نتائج الجولة**: Minimal style — شريط لون الفريق لكل لاعب، اسم دوره، النقاط المكتسبة بالجولة (+N)، تفاصيل قابلة للتوسيع.
- ✅ **شاشة نتائج اللاعب**: مبسطة — تُوجِّه اللاعب فقط لشاشة المضيف.
- ✅ **`gameEnded` handler**: عند انتهاء اللعبة الكاملة، يعود جميع اللاعبين للشاشة الرئيسية.
- ✅ **إصلاح `isLastRound`**: الخادم يرسل القيمة الموثوقة في `resultPayload` بدلاً من حسابها على العميل.
- ✅ **توحيد قدرة المخرب**: كلا الوضعَين (Classic + Blitz) = `INVESTIGATION_FLIP` — إلغاء `WORD_SWAP` في Blitz.
- ✅ **إصلاح بوت المخرب (Critical)**: كان التخريب لا يعمل للبوتات إطلاقاً — تم إصلاح آلية التخريب لتطابق اللاعب الحقيقي.
- ✅ **إصلاح بوت العراف في Blitz**: يملأ الفراغات بالإجابات الصحيحة بدلاً من كتابة القصة الكاملة.
- ✅ **إعادة التصويت عند التعادل**: تعادل مرة → إعادة التصويت. تعادل مرتان → فوز الجريمة.
- ✅ **منع التصويت على المستبعد**: اللاعبون لا يستطيعون التصويت على مستبعد.
- ✅ **حذف معالجات قديمة**: إزالة `saboteurSabotage`، `detectiveCheck`، `seerReveal` (Dead Code).
- ✅ **Auto-cleanup غرف اللوبي**: تُحذف الغرف غير المستخدمة بعد 30 دقيقة (DoS prevention).
- ✅ **تنظيف المؤقتات**: `clearInterval(room.timer)` عند حذف الغرفة في `endGame`.
- ✅ **Reset `consecutiveTies`**: يُصفَّر في بداية كل جولة.

### آخر التحديثات (2026-02-25 - Stability & Gameplay Polish):
- ✅ **إصلاح مرحلة النقاش**: حل مشكلة React Error #130 بتصحيح `PlayerBadge` props.
- ✅ **تحسين زر الجولة التالية**: منطق قوي (Robust Logic) في الخادم والتطبيق لضمان الانتقال السلس للجولات حتى مع انقطاع الاتصال.
- ✅ **تحديث ترتيب الأدوار**: Culprit -> Witness -> Detective -> Saboteur -> Beneficiary -> Minister -> Seer -> Mastermind.
- ✅ **الوضع الافتراضي Blitz**: تسريع وتيرة اللعب بجعل إكمال الفراغات هو الأساس.
- ✅ **Smart AI Voting**: تفعيل منطق ذكي للبوتات يعتمد على المعرفة المحدودة (Limited Knowledge Base) لكل دور.


- ✅ **إعادة الاتصال التلقائية (AppState Reconnection)**:
  - يراقب التطبيق حالة الفورغراوند/باكغراوند عبر `AppState`.
  - عند العودة للتطبيق، يُرسل `joinRoom` تلقائياً وتُحدَّث الشاشة بحالة اللعبة الحالية.
- ✅ **التلميح ثابت في مرحلة النقاش**: يُحفظ التلميح في state ويُمرر لـ `DiscussionScreen`.
- ✅ **رمز الغرفة ثابت**: `MinimalLayout` يعرض رمز الغرفة في جميع شاشات المضيف.
- ✅ **ترتيب أولوية الأدوار**: `server/roles.js` يوزع الأدوار بترتيب محدد (الجاني → الشاهد → المحقق → المخرب → المستفيد → الوزير → العراف → العقل المدبر).
- ✅ **إصلاح تعليق التصويت**: اللاعبون المنفصلون لا يمنعون اكتمال مرحلة التصويت.

### أخر التحديثات (2026-02-14 - V4 Final Polish):
- ✅ **Role Abilities Refined**: 
  - المحقق (Detective): تظهر النتيجة حصراً في بداية مرحلة النقاش. التخريب يقلب النتيجة.
  - المخرب (Saboteur): القدرة تعمل فوراً، وتأثيرها يظهر عند فحص المحقق.
  - العراف (Seer): زر 'استخدام الوحي' يرسل القصة الحقيقية تلقائياً (Auto-Submit) أو يمكنه الكتابة يدوياً.
  - الشاهد (Witness): زر لاسترجاع الكلمات المفتاحية.
  - المستفيد/العقل المدبر: نظام العروض والعمولات (Proxy/Direct) يعمل بالكامل.
- ✅ **Stability & Flow**: 
  - إصلاح Syntax Errors في الخادم.
  - تحسين الانتقال بين الجولات (`newRoundStarted` event).
  - إزالة القيود (Abilities enabled from Round 1).
- ✅ **Rules V4**: تطبيق قواعد الإقصاء (Elimination) بدقة (المستبعد لا يصوت).

### المراحل المنفذة:
1. ✅ **Lobby Phase**: إنشاء الغرف والانضمام للاعبين
2. ✅ **Role Assignment**: توزيع الأدوار (8 أدوار - نظام الفرق، بترتيب أولوية محدد)
3. ✅ **Drafting Phase**: كتابة السيناريوهات (مع نظام العروض والمفاوضات 💰)
4. ✅ **Two-Phase Voting System**: تصويت على الجودة ثم التصويت على الجاني
5. ✅ **Dramatic Reveal**: عرض تشويقي تلقائي للسيناريوهات (مع تلميح 15 ثانية)
6. ✅ **Discussion Phase**: مرحلة نقاش مع عرض التلميح ثابتاً
7. ✅ **Culprit Voting**: تصويت مباشر على الجاني
8. ✅ **Results Phase**: حساب ونشر النتائج مع نظام الفرق والمكافآت
9. ✅ **Multi-Round System**: دعم جولات متعددة
10. ✅ **Live Voting Display**: عرض التصويتات الحية للمضيف
11. ✅ **Reconnection**: إعادة الاتصال التلقائية مع استعادة حالة اللعبة الكاملة

### التقنيات المستخدمة:
- **Backend**: Node.js + Express + Socket.io
- **Frontend**: React Native (Expo) - منصة موحدة (Web & Mobile)
- **AI Engine**: GitHub Models API (gpt-4o-mini)
- **Database**: JSON File System
- **اللغة**: JavaScript/JSX
- **الاتصال**: WebSocket (Socket.io)

## هيكلة المشروع (v3.0.0 — بعد إعادة الهيكلة الكاملة)
```
plot/
├── server/                              # Backend Node.js
│   ├── index.js                        # نقطة الدخول فقط (~200 سطر بعد الـ Refactor)
│   ├── state.js                        # ⭐ حالة الغرف المشتركة rooms = {}
│   ├── githubAI.js                     # محرك الذكاء الاصطناعي (GitHub Models gpt-4o-mini)
│   ├── botAI.js                        # منطق بوتات اللعبة وتوليد السيناريوهات
│   ├── roles.js                        # تعريف الأدوار والفرق وترتيب الأولوية
│   ├── game/
│   │   └── phases.js                   # ⭐ منطق مراحل اللعبة (21 دالة، 1385 سطر)
│   ├── sockets/
│   │   └── registerHandlers.js         # ⭐ معالجات أحداث Socket.IO (986 سطر)
│   ├── routes/
│   │   └── adminRoutes.js              # ⭐ لوحة تحكم المشرف (/admin, /admin/api/rooms)
│   ├── utils/
│   │   └── serverUtils.js              # ⭐ دوال مساعدة (generateRoomCode, safeEmit...)
│   ├── logic/
│   │   ├── scoring.js                  # منطق احتساب النقاط (V4)
│   │   └── offers.js                   # منطق العروض والمفاوضات (V4)
│   ├── scenarios.js                    # قاعدة بيانات السيناريوهات
│   ├── database.js                     # نظام تخزين البيانات (JSON)
│   ├── db.json                         # ملف قاعدة البيانات
│   ├── package.json
│   └── /public                         # ملفات الويب المبنية (Expo Web Build)
│
├── plot-mobile/                        # React Native (Expo) - الكود الموحد
│   ├── App.js                         # المكون الرئيسي (مصغر بعد الـ Refactor)
│   ├── app.json                       # إعدادات Expo
│   ├── package.json
│   ├── /assets                        # الأصول البصرية
│   │   ├── bg_dark_noir.png           # ⭐ خلفية الوضع الداكن
│   │   ├── bg_light_noir.png          # ⭐ خلفية الوضع الفاتح
│   │   ├── noir_desk_background.png   # خلفية المكتب
│   │   ├── texture_paper.png          # ملمس الورق
│   │   └── /roles                     # ⭐ 8 صور أدوار بجودة عالية
│   │       ├── role_culprit.png
│   │       ├── role_witness.png
│   │       ├── role_detective.png
│   │       ├── role_saboteur.png
│   │       ├── role_beneficiary.png
│   │       ├── role_minister.png
│   │       ├── role_seer.png
│   │       └── role_mastermind.png
│   └── /src
│       ├── /hooks
│       │   └── useGameSocket.js        # ⭐ هوك Socket مخصص (569 سطر)
│       ├── /store
│       │   └── useGameStore.js         # ⭐ متجر Zustand للحالة المشتركة
│       ├── /navigation
│       │   └── AppNavigator.js         # ⭐ نظام التنقل المركزي (React Navigation)
│       ├── /constants
│       │   ├── config.js               # ⭐ إعدادات الاتصال (SERVER_URL...)
│       │   └── theme.js                # ⭐ ثوابت الثيم المشتركة
│       ├── /screens
│       │   ├── /game
│       │   │   ├── DraftingScreen.js   # ⭐ شاشة الكتابة المستقلة (Classic & Blitz)
│       │   │   ├── GameScreen.js       # ⭐ شاشة اللعبة الموحدة
│       │   │   └── gameScreenStyles.js # ⭐ Styles شاشات اللعبة
│       │   ├── RoleSelectScreen.js     # اختيار الدور (+ زر دليل اللعبة)
│       │   ├── HowToPlayScreen.js      # شاشة دليل اللعبة
│       │   ├── HostScreens.js          # شاشات المضيف (Lobby)
│       │   ├── HostGameScreens.js      # شاشات المضيف داخل اللعبة
│       │   ├── PlayerScreens.js        # شاشات اللاعب (Login, Lobby, Avatar)
│       │   ├── GameScreens.js          # شاشات اللعبة للاعب
│       │   ├── VotingScreens.js        # شاشات التصويت والنتائج
│       │   ├── DiscussionScreen.js     # مرحلة النقاش
│       │   ├── TrainingScreens.js      # شاشات التدريب الفردي
│       │   └── ShowcaseScreen.js       # ⭐ شاشة عرض المكونات للمطورين
│       ├── /components
│       │   ├── ScreenWrapper.js        # ⭐ غلاف شاشة موحد (SafeArea + خلفية)
│       │   ├── InvestigationNote.js    # ⭐ بطاقة نتيجة التحقيق
│       │   ├── /avatar                 # ⭐ نظام الأفاتار الكامل
│       │   │   ├── Avatar.js           # عرض الأفاتار مع أنيميشن
│       │   │   ├── AvatarEditor.js     # شاشة تعديل الأفاتار
│       │   │   └── AvatarLayers.js     # مكتبة طبقات SVG
│       │   ├── GlobalLayout.js         # المكون الحاوي الرئيسي
│       │   ├── GlobalRTLWrapper.js     # ضمان اتجاه RTL على الويب
│       │   └── /minimal                # مكتبة مكونات Noir UI
│       │       ├── MinimalLayout.js    # تخطيط الصفحة مع roomCode badge
│       │       ├── MinimalButton.js
│       │       ├── MinimalCard.js
│       │       ├── GameHeader.js       # ⭐ رأس اللعبة مع مؤشر الجولة
│       │       ├── PlayerBadge.js      # ⭐ شارة اللاعب (أفاتار + اسم)
│       │       ├── MinimalHeader.js
│       │       ├── MinimalInput.js
│       │       ├── MinimalBadge.js
│       │       ├── MinimalTimer.js     # مؤقت دائري متحرك
│       │       ├── MinimalTypewriter.js # نص يظهر تدريجياً
│       │       ├── MinimalNotification.js # إشعارات تحل محل alert()
│       │       ├── MinimalDossier.js   # بطاقة معلومات اللاعب
│       │       ├── MinimalStamp.js     # زر ختم (بديل Submit)
│       │       ├── MinimalSpinner.js
│       │       ├── MinimalDivider.js
│       │       ├── MinimalMeter.js
│       │       └── index.js            # تصدير موحد
│       └── /styles
│           ├── theme.js               # متغيرات الألوان والتصميم
│           └── responsive.js          # متغيرات التصميم المتجاوب
│
├── start.js                           # سكريبت التشغيل
├── start_fixed.js                     # سكريبت التشغيل مع IP ثابت
├── test_game_flow.js                   # ⭐ سكريبت اختبار تدفق اللعبة
├── find_*.js / find_reveal.py         # ⭐ أدوات تشخيصية
├── package.json                       # التبعيات الرئيسية
│
└── /docs                              # التوثيق
    ├── GDD.md                         # تصميم اللعبة
    ├── CHANGELOG.md                   # سجل التغييرات
    ├── TECHNICAL_IMPLEMENTATION.md    # هذا الملف
    ├── ROADMAP.md                     # خطة العمل
    └── الهوية البصرية.md
```

> ⭐ = ملف جديد أو محدّث جوهرياً في إعادة الهيكلة (v2.5.0+)

## توحيد المنصات (Web & Mobile Unification)
تم دمج واجهات الويب والجوال في كود واحد باستخدام **React Native Web**.
- **الكود المصدري:** `plot-mobile/App.js` هو المصدر الوحيد.
- **البناء للويب:** يتم تحويل الكود إلى HTML/JS ووضعه في `server/public`.
- **التوجيه (Routing):** الخادم يدعم SPA Routing (توجيه جميع الطلبات إلى `index.html`).
- **التصميم المتجاوب (Responsive Strategy - useWindowDimensions)**:
  - **Portrait (Mobile)**: تجربة رأسية مخصصة، الملف يشغل 85% من الشاشة لكشف المكتب، إخفاء Status Bar.
  - **Landscape (Mobile/Web)**: تجربة أفقية، القوائم تتحول لشبكة (Grid) من 3 أعمدة (عرض 28% لكل عنصر).
  - **Single Component**: `GlobalLayout` هو المكون الحاوي الذي يدير الأبعاد والخلفيات والأختام لكل الشاشات.
- **الأصول (Assets)**: استخدام صور عالية الدقة مكررة (Textures) لتقليل الحمل مع الحفاظ على الجودة (Paper, Wood, Stamps).

## بروتوكول الاتصال (Socket.io Events)

### Game Initialization
- `createRoom`: Host ينشئ غرفة
- `roomCreated`: Server يرسل رمز الغرفة
- `joinRoom`: Player ينضم للغرفة
- `playerJoined`: تحديث قائمة اللاعبين
- `startGame`: Host يبدأ اللعبة

### Game Flow
- `roleAssigned`: تعيين دور وإرسال المعلومات السرية
- `gameStarted`: بدء الجولة (عرض عنوان السيناريو)
- `startDrafting`: بدء مرحلة الكتابة (90 ثانية، حد 500 حرف) + **قائمة waitingFor** ⭐
- `timerUpdate`: تحديث العداد التنازلي كل ثانية
- `playerSubmitted`: إشعار المضيف بتسليم لاعب (تحديث فوري للحالة) ⭐
- `submitAnswer`: Player يرسل سيناريوه

### Two-Phase Voting System
- `qualityVotingStarted`: بدء المرحلة الأولى - التصويت على الجودة (بدون أسماء)
- `submitQualityVote`: Player يصوّت على أفضل سيناريو
- `voteReceived`: إشعار فوري للمضيف بأن لاعب صوّت (Live Voting)
- `dramaticRevealStarted`: بدء العرض التشويقي التلقائي ⭐
- `revealStep`: خطوات الكشف التدريجي - يدعم الآن جميع الأنواع: ⭐
  - `SCENARIO`: عرض نص السيناريو مع موقعه (X من Y)
  - `VOTERS`: عرض قائمة المصوتين وعدد الأصوات
  - `AUTHOR`: كشف اسم الكاتب
  - `NO_VOTES`: عرض السيناريوهات التي لم تحصل على أصوات
- `culpritVotingStarted`: بدء المرحلة الثانية - التصويت على الجاني (مع الأسماء)
- `submitCulpritVote`: Player يصوّت على الجاني
- `roundResults`: عرض نتائج الجولة (يتضمن `round`, `totalRounds`, `isLastRound` من الخادم)
- `gameEnded`: انتهاء اللعبة الكاملة — يُعيد جميع اللاعبين للشاشة الرئيسية

### Special Abilities
- `useAbility`: طلب استخدام قدرة خاصة
- `abilityResult`: نتيجة القدرة الخاصة

### Other
- `timerUpdate`: تحديث العداد التنازلي
- `startTutorial`: بدء وضع التدريب

## الأدوار والفرق (V4 Team-Based System)

### فريق الجريمة (Crime Team) - 🔴
| الدور | المعلومات | الهدف | القدرة |
|------|---------|------|--------|
| الجاني (CULPRIT) | القصة الكاملة | كتابة سيناريو مقنع دون انكشاف | KNOWS_STORY |
| المخرب (SABOTEUR) | الكلمة الدخيلة | التشويش — قلب نتيجة فحص المحقق على الهدف (كلا الوضعَين Classic + Blitz) | SABOTAGE (INVESTIGATION_FLIP) |
| المستفيد (BENEFICIARY) | +1000 نقاط بداية | إرسال رشاوى لتعطيل قدرات الآخرين | BONUS_POINTS |
| العقل المدبر (MASTERMIND) | أسماء فريق الجريمة كاملاً | الوساطة في العروض مقابل عمولة 25% | KNOWS_TEAM |

### فريق العدالة (Justice Team) - 🔵
| الدور | المعلومات | الهدف | القدرة |
|------|---------|------|--------|
| الشاهد (WITNESS) | كلمات مفتاحية لثوانٍ | كتابة سيناريو قريب من الحقيقة | FLASH_MEMORY |
| المحقق (DETECTIVE) | عنوان القصة | كشف فريق أي لاعب عبر التحقيق | INVESTIGATE |
| الوزير (MINISTER) | هوية المحقق والمستفيد + 1000 نقطة | توجيه المحقق وإرسال عروض | KNOWS_KEY_ROLES |
| العرّاف (SEER) | لا شيء (لكن يرسل القصة الحقيقية تلقائياً) | ضمان وجود نسخة صحيحة | REVELATION |

## نظام النقاط (V4 Scoring System)

### Quality Voting (المرحلة الأولى)
- **+200 نقطة** لكل صوت يحصل عليه السيناريو
- **الشاهد**: +50 × عدد الكلمات المستخدمة × عدد الأصوات (إذا حصل على أعلى تصويت)
- **العرّاف**: +500 إذا استخدم الوحي وحصل على أعلى تصويت / +200 لكل صوت إذا كتب يدوياً

### Culprit Voting (المرحلة الثانية) — فوز الفريق
- **+2000 نقطة** لكل عضو في الفريق الفائز (Justice أو Crime على حد سواء)
- **الجاني**: +500 نقطة إضافية إذا نجا (فوز الجريمة)
- **المحقق**: +1000 نقطة إذا كشف الجاني بنجاح (بدون تخريب)
- **المخرب**: +1000 نقطة إذا استهدف نفس اللاعب الذي فحصه المحقق

### نظام العروض (Offers)
- **المستفيد/الوزير**: +750 نقطة إذا قبل هدفهما العرض
- **العقل المدبر**: عمولة فورية 25% من قيمة العرض + 500 إذا تم قبوله

### ملاحظة
- لا توجد عقوبات نقطية للخسارة (فقط لا يحصلون على مكافأة الفوز)

## الميزات المتقدمة

### وضع التدريب (Tutorial Mode) & الروبوتات
- **Training Flow:**
    1. يختار اللاعب "تدريب فردي" ويحدد دوره المفضل
    2. يملأ النظام الغرفة بـ7 بوتات ذكية تلقائياً
- **Manual Bot Auto-fill:**
    - زر "🤖 تعبئة بوتات" للمضيف لملء الغرفة بروبوتات
- **Bot Avatar System (v2.5.0):** 🆕
    - دالة `generateRandomBotAvatar` في `server/sockets/registerHandlers.js` تولد كائن أفاتار عشوائي.
    - الخصائص الملحقة: `base`, `eyes`, `hair`, `hat`, `mouth`, `accessory`, `color`.
    - يتم استدعاء التوليد عند إضافة البوت للغرفة لضمان تميز بصري لكل خصم اصطناعي.
- **Bot AI:**
    - توليد سيناريوهات **مختصرة جداً (جملة أو جملتين)** بواسطة GitHub Models API
    - **خالي من الإيموجي (No Emojis)** لضمان الواقعية والجدية
    - تصويت ذكي على الجودة (تحليل الطول، التنوع، الترابط)
    - تصويت استراتيجي على الجاني بناءً على الدور والفريق

### لوحة تحكم المشرف (Admin Dashboard) 🆕
- **إصلاح العرض الديناميكي**: تم تصحيح ملف `server/routes/adminRoutes.js` بإزالة علامات الهروب (`\\`) من متغيرات القالب (`${...}`) في سلسلة HTML.
- **البيانات اللحظية**: تعرض اللوحة الآن إحصائيات دقيقة لعدد الغرف النشطة، اللاعبين البشر، والبوتات عبر استخدام `roomList.reduce` و `filter`.
- **التوجيه الإداري**: تتوفر اللوحة عبر المسار `/admin` للمراقبة الفورية لحالة الخادم.

### قدرات UI/UX المتقدمة 🎨
- **نظام الثيمات الثنائي**: دعم كامل للتبديل بين `Light Mode` و `Dark Mode` يدوياً.
- **شارات اللاعبين الديناميكية**: انتقال من عرض الأسماء النصية إلى استخدام `PlayerBadge` (الأفاتار) في جميع المراحل (Lobby, Voting, Discussion).
- **تحسين استجابة الصفحات**: تعديل هوامش وحواشي شاشات التدريب لضمان ظهور كامل عناصر التحكم على الشاشات الصغيرة.

### القدرات الخاصة
- **المخترق (INFILTRATOR)**: رؤية نص الجاني مشوشاً (30% من الكلمات)
- **المحقق (CHIEF_DETECTIVE)**: مكافأة +500 إذا صوّت للجاني الصحيح

### نظام التصويت ثنائي المراحل (Two-Phase Voting)

#### المرحلة الأولى: Quality Voting
1. عرض السيناريوهات **بدون أسماء** الكتّاب
2. كل لاعب يصوّت لأفضل سيناريو برأيه
3. البوتات تصوّت بناءً على تحليل الجودة

#### العرض الدرامي (Dramatic Reveal)
- عرض تلقائي تشويقي للسيناريوهات حسب الأصوات
- لكل سيناريو:
  1. (3 ثواني) عرض السيناريو
  2. (2.5 ثانية) كشف من صوّت له
  3. (2 ثانية) كشف الكاتب
- العرض متراكم: كل المعلومات تبقى ظاهرة معاً
- السيناريوهات بدون أصوات تُعرض جميعاً في النهاية

#### المرحلة الثانية: Culprit Voting
1. عرض السيناريوهات **مع أسماء** الكتّاب
2. كل لاعب يصوّت على من يعتقد أنه الجاني
3. الأغلبية تحدد الفريق الفائز

### التصويتات الحية للمضيف (Live Voting Display) 🆕
- المضيف يرى لحظياً من صوّت ومن لم يصوّت
- عرض علامات صح (✅) للذين صوّتوا
- عرض ساعة انتظار (⏳) للذين لم يصوّتوا
- شريط تقدم: `X/Y` votes
- **خصوصية**: لا يعرض ماذا اختار اللاعب، فقط أنه صوّت

### حد الأحرف (Character Limit) 🆕
- **500 حرف** كحد أقصى للسيناريو
- عداد الأحرف يتحول للأحمر بعد 450 حرف (تحذير)
- نص عربي: "X/500 حرف"

### قاعدة البيانات (JSON)
- `db.json`: يخزن بيانات اللاعبين والإحصائيات
- يتم تحديث الإحصائيات تلقائياً بعد كل لعبة

## ملفات التوثيق
- `GDD.md`: وثيقة تصميم اللعبة الكاملة
- `userflow.md`: تدفق المستخدم والمخططات
- `TECHNICAL_IMPLEMENTATION.md`: التوثيق التقني
- `الهوية البصرية.md`: دليل الألوان والتصميم
- `ROADMAP.md`: خطة العمل للإصدارات القادمة

## ملاحظات تقنية
- المؤقت على جانب الخادم لضمان التزامن
- الحالة تخزن في الذاكرة (In-Memory)
- Socket.io يدعم الاتصال اللحظي والموثوق
- RTL/Arabic support في جميع الواجهات
- **Host/Player Separation**: شاشات منفصلة للمضيف واللاعبين
- **Real-time Updates**: التصويتات الحية تُرسل فوراً للمضيف
- **Cumulative Reveal**: العرض الدرامي يُبقي كل المعلومات ظاهرة

## التحديثات الأخيرة (Checkpoint 004)

### 🆕 حد الأحرف: 140 → 500
- السماح بسيناريوهات أطول وأكثر تفصيلاً
- عداد محسّن مع تحذير أحمر بعد 450 حرف
- ينطبق على اللاعبين والبوتات

### 🆕 التصويتات الحية للمضيف
- عرض فوري لمن صوّت ومن لم يصوّت
- UI بسيط: ✅ (صوّت) / ⏳ (لم يصوّت)
- خصوصية: لا يعرض تفاصيل التصويت
- يعمل في كلا المرحلتين (Quality & Culprit)

### التحسينات السابقة (Checkpoint 003)
- نظام التصويت ثنائي المراحل
- العرض الدرامي التلقائي
- فصل شاشات المضيف عن اللاعبين
- العرض المتراكم (كل المعلومات معاً)

## ملفات التوثيق
- `GDD.md`: وثيقة تصميم اللعبة الكاملة
- `userflow.md`: تدفق المستخدم والمخططات
- `TECHNICAL_IMPLEMENTATION.md`: التوثيق التقني (هذا الملف)
- `الهوية البصرية.md`: دليل الألوان والتصميم
- `ROADMAP.md`: خطة العمل للإصدارات القادمة
- `CONTRIBUTING.md`: دليل المساهمة
- `README.md`: دليل الاستخدام السريع
- **Checkpoints**: سجل تفصيلي لكل مرحلة تطوير
  - `004-character-limit-live-voting.md`: حد الأحرف + التصويتات الحية
  - `003-two-phase-voting-with-dramatic.md`: نظام التصويت المزدوج
  - `002-complete-system-overhaul.md`: النظام الكامل + AI
  - `001-team-based-gameplay-system-imp.md`: نظام الفرق


---

## التحديثات الأخيرة - الإصدار 2.1.1 (2026-02-05)

### 🎨 هيكلية التصميم المتجاوب (Dynamic Responsive Architecture)

تم الانتقال من التصميم الثابت (Static Styles) إلى التصميم الديناميكي الكامل لدعم الويب والموبايل بكفاءة عالية.

#### 1. الخطاف المركزي `useResponsiveLayout`
تم إنشاء Hook مخصص لإدارة منطق التجاوب في مكان واحد، مما يلغي تكرار التحقق من المنصة (Platform Check) مئات المرات.

\\\javascript
// src/hooks/useResponsiveLayout.js
export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  // التحقق الديناميكي من وضع سطح المكتب
  const isDesktop = Platform.OS === 'web' && width >= 768;
  // ...
  return { isDesktop, isMobile, ... };
};
\\\

#### 2. الأنماط الديناميكية (Dynamic Styling Pattern)
تم إعادة هيكلة جميع الشاشات لتستخدم `useMemo` لتحديث الأنماط فقط عند تغير الأبعاد، مما يحسن الأداء ويضمن استجابة فورية.

\\\javascript
// النمط القديم (Static)
const styles = StyleSheet.create({ ... });

// النمط الجديد (Dynamic)
const GameScreen = () => {
  const { isDesktop } = useResponsiveLayout();
  // يتم إعادة حساب الستايل فقط عند تغير حالة سطح المكتب
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);
  // ...
};

const getStyles = (isDesktop) => StyleSheet.create({
  container: {
    padding: isDesktop ? moderateScale(3) : spacing.l, // قيم متغيرة
    maxWidth: isDesktop ? '90%' : 800,
  }
});
\\\

#### 3. تحسينات المكونات (UI Components Overhaul)
تم تحديث المكونات الأساسية (`Button`, `Card`, `TextInput`) لتدعم خاصية التكيف الذاتي:
- **Button**: تقليل الارتفاع والحواشي (Padding) على الويب ليكون مناسباً للماوس، مع إبقائه كبيراً للمس على الموبايل.
- **Card**: تقليل الهوامش (Margins) في وضع الـ Landscape لاستغلال المساحة العرضية.

---

## التحديثات الأخيرة - الإصدار 2.1.0 (2026-02-03)

### 🔧 إصلاحات حرجة

#### 1. إصلاح حالة اللاعبين اللحظية في شاشة المضيف

**المشكلة**:
- شاشة مراقبة الكتابة للمضيف كانت تعرض جميع اللاعبين كـ "تم التسليم ✅" فوراً
- السبب: الخادم لا يُرسل قائمة `waitingFor` الأولية

**الحل التقني**:
\\\javascript
// server/index.js - السطر 110
const waitingFor = room.players.map(p => p.id);
io.to(roomCode).emit('startDrafting', { 
  duration: 90,
  waitingFor  // ✨ جديد
});

// plot-mobile/App.js - السطر 217
setWaitingFor(data.waitingFor || players.map(p => p.id));
\\\

**النتيجة**:
- ⏳ جميع اللاعبين يظهرون بحالة "يكتب..." في البداية
- ✅ التحديث الفوري عند تسليم كل لاعب
- 📊 عرض دقيق لتقدم اللاعبين

#### 2. إصلاح العرض التشويقي (Dramatic Reveal)

**المشكلة**:
- العرض التشويقي لا يظهر بعد التصويت على الجودة
- الأسباب:
  1. عدم تطابق أسماء: `data.step` (خادم) vs `data.type` (تطبيق)
  2. عدم تطابق الحقول: `answer` vs `text`, `authorName` vs `author`
  3. عدم دعم `NO_VOTES` step

**الحل التقني**:
\\\javascript
// plot-mobile/App.js - معالج revealStep (السطر 258-299)
const step = data.step || data.type; // دعم كلا الاسمين ✨

if (step === 'SCENARIO' || step === 'scenario') {
  setCurrentReveal({ 
    text: data.data.answer || data.data.text,  // دعم كلا الحقلين ✨
    position: data.data.position,
    total: data.data.total
  });
} else if (step === 'VOTERS' || step === 'votes') {
  setCurrentReveal(prev => ({ 
    ...prev, 
    voters: data.data.voters,  // أسماء المصوتين ✨
    voteCount: data.data.voteCount
  }));
} else if (step === 'AUTHOR' || step === 'author') {
  setCurrentReveal(prev => {
    const complete = { 
      ...prev, 
      author: data.data.authorName || data.data.author  // دعم كلا الحقلين ✨
    };
    setRevealedScenarios(prev => [...prev, complete]);
    return complete;
  });
} else if (step === 'NO_VOTES') {
  // ✨ دعم جديد للسيناريوهات بدون أصوات
  const noVoteScenarios = data.data.scenarios || [];
  setRevealedScenarios(prev => [...prev, ...noVoteScenarios.map(s => ({
    text: s.answer,
    author: s.authorName,
    voteCount: 0
  }))]);
}
\\\

**تحسينات واجهة HostDramaticRevealScreen**:
- عرض موقع السيناريو: "1 من 4"
- عرض قائمة أسماء المصوتين
- عرض عدد الأصوات بدقة
- دعم السيناريوهات بدون أصوات

**النتيجة**:
- �� العرض التشويقي يظهر تلقائياً
- 📊 ترتيب صحيح للسيناريوهات حسب الأصوات
- 👥 عرض واضح لمن صوّت لكل سيناريو
- ⏭️ انتقال سلس للمرحلة التالية

### 📝 الملفات المُعدّلة

#### الخادم (Backend):
- **server/index.js** (السطور 101-115)
  - إضافة حساب وإرسال `waitingFor` في `startDraftingPhase()`

#### التطبيق (Frontend):
- **plot-mobile/App.js**
  - السطر 217: استقبال وتهيئة `waitingFor`
  - السطور 258-299: معالج `revealStep` المحسّن
  
- **plot-mobile/src/screens/HostGameScreens.js**
  - السطور 56-185: `HostDraftingScreen` - عرض محسّن لحالة اللاعبين
  - السطور 190-280: `HostDramaticRevealScreen` - عرض محسّن للمصوتين والمواقع
  - إضافة styles: `positionText`, `votersText`, `voteCount`

### 🎮 التدفق الصحيح للعبة

\\\
1. 📝 Drafting (الكتابة)
   ├─ عرض لحظي لحالة اللاعبين ✅
   ├─ عداد تنازلي ملون
   └─ شريط تقدم دقيق
   ↓
2. 🗳️ Quality Voting (التصويت على الجودة)
   └─ سيناريوهات بدون أسماء
   ↓
3. 🎬 Dramatic Reveal (العرض التشويقي) ✅
   ├─ عرض تدريجي للسيناريوهات
   ├─ إظهار المصوتين لكل سيناريو
   ├─ كشف أسماء الكُتّاب
   └─ عرض السيناريوهات بدون أصوات
   ↓
4. 🔍 Culprit Voting (التصويت على الجاني)
   └─ سيناريوهات مع أسماء
   ↓
5. 🏆 Results (النتائج)
\\\

### 🧪 الاختبارات الموصى بها

- [x] مرحلة الكتابة: حالة اللاعبين اللحظية
- [x] العرض التشويقي: يظهر بعد التصويت على الجودة
- [x] العرض التشويقي: يعرض المصوتين والمواقع
- [x] العرض التشويقي: ينتقل تلقائياً للمرحلة التالية
- [ ] اختبار مع 8 لاعبين حقيقيين
- [ ] اختبار إعادة الاتصال أثناء اللعب

### 📚 للمطورين: Socket Events المُحدّثة

#### startDrafting Event
\\\javascript
// من الخادم إلى الغرفة
{
  duration: 90,
  waitingFor: ['player1_id', 'player2_id', ...]  // ✨ جديد
}
\\\

#### revealStep Event Variations
\\\javascript
// SCENARIO step
{
  step: 'SCENARIO',
  data: {
    index: 0,
    answer: "نص السيناريو",
    position: 1,    // ✨ جديد
    total: 4        // ✨ جديد
  }
}

// VOTERS step
{
  step: 'VOTERS',
  data: {
    index: 0,
    voters: ["محمد", "أحمد", "سارة"],  // ✨ جديد
    voteCount: 3
  }
}

// AUTHOR step
{
  step: 'AUTHOR',
  data: {
    index: 0,
    authorName: "علي"
  }
}

// NO_VOTES step ✨ جديد
{
  step: 'NO_VOTES',
  data: {
    scenarios: [
      { index: 3, authorName: "فاطمة", answer: "..." },
      { index: 5, authorName: "خالد", answer: "..." }
    ]
  }
}
\\\

### 🐛 المشاكل المعروفة

لا توجد مشاكل معروفة حالياً. جميع الميزات الأساسية تعمل بشكل كامل.

### 🚀 الإصدارات القادمة

- [ ] دعم إعادة الاتصال مع الحفاظ على حالة اللعبة
- [ ] مؤثرات صوتية للعرض التشويقي
- [ ] تحسين الأداء مع عدد كبير من اللاعبين
- [ ] إحصائيات مفصلة للاعبين
- [ ] نظام الإنجازات (Achievements)

---

**آخر تحديث**: 2026-02-03  
**الإصدار**: 2.1.0  
**الحالة**: ✅ مستقر - جاهز للعب
