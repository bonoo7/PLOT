import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { BlinkCursor, PlayerBadge, ProgressBar, ResultCard, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalLayout, TerminalTypewriter } from '../components';
import { formatTime, getColors, sp, fontFamily, fontSize, useLayout, getHighlightedParts } from '../tokens';

const renderBlitzText = (text, template, baseStyle, highlightStyle) => {
  if (!template || !template.includes('_____')) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  const parts = getHighlightedParts(text, template);
  return (
    <Text style={baseStyle}>
      {parts.map((p, idx) => (
        <Text key={idx} style={p.filled ? highlightStyle : undefined}>
          {p.text}
        </Text>
      ))}
    </Text>
  );
};


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
  const { socket } = useSocket();
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

  if (voteTieInfo && votingType === 'culprit') {
    return (
      <TerminalLayout
        top={<TerminalHeader title="VOTE TIE DETECTED" subtitle={playerName || 'المضيف'} roomCode={roomCode} round={round} totalRounds={totalRounds} roleEmoji="🖥️" roleName="[HOST]" />}
        bottom={<TerminalButton title="بدء إعادة التصويت" onPress={() => socket?.emit('hostStartRevote', { roomCode })} variant="danger" size="sm" style={{ flex: 1 }} />}
      >
        <View style={styles.body}>
          <TerminalBanner variant="error" label="TIE EVENT">
            تعادل في الأصوات! لم يتم حسم الجاني.
          </TerminalBanner>

          <TerminalCard title="> المشتبه بهم المتعادلون / TIED CANDIDATES" tone="danger">
            <View style={{ gap: sp.s, paddingVertical: sp.s }}>
              {(voteTieInfo.candidates || []).map((candidateName, index) => (
                <PlayerBadge key={index} name={candidateName} index={index + 1} isActive={true} />
              ))}
            </View>
          </TerminalCard>

          <TerminalCard title="> العواقب والتحذير / WARNING & DETAILS" tone="warning">
            <Text style={[styles.voteText, { color: '#FFFF00', textAlign: 'right', writingDirection: 'rtl' }]}>
              ⚠️ تنبيه هام:
              {"\n"}
              لقد تعادل التصويت لتحديد الجاني. يجب إعادة التصويت لحسم الجولة.
              {"\n\n"}
              ⚠️ عواقب التعادل مجدداً:
              {"\n"}
              إذا تعادل التصويت مرة أخرى (للمرة الثانية على التوالي)، سيفوز فريق الجريمة (Crime Team) مباشرة بالجولة وتخسر العدالة!
              {"\n\n"}
              اضغط على زر "بدء إعادة التصويت" بالأسفل لفتح باب التصويت مجدداً للاعبين.
            </Text>
          </TerminalCard>
        </View>
      </TerminalLayout>
    );
  }

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
              {renderBlitzText(
                scenario.answer || scenario.text || '...',
                scenario.template,
                styles.voteText,
                { color: '#FFFF00', fontWeight: '700', textDecorationLine: 'underline' }
              )}
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
  const players = useGameStore((s) => s.players) || [];

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
        
        <ResultCard players={mappedScores} hideDetails={isContinue} />

        {/* Quality Votes map - only shown if game is decided (not CONTINUE) */}
        {!isContinue && roundResults.qualityVotes && Object.keys(roundResults.qualityVotes).length > 0 && (
          <TerminalCard title="> أصوات الجودة / QUALITY VOTES" tone="info">
            <View style={styles.voteMapList}>
              {Object.entries(roundResults.qualityVotes).map(([voterId, scenarioIndex], vi) => {
                const voter = players.find(p => p.id === voterId);
                if (!voter) return null;
                return (
                  <View key={voterId} style={styles.voteMapRow}>
                    <Text style={styles.voteMapText}>
                      {voter.name} ➔ السيناريو {parseInt(scenarioIndex) + 1}
                    </Text>
                  </View>
                );
              })}
            </View>
          </TerminalCard>
        )}

        {/* Culprit Votes map - only shown if game is decided (not CONTINUE) */}
        {!isContinue && roundResults.culpritVotes && Object.keys(roundResults.culpritVotes).length > 0 && (
          <TerminalCard title="> اتهامات الجاني / CULPRIT ACCUSATIONS" tone="danger">
            <View style={styles.voteMapList}>
              {Object.entries(roundResults.culpritVotes).map(([voterId, accusedId], vi) => {
                const voter = players.find(p => p.id === voterId);
                const accused = players.find(p => p.id === accusedId);
                if (!voter || !accused) return null;
                return (
                  <View key={voterId} style={styles.voteMapRow}>
                    <Text style={styles.voteMapText}>
                      {voter.name} ➔ اتهم {accused.name}
                    </Text>
                  </View>
                );
              })}
            </View>
          </TerminalCard>
        )}
      </ScrollView>
    </TerminalLayout>
  );
};

