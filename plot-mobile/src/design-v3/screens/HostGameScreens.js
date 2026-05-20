import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { PlayerBadge, ProgressBar, ResultCard, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalLayout } from '../components';
import { formatTime, getColors, sp, fontFamily, fontSize, useLayout } from '../tokens';

const mapScores = (scores = []) =>
  [...scores]
    .sort((a, b) => (b.totalScore ?? b.score ?? 0) - (a.totalScore ?? a.score ?? 0))
    .map((player, index) => ({ ...player, isWinner: index === 0 }));

export const HostGameIntroScreen = () => {
  const roomCode = useGameStore((s) => s.roomCode);
  const round = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const scenario = useGameStore((s) => s.scenario);
  const playerName = useGameStore((s) => s.playerName);

  return (
    <TerminalLayout top={<TerminalHeader title="ROUND INIT" subtitle={playerName || 'المضيف'} roomCode={roomCode} round={round} totalRounds={totalRounds} roleEmoji="🖥️" roleName="[HOST]" />}>
      <View style={styles.centered}>
        <TerminalCard title="> CASE FILE" tone="info">
          <Text style={styles.largeTitle}>{scenario || 'جارٍ تحميل السيناريو...'}</Text>
        </TerminalCard>
        <TerminalBanner variant="warning" label="SYNC">جارٍ توزيع الأدوار على جميع اللاعبين...</TerminalBanner>
      </View>
    </TerminalLayout>
  );
};

export const HostDraftingScreen = () => {
  const roomCode = useGameStore((s) => s.roomCode);
  const players = useGameStore((s) => s.players) || [];
  const waitingFor = useGameStore((s) => s.waitingFor) || [];
  const timeLeft = useGameStore((s) => s.timeLeft) || 0;
  const hint = useGameStore((s) => s.lastHint);
  const round = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const playerName = useGameStore((s) => s.playerName);
  const { isLandscape, isDesktop } = useLayout();
  const wide = isLandscape || isDesktop;
  const submitted = players.length - waitingFor.length;

  return (
    <TerminalLayout top={<TerminalHeader title="HOST DRAFTING" subtitle={playerName || 'المضيف'} roomCode={roomCode} round={round} totalRounds={totalRounds} roleEmoji="🖥️" roleName="[HOST]" />}>
      <View style={styles.body}>
        {hint ? <TerminalBanner variant="info" label="HINT">{hint}</TerminalBanner> : null}
        <ProgressBar value={timeLeft} max={90} label="> TIME REMAINING" showTime timeText={formatTime(timeLeft)} />
        <ProgressBar value={submitted} max={Math.max(1, players.length)} label="> SUBMISSION STATUS" showTime timeText={`${submitted}/${players.length}`} />
        <ScrollView contentContainerStyle={[styles.playerGrid, wide && styles.playerGridWide]} showsVerticalScrollIndicator={false}>
          {players.map((player, index) => {
            const done = !waitingFor.includes(player.id);
            return (
              <PlayerBadge
                key={player.id || index}
                name={player.name}
                index={index + 1}
                isActive={done}
                style={wide ? styles.playerWide : null}
                score={done ? 1 : 0}
              />
            );
          })}
        </ScrollView>
      </View>
    </TerminalLayout>
  );
};

export const HostVotingScreen = ({ route }) => {
  const roomCode = useGameStore((s) => s.roomCode);
  const scenarios = useGameStore((s) => s.scenarios) || [];
  const liveVotes = useGameStore((s) => s.liveVotes) || [];
  const players = useGameStore((s) => s.players) || [];
  const voteTieInfo = useGameStore((s) => s.voteTieInfo);
  const round = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const playerName = useGameStore((s) => s.playerName);
  const votingType = route?.params?.votingType || 'quality';

  const total = players.length || 1;
  const getVotes = (index) => {
    if (votingType === 'culprit') {
      const targetId = scenarios[index]?.playerId;
      return liveVotes.filter((vote) => vote.choice === targetId).length;
    }
    return liveVotes.filter((vote) => vote.choice === index).length;
  };

  return (
    <TerminalLayout top={<TerminalHeader title={votingType === 'quality' ? 'QUALITY MONITOR' : 'CULPRIT MONITOR'} subtitle={playerName || 'المضيف'} roomCode={roomCode} round={round} totalRounds={totalRounds} roleEmoji="🖥️" roleName="[HOST]" />}>
      <View style={styles.body}>
        {voteTieInfo ? <TerminalBanner variant="error" label="TIE">إعادة تصويت بين: {(voteTieInfo.candidates || []).join(' — ')}</TerminalBanner> : null}
        <ProgressBar value={liveVotes.length} max={total} label="> VOTER UPLINK" showTime timeText={`${liveVotes.length}/${total}`} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voterRow}>
          {players.map((player, index) => (
            <PlayerBadge key={player.id || index} name={player.name} index={index + 1} isActive={liveVotes.some((vote) => vote.playerId === player.id)} style={styles.voterBadge} />
          ))}
        </ScrollView>
        <ScrollView contentContainerStyle={styles.resultList} showsVerticalScrollIndicator={false}>
          {scenarios.map((scenario, index) => (
            <TerminalCard key={index} title={`> ${votingType === 'quality' ? `ENTRY ${index + 1}` : `PLAYER ${index + 1}`}`} tone={votingType === 'quality' ? 'info' : 'danger'}>
              {votingType === 'culprit' ? <PlayerBadge name={scenario.playerName || scenario.author || 'مجهول'} index={index + 1} /> : null}
              <Text style={styles.voteText}>{scenario.answer || scenario.text || '...'}</Text>
              <ProgressBar value={getVotes(index)} max={total} label="> VOTES" showTime timeText={`${getVotes(index)} صوت`} />
            </TerminalCard>
          ))}
        </ScrollView>
      </View>
    </TerminalLayout>
  );
};

