/**
 * design-v2/screens/GameScreen.js — Role identity reveal
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { ROUTES } from '../../hooks/useGameSocket';
import { DossierLayout, DossierCard, StampButton, CaseHeader, ClassifiedBanner } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';

const getRoleEmoji = (role) => {
  const map = {
    CULPRIT:'🎭', DETECTIVE:'🕵️', WITNESS:'👁️', SABOTEUR:'🧨',
    MINISTER:'📜', BENEFICIARY:'💰', SEER:'🔮', MASTERMIND:'🧠',
  };
  return map[role] || '👤';
};

export const GameScreen = () => {
  const navigation = useNavigation();
  const roleData   = useGameStore(s => s.roleData);
  const roomCode   = useGameStore(s => s.roomCode);
  const themeMode  = useGameStore(s => s.themeMode) || 'light';
  const myName     = useGameStore(s => s.playerName);
  const c = getColors(themeMode);

  if (!roleData) {
    return (
      <DossierLayout top={<CaseHeader mode="neutral" title="الملف السري" />}>
        <View style={styles.center}>
          <Text style={[styles.wait, { color: c.textMuted }]}>جاري استلام الملف السري…</Text>
        </View>
      </DossierLayout>
    );
  }

  const { role, roleName, description, info, specialInfo } = roleData;
  const emoji = getRoleEmoji(role);

  const renderIntel = () => {
    if (!info && !specialInfo) return null;
    if (typeof info === 'string')
      return <ClassifiedBanner label="معلومات سرية" variant="gold">{info}</ClassifiedBanner>;
    if (typeof specialInfo === 'string')
      return <ClassifiedBanner label="معلومات سرية" variant="gold">{specialInfo}</ClassifiedBanner>;
    if (Array.isArray(specialInfo))
      return <ClassifiedBanner label="معلومات سرية" variant="gold">{specialInfo.join('\n')}</ClassifiedBanner>;
    if (specialInfo?.type === 'MASTERMIND_INTEL')
      return (
        <ClassifiedBanner label="فريق الجريمة" variant="danger">
          {(specialInfo.crimeTeam || []).map(p => `• ${p.name} — ${p.role}`).join('\n')}
        </ClassifiedBanner>
      );
    if (specialInfo?.type === 'MINISTER_INTEL')
      return (
        <ClassifiedBanner label="معلومات سرية" variant="info">
          {`المستفيد: ${specialInfo.beneficiary?.name || '?'}\nالمحقق: ${specialInfo.detective?.name || '?'}`}
        </ClassifiedBanner>
      );
    if (specialInfo?.type === 'WITNESS_INTEL')
      return (
        <ClassifiedBanner label="الكلمات المفتاحية" variant="gold">
          {(specialInfo.keywords || []).join(' — ')}
        </ClassifiedBanner>
      );
    return null;
  };

  return (
    <DossierLayout
      top={
        <CaseHeader
          mode="player"
          roomCode={roomCode}
          roleName={roleName}
          roleEmoji={emoji}
          playerId={myName}
        />
      }
      bottom={
        <StampButton
          title="جاهز ✓"
          onPress={() => navigation.navigate(ROUTES.WAITING)}
          variant="primary"
          size="sm"
          style={{ flex: 1 }}
        />
      }
    >
      <View style={styles.content}>
        {/* Role card */}
        <View style={[styles.roleCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <Text style={styles.roleEmoji}>{emoji}</Text>
          <Text style={[styles.roleName, { color: c.text }]}>{roleName}</Text>
          {description ? (
            <Text style={[styles.roleDesc, { color: c.textSub }]}>{description}</Text>
          ) : null}
        </View>

        {/* Intel */}
        <View style={styles.intelSection}>
          {renderIntel()}
        </View>
      </View>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  wait: { fontSize: fontSize.body, fontFamily: fontFamily.mono, fontStyle: 'italic' },
  content: {
    flex: 1,
    gap: sp.s,
  },
  roleCard: {
    borderWidth: 1.5,
    borderRadius: radius.m,
    padding: sp.l,
    alignItems: 'center',
    gap: sp.xs,
  },
  roleEmoji: { fontSize: 44, lineHeight: 52 },
  roleName: {
    fontSize: fontSize.title,
    fontFamily: fontFamily.mono,
    fontWeight: '900',
  },
  roleDesc: {
    fontSize: fontSize.body,
    fontFamily: fontFamily.mono,
    textAlign: 'center',
    lineHeight: fontSize.body * 1.5,
  },
  intelSection: {
    gap: sp.s,
  },
});
