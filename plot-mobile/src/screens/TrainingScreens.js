import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalCard from '../components/minimal/MinimalCard';
import MinimalButton from '../components/minimal/MinimalButton';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius, moderateScale } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * TrainingRoleSelectScreen - V3
 */
export const TrainingRoleSelectScreen = ({ onSelectRole, onBack }) => {
  const { isDesktop } = useResponsiveLayout();

  const roles = [
    { id: 'CULPRIT', nameAr: 'الجاني', description: 'فريق الجريمة: تعرف القصة الكاملة', icon: '🎭' },
    { id: 'WITNESS', nameAr: 'الشاهد', description: 'فريق العدالة: تلمح كلمات القصة', icon: '👁️' },
    { id: 'DETECTIVE', nameAr: 'المحقق', description: 'فريق العدالة: تكشف هوية الفرق', icon: '🔍' },
    { id: 'SABOTEUR', nameAr: 'المخرب', description: 'فريق الجريمة: تقلب نتائج التحقيق', icon: '🧨' },
    { id: 'BENEFICIARY', nameAr: 'المستفيد', description: 'فريق الجريمة: تبدأ بنقاط إضافية', icon: '💰' },
    { id: 'MINISTER', nameAr: 'الوزير', description: 'فريق العدالة: تعرف شخصيات هامة', icon: '📜' },
    { id: 'SEER', nameAr: 'العراف', description: 'فريق العدالة: تنسخ القصة الحقيقية', icon: '🔮' },
    { id: 'MASTERMIND', nameAr: 'العقل المدبر', description: 'فريق الجريمة: تعرف أعضاء عصابتك', icon: '🧠' },
  ];

  return (
    <MinimalLayout>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <MinimalHeader title="تدريب فردي" subtitle="اختر الدور الذي تريد لعبه" />

        <ScrollView 
            contentContainerStyle={styles.gridContainer} 
            showsVerticalScrollIndicator={false}
        >
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[styles.roleCard, isDesktop && styles.roleCardDesktop]}
                onPress={() => onSelectRole(role.id)}
                activeOpacity={0.8}
              >
                {theme.roleImages && theme.roleImages[role.id] ? (
                    <Image 
                        source={theme.roleImages[role.id]} 
                        style={styles.roleCardImage} 
                        resizeMode="contain"
                    />
                ) : (
                    <Text style={styles.roleIcon}>{role.icon}</Text>
                )}
                <Text style={styles.roleName}>{role.nameAr}</Text>
                <Text style={styles.roleDesc}>{role.description}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Random Role */}
            <TouchableOpacity
              style={[styles.roleCard, styles.randomCard, isDesktop && styles.roleCardDesktop]}
              onPress={() => onSelectRole(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleIcon}>🎲</Text>
              <Text style={styles.roleName}>عشوائي</Text>
              <Text style={styles.roleDesc}>اختيار عشوائي</Text>
            </TouchableOpacity>
        </ScrollView>

        <MinimalButton 
            title="رجوع" 
            onPress={onBack} 
            variant="secondary" 
            style={styles.backButton}
        />
      </View>
    </MinimalLayout>
  );
};

