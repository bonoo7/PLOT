// تعريفات الأدوار الجديدة - نظام الفريقين
// Version 2.0 - Team-based Roles System

const TEAMS = {
    CRIME: 'CRIME',           // فريق الجريمة
    INVESTIGATION: 'INVESTIGATION', // فريق التحقيق
    NEUTRAL: 'NEUTRAL'        // محايد
};

const ROLE_TYPES = {
    // فريق الجريمة
    CULPRIT: 'CULPRIT',           // الجاني (كان: WITNESS)
    FORGER: 'FORGER',             // المزور (كان: ARCHITECT)
    INFILTRATOR: 'INFILTRATOR',   // المخترق (كان: SPY)
    ACCOMPLICE: 'ACCOMPLICE',     // الشريك (نفس الاسم)
    LAWYER: 'LAWYER',             // المحامي (نفس الاسم)
    
    // فريق التحقيق
    CHIEF_DETECTIVE: 'CHIEF_DETECTIVE', // المحقق الرئيسي (كان: DETECTIVE)
    ANALYST: 'ANALYST',                 // المحلل (جديد)
    OFFICER: 'OFFICER',                 // الضابط (جديد)
    WITNESS: 'WITNESS',                 // الشاهد المحايد (كان: CITIZEN)
    
    // محايد
    SABOTEUR: 'SABOTEUR'        // المخرب (كان: TRICKSTER)
};

