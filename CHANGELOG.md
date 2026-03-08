# CHANGELOG

## [3.4.0] - 2026-03-08

### Structured Logging + Rate Limiting + Sentry + Avatar + Sound + Reconnect UI 🔧

#### 1. Structured Logging (winston) في جميع ملفات الخادم
- استبدال `console.log/error/warn` بـ `logger.info/error/warn` في:
  `phases.js`, `registerHandlers.js`, `database.js`, `botAI.js`, `githubAI.js`, `deepseekAI.js`
- جميع السجلات مكتوبة في `logs/combined.log` و `logs/error.log` (تدوير تلقائي)

#### 2. Socket.IO Rate Limiting
- Middleware على `io.use(...)` يتتبع اتصالات كل IP في نافذة دقيقة واحدة
- رفض الاتصال عند تجاوز 20 اتصال/دقيقة (قابل للتهيئة عبر `SOCKET_RATE_LIMIT`)
- تنظيف تلقائي للخريطة كل 5 دقائق لمنع تسرب الذاكرة

#### 3. Sentry Error Tracking
- تكامل `@sentry/node` مع `SENTRY_DSN` في `.env`
- تسجيل `uncaughtException` و`unhandledRejection` تلقائياً في Sentry
- اختياري: يعمل فقط إذا تم تعيين `SENTRY_DSN`

#### 4. تكامل الأفاتار الكامل
- إرسال `avatar: myAvatar` في جميع حالات الانضمام وإعادة الاتصال
- شامل: الانضمام الأول + التدريب + إعادة الاتصال التلقائية + اليدوية

#### 5. مؤثرات صوتية (expo-av)
- `soundManager.js` — مدير مركزي للأصوات مع دعم للتهيئة المسبقة
- تشغيل أصوات عند: بداية اللعبة، التصويتين (الجودة والجاني)، الكشف الدرامي، نتائج الجولة، نهاية اللعبة
- النظام يتجاهل بهدوء عند غياب ملفات الصوت أو عدم الدعم

#### 6. بانر إعادة الاتصال
- `ReconnectBanner` — بانر أحمر أعلى الشاشة يظهر فور انقطاع الاتصال مع مؤشر تحميل
- يختفي تلقائياً عند استعادة الاتصال (`reconnecting = false` في store)

---

## [3.3.1] - 2026-03-08

### عرض اسم القضية في هيدر اللاعب 📁

- **CaseHeader (player mode)**: اسم القضية `📁 [الاسم]` كـ subtitle دائم تحت اسم الدور
- **CaseHeader modal**: حذف قسم "القضية" (أصبح في الهيدر الرئيسي)
- **DraftingScreen**: لافتة "ملف القضية" أصبحت ديناميكية `📁 [اسم القضية]` بلون ذهبي
- **ملف الدور — المحقق**: تحسين عرض النتيجة (⏳ قيد المعالجة / ✓ النتيجة الحقيقية / ⚠️ ملفقة)

---



### إصلاحات منطق الجولات + ملف الدور + لوحة النتائج النهائية 🏆

#### 1. إصلاحات منطق التصويت (CONTINUE rounds)
- **BUG-A**: `roundEnded` تحجب `endRound` في جولات الاستمرار — إضافة `room.roundEnded = false` + `room.votingProcessed = false` في `nextRound`
- **BUG-B**: `votingProcessed` تحجب إعادة التصويت عند التعادل — إعادة تعيينها في فرع TIE
- **BUG-C1**: البوت المقصى يصوت في الجولات التالية — إضافة `!p.eliminated` في حلقة التصويت
- **BUG-C2**: `voteCount` يشمل أصوات البوت المقصى — فلترة الناخبين للغير-مقصيين فقط
- **BUG-D**: اللاعب المقصى يظهر كمستبعد مرتين — حراسة `eliminated` في `handlePlayerEliminated`
- **BUG-E**: اللاعب الحي يظهر كمستبعد في التصويت الثاني — إصلاح guard الاستبعاد

#### 2. ملف الدور (CaseHeader.js) — إعادة هيكلة كاملة
- **إزالة** قسم "القدرة" من ملف الدور
- **إضافة** اسم القضية (📁 القضية) في أعلى الملف
- **قسم مخصص لكل دور:**
  - **الجاني**: كما هو (info/secretHint)
  - **المخرب**: يعرض اسم الهدف المُضلَّل بعد استخدام القدرة
  - **العقل المدبر**: يعرض أعضاء فريق الجريمة مع أدوارهم
  - **المستفيد**: يعرض قائمة العروض المُرسلة مع قيمها
  - **الشاهد**: يعرض الكلمات المفتاحية
  - **المحقق**: يعرض نتيجة التحقيق (الهدف + النتيجة + تحذير إن كانت ملفقة)
  - **العراف / الوزير**: كما هو مع `specialInfo.detective` + `specialInfo.beneficiary`

#### 3. لوحة النتائج النهائية (EndScreen)
- **لوحة ترتيب كاملة** بعد نهاية اللعبة (3 جولات) تعرض جميع اللاعبين من الأعلى نقاطاً للأقل
- ميداليات ذهبية/فضية/برونزية للمراكز الثلاثة الأولى
- يعرض اسم اللاعب + دوره (بالعربي) + نقاطه
- **إصلاح زر العودة للرئيسية**: يستدعي `navigation.navigate(ROUTES.ROLE_SELECT)` الآن

#### 4. تحسينات الخادم (server/game/phases.js)
- إضافة `roleName` (الاسم العربي) في `finalResults` عند `gameEnded`
- إضافة `targetName` في `abilityResult` لحدث SABOTAGE

#### 5. تحسينات المتجر (useGameStore.js)
- إضافة حقل `finalResults: null` — **لا يُمسح** عند `resetGame()` ليبقى متاحاً لـ EndScreen
- إضافة `setFinalResults` action

#### 6. إصلاح useGameSocket.js
- `gameEnded` يحفظ النتائج في `finalResults` **قبل** استدعاء `resetGame()`
- إضافة تتبع العروض في DraftingScreen: العروض المُرسلة تُحفظ في `roleData.offersSent`

#### 7. وضع التدريب (TrainingScreens.js)
- إصلاح عرض الدور الصحيح (الوزير، المستفيد، وغيرهم) بدلاً من الجاني دائماً
- إصلاح toast الإشعار ليعرض اسم الدور الصحيح

---

## [3.2.0] - 2026-03-04

