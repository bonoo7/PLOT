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
    backgroundColor: '#EBE1D2', // Manila folder/vintage paper base
    borderRadius: borderRadius.small,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: '#C1A173', // Darker brown border
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  cardGold: {
    backgroundColor: '#F5DEB3', // Wheat/Gold tint paper
    borderColor: '#DAA520',
  },
  cardTransparent: {
    backgroundColor: 'rgba(20, 20, 20, 0.75)',
    borderColor: '#4A4A4A',
  },
  flex: {
    flex: 1, // Allow card to expand and fill available space
    minHeight: 0, // Important for nested flex containers
  }
});

export default MinimalCard;
