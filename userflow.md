لقد قمت بإعداده بصيغتين:



صيغة Mermaid Code: (وهي كود يمكن تحويله لرسم بياني فعلي مباشرة باستخدام أدوات مثل Draw.io أو Mermaid Live Editor).



صيغة الشرح النصي المفصل: (ليسهل قراءته وفهمه بشرياً).



أولاً: المخطط البياني (Mermaid Syntax Diagram)

يمكنك نسخ هذا الكود وإعطاؤه للمطور، وسيفهم الهيكلية فوراً.



مقتطف الرمز



sequenceDiagram

&nbsp;   participant P as Player (Mobile)

&nbsp;   participant S as Server (Backend)

&nbsp;   participant H as Host (TV Screen)



&nbsp;   Note over P,H: المرحلة 1: الاتصال والردهة (Lobby)

&nbsp;   H->>S: Create Room

&nbsp;   S-->>H: Display Room Code (e.g. ABCD)

&nbsp;   P->>S: Join Room (Code + Name)

&nbsp;   S-->>H: Update Player List

&nbsp;   H->>S: Start Game Trigger



&nbsp;   Note over P,H: المرحلة 2: إعداد الجولة (Round Setup)

&nbsp;   loop Round Loop (3 Rounds)

&nbsp;       S->>S: Select Scenario \& Assign Roles

&nbsp;       S-->>H: Show Round Intro \& Title

&nbsp;       S-->>P: Send Role Data (Story/Keywords/Nothing)

&nbsp;       

&nbsp;       Note over P,H: المرحلة 3: الصياغة (Drafting)

&nbsp;       H->>H: Start Timer (90s)

&nbsp;       P->>P: Player types Answer

&nbsp;       opt If Player is SPY

&nbsp;           P->>S: Request "Peek" (Ability)

&nbsp;           S-->>P: Send Witness Answer Snippet

&nbsp;       end

&nbsp;       P->>S: Submit Answer

&nbsp;       S-->>H: Show "Answer Submitted" Icon



&nbsp;       Note over P,H: المرحلة 4: العرض والمواجهة (Presentation)

&nbsp;       S->>H: Display Answers (One by one or Pairs)

&nbsp;       opt If Player is DETECTIVE

&nbsp;           P->>S: Request "Scan" on specific Answer

&nbsp;           S-->>P: Return "Accuracy %"

&nbsp;       end

&nbsp;       

&nbsp;       Note over P,H: المرحلة 5: التصويت (Voting)

&nbsp;       H->>H: Show "Vote for Best Logic"

&nbsp;       P->>S: Submit Vote (Best Answer)

&nbsp;       H->>H: Show "Vote for Witness Identity"

&nbsp;       P->>S: Submit Vote (Who is the Witness?)

&nbsp;       

&nbsp;       Note over P,H: المرحلة 6: النتائج (Results)

&nbsp;       S->>S: Calculate Scores (Algorithm)

&nbsp;       S-->>H: Reveal Real Story \& Identities

&nbsp;       S-->>H: Update Leaderboard

&nbsp;   end



&nbsp;   Note over P,H: المرحلة 7: نهاية اللعبة (End Game)

&nbsp;   S-->>H: Show Final Winner \& Titles

&nbsp;   H->>S: Play Again / New Game

ثانياً: الشرح التفصيلي للتدفق (Step-by-Step Description)

هذا الجزء يشرح ما يحدث في كل "حارة" (Lane) خطوة بخطوة.



1\. مرحلة الدخول (Onboarding \& Lobby)

الشاشة الرئيسية (TV): تعرض زر "لعبة جديدة". عند الضغط، تتصل بالخادم وتطلب "رمز غرفة" (Room Code). تظهر شاشة الانتظار مع الرمز والأسماء المنضمة.



الهاتف (Mobile): يفتح اللاعب المتصفح، يدخل الرمز واسمه.



النظام (Server): يربط الهاتف بالغرفة ويرسل إشارة للشاشة الرئيسية لإظهار اسم اللاعب الجديد وأفاتار عشوائي.



