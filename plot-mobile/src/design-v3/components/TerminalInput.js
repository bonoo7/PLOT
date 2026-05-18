import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import BlinkCursor from './BlinkCursor';
import { alpha, fontFamily, fontSize, getColors, sp } from '../tokens';

const TerminalInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  editable = true,
  maxLength,
  autoCapitalize,
}) => {
  const c = getColors();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: focused ? c.borderBright : c.textMuted }]}>{`> ${label}`}</Text>
          {focused ? <BlinkCursor color={c.borderBright} /> : null}
        </View>
      ) : null}
      <View
        style={[
          styles.box,
          {
            borderColor: focused ? c.borderBright : c.border,
            backgroundColor: alpha(c.surfaceAlt, 'F0'),
            minHeight: multiline ? 150 : 48,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.textDim}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          selectionColor={c.accentGreen}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          textAlign="right"
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[
            styles.input,
            {
              color: editable ? c.textPrimary : c.textMuted,
              minHeight: multiline ? 130 : 28,
            },
            inputStyle,
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: sp.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  box: {
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.55,
    writingDirection: 'rtl',
  },
});

export default TerminalInput;
