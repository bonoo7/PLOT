import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalCard from '../components/minimal/MinimalCard';
import MinimalButton from '../components/minimal/MinimalButton';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius, moderateScale } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * HostGameIntroScreen - V3
 */
export const HostGameIntroScreen = ({ 
  scenarioTitle = '',
  round = 1,
  totalRounds = 3
}) => {
  return (
    <MinimalLayout>
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
export const HostDraftingScreen = ({ 
  players = [],
  waitingFor = [],
  timeLeft = 90
}) => {
  const { isDesktop } = useResponsiveLayout();
  const submittedCount = players.length - waitingFor.length;
  const progress = players.length > 0 ? (submittedCount / players.length) * 100 : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MinimalLayout>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <MinimalHeader title="مرحلة الكتابة" subtitle="يراقب المضيف" />

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
                       <Text style={styles.playerName}>{player.name}</Text>
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
 * HostGameScreen - V3 (Monitoring)
 */
export const HostGameScreen = ({ players = [], waitingFor = [] }) => {
  return <HostDraftingScreen players={players} waitingFor={waitingFor} timeLeft={0} />;
};

/**
 * HostVotingScreen - V3
 */
export const HostVotingScreen = ({ 
  votingType = 'quality', 
  scenarios = [],
  liveVotes = [],
  players = []
}) => {
  const { isDesktop } = useResponsiveLayout();
  const votedCount = liveVotes.length;
  const totalPlayers = players.length;

  const getVotesForScenario = (index) => {
    if (votingType === 'culprit') {
        const targetId = scenarios[index]?.playerId;
        return liveVotes.filter(vote => vote.choice === targetId).length;
    }
    return liveVotes.filter(vote => vote.choice === index).length;
  };

  return (
    <MinimalLayout>
      <View style={[styles.container, isDesktop && styles.containerDesktop]}>
        <MinimalHeader 
          title={votingType === 'quality' ? 'تصويت الجودة' : 'تصويت الجاني'} 
          subtitle={`${votedCount} من ${totalPlayers} صوتوا`}
        />

        <View style={styles.gridContainer}>
           <View style={styles.leftColumn}>
              <MinimalCard style={styles.voteStatsCard}>
                 <Text style={styles.cardTitle}>تقدم التصويت</Text>
                 <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(votedCount / totalPlayers) * 100}%`, backgroundColor: theme.colors.primary }]} />
                 </View>
                 <View style={styles.votersList}>
                    {players.map(p => {
                       const hasVoted = liveVotes.some(v => v.playerId === p.id);
                       return (
                         <Text key={p.id} style={[styles.miniVoter, hasVoted && styles.miniVoterDone]}>
                           {p.name} {hasVoted ? '✓' : ''}
                         </Text>
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
                             <Text style={styles.resultLabel}>{label}</Text>
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

/**
 * HostResultsScreen - V3
 */
export const HostResultsScreen = ({ 
  roundResults = null,
  onContinue,
  isLastRound = false
}) => {
  const { isDesktop } = useResponsiveLayout();
  const [revealStep, setRevealStep] = React.useState(0);
  
  // Reset sequence when new results arrive
  React.useEffect(() => {
    if (roundResults) {
        setRevealStep(0);
        // Sequence:
        // 0: Initial (Empty/Loading)
        // 1: Show "Most Voted" Name (Delay 1s)
        // 2: Reveal Role/Team (Delay 3s)
        // 3: Show Full Results Banner (Delay 6s)
        
        const t1 = setTimeout(() => setRevealStep(1), 500);
        const t2 = setTimeout(() => setRevealStep(2), 3500);
        const t3 = setTimeout(() => setRevealStep(3), 7500);
        
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [roundResults]);

  if (!roundResults) return null;

  const { winner, reason, eliminatedPlayer, crimeTeam, justiceTeam, scores } = roundResults;
  
  // Find the eliminated player details from the scores array if available
  const detailedEliminated = scores?.find(p => p.isEliminated);
  const eliminatedTeam = detailedEliminated ? detailedEliminated.teamName : '';
  const eliminatedRole = detailedEliminated ? detailedEliminated.role : '';

  const getTeamColor = (team) => team === 'CRIME' ? '#8B0000' : '#1E90FF'; // Red vs Blue
  const getTeamName = (team) => team === 'CRIME' ? 'فريق الجريمة' : 'فريق العدالة';

  return (
    <MinimalLayout>
      <View style={[styles.container, { maxWidth: 1000 }]}>
         <MinimalHeader title="نتائج الجولة" />
         
         <ScrollView style={styles.scrollList}>
            {/* 1️⃣ Suspense Phase: Eliminated Player Reveal */}
            {eliminatedPlayer && (
                <View style={styles.eliminatedBox}>
                    <Text style={styles.eliminatedLabel}>أكثر شخص تم التصويت عليه هو...</Text>
                    
                    {revealStep >= 1 && (
                        <Text style={[styles.eliminatedName, { fontSize: 40 }]}>{eliminatedPlayer.name}</Text>
                    )}
                    
                    {revealStep >= 2 && (
                        <View style={styles.eliminatedRevealRow}>
                            <Text style={styles.eliminatedTeam}>{eliminatedTeam}</Text>
                            {detailedEliminated && detailedEliminated.isCulprit && (
                                <Text style={styles.eliminatedRole}> - {eliminatedRole}</Text>
                            )}
                        </View>
                    )}
                </View>
            )}

            {/* 2️⃣ Final Result Phase */}
            {revealStep >= 3 && (
                <>
                    {/* Main Result Banner */}
                    <View style={[
                        styles.resultBanner, 
                        { backgroundColor: winner === 'CONTINUE' ? '#FFA500' : getTeamColor(winner) }
                    ]}>
                        <Text style={styles.resultBannerTitle}>
                            {winner === 'CONTINUE' ? 'اللعبة مستمرة!' : `فاز ${getTeamName(winner)}!`}
                        </Text>
                        <Text style={styles.resultBannerReason}>{reason}</Text>
                    </View>

                    {/* Team Rosters (Reveal) */}
                    <View style={styles.teamsContainer}>
                        <MinimalCard style={[styles.teamCard, { borderColor: '#8B0000', borderWidth: 1 }]}>
                            <Text style={[styles.teamHeader, { color: '#8B0000' }]}>فريق الجريمة 🕵️‍♂️</Text>
                            {crimeTeam?.length > 0 ? crimeTeam.map(p => (
                                <View key={p.id} style={styles.playerResultRow}>
                                    <Text style={styles.playerResultName}>{p.name}</Text>
                                    <Text style={styles.playerResultRole}>{p.roleName}</Text>
                                </View>
                            )) : <Text style={styles.noPlayersText}>لا يوجد لاعبين</Text>}
                        </MinimalCard>
                        
                        <MinimalCard style={[styles.teamCard, { borderColor: '#1E90FF', borderWidth: 1 }]}>
                            <Text style={[styles.teamHeader, { color: '#1E90FF' }]}>فريق العدالة ⚖️</Text>
                            {justiceTeam?.length > 0 ? justiceTeam.map(p => (
                                <View key={p.id} style={styles.playerResultRow}>
                                    <Text style={styles.playerResultName}>{p.name}</Text>
                                    <Text style={styles.playerResultRole}>{p.roleName}</Text>
                                </View>
                            )) : <Text style={styles.noPlayersText}>لا يوجد لاعبين</Text>}
                        </MinimalCard>
                    </View>

                    {/* Standings Table with detailed score breakdown */}
                    <View style={styles.standingsContainer}>
                         <Text style={styles.sectionHeader}>تفاصيل النقاط</Text>
                         {scores?.map((player, index) => (
                           <View key={index} style={styles.scoreRowDetailed}>
                              <View style={styles.scoreRowHeader}>
                                  <Text style={styles.rank}>#{index + 1}</Text>
                                  <View style={{flex: 1}}>
                                      <Text style={styles.standingName}>{player.name}</Text>
                                      <Text style={styles.standingRole}>{player.role}</Text>
                                  </View>
                                  <Text style={styles.standingScore}>{player.totalScore}</Text>
                              </View>
                              {/* Breakdown badges */}
                              <View style={styles.breakdownRow}>
                                  {player.breakdown?.map((item, i) => (
                                      <View key={i} style={styles.scoreBadge}>
                                          <Text style={styles.scoreBadgeText}>{item}</Text>
                                      </View>
                                  ))}
                              </View>
                           </View>
                         ))}
                    </View>
                </>
            )}
         </ScrollView>

         {revealStep >= 3 && (
             <View style={styles.footer}>
                <MinimalButton 
                  title={winner === 'CONTINUE' ? "إكمال اللعبة (نقاش)" : (isLastRound ? "إنهاء اللعبة" : "جولة جديدة")} 
                  onPress={onContinue} 
                />
             </View>
         )}
      </View>
    </MinimalLayout>
  );
};

/**
 * HostDramaticRevealScreen - V3
 */
export const HostDramaticRevealScreen = ({ 
  revealedScenarios = [],
  currentReveal = null
}) => {
  // Check for HINT type first
  if (currentReveal?.type === 'HINT') {
      return (
        <MinimalLayout>
           <View style={styles.centerContent}>
              <MinimalHeader title="تلميح درامي" />
              <View style={[styles.revealCard, { backgroundColor: '#FFFACD', borderWidth: 2, borderColor: '#DAA520' }]}> 
                 <Text style={{fontSize: 60}}>🔍</Text>
                 <Text style={[styles.revealText, {fontSize: 24, marginVertical: 20, color: '#8B4513'}]}>
                    {currentReveal.text}
                 </Text>
              </View>
           </View>
        </MinimalLayout>
      );
  }

  // currentReveal structure updates over time: { text, index, voters, voteCount, author }
  // We determine what to show based on what properties exist

  const showVoters = currentReveal?.voters !== undefined;
  const showAuthor = currentReveal?.author !== undefined;

  return (
    <MinimalLayout>
       <View style={styles.centerContent}>
          <MinimalHeader title="كشف النتائج" />
          
          {currentReveal ? (
             <MinimalCard style={[styles.revealCard, showAuthor && styles.revealCardComplete]}>
                {/* 1. Scenario Text */}
                <Text style={styles.revealText}>"{currentReveal.text}"</Text>
                
                {/* 2. Voters (Reveal Step 2) */}
                {showVoters && (
                    <View style={styles.votersSection}>
                         <Text style={styles.votersLabel}>صوّت له:</Text>
                         <View style={styles.votersListHorizontal}>
                             {currentReveal.voters.length > 0 ? (
                                 currentReveal.voters.map((v, i) => (
                                     <Text key={i} style={styles.voterTag}>{v}</Text>
                                 ))
                             ) : (
                                 <Text style={styles.noVotesText}>لا أحد</Text>
                             )}
                         </View>
                         <Text style={styles.voteCountBig}>{currentReveal.voteCount} صوت</Text>
                    </View>
                )}

                {/* 3. Author (Reveal Step 3 - Prominent) */}
                {showAuthor && (
                    <View style={styles.authorSection}>
                        <Text style={styles.authorLabel}>الكاتب هو...</Text>
                        <Text style={styles.authorNameBig}>{currentReveal.author}</Text>
                    </View>
                )}
             </MinimalCard>
          ) : (
             <Text style={styles.waitingText}>جاري التحضير...</Text>
          )}

          {/* History (Previous Scenarios) */}
          <ScrollView style={styles.revealHistory} horizontal contentContainerStyle={{ gap: 10 }}>
             {revealedScenarios.map((s, i) => (
                <View key={i} style={styles.miniRevealCard}>
                   <Text numberOfLines={2} style={styles.miniRevealText}>{s.text}</Text>
                   <Text style={styles.miniRevealAuthor}>{s.author}</Text>
                </View>
             ))}
          </ScrollView>
       </View>
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

  // Results Screen
  resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.m, marginBottom: spacing.l },
  resultCard: { flex: 1, minWidth: 250, alignItems: 'center' },
  resultCardTitle: { fontSize: fonts.medium, color: '#888', marginBottom: spacing.s },
  winnerName: { fontSize: fonts.large, fontFamily: theme.fonts.bold, color: '#333', textAlign: 'center' },
  points: { color: '#4CAF50', fontWeight: 'bold', marginTop: 4 },
  verdict: { fontSize: fonts.medium, fontFamily: theme.fonts.bold, marginTop: 4 },
  verdictCorrect: { color: '#4CAF50' },
  verdictWrong: { color: '#F44336' },
  standingsContainer: { backgroundColor: 'rgba(0,0,0,0.2)', padding: spacing.m, borderRadius: borderRadius.medium },
  standingRow: { flexDirection: 'row', paddingVertical: spacing.s, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rank: { width: 40, color: theme.colors.primary, fontWeight: 'bold' },
  standingName: { fontSize: 16, fontFamily: theme.fonts.bold, color: '#FFF' },
  standingRole: { fontSize: 12, color: '#AAA', marginTop: 2 },
  standingScore: { color: '#FFD700', fontWeight: 'bold', fontSize: 18 },
  footer: { paddingTop: spacing.m },

  // Reveal Screen
  revealCard: { width: '100%', maxWidth: 500, padding: spacing.l, alignItems: 'center' },
  revealText: { fontSize: fonts.medium, fontFamily: theme.fonts.main, textAlign: 'center', lineHeight: 28 },
  revealMeta: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: spacing.l },
  revealAuthor: { color: '#666', fontWeight: 'bold' },
  revealVotes: { backgroundColor: theme.colors.primary, color: '#FFF', paddingHorizontal: 8, borderRadius: 10, fontSize: 12 },
  revealHistory: { maxHeight: 100, marginTop: spacing.l, width: '100%' },
  miniRevealCard: { width: 150, height: 80, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: spacing.s, padding: spacing.s, borderRadius: 8 },
  miniRevealText: { color: '#CCC', fontSize: 10 },
  miniRevealAuthor: { color: '#AAA', fontSize: 9, marginTop: 4 },
  waitingText: { color: '#AAA', fontSize: fonts.medium },
  
  // Results V4 Styles
  resultBanner: {
    padding: spacing.l,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  resultBannerTitle: {
    fontSize: 32,
    fontFamily: theme.fonts.bold,
    color: '#FFF',
    marginBottom: 8,
  },
  resultBannerReason: {
    fontSize: 18,
    fontFamily: theme.fonts.main,
    color: '#EEE',
    textAlign: 'center',
  },
  eliminatedText: {
    marginTop: 10,
    fontSize: 20,
    color: '#FFD700', // Gold
    fontWeight: 'bold',
  },
  eliminatedBox: {
      backgroundColor: 'rgba(0,0,0,0.2)',
      padding: spacing.m,
      borderRadius: borderRadius.medium,
      alignItems: 'center',
      marginVertical: spacing.m,
      width: '80%',
  },
  eliminatedLabel: {
      color: '#DDD',
      fontSize: 14,
  },
  eliminatedName: {
      color: '#FFF',
      fontSize: 24,
      fontFamily: theme.fonts.bold,
      marginVertical: 4,
  },
  eliminatedRevealRow: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  eliminatedTeam: {
      color: '#FFD700',
      fontSize: 18,
      fontWeight: 'bold',
  },
  eliminatedRole: {
      color: '#FF6347', // Tomato red for Culprit
      fontSize: 18,
      fontWeight: 'bold',
  },
  teamsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  teamCard: {
    flex: 1,
    minWidth: 250,
  },
  teamHeader: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.bold,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  noPlayersText: {
      textAlign: 'center',
      color: '#999',
      fontStyle: 'italic',
      padding: 10
  },
  playerResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  playerResultName: {
    fontFamily: theme.fonts.main,
    color: '#333',
  },
  playerResultRole: {
    fontFamily: theme.fonts.bold,
    color: '#666',
  },
  scoreRowDetailed: {
    marginBottom: spacing.m,
    paddingBottom: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  scoreRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 40,
  },
  scoreBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scoreBadgeText: {
    color: '#DDD',
    fontSize: 10,
  },
  
  // Reveal Screen New Styles
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
  revealHistory: { maxHeight: 100, marginTop: spacing.l, width: '100%' },
  miniRevealCard: { width: 150, height: 80, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: spacing.s, padding: spacing.s, borderRadius: 8 },
  miniRevealText: { color: '#CCC', fontSize: 10 },
  miniRevealAuthor: { color: '#AAA', fontSize: 9, marginTop: 4 },
  waitingText: { color: '#AAA', fontSize: fonts.medium },
});
