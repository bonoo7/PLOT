import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { PlayerBadge, TerminalBanner, TerminalButton, TerminalHeader, TerminalInput, TerminalLayout } from '../components';
import { sp, useLayout } from '../tokens';

export const LoginScreen = () => {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const roomCode = useGameStore((s) => s.roomCode);
  const setRoomCode = useGameStore((s) => s.setRoomCode);
  const connecting = useGameStore((s) => s.connecting);
  const setConnecting = useGameStore((s) => s.setConnecting);
  const canJoin = playerName.trim().length >= 2 && roomCode.trim().length >= 4 && !!socket;

  const handleJoin = () => {
    if (!canJoin) return;
    setConnecting(true);
    socket.emit('joinRoom', { roomCode, playerName, isHost: false });
  };

  return (
    <TerminalLayout
      top={<TerminalHeader title="PLAYER LOGIN" subtitle="إدخال بيانات الغرفة" />}
      bottom={
        <View style={styles.footerRow}>
          <TerminalButton title="← رجوع" onPress={() => navigation.goBack()} variant="ghost" size="sm" />
          <TerminalButton title={connecting ? 'جارٍ الاتصال...' : 'الانضمام'} onPress={handleJoin} disabled={!canJoin || connecting} size="sm" style={{ flex: 1 }} />
        </View>
      }
    >
      <View style={styles.formWrap}>
        <TerminalInput label="اسم اللاعب" value={playerName} onChangeText={setPlayerName} placeholder="اسمك داخل اللعبة" maxLength={20} />
        <TerminalInput label="رمز الغرفة" value={roomCode} onChangeText={(text) => setRoomCode(text.toUpperCase())} placeholder="ABCD" maxLength={6} autoCapitalize="characters" />
        {connecting ? <TerminalBanner variant="info" label="LINK">جاري فتح قناة الاتصال مع المضيف...</TerminalBanner> : null}
      </View>
    </TerminalLayout>
  );
};

export const LobbyScreen = () => {
  const { socket } = useSocket();
  const players = useGameStore((s) => s.players) || [];
  const roomCode = useGameStore((s) => s.roomCode);
  const myId = socket?.id;
  const { isLandscape, isDesktop } = useLayout();
  const wide = isLandscape || isDesktop;

  return (
    <TerminalLayout top={<TerminalHeader title="PLAYER LOBBY" subtitle="بانتظار أمر البدء" roomCode={roomCode} />}>
      <View style={styles.lobbyWrap}>
        <TerminalBanner variant="warning" label="WAIT STATE">بانتظار المضيف لبدء الجولة الأولى...</TerminalBanner>
        <ScrollView contentContainerStyle={[styles.playerGrid, wide && styles.playerGridWide]} showsVerticalScrollIndicator={false}>
          {players.map((player, index) => (
            <PlayerBadge key={player.id || index} name={player.name} index={index + 1} isMe={player.id === myId} style={wide ? styles.playerBadgeWide : null} />
          ))}
        </ScrollView>
      </View>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
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
  lobbyWrap: {
    flex: 1,
    gap: sp.s,
  },
  playerGrid: {
    gap: sp.s,
    paddingBottom: sp.l,
  },
  playerGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playerBadgeWide: {
    width: '48%',
  },
});
