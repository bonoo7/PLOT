/**
 * design-v2/screens/TrainingScreens.js
 * Training screens in V2 "Classified Dossier" design.
 *
 * TrainingRoleSelectScreen — role grid (portrait 2-col, landscape 3-col)
 * TrainingJoinScreen       — name + room code inputs → joinRoom
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket, ROUTES } from '../../hooks/useGameSocket';
import { DossierLayout, CaseHeader, StampButton, SecretInput, DossierCard } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';

const ROLES = [
  { id: 'CULPRIT',     nameAr: 'الجاني',         desc: 'فريق الجريمة: تعرف القصة كاملة',      emoji: '🎭' },
  { id: 'WITNESS',     nameAr: 'الشاهد',          desc: 'فريق العدالة: تلمح كلمات القصة',       emoji: '👁️' },
  { id: 'DETECTIVE',   nameAr: 'المحقق',          desc: 'فريق العدالة: تكشف هوية الفرق',        emoji: '🕵️' },
  { id: 'SABOTEUR',    nameAr: 'المخرب',          desc: 'فريق الجريمة: تقلب نتائج التحقيق',     emoji: '🧨' },
  { id: 'MINISTER',    nameAr: 'الوزير',          desc: 'فريق العدالة: تعرف شخصيات هامة',       emoji: '📜' },
  { id: 'BENEFICIARY', nameAr: 'المستفيد',        desc: 'فريق الجريمة: تبدأ بنقاط إضافية',      emoji: '💰' },
  { id: 'SEER',        nameAr: 'العراف',          desc: 'فريق العدالة: تنسخ القصة الحقيقية',    emoji: '🔮' },
  { id: 'MASTERMIND',  nameAr: 'العقل المدبر',   desc: 'فريق الجريمة: تعرف أعضاء عصابتك',     emoji: '🧠' },
  { id: null,          nameAr: 'عشوائي',          desc: 'يُختار دور عشوائي',                    emoji: '🎲' },
];

/* ──────────────────────────────────────────────── */
export const TrainingRoleSelectScreen = () => {
  const navigation = useNavigation();
  const setSelectedTrainingRole = useGameStore(s => s.setSelectedTrainingRole);
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);
  const { isLandscape, isDesktop } = useLayout();
  const wide = isLandscape || isDesktop;

  const handleSelect = (roleId) => {
    setSelectedTrainingRole(roleId);
    navigation.navigate(ROUTES.TRAINING_JOIN);
  };

  return (
    <DossierLayout
      top={
        <CaseHeader
          mode="neutral"
          title="تدريب فردي"
          subtitle="اختر الدور الذي تريد لعبه"
        />
      }
      bottom={
        <StampButton
          title="رجوع ←"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="sm"
        />
      }
    >
      <ScrollView
        contentContainerStyle={[styles.grid, wide && styles.gridWide]}
        showsVerticalScrollIndicator={false}
      >
        {ROLES.map((role, i) => (
          <TouchableOpacity
            key={role.id ?? 'random'}
            style={[
              styles.roleCard,
              { backgroundColor: c.cardBg, borderColor: c.border },
              wide && styles.roleCardWide,
              !role.id && { borderColor: c.gold },
            ]}
            onPress={() => handleSelect(role.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.roleEmoji}>{role.emoji}</Text>
            <Text style={[styles.roleName, { color: c.text }]}>{role.nameAr}</Text>
            <Text style={[styles.roleDesc, { color: c.textMuted }]}>{role.desc}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </DossierLayout>
  );
};

/* ──────────────────────────────────────────────── */
export const TrainingJoinScreen = () => {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);

  const selectedRole  = useGameStore(s => s.selectedTrainingRole);
  const playerName    = useGameStore(s => s.playerName);
  const setPlayerName = useGameStore(s => s.setPlayerName);
  const connecting    = useGameStore(s => s.connecting);
  const setConnecting = useGameStore(s => s.setConnecting);
  const setUserRole   = useGameStore(s => s.setUserRole);

  const [roomCode, setRoomCode] = useState('');

  const roleMap = {
    CULPRIT:'🎭 الجاني', WITNESS:'👁️ الشاهد', DETECTIVE:'🕵️ المحقق',
    SABOTEUR:'🧨 المخرب', MINISTER:'📜 الوزير', BENEFICIARY:'💰 المستفيد',
    SEER:'🔮 العراف', MASTERMIND:'🧠 العقل المدبر',
  };
  const roleLabel = selectedRole ? (roleMap[selectedRole] || selectedRole) : '🎲 عشوائي';

  const handleJoin = () => {
    if (!socket) { Alert.alert('خطأ', 'لم يتم الاتصال بالخادم.'); return; }
    if (!playerName.trim()) { Alert.alert('تنبيه', 'الرجاء إدخال اسمك.'); return; }
    if (!roomCode.trim() || roomCode.trim().length < 4) { Alert.alert('تنبيه', 'الرجاء إدخال كود الغرفة.'); return; }
    setConnecting(true);
    setUserRole('PLAYER');
    socket.emit('joinRoom', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      desiredRole: selectedRole,
    });
  };

  return (
    <DossierLayout
      top={
        <CaseHeader
          mode="neutral"
          title="تدريب"
          subtitle={`الدور المحدد: ${roleLabel}`}
        />
      }
      bottom={
        <View style={styles.footer}>
          <StampButton title="رجوع ←" onPress={() => navigation.goBack()} variant="ghost" size="sm" />
          <StampButton
            title={connecting ? 'جارٍ الاتصال…' : 'انضمام →'}
            onPress={handleJoin}
            disabled={connecting}
            variant="primary"
            size="sm"
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <View style={styles.form}>
        {/* Role badge */}
        <View style={[styles.roleBadge, { backgroundColor: c.surface, borderColor: c.gold }]}>
          <Text style={[styles.roleBadgeText, { color: c.gold }]}>{roleLabel}</Text>
        </View>

        <SecretInput
          label="اسمك"
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="أدخل اسمك…"
          maxLength={20}
        />
        <SecretInput
          label="كود الغرفة"
          value={roomCode}
          onChangeText={t => setRoomCode(t.toUpperCase())}
          placeholder="XXXX"
          maxLength={6}
          autoCapitalize="characters"
        />

        <View style={[styles.infoBox, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.infoText, { color: c.textMuted }]}>
            📋 تأكد من أن المضيف قد أنشأ الغرفة قبل الانضمام. سيُضيف الخادم بوتات تلقائياً.
          </Text>
        </View>
      </View>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  // Role select
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp.m,
    paddingBottom: sp.m,
    justifyContent: 'center',
  },
  gridWide: {
    justifyContent: 'flex-start',
  },
  roleCard: {
    width: '46%',
    minWidth: 140,
    borderWidth: 1.5,
    borderRadius: radius.m,
    padding: sp.m,
    alignItems: 'center',
    gap: sp.xs,
  },
  roleCardWide: {
    width: '30%',
    minWidth: 140,
  },
  roleEmoji: {
    fontSize: 28,
  },
  roleName: {
    fontSize: fontSize.medium,
    fontFamily: fontFamily.mono,
    fontWeight: '900',
    textAlign: 'center',
  },
  roleDesc: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
    textAlign: 'center',
    lineHeight: fontSize.label * 1.5,
  },
  // Join screen
  footer: {
    flex: 1,
    flexDirection: 'row',
    gap: sp.s,
    alignItems: 'center',
  },
  form: {
    flex: 1,
    gap: sp.l,
    justifyContent: 'center',
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  roleBadge: {
    alignSelf: 'center',
    paddingVertical: sp.s,
    paddingHorizontal: sp.xl,
    borderWidth: 1.5,
    borderRadius: radius.m,
  },
  roleBadgeText: {
    fontSize: fontSize.heading,
    fontFamily: fontFamily.mono,
    fontWeight: '900',
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: radius.s,
    padding: sp.m,
  },
  infoText: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.mono,
    lineHeight: fontSize.small * 1.6,
    textAlign: 'right',
  },
});
