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
    // Priority List for distribution
    // Must always include Culprit (Crime) and Detective (Justice)
    
    // 3 Players: Culprit, Detective, Citizen (or Witness?) -> Minimal
    // Let's define distribution based on rules V4:
    
    // Core Roles:
    // 1. Culprit (Crime)
    // 2. Detective (Justice)
    // 3. Witness (Justice) - "Badla an Al-Muzawwir" -> Replaces Forger, implies core role.
    
    const distribution = [ROLE_TYPES.CULPRIT, ROLE_TYPES.DETECTIVE, ROLE_TYPES.WITNESS];
    
    // 4th Player: Mastermind (Crime)
    if (count >= 4) distribution.push(ROLE_TYPES.MASTERMIND);
    
    // 5th Player: Seer (Justice)
    if (count >= 5) distribution.push(ROLE_TYPES.SEER);
    
    // 6th Player: Saboteur (Crime)
    if (count >= 6) distribution.push(ROLE_TYPES.SABOTEUR);
    
    // 7th Player: Minister (Justice)
    if (count >= 7) distribution.push(ROLE_TYPES.MINISTER);
    
    // 8th Player: Beneficiary (Crime)
    if (count >= 8) distribution.push(ROLE_TYPES.BENEFICIARY);
    
    // If more than 8 (shouldn't happen in standard game but for safety):
    while (distribution.length < count) {
        distribution.push(ROLE_TYPES.CITIZEN);
    }
    
    // If fewer than needed (e.g. testing with 3 bots), cut from end?
    // The distribution array grows with count, so slicing is fine.
    // Wait, the logic above ADDS based on count.
    
    return distribution.slice(0, count);
}

module.exports = {
    TEAMS,
    ROLE_TYPES,
    ROLES,
    getRoleInfo,
    getTeamMembers,
    getRolesForPlayerCount
};