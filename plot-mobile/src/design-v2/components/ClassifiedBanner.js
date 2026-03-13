/**
 * ClassifiedBanner.js — Inline highlighted notice bar.
 * Used to show important alerts, role reveals, scenario hints.
 * Variants: 'info' | 'danger' | 'gold' | 'success'
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { getColors, sp, fontSize, fontFamily, radius } from '../tokens';

const ClassifiedBanner = ({ children, label, variant = 'info', style }) => {
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);

  const stripe = variant === 'danger'  ? c.red
    : variant === 'gold'   ? c.gold
    : variant === 'success'? c.green
    : c.info || c.blue;

  const bg = variant === 'danger'  ? `${c.red}18`
    : variant === 'gold'   ? `${c.gold}18`
    : variant === 'success'? `${c.green}18`
    : `${c.blue}18`;

  return (
    <View style={[styles.wrapper, { backgroundColor: bg, borderColor: stripe }, style]}>
      {/* Left accent stripe */}
      <View style={[styles.stripe, { backgroundColor: stripe }]} />
      <View style={styles.content}>
        {label ? (
          <Text style={[styles.label, { color: stripe }]}>{label}</Text>
        ) : null}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text style={[styles.text, { color: c.text }]}>{children}</Text>
        ) : Array.isArray(children) && children.every(item => typeof item === 'string' || typeof item === 'number') ? (
          <Text style={[styles.text, { color: c.text }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.m,
    overflow: 'hidden',
    width: '100%',
  },
  stripe: {
    width: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
    gap: sp.xxs,
  },
  label: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
    fontWeight: '900',
    letterSpacing: 1,
  },
  text: {
    fontSize: fontSize.body,
    fontFamily: fontFamily.mono,
    lineHeight: fontSize.body * 1.5,
  },
});

export default ClassifiedBanner;