2\. بداية الجولة (Round Initialization)

النظام:



يختار سيناريو من قاعدة البيانات.



يخلط الأدوار عشوائياً بين اللاعبين المتصلين.



يرسل "حزمة بيانات" (Data Packet) لكل هاتف حسب دوره (الشاهد يحصل على النص، المهندس يحصل على الكلمات، البقية يحصلون على العنوان).



الشاشة الرئيسية: تعرض "عنوان القضية" ومؤثرات صوتية تشويقية.



الهاتف: يهتز ويعرض للاعب دوره بوضوح ("أنت الشاهد"، "أنت جاسوس"... إلخ) مع التعليمات.



3\. مرحلة الكتابة (Input Phase)

الشاشة الرئيسية: تعرض عداداً تنازلياً (مثلاً 90 ثانية) وموسيقى توتر. تظهر أيقونات اللاعبين، وتتحول أيقونة اللاعب إلى "لون أخضر" عند إرساله الإجابة.



الهاتف:



يظهر مربع نص للكتابة.



زر القدرة (Action Button): يظهر فقط للجاسوس ("اختلاس النظر").



تدفق الجاسوس: عند ضغط الزر -> يرسل طلب للخادم -> الخادم يتحقق -> يرسل نص الشاهد للهاتف -> يظهر النص لمدة 3 ثوان ثم يختفي.



4\. مرحلة العرض والتحليل (Presentation Phase)

الشاشة الرئيسية: تعرض الإجابات. (يمكن عرضها بشكل ثنائي للمنافسة: إجابة A ضد إجابة B).



الهاتف (المحقق فقط):



تظهر له قائمة الإجابات المعروضة حالياً.



يختار إجابة واحدة ويضغط "تحليل".



يرسل الخادم النتيجة له فقط ("نسبة التطابق مع القصة: 80%").



5\. مرحلة التصويت (Voting Phase)

هذه المرحلة مقسمة لجزأين متتاليين:



أ. تصويت الجودة (Quality Vote):



الشاشة: "من صاحب التبرير الأقوى؟"



الهاتف: تظهر الإجابات (بدون أسماء أصحابها). يختار اللاعب إجابة.



قاعدة: لا يمكن للاعب التصويت لنفسه.



ب. تصويت الهوية (Identity Vote):



الشاشة: "من هو الشاهد الحقيقي؟"



الهاتف: تظهر قائمة أسماء اللاعبين.



يختار اللاعبون الشخص الذي يشكون فيه.



6\. المعالجة والنتائج (Processing \& Reveal)

النظام (Backend): يقوم بحساب النقاط بناءً على المعادلات (التي حددناها في الوثيقة السابقة).



الشاشة الرئيسية:



تعرض القصة الحقيقية.



تكشف من هو الشاهد (وهل نجح في خداعهم أم لا).



توزع النقاط بتأثيرات بصرية (Animations).



تعرض الترتيب الحالي (Leaderboard).



7\. الانتقال أو النهاية

النظام: يتحقق: هل وصلنا للجولة 3؟



نعم: الانتقال لشاشة "نهاية اللعبة" وتوزيع الألقاب.



لا: العودة للمرحلة رقم 2 (بداية جولة جديدة).



ملاحظات تقنية للفريق (Technical Notes for Flowchart):

حالة انقطاع الاتصال (Disconnect Handling):



أضف ملاحظة في المخطط: إذا انفصل لاعب أثناء "مرحلة الكتابة"، النظام يقوم تلقائياً بوضع إجابة افتراضية (مثال: "لقد صمت هذا اللاعب بشكل مريب...") لكي لا تتوقف اللعبة.



المؤقت (Timer Sync):



المؤقت الرسمي يكون في الخادم (Server-side Timer)، والهواتف والشاشة مجرد "عارضين" للوقت، لضمان أن الجميع ينتهي في نفس اللحظة.



هذا المخطط مع الكود المرفق سيوفر على المبرمجين ساعات من الأسئلة وسيجعلهم يفهمون البنية التحتية المطلوبة (Client-Server Architecture) فوراً.

