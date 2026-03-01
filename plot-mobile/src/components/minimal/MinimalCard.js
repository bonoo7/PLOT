import React from 'react';
import { View, StyleSheet, Platform, ImageBackground } from 'react-native';
import { getTheme } from '../../constants/theme';
import { useGameStore } from '../../store/useGameStore';
import { spacing, moderateScale, borderRadius } from '../../styles/responsive';

/**
 * MinimalCard - Container for grouped content.
 * Features:
 * - Dynamic Theme Support (Dark / Light Noir)
 * - Paper Texture Background (Cartoonish)
 */
const MinimalCard = ({ children, style, variant = 'default', flex = false }) => {
  const themeMode = useGameStore(state => state.themeMode);
  const t = getTheme(themeMode);

  return (
    <ImageBackground
      source={require('../../../assets/texture_paper.png')}
      style={[
        styles.card,
        { backgroundColor: t.cardBg, borderColor: t.cardBorder, shadowColor: t.shadow },
        variant === 'gold' && { borderColor: '#D4AF37' },
        variant === 'transparent' && styles.cardTransparent,
        flex && styles.flex,
        style
      ]}
      imageStyle={{ opacity: themeMode === 'dark' ? 0.05 : 0.25, borderRadius: borderRadius.small }}
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.small,
    padding: spacing.m,
    borderWidth: 2, // Cartoonish thick border
    width: '100%',
    shadowOffset: { width: 4, height: 4 }, // Hard comic shadows
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    overflow: 'hidden', // To keep image inside border
  },
  cardTransparent: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  flex: {
    flex: 1, // Allow card to expand and fill available space
    minHeight: 0, // Important for nested flex containers
  }
});

export default MinimalCard;
