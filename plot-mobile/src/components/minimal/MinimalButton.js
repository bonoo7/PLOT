import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius } from '../../styles/responsive';

/**
 * MinimalButton - Action buttons.
 * Features:
 * - Compact height
 * - Clear typography
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
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        disabled && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? theme.colors.primary : '#FFF'} />
      ) : (
        <Text style={[
          styles.text,
          styles[`text_${variant}`],
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
  },
  
  // Variants
  button_primary: {
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
  },
  button_secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: '#8B7355',
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
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
    fontFamily: theme.fonts.bold,
    textAlign: 'center',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: theme.colors.text,
  },
  text_outline: {
    color: theme.colors.primary,
  },
  text_ghost: {
    color: theme.colors.textSecondary,
  },
  
  // Text Sizes
  text_small: {
    fontSize: fonts.tiny,
  },
  text_medium: {
    fontSize: fonts.small,
  },
  text_large: {
    fontSize: fonts.medium,
  },
  textDisabled: {
    color: '#999',
  }
});

export default MinimalButton;
