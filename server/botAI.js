/**
 * 🤖 محرك الذكاء الصناعي للبوتات - Bot AI Engine
 * 
 * يوفر خوارزميات ذكية لتصرفات البوتات:
 * - توليد إجابات واقعية بناءً على الدور (باستخدام GitHub Models AI)
 * - تحليل الإجابات وتصويت ذكي
 * - استخدام القدرات الخاصة
 */

const { TEAMS, ROLE_TYPES, getRoleInfo } = require('./roles');
const { generateAIAnswer } = require('./githubAI');

// ==================== قوالب الإجابات (Fallback) ====================
// تُستخدم فقط في حالة فشل DeepSeek API

const ANSWER_TEMPLATES = {
  // فريق الجريمة
  [ROLE_TYPES.CULPRIT]: [
    "أنا شاهدت كل شيء بوضوح، وكان {keywords}. ليس هناك شك في ذلك!",
    "القصة واضحة تماماً: {story}",
    "رأيت {keywords} وكان الموقف واضحاً جداً",
    "دعوني أخبركم بالتفاصيل: {story}",
    "كنت هناك وشاهدت {keywords} بأم عيني"
  ],
  
  [ROLE_TYPES.MASTERMIND]: [
    "أعتقد أن القصة أعقد مما تبدو... {keywords} تدل على تخطيط مسبق",
    "من الواضح أن هناك من يحرك الخيوط، {keywords} ليست صدفة",
    "التفاصيل تشير إلى {keywords} بوضوح، ولكن من المستفيد؟",
    "لا أذكر كل شيء لكن {keywords} كانت واضحة",
    "ربما {keywords} هي مفتاح الحل"
  ],
  
  [ROLE_TYPES.BENEFICIARY]: [
    "بصراحة، لا يهمني من الفاعل، لكن {keywords} مثيرة للاهتمام",
    "الخسائر واضحة، {keywords} تسببت في أضرار",
    "من منظور مادي، {keywords} هي النقطة الأهم",
    "لدي شكوك حول {keywords}... سأراقب أكثر",
    "الوضع غامض ولكن {keywords} واضحة نوعاً ما"
  ],
  
  [ROLE_TYPES.SABOTEUR]: [
    "بصراحة، رأيت {trickster} يطير في السماء!",
    "الموقف مضحك جداً... {trickster} كان رائعاً",
    "دعوني أخبركم عن {trickster} الذي ظهر فجأة",
    "أنا متأكد أن {trickster} هو السبب في كل شيء",
    "لا أحد يصدق لكن {trickster} كان هناك حقاً"
  ],
  
  // فريق العدالة
  [ROLE_TYPES.DETECTIVE]: [
    "بناءً على التحليل، أرى {keywords} كأدلة واضحة",
    "التحقيق يشير إلى {keywords} بدون شك",
    "الأدلة تؤكد {keywords}، يجب متابعة التحقيق",
    "من خبرتي، {keywords} هي المفتاح لحل القضية",
    "التفاصيل الدقيقة تكشف {keywords} بوضوح"
  ],
  
  [ROLE_TYPES.SEER]: [
    "لدي إحساس قوي بأن {story} هي الحقيقة",
    "الرؤية عندي واضحة: {keywords} هي الأساس",
    "بعد التفكير العميق، {keywords} هي الأكثر احتمالاً",
    "قلبي يخبرني أن {story} حدثت بالفعل",
    "لا يمكن إنكار {keywords}، إنها الحقيقة"
  ],
  
  [ROLE_TYPES.MINISTER]: [
    "كشخص مسؤول، أرى {keywords} وهي مثيرة للشك",
    "المصلحة العامة تتطلب التحقيق في {keywords}",
    "لدي معلومات تؤكد {keywords}",
    "شاهدت {keywords} بنفسي ويجب محاسبة الفاعل",
    "الوضع يتطلب الحزم مع {keywords}"
  ],
  
  [ROLE_TYPES.WITNESS]: [
    "كنت نائماً وقت الحادث ولا أعرف الكثير",
    "سمعت ضجة عن {keywords} ولكن لم أرَ بوضوح",
    "أظن أن {keywords} حدثت لكنني لست متأكداً",
    "لا علاقة لي بهذا، لكن {keywords} كانت واضحة",
    "كنت في مكان آخر، لكن سمعت عن {keywords}"
  ],
  
  [ROLE_TYPES.CITIZEN]: [
    "لا أعرف ماذا حدث بالضبط، لكن {keywords} غريبة",
    "أنا خائف، {keywords} مرعبة",
    "أتمنى أن ينتهي هذا الكابوس، {keywords} مقلقة",
    "من الفاعل؟ {keywords} لا تكفي للإدانة",
    "أنا مجرد مواطن، لكن {keywords} واضحة"
  ]
};

