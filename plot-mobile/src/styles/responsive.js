import { Dimensions, Platform, PixelRatio, I18nManager } from 'react-native';

// الحصول على أبعاد الشاشة
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// التحقق من المتصفح (شاشات أكبر)
const isWeb = Platform.OS === 'web';
const isLargeWeb = isWeb && SCREEN_WIDTH >= 768;
const isLandscapeMode = SCREEN_WIDTH > SCREEN_HEIGHT;
// Reduce scale for Web OR Mobile Landscape (to match the "minimalist" request on phone rotation)
const shouldReduceScale = isLargeWeb || (isLandscapeMode && !isWeb && SCREEN_WIDTH >= 500);
const webMultiplier = shouldReduceScale ? 0.5 : 1;

// تصنيف حجم الشاشة
export const SCREEN_SIZES = {
  SMALL: SCREEN_WIDTH < 375,    // iPhone SE, صغير جداً
  MEDIUM: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,  // iPhone standard
  LARGE: SCREEN_WIDTH >= 414,   // iPhone Plus, Android كبير
  XLARGE: SCREEN_WIDTH >= 768,  // Tablet, Web
};

// مقاييس responsive
export const scale = (size) => (SCREEN_WIDTH / 375) * size * webMultiplier;
export const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
export const moderateScale = (size, factor = 0.5) => 
  size + (scale(size) - size) * factor;

// أحجام الخطوط responsive - مع دعم الويب (مصغرة جداً للويب الأفقي)
export const fonts = {
  tiny: moderateScale(9),
  small: moderateScale(11),
  regular: moderateScale(13),
  medium: moderateScale(15),
  large: moderateScale(17),
  xlarge: moderateScale(20),
  xxlarge: moderateScale(24),
  title: moderateScale(28),
};

// المسافات responsive - مع دعم الويب (أصغر جداً للويب الأفقي)
export const spacing = {
  xs: scale(3),
  s: scale(6),
  m: scale(12),
  l: scale(18),
  xl: scale(24),
  xxl: scale(36),
};

// أحجام الأيقونات والصور
export const iconSizes = {
  tiny: moderateScale(16),
  small: moderateScale(20),
  medium: moderateScale(24),
  large: moderateScale(32),
  xlarge: moderateScale(48),
};

// أبعاد العناصر - مع دعم الويب
export const dimensions = {
  buttonHeight: verticalScale(44),
  inputHeight: verticalScale(44),
  cardWidth: SCREEN_WIDTH * 0.9,
  cardMaxWidth: isLargeWeb ? 800 : 500, // Increased max width for web
  avatarSize: moderateScale(50),
  smallAvatarSize: moderateScale(35),
};

// border radius
export const borderRadius = {
  small: scale(4),
  medium: scale(8),
  large: scale(12),
  xlarge: scale(16),
  round: scale(999),
};

// الظلال responsive
export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(2) },
      shadowOpacity: 0.2,
      shadowRadius: scale(2),
    },
    android: {
      elevation: 2,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(4) },
      shadowOpacity: 0.25,
      shadowRadius: scale(4),
    },
    android: {
      elevation: 4,
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: scale(6) },
      shadowOpacity: 0.3,
      shadowRadius: scale(6),
    },
    android: {
      elevation: 8,
    },
  }),
};

// التحقق من حجم الشاشة
export const isSmallScreen = () => SCREEN_SIZES.SMALL;
export const isMediumScreen = () => SCREEN_SIZES.MEDIUM;
export const isLargeScreen = () => SCREEN_SIZES.LARGE;

// نسبة العرض إلى الارتفاع
export const isLandscape = () => SCREEN_WIDTH > SCREEN_HEIGHT;
export const isPortrait = () => SCREEN_WIDTH <= SCREEN_HEIGHT;

// الحصول على عرض مناسب للبطاقات
export const getCardWidth = (columns = 1, margin = spacing.m) => {
  const totalMargin = margin * (columns + 1);
  return (SCREEN_WIDTH - totalMargin) / columns;
};

// الحصول على padding للحاوية (أصغر للويب)
export const getContainerPadding = () => {
  if (isLargeWeb) return spacing.s;  
  if (SCREEN_SIZES.SMALL) return spacing.s; // Reduced for small screens too
  return spacing.m; // Reduced for others
};

// إعدادات النص المتجاوب
export const textStyles = {
  tiny: {
    fontSize: fonts.tiny,
    lineHeight: fonts.tiny * 1.5,
  },
  small: {
    fontSize: fonts.small,
    lineHeight: fonts.small * 1.5,
  },
  regular: {
    fontSize: fonts.regular,
    lineHeight: fonts.regular * 1.5,
  },
  medium: {
    fontSize: fonts.medium,
    lineHeight: fonts.medium * 1.5,
  },
  large: {
    fontSize: fonts.large,
    lineHeight: fonts.large * 1.5,
  },
  xlarge: {
    fontSize: fonts.xlarge,
    lineHeight: fonts.xlarge * 1.4,
  },
  xxlarge: {
    fontSize: fonts.xxlarge,
    lineHeight: fonts.xxlarge * 1.3,
  },
  title: {
    fontSize: fonts.title,
    lineHeight: fonts.title * 1.2,
  },
};

// دعم RTL
export const isRTL = I18nManager?.isRTL || true;

export default {
  scale,
  verticalScale,
  moderateScale,
  fonts,
  spacing,
  iconSizes,
  dimensions,
  borderRadius,
  shadows,
  textStyles,
  isSmallScreen,
  isMediumScreen,
  isLargeScreen,
  isLandscape,
  isPortrait,
  getCardWidth,
  getContainerPadding,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isRTL,
};
