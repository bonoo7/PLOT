import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, moderateScale, borderRadius } from '../../styles/responsive';

/**
 * MinimalCard - Container for grouped content.
 * Features:
 * - Semi-transparent background (Glassmorphism-lite or Paper-like)
 * - Subtle border
 * - Flexible sizing (flex: 1 or auto)
 */
const MinimalCard = ({ children, style, variant = 'default', flex = false }) => {
  return (
    <View style={[
      styles.card,
      variant === 'gold' && styles.cardGold,
      variant === 'transparent' && styles.cardTransparent,
      flex && styles.flex,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(235, 225, 210, 0.95)', // Default paper-like
    borderRadius: borderRadius.small,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: '#8B7355',
    width: '100%',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  cardTransparent: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  flex: {
    flex: 1, // Allow card to expand and fill available space
    minHeight: 0, // Important for nested flex containers
  }
});

export default MinimalCard;
