/**
 * DossierCard.js — Card container for V2.
 * Variants: 'default' | 'alert' | 'gold' | 'flat'
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { getColors, sp, radius, makeShadow } from '../tokens';

const DossierCard = ({ children, style, variant = 'default', noPad = false }) => {
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);

  const borderColor = variant === 'alert' ? c.red
    : variant === 'gold'  ? c.gold
    : variant === 'flat'  ? 'transparent'
    : c.cardBorder;

  const bgColor = variant === 'flat' ? 'transparent' : c.cardBg;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderColor,
          ...makeShadow(c.shadow),
        },
        variant === 'flat' && styles.flat,
        noPad && styles.noPad,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.m,
    padding: sp.m,
    borderWidth: 1.5,
    width: '100%',
  },
  flat: {
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  noPad: {
    padding: 0,
  },
});

export default DossierCard;
