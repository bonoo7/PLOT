/**
 * design-v2/screens/HostScreens.js
 * HostSetupScreen + HostLobbyScreen
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { playMusic } from '../../utils/soundManager';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket, ROUTES } from '../../hooks/useGameSocket';
import { DossierLayout, DossierCard, StampButton, FileBadge, CaseHeader, ClassifiedBanner } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';

/* ══════════════════════════════════════════════════════════════
   HostSetupScreen
══════════════════════════════════════════════════════════════ */
export const HostSetupScreen = () => {
  const navigation = useNavigation();
  const { socket }    = useSocket();
  const playerName    = useGameStore(s => s.playerName);
  const connecting    = useGameStore(s => s.connecting);
  const setConnecting = useGameStore(s => s.setConnecting);
  const themeMode     = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);

  React.useEffect(() => { playMusic('setup'); }, []);

  const handleCreate = () => {
    if (socket) {
      setConnecting(true);
      socket.emit('createRoom', { playerName: playerName || 'المضيف', isHost: true });
    }
  };

  return (
    <DossierLayout
      top={<CaseHeader mode="neutral" title="مركز القيادة" subtitle="إعداد غرفة جديدة" />}
      bottom={
        <StampButton title="← رجوع" onPress={() => navigation.goBack()} variant="ghost" size="sm" />
      }
    >
      <View style={styles.setupCenter}>
        <ClassifiedBanner label="معلومات المهمة" variant="info">
          <Text style={[styles.infoLine, { color: c.text }]}>• عدد اللاعبين: 4 – 8</Text>
          <Text style={[styles.infoLine, { color: c.text }]}>• الوقت المتوقع: 30 – 45 دقيقة</Text>
          <Text style={[styles.infoLine, { color: c.text }]}>• أدوار: جاني، محقق، شاهد، مخرب…</Text>
        </ClassifiedBanner>

        <StampButton
          title={connecting ? 'جاري الإنشاء…' : 'إنشاء غرفة 🚀'}
          onPress={handleCreate}
          disabled={connecting}
          variant="primary"
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════════════
   HostLobbyScreen
══════════════════════════════════════════════════════════════ */
const ROLE_ORDER = [
  { code: 'CULPRIT',     name: 'الجاني 🎭' },
  { code: 'WITNESS',     name: 'الشاهد 👁️' },
  { code: 'DETECTIVE',   name: 'المحقق 🕵️‍♂️' },
  { code: 'SABOTEUR',    name: 'المخرب 🧨' },
  { code: 'MINISTER',    name: 'الوزير 📜' },
  { code: 'BENEFICIARY', name: 'المستفيد 💰' },
  { code: 'SEER',        name: 'العرّاف 🔮' },
  { code: 'MASTERMIND',  name: 'العقل المدبر 🧠' },
];

export const HostLobbyScreen = () => {
  const navigation = useNavigation();
  const { socket }  = useSocket();
  const themeMode   = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);
  const { isLandscape, isDesktop } = useLayout();

  const rawCode  = useGameStore(s => s.generatedRoomCode || s.roomCode);
  const roomCode = typeof rawCode === 'string' ? rawCode : (rawCode?.roomCode || '');
  const players  = useGameStore(s => s.players) || [];
  const gameMode = useGameStore(s => s.gameMode);
  const resetGame= useGameStore(s => s.resetGame);

  const canStart   = players.length >= 4 && players.length <= 8;
  const needsMore  = Math.max(0, 4 - players.length);
  const nextRole   = players.length < ROLE_ORDER.length ? ROLE_ORDER[players.length] : { name: 'مواطن' };

  const handleStart     = () => socket?.emit('startGame');
  const handleFillBots  = () => socket?.emit('fillBots');
  const handleMode      = (m) => socket?.emit('updateGameSettings', { roomCode, settings: { gameMode: m } });
  const handleClose     = () => { resetGame(); navigation.navigate(ROUTES.ROLE_SELECT); };

  const wide = isLandscape || isDesktop;

  return (
    <DossierLayout
      top={
        <CaseHeader
          mode="host"
          roomCode={roomCode}
          phase="غرفة الانتظار"
          round={`${players.length}/8`}
        />
      }
      bottom={
        <View style={styles.lobbyFooter}>
          <StampButton title="إغلاق الغرفة" onPress={handleClose} variant="ghost" size="sm" />
          {players.length < 8 && (
            <StampButton
              title={`+ بوت (${nextRole.name})`}
              onPress={handleFillBots}
              variant="secondary"
              size="sm"
            />
          )}
          <StampButton
            title={canStart ? 'بدء المهمة 🚀' : `${needsMore} متبقي…`}
            onPress={handleStart}
            disabled={!canStart}
            variant="primary"
            size="sm"
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <View style={styles.lobbyContent}>

        {/* Mode selector — always at the top regardless of orientation */}
        <View style={styles.modeBar}>
          <Text style={[styles.modeLabel, { color: c.textMuted }]}>نمط اللعبة</Text>
          <View style={[styles.modeSegment, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
            <TouchableOpacity
              style={[styles.modeSeg, gameMode === 'BLITZ' && { backgroundColor: c.red }]}
              onPress={() => handleMode('BLITZ')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeSegText, { color: gameMode === 'BLITZ' ? '#FFF' : c.textSub }]}>
                🧩 إكمال الفراغ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeSeg, gameMode === 'CLASSIC' && { backgroundColor: c.red }]}
              onPress={() => handleMode('CLASSIC')}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeSegText, { color: gameMode === 'CLASSIC' ? '#FFF' : c.textSub }]}>
                ✍️ كتابة كاملة
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Players grid — takes remaining space */}
        <View style={[styles.playersSection, { flex: 1, borderColor: c.border }]}>
          <Text style={[styles.sectionLabel, { color: c.textMuted }]}>
            العملاء المتصلون ({players.length}/8)
          </Text>
          {players.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>في انتظار انضمام العملاء…</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.playersGrid}>
              {players.map((p, i) => (
                <FileBadge key={p.id || i} name={p.name} number={i + 1} size="md" />
              ))}
            </ScrollView>
          )}
        </View>

      </View>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  setupCenter: {
    flex: 1,
    justifyContent: 'center',
    gap: sp.l,
  },
  infoLine: {
    fontSize: fontSize.body,
    fontFamily: fontFamily.mono,
    lineHeight: fontSize.body * 1.6,
  },

  // Lobby
  lobbyContent: {
    flex: 1,
    gap: sp.s,
  },
  // Mode segmented control
  modeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp.s,
  },
  modeLabel: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  modeSegment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.s,
    overflow: 'hidden',
  },
  modeSeg: {
    paddingVertical: sp.xs,
    paddingHorizontal: sp.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSegText: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
  playersSection: {
    borderWidth: 1,
    borderRadius: radius.m,
    padding: sp.m,
    gap: sp.s,
    minHeight: 80,
  },
  sectionLabel: {
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp.xl,
  },
  emptyText: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.mono,
    fontStyle: 'italic',
  },
  lobbyFooter: {
    flex: 1,
    flexDirection: 'row',
    gap: sp.xs,
    alignItems: 'center',
  },
});