/**
 * TrainingJoinScreen - V3
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
  const { isDesktop } = useResponsiveLayout();
  
  const getRoleInfo = (roleId) => {
    const roles = {
      'CULPRIT': { nameAr: 'الجاني' },
      'MASTERMIND': { nameAr: 'العقل المدبر' },
      'SABOTEUR': { nameAr: 'المخرب' },
      'BENEFICIARY': { nameAr: 'المستفيد' },
      'DETECTIVE': { nameAr: 'المحقق' },
      'WITNESS': { nameAr: 'الشاهد' },
      'SEER': { nameAr: 'العراف' },
      'MINISTER': { nameAr: 'الوزير' },
    };
    return roles[roleId] || { nameAr: 'دور عشوائي' };
  };

  const roleInfo = getRoleInfo(selectedRole);

  return (
    <MinimalLayout>
      <View style={[styles.container, { maxWidth: 500 }]}>
        <MinimalHeader title="تدريب فردي" subtitle="إعداد اللعبة" />

        <MinimalCard>
            <Text style={styles.label}>الدور المختار</Text>
            <View style={styles.selectedRoleBox}>
                <Text style={styles.selectedRoleText}>{roleInfo.nameAr}</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>اسمك</Text>
                <MinimalTextInput 
                    value={playerName} 
                    onChangeText={setPlayerName} 
                    placeholder="أدخل اسمك"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>رمز الغرفة</Text>
                <MinimalTextInput 
                    value={roomCode} 
                    onChangeText={(t) => setRoomCode(t.toUpperCase())} 
                    placeholder="مثال: ABCD"
                    maxLength={6}
                />
            </View>
        </MinimalCard>
        
        <View style={styles.infoBox}>
            <Text style={styles.infoText}>⚠️ يجب أن يقوم المضيف بإضافة البوتات</Text>
        </View>

        <View style={styles.buttonGroup}>
            <MinimalButton 
                title={connecting ? 'جاري الانضمام...' : 'انضم للغرفة'} 
                onPress={onJoin}
                disabled={connecting || !playerName.trim() || !roomCode.trim()}
            />
            <MinimalButton 
                title="رجوع" 
                onPress={onBack} 
                variant="secondary"
            />
        </View>
      </View>
    </MinimalLayout>
  );
};

// Helper Input Component for V3
const MinimalTextInput = ({ value, onChangeText, placeholder, maxLength }) => (
    <TextInput 
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={maxLength}
        placeholderTextColor="#999"
    />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: spacing.m,
    gap: spacing.m,
    alignItems: 'center',
  },
  containerDesktop: {
    maxWidth: 1000,
  },
  
  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.m,
    paddingBottom: spacing.l,
  },
  roleCard: {
    width: '45%', 
    minWidth: 140,
    backgroundColor: '#FDF5E6',
    borderRadius: borderRadius.small,
    padding: spacing.m,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D2B48C',
  },
  roleCardDesktop: {
    width: '30%',
    minWidth: 200,
  },
  randomCard: {
    backgroundColor: '#FFF8DC',
    borderColor: '#DAA520',
  },
  roleCardImage: { width: 100, height: 100, marginBottom: spacing.s },
  roleIcon: { fontSize: 32, marginBottom: spacing.s },
  roleName: { fontFamily: theme.fonts.bold, fontSize: fonts.medium, color: '#333', marginBottom: 4 },
  roleDesc: { fontFamily: theme.fonts.main, fontSize: fonts.tiny, color: '#666', textAlign: 'center' },
  backButton: { width: '100%', maxWidth: 300 },

  // Join Screen
  label: { color: '#8B4513', marginBottom: spacing.xs, fontFamily: theme.fonts.bold },
  selectedRoleBox: { 
    backgroundColor: 'rgba(0,0,0,0.05)', 
    padding: spacing.m, 
    borderRadius: borderRadius.small,
    alignItems: 'center',
    marginBottom: spacing.m,
    width: '100%'
  },
  selectedRoleText: { fontSize: fonts.large, fontFamily: theme.fonts.bold, color: theme.colors.primary },
  inputGroup: { width: '100%', marginBottom: spacing.m },
  // Custom Input Styles
  textInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: borderRadius.small,
    padding: spacing.m,
    fontFamily: theme.fonts.main,
    fontSize: fonts.medium,
    width: '100%',
    textAlign: 'right' // Arabic support
  },
  infoBox: { 
    backgroundColor: 'rgba(255, 215, 0, 0.15)', 
    padding: spacing.s, 
    borderRadius: borderRadius.small, 
    borderWidth: 1, 
    borderColor: '#DAA520',
    marginBottom: spacing.m
  },
  infoText: { color: '#DAA520', fontSize: fonts.small, textAlign: 'center' },
  buttonGroup: { width: '100%', gap: spacing.s }
});