const ROLES = {
    // ============================================
    // 🔴 فريق الجريمة (Criminal Syndicate)
    // ============================================
    
    [ROLE_TYPES.CULPRIT]: {
        id: ROLE_TYPES.CULPRIT,
        nameAr: 'الجاني',
        nameEn: 'The Culprit',
        team: TEAMS.CRIME,
        emoji: '🎭',
        description: 'المجرم الحقيقي الذي يعرف تفاصيل الجريمة كاملة',
        goal: 'اكتب الحقيقة بأسلوب غامض دون أن ينكشف أمرك',
        information: 'القصة الكاملة',
        ability: {
            name: 'الإنكار المقنع',
            nameEn: 'Convincing Denial',
            description: 'يمكنك رؤية من صوت ضدك في الوقت الفعلي أثناء التصويت',
            usage: 'تلقائي أثناء مرحلة التصويت',
            cooldown: 0
        },
        scoring: {
            notCaught: 2000,        // إذا لم يُكتشف
            caughtPenalty: -0.6,    // خصم 60% من النقاط
            teamBonus: 2500          // مكافأة جماعية للفريق
        },
        priority: 1,  // أعلى أولوية (يتم تعيينه أولاً)
        minPlayers: 3
    },
    
    [ROLE_TYPES.FORGER]: {
        id: ROLE_TYPES.FORGER,
        nameAr: 'المزور',
        nameEn: 'The Forger',
        team: TEAMS.CRIME,
        emoji: '🧩',
        description: 'خبير تزييف يبني قصة مقنعة من أجزاء متفرقة',
        goal: 'ابنِ قصة متماسكة باستخدام الكلمات المفتاحية لتخدع المحققين',
        information: '3 كلمات مفتاحية من القصة',
        ability: {
            name: 'التركيب الذكي',
            nameEn: 'Smart Assembly',
            description: 'احصل على كلمة إضافية (رابعة) من القصة بعد 60 ثانية',
            usage: 'تلقائي بعد دقيقة واحدة من بدء الكتابة',
            cooldown: 0
        },
        scoring: {
            outperformCulprit: 2000,  // إذا حصل على أصوات ≥ الجاني
            teamBonus: 500              // مكافأة للفريق
        },
        priority: 2,
        minPlayers: 4
    },
    
    [ROLE_TYPES.INFILTRATOR]: {
        id: ROLE_TYPES.INFILTRATOR,
        nameAr: 'المخترق',
        nameEn: 'The Infiltrator',
        team: TEAMS.CRIME,
        emoji: '🕵️',
        description: 'جاسوس متخفي داخل فريق التحقيق',
        goal: 'تجسس على الجاني وانسخ إجابته لتبدو كأنك تعرف الحقيقة',
        information: 'لا شيء (يجب أن يتجسس)',
        ability: {
            name: 'عين الصقر',
            nameEn: 'Eagle Eye',
            description: 'شاهد ما يكتبه الجاني في الوقت الفعلي (30% مشوش) لمدة 5 ثوان',
            usage: 'اضغط الزر أثناء مرحلة الكتابة (مرة واحدة)',
            cooldown: 1
        },
        scoring: {
            closeToTarget: 1500,  // إذا حصل على أصوات قريبة من الجاني (فارق ≤1)
            useAbility: 300       // مكافأة لاستخدام القدرة
        },
        priority: 3,
        minPlayers: 5
    },
    
    [ROLE_TYPES.ACCOMPLICE]: {
        id: ROLE_TYPES.ACCOMPLICE,
        nameAr: 'الشريك',
        nameEn: 'The Accomplice',
        team: TEAMS.CRIME,
        emoji: '🤝',
        description: 'شريك الجاني السري الذي يحميه ويدافع عنه',
        goal: 'احمِ الجاني وشتت انتباه المحققين عنه',
        information: 'اسم الجاني ودوره',
        ability: {
            name: 'الحماية الصامتة',
            nameEn: 'Silent Protection',
            description: 'أرسل تنبيه سري للجاني (20 حرف كحد أقصى)',
            usage: 'في أي وقت أثناء اللعب (مرة واحدة)',
            cooldown: 1
        },
        scoring: {
            culpritSurvives: 1500,  // إذا نجا الجاني
            penalty: -0.3            // خصم 30% إذا كُشف الجاني
        },
        priority: 4,
        minPlayers: 6
    },
    
    [ROLE_TYPES.LAWYER]: {
        id: ROLE_TYPES.LAWYER,
        nameAr: 'المحامي',
        nameEn: 'The Lawyer',
        team: TEAMS.CRIME,
        emoji: '⚖️',
        description: 'محامي دفاع يحمي موكله من الاتهامات',
        goal: 'دافع عن موكلك واحمه من الكشف',
        information: 'اسم الموكل (يتم اختياره عشوائياً من فريق الجريمة)',
        ability: {
            name: 'الدفاع القانوني',
            nameEn: 'Legal Defense',
            description: 'ألغِ تصويت واحد ضد موكلك',
            usage: 'في مرحلة النتائج قبل الكشف (مرة واحدة)',
            cooldown: 1
        },
        scoring: {
            clientSaved: 2000,  // إذا نجا الموكل من الاتهام
            abilityUsed: 500    // مكافأة لاستخدام القدرة
        },
        priority: 5,
        minPlayers: 7
    },
    
    // ============================================
    // 🔵 فريق التحقيق (Investigation Bureau)
    // ============================================
    
    [ROLE_TYPES.CHIEF_DETECTIVE]: {
        id: ROLE_TYPES.CHIEF_DETECTIVE,
        nameAr: 'المحقق الرئيسي',
        nameEn: 'The Chief Detective',
        team: TEAMS.INVESTIGATION,
        emoji: '🔍',
        description: 'قائد فريق التحقيق المسؤول عن كشف الجاني',
        goal: 'اكتشف من هو الجاني واكشف الحقيقة',
        information: 'عنوان القضية فقط',
        ability: {
            name: 'الاستجواب المكثف',
            nameEn: 'Intensive Interrogation',
            description: 'افحص إجابتين لمعرفة نسبة دقتهما (دقة عالية = مشبوه)',
            usage: 'اختر لاعبَين أثناء مرحلة التصويت',
            cooldown: 1
        },
        scoring: {
            foundCulprit: 2500,      // إذا اختار الجاني بشكل صحيح
            wrongChoice: -800,        // خصم إذا أخطأ
            teamBonus: 2000,          // مكافأة جماعية للفريق
            teamBonusExtra: 1500      // مكافأة إضافية للمحقق
        },
        priority: 2,
        minPlayers: 3
    },
    
    [ROLE_TYPES.ANALYST]: {
        id: ROLE_TYPES.ANALYST,
        nameAr: 'المحلل',
        nameEn: 'The Analyst',
        team: TEAMS.INVESTIGATION,
        emoji: '🕵️‍♀️',
        description: 'خبير تحليل سلوكي متخصص في كشف الأنماط',
        goal: 'حلل الإجابات واكتشف من نسخ من',
        information: 'عنوان القضية فقط',
        ability: {
            name: 'قراءة الأنماط',
            nameEn: 'Pattern Reading',
            description: 'قارن بين إجابتين لمعرفة عدد الكلمات المشتركة',
            usage: 'اختر إجابتين أثناء مرحلة العرض',
            cooldown: 1
        },
        scoring: {
            helpedFind: 1000,    // إذا صوت للجاني بشكل صحيح
            abilityUsed: 400     // مكافأة لاستخدام القدرة
        },
        priority: 6,
        minPlayers: 7
    },
    
    [ROLE_TYPES.OFFICER]: {
        id: ROLE_TYPES.OFFICER,
        nameAr: 'الضابط',
        nameEn: 'The Officer',
        team: TEAMS.INVESTIGATION,
        emoji: '🎖️',
        description: 'ضابط ميداني يلاحظ التفاصيل الدقيقة',
        goal: 'راقب التفاصيل الصغيرة لكشف الجاني',
        information: 'عنوان القضية فقط',
        ability: {
            name: 'الملاحظة الدقيقة',
            nameEn: 'Keen Observation',
            description: 'شاهد وقت إرسال كل إجابة (الجاني عادة يرسل سريعاً)',
            usage: 'تلقائي قبل التصويت',
            cooldown: 0
        },
        scoring: {
            foundCulprit: 800,   // إذا صوت للجاني بشكل صحيح
            abilityBonus: 300    // مكافأة لاستخدام القدرة
        },
        priority: 7,
        minPlayers: 8
    },
    
    [ROLE_TYPES.WITNESS]: {
        id: ROLE_TYPES.WITNESS,
        nameAr: 'الشاهد المحايد',
        nameEn: 'The Witness',
        team: TEAMS.INVESTIGATION,
        emoji: '👤',
        description: 'شاهد عيان محايد يبحث عن الحقيقة',
        goal: 'حلل بصدق وحاول كشف الجاني',
        information: 'لا شيء (مراقب محايد)',
        ability: {
            name: 'الشهادة الصادقة',
            nameEn: 'Honest Testimony',
            description: 'احصل على مكافأة مضاعفة إذا صوّت للجاني بشكل صحيح',
            usage: 'تلقائي',
            cooldown: 0
        },
        scoring: {
            foundCulprit: 1200,  // مضاعف من 600
            baseVote: 300        // نقاط أساسية للتصويت
        },
        priority: 8,
        minPlayers: 3
    },
    
    // ============================================
    // ⚪ الأدوار المحايدة (Neutral)
    // ============================================
    
    [ROLE_TYPES.SABOTEUR]: {
        id: ROLE_TYPES.SABOTEUR,
        nameAr: 'المخرب',
        nameEn: 'The Saboteur',
        team: TEAMS.NEUTRAL,
        emoji: '😈',
        description: 'شخص فوضوي يحاول إفشال كلا الفريقين',
        goal: 'أدخل الكلمة الدخيلة بطريقة مضحكة واخدع الجميع',
        information: 'كلمة دخيلة (trap word)',
        ability: {
            name: 'الفوضى الإبداعية',
            nameEn: 'Creative Chaos',
            description: 'شاهد جميع الأدوار لمدة 2 ثانية في بداية اللعب',
            usage: 'تلقائي في بداية مرحلة الكتابة',
            cooldown: 0
        },
        scoring: {
            usedWord: 3000,          // إذا استخدم الكلمة وحصل على ≥2 أصوات
            notCaught: 1500,         // إذا لم يكتشفه أحد كمخرب
            causedConfusion: 2000    // إذا تسبب في تصويت خاطئ
        },
        priority: 9,
        minPlayers: 9,
        winsAlone: true  // يمكنه الفوز منفرداً
    }
};

