import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getTheme } from '../../constants/theme';
import { useGameStore } from '../../store/useGameStore';
import { spacing, fonts, borderRadius } from '../../styles/responsive';

/**
 * MinimalButton - Action buttons.
 * Features:
 * - Dynamic Theme Support (Dark / Light Noir)
 * - Cartoonish borders and shadows
 */
const MinimalButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle
}) => {
  const themeMode = useGameStore(state => state.themeMode);
  const t = getTheme(themeMode);

  // Dynamic variant styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: t.text, borderColor: t.background, shadowColor: t.shadow };
      case 'secondary':
        return { backgroundColor: t.cardBg, borderColor: t.cardBorder, shadowColor: t.shadow };
      case 'danger':
        return { backgroundColor: t.accent, borderColor: '#5A0000', shadowColor: t.shadow };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: t.text };
      case 'ghost':
        return { backgroundColor: 'transparent', borderWidth: 0 };
      default:
        return { backgroundColor: t.text, borderColor: t.background, shadowColor: t.shadow };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return { color: t.background };
      case 'secondary':
      case 'outline':
      case 'ghost':
        return { color: t.text };
      default:
        return { color: t.background };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getVariantStyle(),
        styles[`button_${size}`],
        variant !== 'ghost' && variant !== 'outline' && styles.solidButton,
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? t.text : t.background} />
      ) : (
        <Text style={[
          styles.text,
          getTextStyle(),
          styles[`text_${size}`],
          disabled && styles.textDisabled,
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2, // Cartoonish stroke
  },
  solidButton: {
    shadowOffset: { width: 0, height: 4 }, // Hard shadow
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  // Sizes
  button_small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    minHeight: 32,
  },
  button_medium: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    minHeight: 44,
  },
  button_large: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    minHeight: 56,
  },
  // Disabled
  buttonDisabled: {
    opacity: 0.5,
  },
  // Text
  text: {
    fontFamily: 'Courier', // Will fall back to system but gives typewriter feel
    fontWeight: 'bold',
    textAlign: 'center',
  },
  text_small: {
    fontSize: 12,
  },
  text_medium: {
    fontSize: 14,
  },
  text_large: {
    fontSize: 16,
  },
  textDisabled: {
    color: '#999',
  }
});

export default MinimalButton;
