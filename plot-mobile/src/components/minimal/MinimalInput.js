import React, { useMemo } from 'react';
import { TextInput as RNTextInput, StyleSheet, View, Text } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius, moderateScale } from '../../styles/responsive';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

/**
 * MinimalInput - A typewriter-style input field on paper texture.
 * Suitable for 'Bureaucratic Noir' theme.
 */
const MinimalInput = ({ 
  value, 
  onChangeText, 
  placeholder = '',
  label = null,
  error = null,
  maxLength = null,
  multiline = false,
  numberOfLines = 1,
  style = {},
  inputStyle = {},
  textAlign = 'right', // Default to RTL
  ...props
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  const showCharCounter = maxLength && multiline;
  const charCount = value?.length || 0;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <RNTextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
          { textAlign }, // Explicit text alignment
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary + '80'}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        selectionColor={theme.colors.stamp} // Cursor color
        {...props}
      />

      <View style={styles.footer}>
        {error && <Text style={styles.errorText}>⚠️ {error}</Text>}
        {showCharCounter && (
          <Text style={[
            styles.charCounter,
            charCount >= maxLength && styles.charCounterMax
          ]}>
            {charCount} / {maxLength}
          </Text>
        )}
      </View>
    </View>
  );
};

const getStyles = (isDesktop) => StyleSheet.create({
  container: {
    marginVertical: isDesktop ? spacing.xs : spacing.s,
    width: '100%',
  },

  label: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.bold,
    color: '#8B4513', // Leather/Wood color for label
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'right', // RTL
  },

  input: {
    backgroundColor: 'rgba(255, 254, 247, 0.9)', // Paper color
    borderWidth: 1,
    borderColor: '#D2B48C', // Tan border
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.m,
    paddingVertical: isDesktop ? spacing.s : spacing.m,
    fontSize: isDesktop ? fonts.small : fonts.regular,
    fontFamily: theme.fonts.main,  // Courier New
    color: theme.colors.text,
    minHeight: isDesktop ? moderateScale(36) : moderateScale(48),
    writingDirection: 'rtl',
  },

  inputMultiline: {
    minHeight: isDesktop ? moderateScale(80) : moderateScale(120),
    paddingTop: spacing.m,
  },

  inputError: {
    borderColor: theme.colors.stamp,
    borderWidth: 2,
    backgroundColor: '#FFF0F0',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    direction: 'rtl',
  },

  errorText: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.stamp,
    textAlign: 'right',
  },

  charCounter: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    alignSelf: 'flex-end', 
  },

  charCounterMax: {
    color: theme.colors.stamp,
    fontWeight: '700',
  },
});

export default MinimalInput;
