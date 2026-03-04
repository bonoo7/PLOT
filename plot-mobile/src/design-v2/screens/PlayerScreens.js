/**
 * design-v2/screens/PlayerScreens.js
 * LoginScreen + LobbyScreen
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { DossierLayout, DossierCard, StampButton, FileBadge, CaseHeader, SecretInput, ClassifiedBanner } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';

/* ══════════════════════════════════════════════════════════════
   LoginScreen
══════════════════════════════════════════════════════════════ */
export const LoginScreen = () => {
  const navigation    = useNavigation();
  const playerName    = useGameStore(s => s.playerName);
  const setPlayerName = useGameStore(s => s.setPlayerName);
  const roomCode      = useGameStore(s => s.roomCode);
  const setRoomCode   = useGameStore(s => s.setRoomCode);
  const connecting    = useGameStore(s => s.connecting);
  const setConnecting = useGameStore(s => s.setConnecting);
  const themeMode     = useGameStore(s => s.themeMode) || 'light';
  const { socket }    = useSocket();
  const c = getColors(themeMode);

  const canJoin = playerName.trim().length >= 2 && roomCode.trim().length >= 4;

  const handleJoin = () => {
    if (socket) {
      setConnecting(true);
      socket.emit('joinRoom', { roomCode, playerName, isHost: false });
    }
  };

  return (
    <DossierLayout
      top={<CaseHeader mode="neutral" title="الانضمام" subtitle="أدخل بيانات الدخول" />}
      bottom={
        <View style={styles.footerRow}>
          <StampButton title="← رجوع" onPress={() => navigation.goBack()} variant="ghost" size="sm" />
          <StampButton
            title={connecting ? 'جاري الاتصال…' : 'دخول الغرفة'}
            onPress={handleJoin}
            disabled={!canJoin || connecting}
            variant="primary"
            size="sm"
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <View style={styles.formCenter}>
        <SecretInput
          label="الاسم الحركي"
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="اسمك في المهمة"
          editable={!connecting}
        />
        <SecretInput
          label="رمز الغرفة"
          value={roomCode}
          onChangeText={t => setRoomCode(t.toUpperCase())}
          placeholder="XXXX"
          editable={!connecting}
        />
        {connecting && (
          <ClassifiedBanner label="جاري الاتصال" variant="gold">
            في انتظار الخادم…
          </ClassifiedBanner>
        )}
      </View>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════════════
   LobbyScreen — player waiting room
══════════════════════════════════════════════════════════════ */
export const LobbyScreen = () => {
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const players   = useGameStore(s => s.players) || [];
  const roomCode  = useGameStore(s => s.roomCode);
  const myId      = useGameStore(s => s.myPlayerId);
  const c = getColors(themeMode);

  return (
    <DossierLayout
      top={
        <CaseHeader
          mode="neutral"
          title="غرفة الانتظار"
          subtitle="في انتظار بدء المهمة"
          roomCode={roomCode}
        />
      }
    >
      <View style={styles.lobbyContent}>
        <ClassifiedBanner label="الحالة" variant="gold">
          ⚠️ بانتظار إشارة المضيف لبدء المهمة…
        </ClassifiedBanner>

        <View style={[styles.playersBox, { flex: 1, borderColor: c.border }]}>
          <Text style={[styles.boxLabel, { color: c.textMuted }]}>اللاعبون ({players.length}/8)</Text>
          <ScrollView contentContainerStyle={styles.playersGrid}>
            {players.map((p, i) => (
              <FileBadge
                key={p.id || i}
                name={p.name}
                number={i + 1}
                size={p.id === myId ? 'lg' : 'md'}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  footerRow: {
    flex: 1,
    flexDirection: 'row',
    gap: sp.s,
    alignItems: 'center',
  },
  formCenter: {
    flex: 1,
    justifyContent: 'center',
    gap: sp.m,
  },

  // Lobby
  lobbyContent: {
    flex: 1,
    gap: sp.s,
  },
  playersBox: {
    borderWidth: 1,
    borderRadius: radius.m,
    padding: sp.m,
    gap: sp.s,
  },
  boxLabel: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp.s,
  },
});
