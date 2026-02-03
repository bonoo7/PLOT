import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { Button, TextInput, Card } from '../ui';

/**
 * شاشة اختيار الدور للتدريب
 */
export const TrainingRoleSelectScreen = ({ onSelectRole, onBack }) => {
  const roles = [
    { id: 'CULPRIT', nameAr: 'الجاني', emoji: '🎭', description: 'تعرف القصة الكاملة' },
    { id: 'FORGER', nameAr: 'المزور', emoji: '🧩', description: 'احصل على كلمات مفتاحية' },
    { id: 'CHIEF_DETECTIVE', nameAr: 'المحقق الرئيسي', emoji: '🔍', description: 'اكتشف الحقيقة' },
    { id: 'INFILTRATOR', nameAr: 'المخترق', emoji: '🕵️', description: 'تجسس على الفريق' },
    { id: 'ACCOMPLICE', nameAr: 'الشريك', emoji: '🤝', description: 'ساعد الجاني' },
    { id: 'SABOTEUR', nameAr: 'المخرب', emoji: '😈', description: 'أربك الجميع' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🎓</Text>
            <Text style={styles.title}>تدريب فردي</Text>
            <Text style={styles.subtitle}>اختر الدور الذي تريد لعبه</Text>
          </View>

          {/* Roles Grid */}
          <View style={styles.rolesGrid}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={styles.roleCard}
                onPress={() => onSelectRole(role.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.roleEmoji}>{role.emoji}</Text>
                <Text style={styles.roleName}>{role.nameAr}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Random Role */}
            <TouchableOpacity
              style={[styles.roleCard, styles.randomCard]}
              onPress={() => onSelectRole(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleEmoji}>🎲</Text>
              <Text style={styles.roleName}>دور عشوائي</Text>
              <Text style={styles.roleDescription}>اختيار عشوائي</Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <Button
            title="رجوع"
            onPress={onBack}
            variant="secondary"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * شاشة الانضمام للغرفة للتدريب
 */
export const TrainingJoinScreen = ({ 
  selectedRole, 
  playerName, 
  setPlayerName, 
  roomCode, 
  setRoomCode, 
  onJoin, 
  connecting,
  onBack 
}) => {
  const getRoleInfo = (roleId) => {
    const roles = {
      'CULPRIT': { nameAr: 'الجاني', emoji: '🎭' },
      'FORGER': { nameAr: 'المزور', emoji: '🧩' },
      'CHIEF_DETECTIVE': { nameAr: 'المحقق الرئيسي', emoji: '🔍' },
      'INFILTRATOR': { nameAr: 'المخترق', emoji: '🕵️' },
      'ACCOMPLICE': { nameAr: 'الشريك', emoji: '🤝' },
      'SABOTEUR': { nameAr: 'المخرب', emoji: '😈' },
    };
    return roles[roleId] || { nameAr: 'دور عشوائي', emoji: '🎲' };
  };

  const roleInfo = getRoleInfo(selectedRole);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>🎓</Text>
            <Text style={styles.title}>تدريب فردي</Text>
            <Text style={styles.subtitle}>الدور المختار</Text>
          </View>

          {/* Selected Role Card */}
          <Card style={styles.selectedRoleCard}>
            <Text style={styles.selectedRoleEmoji}>{roleInfo.emoji}</Text>
            <Text style={styles.selectedRoleName}>{roleInfo.nameAr}</Text>
          </Card>

          {/* Input Fields */}
          <View style={styles.form}>
            <TextInput
              label="اسمك"
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="أدخل اسمك"
              maxLength={20}
            />
            
            <TextInput
              label="رمز الغرفة"
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              placeholder="مثال: ABCD"
              maxLength={6}
              autoCapitalize="characters"
              style={styles.codeInput}
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              يجب على المضيف إنشاء الغرفة أولاً وإضافة البوتات (3 على الأقل)
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Button
              title={connecting ? 'جاري الانضمام...' : 'انضم للغرفة'}
              onPress={onJoin}
              loading={connecting}
              disabled={connecting || !playerName.trim() || !roomCode.trim()}
            />
            
            <Button
              title="رجوع"
              onPress={onBack}
              variant="secondary"
              style={styles.backButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
  },
  container: {
    flex: 1,
    padding: getContainerPadding(),
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerEmoji: {
    fontSize: moderateScale(64),
    marginBottom: spacing.m,
  },
  title: {
    fontSize: fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },

  // Roles Grid
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  roleCard: {
    width: '48%',
    backgroundColor: theme.colors.paper,
    borderRadius: borderRadius.small,
    padding: spacing.l,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: '#D4C5A9',
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  randomCard: {
    backgroundColor: theme.colors.accentYellow + '15',
    borderColor: theme.colors.accentYellow,
    borderWidth: 1.5,
  },
  roleEmoji: {
    fontSize: moderateScale(40),
    marginBottom: spacing.s,
  },
  roleName: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Selected Role Card
  selectedRoleCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.xl,
    backgroundColor: theme.colors.accentYellow + '15',
    borderColor: theme.colors.accentYellow,
    borderWidth: 1.5,
  },
  selectedRoleEmoji: {
    fontSize: moderateScale(56),
    marginBottom: spacing.m,
  },
  selectedRoleName: {
    fontSize: fonts.xlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Form
  form: {
    marginBottom: spacing.l,
  },
  codeInput: {
    marginTop: spacing.m,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.accentYellow + '10',
    padding: spacing.m,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.accentYellow + '40',
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: moderateScale(24),
    marginLeft: spacing.s,
  },
  infoText: {
    flex: 1,
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    lineHeight: fonts.small * 1.5,
  },

  // Buttons
  buttons: {
    gap: spacing.m,
  },
  backButton: {
    marginTop: spacing.s,
  },
});
