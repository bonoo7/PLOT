import { Platform } from 'react-native';
import { spacing, fonts, shadows as responsiveShadows } from './responsive';

/**
 * الهوية البصرية: "ملفات المكتب السري" (Bureaucratic Noir)
 * مستوحاة من أرشيف وكالة استخبارات قديمة في الستينيات
 * الجو: Papers, Please × The Incredibles × Team Fortress 2
 */
export const theme = {
  colors: {
    // الألوان الأساسية (من الهوية البصرية)
    background: '#F5F5DC',          // بيج ورق قديم
    paper: '#FFFEF7',               // ورق أفتح للبطاقات
    text: '#2F4F4F',                // رمادي فحمي
    textSecondary: '#555555',       // رمادي أفتح
    
    // ألوان التميز (Accent Colors)
    stamp: '#B22222',               // أحمر باهت للأختام "سري للغاية"
    stickyNote: '#E1AD01',          // أصفر خردل للملاحظات
    
    // ألوان إضافية
    redacted: '#000000',            // أسود للنصوص المحجوبة
    coffee: '#8B7355',              // بني بقع القهوة
    paperclip: '#B8B8B8',           // رمادي فضي للمشابك
    
    // ألوان الحالات
    primary: '#2D5F2E', // ✅ Added primary
    secondary: '#E1AD01', // ✅ Added secondary
    success: '#2D5F2E',
    warning: '#E1AD01',
    error: '#B22222',
    info: '#4682B4',
    
    // ألوان محايدة
    white: '#FFFFFF',
    black: '#000000',
    
    // ألوان شفافة
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    
    // ألوان الفرق (للأدوار)
    teamGood: '#2D5F2E',
    teamEvil: '#8B0000',
    teamNeutral: '#555555',
  },
  
  // صور الأدوار
  roleImages: {
    MASTERMIND: require('../../assets/Mastermind.png'),
    MINISTER: require('../../assets/Minister.png'),
    SABOTEUR: require('../../assets/Saboteur.png'),
    SEER: require('../../assets/Seer.png'),
    WITNESS: require('../../assets/Witness.png'),
    BENEFICIARY: require('../../assets/Beneficiary.png'),
    CULPRIT: require('../../assets/Culprit.png'),
    DETECTIVE: require('../../assets/Detective.png'),
  },
  
  fonts: {
    // Courier New للمحاكاة الآلة الكاتبة (من الهوية البصرية)
    main: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    bold: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    heading: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    sizes: fonts,
  },
  
  spacing,
  
  transitions: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  
  shadows: responsiveShadows,
  
  // تأثيرات خاصة (من الهوية البصرية)
  effects: {
    typewriter: true,          // تأثير الآلة الكاتبة
    coffeeStains: true,        // بقع القهوة
    paperclips: true,          // مشابك الورق
    stamps: true,              // الأختام
    redactedText: true,        // النصوص المحجوبة
  },
};
