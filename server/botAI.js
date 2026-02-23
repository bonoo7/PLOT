/**
 * 🤖 محرك الذكاء الصناعي للبوتات - Bot AI Engine
 * 
 * يوفر خوارزميات ذكية لتصرفات البوتات:
 * - توليد إجابات واقعية بناءً على الدور (باستخدام DeepSeek AI)
 * - تحليل الإجابات وتصويت ذكي
 * - استخدام القدرات الخاصة
 */

const { TEAMS, ROLE_TYPES, getRoleInfo } = require('./roles');
const { generateAIAnswer } = require('./deepseekAI');

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
  // ⚡ Blitz Mode: Fill in the blank
  if (gameMode === 'BLITZ') {
      return generateBotBlankFill(role, scenario);
  }

  const roleInfo = getRoleInfo(role);
  
  if (!roleInfo) {
    console.error(`⚠️ دور غير معروف: ${role}`);
    return generateFallbackAnswer(role, scenario);
  }

  // محاولة استخدام DeepSeek AI
  try {
    const aiAnswer = await generateAIAnswer(role, roleInfo, scenario);
    
    if (aiAnswer) {
      console.log(`✅ AI Answer for ${roleInfo.nameAr}: ${aiAnswer.substring(0, 50)}...`);
      return aiAnswer;
    }
  } catch (error) {
    console.warn(`⚠️ فشل AI لـ ${roleInfo.nameAr}, استخدام Fallback`);
  }
  
  // Fallback: استخدام القوالب القديمة
  return generateFallbackAnswer(role, scenario);
}

/**
 * ⚡ Blitz Mode: توليد ملء فراغ للبوت
 */
function generateBotBlankFill(role, scenario) {
    const template = scenario.template;
    if (!template) return "سيناريو غير صالح";

    const parts = template.split('_____');
    if (parts.length <= 1) return template; // No blanks

    let fullAnswer = "";
    
    // We need to fill (parts.length - 1) blanks
    for (let i = 0; i < parts.length - 1; i++) {
        fullAnswer += parts[i];
        
        // Generate a word for this blank
        let word = "";
        
        // 1. Justice Team: Use Truth Keywords or Context
        if (role === ROLE_TYPES.SEER || role === ROLE_TYPES.DETECTIVE || role === ROLE_TYPES.WITNESS || role === ROLE_TYPES.MINISTER) {
            // Use a keyword if available, otherwise a generic plausible word
            word = scenario.keywords[i % scenario.keywords.length] || "شيء ما";
        } 
        
        // 2. Crime Team: Mix of Truth and Lies
        else if (role === ROLE_TYPES.CULPRIT || role === ROLE_TYPES.MASTERMIND || role === ROLE_TYPES.BENEFICIARY) {
            // 50% Truth (to blend in), 50% Trickster (to mislead)
            if (Math.random() > 0.5) {
                word = scenario.keywords[i % scenario.keywords.length] || "شيء";
            } else {
                word = scenario.tricksterWord || "شيء مريب";
            }
        } 
        
        // 3. Saboteur: Always Trickster Word
        else if (role === ROLE_TYPES.SABOTEUR) {
            word = scenario.tricksterWord || "فيل";
        }
        
        // 4. Citizen: Confused
        else {
            const randomWords = ["لا أعلم", "ربما", "شيء غريب", "نسيت"];
            word = randomWords[Math.floor(Math.random() * randomWords.length)];
        }
        
        fullAnswer += word;
    }
    
    // Add the last part
    fullAnswer += parts[parts.length - 1];
    
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
  const investigationPlayers = suspicions.filter(s => s.team === TEAMS.INVESTIGATION);
  
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

module.exports = {
  generateBotAnswer,
  analyzeSuspicion,
  calculateSimilarity,
  generateBotVote,
  generateQualityVote, // 🆕 التصويت على جودة السيناريو
  shouldUseAbility,
  addNaturalMistakes
};
