import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { alpha, fontFamily, fontSize, getColors, sp } from '../tokens';

const TONES = {
  default: 'border',
  success: 'accentGreen',
  info: 'accentCyan',
  warning: 'accentYellow',
  danger: 'accentRed',
  special: 'accentPurple',
};

const TerminalCard = ({ children, title, tone = 'default', style, bodyStyle, noPad = false }) => {
  const c = getColors();
  const borderKey = TONES[tone] || TONES.default;
  const borderColor = c[borderKey] || c.border;

  return (
    <View style={[styles.card, { borderColor, backgroundColor: alpha(c.surface, 'E6') }, style]}>
      {title ? (
        <View style={[styles.header, { borderBottomColor: c.divider }]}>
          <Text style={[styles.title, { color: borderColor }]}>{title}</Text>
        </View>
      ) : null}
      <View style={[!noPad && styles.body, bodyStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 0,
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
  },
  title: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    padding: sp.m,
  },
});

export default TerminalCard;
