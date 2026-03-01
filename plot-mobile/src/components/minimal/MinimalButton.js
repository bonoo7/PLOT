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
        <ActivityIndicator color={variant === 'outline' ? theme.colors.text : '#FFF'} />
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
    backgroundColor: '#2A2A2A', // Dark typewriter key color
    borderWidth: 2,
    borderColor: '#444', // Key rim
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  button_secondary: {
    backgroundColor: '#8B7355', // Wood/Brown color
    borderWidth: 2,
    borderColor: '#5D4037',
  },
  button_danger: {
    backgroundColor: '#8B0000', // Crimson Red
    borderWidth: 2,
    borderColor: '#5A0000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2A2A2A',
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
    color: '#F4E4C1', // Vintage off-white typewriter font
  },
  text_secondary: {
    color: '#F4E4C1',
  },
  text_danger: {
    color: '#FFF',
  },
  text_outline: {
    color: theme.colors.text,
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
