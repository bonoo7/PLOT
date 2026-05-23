import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES, useSocket } from '../../hooks/useGameSocket';
import { useGameStore } from '../../store/useGameStore';
import { BlinkCursor, PlayerBadge, ResultCard, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalLayout, TerminalTypewriter } from '../components';
import { getRoleMeta, sp, fontFamily, fontSize, getHighlightedParts } from '../tokens';

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
                {renderBlitzText(
                  scenario.answer || scenario.text || '...',
                  scenario.template,
                  styles.text,
                  { color: '#FFFF00', fontWeight: '700', textDecorationLine: 'underline' }
                )}
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
  const voteTieInfo = useGameStore((s) => s.voteTieInfo);
  const meta = useMeta();
  const [selected, setSelected] = useState(null);

  const handleVote = () => {
    if (selected === null || !socket) return;
    setHasVoted(true);
    setSelectedCulprit(selected);
    const choice = scenarios[selected]?.playerId || selected;
    socket.emit('submitCulpritVote', { roomCode, playerId: choice });
  };

  if (voteTieInfo) {
    return (
      <TerminalLayout
        top={<TerminalHeader title="VOTE TIE WARNING" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}
        bottom={<TerminalBanner variant="warning" label="STANDBY">بانتظار أن يبدأ المضيف إعادة التصويت...</TerminalBanner>}
      >
        <View style={styles.list}>
          <TerminalBanner variant="error" label="TIE DETECTED">
            تعادل الأصوات بين المشتبه بهم!
          </TerminalBanner>

          <TerminalCard title="> المشتبه بهم المتعادلون / TIED SUSPECTS" tone="danger">
            <View style={styles.votersGrid}>
              {(voteTieInfo.candidates || []).map((candidateName, index) => (
                <PlayerBadge key={index} name={candidateName} index={index + 1} isActive={true} style={styles.voterBadge} />
              ))}
            </View>
          </TerminalCard>

          <TerminalCard title="> عواقب التعادل / CONSEQUENCES" tone="warning">
            <Text style={[styles.text, { color: '#FFFF00', textAlign: 'right', writingDirection: 'rtl' }]}>
              ⚠️ تنبيه هام:
              {"\n"}
              لقد تعادل التصويت لتحديد الجاني في هذه الجولة.
              {"\n\n"}
              ⚠️ العواقب:
              {"\n"}
              إذا انتهى التصويت القادم بالتعادل مرة أخرى، سيفوز فريق الجريمة (Crime Team) مباشرة بالجولة وتخسر العدالة!
              {"\n\n"}
              الرجاء التنسيق والنقاش جيداً لتجنب التعادل في المرة القادمة.
            </Text>
          </TerminalCard>
        </View>
      </TerminalLayout>
    );
  }

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
                {renderBlitzText(
                  scenario.answer || scenario.text || '...',
                  scenario.template,
                  styles.text,
                  { color: '#FFFF00', fontWeight: '700', textDecorationLine: 'underline' }
                )}
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
  const meta = useMeta();

  return (
    <TerminalLayout top={<TerminalHeader title="DRAMATIC REVEAL" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}>
      <View style={styles.waitState}>
        <TerminalCard title="> انتبه للشاشة الرئيسية / LOOK AT HOST SCREEN" tone="warning" style={{ width: '100%' }}>
          <Text style={[styles.text, { color: '#00FF41', textAlign: 'center', writingDirection: 'rtl', fontSize: fontSize.medium, marginVertical: sp.m }]}>
            🖥️ أنظر إلى شاشة المضيف (Host Screen) لمتابعة الكشف الدرامي للأصوات والقصص الجاري كشفها حالياً!
          </Text>
          <BlinkCursor />
        </TerminalCard>
      </View>
    </TerminalLayout>
  );
};

export const PlayerResultsScreen = () => {
  const roomCode = useGameStore((s) => s.roomCode);
  const playerName = useGameStore((s) => s.playerName);
  const roundResults = useGameStore((s) => s.roundResults);
  const players = useGameStore((s) => s.players) || [];
  const meta = useMeta();

  if (!roundResults) return <WaitingRevealScreen message="جاري حساب النتائج..." />;

  return (
    <TerminalLayout top={<TerminalHeader title="ROUND RESULTS" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <TerminalBanner variant="success" label="SYNC COMPLETE">تم تحديث شاشة اللاعب بنتائج الجولة.</TerminalBanner>
        
        <ResultCard players={mapScores(roundResults.scores || [])} hideDetails={roundResults.winner === 'CONTINUE'} />

        {/* Quality Votes map - only shown if game is decided (not CONTINUE) */}
        {roundResults.winner !== 'CONTINUE' && roundResults.qualityVotes && Object.keys(roundResults.qualityVotes).length > 0 && (
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
        {roundResults.winner !== 'CONTINUE' && roundResults.culpritVotes && Object.keys(roundResults.culpritVotes).length > 0 && (
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
  typewriterWrapper: {
    width: '100%',
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
  votersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp.s,
    marginTop: sp.xs,
  },
  voterBadge: {
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