// ==================== كلمات ربط وحشو طبيعية ====================
const FILLER_WORDS = [
  "يعني", "بصراحة", "في الحقيقة", "على ما أظن", "ربما",
  "أعتقد أن", "من وجهة نظري", "بناءً على ما رأيت",
  "إذا سمحتم", "دعوني أقول", "الحقيقة أن"
];

const ENDINGS = [
  "وشكراً", "هذا رأيي", "أتمنى أن أكون واضحاً",
  "!", ".", "...", "والله أعلم"
];

// ==================== توليد الإجابات ====================

/**
 * توليد إجابة ذكية للبوت بناءً على دوره والسيناريو
 * يستخدم DeepSeek AI أولاً، ثم يعود للقوالب في حالة الفشل
 */
async function generateBotAnswer(role, scenario, otherAnswers = [], gameMode = 'CLASSIC') {
  const roleInfo = getRoleInfo(role);
  
  if (!roleInfo) {
    console.error(`⚠️ دور غير معروف: ${role}`);
    return generateFallbackAnswer(role, scenario);
  }

  // ⚡ Blitz Mode: جرّب GitHub AI أولاً، ثم الـ fallback المحلي
  if (gameMode === 'BLITZ') {
    try {
      const aiAnswer = await generateAIAnswer(role, roleInfo, scenario);
      if (aiAnswer) {
        console.log(`✅ AI Answer (BLITZ) for ${roleInfo.nameAr}`);
        return aiAnswer;
      }
    } catch (error) {
      console.warn(`⚠️ فشل AI في Blitz لـ ${roleInfo.nameAr}, استخدام Fallback`);
    }
    return generateBotBlankFill(role, scenario);
  }

  // محاولة استخدام GitHub Models AI لملء الفراغات
  try {
    const aiAnswer = await generateAIAnswer(role, roleInfo, scenario);
    
    if (aiAnswer) {
      console.log(`✅ AI Answer for ${roleInfo.nameAr}: ${aiAnswer.substring(0, 60)}...`);
      return aiAnswer;
    }
  } catch (error) {
    console.warn(`⚠️ فشل AI لـ ${roleInfo.nameAr}, استخدام Fallback`);
  }
  
  // Fallback: ملء الفراغات من القالب باستخدام الكلمات المفتاحية
  if (scenario.template) {
    return generateBotBlankFill(role, scenario);
  }
  return generateFallbackAnswer(role, scenario);
}

/**
 * ⚡ Blitz Mode: توليد ملء فراغ للبوت مع تنويع عشوائي لكل بوت
 * يحاول تكوين جمل مفيدة بدلاً من مجرد حشو كلمات
 */
