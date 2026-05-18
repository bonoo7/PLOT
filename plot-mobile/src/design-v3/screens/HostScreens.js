import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { ROUTES, useSocket } from '../../hooks/useGameSocket';
import { playMusic } from '../../utils/soundManager';
import { PlayerBadge, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalLayout } from '../components';
import { fontFamily, fontSize, getColors, sp, useLayout } from '../tokens';

export const HostSetupScreen = () => {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const playerName = useGameStore((s) => s.playerName);
  const connecting = useGameStore((s) => s.connecting);
  const setConnecting = useGameStore((s) => s.setConnecting);
  const c = getColors();

  React.useEffect(() => {
    playMusic('setup');
  }, []);

  const handleCreate = () => {
    if (!socket) return;
    setConnecting(true);
    socket.emit('createRoom', { playerName: playerName || 'المضيف', isHost: true });
  };

  return (
    <TerminalLayout
      top={<TerminalHeader title="HOST CONSOLE" subtitle={playerName || 'المضيف'} roleEmoji="🖥️" roleName="[HOST]" />}
      bottom={
        <View style={styles.footerRow}>
          <TerminalButton title="← رجوع" onPress={() => navigation.goBack()} variant="ghost" size="sm" />
          <TerminalButton title={connecting ? 'جارٍ الإنشاء...' : 'إنشاء الغرفة'} onPress={handleCreate} disabled={connecting} size="sm" style={{ flex: 1 }} />
        </View>
      }
    >
      <View style={styles.setupContent}>
        <TerminalBanner variant="info" label="SYSTEM">الغرفة تحتاج من 4 إلى 8 لاعبين. يمكن إضافة بوتات لملء المقاعد الشاغرة.</TerminalBanner>
        <TerminalCard title="> MISSION PARAMETERS" tone="info">
          <Text style={[styles.infoText, { color: c.textPrimary }]}>• نمط لعب جماعي عربي سريع.</Text>
          <Text style={[styles.infoText, { color: c.textPrimary }]}>• جولة كتابة، تصويت جودة، نقاش، ثم تصويت على الجاني.</Text>
          <Text style={[styles.infoText, { color: c.textPrimary }]}>• أفضل تجربة: شاشة واحدة للمضيف وباقي اللاعبين على هواتفهم.</Text>
        </TerminalCard>
      </View>
    </TerminalLayout>
  );
};

export const HostLobbyScreen = () => {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const rawCode = useGameStore((s) => s.generatedRoomCode || s.roomCode);
  const players = useGameStore((s) => s.players) || [];
  const gameMode = useGameStore((s) => s.gameMode);
  const resetGame = useGameStore((s) => s.resetGame);
  const playerName = useGameStore((s) => s.playerName);
  const c = getColors();
  const { isLandscape, isDesktop } = useLayout();
  const wide = isLandscape || isDesktop;
  const roomCode = typeof rawCode === 'string' ? rawCode : rawCode?.roomCode || '';
  const canStart = players.length >= 4 && players.length <= 8;
  const needsMore = Math.max(0, 4 - players.length);

  const handleClose = () => {
    resetGame();
    navigation.navigate(ROUTES.ROLE_SELECT);
  };

  return (
    <TerminalLayout
      top={<TerminalHeader title="HOST LOBBY" subtitle={playerName || 'المضيف'} roomCode={roomCode} round={players.length ? `${players.length}/8` : null} roleEmoji="🖥️" roleName="[HOST]" />}
      bottom={
        <View style={styles.footerRow}>
          <TerminalButton title="إغلاق" onPress={handleClose} variant="ghost" size="sm" />
          {players.length < 8 ? <TerminalButton title="+ BOT" onPress={() => socket?.emit('fillBots')} variant="secondary" size="sm" /> : null}
          <TerminalButton title={canStart ? 'بدء الجولة' : `${needsMore} متبقٍ`} onPress={() => socket?.emit('startGame')} disabled={!canStart} size="sm" style={{ flex: 1 }} />
        </View>
      }
    >
      <View style={styles.lobbyContent}>
        <TerminalCard title="> ROOM CODE" tone="success">
          <Text style={[styles.roomCode, { color: c.accentGreen }]}>{`▶ ${roomCode || '----'} ◀`}</Text>
        </TerminalCard>

        <View style={styles.modeRow}>
          {[
            { key: 'BLITZ', label: '> BLITZ / إكمال الفراغ' },
            { key: 'CLASSIC', label: '> CLASSIC / كتابة كاملة' },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[styles.modeButton, { borderColor: gameMode === mode.key ? c.borderBright : c.border, backgroundColor: gameMode === mode.key ? 'rgba(0,255,65,0.08)' : c.bgAlt }]}
              onPress={() => socket?.emit('updateGameSettings', { roomCode, settings: { gameMode: mode.key } })}
            >
              <Text style={[styles.modeText, { color: gameMode === mode.key ? c.accentGreen : c.textMuted }]}>{mode.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TerminalBanner variant={canStart ? 'success' : 'warning'} label="الحالة">
          {canStart ? 'عدد اللاعبين مناسب. يمكنك بدء الجولة الآن.' : `بانتظار ${needsMore} لاعبين إضافيين على الأقل.`}
        </TerminalBanner>

        <ScrollView contentContainerStyle={[styles.playerGrid, wide && styles.playerGridWide]} showsVerticalScrollIndicator={false}>
          {players.map((player, index) => (
            <PlayerBadge key={player.id || index} name={player.name} index={index + 1} style={wide ? styles.playerBadgeWide : null} />
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
  setupContent: {
    flex: 1,
    justifyContent: 'center',
    gap: sp.s,
  },
  infoText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  lobbyContent: {
    flex: 1,
    gap: sp.s,
  },
  roomCode: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.display,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
  },
  modeRow: {
    flexDirection: 'row',
    gap: sp.s,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: sp.s,
    paddingHorizontal: sp.m,
  },
  modeText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    fontWeight: '700',
    textAlign: 'center',
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
