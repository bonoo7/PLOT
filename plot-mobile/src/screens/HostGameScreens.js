import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { useSocket, ROUTES } from '../hooks/useGameSocket';

import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalCard from '../components/minimal/MinimalCard';
import MinimalButton from '../components/minimal/MinimalButton';
import { PlayerBadge } from '../components/minimal/PlayerBadge';
import { ScenarioRevealCard } from '../components/ScenarioRevealCard';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius, moderateScale } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * HostGameIntroScreen - V3
 */
export const HostGameIntroScreen = () => {
  const scenarioTitle = useGameStore((state) => state.scenario);
  const round = useGameStore((state) => state.currentRound);
  const totalRounds = useGameStore((state) => state.totalRounds);
  const roomCode = useGameStore((state) => state.roomCode);

  return (
    <MinimalLayout roomCode={roomCode}>
      <View style={styles.centerContent}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>الجولة {round} / {totalRounds}</Text>
        </View>

        <Text style={styles.emojiDisplay}>🎮</Text>

        <MinimalCard style={styles.introCard}>
          <Text style={styles.introLabel}>عنوان القضية</Text>
          <Text style={styles.introTitle}>{scenarioTitle || 'جاري التحميل...'}</Text>
        </MinimalCard>

        <View style={styles.statusRow}>
          <Text style={styles.statusIcon}>⚙️</Text>
          <Text style={styles.statusText}>جارٍ توزيع الأدوار...</Text>
        </View>
      </View>
    </MinimalLayout>
  );
};

/**
 * HostDraftingScreen - V3
 */
