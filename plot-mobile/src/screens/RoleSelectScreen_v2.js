import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, SafeAreaView, ImageBackground } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * شاشة اختيار الدور - تصميم بسيط ونظيف
 */
export const RoleSelectScreen = ({ onSelectHost, onSelectPlayer, onSelectTraining }) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  return (
    <ImageBackground
      source={require('../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
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
                <Text style={styles.cardTitle}>تدريب فردي</Text>
                <Text style={styles.cardDescription}>
                  اختر دوراً والعب مع البوتات
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              تحتاج اللعبة من 4 إلى 8 لاعبين
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
  );
};

const getStyles = (isDesktop) => StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1410',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: isDesktop ? moderateScale(3) : spacing.xxl,
  },
  container: {
    flex: 1,
    padding: getContainerPadding(),
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: isDesktop ? '90%' : 800,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: isDesktop ? 0 : spacing.m,
  },
  title: {
    fontSize: isDesktop ? fonts.medium : fonts.title * 1.2,
    fontFamily: theme.fonts.heading,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: spacing.s,
    letterSpacing: moderateScale(3),
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: '#E8DCC8',
  },

  // Role Cards - نمط Manila Folder
  // Cards Container
  cardsContainer: {
    width: '100%',
    maxWidth: isDesktop ? 800 : 400,
    gap: isDesktop ? moderateScale(2) : spacing.l,
    flexDirection: isDesktop ? 'row' : 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCard: {
    backgroundColor: 'rgba(235, 225, 210, 0.95)',
    borderRadius: borderRadius.small,
    padding: isDesktop ? moderateScale(3) : spacing.xl,
    marginBottom: isDesktop ? 0 : spacing.m,
    borderWidth: 2,
    borderColor: '#8B7355',
    maxWidth: isDesktop ? 300 : 450,
    width: '100%',
    // ظل يحاكي ملفات مكدسة
    shadowColor: theme.colors.black,
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  tutorialCard: {
    backgroundColor: 'rgba(255, 240, 200, 0.95)',
    borderColor: theme.colors.accentYellow,
    borderWidth: 2,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: isDesktop ? fonts.medium : fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: isDesktop ? moderateScale(1) : spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardDescription: {
    fontSize: isDesktop ? fonts.tiny : fonts.regular,
    fontFamily: theme.fonts.main,
    color: '#5C4A3A',
    textAlign: 'center',
    lineHeight: isDesktop ? fonts.tiny * 1.2 : fonts.regular * 1.5,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    padding: isDesktop ? moderateScale(3) : spacing.m,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginTop: isDesktop ? moderateScale(2) : spacing.xl,
    maxWidth: isDesktop ? 800 : 350,
    width: '100%',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  infoText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: '#FFD700',
    flex: 1,
    textAlign: 'center',
  },
});

export default RoleSelectScreen;
