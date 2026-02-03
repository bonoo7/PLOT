import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, getContainerPadding, borderRadius, shadows } from '../styles/responsive';
import { Button, Card } from '../../components/ui';
import RoleAvatar from '../../components/RoleAvatar';

/**
 * شاشة اختيار الدور (هوست أو لاعب)
 */
export const RoleSelectScreen = ({ onSelectHost, onSelectPlayer }) => {
  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* العنوان */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🕵️ PLOT</Text>
          <Text style={styles.subtitle}>لعبة التحقيقات السرية</Text>
        </View>

        {/* بطاقات الأدوار */}
        <View style={styles.cardsContainer}>
          {/* بطاقة المضيف */}
          <TouchableOpacity
            style={[styles.roleCard, shadows.large]}
            onPress={onSelectHost}
            activeOpacity={0.8}
          >
            <RoleAvatar role="HOST" size={80} showLabel={false} />
            <Text style={styles.roleTitle}>المضيف</Text>
            <Text style={styles.roleDescription}>
              إدارة اللعبة وتوزيع الأدوار
            </Text>
            <View style={styles.roleButton}>
              <Text style={styles.roleButtonText}>بدء كمضيف 👑</Text>
            </View>
          </TouchableOpacity>

          {/* بطاقة اللاعب */}
          <TouchableOpacity
            style={[styles.roleCard, shadows.large]}
            onPress={onSelectPlayer}
            activeOpacity={0.8}
          >
            <Text style={styles.roleIcon}>🎭</Text>
            <Text style={styles.roleTitle}>لاعب</Text>
            <Text style={styles.roleDescription}>
              الانضمام إلى لعبة موجودة
            </Text>
            <View style={styles.roleButton}>
              <Text style={styles.roleButtonText}>دخول كلاعب 🎮</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* معلومات إضافية */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 نصيحة: المضيف يحتاج إلى 4-8 لاعبين لبدء اللعبة
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  container: {
    flex: 1,
    padding: getContainerPadding(),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // العنوان
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fonts.title,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
    textAlign: 'center',
  },

  // بطاقات الأدوار
  cardsContainer: {
    width: '100%',
    maxWidth: 600,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.l,
  },
  roleCard: {
    width: Platform.OS === 'web' ? 280 : '45%',
    minWidth: 150,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: borderRadius.large,
    padding: spacing.l,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.text + '20',
  },
  roleIcon: {
    fontSize: moderateScale(64),
    marginBottom: spacing.m,
  },
  roleTitle: {
    fontSize: fonts.xlarge,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  roleDescription: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  roleButton: {
    backgroundColor: theme.colors.accentRed,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.medium,
    width: '100%',
  },
  roleButtonText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },

  // معلومات
  infoContainer: {
    marginTop: spacing.xl,
    backgroundColor: theme.colors.accentYellow + '20',
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.accentYellow,
    maxWidth: 500,
  },
  infoText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    textAlign: 'center',
  },
});

export default RoleSelectScreen;
