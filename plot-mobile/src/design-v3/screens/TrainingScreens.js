import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { ROUTES, useSocket } from '../../hooks/useGameSocket';
import { TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalInput, TerminalLayout } from '../components';
import { ROLE_META, fontFamily, fontSize, getColors, sp, useLayout } from '../tokens';

const ROLE_OPTIONS = [...Object.values(ROLE_META), { code: null, name: 'عشوائي', emoji: '🎲', bracket: '[RANDOM]', color: '#FFFF00', team: 'NEUTRAL' }];

export const TrainingRoleSelectScreen = () => {
  const navigation = useNavigation();
  const setSelectedTrainingRole = useGameStore((s) => s.setSelectedTrainingRole);
  const c = getColors();
  const { isLandscape, isDesktop } = useLayout();
  const wide = isLandscape || isDesktop;

  return (
    <TerminalLayout
      top={<TerminalHeader title="TRAINING MODE" subtitle="اختر الدور الذي تريد التدرب عليه" />}
      bottom={<TerminalButton title="← رجوع" onPress={() => navigation.goBack()} variant="ghost" size="sm" />}
    >
      <ScrollView contentContainerStyle={[styles.roleGrid, wide && styles.roleGridWide]} showsVerticalScrollIndicator={false}>
        {ROLE_OPTIONS.map((role) => (
          <TouchableOpacity
            key={role.code || 'random'}
            style={[styles.roleCard, { borderColor: role.color, backgroundColor: c.bgAlt }, wide && styles.roleCardWide]}
            onPress={() => {
              setSelectedTrainingRole(role.code);
              navigation.navigate(ROUTES.TRAINING_JOIN);
            }}
          >
            <Text style={styles.roleEmoji}>{role.emoji}</Text>
            <Text style={[styles.roleBracket, { color: role.color }]}>{role.bracket}</Text>
            <Text style={[styles.roleName, { color: c.textPrimary }]}>{role.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </TerminalLayout>
  );
};

export const TrainingJoinScreen = () => {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const selectedRole = useGameStore((s) => s.selectedTrainingRole);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const connecting = useGameStore((s) => s.connecting);
  const setConnecting = useGameStore((s) => s.setConnecting);
  const setUserRole = useGameStore((s) => s.setUserRole);
  const [roomInput, setRoomInput] = React.useState('');
  const c = getColors();
  const role = selectedRole ? ROLE_META[selectedRole] : { emoji: '🎲', name: 'عشوائي', bracket: '[RANDOM]', color: c.accentYellow };
  const canJoin = playerName.trim().length >= 2 && roomInput.trim().length >= 4 && !!socket;

  const handleJoin = () => {
    if (!canJoin) return;
    setConnecting(true);
    setUserRole('PLAYER');
    socket.emit('joinRoom', {
      roomCode: roomInput.trim().toUpperCase(),
      playerName: playerName.trim(),
      desiredRole: selectedRole,
    });
  };

  return (
    <TerminalLayout
      top={<TerminalHeader title="TRAINING LOGIN" subtitle="توصيل اللاعب إلى غرفة التدريب" />}
      bottom={
        <View style={styles.footerRow}>
          <TerminalButton title="← رجوع" onPress={() => navigation.goBack()} variant="ghost" size="sm" />
          <TerminalButton title={connecting ? 'جارٍ الاتصال...' : 'دخول التدريب'} onPress={handleJoin} disabled={!canJoin || connecting} size="sm" style={{ flex: 1 }} />
        </View>
      }
    >
      <View style={styles.formWrap}>
        <TerminalCard title="> SELECTED ROLE" tone="special">
          <Text style={[styles.roleLabel, { color: role.color }]}>{`${role.emoji} ${role.bracket} ${role.name}`}</Text>
        </TerminalCard>
        <TerminalInput label="الاسم" value={playerName} onChangeText={setPlayerName} placeholder="اسم اللاعب" maxLength={20} />
        <TerminalInput label="رمز الغرفة" value={roomInput} onChangeText={(text) => setRoomInput(text.toUpperCase())} placeholder="ABCD" maxLength={6} autoCapitalize="characters" />
        <TerminalBanner variant="info" label="ملاحظة">تأكد من أن المضيف أنشأ غرفة التدريب قبل الانضمام.</TerminalBanner>
      </View>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  roleGrid: {
    gap: sp.s,
    paddingBottom: sp.l,
  },
  roleGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleCard: {
    borderWidth: 1,
    padding: sp.m,
    gap: sp.xs,
    alignItems: 'center',
  },
  roleCardWide: {
    width: '48%',
  },
  roleEmoji: {
    fontSize: 28,
  },
  roleBracket: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  roleName: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    gap: sp.s,
    alignItems: 'center',
  },
  formWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: sp.s,
  },
  roleLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    fontWeight: '700',
    textAlign: 'center',
  },
});
