/**
 * server/utils/serverUtils.js
 * 
 * دوال مساعدة خالصة للخادم — لا تعتمد على io أو rooms مباشرة
 * تستعمل فقط في server/index.js
 */

const {
    TEAMS,
    ROLE_TYPES,
    getRoleInfo,
    getRolesForPlayerCount,
} = require('../roles');

/**
 * الحصول على اسم الدور بالعربية
 */
function getRoleName(roleId) {
    const roleInfo = getRoleInfo(roleId);
    return roleInfo ? roleInfo.nameAr : roleId;
}

/**
 * الحصول على وصف الدور
 */
function getRoleDescription(roleId) {
    const roleInfo = getRoleInfo(roleId);
    return roleInfo ? roleInfo.description : '';
}

/**
 * الحصول على هدف الدور
 */
function getRoleGoal(roleId) {
    const roleInfo = getRoleInfo(roleId);
    return roleInfo ? roleInfo.goal : '';
}

/**
 * الحصول على فريق الدور
 */
function getRoleTeam(roleId) {
    const roleInfo = getRoleInfo(roleId);
    return roleInfo ? roleInfo.team : TEAMS.NEUTRAL;
}

/**
 * توليد كود غرفة عشوائي من 4 أحرف (يتجنب الكودات الموجودة)
 */
function generateRoomCode(rooms) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (rooms[code]);
    return code;
}

/**
 * بناء كائن المعرفة المحدودة لكل بوت — يعكس ما يعرفه فعلياً في اللعبة
 */
function buildBotKnowledge(bot, room) {
    if (!bot || !room) return {};
    return {
        myId: bot.id,
        myRole: bot.role,
        myTeam: getRoleInfo(bot.role)?.team,
        knownCrimeTeam: (bot.role === 'MASTERMIND' && bot.specialInfo?.crimeTeam)
            ? bot.specialInfo.crimeTeam.map(p => p.id)
            : [],
        knownDetectiveId: (bot.role === 'MINISTER' && bot.specialInfo?.detective)
            ? bot.specialInfo.detective.id : null,
        knownBeneficiaryId: (bot.role === 'MINISTER' && bot.specialInfo?.beneficiary)
            ? bot.specialInfo.beneficiary.id : null,
        investigationResult: bot.investigationResult || null,
    };
}

/**
 * ترتيب الأدوار الرسمي للتدريب والـ fillBots
 */
const ROLE_ORDER_DEFAULT = [
    ROLE_TYPES.CULPRIT,
    ROLE_TYPES.WITNESS,
    ROLE_TYPES.DETECTIVE,
    ROLE_TYPES.SABOTEUR,
    ROLE_TYPES.MINISTER,
    ROLE_TYPES.BENEFICIARY,
    ROLE_TYPES.SEER,
    ROLE_TYPES.MASTERMIND
];

/**
 * أسماء الأدوار بالعربية (للعرض في أسماء البوتات)
 */
const ROLE_NAMES_AR = {
    CULPRIT: 'الجاني',
    WITNESS: 'الشاهد',
    DETECTIVE: 'المحقق',
    SABOTEUR: 'المخرب',
    BENEFICIARY: 'المستفيد',
    MINISTER: 'الوزير',
    SEER: 'العراف',
    MASTERMIND: 'العقل المدبر'
};

module.exports = {
    getRoleName,
    getRoleDescription,
    getRoleGoal,
    getRoleTeam,
    generateRoomCode,
    buildBotKnowledge,
    ROLE_ORDER_DEFAULT,
    ROLE_NAMES_AR,
};