export const HostDraftingScreen = () => {
  const { isDesktop } = useResponsiveLayout();
  const roomCode = useGameStore((state) => state.roomCode);
  const players = useGameStore((state) => state.players) || [];
  const waitingFor = useGameStore((state) => state.waitingFor) || [];
  const timeLeft = useGameStore((state) => state.timeLeft) || 0;
  const hint = useGameStore((state) => state.lastHint);

  const submittedCount = players.length - waitingFor.length;
  const progress = players.length > 0 ? (submittedCount / players.length) * 100 : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MinimalLayout roomCode={roomCode}>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <MinimalHeader title="مرحلة الكتابة" subtitle="يراقب المضيف" />

        {hint && (
          <MinimalCard style={styles.hostHintCard}>
            <Text style={styles.hostHintLabel}>تلميح القضية</Text>
            <Text style={styles.hostHintText}>{hint}</Text>
          </MinimalCard>
        )}

        <View style={styles.gridContainer}>
          {/* Timer & Progress */}
          <MinimalCard style={styles.dashboardCard}>
            <View style={styles.timerRow}>
              <Text style={styles.timerLabel}>الوقت المتبقي</Text>
              <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(timeLeft / 90) * 100}%` }]} />
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>تم التسليم</Text>
              <Text style={styles.statsValue}>{submittedCount} / {players.length}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: theme.colors.primary }]} />
            </View>
          </MinimalCard>

          {/* Players List */}
          <View style={styles.playersListContainer}>
            <Text style={styles.sectionHeader}>حالة اللاعبين</Text>
            <ScrollView style={styles.scrollList}>
              {players.map((player, index) => {
                const hasSubmitted = !waitingFor.includes(player.id);
                return (
                  <View key={player.id || index} style={styles.playerRow}>
                    <Text style={styles.playerIndex}>#{index + 1}</Text>
                    <View style={{ flex: 1, marginHorizontal: spacing.s, alignItems: 'flex-start' }}>
                      <PlayerBadge name={player.name} size="small" />
                    </View>
                    <Text style={hasSubmitted ? styles.statusDone : styles.statusWait}>
                      {hasSubmitted ? 'تم ✅' : '...'}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </MinimalLayout>
  );
};

/**
 * HostGameScreen - V3 (Monitoring) - Legacy, likely can be removed if not used
 */
export const HostGameScreen = () => {
  return <HostDraftingScreen />;
};

/**
 * HostVotingScreen - V3 (can handle both quality and culprit depending on route/params in real app, we use global state)
 */
export const HostVotingScreen = ({ route }) => {
  const { isDesktop } = useResponsiveLayout();

  // Decide voting type based on screen param or path, defaulting to quality
  // If no router params, we might need a store variable. Let's assume it passed via route if possible,
  // Or we just create two wrappers
  const votingType = route?.params?.votingType || 'quality';

  const roomCode = useGameStore((state) => state.roomCode);
  const scenarios = useGameStore((state) => state.scenarios) || [];
  const liveVotes = useGameStore((state) => Array.isArray(state.liveVotes) ? state.liveVotes : []);
  const players = useGameStore((state) => state.players) || [];
  const voteTieInfo = useGameStore((state) => state.voteTieInfo);

  const votedCount = liveVotes.length;
  const totalPlayers = players.length;

  // حساب الأصوات بـ O(n) بدلاً من O(n²) داخل الـ render
  const voteCountMap = useMemo(() => {
    const map = {};
    liveVotes.forEach(vote => {
        const key = votingType === 'culprit' ? vote.choice : vote.choice;
        map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [liveVotes, votingType]);

  const getVotesForScenario = (index) => {
    if (votingType === 'culprit') {
      const targetId = scenarios[index]?.playerId;
      return voteCountMap[targetId] || 0;
    }
    return voteCountMap[index] || 0;
  };

  return (
    <MinimalLayout roomCode={roomCode}>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <MinimalHeader
          title={votingType === 'quality' ? 'تصويت الجودة' : 'تصويت الجاني'}
          subtitle={`${votedCount} من ${totalPlayers} صوتوا`}
        />

        {/* بانر التعادل في التصويت */}
        {voteTieInfo && (
          <View style={styles.tieBanner}>
            <Text style={styles.tieBannerTitle}>⚖️ تعادل في الأصوات!</Text>
            <Text style={styles.tieBannerSub}>إعادة التصويت بين:</Text>
            <View style={styles.tieCandidatesRow}>
              {(voteTieInfo.candidates || []).map((name, i) => (
                <PlayerBadge key={i} name={name} size="small" />
              ))}
            </View>
          </View>
        )}

        <View style={styles.gridContainer}>
          <View style={styles.leftColumn}>
            <MinimalCard style={styles.voteStatsCard}>
              <Text style={styles.cardTitle}>تقدم التصويت</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: totalPlayers > 0 ? `${(votedCount / totalPlayers) * 100}%` : '0%', backgroundColor: theme.colors.primary }]} />
              </View>
              <View style={[styles.votersList, { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginTop: spacing.s }]}>
                {players.map(p => {
                  const hasVoted = liveVotes.some(v => v.playerId === p.id);
                  return (
                    <View key={p.id} style={{ opacity: hasVoted ? 1 : 0.4 }}>
                      <PlayerBadge name={p.name} size="small" />
                    </View>
                  );
                })}
              </View>
            </MinimalCard>
          </View>

          <View style={styles.rightColumn}>
            <ScrollView style={styles.resultsScroll}>
              {scenarios.map((scenario, index) => {
                const votes = getVotesForScenario(index);
                const label = votingType === 'quality'
                  ? `سيناريو #${index + 1}`
                  : scenario.playerName || `لاعب ${index + 1}`;

                return (
                  <View key={index} style={styles.resultBarContainer}>
                    <View style={styles.resultBarLabelRow}>
                      {votingType === 'culprit' && scenario.playerName ? (
                        <PlayerBadge name={scenario.playerName} size="small" />
                      ) : (
                        <Text style={styles.resultLabel}>{label}</Text>
                      )}
                      <Text style={styles.resultCount}>{votes}</Text>
                    </View>
                    <View style={styles.resultBarBg}>
                      <View style={[
                        styles.resultBarFill,
                        { width: totalPlayers > 0 ? `${(votes / totalPlayers) * 100}%` : '0%' }
                      ]} />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </View>
    </MinimalLayout>
  );
};

// Aliases for the specific host voting screens if mapped individually in AppNavigator
export const HostQualityVotingScreen = () => <HostVotingScreen route={{ params: { votingType: 'quality' } }} />;
export const HostCulpritVotingScreen = () => <HostVotingScreen route={{ params: { votingType: 'culprit' } }} />;

/**
 * HostResultsScreen - V4 Clean Minimal
 */
