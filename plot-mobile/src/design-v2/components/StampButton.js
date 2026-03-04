/**
 * StampButton.js — Action button for V2.
 * Variants: 'primary' | 'secondary' | 'danger' | 'ghost'
 * Sizes:    'sm' | 'md' | 'lg'
 */
import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { getColors, sp, fontSize, fontFamily, radius } from '../tokens';

const StampButton = ({
  title,
  onPress,
  variant = 'primary',
  size    = 'md',
  disabled= false,
  style,
  textStyle,
}) => {
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  };

  // Colors per variant
  const bg = disabled ? c.textMuted
    : variant === 'primary'   ? c.red
    : variant === 'danger'    ? c.red
    : variant === 'secondary' ? c.gold
    : 'transparent';

  const textColor = disabled ? c.bg
    : variant === 'ghost'     ? c.textSub
    : '#FFF';

  const borderColor = disabled  ? c.textMuted
    : variant === 'ghost'       ? c.border
    : bg;

  const pad = size === 'sm' ? { paddingVertical: sp.xs, paddingHorizontal: sp.m }
    : size === 'lg' ? { paddingVertical: sp.l, paddingHorizontal: sp.xl }
    : { paddingVertical: sp.s + 2, paddingHorizontal: sp.l };

  const fSize = size === 'sm' ? fontSize.small
    : size === 'lg' ? fontSize.heading
    : fontSize.body;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={disabled ? null : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.btn,
          pad,
          { backgroundColor: bg, borderColor },
        ]}
      >
        <Text style={[styles.text, { color: textColor, fontSize: fSize }, textStyle]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1.5,
    borderRadius: radius.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default StampButton;