function generateBotBlankFill(role, scenario) {
    const template = scenario.template;
    if (!template) return "سيناريو غير صالح";

    const parts = template.split('_____');
    if (parts.length <= 1) return template; // No blanks

    // 1. توسيع قائمة الكلمات لتشمل كلمات ربط وصفات ويافعة (Enhanced Diversity)
    const keywords = [...scenario.keywords];
    const adjectives = [
        "غامض", "سريع", "كبير", "مخيف", "غريب", "واضح", "صغير",
        "غريب الأطوار", "مريب", "مشبوه", "صارخ", "عميق", "خفيف",
        "ثقيل", "حاد", "ناعم", "قاسي", "لطيف"
    ];
    const actions = [
        "ركض", "اختفى", "ظهر", "صرخ", "همس", "هرب",
        "اقتحم", "انسحب", "اختبأ", "تسلل", "انطلق", "توقف"
    ];
    const conjunctions = [
        "مع", "ضد", "بواسطة", "من خلال", "بسبب", "بعد"
    ];
    
    // خلط الكلمات المفتاحية
    for (let i = keywords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keywords[i], keywords[j]] = [keywords[j], keywords[i]];
    }

    let fullAnswer = "";
    let usedKeywords = 0;
    
    for (let i = 0; i < parts.length - 1; i++) {
        fullAnswer += parts[i];
        
        let word = "";
        const remainingBlanks = (parts.length - 1) - i;
        
        // استراتيجية اختيار الكلمة حسب الدور (Enhanced Role Logic)
        
        // 🕵️‍♂️ فريق العدالة (يحاولون استخدام الكلمات الصحيحة)
        if ([ROLE_TYPES.SEER, ROLE_TYPES.DETECTIVE, ROLE_TYPES.MINISTER].includes(role)) {
            // العراف يعرف كل شيء تقريباً
            if (role === ROLE_TYPES.SEER && Math.random() < 0.85) {
                word = keywords[usedKeywords % keywords.length] || "الحقيقة";
                usedKeywords++;
            } 
            // المحقق يحاول الربط بحذر
            else if (role === ROLE_TYPES.DETECTIVE) {
                if (Math.random() < 0.7) {
                    word = keywords[usedKeywords % keywords.length] || "دليل";
                    usedKeywords++;
                } else {
                    word = adjectives[Math.floor(Math.random() * adjectives.length)];
                }
            }
            // الوزير رسمي وواضح
            else {
                if (Math.random() < 0.75) {
                    word = keywords[usedKeywords % keywords.length] || "واقعة";
                    usedKeywords++;
                } else {
                    word = actions[Math.floor(Math.random() * actions.length)];
                }
            }
        } 
        
        // 👁️ الشاهد (ذاكرة مشوشة وضبابية)
        else if (role === ROLE_TYPES.WITNESS) {
            if (Math.random() < 0.45) {
                const confused = [
                    "شخص ما", "شيء أسود", "حركة سريعة", "صوت عالي",
                    "ظل غريب", "همسة خافتة", "خطوات ثقيلة", "ضجة غريبة"
                ];
                word = confused[Math.floor(Math.random() * confused.length)];
            } else {
                word = keywords[usedKeywords % keywords.length];
                usedKeywords++;
            }
        }
        
        // 🎭 فريق الجريمة (مراوغة وتضليل)
        else if ([ROLE_TYPES.CULPRIT, ROLE_TYPES.MASTERMIND, ROLE_TYPES.BENEFICIARY].includes(role)) {
            // الجاني يتجنب الكلمات الدقيقة جداً ويستخدم التلميحات الكاذبة
            if (role === ROLE_TYPES.CULPRIT) {
                const evasive = [
                    "لا أحد", "مكان آخر", "وقت مختلف", "شخص غريب",
                    "قد لا يكون", "ربما", "أعتقد أنني", "لست متأكداً"
                ];
                word = Math.random() < 0.55 ? evasive[Math.floor(Math.random() * evasive.length)] : keywords[usedKeywords % keywords.length];
                if (word === keywords[usedKeywords % keywords.length]) usedKeywords++;
            }
            // العقل المدبر يخلط الأوراق بذكاء
            else if (role === ROLE_TYPES.MASTERMIND) {
                const misleading = [
                    "مؤامرة", "خطة", "اتفاق", "سر",
                    "استراتيجية", "حساب", "ترتيب", "توافق"
                ];
                word = Math.random() < 0.65 ? misleading[Math.floor(Math.random() * misleading.length)] : keywords[(usedKeywords + 1) % keywords.length];
            }
            // المستفيد يهتم بالمال/المكسب والفائدة
            else {
                const greedy = [
                    "نقود", "ثروة", "فرصة", "ذهب",
                    "فائدة", "مكسب", "حظ", "ملكية"
                ];
                word = Math.random() < 0.45 ? greedy[Math.floor(Math.random() * greedy.length)] : keywords[usedKeywords % keywords.length];
                if (word === keywords[usedKeywords % keywords.length]) usedKeywords++;
            }
        } 
        
        // 🧨 المخرب (كلمة الخداع + فوضى وفوضوية)
        else if (role === ROLE_TYPES.SABOTEUR) {
            // يجب أن يضع الكلمة المخادعة في مكان ما
            const mustPlaceTrickster = !fullAnswer.includes(scenario.tricksterWord) && remainingBlanks === 1;
            
            if (mustPlaceTrickster || Math.random() < 0.35) {
                word = scenario.tricksterWord || "فيل";
            } else {
                const chaos = [
                    "انفجار", "ضحك", "سقوط", "طيران",
                    "طير", "عاصفة", "زلزال", "ألعاب"
                ];
                word = chaos[Math.floor(Math.random() * chaos.length)];
            }
        }
        
        // 👤 مواطن (عشوائي مع توازن)
        else {
            const randomMix = [...keywords, ...adjectives, ...actions, "لا أعلم", "ربما", "أعتقد"];
            word = randomMix[Math.floor(Math.random() * randomMix.length)];
        }
        
        fullAnswer += word;
    }
    
    fullAnswer += parts[parts.length - 1];

    // Cap length to match AI output limits
    if (fullAnswer.length > 400) fullAnswer = fullAnswer.substring(0, 397) + '...';

    return fullAnswer;
}

