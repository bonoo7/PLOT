import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius, moderateScale } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * بطاقة بنمط Manila Folder - الهوية البصرية
 */
const Card = ({ 
  children, 
  title = null,
  subtitle = null,
  style = {},
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  return (
    <View style={[styles.card, style]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* Decorative paperclip effect */}
      <View style={styles.paperclip} />
    </View>
  );
};

const getStyles = (isDesktop) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.paper,
    borderRadius: borderRadius.small,
    padding: isDesktop ? moderateScale(3) : spacing.l,
    marginVertical: isDesktop ? moderateScale(1) : spacing.s,
    borderWidth: 1,
    borderColor: '#D4C5A9',  // حدود بنية تحاكي الملفات القديمة
    // ظل يحاكي ورق مكدس
    shadowColor: theme.colors.black,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },

  // Decorative paperclip
  paperclip: {
    position: 'absolute',
    top: isDesktop ? -moderateScale(3) : -moderateScale(6),
    left: spacing.xl,
    width: moderateScale(8),
    height: moderateScale(24),
    backgroundColor: theme.colors.paperclip,
    borderRadius: moderateScale(2),
    borderWidth: 1,
    borderColor: '#A0A0A0',
    opacity: 0.7,
  },

  header: {
    marginBottom: spacing.m,
    paddingBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text + '20',
  },

  title: {
    fontSize: isDesktop ? fonts.medium : fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: isDesktop ? fonts.tiny : fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },

  content: {
    // المحتوى بدون تنسيق إضافي
  },
});

export default Card;
