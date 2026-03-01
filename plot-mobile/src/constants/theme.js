export const themes = {
    light: {
        background: '#F4EBD0',
        cardBg: '#E6C27A',
        cardBorder: '#8A6E3F',
        text: '#111111',       // حبر أسود قوي الوضوح
        textMuted: '#4F4F4F',
        accent: '#D9381E',
        accentSecondary: '#2E7D32',
        shadow: 'rgba(0,0,0,0.4)',
        inputBg: '#FAF9F6',
        inputBorder: '#B0C4DE',
    },
    dark: {
        background: '#1A1C29',
        cardBg: '#2C3545',
        cardBorder: '#141824',
        text: '#F8FAFC',       // أبيض ساطع لوضوح أعلى 
        textMuted: '#94A3B8',
        accent: '#EF4444',
        accentSecondary: '#10B981',
        shadow: 'rgba(0,0,0,0.9)',
        inputBg: '#1E293B',
        inputBorder: '#334155',
    }
};

export const roleImages = {
    CULPRIT: require('../../assets/roles/role_culprit.png'),
    DETECTIVE: require('../../assets/roles/role_detective.png'),
    WITNESS: require('../../assets/roles/role_witness.png'),
    SABOTEUR: require('../../assets/roles/role_saboteur.png'),
    BENEFICIARY: require('../../assets/roles/role_beneficiary.png'),
    MINISTER: require('../../assets/roles/role_minister.png'),
    SEER: require('../../assets/roles/role_seer.png'),
    MASTERMIND: require('../../assets/roles/role_mastermind.png')
};

// إدماج الصور ضمن كائن الثيم لسهولة الوصول
themes.light.roleImages = roleImages;
themes.dark.roleImages = roleImages;

export const getTheme = (mode) => themes[mode] || themes.light;
