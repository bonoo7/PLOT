import React, { useMemo } from 'react';
import { TextInput as RNTextInput, StyleSheet, View, Text } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius, moderateScale } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * حقل إدخال بنمط الهوية البصرية
 */
const TextInput = ({ 
  value, 
  onChangeText, 
  placeholder = '',
  label = null,
  error = null,
  maxLength = null,
  multiline = false,
  numberOfLines = 1,
  style = {},
  ...props
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  const showCharCounter = maxLength && multiline;
  const charCount = value?.length || 0;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <RNTextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
          style,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary + '80'}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
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
  },

  label: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.main,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  input: {
    backgroundColor: theme.colors.paper,
    borderWidth: 1,
    borderColor: theme.colors.text + '40',
    borderRadius: borderRadius.small,
    paddingHorizontal: isDesktop ? spacing.m : spacing.m,
    paddingVertical: isDesktop ? spacing.s : spacing.m,
    fontSize: isDesktop ? fonts.small : fonts.regular,
    fontFamily: theme.fonts.main,  // Courier New - الآلة الكاتبة
    color: theme.colors.text,
    minHeight: isDesktop ? moderateScale(36) : moderateScale(48),
  },

  inputMultiline: {
    minHeight: isDesktop ? moderateScale(80) : moderateScale(120),
    paddingTop: spacing.m,
  },

  inputError: {
    borderColor: theme.colors.stamp,
    borderWidth: 2,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },

  errorText: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.stamp,
  },

  charCounter: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    marginLeft: 'auto',
  },

  charCounterMax: {
    color: theme.colors.stamp,
    fontWeight: '700',
  },
});

export default TextInput;
