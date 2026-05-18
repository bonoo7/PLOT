import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { alpha, fontFamily, fontSize, getColors, sp } from '../tokens';

const MAP = {
  info: { prefix: '[*]', color: 'accentCyan' },
  success: { prefix: '[+]', color: 'accentGreen' },
  warning: { prefix: '[!]', color: 'accentYellow' },
  error: { prefix: '[ERROR]', color: 'accentRed' },
  gold: { prefix: '[#]', color: 'accentPurple' },
};

const TerminalBanner = ({ variant = 'info', label, children, style }) => {
  const c = getColors();
  const config = MAP[variant] || MAP.info;
  const tone = c[config.color] || c.accentCyan;

  return (
    <View style={[styles.wrap, { borderColor: tone, backgroundColor: alpha(tone, '14') }, style]}>
      <Text style={[styles.prefix, { color: tone }]}>{config.prefix}</Text>
      <View style={styles.body}>
        {label ? <Text style={[styles.label, { color: tone }]}>{label}</Text> : null}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text style={[styles.text, { color: c.textPrimary }]}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sp.s,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
  },
  prefix: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: sp.xxs,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  text: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});

export default TerminalBanner;