export const HostResultsScreen = () => {
  const { socket } = useSocket();
  const roomCode = useGameStore((s) => s.roomCode);
  const roundResults = useGameStore((s) => s.roundResults);
  const currentRound = useGameStore((s) => s.currentRound);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const playerName = useGameStore((s) => s.playerName);

  if (!roundResults) return null;

  const winner = roundResults.winner;
  const isContinue = winner === 'CONTINUE';
  const mappedScores = mapScores(roundResults.scores || []);
  const buttonTitle = isContinue ? 'متابعة النقاش' : roundResults.isLastRound ? 'إنهاء اللعبة' : 'الجولة التالية';

  return (
    <TerminalLayout
      top={<TerminalHeader title="ROUND RESULTS" subtitle={playerName || 'المضيف'} roomCode={roomCode} round={currentRound} totalRounds={totalRounds} roleEmoji="🖥️" roleName="[HOST]" />}
      bottom={<TerminalButton title={buttonTitle} onPress={() => socket?.emit('nextRound', { roomCode })} size="sm" style={{ flex: 1 }} />}
    >
      <ScrollView contentContainerStyle={styles.resultList} showsVerticalScrollIndicator={false}>
        {roundResults.eliminatedPlayer ? <TerminalBanner variant="warning" label="ELIMINATED">{roundResults.eliminatedPlayer.name}</TerminalBanner> : null}
        <TerminalBanner
          variant={isContinue ? 'info' : winner === 'CRIME' ? 'error' : 'success'}
          label="VERDICT"
        >
          {isContinue
            ? '⚖️ اللعبة مستمرة — لم تُحسم الجولة بعد.'
            : winner === 'CRIME'
              ? `🔴 فاز فريق الجريمة — ${roundResults.reason || ''}`
              : `🔵 فاز فريق العدالة — ${roundResults.reason || ''}`}
        </TerminalBanner>
        <ResultCard players={mappedScores} />
      </ScrollView>
    </TerminalLayout>
  );
};

export const HostDramaticRevealScreen = () => {
  const roomCode = useGameStore((s) => s.roomCode);
  const revealedScenarios = useGameStore((s) => s.revealedScenarios) || [];
  const currentReveal = useGameStore((s) => s.currentReveal);
  const playerName = useGameStore((s) => s.playerName);
  const c = getColors();

  return (
    <TerminalLayout top={<TerminalHeader title="DRAMATIC REVEAL" subtitle={playerName || 'المضيف'} roomCode={roomCode} roleEmoji="🖥️" roleName="[HOST]" />}>
      <View style={styles.body}>
        <TerminalCard title="> LIVE FEED" tone="warning">
          <Text style={[styles.voteText, { color: c.textPrimary }]}>{currentReveal?.text || 'بانتظار العنصر التالي...'}</Text>
        </TerminalCard>
        <ScrollView contentContainerStyle={styles.resultList} showsVerticalScrollIndicator={false}>
          {revealedScenarios.map((scenario, index) => (
            <TerminalCard key={index} title={`> REVEAL ${index + 1}`} tone="info">
              <Text style={styles.voteText}>{scenario.text || '...'}</Text>
              {scenario.author ? <Text style={styles.metaText}>{`— ${scenario.author}`}</Text> : null}
              {Array.isArray(scenario.voters) && scenario.voters.length > 0 && (
                <View style={styles.votersRow}>
                  <Text style={styles.votersLabel}>صوّت له:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.votersList}>
                    {scenario.voters.map((voter, vi) => (
                      <Text key={vi} style={styles.voterChip}>{voter.name || voter}</Text>
                    ))}
                  </ScrollView>
                </View>
              )}
            </TerminalCard>
          ))}
        </ScrollView>
      </View>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    gap: sp.s,
  },
  largeTitle: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.title,
    fontWeight: '700',
    color: '#00FF41',
    textAlign: 'center',
  },
  body: {
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
  playerWide: {
    width: '48%',
  },
  voterRow: {
    gap: sp.s,
    paddingBottom: sp.xs,
  },
  voterBadge: {
    width: 220,
  },
  resultList: {
    gap: sp.s,
    paddingBottom: sp.l,
  },
  voteText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    color: '#00CC33',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  metaText: {
    marginTop: sp.xs,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00FF41',
    textAlign: 'left',
  },
  votersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: sp.xs,
    gap: sp.xs,
  },
  votersLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00CC33',
    fontWeight: 'bold',
  },
  votersList: {
    flexDirection: 'row',
    gap: sp.xs,
  },
  voterChip: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00FF41',
    borderWidth: 1,
    borderColor: '#00CC33',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
});