// توزيع الأدوار حسب عدد اللاعبين
const ROLE_DISTRIBUTION = {
    3: [
        ROLE_TYPES.CULPRIT,
        ROLE_TYPES.CHIEF_DETECTIVE,
        ROLE_TYPES.WITNESS
    ],
    4: [
        ROLE_TYPES.CULPRIT,
        ROLE_TYPES.FORGER,
        ROLE_TYPES.CHIEF_DETECTIVE,
        ROLE_TYPES.WITNESS
    ],
    5: [
        ROLE_TYPES.CULPRIT,
        ROLE_TYPES.FORGER,
        ROLE_TYPES.INFILTRATOR,
        ROLE_TYPES.CHIEF_DETECTIVE,
        ROLE_TYPES.WITNESS
    ],
    6: [
        ROLE_TYPES.CULPRIT,
        ROLE_TYPES.FORGER,
        ROLE_TYPES.INFILTRATOR,
        ROLE_TYPES.ACCOMPLICE,
        ROLE_TYPES.CHIEF_DETECTIVE,
        ROLE_TYPES.WITNESS
    ],
    7: [
        ROLE_TYPES.CULPRIT,
        ROLE_TYPES.FORGER,
        ROLE_TYPES.INFILTRATOR,
        ROLE_TYPES.ACCOMPLICE,
        ROLE_TYPES.LAWYER,
        ROLE_TYPES.CHIEF_DETECTIVE,
        ROLE_TYPES.ANALYST
    ],
    8: [
        ROLE_TYPES.CULPRIT,
        ROLE_TYPES.FORGER,
        ROLE_TYPES.INFILTRATOR,
        ROLE_TYPES.ACCOMPLICE,
        ROLE_TYPES.LAWYER,
        ROLE_TYPES.CHIEF_DETECTIVE,
        ROLE_TYPES.ANALYST,
        ROLE_TYPES.OFFICER
    ],
    9: [
        ROLE_TYPES.CULPRIT,
        ROLE_TYPES.FORGER,
        ROLE_TYPES.INFILTRATOR,
        ROLE_TYPES.ACCOMPLICE,
        ROLE_TYPES.LAWYER,
        ROLE_TYPES.CHIEF_DETECTIVE,
        ROLE_TYPES.ANALYST,
        ROLE_TYPES.OFFICER,
        ROLE_TYPES.SABOTEUR
    ],
    10: [
        ROLE_TYPES.CULPRIT,
        ROLE_TYPES.FORGER,
        ROLE_TYPES.INFILTRATOR,
        ROLE_TYPES.ACCOMPLICE,
        ROLE_TYPES.LAWYER,
        ROLE_TYPES.CHIEF_DETECTIVE,
        ROLE_TYPES.ANALYST,
        ROLE_TYPES.OFFICER,
        ROLE_TYPES.WITNESS,
        ROLE_TYPES.SABOTEUR
    ]
};

