# التوثيق التقني - مشروع الحبكة

## حالة المشروع الحالية (الإصدار 2.1.0)

### آخر التحديثات (2026-02-03):
- ✅ **إصلاح حالة اللاعبين اللحظية**: الآن شاشة المضيف تعرض الحالة الصحيحة للاعبين في الوقت الفعلي
- ✅ **إصلاح العرض التشويقي**: العرض التشويقي يعمل بشكل كامل بعد التصويت على الجودة
- ✅ **تحسين واجهة المستخدم**: عرض أسماء المصوتين وموقع السيناريو والتحديثات اللحظية

### المراحل المنفذة:
1. ✅ **Lobby Phase**: إنشاء الغرف والانضمام للاعبين
2. ✅ **Role Assignment**: توزيع الأدوار (10 أدوار - نظام الفرق)
3. ✅ **Drafting Phase**: كتابة السيناريوهات (90 ثانية، حد 500 حرف) - **مع مراقبة لحظية** ⭐
4. ✅ **Two-Phase Voting System**: تصويت على الجودة ثم التصويت على الجاني
5. ✅ **Dramatic Reveal**: عرض تشويقي تلقائي للسيناريوهات - **محسّن ويعمل بالكامل** ⭐
6. ✅ **Results Phase**: حساب ونشر النتائج مع نظام الفرق
7. ✅ **Multi-Round System**: دعم جولات متعددة
8. ✅ **Live Voting Display**: عرض التصويتات الحية للمضيف
9. ✅ **AI Integration**: توليد السيناريوهات بواسطة AI (GitHub Models)
10. ✅ **Training Mode**: وضع التدريب الفردي مع 3 بوتات ذكية

### التقنيات المستخدمة:
- **Backend**: Node.js + Express + Socket.io
- **Frontend**: React Native (Expo) - منصة موحدة (Web & Mobile)
- **AI Engine**: GitHub Models API (DeepSeek, Phi-4)
- **Database**: JSON File System
- **اللغة**: JavaScript/JSX
- **الاتصال**: WebSocket (Socket.io)

## هيكلة المشروع
```
plot/
├── server/                          # Backend Node.js
│   ├── index.js                    # منطق الخادم الرئيسي
│   ├── scenarios.js                # قاعدة بيانات السيناريوهات
│   ├── database.js                 # نظام تخزين البيانات (JSON)
│   ├── db.json                     # ملف قاعدة البيانات (يتم إنشاؤه تلقائياً)
│   ├── package.json
│   └── /public                     # ملفات الويب المبنية (React Native Web Build)
│       ├── index.html             # نقطة الدخول للتطبيق
│       └── /_expo                 # ملفات الجافاسكريبت والأصول
│
├── plot-mobile/                    # React Native (Expo) - الكود الموحد
│   ├── App.js                     # المكون الرئيسي (يعمل للويب والجوال)
│   ├── app.json                   # إعدادات Expo
│   ├── package.json
│   ├── /assets
│   │   └── /roles                 # صور الشخصيات والأدوار
│   ├── /components
│   │   ├── RoleAvatar.js          # مكون عرض صورة الدور
│   │   ├── GlobalLayout.js        # المكون الأساسي للهوية البصرية (Container)
│   │   └── RedactedText.js        # مكون النصوص المحجوبة (تفاعلي)
│   └── /src
│       ├── /screens                # شاشات اللعبة المنظمة
│       │   ├── RoleSelectScreen_v2.js     # اختيار الدور (مضيف/لاعب/تدريب)
│       │   ├── HostScreens_v2.js          # شاشات المضيف (Lobby)
│       │   ├── HostGameScreens.js         # شاشات المضيف داخل اللعبة
│       │   ├── PlayerScreens.js           # شاشات اللاعب (Login, Lobby)
│       │   ├── GameScreens.js             # شاشات اللعبة للاعب
│       │   ├── VotingScreens.js           # شاشات التصويت والنتائج
│       │   └── TrainingScreens.js         # شاشات التدريب الفردي
│       ├── /ui                     # مكونات واجهة المستخدم
│       │   ├── Button.js           # أزرار بأنماط مختلفة
│       │   ├── Card.js             # بطاقات Manila folder style
│       │   ├── Badge.js            # شارات Stamps style
│       │   └── TextInput.js        # حقول إدخال النص
│       └── /styles
│           ├── theme.js            # متغيرات الألوان والتصميم
│           └── responsive.js       # متغيرات التصميم المتجاوب
│
├── start.js                       # سكريبت التشغيل الموحد
├── package.json                   # التبعيات الرئيسية
│
└── /docs                         # التوثيق
    ├── GDD.md                    # تصميم اللعبة
    ├── TECHNICAL_IMPLEMENTATION.md
    ├── ROADMAP.md               # خطة العمل
    └── الهوية البصرية.md
```

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
- `roundResults`: عرض نتائج الجولة

