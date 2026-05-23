import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { buildAsciiBar, fontFamily, fontSize, getColors, sp } from '../tokens';

const ProgressBar = ({ value = 0, max = 100, label, showTime = false, timeText, style }) => {
  const c = getColors();
  const { pct, text } = buildAsciiBar(value, max, 12);
  const tone = pct > 0.5 ? c.accentGreen : pct > 0.25 ? c.accentYellow : c.accentRed;

  // Pulse when remaining time is low (critical countdown)
  const isCritical = value > 0 && value <= 10;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCritical) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.35,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCritical]);

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text> : null}
      <Animated.View style={[styles.row, { opacity: pulseAnim }]}>
        <Text style={[styles.bar, { color: tone }]}>{text}</Text>
        {showTime ? <Text style={[styles.time, { color: tone }]}>{timeText}</Text> : null}
      </Animated.View>
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
