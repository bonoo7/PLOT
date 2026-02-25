const TEAMS = {
    JUSTICE: 'JUSTICE',
    CRIME: 'CRIME'
};

const ROLE_TYPES = {
    // Justice Team
    DETECTIVE: 'DETECTIVE',
    WITNESS: 'WITNESS',
    SEER: 'SEER',
    MINISTER: 'MINISTER',
    
    // Crime Team
    CULPRIT: 'CULPRIT',
    MASTERMIND: 'MASTERMIND',
    SABOTEUR: 'SABOTEUR',
    BENEFICIARY: 'BENEFICIARY',

    // Fallback/Citizen (if needed)
    CITIZEN: 'CITIZEN'
};

const ROLES = {
    [ROLE_TYPES.CULPRIT]: {
        id: ROLE_TYPES.CULPRIT,
        nameAr: 'الجاني',
        nameEn: 'Culprit',
        description: 'أنت المجرم! لديك القصة الكاملة. حاول تضليل الآخرين وكتابة سيناريو مقنع.',
        team: TEAMS.CRIME,
        emoji: '🎭',
        goal: 'خداع المحققين وعدم كشف هويتك.',
        ability: 'KNOWS_STORY'
    },
    [ROLE_TYPES.MASTERMIND]: {
        id: ROLE_TYPES.MASTERMIND,
        nameAr: 'العقل المدبر',
        nameEn: 'Mastermind',
        description: 'تعرف جميع أعضاء فريق الجريمة. نسق معهم لتضليل العدالة.',
        team: TEAMS.CRIME,
        emoji: '🧠',
        goal: 'حماية الجاني وتوجيه التهم للأبرياء.',
        ability: 'KNOWS_TEAM'
    },
    [ROLE_TYPES.SABOTEUR]: {
        id: ROLE_TYPES.SABOTEUR,
        nameAr: 'المخرب',
        nameEn: 'Saboteur',
        description: 'يمكنك اختيار لاعب لتغيير نتيجة فحصه من قبل المحقق (يظهر كعكس فريقه).',
        team: TEAMS.CRIME,
        emoji: '🧨',
        goal: 'إرباك المحقق وتشتيت الانتباه.',
        ability: 'SABOTAGE'
    },
    [ROLE_TYPES.BENEFICIARY]: {
        id: ROLE_TYPES.BENEFICIARY,
        nameAr: 'المستفيد',
        nameEn: 'Beneficiary',
        description: 'تبدأ اللعبة برصيد إضافي (+1000). استخدم نفوذك لدعم فريق الجريمة.',
        team: TEAMS.CRIME,
        emoji: '💰',
        goal: 'الفوز مع فريق الجريمة وحصد النقاط.',
        startPoints: 1000,
        ability: 'BONUS_POINTS'
    },
    [ROLE_TYPES.DETECTIVE]: {
        id: ROLE_TYPES.DETECTIVE,
        nameAr: 'المحقق',
        nameEn: 'Detective',
        description: 'يمكنك فحص لاعب واحد لمعرفة فريقه (الجريمة أو العدالة).',
        team: TEAMS.JUSTICE,
        emoji: '🕵️‍♂️',
        goal: 'كشف الجاني وأعضاء فريق الجريمة.',
        ability: 'INVESTIGATE'
    },
    [ROLE_TYPES.WITNESS]: {
        id: ROLE_TYPES.WITNESS,
        nameAr: 'الشاهد',
        nameEn: 'Witness',
        description: 'تظهر لك كلمات مفتاحية من القصة الحقيقية لمدة ثانيتين فقط.',
        team: TEAMS.JUSTICE,
        emoji: '👁️',
        goal: 'مساعدة المحققين في بناء القصة الصحيحة.',
        ability: 'FLASH_MEMORY'
    },
    [ROLE_TYPES.SEER]: {
        id: ROLE_TYPES.SEER,
        nameAr: 'العرّاف',
        nameEn: 'Seer',
        description: 'يمكنك نسخ القصة الحقيقية وإرسالها مباشرة (دون رؤيتها).',
        team: TEAMS.JUSTICE,
        emoji: '🔮',
        goal: 'ضمان وجود نسخة صحيحة من القصة في النقاش.',
        ability: 'REVELATION'
    },
    [ROLE_TYPES.MINISTER]: {
        id: ROLE_TYPES.MINISTER,
        nameAr: 'الوزير',
        nameEn: 'Minister',
        description: 'تعرف هوية المحقق والمستفيد. تبدأ برصيد إضافي (+1000).',
        team: TEAMS.JUSTICE,
        emoji: '📜',
        goal: 'توجيه المحقق وحماية فريق العدالة.',
        startPoints: 1000,
        ability: 'KNOWS_KEY_ROLES'
    },
    [ROLE_TYPES.CITIZEN]: {
        id: ROLE_TYPES.CITIZEN,
        nameAr: 'مواطن',
        nameEn: 'Citizen',
        description: 'ليس لديك معلومات خاصة. اعتمد على ذكائك وتحليلك للنقاش.',
        team: TEAMS.JUSTICE,
        emoji: '👤',
        goal: 'كشف الجاني.',
        ability: 'NONE'
    }
};

function getRoleInfo(roleId) {
    return ROLES[roleId] || ROLES[ROLE_TYPES.CITIZEN];
}

function getTeamMembers(team) {
    return Object.values(ROLES).filter(r => r.team === team).map(r => r.id);
}

function getRolesForPlayerCount(count) {
    // Priority Order:
    // 1. Culprit (الجاني)
    // 2. Witness (الشاهد)
    // 3. Detective (المحقق)
    // 4. Saboteur (المخرب)
    // 5. Beneficiary (المستفيد)
    // 6. Minister (الوزير)
    // 7. Seer (العراف)
    // 8. Mastermind (العقل المدبر)

    // Define the strict order of roles to be added one by one
    const priorityList = [
        ROLE_TYPES.CULPRIT,     // 1. الجاني
        ROLE_TYPES.WITNESS,     // 2. الشاهد
        ROLE_TYPES.DETECTIVE,   // 3. المحقق
        ROLE_TYPES.SABOTEUR,    // 4. المخرب
        ROLE_TYPES.BENEFICIARY, // 5. المستفيد
        ROLE_TYPES.MINISTER,    // 6. الوزير
        ROLE_TYPES.SEER,        // 7. العراف
        ROLE_TYPES.MASTERMIND   // 8. العقل المدبر
    ];

    const distribution = [];
    
    // Fill distribution based on count from the priority list
    for (let i = 0; i < count; i++) {
        if (i < priorityList.length) {
            distribution.push(priorityList[i]);
        } else {
            distribution.push(ROLE_TYPES.CITIZEN); // Fallback if count > 8
        }
    }
    
    return distribution;
}

module.exports = {
    TEAMS,
    ROLE_TYPES,
    ROLES,
    getRoleInfo,
    getTeamMembers,
    getRolesForPlayerCount
};