### Special Abilities
- `useAbility`: طلب استخدام قدرة خاصة
- `abilityResult`: نتيجة القدرة الخاصة

### Other
- `timerUpdate`: تحديث العداد التنازلي
- `startTutorial`: بدء وضع التدريب

## الأدوار والفرق (Team-Based System)

### فريق الجريمة (Crime Team) - 🔴
| الدور | المعلومات | الهدف |
|------|---------|------|
| الجاني (CULPRIT) | القصة الكاملة | كتابة سيناريو مقنع دون انكشاف |
| المزور (FORGER) | 3 كلمات مفتاحية | ابتكار سيناريو مقنع من كلمات محدودة |
| المخترق (INFILTRATOR) | نص مشوش من الجاني | استخدام معلومات جزئية |
| الشريك (ACCOMPLICE) | اسم الجاني | حماية الجاني بسيناريو داعم |
| المحامي (LAWYER) | اسم الجاني | الدفاع عن الجاني |

### فريق التحقيق (Investigation Team) - 🔵
| الدور | المعلومات | الهدف |
|------|---------|------|
| المحقق الرئيسي (CHIEF_DETECTIVE) | عنوان القصة فقط | كشف الجاني |
| المحلل (ANALYST) | عنوان القصة فقط | تحليل السيناريوهات |
| الضابط (OFFICER) | عنوان القصة فقط | المساعدة في التحقيق |
| الشاهد المحايد (WITNESS) | عنوان القصة فقط | كتابة سيناريو محايد |

### دور خاص (Neutral) - ⚪
| الدور | المعلومات | الهدف |
|------|---------|------|
| المخرب (SABOTEUR) | الكلمة الدخيلة | التشويش بكلمة غريبة |

## نظام النقاط (Scoring System)

### Quality Voting (المرحلة الأولى)
- **+200 نقطة** لكل صوت يحصل عليه السيناريو
- **+100 نقطة** للإرسال في الوقت المحدد

### Culprit Voting (المرحلة الثانية)
- **شرط الفوز**: الأغلبية (50%+) تحدد الفريق الفائز
- **فريق الجريمة يفوز**: إذا لم يحصل الجاني على أغلبية الأصوات (+2500 نقطة)
- **فريق التحقيق يفوز**: إذا حصل الجاني على أغلبية الأصوات (+2000 نقطة)
- **مكافأة المحقق**: +500 نقطة إضافية إذا صوّت للجاني الصحيح

### Penalties & Bonuses
- **الجاني**: -60% من نقاطه إذا تم القبض عليه
- **الشريك**: -30% من نقاطه إذا تم القبض على الجاني
- **المزور**: +2000 نقطة إذا حصل على أصوات جودة أكثر من الجاني

## الميزات المتقدمة

### وضع التدريب (Tutorial Mode) & الروبوتات
- **Training Flow:**
    1. يختار اللاعب "تدريب فردي" ويحدد دوره المفضل
    2. يملأ النظام الغرفة بـ7 بوتات ذكية تلقائياً
- **Manual Bot Auto-fill:**
    - زر "🤖 تعبئة بوتات" للمضيف لملء الغرفة بروبوتات
- **Bot AI:**
    - توليد سيناريوهات بواسطة GitHub Models API
    - تصويت ذكي على الجودة (تحليل الطول، التنوع، الترابط)
    - تصويت استراتيجي على الجاني بناءً على الدور والفريق

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
