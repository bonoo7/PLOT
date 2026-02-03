import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius, shadows, moderateScale } from '../styles/responsive';

/**
 * شارة Badge - للأرقام والحالات
 */
export const Badge = ({ 
  text, 
  variant = 'default', // 'default', 'success', 'danger', 'warning'
  size = 'medium',
  style = {} 
}) => {
  return (
    <View style={[
      styles.badge,
      styles[`badge_${variant}`],
      styles[`badge_${size}`],
      style,
    ]}>
      <Text style={[
        styles.badgeText,
        styles[`badgeText_${size}`],
      ]}>{text}</Text>
    </View>
  );
};

/**
 * فاصل Divider
 */
export const Divider = ({ style = {}, color = theme.colors.text + '20' }) => {
  return <View style={[styles.divider, { backgroundColor: color }, style]} />;
};

/**
 * مؤشر تحميل Spinner
 */
export const Spinner = ({ size = 'medium', color = theme.colors.accentRed }) => {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

/**
 * رسالة فارغة Empty State
 */
export const EmptyState = ({ 
  icon = '📭',
  title = 'لا توجد بيانات',
  message = '',
  action = null,
}) => {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyMessage}>{message}</Text>}
      {action && action}
    </View>
  );
};

/**
 * رأس الصفحة Header
 */
export const Header = ({ 
  title, 
  subtitle = null,
  leftAction = null,
  rightAction = null,
  style = {},
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerLeft}>
        {leftAction}
      </View>
      
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      
      <View style={styles.headerRight}>
        {rightAction}
      </View>
    </View>
  );
};

/**
 * عنصر قائمة List Item
 */
export const ListItem = ({ 
  title, 
  subtitle = null,
  leftIcon = null,
  rightIcon = null,
  onPress = null,
  style = {},
}) => {
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      style={[styles.listItem, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {leftIcon && <View style={styles.listItemLeft}>{leftIcon}</View>}
      
      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
      
      {rightIcon && <View style={styles.listItemRight}>{rightIcon}</View>}
    </Container>
  );
};

const styles = StyleSheet.create({
  // Badge
  badge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
  },
  badge_small: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badge_medium: {},
  badge_large: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  badge_default: {
    backgroundColor: theme.colors.textLight,
  },
  badge_success: {
    backgroundColor: theme.colors.success,
  },
  badge_danger: {
    backgroundColor: theme.colors.error,
  },
  badge_warning: {
    backgroundColor: theme.colors.warning,
  },
  badgeText: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
  },
  badgeText_small: {
    fontSize: fonts.tiny,
  },
  badgeText_medium: {
    fontSize: fonts.small,
  },
  badgeText_large: {
    fontSize: fonts.medium,
  },

  // Divider
  divider: {
    height: 1,
    width: '100%',
    marginVertical: spacing.m,
  },

  // Spinner
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: moderateScale(64),
    marginBottom: spacing.l,
  },
  emptyTitle: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.l,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    backgroundColor: theme.colors.background,
    ...shadows.small,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
    marginTop: spacing.xs,
  },

  // List Item
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    backgroundColor: theme.colors.white,
    borderRadius: borderRadius.medium,
    marginVertical: spacing.xs,
    ...shadows.small,
  },
  listItemLeft: {
    marginRight: spacing.m,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  listItemSubtitle: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
  },
  listItemRight: {
    marginLeft: spacing.m,
  },
});

export default {
  Badge,
  Divider,
  Spinner,
  EmptyState,
  Header,
  ListItem,
};
