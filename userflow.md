لقد قمت بإعداده بصيغتين:



صيغة Mermaid Code: (وهي كود يمكن تحويله لرسم بياني فعلي مباشرة باستخدام أدوات مثل Draw.io أو Mermaid Live Editor).



صيغة الشرح النصي المفصل: (ليسهل قراءته وفهمه بشرياً).



أولاً: المخطط البياني (Mermaid Syntax Diagram)

يمكنك نسخ هذا الكود وإعطاؤه للمطور، وسيفهم الهيكلية فوراً.



مقتطف الرمز



sequenceDiagram

   participant P as Player (Mobile)

   participant S as Server (Backend)

   participant H as Host (TV Screen)

   Note over P,H: المرحلة 1: الاتصال والردهة (Lobby)

   H->>S: Create Room

   S-->>H: Display Room Code (e.g. ABCD)

   P->>S: Join Room (Code + Name)

   S-->>H: Update Player List

   H->>S: Start Game Trigger

   Note over P,H: المرحلة 2: إعداد الجولة (Round Setup)

   loop Round Loop (3 Rounds)

       S->>S: Select Scenario & Assign Roles (Justice/Crime)

       S-->>H: Show Round Intro & Title

       S-->>P: Send Role Data & Secret Info

       Note over P,H: المرحلة 3: الصياغة (Drafting)

       H->>H: Start Timer (90s)

       P->>P: Player types Scenario

       opt Ability Usage (Saboteur/Detective)
           P->>S: Select Target (Queued)
           S-->>P: Acknowledge (Result Pending)
       end

       opt Ability Usage (Witness/Seer)
           P->>S: Use Instant Ability
           S-->>P: Show Result (Keywords/Story)
       end

       P->>S: Submit Answer

       S-->>H: Show "Answer Submitted" Icon

       Note over P,H: المرحلة 4: التصويت على الجودة (Quality Voting)

       S->>H: Display Answers (Anonymous)

       P->>S: Vote for Best Scenario

       Note over P,H: المرحلة 5: العرض التشويقي (Dramatic Reveal)

       S->>H: Auto-Reveal Scenarios + Voters + Authors

       Note over P,H: المرحلة 6: النقاش (Discussion)

       S->>P: Emit Detective Results (Start of Discussion)

       H->>H: Start Timer (120s)

       P->>P: Discuss & Accuse

       Note over P,H: المرحلة 7: التصويت على الجاني (Culprit Voting)

       H->>H: Show "Who is the Culprit?"

       P->>S: Submit Vote (Named Scenarios)

       Note over P,H: المرحلة 8: النتائج (Results)

       S->>S: Calculate Elimination & Scores

       S-->>H: Show Outcome (Justice Wins/Crime Wins/Continue)

       S-->>H: Update Leaderboard

   end

   Note over P,H: المرحلة 9: نهاية اللعبة (End Game)

   S-->>H: Show Final Winner & Titles

   H->>S: Play Again / New Game

ثانياً: الشرح التفصيلي للتدفق (Step-by-Step Description)

1. مرحلة الدخول (Onboarding & Lobby)
الشاشة الرئيسية (TV): تعرض زر "لعبة جديدة". عند الضغط، تتصل بالخادم وتطلب "رمز غرفة" (Room Code). تظهر شاشة الانتظار مع الرمز والأسماء المنضمة.
الهاتف (Mobile): يفتح اللاعب المتصفح، يدخل الرمز واسمه.
النظام (Server): يربط الهاتف بالغرفة ويرسل إشارة للشاشة الرئيسية لإظهار اسم اللاعب الجديد.

2. بداية الجولة (Round Initialization)
النظام:
يختار سيناريو من قاعدة البيانات.
يخلط الأدوار عشوائياً بين اللاعبين المتصلين (فريق العدالة ضد فريق الجريمة).
يرسل "حزمة بيانات" (Data Packet) لكل هاتف حسب دوره.
الشاشة الرئيسية: تعرض "عنوان القضية".
الهاتف: يعرض بطاقة الدور ("أنت المحقق"، "أنت الجاني"... إلخ) مع المعلومات السرية.

3. مرحلة الكتابة (Drafting Phase)
الشاشة الرئيسية: تعرض عداداً تنازلياً (90 ثانية) وحالة اللاعبين (Waiting/Submitted).
الهاتف:
يظهر مربع نص للكتابة.
تظهر أزرار القدرات الخاصة (للمحقق، المخرب، الشاهد، إلخ).
يمكن للاعبين استخدام القدرات هنا، لكن بعض النتائج (مثل المحقق) تتأجل.

4. مرحلة التصويت على الجودة (Quality Voting)
الشاشة الرئيسية: تعرض السيناريوهات بدون أسماء.
الهاتف: يصوت اللاعب لأفضل سيناريو.

5. العرض التشويقي (Dramatic Reveal)
الشاشة الرئيسية: تقوم تلقائياً بعرض النتائج بشكل متتابع ومثير (السيناريو -> المصوتين -> الكاتب).

6. مرحلة النقاش (Discussion Phase)
النظام: يرسل نتيجة الفحص للمحقق (فقط في هذه اللحظة).
اللاعبون: يتناقشون بناءً على المعلومات المكتشفة والسيناريوهات.

7. التصويت على الجاني (Culprit Voting)
الشاشة الرئيسية: تطلب تحديد الجاني.
الهاتف: تظهر قائمة بجميع اللاعبين وسيناريوهاتهم.
الإقصاء: اللاعب الذي يحصل على أعلى الأصوات يتم إقصاؤه (تحسب النتيجة لفريقه أو ضده).

8. المعالجة والنتائج (Processing & Reveal)
النظام (Backend): يقوم بحساب النقاط وتحديد الفائز بالجولة (أو استمرارها).
الشاشة الرئيسية: تعرض النتيجة النهائية للجولة وتوزيع النقاط.

9. الانتقال أو النهاية
النظام: يتحقق: هل وصلنا للجولة 3؟
نعم: الانتقال لشاشة "نهاية اللعبة".
لا: العودة للمرحلة رقم 2 (بداية جولة جديدة).

