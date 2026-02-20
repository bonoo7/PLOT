import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius } from '../../styles/responsive';

/**
 * MinimalBadge - A stamp-like badge for roles, statuses, etc.
 * Suitable for 'Bureaucratic Noir' theme.
 */
const MinimalBadge = ({ 
  text, 
  variant = 'default', // 'default', 'primary' (stamp), 'warning', 'success', 'info'
  size = 'medium',
  style = {},
  textStyle = {}
}) => {
  return (
    <View style={[
      styles.badge,
      styles[`badge_${variant}`],
      styles[`badge_${size}`],
      style,
    ]}>
      <Text style={[
        styles.badgeText,
        styles[`badgeText_${variant}`],
        styles[`badgeText_${size}`],
        textStyle
      ]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.small, // More boxy like a stamp
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Sizes
  badge_small: {
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
  },
  badge_medium: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  badge_large: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderWidth: 2, // Thicker border for large stamps
  },

  // Variants
  badge_default: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderColor: '#8B4513',
  },
  badge_primary: { // "TOP SECRET" Stamp style
    backgroundColor: 'transparent',
    borderColor: theme.colors.stamp, // Red
    borderWidth: 2,
    transform: [{ rotate: '-5deg' }], // Slight tilt by default? No, let consumer rotate.
    // Actually, "TOP SECRET" stamp usually has a border.
  },
  badge_warning: {
    backgroundColor: '#FFE5B4', // Light Orange
    borderColor: '#FFA500',
  },
  badge_success: {
    backgroundColor: '#E8F5E9', // Light Green
    borderColor: '#2E7D32',
  },
  badge_info: {
    backgroundColor: '#E3F2FD', // Light Blue
    borderColor: '#1565C0',
  },

  // Text Styles
  badgeText: {
    fontFamily: theme.fonts.bold,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  badgeText_default: {
    color: '#8B4513',
  },
  badgeText_primary: {
    color: theme.colors.stamp, // Red text
    letterSpacing: 1,
  },
  badgeText_warning: {
    color: '#E65100',
  },
  badgeText_success: {
    color: '#1B5E20',
  },
  badgeText_info: {
    color: '#0D47A1',
  },

  // Text Sizes
  badgeText_small: {
    fontSize: fonts.tiny,
  },
  badgeText_medium: {
    fontSize: fonts.small,
  },
  badgeText_large: {
    fontSize: fonts.medium,
    fontWeight: '900',
  },
});

export default MinimalBadge;
