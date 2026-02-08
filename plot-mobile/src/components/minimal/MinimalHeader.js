import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { fonts, spacing, moderateScale } from '../../styles/responsive';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

/**
 * MinimalHeader - Consistent header for minimalist screens.
 * Features:
 * - Responsive text sizing
 * - Optional subtitle
 * - Minimal vertical margin to save space
 */
const MinimalHeader = ({ title, subtitle, rightContent }) => {
  const { isDesktop } = useResponsiveLayout();

  return (
    <View style={[styles.container, isDesktop && styles.containerDesktop]}>
      <View style={styles.textContainer}>
        <Text style={[
          styles.title, 
          { fontSize: isDesktop ? fonts.large : fonts.xlarge }
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[
            styles.subtitle,
            { fontSize: isDesktop ? fonts.tiny : fonts.small }
          ]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.m,
    flexShrink: 0, // Header should not shrink
  },
  containerDesktop: {
    marginBottom: spacing.l,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: theme.fonts.heading,
    fontWeight: '800',
    color: '#FFD700', // Gold
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  subtitle: {
    fontFamily: theme.fonts.main,
    color: '#E8DCC8', // Off-white/Beige
    textAlign: 'center',
    opacity: 0.9,
  },
  rightContent: {
    position: 'absolute',
    right: 0,
    top: 0,
  }
});

export default MinimalHeader;
