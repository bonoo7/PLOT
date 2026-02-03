import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';

/**
 * شاشة اختيار الدور - تصميم بسيط ونظيف
 */
export const RoleSelectScreen = ({ onSelectHost, onSelectPlayer, onSelectTraining }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🕵️</Text>
            <Text style={styles.title}>PLOT</Text>
            <Text style={styles.subtitle}>لعبة التحقيقات السرية</Text>
          </View>

          {/* Role Cards */}
          <View style={styles.cardsContainer}>
            {/* Host Card */}
            <TouchableOpacity
              style={styles.roleCard}
              onPress={onSelectHost}
              activeOpacity={0.9}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>👑</Text>
                <Text style={styles.cardTitle}>المضيف</Text>
                <Text style={styles.cardDescription}>
                  إنشاء غرفة جديدة وإدارة اللعبة
                </Text>
              </View>
            </TouchableOpacity>

            {/* Player Card */}
            <TouchableOpacity
              style={styles.roleCard}
              onPress={onSelectPlayer}
              activeOpacity={0.9}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>🎭</Text>
                <Text style={styles.cardTitle}>لاعب</Text>
                <Text style={styles.cardDescription}>
                  الانضمام إلى لعبة موجودة
                </Text>
              </View>
            </TouchableOpacity>

            {/* Training Card */}
            <TouchableOpacity
              style={[styles.roleCard, styles.tutorialCard]}
              onPress={onSelectTraining}
              activeOpacity={0.9}
            >
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>🤖</Text>
                <Text style={styles.cardTitle}>تدريب فردي</Text>
                <Text style={styles.cardDescription}>
                  اختر دوراً والعب مع البوتات
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              تحتاج اللعبة من 4 إلى 8 لاعبين
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,  // بيج ورق قديم
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  container: {
    flex: 1,
    padding: getContainerPadding(),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl * 1.5,
  },
  logo: {
    fontSize: moderateScale(80),
    marginBottom: spacing.m,
  },
  title: {
    fontSize: fonts.title * 1.2,
    fontFamily: theme.fonts.heading,  // Courier New
    fontWeight: '800',
    color: theme.colors.text,  // رمادي فحمي
    marginBottom: spacing.s,
    letterSpacing: moderateScale(3),
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },

  // Role Cards - نمط Manila Folder
  cardsContainer: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.l,
  },
  roleCard: {
    backgroundColor: theme.colors.paper,
    borderRadius: borderRadius.small,
    padding: spacing.xl,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: '#D4C5A9',
    // ظل يحاكي ملفات مكدسة
    shadowColor: theme.colors.black,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  tutorialCard: {
    backgroundColor: theme.colors.accentYellow + '15',
    borderColor: theme.colors.accentYellow,
    borderWidth: 1.5,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: moderateScale(56),
    marginBottom: spacing.m,
  },
  cardTitle: {
    fontSize: fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardDescription: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Info Box - نمط الملاحظة اللاصقة
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.stickyNote + '20',  // أصفر خردل شفاف
    padding: spacing.m,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.stickyNote + '50',
    marginTop: spacing.xl,
    maxWidth: 350,
    // ظل خفيف
    shadowColor: theme.colors.black,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  infoIcon: {
    fontSize: moderateScale(20),
    marginRight: spacing.m,
  },
  infoText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});

export default RoleSelectScreen;