export const HostDramaticRevealScreen = () => {
  const roomCode = useGameStore((s) => s.roomCode);
  const currentReveal = useGameStore((s) => s.currentReveal);
  const playerName = useGameStore((s) => s.playerName);
  const players = useGameStore((s) => s.players) || [];
  const c = getColors();

  if (!currentReveal) {
    return (
      <TerminalLayout top={<TerminalHeader title="DRAMATIC REVEAL" subtitle={playerName || 'المضيف'} roomCode={roomCode} roleEmoji="🖥️" roleName="[HOST]" />}>
        <View style={styles.centered}>
          <Text style={[styles.largeTitle, { color: c.textMuted }]}>جاري تحضير الكشف...</Text>
          <BlinkCursor />
        </View>
      </TerminalLayout>
    );
  }

  if (currentReveal.type === 'HINT') {
    return (
      <TerminalLayout top={<TerminalHeader title="SECRET HINT" subtitle={playerName || 'المضيف'} roomCode={roomCode} roleEmoji="🖥️" roleName="[HOST]" />}>
        <View style={styles.body}>
          <TerminalBanner variant="warning" label="HINT">{currentReveal.text}</TerminalBanner>
        </View>
      </TerminalLayout>
    );
  }

  return (
    <TerminalLayout top={<TerminalHeader title="DRAMATIC REVEAL" subtitle={playerName || 'المضيف'} roomCode={roomCode} roleEmoji="🖥️" roleName="[HOST]" />}>
      <View style={styles.body}>
        <TerminalCard title="> LIVE FEED" tone="warning">
          <TerminalTypewriter
            text={currentReveal.text}
            template={currentReveal.template}
            speed={20}
            textStyle={[styles.voteText, { color: c.textPrimary }]}
            style={styles.typewriterWrapper}
          />
          {currentReveal.author ? <Text style={styles.metaText}>{`— ${currentReveal.author}`}</Text> : null}
        </TerminalCard>
        
        {currentReveal.voters?.length ? (
          <TerminalCard title="> المصوتون / VOTERS" tone="info">
            <View style={styles.scenarioVotersGrid}>
              {currentReveal.voters.map((item, idx) => {
                const name = typeof item === 'object' ? item.name : item;
                const playerObj = players.find((p) => p.name === name || (item.id && p.id === item.id));
                const plIndex = playerObj ? players.indexOf(playerObj) + 1 : idx + 1;
                return (
                  <PlayerBadge
                    key={idx}
                    name={name}
                    index={plIndex}
                    isActive={true}
                    style={styles.scenarioVoterBadge}
                  />
                );
              })}
            </View>
          </TerminalCard>
        ) : null}
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
  typewriterWrapper: {
    width: '100%',
  },
  metaText: {
    marginTop: sp.xs,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00FF41',
    textAlign: 'left',
  },
  votersLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00CC33',
    fontWeight: 'bold',
    marginBottom: sp.xs,
  },
  scenarioVotersWrapper: {
    marginTop: sp.s,
    gap: sp.xs,
  },
  scenarioVotersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp.s,
  },
  scenarioVoterBadge: {
    width: '48%',
    minWidth: 140,
  },
  voteMapList: {
    gap: sp.xs,
  },
  voteMapRow: {
    paddingVertical: sp.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.1)',
  },
  voteMapText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00FF41',
    textAlign: 'right',
  },
});