export const HostResultsScreen = () => {
  const [revealStep, setRevealStep] = React.useState(0);
  const [expandedPlayer, setExpandedPlayer] = React.useState(null);
  const { socket } = useSocket();

  const roomCode = useGameStore((state) => state.roomCode);
  const roundResults = useGameStore((state) => state.roundResults);
  const currentRoundState = useGameStore((state) => state.currentRound);
  const totalRoundsState = useGameStore((state) => state.totalRounds);

  React.useEffect(() => {
    if (roundResults) {
      setRevealStep(0);
      setExpandedPlayer(null);
      const t1 = setTimeout(() => setRevealStep(1), 500);
      const t2 = setTimeout(() => setRevealStep(2), 3000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [roundResults]);

  if (!roundResults) return null;

  const { winner, reason, eliminatedPlayer, scores, round, totalRounds: totalR } = roundResults;
  const detailedEliminated = scores?.find(p => p.isEliminated);

  // حساب isLastRound من بيانات الخادم مباشرة (أكثر موثوقية)
  const isLastRound = roundResults.isLastRound != null
    ? roundResults.isLastRound
    : (round != null && totalR != null ? round >= totalR : (currentRoundState >= totalRoundsState));

  const isContinue = winner === 'CONTINUE';
  const isCrime = winner === 'CRIME';
  const bannerBg = isContinue ? '#7B6010' : isCrime ? '#6B0000' : '#10346B';
  const winnerText = isContinue ? '⚖️ اللعبة مستمرة' : isCrime ? '🔴 فاز فريق الجريمة' : '🔵 فاز فريق العدالة';
  const btnTitle = isContinue ? 'متابعة النقاش ←' : (isLastRound ? 'إنهاء اللعبة' : 'جولة جديدة ←');

  const handleContinue = () => {
    if (socket) {
      socket.emit('nextRound', { roomCode });
    }
  };

  return (
    <MinimalLayout roomCode={roomCode}>
      <View style={styles.resContainer}>
        <MinimalHeader
          title="نتائج الجولة"
          subtitle={round && totalR ? `الجولة ${round} من ${totalR}` : undefined}
        />

        <ScrollView contentContainerStyle={styles.resScroll} showsVerticalScrollIndicator={false}>

          {/* ── خطوة 1: المستبعد (سطر مدمج) ── */}
          {eliminatedPlayer && revealStep >= 1 && (
            <View style={styles.resEliminatedRow}>
              <Text style={styles.resSmallLabel}>تم استبعاد:</Text>
              <PlayerBadge name={eliminatedPlayer.name} size="small" />
              {detailedEliminated?.role && detailedEliminated.role !== '؟؟؟' && (
                <Text style={[styles.resRoleTag, { color: detailedEliminated.isCulprit ? '#e74c3c' : '#3498db' }]}>
                  {detailedEliminated.role}
                </Text>
              )}
            </View>
          )}
          {eliminatedPlayer && revealStep < 1 && (
            <View style={styles.resEliminatedRow}>
              <Text style={styles.resSmallLabel}>تم استبعاد:</Text>
              <Text style={{ color: '#888' }}>···</Text>
            </View>
          )}

          {/* ── خطوة 2: النتيجة الكاملة ── */}
          {revealStep >= 2 && (
            <>
              {/* لافتة نتيجة الجولة — تظهر دائماً */}
              <View style={[styles.resBanner, { backgroundColor: bannerBg }]}>
                <Text style={styles.resBannerTitle}>{winnerText}</Text>
                {reason ? <Text style={styles.resBannerReason}>{reason}</Text> : null}
              </View>

              {/* ترتيب النقاط مع طريقة الكسب */}
              <MinimalCard style={styles.resScoresCard}>
                <Text style={styles.resScoresTitle}>ترتيب النقاط</Text>
                {scores?.map((p, i) => {
                  const isCrimePlayer = p.team === 'CRIME';
                  const isJusticePlayer = p.team === 'JUSTICE';
                  const teamColor = isCrimePlayer ? '#c0392b' : isJusticePlayer ? '#2980b9' : '#888';
                  const showRole = p.role && p.role !== '؟؟؟';
                  const isExpanded = expandedPlayer === i;
                  const hasBreakdown = p.breakdown && p.breakdown.length > 0;
                  return (
                    <View key={i}>
                      <TouchableOpacity
                        style={[styles.resScoreRow, i === 0 && styles.resScoreRowFirst]}
                        onPress={() => hasBreakdown && setExpandedPlayer(isExpanded ? null : i)}
                        activeOpacity={hasBreakdown ? 0.7 : 1}
                      >
                        <Text style={styles.resScoreRank}>#{i + 1}</Text>
                        <View style={[styles.resTeamStripe, { backgroundColor: teamColor }]} />
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <PlayerBadge name={p.name} size="small" />
                          {showRole && (
                            <Text style={[styles.resScoreRole, { color: teamColor }]}>{p.role}</Text>
                          )}
                        </View>
                        <View style={styles.resScoreRight}>
                          {p.roundScore !== undefined && (
                            <Text style={[styles.resRoundDelta, { color: p.roundScore > 0 ? '#27ae60' : '#999' }]}>
                              {p.roundScore > 0 ? `+${p.roundScore}` : p.roundScore}
                            </Text>
                          )}
                          <Text style={[styles.resScoreVal, i === 0 && { color: '#DAA520' }]}>
                            {p.totalScore}
                          </Text>
                          {hasBreakdown && (
                            <Text style={styles.resExpandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                      {/* تفاصيل طريقة كسب النقاط */}
                      {isExpanded && hasBreakdown && (
                        <View style={styles.resBreakdown}>
                          {p.breakdown.map((line, j) => (
                            <Text key={j} style={styles.resBreakdownLine}>• {line}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </MinimalCard>
            </>
          )}
        </ScrollView>

        {revealStep >= 2 && (
          <View style={styles.resFooter}>
            <MinimalButton title={btnTitle} onPress={handleContinue} size="large" />
          </View>
        )}
      </View>
    </MinimalLayout>
  );
};

/**
 * HostDramaticRevealScreen - V3
 */
export const HostDramaticRevealScreen = () => {
  const roomCode = useGameStore((state) => state.roomCode);
  const revealedScenarios = useGameStore((state) => state.revealedScenarios) || [];
  const currentReveal = useGameStore((state) => state.currentReveal);
  const abilityResult = useGameStore((state) => state.roleData?.abilityResult);

  // Check for HINT type first
  if (currentReveal?.type === 'HINT') {
    return (
      <MinimalLayout roomCode={roomCode}>
        <View style={styles.centerContent}>
          <MinimalHeader title="تلميح درامي" />
          <View style={[styles.revealCard, { backgroundColor: '#FFFACD', borderWidth: 2, borderColor: '#DAA520' }]}>
            <Text style={{ fontSize: 60 }}>🔍</Text>
            <Text style={[styles.revealText, { fontSize: 24, marginVertical: 20, color: '#8B4513' }]}>
              {currentReveal.text}
            </Text>
          </View>
        </View>
      </MinimalLayout>
    );
  }

  const showVoters = currentReveal?.voters !== undefined;
  const showAuthor = currentReveal?.author !== undefined;

  return (
    <MinimalLayout roomCode={roomCode}>
      <ScrollView contentContainerStyle={styles.centerContent} showsVerticalScrollIndicator={false}>
        <MinimalHeader title="كشف النتائج" />

        {currentReveal ? (
          <ScenarioRevealCard
            text={currentReveal.text}
            template={currentReveal.template}
            author={showAuthor ? currentReveal.author : undefined}
            voters={showVoters ? currentReveal.voters : undefined}
            isComplete={showAuthor}
            style={{ maxWidth: 520 }}
          />
        ) : (
          <Text style={styles.waitingText}>جاري التحضير...</Text>
        )}

        {/* History (Previous Scenarios) */}
        <ScrollView style={styles.revealHistory} horizontal contentContainerStyle={{ gap: 10 }}>
          {revealedScenarios.map((s, i) => (
            <View key={i} style={styles.miniRevealCard}>
              <Text numberOfLines={2} style={styles.miniRevealText}>{s.text}</Text>
              <View style={{ marginVertical: spacing.xs }}>
                <PlayerBadge name={s.author} size="small" />
              </View>
              <View style={styles.miniVotersList}>
                <Text style={styles.miniVotersLabel}>أصوات ({s.voteCount}):</Text>
                <Text numberOfLines={1} style={styles.miniVotersNames}>
                  {s.voters && s.voters.length > 0 ? s.voters.join(', ') : 'لا أحد'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </MinimalLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: spacing.m,
    gap: spacing.m,
  },
  containerDesktop: {
    maxWidth: 1000,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: spacing.l,
  },

  // Intro Screen
  badgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.large,
  },
  badgeText: {
    color: '#EBE1D2',
    fontFamily: theme.fonts.bold,
  },
  emojiDisplay: {
    fontSize: 80,
  },
  introCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: spacing.xl,
  },
  introLabel: {
    fontSize: fonts.small,
    color: '#8B4513',
    marginBottom: spacing.xs,
  },
  introTitle: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.bold,
    textAlign: 'center',
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  statusIcon: { fontSize: 24 },
  statusText: { color: '#EBE1D2', fontSize: fonts.medium },

  // Drafting Screen
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  dashboardCard: {
    flex: 1,
    minWidth: 300,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  timerLabel: { fontFamily: theme.fonts.main, color: '#555' },
  timerValue: { fontFamily: theme.fonts.bold, fontSize: fonts.large, color: theme.colors.primary },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA500',
  },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: spacing.m },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.s },
  statsLabel: { fontFamily: theme.fonts.main, color: '#555' },
  statsValue: { fontFamily: theme.fonts.bold, color: '#333' },

  playersListContainer: {
    flex: 1,
    minWidth: 300,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: borderRadius.medium,
    padding: spacing.m,
  },
  sectionHeader: {
    color: '#EBE1D2',
    fontFamily: theme.fonts.bold,
    marginBottom: spacing.m,
  },
  scrollList: { flex: 1 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  playerIndex: { color: '#AAA', width: 30 },
  playerName: { color: '#FFF', flex: 1, fontFamily: theme.fonts.main },
  statusDone: { color: '#4CAF50', fontWeight: 'bold' },
  statusWait: { color: '#AAA' },

  // Voting Screen
  leftColumn: { flex: 1, minWidth: 300 },
  rightColumn: { flex: 1, minWidth: 300 },
  voteStatsCard: { padding: spacing.m },
  cardTitle: { fontFamily: theme.fonts.bold, marginBottom: spacing.s },
  votersList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.m, gap: 8 },
  miniVoter: { fontSize: fonts.tiny, color: '#999', backgroundColor: '#EEE', padding: 4, borderRadius: 4 },
  miniVoterDone: { color: '#FFF', backgroundColor: theme.colors.primary },
  resultsScroll: { flex: 1 },
  resultBarContainer: { marginBottom: spacing.m },
  resultBarLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  resultLabel: { color: '#EBE1D2', fontSize: fonts.small },
  resultCount: { color: '#FFF', fontWeight: 'bold' },
  resultBarBg: { height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6 },
  resultBarFill: { height: '100%', backgroundColor: theme.colors.secondary, borderRadius: 6 },

  // Results Screen v4
  resEliminatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    backgroundColor: '#1A1A1A',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: borderRadius.small,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginBottom: spacing.s,
    flexWrap: 'wrap',
  },
  resContainer: { flex: 1, width: '100%', padding: spacing.m },
  resScroll: { paddingBottom: spacing.xl },
  resEliminatedCard: { backgroundColor: '#1A1A1A', borderColor: '#333', alignItems: 'center', padding: spacing.m, marginBottom: spacing.l },
  resSmallLabel: { color: '#888', fontSize: 12, fontFamily: theme.fonts.main },
  resEliminatedName: { color: '#FFF', fontSize: 24, fontFamily: theme.fonts.bold, marginVertical: 4 },
  resRoleTag: { fontSize: 16, fontFamily: theme.fonts.bold },
  resBanner: { padding: spacing.m, borderRadius: borderRadius.medium, alignItems: 'center', marginBottom: spacing.l },
  resBannerTitle: { color: '#FFF', fontSize: 24, fontFamily: theme.fonts.bold },
  resBannerReason: { color: '#EEE', fontSize: 14, fontFamily: theme.fonts.main, marginTop: 4, textAlign: 'center' },
  resScoresCard: { padding: spacing.m },
  resScoresTitle: { fontSize: 18, fontFamily: theme.fonts.bold, color: '#333', marginBottom: spacing.m, textAlign: 'center' },
  resScoreRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  resScoreRowFirst: { backgroundColor: 'rgba(218,165,32,0.1)', borderRadius: borderRadius.small },
  resScoreRank: { width: 30, color: '#888', fontFamily: theme.fonts.bold },
  resTeamStripe: { width: 4, height: '80%', borderRadius: 2, marginHorizontal: 8 },
  resScoreName: { color: '#333', fontFamily: theme.fonts.bold, fontSize: 16 },
  resScoreRole: { fontSize: 12, fontFamily: theme.fonts.main },
  resScoreRight: { flexDirection: 'row', alignItems: 'center', width: 90, justifyContent: 'flex-end', gap: 6 },
  resRoundDelta: { fontSize: 12, fontWeight: 'bold' },
  resScoreVal: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  resExpandIcon: { fontSize: 10, color: '#999', width: 15, textAlign: 'center' },
  resBreakdown: { backgroundColor: '#F9F9F9', padding: spacing.s, borderRadius: borderRadius.small, marginTop: 2, marginLeft: 40 },
  resBreakdownLine: { fontSize: 12, color: '#555', fontFamily: theme.fonts.main, marginVertical: 2 },
  resFooter: { marginTop: spacing.m },

  // Reveal Screen
  revealCard: { width: '100%', maxWidth: 500, padding: spacing.l, alignItems: 'center' },
  revealText: { fontSize: fonts.medium, fontFamily: theme.fonts.main, textAlign: 'center', lineHeight: 28 },
  revealCardComplete: {
    backgroundColor: '#FFF8DC', // Gold tint when complete
    transform: [{ scale: 1.05 }],
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  votersSection: {
    marginTop: spacing.l,
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: spacing.m,
    borderRadius: borderRadius.medium,
  },
  votersLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  votersListHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  voterTag: {
    backgroundColor: '#DDD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: '#333',
  },
  noVotesText: {
    color: '#CCC',
    fontStyle: 'italic',
  },
  voteCountBig: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  authorSection: {
    marginTop: spacing.l,
    alignItems: 'center',
  },
  authorLabel: {
    fontSize: 14,
    color: '#555',
  },
  authorNameBig: {
    fontSize: 32,
    fontFamily: theme.fonts.bold,
    color: '#8B4513',
    marginTop: 4,
  },
  revealHistory: { maxHeight: 120, marginTop: spacing.l, width: '100%' },
  miniRevealCard: { width: 180, height: 100, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: spacing.s, padding: spacing.s, borderRadius: 8 },
  miniRevealText: { color: '#CCC', fontSize: 10, marginBottom: 4 },
  miniRevealAuthor: { color: '#AAA', fontSize: 9, marginBottom: 4 },
  miniVotersList: { marginTop: 'auto', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 2 },
  miniVotersLabel: { color: theme.colors.primary, fontSize: 8, fontWeight: 'bold' },
  miniVotersNames: { color: '#888', fontSize: 8 },
  waitingText: { color: '#AAA', fontSize: fonts.medium },

  // Host Hint Styles
  hostHintCard: {
    width: '100%',
    backgroundColor: '#FFFACD',
    borderWidth: 2,
    borderColor: '#DAA520',
    marginBottom: spacing.m,
    alignItems: 'center',
    padding: spacing.l,
  },
  hostHintLabel: {
    fontSize: fonts.small,
    color: '#DAA520',
    fontWeight: 'bold',
    marginBottom: spacing.s,
  },
  hostHintText: {
    fontSize: fonts.medium,
    color: '#8B4513',
    fontFamily: theme.fonts.main,
    textAlign: 'center',
  },

  // Vote Tie Banner
  tieBanner: {
    width: '100%',
    backgroundColor: '#FFF3CD',
    borderWidth: 2,
    borderColor: '#FF8C00',
    borderRadius: borderRadius.medium,
    padding: spacing.m,
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.s,
  },
  tieBannerTitle: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.bold,
    color: '#FF6600',
    textAlign: 'center',
  },
  tieBannerSub: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: '#8B4513',
    textAlign: 'center',
  },
  tieCandidatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.s,
  },
});
