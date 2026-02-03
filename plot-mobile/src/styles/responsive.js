import { Dimensions, Platform, PixelRatio, I18nManager } from 'react-native';

// الحصول على أبعاد الشاشة
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// تصنيف حجم الشاشة
export const SCREEN_SIZES = {
  SMALL: SCREEN_WIDTH < 375,    // iPhone SE, صغير جداً
  MEDIUM: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,  // iPhone standard
  LARGE: SCREEN_WIDTH >= 414,   // iPhone Plus, Android كبير
};

// مقاييس responsive
export const scale = (size) => (SCREEN_WIDTH / 375) * size;
export const verticalScale = (size) => (SCREEN_HEIGHT / 812) * size;
export const moderateScale = (size, factor = 0.5) => 
  size + (scale(size) - size) * factor;

// أحجام الخطوط responsive
export const fonts = {
  tiny: moderateScale(10),
  small: moderateScale(12),
  regular: moderateScale(14),
  medium: moderateScale(16),
  large: moderateScale(18),
  xlarge: moderateScale(22),
  xxlarge: moderateScale(28),
  title: moderateScale(32),
};

// المسافات responsive
export const spacing = {
  xs: scale(4),
  s: scale(8),
  m: scale(16),
  l: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

// أحجام الأيقونات والصور
export const iconSizes = {
  tiny: moderateScale(16),
  small: moderateScale(20),
  medium: moderateScale(24),
  large: moderateScale(32),
  xlarge: moderateScale(48),
};

// أبعاد العناصر
export const dimensions = {
  buttonHeight: verticalScale(48),
  inputHeight: verticalScale(48),
  cardWidth: SCREEN_WIDTH * 0.9,
  cardMaxWidth: 400,
  avatarSize: moderateScale(60),
  smallAvatarSize: moderateScale(40),
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

// الحصول على padding للحاوية
export const getContainerPadding = () => {
  if (SCREEN_SIZES.SMALL) return spacing.m;
  if (SCREEN_SIZES.MEDIUM) return spacing.l;
  return spacing.xl;
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
