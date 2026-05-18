import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { alpha, fontFamily, fontSize, getColors, sp } from '../tokens';

const VARIANTS = {
  primary: { border: 'borderBright', text: 'accentGreen' },
  secondary: { border: 'accentCyan', text: 'accentCyan' },
  danger: { border: 'accentRed', text: 'accentRed' },
  ghost: { border: 'border', text: 'textMuted' },
};

const SIZES = {
  sm: { py: sp.xs + 2, px: sp.m, fontSize: fontSize.small },
  md: { py: sp.s, px: sp.l, fontSize: fontSize.body },
  lg: { py: sp.m, px: sp.xl, fontSize: fontSize.heading },
};

const TerminalButton = ({ title, onPress, variant = 'primary', size = 'md', disabled = false, style, textStyle }) => {
  const c = getColors();
  const scale = useRef(new Animated.Value(1)).current;
  const config = VARIANTS[variant] || VARIANTS.primary;
  const sizing = SIZES[size] || SIZES.md;
  const borderColor = disabled ? c.textDim : c[config.border];
  const textColor = disabled ? c.textDim : c[config.text];

  const handleIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 40, bounciness: 2 }).start();
  };

  const handleOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 2 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handleIn}
        onPressOut={handleOut}
        style={[
          styles.button,
          {
            borderColor,
            backgroundColor: disabled ? alpha(c.surfaceAlt, 'AA') : alpha(c.bgAlt, 'CC'),
            paddingVertical: sizing.py,
            paddingHorizontal: sizing.px,
          },
        ]}
      >
        <Text style={[styles.text, { color: textColor, fontSize: sizing.fontSize }, textStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default TerminalButton;