/**
 * توليد إجابة من القوالب (Fallback)
 */
function generateFallbackAnswer(role, scenario) {
  const templates = ANSWER_TEMPLATES[role] || ANSWER_TEMPLATES[ROLE_TYPES.WITNESS];
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // استبدال المتغيرات
  let answer = template;
  
  if (answer.includes('{story}')) {
    answer = answer.replace('{story}', scenario.story);
  }
  
  if (answer.includes('{keywords}')) {
    const numKeywords = Math.random() > 0.5 ? 2 : 3;
    const selectedKeywords = scenario.keywords
      .slice(0, numKeywords)
      .join(' و ');
    answer = answer.replace('{keywords}', selectedKeywords);
  }
  
  if (answer.includes('{trickster}')) {
    answer = answer.replace('{trickster}', scenario.tricksterWord || 'شيء غريب');
  }
  
  // إضافة كلمات حشو أحياناً (10% احتمال فقط للتركيز)
  if (Math.random() < 0.1) {
    const filler = FILLER_WORDS[Math.floor(Math.random() * FILLER_WORDS.length)];
    answer = filler + "، " + answer;
  }
  
  // إضافة نهاية عشوائية (10% احتمال)
  if (Math.random() < 0.1) {
    const ending = ENDINGS[Math.floor(Math.random() * ENDINGS.length)];
    answer = answer + " " + ending;
  }
  
  // إضافة أخطاء طبيعية أحياناً (15% احتمال)
  if (Math.random() < 0.15) {
    answer = addNaturalMistakes(answer);
  }
  
  return answer;
}

/**
 * إضافة أخطاء طبيعية للنص (تكرار كلمة، نسيان همزة، إلخ)
 */
function addNaturalMistakes(text) {
  const mistakes = [
    // تكرار كلمة
    () => {
      const words = text.split(' ');
      if (words.length > 3) {
        const index = Math.floor(Math.random() * (words.length - 1));
        words.splice(index, 0, words[index]);
        return words.join(' ');
      }
      return text;
    },
    // نسيان همزة
    () => text.replace(/أ/g, 'ا').replace(/إ/g, 'ا'),
    // إضافة نقاط تفكير
    () => text.replace(/،/g, '... ')
  ];
  
  const mistake = mistakes[Math.floor(Math.random() * mistakes.length)];
  return mistake();
}

// ==================== تحليل الإجابات ====================

/**
 * تحليل إجابة وإعطاء نقاط شك (0-100)
 * كلما زادت النقاط، كلما كانت الإجابة أكثر شكاً
 */
