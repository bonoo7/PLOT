import React, { useMemo } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';
import { moderateScale, spacing, fonts, borderRadius } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * زر بنمط الهوية البصرية - Bureaucratic Noir
 */
const Button = ({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false,
  variant = 'primary', // 'primary' (stamp red), 'secondary' (sticky note yellow), 'outline'
  size = 'medium',
  fullWidth = false,
  style = {},
  textStyle = {},
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${size}`],
        styles[`button_${variant}`],
        fullWidth && styles.buttonFullWidth,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? theme.colors.stamp : theme.colors.paper} 
          size="small"
        />
      ) : (
        <Text style={[
          styles.buttonText,
          styles[`buttonText_${size}`],
          styles[`buttonText_${variant}`],
          textStyle,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const getStyles = (isDesktop) => StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.small,  // حواف أقل تقريباً - نمط الملفات القديمة
    paddingHorizontal: isDesktop ? spacing.m : spacing.l,
    // ظل خفيف يحاكي ارتفاع الورق
    shadowColor: theme.colors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },

  // Sizes
  button_small: {
    height: isDesktop ? moderateScale(28) : moderateScale(40),
    paddingHorizontal: isDesktop ? spacing.s : spacing.m,
  },
  button_medium: {
    height: isDesktop ? moderateScale(32) : moderateScale(50),
    paddingHorizontal: isDesktop ? spacing.m : spacing.l,
  },
  button_large: {
    height: isDesktop ? moderateScale(36) : moderateScale(56),
    paddingHorizontal: isDesktop ? spacing.l : spacing.xl,
  },

  // Variants - ألوان الهوية البصرية
  button_primary: {
    backgroundColor: theme.colors.stamp,  // أحمر الختم
  },
  button_secondary: {
    backgroundColor: theme.colors.stickyNote,  // أصفر الملاحظات
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.text,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonFullWidth: {
    width: '100%',
  },

  // Text styles - خط Courier New (الآلة الكاتبة)
  buttonText: {
    fontFamily: theme.fonts.main,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',  // أحرف كبيرة - نمط الأختام
    letterSpacing: 1,
  },

  buttonText_small: {
    fontSize: fonts.small,
  },
  buttonText_medium: {
    fontSize: fonts.medium,
  },
  buttonText_large: {
    fontSize: fonts.large,
  },

  buttonText_primary: {
    color: theme.colors.paper,
  },
  buttonText_secondary: {
    color: theme.colors.text,
  },
  buttonText_outline: {
    color: theme.colors.text,
  },
});

export default Button;