// دوال مساعدة
function getRolesByTeam(team) {
    return Object.values(ROLES).filter(role => role.team === team);
}

function getRoleInfo(roleId) {
    return ROLES[roleId] || null;
}

function getRolesForPlayerCount(count) {
    // إذا كان العدد أكبر من 10، أضف شهود محايدين
    if (count > 10) {
        const baseRoles = ROLE_DISTRIBUTION[10];
        const additionalWitnesses = count - 10;
        return [...baseRoles, ...Array(additionalWitnesses).fill(ROLE_TYPES.WITNESS)];
    }
    
    return ROLE_DISTRIBUTION[count] || ROLE_DISTRIBUTION[3];
}

function getTeamMembers(players) {
    const teams = {
        [TEAMS.CRIME]: [],
        [TEAMS.INVESTIGATION]: [],
        [TEAMS.NEUTRAL]: []
    };
    
    players.forEach(player => {
        const role = getRoleInfo(player.role);
        if (role) {
            teams[role.team].push(player);
        }
    });
    
    return teams;
}

module.exports = {
    TEAMS,
    ROLE_TYPES,
    ROLES,
    ROLE_DISTRIBUTION,
    getRolesByTeam,
    getRoleInfo,
    getRolesForPlayerCount,
    getTeamMembers
};