### نظام التصميم V2 "Classified Dossier" — واجهة ثنائية المسار 🗂️🌙

#### نظرة عامة:
تصميم V2 هو نظام واجهة مستخدم كامل موازٍ لـ V1 يعمل في ملفات منفصلة تحت `plot-mobile/src/design-v2/`. يمكن التبديل بين V1 و V2 من متجر Zustand (`designVersion`). الثيم الافتراضي الآن هو **V2**.

#### 1. هيكل الملفات الجديد (`design-v2/`)
```
tokens/
  index.js           — ألوان light/dark، spacing، typography، useLayout() hook
components/
  DossierLayout.js   — غلاف التخطيط الثلاثي (topZone / centerZone / bottomZone)
  CaseHeader.js      — محتوى topZone مع modal ملف الدور + أزرار ثيم وريفرش
  DossierCard.js     — بطاقة بنمط ملف المحكمة
  StampButton.js     — زر بأسلوب الختم
  FileBadge.js       — شارة ملف
  SecretInput.js     — حقل إدخال سري
  ClassifiedBanner.js— شريط "سري للغاية"
  index.js           — exports موحدة
screens/
  RoleSelectScreen.js    — الشاشة الرئيسية (مضيف / لاعب / تدريب / دليل)
  HowToPlayScreen.js     — دليل اللعبة
  HostScreens.js         — إعداد الغرفة + اللوبي (محدد النمط segmented toggle)
  HostGameScreens.js     — 5 شاشات مرحلة اللعب للهوست
  PlayerScreens.js       — تسجيل الدخول + لوبي اللاعب
  GameScreen.js          — كشف الدور
  DraftingScreen.js      — مرحلة الكتابة (Classic + Blitz)
  DiscussionScreen.js    — مرحلة النقاش
  VotingScreens.js       — 6 شاشات تصويت
  TrainingScreens.js     — شاشات التدريب
navigation/
  AppNavigatorV2.js      — Navigator كامل لـ V2
```

