import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { buildAsciiBar, fontFamily, fontSize, getColors, sp } from '../tokens';

const ProgressBar = ({ value = 0, max = 100, label, showTime = false, timeText, style }) => {
  const c = getColors();
  const { pct, text } = buildAsciiBar(value, max, 12);
  const tone = pct > 0.5 ? c.accentGreen : pct > 0.25 ? c.accentYellow : c.accentRed;

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text> : null}
      <View style={styles.row}>
        <Text style={[styles.bar, { color: tone }]}>{text}</Text>
        {showTime ? <Text style={[styles.time, { color: tone }]}>{timeText}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: sp.xs,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp.s,
  },
  bar: {
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.medium,
    writingDirection: 'ltr',
  },
  time: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.medium,
    minWidth: 62,
    textAlign: 'right',
  },
});

export default ProgressBar;