function analyzeSuspicion(answer, scenario, role) {
  let suspicionScore = 0;
  
  // الإجابات القصيرة جداً مريبة (+20)
  if (answer.length < 30) {
    suspicionScore += 20;
  }
  
  // الإجابات الطويلة جداً قد تكون مبالغة (+10)
  if (answer.length > 200) {
    suspicionScore += 10;
  }
  
  // عدم ذكر أي كلمة من الكلمات المفتاحية مريب جداً (+40)
  const mentionsKeyword = scenario.keywords.some(k => answer.includes(k));
  if (!mentionsKeyword && role !== ROLE_TYPES.SABOTEUR) {
    suspicionScore += 40;
  }
  
  // ذكر كلمة المخرب في غير دور المخرب (+50)
  if (role !== ROLE_TYPES.SABOTEUR && answer.includes(scenario.tricksterWord)) {
    suspicionScore += 50;
  }
  
  // الجاني الذي يذكر القصة كاملة قد يكون واضحاً جداً (-10)
  if (role === ROLE_TYPES.CULPRIT && answer.includes(scenario.story)) {
    suspicionScore -= 10;
  }
  
  // الإجابات المتناقضة (+15)
  if (answer.includes('لا أعرف') && answer.includes('بوضوح')) {
    suspicionScore += 15;
  }
  
  // الإجابات الدفاعية (+15)
  if (answer.includes('بريء') || answer.includes('لا علاقة لي')) {
    suspicionScore += 15;
  }
  
  // التأكد من عدم تجاوز الحدود
  return Math.max(0, Math.min(100, suspicionScore));
}

/**
 * حساب التشابه بين إجابتين (0-100)
 */