#### 2. مبادئ التصميم
- **ثلاث مناطق ثابتة**: `topZone` (الشريط العلوي) → `centerZone` (منطقة اللعب) → `bottomZone` (الأزرار)
- **لا تمرير (No-scroll)**: جميع المعلومات تظهر في الشاشة مباشرة دون الحاجة للتمرير
- **ثيمان أساسيان**: Light (ورق كرافت #E8DDB5) + Dark (نوار داكن #080D18)
- **استجابة كاملة**: جوال عمودي/أفقي + ويب ديسكتوب (max-width: 900px للـ desktop فقط)
- **RTL-first**: تصميم عربي أصيل بمحاذاة يمين-لشمال

#### 3. ميزات CaseHeader (topZone)
- **وضع host**: كود الغرفة + المرحلة الحالية + رقم الجولة
- **وضع player**: الدور + إيموجي + رقم اللاعب — النقر يفتح **modal ملف الدور** الكامل
- **modal ملف الدور**: يعرض اسم القضية + الوصف + الهدف + معلومة سرية مخصصة لكل دور + تلميح سري
- **زر الثيم**: ☀️/🌙 يبدل بين light/dark (يظهر دائماً)
- **زر الريفرش**: ↺ على الويب `window.location.reload()`، على النيتف navigate إلى RoleSelect

#### 4. إصلاحات هذا الإصدار
- **`contentMaxW`**: إزالة قيد الـ 680px على الأجهزة بعرض ≥ 600px — الجوال يأخذ 100% دائماً
- **`CaseHeader`**: إصلاح أسماء حقول roleData: `roleDescription` → `description`، `abilityDescription` → `ability`؛ إضافة `goal`، `team`، `secretHint`، `abilityResult` للـ modal
- **`DraftingScreen`**: `scenarioBlock` يأخذ `maxHeight: 110` فقط — الباقي لمنطقة الكتابة
- **`start_fixed.js`**: عند تعارض المنفذ → قتل العملية بـ `netstat + taskkill` بدلاً من الانتقال للمنفذ التالي؛ إصلاح Ctrl+C داخل readline
- **V2 الافتراضي**: `designVersion: 'v2'` في `useGameStore.js`

#### الملفات المُعدّلة أو المضافة 📝:
| الملف | التعديل |
|-------|---------|
| `plot-mobile/src/design-v2/**` | **جديد** — نظام تصميم V2 كامل (19+ ملف) |
| `plot-mobile/src/design-v2/tokens/index.js` | إصلاح `contentMaxW` — إزالة قيد tablet |
| `plot-mobile/src/design-v2/components/CaseHeader.js` | إصلاح حقول roleData + زر ثيم وريفرش |
| `plot-mobile/src/design-v2/screens/DraftingScreen.js` | نسبة مساحة السيناريو مقابل الكتابة |
| `plot-mobile/App.js` | دعم التبديل بين V1 و V2 |
| `plot-mobile/src/store/useGameStore.js` | `designVersion: 'v2'` + `setDesignVersion()` + `pendingAbilityResult` |
| `plot-mobile/src/screens/RoleSelectScreen.js` | زر "🆕 تصميم V2" |
| `start_fixed.js` | قتل المنفذ المشغول + إصلاح Ctrl+C |

---

## [2.9.0] - 2026-03-02

### ميزات الهوية، وضع Blitz، التعادل في التصويت، وكود الغرفة 🔍⚖️

#### كود الغرفة دائماً ظاهر على شاشات الهوست:
- **`GameHeader.js`**: بدلاً من إعادة `null` عند غياب `roleData`، يعرض الآن header مبسط يُظهر كود الغرفة وزر تغيير الثيم لجميع شاشات الهوست.

#### نتيجة القدرة مضافة لهوية اللاعب:
- **`GameHeader.js`**: نقطة ذهبية صغيرة (🟡) تظهر فوق أيقونة الدور عند توفر نتيجة قدرة.
- عند النقر على أيقونة الدور → modal الدور يعرض قسم **"🔍 نتيجة قدرتك"** مع الهدف والنتيجة.
- `roleData.abilityResult` كانت تُحفظ بالفعل في `useGameSocket.js`؛ الآن تُعرض بشكل مستدام.

#### تلوين الكلمات المملوءة في وضع Blitz:
- **`server/game/phases.js`**: يضيف `template` في `revealStep SCENARIO` emit (وضع Blitz فقط).
- **`useGameSocket.js`**: يخزن `template` في `currentReveal`.
- **`ScenarioRevealCard.js`**: دالة `getHighlightedParts()` تكتشف الكلمات المملوءة وتلوّنها بلون ذهبي مع خط سفلي.

#### إشعار التعادل في التصويت على شاشة الهوست:
- **`useGameStore.js`**: أضاف `voteTieInfo`, `setVoteTieInfo`، وإعادة تعيينها في `clearRoundState`.
- **`useGameSocket.js`**: استبدل `Alert.alert` في حدث `voteTie` بـ `setVoteTieInfo(data)`.
- **`HostGameScreens.js`**: بانر برتقالي واضح في `HostVotingScreen` يعرض أسماء المتعادلين.

#### إصلاح خطأ ReferenceError:
- **`GameHeader.js`**: نقل تعريف `toggleTheme` قبل الـ early returns لتفادي "Cannot access before initialization" في الـ bundle.

#### الملفات المُعدّلة 📝:
| الملف | التعديل |
|-------|---------|
| `plot-mobile/src/components/minimal/GameHeader.js` | كود الغرفة للهوست + مؤشر قدرة + modal محسّن + إصلاح ReferenceError |
| `plot-mobile/src/components/ScenarioRevealCard.js` | دعم `template` لتلوين الكلمات المملوءة |
| `plot-mobile/src/store/useGameStore.js` | إضافة `voteTieInfo` |
| `plot-mobile/src/hooks/useGameSocket.js` | خزن `template` في `currentReveal` + `voteTieInfo` بدلاً من Alert |
| `plot-mobile/src/screens/HostGameScreens.js` | بانر التعادل + `template` في ScenarioRevealCard |
| `plot-mobile/src/screens/VotingScreens.js` | `template` في ScenarioRevealCard |
| `server/game/phases.js` | إرسال `template` مع `revealStep SCENARIO` في وضع Blitz |

---

## [2.8.0] - 2026-03-01

### توحيد التنبيهات، بطاقة ScenarioRevealCard، إصلاح نتيجة المحقق 🎭🔍

#### توحيد نظام التنبيهات:
- **`useGameSocket.js`**: حذف `Alert.alert()` من حدث `abilityResult`، استبداله بـ `setPendingAbilityResult`.
- **حارس `isPending`**: تجاهل النتائج المعلّقة (placeholder) تماماً — النتيجة الحقيقية تأتي في بداية النقاش.
- **`abilityResultSeen` flag**: التنبيه يظهر مرة واحدة فقط في الجولة؛ لا يتكرر عند العودة للنقاش.

#### مكوّن `ScenarioRevealCard` الجديد:
- Author Badge (medium) يتداخل مع الحافة العلوية بـ `marginBottom: -18`.
- Voter Badges (small) يتداخل مع الحافة السفلية بـ `marginTop: -14`.
- تدفق طبيعي (لا `position: absolute`) يضمن عدم تغطية النص مهما كان عدد المصوتين.

#### توسيع `InvestigationNote.js`:
- دعم 4 أنواع قدرات: `INVESTIGATE`, `SABOTAGE`, `REVELATION`, `FLASH_MEMORY`.
- دالة `getConfig()` تُرجع header/stamp/body مناسبة لكل نوع.

#### إصلاح نتيجة التحقيق:
- الخادم يُرسل حدثَي `abilityResult`: (1) placeholder أثناء الكتابة `isPending=true`، (2) النتيجة الحقيقية عند بدء النقاش.
- الإصلاح: `if (data.isPending) return;` يتجاهل الـ placeholder تماماً.

---

## [2.7.0] - 2026-03-01

### أفاتار البوتات، إصلاحات لوحة المشرف، تحسينات UI/UX (Bot Avatars, Admin Fixes, UI Polish) 🤖🎨


#### نظام أفاتار البوتات (Bot Avatar System):
- **مكون `Avatar.js`** (145 سطر): مكون React Native يعرض أفاتاراً قابلة للتخصيص مع دعم الأنيميشن عبر `Animated.Value`.
- **مكون `AvatarEditor.js`** (191 سطر): شاشة تعديل الأفاتار تتيح للاعب اختيار الطبقات (قاعدة، شعر، قبعة، عيون، فم، إكسسوار).
- **مكون `AvatarLayers.js`** (318 سطر): مكتبة طبقات SVG الكاملة لرسم الأفاتار، تحتوي على مجموعات متعددة لكل خاصية بصرية.
- **توليد أفاتار عشوائي للبوتات**: الدالة `generateRandomBotAvatar` في `server/sockets/registerHandlers.js` تُضاف عند إضافة البوت للغرفة.
- **تحديث `PlayerBadge.js`**: يعرض الآن الأفاتار بجانب الاسم بدلاً من الأحرف الأولى فقط.

#### إصلاح لوحة تحكم المشرف (Admin Dashboard Fixes):
- **إصلاح عرض المتغيرات الديناميكية**: إزالة علامات الهروب (`\\`) من `${...}` في قالب HTML بـ `adminRoutes.js` لإظهار البيانات الفعلية.
- **إحصائيات دقيقة**: استخدام `roomList.reduce` و `filter` لحساب عدد الغرف النشطة، اللاعبين البشر، والبوتات بدقة.

#### تحسين شاشة التدريب (TrainingScreens):
- **إضافة هوامش وحواشي مناسبة**: ضمان ظهور جميع أزرار التحكم على الشاشات الصغيرة دون قطع.
- **تحسين عرض البوتات في قائمة التدريب**: ظهور الأفاتار لكل بوت في لوبي التدريب.

#### شاشة اللاعب (PlayerScreens):
- **إضافة خيار تعديل الأفاتار** قبل الدخول للغرفة.
- **تحسين تجربة الانضمام**: عرض الأفاتار الحالي للاعب في اللوبي.

#### الملفات المُعدّلة 📝:
| الملف | التعديل |
|-------|---------|
| `plot-mobile/src/components/avatar/Avatar.js` | **جديد** — مكون عرض الأفاتار مع أنيميشن |
| `plot-mobile/src/components/avatar/AvatarEditor.js` | **جديد** — شاشة تعديل الأفاتار |
| `plot-mobile/src/components/avatar/AvatarLayers.js` | **جديد** — مكتبة طبقات SVG للأفاتار |
| `plot-mobile/src/components/minimal/PlayerBadge.js` | تحديث لدعم عرض الأفاتار |
| `plot-mobile/src/screens/PlayerScreens.js` | إضافة خيار تعديل الأفاتار |
| `plot-mobile/src/screens/TrainingScreens.js` | تحسين الهوامش وعرض الأفاتار |
| `plot-mobile/src/store/useGameStore.js` | إضافة حقل أفاتار للاعب |
| `server/routes/adminRoutes.js` | إصلاح المتغيرات الديناميكية في القالب |
| `server/sockets/registerHandlers.js` | إضافة توليد أفاتار عشوائي للبوتات |
| `README.md` | تحديث الهيكل والميزات |
| `TECHNICAL_IMPLEMENTATION.md` | توثيق نظام الأفاتار ولوحة المشرف |

---

## [2.6.0] - 2026-03-01

### تلميع واجهة المستخدم وتوحيد PlayerBadge (UI Polish: PlayerBadge Unification) 🎨

#### توحيد `PlayerBadge` عبر جميع الشاشات:
- **Lobby Screen**: استبدال عرض الأسماء النصية البسيطة بمكون `PlayerBadge` لكل لاعب.
- **Voting Screens**: استخدام `PlayerBadge` في قائمة التصويت وعرض المُصوَّت عليه.
- **Discussion Screen**: عرض أفاتار المتحدث الحالي ضمن `PlayerBadge` بدلاً من النص.

#### أصول بصرية جديدة (New Visual Assets):
- إضافة `bg_dark_noir.png` و `bg_light_noir.png`: خلفيتان محسّنتان للوضعَين الليلي والنهاري.
- إضافة 8 صور أدوار جديدة (`role_beneficiary.png`, `role_culprit.png`, `role_detective.png`, `role_mastermind.png`, `role_minister.png`, `role_saboteur.png`, `role_seer.png`, `role_witness.png`) بدقة أعلى ومصممة خصيصاً لهوية Bureaucratic Noir.
- إضافة `texture_paper.png`: ملمس ورق محسَّن.
- **تنظيف الأصول القديمة**: حذف صور الأدوار القديمة ذات أسماء الهاش المختلفة.

#### مكونات UI محسّنة:
- **`ScreenWrapper.js`** (جديد، 49 سطر): مكون غلاف مشترك للشاشات يوحد الخلفية والحواشي الآمنة (SafeArea).
- **`GameHeader.js`** (محسّن، 330 سطر): رأس صفحة اللعبة مع دعم أزرار سريعة ومؤشر الجولة.
- **`MinimalButton.js`**: تحسين التنسيق والاستجابة.
- **`MinimalCard.js`**: تقليل الحواشي وتحسين الظلال.
- **`MinimalLayout.js`**: إعادة هيكلة لدعم أنماط تخطيط متعددة.
- **`constants/theme.js`** (جديد، 43 سطر): ثوابت الثيم المشتركة بين المكونات.
- **`ShowcaseScreen.js`** (جديد، 123 سطر): شاشة عرض لمكونات Noir UI للمطورين.

#### الملفات المُعدّلة 📝:
| الملف | التعديل |
|-------|---------|
| `plot-mobile/src/components/ScreenWrapper.js` | **جديد** — غلاف موحد للشاشات |
| `plot-mobile/src/components/minimal/GameHeader.js` | تحسين رأس اللعبة |
| `plot-mobile/src/components/minimal/PlayerBadge.js` | توحيد الأفاتار والاسم |
| `plot-mobile/src/components/minimal/MinimalButton.js` | تحسين التنسيق |
| `plot-mobile/src/components/minimal/MinimalCard.js` | تحسين الحواشي |
| `plot-mobile/src/components/minimal/MinimalLayout.js` | إعادة هيكلة التخطيط |
| `plot-mobile/src/constants/theme.js` | **جديد** — ثوابت الثيم |
| `plot-mobile/src/screens/ShowcaseScreen.js` | **جديد** — شاشة عرض المكونات |
| `plot-mobile/src/screens/DiscussionScreen.js` | توحيد PlayerBadge |
| `plot-mobile/src/screens/HostGameScreens.js` | توحيد PlayerBadge |
| `plot-mobile/assets/bg_dark_noir.png` | **جديد** — خلفية داكنة محسّنة |
| `plot-mobile/assets/bg_light_noir.png` | **جديد** — خلفية فاتحة محسّنة |
| `plot-mobile/assets/roles/role_*.png` | **جديد** — 8 صور أدوار بجودة عالية |

---

## [2.5.0] - 2026-03-01

### إعادة الهيكلة الكاملة للخادم والتطبيق (Complete Server Modularization) 🏗️

#### إعادة هيكلة الخادم (Server Refactoring):
- **تقسيم `server/index.js`** (كان ~2500 سطر) إلى وحدات متخصصة:
  - `server/state.js` (14 سطر): حالة الغرف المشتركة `rooms = {}` — نقطة مركزية واحدة.
  - `server/game/phases.js` (1385 سطر): منطق مراحل اللعبة (21 دالة) — `startDraftingPhase`, `startQualityVoting`, `handleRoundResults`, إلخ.
  - `server/sockets/registerHandlers.js` (986 سطر): معالجات أحداث Socket.IO كاملة.
  - `server/routes/adminRoutes.js` (98 سطر): مسارات لوحة تحكم المشرف (`/admin`, `/admin/api/rooms`).
  - `server/utils/serverUtils.js` (119 سطر): دوال مساعدة مشتركة (`generateRoomCode`, `safeEmit`, إلخ).

#### إعادة هيكلة التطبيق (App Refactoring):
- **استخراج `useGameSocket.js`** (569 سطر): هوك React مخصص يُدير دورة حياة الـ Socket (الاتصال، إعادة الاتصال، معالجات الأحداث) بعيداً عن `App.js`.
- **شاشة `DraftingScreen.js`** (477 سطر): شاشة مستقلة لمرحلة الكتابة تدعم وضعَي Classic و Blitz.
- **`GameScreen.js`** (129 سطر): شاشة اللعبة الموحدة مع التوجيه الديناميكي بين المراحل.
- **`gameScreenStyles.js`** (358 سطر): ملف styles مستقل لشاشات اللعبة.
- **`AppNavigator.js`** (79 سطر): نظام التنقل المركزي باستخدام React Navigation.
- **`useGameStore.js`** (122 سطر): متجر Zustand لإدارة الحالة المشتركة.

#### إصلاحات الأخطاء (Bug Fixes):
- **إصلاح `generateRoomCode()`**: إضافة معامل `rooms` المفقود بعد الـ Refactor.
- **إصلاح `io is not defined`**: استخدام `ioInstance` في `phases.js` بعد الفصل.
- **معالج `uncaughtException`**: `process.on('uncaughtException')` لمنع تعطل الخادم الكامل.
- **حماية `endGame()`**: تغليف عمليات قاعدة البيانات بـ `try-catch` لضمان الاستمرارية.

#### تحسينات الأدوات (Tooling):
- **`test_game_flow.js`** (69 سطر): سكريبت اختبار تدفق اللعبة الكامل بدون واجهة رسومية.
- **`find_*.js` / `find_reveal.py`**: أدوات تشخيصية للبحث عن أماكن معينة في الكود.
- **`package.json`**: إضافة تبعية `zustand` لإدارة الحالة.
- **حذف ملفات النسخ الاحتياطية**: إزالة `App.js.backup` و `App.js.old` من المستودع.

#### الملفات المُعدّلة 📝:
| الملف | التعديل |
|-------|---------|
| `server/state.js` | **جديد** — حالة الغرف المشتركة |
| `server/game/phases.js` | **جديد** — منطق مراحل اللعبة (21 دالة) |
| `server/sockets/registerHandlers.js` | **جديد** — معالجات Socket.IO |
| `server/routes/adminRoutes.js` | **جديد** — مسارات لوحة المشرف |
| `server/utils/serverUtils.js` | **جديد** — دوال مساعدة |
| `server/index.js` | تصغير جذري (من ~2500 → ~200 سطر) |
| `plot-mobile/src/hooks/useGameSocket.js` | **جديد** — هوك Socket مخصص |
| `plot-mobile/src/screens/game/DraftingScreen.js` | **جديد** — شاشة الكتابة المستقلة |
| `plot-mobile/src/screens/game/GameScreen.js` | **جديد** — شاشة اللعبة الموحدة |
| `plot-mobile/src/screens/game/gameScreenStyles.js` | **جديد** — Styles مستقلة |
| `plot-mobile/src/navigation/AppNavigator.js` | **جديد** — نظام التنقل |
| `plot-mobile/src/store/useGameStore.js` | **جديد** — متجر Zustand |
| `plot-mobile/src/constants/config.js` | **جديد** — إعدادات الاتصال |
| `plot-mobile/App.js` | تصغير جذري (نقل المنطق للهوكس والشاشات) |
| `start_fixed.js` | تحديث لدعم الهيكلة الجديدة |
| `test_game_flow.js` | **جديد** — سكريبت اختبار شامل |
| `README.md` | تحديث هيكل المشروع v3.0.0 |

---

## [2.4.0] - 2026-02-26

### إعادة تصميم شاشة النتائج وإصلاح البوتات (Results Redesign & Bot Fixes) 🏆🤖

#### تصميم شاشة نتائج الجولة للمضيف (Host Round Results — Minimal Redesign):
- **إزالة عمودَي الفريقَين** (الجريمة / العدالة) واستبدالهما بشريط ملون على كل صف في قائمة النقاط (أحمر = جريمة، أزرق = عدالة).
- **عرض اسم الدور** بجانب كل لاعب بلون يعكس فريقه.
- **عرض النقاط المكتسبة في الجولة** (+N) بالأخضر بجانب مجموع النقاط.
- **تفاصيل قابلة للتوسيع (Expandable Breakdown)**: كل صف في القائمة قابل للضغط لعرض أسباب النقاط التفصيلية.
- **مؤشر الجولة الحالية**: عنوان فرعي يعرض "الجولة X من Y".
- **توقيت كشف محسّن**: 2 خطوات (0.5 ث → عرض المستبعد، 3 ث → عرض النتائج الكاملة).

#### شاشة نتائج اللاعب (Player Results — Simplified):
- **إزالة كل معلومات الفريق الفائز** من شاشة اللاعب.
- الشاشة تُوجِّه اللاعب فقط لشاشة المضيف لمعرفة النتائج (`📺 انظر إلى شاشة المضيف`).

#### إصلاحات اللعبة (Game Logic Fixes):
- **إصلاح زر "انهاء اللعبة"**: الخادم يرسل الآن `isLastRound` في `resultPayload` مما يمنع ظهور زر الانتهاء في منتصف اللعبة.
- **إصلاح نهاية اللعبة**: إضافة `socket.on('gameEnded')` — يقطع الاتصال ويعيد جميع اللاعبين للشاشة الرئيسية.
- **إعادة التصويت عند التعادل**: إذا تعادل لاعبان أو أكثر في التصويت، يُعاد التصويت مرة أخرى. إذا استمر التعادل للمرة الثانية، يفوز فريق الجريمة.
- **منع التصويت على المستبعد**: اللاعب المستبعد من الجولة لا يمكن لأحد التصويت عليه.
- **إخفاء الأدوار حتى نهاية الجولة الكاملة**: لا تُفضح أدوار اللاعبين إلا بعد انتهاء الجولة نهائياً.
- **عرض عدد الأصوات**: بعد انتهاء التصويت على الجاني، يظهر عدد الأصوات التي حصل عليها كل لاعب.

#### زر الريفرش (Refresh Button):
- **إزالة زر الريفرش من جميع شاشات اللاعب** خارج الهيدر.
- **الهيدر يحتفظ بزر الريفرش** ويعمل كما هو في جميع الشاشات.

#### قدرة المخرب — توحيد الوضعَين (Saboteur Ability Unification):
- **تم توحيد قدرة المخرب** في Classic وBlitz: في كلا الوضعين تعكس النتيجة على تحقيق المحقق (`INVESTIGATION_FLIP`) بدلاً من إضافة كلمة دخيلة في Blitz (`WORD_SWAP`).

#### إصلاحات ذكاء البوتات (Bot AI Fixes):
- **إصلاح بوت المخرب (Critical Bug Fix)**: الكود القديم كان يضيف الهدف لـ `room.sabotagedPlayers[]` وهو مصفوفة لا تُقرأ أبداً — التخريب لم يعمل إطلاقاً للبوتات. الإصلاح: استخدام `target.sabotagedBy = bot.id` + `target.sabotageType = 'INVESTIGATION_FLIP'` مطابقاً لآلية اللاعب الحقيقي.
- **إصلاح بوت العراف في Blitz**: كان يكتب نص القصة الكاملة كإجابة مما يُفسد تنسيق الفراغات. الإصلاح: يملأ الفراغات بالإجابات الصحيحة من `scenario.blanks`.
- **حد طول إجابة البوت**: إضافة حد أقصى 400 حرف لإجابات `generateBotBlankFill`.

#### تحسينات الاستقرار والأمان (Stability & Security):
- **إزالة معالجات قديمة (Dead Code)**: حذف `saboteurSabotage`، `detectiveCheck`، `seerReveal` — العميل يستخدم `useAbility` حصراً.
- **منع DoS على الغرف**: غرف اللوبي التي لا تبدأ اللعبة تُحذف تلقائياً بعد 30 دقيقة.
- **تنظيف المؤقتات عند حذف الغرفة**: `clearInterval(room.timer)` قبل `delete rooms[roomCode]` في `endGame`.
- **إعادة تصفير `consecutiveTies`**: يُصفَّر عداد التعادلات في بداية كل جولة جديدة لمنع تراكم القيم.

#### الملفات المُعدّلة 📝:
| الملف | التعديل |
|-------|---------|
| `server/index.js` | إصلاح `resultPayload`، توحيد قدرة المخرب، حذف معالجات قديمة، auto-cleanup غرف اللوبي، تنظيف المؤقتات، reset consecutiveTies |
| `server/botAI.js` | إصلاح بوت المخرب، إصلاح بوت العراف في BLITZ، حد طول الإجابة |
| `plot-mobile/App.js` | معالج `gameEnded`، `isLastRound` من الخادم، تحديث `currentRound`/`totalRounds` |
| `plot-mobile/src/screens/HostGameScreens.js` | إعادة تصميم `HostResultsScreen` (V4: minimal، ألوان فرق، breakdown قابل للتوسيع) |
| `plot-mobile/src/screens/VotingScreens.js` | تبسيط `PlayerResultsScreen`، عرض عدد الأصوات |

---

## [2.3.0] - 2026-02-25

### تحسينات الاستقرار وتجربة المستخدم (Stability & UX) 🚀

#### إصلاحات الأخطاء (Bug Fixes):
- **إصلاح انهيار التطبيق في مرحلة النقاش**: تم حل مشكلة `Minified React error #130` التي كانت تظهر للهوست عند دخول شاشة النقاش، وذلك بتصحيح طريقة تمرير البيانات لمكون `PlayerBadge`.
- **إصلاح زر الجولة التالية**: تم تحسين منطق `nextRound` في الخادم والتطبيق لضمان انتقال الهوست واللاعبين للجولة التالية بسلاسة، مع معالجة حالات فقدان الاتصال.
- **إصلاح شاشة الهوست**: تم التأكد من أن الهوست ينضم للغرفة بشكل صحيح لاستقبال الأحداث.

#### تحسينات اللعب (Gameplay Improvements):
- **تحديث ترتيب الأدوار**: تم تعديل ترتيب ظهور الأدوار ليكون أكثر منطقية وتوازناً:
  1. الجاني (Culprit)
  2. الشاهد (Witness)
  3. المحقق (Detective)
  4. المخرب (Saboteur)
  5. المستفيد (Beneficiary)
  6. الوزير (Minister)
  7. العراف (Seer)
  8. العقل المدبر (Mastermind)
- **وضع اللعب الافتراضي**: تم تغيير الوضع الافتراضي للعبة إلى **Blitz Mode** (إكمال الفراغات) لتسريع وتيرة اللعب وتقليل التشتت.
- **ذكاء اصطناعي محسن (Smart AI)**:
  - تم تفعيل منطق تصويت ذكي للبوتات يعتمد على معرفتهم المحدودة (مثل معرفة الوزير للمستفيد).
  - تحسين جودة إجابات البوتات في وضع Blitz لتكون أكثر تنوعاً ومنطقية.

#### الملفات المُعدّلة 📝:
| الملف | التعديل |
|-------|---------|
| `server/index.js` | تحديث `ROLE_ORDER`, `gameMode` default, `nextRound` logic |
| `server/botAI.js` | تفعيل `generateSmartCulpritVote` بذكاء اصطناعي حقيقي |
| `plot-mobile/App.js` | تحسين `handleContinue` وإضافة logs |
| `plot-mobile/src/screens/DiscussionScreen.js` | إصلاح `PlayerBadge` props و imports |

---

## [2.2.0] - 2026-02-23

### إصلاحات إعادة الاتصال والتزامن (Reconnection & Sync Overhaul) 🔄

#### المشاكل التي تم حلها:
- **اللاعب يبقى عالقاً في شاشته القديمة** عند الخروج من Expo Go والعودة إليه.
- **اللاعب لا يتزامن مع الهوست** بعد إعادة الاتصال.
- **التلميح (Hint) يختفي** بمجرد الانتقال من مرحلة العرض التشويقي إلى مرحلة النقاش.

#### الحلول المنفذة:

**1. مراقبة حالة التطبيق (`AppState`)**
- تم إضافة `AppState.addEventListener` في `App.js`.
- عند عودة التطبيق من الخلفية إلى الواجهة، يُرسل طلب `joinRoom` تلقائياً للسيرفر.
- السيرفر يستجيب بإرسال حالة اللعبة الحالية كاملة (المرحلة، الدور، التلميح...).

**2. إعادة الانضمام عند إعادة الاتصال بالـ Socket**
- إذا انقطع الـ Socket وأعاد الاتصال، يُرسل `joinRoom` تلقائياً في معالج `connect`.

**3. حفظ التلميح في مرحلة النقاش**
- تم إضافة `lastHint` state في `App.js` يُحفظ فيه التلميح عند ظهوره في العرض التشويقي.
- يُمرر للـ `DiscussionScreen` ليبقى ظاهراً طوال مرحلة النقاش.
- السيرفر يُرسل التلميح أيضاً ضمن حدث `discussionStarted` لضمان استعادته عند إعادة الاتصال.
- مدة عرض التلميح في العرض التشويقي رُفعت من **5 ثوانٍ** إلى **15 ثانية**.

**4. رمز الغرفة ثابت في جميع شاشات الهوست**
- تم إضافة `roomCode` prop لـ `MinimalLayout`.
- يظهر رمز الغرفة (CODE: XXXXX) دائماً في أعلى يسار الشاشة في جميع شاشات الهوست.

**5. عرض المصوتين في تاريخ العرض التشويقي**
- كل سيناريو في الشريط السفلي يعرض الآن أسماء من صوّتوا له وعدد الأصوات.

---

### تخصيص ترتيب الأدوار (Role Priority Order) 🎭

تم تعديل `server/roles.js` لتوزيع الأدوار حسب الأولوية التالية بغض النظر عن عدد اللاعبين:

| الترتيب | الدور |
|---------|-------|
| 1 | الجاني (Culprit) |
| 2 | الشاهد (Witness) |
| 3 | المحقق (Detective) |
| 4 | المخرب (Saboteur) |
| 5 | الوزير (Minister) |
| 6 | المستفيد (Beneficiary) |
| 7 | العراف (Seer) |
| 8 | العقل المدبر (Mastermind) |

---

### إصلاح تعليق اللعبة بعد التصويت (Voting Freeze Fix) 🐛

- تم تعديل `checkCulpritVotingComplete` و `checkQualityVotingComplete` لاستثناء اللاعبين **المنفصلين** (disconnected) من عدد التصويت المطلوب.
- يُطلق إعادة الفحص تلقائياً عند انفصال لاعب خلال مرحلة التصويت.

---

### إصلاح عنوان IP واتصال الشبكة 🌐

- تم إنشاء `start_fixed.js` لضبط عنوان IP المحدد (`192.168.8.48`) وإعداد متغيرات البيئة اللازمة لـ Expo.
- `package.json` يستخدم الآن هذا السكريبت عند تشغيل `npm start`.

---

### الملفات المُعدّلة 📝

| الملف | التعديل |
|-------|---------|
| `plot-mobile/App.js` | إضافة `AppState`, `lastHint`, إعادة الانضمام التلقائي |
| `plot-mobile/src/components/minimal/MinimalLayout.js` | إضافة `roomCode` badge ثابت |
| `plot-mobile/src/screens/DiscussionScreen.js` | عرض `hint` prop ثابت في أعلى الشاشة |
| `plot-mobile/src/screens/HostGameScreens.js` | تمرير `roomCode`، عرض المصوتين في التاريخ |
| `server/index.js` | إصلاح التصويت، إرسال `hint` مع `discussionStarted`، رفع مدة الـ Hint |
| `server/roles.js` | ترتيب الأدوار حسب الأولوية الجديدة |
| `start_fixed.js` | سكريبت جديد لضبط IP ومتغيرات البيئة |

---

## [2.1.2] - 2026-02-08

### تحسينات واجهة المستخدم المتقدمة (V4 Minimalist & Landscape) 🎨

تم التركيز في هذا التحديث على تحسين تجربة المستخدم في وضع "Landscape" (الأفقي) للهواتف والويب، بالإضافة إلى تفعيل قواعد اللعب V4.

#### الميزات الجديدة:
- **دعم الوضع الأفقي للجوال**: عند تدوير الهاتف، تتحول الواجهة إلى تخطيط "Split View" مشابه للويب.
- **تحديث Responsive Logic**: تقليل أحجام العناصر بنسبة 50% في وضع الويب/Landscape لتظهر بشكل "Minimalist" دون الحاجة للتمرير.
- **شاشة النقاش (Discussion)**:
  - **Split View**: تقسيم الشاشة إلى قسمين (المتحدث + التحكم) في الشاشات العريضة.
  - **Speaker Card**: استعادة الحجم الكبير والواضح لبطاقة المتحدث.
- **إصلاحات Android**:
  - تفعيل **Immersive Mode** بشكل صحيح لإخفاء شريط التنقل (Navigation Bar).
  - منع ظهور الشريط الأسود في الأسفل بجعل الخلفية شفافة.

### قواعد اللعب V4 (Justice vs Crime) ⚖️

تفعيل القواعد الجديدة للفرق:
- **Justice Team**: Detective, Witness, Seer, Minister.
- **Crime Team**: Culprit, Mastermind, Saboteur, Beneficiary.
- **آلية الفوز**:
  - إذا تم كشف الجاني (Culprit) -> فوز العدالة.
  - إذا تم إخراج عضو عدالة -> فوز الجريمة.
  - إذا تم إخراج عضو جريمة (غير الجاني) -> تستمر اللعبة.

---

## [2.1.1] - 2026-02-05

### تحسينات الويب الشاملة (Web Optimization Overhaul) 🖥️

تم إجراء تحديث جذري لكيفية تعامل التطبيق مع شاشات الويب العريضة (Landscape)، مع التركيز على كثافة المعلومات وتقليل التمرير.

#### الميزات الجديدة:
- **نظام التخطيط الديناميكي (Dynamic Layout System)**: استخدام هوك جديد `useResponsiveLayout` يستبدل المنطق القديم المكرر.
- **دعم عرض 90%**: توسيع المحتوى ليشغل 90% من عرض الشاشة في وضع سطح المكتب، بدلاً من العمود الضيق السابق.
- **تحديث المكونات الأساسية**:
  - `Button`: أحجام مدمجة (Compact) للويب.
  - `Card`: تقليل الحواشي والظلال لتناسب العرض الشبكي.
  - `TextInput`: ارتفاعات مناسبة للكتابة بلوحة المفاتيح.

#### التعديلات التقنية:
- **Refactoring**: إعادة كتابة الشاشات الرئيسية (`HostGameScreens`, `GameScreens`, `VotingScreens`) لتستجيب لتغير حجم النافذة فورياً.
- **إصلاحات**:
  - حل مشكلة حجم بطاقة المؤقت (Timer) العملاق في شاشة المضيف.
  - إصلاح `SyntaxError` في `VotingScreens.js`.
  - توحيد الخلفية `Noir` في جميع الشاشات.

---

## [2.1.0] - 2026-02-03

### إصلاحات حرجة 🔧

#### إصلاح حالة اللاعبين اللحظية في شاشة الهوست
**المشكلة**: كانت شاشة المضيف تعرض جميع اللاعبين كـ "تم التسليم ✅" فوراً في مرحلة الكتابة، حتى قبل أن يبدأوا الكتابة.

**الحل**:
- `server/index.js`: تحديث `startDraftingPhase()` لإرسال قائمة `waitingFor` تحتوي IDs جميع اللاعبين عند بداية المرحلة
- `plot-mobile/App.js`: تحديث معالج `startDrafting` لاستقبال وتهيئة `waitingFor` بشكل صحيح

**النتيجة**:
- ⏳ جميع اللاعبين يظهرون بحالة "يكتب..." عند البداية
- ✅ التحديث الفوري للحالة عند تسليم كل لاعب
- 📊 عرض دقيق ولحظي لتقدم اللاعبين في شاشة المضيف

#### إصلاح العرض التشويقي (Dramatic Reveal)
**المشكلة**: لم تكن شاشة العرض التشويقي تظهر بعد التصويت على أفضل سيناريو.

**الأسباب**:
1. عدم تطابق أسماء الأحداث: الخادم يرسل `data.step` لكن التطبيق يتوقع `data.type`
2. عدم تطابق أسماء الحقول: `answer` vs `text`, `authorName` vs `author`
3. عدم دعم خطوة `NO_VOTES` (السيناريوهات بدون أصوات)

**الحل**:
- `plot-mobile/App.js`: تحديث معالج `revealStep` لدعم:
  - كلا الاسمين: `data.step` و `data.type`
  - جميع الخطوات: `SCENARIO`, `VOTERS`, `AUTHOR`, `NO_VOTES`
  - كلا تنسيقي البيانات مع fallbacks آمنة
- `plot-mobile/src/screens/HostGameScreens.js`: تحسين واجهة العرض لإظهار:
  - موقع السيناريو (X من Y)
  - قائمة أسماء المصوتين
  - عدد الأصوات بدقة

**النتيجة**:
- 🎬 العرض التشويقي يظهر تلقائياً بعد اكتمال التصويت
- 📊 عرض السيناريوهات مرتبة حسب عدد الأصوات
- 👥 عرض أسماء من صوّتوا لكل سيناريو
- ✍️ كشف تدريجي لأسماء الكُتّاب
- ⏭️ انتقال تلقائي سلس لمرحلة التصويت على الجاني

### تحسينات واجهة المستخدم 🎨

#### تحسين شاشة مراقبة الكتابة للمضيف
- إضافة عداد تنازلي واضح بألوان ديناميكية (أخضر → أصفر → أحمر)
- شريط تقدم يعرض عدد التقارير المُسلّمة
- عرض حالة كل لاعب بأيقونة وحالة نصية
- تلوين خلفية اللاعبين الذين أنهوا بلون أخضر فاتح

#### تحسين شاشة العرض التشويقي
- بطاقة رئيسية تعرض السيناريو الحالي مع إطار ملون
- عرض موقع السيناريو (مثلاً: "1 من 4")
- قائمة المصوتين بأسمائهم
- عرض تراكمي للسيناريوهات السابقة
- دعم عرض السيناريوهات التي لم تحصل على أصوات

### الملفات المُعدّلة 📝

**الخادم (Backend)**:
- `server/index.js`:
  - السطور 101-115: إضافة إرسال `waitingFor` في `startDraftingPhase()`
  
**التطبيق (Frontend)**:
- `plot-mobile/App.js`:
  - السطر 217: تهيئة `waitingFor` عند `startDrafting`
  - السطور 258-299: تحديث معالج `revealStep` لدعم جميع التنسيقات
  
- `plot-mobile/src/screens/HostGameScreens.js`:
  - السطور 56-185: `HostDraftingScreen` - شاشة مراقبة الكتابة المحسّنة
  - السطور 190-280: `HostDramaticRevealScreen` - شاشة العرض التشويقي المحسّنة
  - إضافة styles جديدة لـ `position`, `voters`, `voteCount`

### التدفق الصحيح للعبة 🎮

```
1. 📝 Drafting (الكتابة)
   - حالة لحظية ودقيقة للاعبين ✅
   ↓
2. 🗳️ Quality Voting (التصويت على الجودة)
   ↓
3. 🎬 Dramatic Reveal (العرض التشويقي)
   - يعمل بشكل كامل ✅
   ↓
4. 🔍 Culprit Voting (التصويت على الجاني)
   ↓
5. 🏆 Results (النتائج)
```

### للمطورين 👨‍💻

#### Socket Events المُحدّثة

**startDrafting**:
```javascript
// من الخادم
io.to(roomCode).emit('startDrafting', { 
  duration: 90,
  waitingFor: ['player1_id', 'player2_id', ...] // جديد ✨
});

// في التطبيق
socket.on('startDrafting', (data) => {
  setWaitingFor(data.waitingFor || players.map(p => p.id));
});
```

**revealStep**:
```javascript
// من الخادم - يدعم الآن جميع هذه الأنواع
emit('revealStep', {
  step: 'SCENARIO' | 'VOTERS' | 'AUTHOR' | 'NO_VOTES',
  data: { ... }
});

// في التطبيق - يدعم كلا الاسمين
socket.on('revealStep', (data) => {
  const step = data.step || data.type; // مرن ✨
  // ...
});
```

#### هيكل البيانات

**revealStep data structures**:
```javascript
// SCENARIO step
{
  step: 'SCENARIO',
  data: {
    index: 0,
    answer: "نص السيناريو",
    position: 1,
    total: 4
  }
}

// VOTERS step
{
  step: 'VOTERS',
  data: {
    index: 0,
    voters: ["محمد", "أحمد", "سارة"],
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

// NO_VOTES step
{
  step: 'NO_VOTES',
  data: {
    scenarios: [
      { index: 3, authorName: "فاطمة", answer: "..." },
      { index: 5, authorName: "خالد", answer: "..." }
    ]
  }
}
```

### الاختبارات المُوصى بها ✔️

- [ ] إنشاء غرفة واختيار "تدريب فردي"
- [ ] بدء اللعبة ومراقبة حالة اللاعبين أثناء الكتابة
- [ ] التأكد من تحديث الحالة فوراً عند التسليم
- [ ] إكمال التصويت على الجودة
- [ ] مشاهدة العرض التشويقي الكامل
- [ ] التحقق من الانتقال التلقائي لمرحلة التصويت على الجاني

### الإصدارات القادمة 🚀

- [ ] رسالة "جاري إعادة الاتصال..." أثناء محاولة الاتصال
- [ ] إضافة مؤثرات صوتية للعرض التشويقي
- [ ] تحسين الأداء مع عدد كبير من اللاعبين (8+)
- [ ] إضافة إحصائيات مُفصّلة في نهاية اللعبة

---

## [2.0.0] - 2026-02-01

### ميزات رئيسية
- ✅ نظام التدريب الفردي مع البوتات
- ✅ الهوية البصرية الكاملة (Bureaucratic Noir)
- ✅ 5 شاشات جديدة للمضيف واللاعبين
- ✅ نظام التصويت المزدوج (جودة + جاني)
- ✅ العرض التشويقي بين مراحل التصويت
- ✅ توليد السيناريوهات بالذكاء الاصطناعي

(راجع الإصدارات السابقة في تاريخ Git)
