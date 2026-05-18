import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES, useSocket } from '../../hooks/useGameSocket';
import { useGameStore } from '../../store/useGameStore';
import { BlinkCursor, PlayerBadge, ResultCard, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalLayout } from '../components';
import { getRoleMeta, sp, fontFamily, fontSize } from '../tokens';

const mapScores = (scores = []) =>
  [...scores]
    .sort((a, b) => (b.totalScore ?? b.score ?? 0) - (a.totalScore ?? a.score ?? 0))
    .map((player, index) => ({ ...player, isWinner: index === 0 }));

const useMeta = () => getRoleMeta(useGameStore((s) => s.roleData?.role));

export const QualityVotingScreen = () => {
  const { socket } = useSocket();
  const scenarios = useGameStore((s) => s.scenarios) || [];
  const hasVoted = useGameStore((s) => s.hasVoted);
  const myAnswer = useGameStore((s) => s.answer);
  const roomCode = useGameStore((s) => s.roomCode);
  const playerName = useGameStore((s) => s.playerName);
  const setHasVoted = useGameStore((s) => s.setHasVoted);
  const setSelectedScenario = useGameStore((s) => s.setSelectedScenario);
  const meta = useMeta();
  const [selected, setSelected] = useState(null);

  const handleVote = () => {
    if (selected === null || !socket) return;
    setHasVoted(true);
    setSelectedScenario(selected);
    socket.emit('submitQualityVote', { roomCode, scenarioIndex: selected });
  };

  return (
    <TerminalLayout
      top={<TerminalHeader title="QUALITY VOTE" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}
      bottom={hasVoted ? <TerminalBanner variant="success" label="UPLINK">تم تسجيل صوتك.</TerminalBanner> : <TerminalButton title="تأكيد التصويت" onPress={handleVote} disabled={selected === null} size="sm" style={{ flex: 1 }} />}
    >
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {scenarios.map((scenario, index) => {
          const isMine = (scenario.answer || scenario.text) === myAnswer;
          const active = selected === index;
          return (
            <TouchableOpacity key={index} disabled={hasVoted || isMine} activeOpacity={0.85} onPress={() => setSelected(index)}>
              <TerminalCard title={`> [${String(index + 1).padStart(2, '0')}]`} tone={active ? 'success' : 'info'} style={{ opacity: hasVoted || isMine ? 0.55 : 1 }}>
                <Text style={styles.text}>{scenario.answer || scenario.text || '...'}</Text>
                {isMine ? <Text style={styles.meta}>هذا النص يعود لك</Text> : null}
              </TerminalCard>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </TerminalLayout>
  );
};

export const CulpritVotingScreen = () => {
  const { socket } = useSocket();
  const scenarios = useGameStore((s) => s.scenarios) || [];
  const hasVoted = useGameStore((s) => s.hasVoted);
  const roomCode = useGameStore((s) => s.roomCode);
  const playerName = useGameStore((s) => s.playerName);
  const setHasVoted = useGameStore((s) => s.setHasVoted);
  const setSelectedCulprit = useGameStore((s) => s.setSelectedCulprit);
  const meta = useMeta();
  const [selected, setSelected] = useState(null);

  const handleVote = () => {
    if (selected === null || !socket) return;
    setHasVoted(true);
    setSelectedCulprit(selected);
    const choice = scenarios[selected]?.playerId || selected;
    socket.emit('submitCulpritVote', { roomCode, playerId: choice });
  };

  return (
    <TerminalLayout
      top={<TerminalHeader title="CULPRIT VOTE" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}
      bottom={hasVoted ? <TerminalBanner variant="error" label="TARGET LOCKED">تم تثبيت الاتهام.</TerminalBanner> : <TerminalButton title="تأكيد الاتهام" onPress={handleVote} disabled={selected === null} variant="danger" size="sm" style={{ flex: 1 }} />}
    >
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {scenarios.map((scenario, index) => {
          const active = selected === index;
          const isSelf = scenario.playerId && scenario.playerId === socket?.id;
          return (
            <TouchableOpacity key={index} disabled={hasVoted || isSelf} activeOpacity={0.85} onPress={() => setSelected(index)}>
              <TerminalCard title={`> SUSPECT ${index + 1}`} tone={active ? 'danger' : 'warning'} style={{ opacity: hasVoted || isSelf ? 0.45 : 1 }}>
                <PlayerBadge name={scenario.playerName || scenario.author || 'مجهول'} index={index + 1} />
                <Text style={styles.text}>{scenario.answer || scenario.text || '...'}</Text>
                {isSelf ? <Text style={styles.meta}>لا يمكنك اتهام نفسك</Text> : null}
              </TerminalCard>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </TerminalLayout>
  );
};

export const WaitingRevealScreen = ({ message = 'في انتظار الكشف...' }) => {
  const roomCode = useGameStore((s) => s.roomCode);
  const playerName = useGameStore((s) => s.playerName);
  const meta = useMeta();

  return (
    <TerminalLayout top={<TerminalHeader title="REVEAL PENDING" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}>
      <View style={styles.waitState}>
        <Text style={styles.waitText}>{message}</Text>
        <BlinkCursor />
      </View>
    </TerminalLayout>
  );
};

export const PlayerDramaticRevealScreen = () => {
  const roomCode = useGameStore((s) => s.roomCode);
  const playerName = useGameStore((s) => s.playerName);
  const currentReveal = useGameStore((s) => s.currentReveal);
  const meta = useMeta();

  if (!currentReveal) return <WaitingRevealScreen message="جاري تحضير الكشف..." />;
  if (currentReveal.type === 'HINT') {
    return (
      <TerminalLayout top={<TerminalHeader title="SECRET HINT" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}>
        <View style={styles.waitState}>
          <TerminalBanner variant="warning" label="HINT">{currentReveal.text}</TerminalBanner>
        </View>
      </TerminalLayout>
    );
  }

  return (
    <TerminalLayout top={<TerminalHeader title="DRAMATIC REVEAL" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}>
      <View style={styles.list}>
        <TerminalCard title="> LIVE REVEAL" tone="warning">
          <Text style={styles.text}>{currentReveal.text}</Text>
          {currentReveal.author ? <Text style={styles.meta}>{`— ${currentReveal.author}`}</Text> : null}
        </TerminalCard>
        {currentReveal.voters?.length ? <TerminalBanner variant="info" label="VOTERS">{currentReveal.voters.map((item) => (typeof item === 'object' ? item.name : item)).join(' — ')}</TerminalBanner> : null}
      </View>
    </TerminalLayout>
  );
};

export const PlayerResultsScreen = () => {
  const roomCode = useGameStore((s) => s.roomCode);
  const playerName = useGameStore((s) => s.playerName);
  const roundResults = useGameStore((s) => s.roundResults);
  const meta = useMeta();

  if (!roundResults) return <WaitingRevealScreen message="جاري حساب النتائج..." />;

  return (
    <TerminalLayout top={<TerminalHeader title="ROUND RESULTS" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <TerminalBanner variant="success" label="SYNC COMPLETE">تم تحديث شاشة اللاعب بنتائج الجولة.</TerminalBanner>
        <ResultCard players={mapScores(roundResults.scores || [])} />
      </ScrollView>
    </TerminalLayout>
  );
};

export const EndScreen = () => {
  const navigation = useNavigation();
  const { socket } = useSocket();
  const resetGame = useGameStore((s) => s.resetGame);
  const finalResults = useGameStore((s) => s.finalResults) || [];

  const handleRestart = () => {
    socket?.disconnect();
    resetGame();
    navigation.navigate(ROUTES.ROLE_SELECT);
  };

  return (
    <TerminalLayout
      top={<TerminalHeader title="GAME OVER" subtitle="النهاية" />}
      bottom={<TerminalButton title="العودة للرئيسية" onPress={handleRestart} size="sm" style={{ flex: 1 }} />}
    >
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <TerminalBanner variant="success" label="FINAL STATE">انتهت اللعبة. هذا هو الترتيب النهائي.</TerminalBanner>
        <ResultCard players={mapScores(finalResults)} />
      </ScrollView>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: sp.s,
    paddingBottom: sp.l,
  },
  text: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    color: '#00CC33',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  meta: {
    marginTop: sp.xs,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00FF41',
  },
  waitState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.s,
  },
  waitText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    color: '#00FF41',
  },
});
