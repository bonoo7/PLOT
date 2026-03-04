/**
 * SecretInput.js — Text input for V2.
 * Props: value, onChangeText, placeholder, multiline, numberOfLines,
 *        label, style, inputStyle, onFocus, onBlur, editable
 */
import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { getColors, sp, fontSize, fontFamily, radius } from '../tokens';

const SecretInput = ({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  label,
  style,
  inputStyle,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  editable = true,
}) => {
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(focusAnim, { toValue: 1, duration: 150, useNativeDriver: false }).start();
    onFocusProp?.();
  };
  const handleBlur = () => {
    Animated.timing(focusAnim, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    onBlurProp?.();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.inputBorder, c.gold],
  });

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
      ) : null}
      <Animated.View style={[styles.inputWrapper, { borderColor, backgroundColor: c.inputBg }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          textAlign="right"
          style={[
            styles.input,
            { color: c.text },
            multiline && styles.multiline,
            inputStyle,
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: sp.xs,
  },
  label: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
    fontWeight: '600',
    textAlign: 'right',
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: radius.m,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
  },
  input: {
    fontSize: fontSize.body,
    fontFamily: fontFamily.mono,
    minHeight: 36,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});

export default SecretInput;
