import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { InvestigationNote } from '../../components/InvestigationNote';
import { PlayerBadge, ProgressBar, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalLayout } from '../components';
import { formatTime, getRoleMeta, sp, useLayout, fontFamily, fontSize } from '../tokens';

export const DiscussionScreen = ({ isHost = false }) => {
  const { socket } = useSocket();
  const roomCode = useGameStore((s) => s.roomCode);
  const roleData = useGameStore((s) => s.roleData);
  const players = useGameStore((s) => s.players) || [];
  const speakingPlayerId = useGameStore((s) => s.speakingPlayerId);
  const revealedScenarios = useGameStore((s) => s.revealedScenarios) || [];
  const hint = useGameStore((s) => s.lastHint);
  const pendingAbilityResult = useGameStore((s) => s.pendingAbilityResult);
  const abilityResultSeen = useGameStore((s) => s.abilityResultSeen);
  const setAbilityResultSeen = useGameStore((s) => s.setAbilityResultSeen);
  const playerName = useGameStore((s) => s.playerName);
  const timeLeft = useGameStore((s) => s.timeLeft) || 0;
  const { isLandscape, isDesktop } = useLayout();
  const wide = isLandscape || isDesktop;
  const meta = getRoleMeta(roleData?.role);
  const speakingPlayer = players.find((player) => player.id === speakingPlayerId);

  return (
    <TerminalLayout
      top={<TerminalHeader title={isHost ? 'DISCUSSION CONTROL' : 'DISCUSSION FEED'} subtitle={playerName} roomCode={roomCode} roleName={isHost ? '[HOST]' : meta.bracket} roleEmoji={isHost ? '🎙️' : meta.emoji} />}
      bottom={isHost ? <TerminalButton title="إنهاء النقاش" onPress={() => socket?.emit('endDiscussion', { roomCode })} size="sm" style={{ flex: 1 }} /> : null}
    >
      <InvestigationNote
        visible={!!(pendingAbilityResult && !abilityResultSeen)}
        type={pendingAbilityResult?.type}
        targetName={pendingAbilityResult?.targetName}
        result={pendingAbilityResult?.result}
        isSabotaged={pendingAbilityResult?.isSabotaged}
        message={pendingAbilityResult?.message}
        content={pendingAbilityResult?.content}
        keywords={pendingAbilityResult?.keywords}
        onDismiss={() => setAbilityResultSeen?.(true)}
      />

      <View style={styles.body}>
        {timeLeft > 0 ? <ProgressBar value={timeLeft} max={90} label="> DISCUSSION TIMER" showTime timeText={formatTime(timeLeft)} /> : null}
        {hint ? <TerminalBanner variant="info" label="HINT">{hint}</TerminalBanner> : null}

        <TerminalCard title="> ACTIVE SPEAKER" tone={speakingPlayer ? 'info' : 'warning'}>
          {speakingPlayer ? (
            <PlayerBadge name={speakingPlayer.name} index={(players.findIndex((p) => p.id === speakingPlayer.id) || 0) + 1} isSpeaking />
          ) : (
            <Text style={styles.emptyText}>{isHost ? 'اختر لاعباً لبدء الحديث.' : 'بانتظار أن يحدد المضيف المتحدث.'}</Text>
          )}
        </TerminalCard>

        {isHost ? (
          <ScrollView contentContainerStyle={[styles.playerGrid, wide && styles.playerGridWide]} showsVerticalScrollIndicator={false}>
            {players.map((player, index) => (
              <TouchableOpacity key={player.id || index} style={wide ? styles.playerWide : null} onPress={() => socket?.emit('setSpeaker', { roomCode, playerId: player.id === speakingPlayerId ? null : player.id })}>
                <PlayerBadge name={player.name} index={index + 1} isActive={player.id === speakingPlayerId} style={{ width: '100%' }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scenarioList} showsVerticalScrollIndicator={false}>
            {revealedScenarios.map((scenario, index) => (
              <TerminalCard key={index} title={`> LOG ${index + 1}`} tone="info">
                <Text style={styles.scenarioText}>{scenario.text || scenario.answer || '...'}</Text>
                {scenario.author ? <Text style={styles.scenarioMeta}>{`— ${scenario.author}`}</Text> : null}
              </TerminalCard>
            ))}
          </ScrollView>
        )}
      </View>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: sp.s,
  },
  emptyText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    color: '#00CC33',
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
  playerWide: {
    width: '48%',
  },
  scenarioList: {
    gap: sp.s,
    paddingBottom: sp.l,
  },
  scenarioText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    color: '#00FF41',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  scenarioMeta: {
    marginTop: sp.xs,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00CC33',
    textAlign: 'left',
  },
});