function calculateSimilarity(answer1, answer2) {
  const words1 = new Set(answer1.toLowerCase().split(/\s+/));
  const words2 = new Set(answer2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return Math.round((intersection.size / union.size) * 100);
}

// ==================== التصويت الذكي ====================

/**
 * اختيار من سيصوت له البوت بناءً على التحليل
 */
function generateBotVote(botRole, botTeam, players, answers, scenario, difficulty = 'medium') {
  const otherPlayers = players.filter(p => p.id !== answers.find(a => a.role === botRole)?.id);
  
  // تحليل كل لاعب
  const suspicions = otherPlayers.map(player => {
    const answer = answers.find(a => a.id === player.id)?.answer || '';
    const suspicion = analyzeSuspicion(answer, scenario, player.role);
    
    return {
      playerId: player.id,
      playerName: player.name,
      role: player.role,
      team: player.team,
      suspicion: suspicion,
      answer: answer
    };
  });
  
  // استراتيجية التصويت حسب الدور
  let qualityTarget = null;
  let identityTarget = null;
  
  if (botTeam === TEAMS.CRIME) {
    // فريق الجريمة: حماية بعضهم، اتهام التحقيق
    qualityTarget = voteForInvestigationTeam(suspicions, difficulty);
    identityTarget = voteToProtectCrime(suspicions, difficulty);
    
  } else if (botTeam === TEAMS.JUSTICE) {
    // فريق التحقيق: البحث عن الجاني
    qualityTarget = voteForMostSuspicious(suspicions, difficulty);
    identityTarget = voteForCulprit(suspicions, difficulty);
    
  } else {
    // المخرب: عشوائي تماماً لإثارة الفوضى
    qualityTarget = suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
    identityTarget = suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
  }
  
  return {
    quality: qualityTarget || otherPlayers[0].id,
    identity: identityTarget || otherPlayers[Math.floor(Math.random() * otherPlayers.length)].id
  };
}

/**
 * 📊 Quality Vote - التصويت على أفضل سيناريو (بدون معرفة الكاتب)
 * يستخدم في المرحلة الأولى من التصويت
 * 
 * @param {Array<string>} scenarios - قائمة السيناريوهات (النصوص فقط)
 * @returns {number} - index السيناريو المختار
 */
function generateQualityVote(scenarios) {
  if (!scenarios || scenarios.length === 0) return 0;
  
  // تحليل جودة كل سيناريو بناءً على معايير موضوعية
  const qualities = scenarios.map((scenario, index) => {
    if (!scenario) return { index, score: 0 };
    
    let score = 0;
    
    // 1. الطول (سيناريو أطول = أكثر تفصيلاً)
    const length = scenario.length;
    if (length > 200) score += 30;
    else if (length > 100) score += 20;
    else if (length > 50) score += 10;
    
    // 2. التنوع اللغوي (كلمات مختلفة)
    const words = scenario.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const diversity = uniqueWords.size / words.length;
    score += diversity * 20;
    
    // 3. وجود تفاصيل (أرقام، أسماء، أماكن)
    const hasNumbers = /\d+/.test(scenario);
    const hasDetails = /في|عند|بجانب|أمام|خلف|فوق/.test(scenario);
    if (hasNumbers) score += 10;
    if (hasDetails) score += 15;
    
    // 4. الترابط (وجود روابط منطقية)
    const hasConnectors = /لأن|بسبب|ثم|بعد ذلك|لذلك|وبالتالي/.test(scenario);
    if (hasConnectors) score += 15;
    
    // 5. الثقة (جمل تأكيدية)
    const hasConfidence = /بالتأكيد|واضح|بوضوح|تماماً|حقاً/.test(scenario);
    if (hasConfidence) score += 10;
    
    // عشوائية بسيطة (±20%) لتنويع الاختيار
    score = score * (0.8 + Math.random() * 0.4);
    
    return { index, score };
  });
  
  // اختيار السيناريو بأعلى نقاط
  const best = qualities.sort((a, b) => b.score - a.score)[0];
  return best.index;
}

/**
 * التصويت للاعب الأكثر شكاً (فريق التحقيق)
 */
function voteForMostSuspicious(suspicions, difficulty) {
  if (difficulty === 'easy') {
    // سهل: عشوائي إلى حد كبير
    return Math.random() < 0.3 
      ? suspicions.sort((a, b) => b.suspicion - a.suspicion)[0]?.playerId
      : suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
  }
  
  if (difficulty === 'hard') {
    // صعب: دائماً يختار الأكثر شكاً
    return suspicions.sort((a, b) => b.suspicion - a.suspicion)[0]?.playerId;
  }
  
  // متوسط: 70% الأكثر شكاً، 30% عشوائي
  return Math.random() < 0.7
    ? suspicions.sort((a, b) => b.suspicion - a.suspicion)[0]?.playerId
    : suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
}

/**
 * التصويت للجاني المحتمل (فريق التحقيق)
 */
function voteForCulprit(suspicions, difficulty) {
  // البحث عن اللاعبين الأكثر شكاً من فريق الجريمة
  const crimeSuspects = suspicions
    .filter(s => s.team === TEAMS.CRIME)
    .sort((a, b) => b.suspicion - a.suspicion);
  
  if (crimeSuspects.length === 0) {
    return suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
  }
  
  if (difficulty === 'easy') {
    return Math.random() < 0.2
      ? crimeSuspects[0]?.playerId
      : suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
  }
  
  if (difficulty === 'hard') {
    return crimeSuspects[0]?.playerId;
  }
  
  // متوسط: 50% الأكثر شكاً من فريق الجريمة
  return Math.random() < 0.5
    ? crimeSuspects[0]?.playerId
    : suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
}

/**
 * التصويت لفريق التحقيق (فريق الجريمة يحاول إرباكهم)
 */
function voteForInvestigationTeam(suspicions, difficulty) {
  const investigationPlayers = suspicions.filter(s => s.team === TEAMS.JUSTICE);
  
  if (investigationPlayers.length === 0) {
    return suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
  }
  
  if (difficulty === 'easy') {
    return Math.random() < 0.3
      ? investigationPlayers[Math.floor(Math.random() * investigationPlayers.length)].playerId
      : suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
  }
  
  // متوسط وصعب: يستهدف فريق التحقيق دائماً
  return investigationPlayers[Math.floor(Math.random() * investigationPlayers.length)].playerId;
}

/**
 * حماية فريق الجريمة (تجنب التصويت لهم)
 */
function voteToProtectCrime(suspicions, difficulty) {
  const nonCrimePlayers = suspicions.filter(s => s.team !== TEAMS.CRIME);
  
  if (nonCrimePlayers.length === 0) {
    return suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
  }
  
  if (difficulty === 'easy') {
    return Math.random() < 0.5
      ? nonCrimePlayers[Math.floor(Math.random() * nonCrimePlayers.length)].playerId
      : suspicions[Math.floor(Math.random() * suspicions.length)].playerId;
  }
  
  // متوسط وصعب: لا يصوت أبداً لفريق الجريمة
  return nonCrimePlayers[Math.floor(Math.random() * nonCrimePlayers.length)].playerId;
}

// ==================== القدرات الخاصة ====================

/**
 * تحديد إذا كان البوت سيستخدم قدرته (احتمالية)
 */
function shouldUseAbility(role, roundNumber, difficulty = 'medium') {
  const roleInfo = getRoleInfo(role);
  if (!roleInfo?.ability) return false;
  
  // احتمالية استخدام القدرة حسب الصعوبة
  const usageChance = {
    easy: 0.2,    // 20% فرصة
    medium: 0.5,  // 50% فرصة
    hard: 0.8     // 80% فرصة
  }[difficulty] || 0.5;
  
  return Math.random() < usageChance;
}

// ==================== التصدير ====================

/**
 * 🎯 التصويت الذكي على الجاني — يحترم قاعدة المعرفة المحدودة
 * كل بوت يصوت فقط بناءً على ما يُسمح له معرفته
 *
 * @param {Object} botKnowledge - { myId, myRole, myTeam, knownCrimeTeam[], knownDetectiveId, knownBeneficiaryId, investigationResult }
 * @param {Array}  playersPublic - [{ id, name }] — بدون role أو team
 * @param {Object} answers - { playerId: answerText }
 * @param {Object} scenario - السيناريو الحالي (keywords, tricksterWord…)
 */
function generateSmartCulpritVote(botKnowledge, playersPublic, answers, scenario) {
  const { myId, myRole, myTeam, knownCrimeTeam = [], knownDetectiveId, knownBeneficiaryId, investigationResult } = botKnowledge;

  // استبعاد نفسي من القائمة
  const candidates = playersPublic.filter(p => p.id !== myId);
  if (candidates.length === 0) return null;

  // 1. حساب مستوى الشك لكل لاعب بناءً على إجابته
  const suspicions = candidates.map(p => {
    const text = answers[p.id] || "";
    let score = analyzeSuspicion(text, scenario, null); // تحليل النص فقط
    return { playerId: p.id, suspicion: score };
  });

  // ترتيب المرشحين من الأكثر شكاً للأقل
  suspicions.sort((a, b) => b.suspicion - a.suspicion);

  // 2. منطق التصويت حسب الدور (Role-Based Logic)

  // 🕵️‍♂️ المحقق (Detective)
  if (myRole === ROLE_TYPES.DETECTIVE) {
    // إذا فحص شخصاً ووجده من فريق الجريمة، يصوت له فوراً
    if (investigationResult && investigationResult.targetTeam === TEAMS.CRIME) {
      // (إلا إذا كان هناك تخريب، النتيجة قد تكون خاطئة، لكن المحقق يثق بها)
      console.log(`🕵️ Detective found Crime Team member: ${investigationResult.targetName}`);
      return investigationResult.targetId;
    }
    // إذا فحص شخصاً ووجده بريئاً، يتجنب التصويت له
    if (investigationResult && investigationResult.targetTeam === TEAMS.JUSTICE) {
       // يختار الأكثر شكاً من الباقين (غير المفحوص)
       const others = suspicions.filter(s => s.playerId !== investigationResult.targetId);
       return others.length > 0 ? others[0].playerId : suspicions[0].playerId;
    }
  }

  // 🧠 العقل المدبر (Mastermind)
  if (myRole === ROLE_TYPES.MASTERMIND) {
    // يعرف كل فريق الجريمة، لذا يصوت لأي شخص *ليس* منهم (لتشتيت الانتباه)
    // يفضل التصويت للمحقق إذا كان معروفاً له (عن طريق الوزير مثلاً - لو أضفنا ميكانيكا تواصل)
    // حالياً: يصوت للأكثر شكاً من الأبرياء
    const innocentSuspects = suspicions.filter(s => !knownCrimeTeam.includes(s.playerId));
    if (innocentSuspects.length > 0) {
        // يصوت للأكثر شكاً بينهم ليبدو كمواطن صالح
        return innocentSuspects[0].playerId;
    }
  }

  // 📜 الوزير (Minister)
  if (myRole === ROLE_TYPES.MINISTER) {
    // يعرف المستفيد (Beneficiary) والمحقق (Detective)
    // هدفه القضاء على المستفيد (لأنه من فريق الجريمة)
    if (knownBeneficiaryId) {
        // يصوت للمستفيد فوراً (بنسبة عالية)
        if (Math.random() < 0.9) return knownBeneficiaryId;
    }
    // يحاول حماية المحقق (يتجنب التصويت له)
    if (knownDetectiveId) {
        const others = suspicions.filter(s => s.playerId !== knownDetectiveId);
        return others.length > 0 ? others[0].playerId : suspicions[0].playerId;
    }
  }

  // 🎭 الجاني (Culprit)
  if (myRole === ROLE_TYPES.CULPRIT) {
    // يعرف القصة كاملة. يحاول التصويت لأي شخص يهدده (من ذكر كلمات مفتاحية صحيحة)
    // أو يصوت عشوائياً لتشتيت الانتباه.
    // استراتيجية: صوت لمن يشك فيه الجميع (الأعلى شكاً) لينجو بنفسه
    return suspicions[0].playerId; 
  }

  // 🧨 المخرب (Saboteur) & 💰 المستفيد (Beneficiary)
  if (myTeam === TEAMS.CRIME) {
    // يعرفون الجاني؟ لا (في القواعد الافتراضية لا يعرفون إلا إذا كان الماستر مايند)
    // لكن يعرفون الماستر مايند (إذا أضفنا ذلك).
    // استراتيجية عامة: صوت لأحد أعضاء فريق العدالة (عشوائي أو الأكثر شكاً)
    // في غياب معلومات، يصوتون للأعلى شكاً مثل الجميع ليبدوا طبيعيين
    return suspicions[0].playerId;
  }

  // 👁️ الشاهد (Witness) & 🔮 العراف (Seer) & 👤 المواطن (Citizen)
  // يصوتون بناءً على الشك في النص فقط
  return suspicions[0].playerId;
}



/**
 * 🎯 التصويت الذكي على الجودة — يحترم قاعدة المعرفة المحدودة
 */
function generateSmartQualityVote(botKnowledge, playersPublic, answers, scenario) {
  const { myId, myRole, knownCrimeTeam = [] } = botKnowledge;

  // 1. تحليل جودة النصوص (للجميع)
  const scenarios = playersPublic.map((p, index) => {
    if (p.id === myId) return { index, score: -1000, playerId: p.id }; // لا تصوت لنفسك
    
    let score = 0;
    const text = answers[p.id] || "";
    
    // معايير الجودة الأساسية
    if (text.length > 50) score += 20;
    if (text.length > 100) score += 10;
    
    // التنوع
    const uniqueWords = new Set(text.split(/\s+/));
    if (uniqueWords.size > 10) score += 10;
    
    // كلمات مفتاحية (للجودة)
    const hasKeywords = scenario.keywords.some(k => text.includes(k));
    if (hasKeywords) score += 15;
    
    // عشوائية
    score += Math.random() * 20;
    
    return { index, score, playerId: p.id };
  });

  // 2. تعديلات بناءً على الدور والمعرفة
  if (myRole === ROLE_TYPES.MASTERMIND && knownCrimeTeam.length > 0) {
    // العقل المدبر: يفضل التصويت لأعضاء فريقه (+50 نقطة) لدعمهم في النقاط
    scenarios.forEach(s => {
      if (knownCrimeTeam.includes(s.playerId)) {
        s.score += 50;
      }
    });
  }

  else if (myRole === ROLE_TYPES.CULPRIT) {
    // الجاني: يتجنب التصويت لمن كشف القصة الحقيقية بدقة عالية
    scenarios.forEach(s => {
      const text = answers[s.playerId] || "";
      const keywordCount = scenario.keywords.filter(k => text.includes(k)).length;
      if (keywordCount > 2) s.score -= 20; // يعاقب من يكشف الحقيقة
    });
  }

  // 3. اختيار الأعلى نقاطاً
  scenarios.sort((a, b) => b.score - a.score);
  return scenarios[0].index;
}

module.exports = {
  generateBotAnswer,
  analyzeSuspicion,
  calculateSimilarity,
  generateBotVote,
  generateQualityVote,
  generateSmartCulpritVote,
  generateSmartQualityVote, // 🆕
  shouldUseAbility,
  addNaturalMistakes
};
