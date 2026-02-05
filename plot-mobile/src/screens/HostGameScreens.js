import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, FlatList, Animated, Platform, Dimensions, ImageBackground } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { Card, Button, Badge } from '../ui';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * شاشة بداية الجولة للمضيف
 */
export const HostGameIntroScreen = ({ 
  scenarioTitle = '',
  round = 1,
  totalRounds = 3
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  return (
    <ImageBackground
      source={require('../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <View style={styles.centeredContainer}>
        {/* Round Badge */}
        <View style={styles.roundBadge}>
          <Text style={styles.roundText}>الجولة {round} من {totalRounds}</Text>
        </View>

        {/* Main Icon */}
        <Text style={styles.largeEmoji}>🎮</Text>

        {/* Scenario Title Card */}
        <Card style={styles.scenarioCard}>
          <Text style={styles.scenarioLabel}>عنوان القضية</Text>
          <Text style={styles.scenarioTitle}>{scenarioTitle || 'جاري التحميل...'}</Text>
        </Card>

        {/* Status Message */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusEmoji}>⚙️</Text>
          <Text style={styles.statusText}>جارٍ توزيع الأدوار على اللاعبين...</Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            سيتم البدء في مرحلة الكتابة تلقائياً
          </Text>
        </View>
      </View>
    </SafeAreaView>
  </ImageBackground>
  );
};

/**
 * شاشة مراقبة مرحلة الكتابة للمضيف
 */
export const HostDraftingScreen = ({ 
  players = [],
  waitingFor = [],
  timeLeft = 90
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);
  
  const submittedCount = players.length - waitingFor.length;
  const progress = players.length > 0 ? (submittedCount / players.length) * 100 : 0;

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer color based on time left
  const getTimerColor = () => {
    if (timeLeft > 60) return theme.colors.teamGood;
    if (timeLeft > 30) return theme.colors.accentYellow;
    return theme.colors.primary;
  };

  return (
    <ImageBackground
      source={require('../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>مرحلة الكتابة</Text>
          </View>

          {/* Cards Grid Container */}
          <View style={styles.cardsGrid}>
            {/* Timer Card */}
            <Card style={[styles.timerCard, styles.gridCard]}>
              <View style={styles.timerRow}>
                <Text style={styles.timerLabel}>الوقت المتبقي:</Text>
                <Text style={[styles.timerText, { color: getTimerColor() }]}>
                  {formatTime(timeLeft)}
                </Text>
              </View>
              <View style={styles.timerBar}>
                <View 
                  style={[
                    styles.timerBarFill,
                    { 
                      width: `${(timeLeft / 90) * 100}%`,
                      backgroundColor: getTimerColor()
                    }
                  ]} 
                />
              </View>
            </Card>

            {/* Progress Card */}
            <Card style={[styles.card, styles.gridCard]}>
              <View style={styles.compactHeader}>
                <Text style={styles.sectionTitle}>التقارير المقدمة</Text>
                <Text style={styles.progressText}>
                  {submittedCount} / {players.length}
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress}%` }
                  ]} 
                />
              </View>
            </Card>

            {/* Players Status */}
            <Card style={[styles.card, styles.fullWidthCard]}>
              <Text style={styles.sectionTitle}>حالة اللاعبين</Text>
              
              <View style={styles.playersGrid}>
                {players.map((player, index) => {
                  const hasSubmitted = !waitingFor.includes(player.id);
                  return (
                    <View 
                      key={player.id || index} 
                      style={[
                        styles.playerItem,
                        hasSubmitted && styles.playerItemSubmitted
                      ]}
                    >
                      <Text style={styles.playerNumber}>#{index + 1}</Text>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <View style={styles.playerStatus}>
                        <Text style={styles.statusIcon}>
                          {hasSubmitted ? '✅' : '⏳'}
                        </Text>
                        <Text style={[
                          styles.statusText,
                          hasSubmitted && styles.statusTextSubmitted
                        ]}>
                          {hasSubmitted ? 'تم' : '...'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>

          {submittedCount < players.length && (
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>⏳</Text>
              <Text style={styles.infoText}>
                في انتظار {players.length - submittedCount} لاعبين...
              </Text>
            </View>
          )}

          {submittedCount === players.length && (
            <View style={[styles.infoBox, styles.successBox]}>
              <Text style={styles.infoIcon}>✅</Text>
              <Text style={styles.infoText}>
                جميع اللاعبين سلّموا تقاريرهم! الانتقال للتصويت...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
  );
};

/**
 * شاشة العرض التشويقي للمضيف
 */
export const HostDramaticRevealScreen = ({ 
  revealedScenarios = [],
  currentReveal = null
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  return (
    <ImageBackground
      source={require('../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>نتائج التصويت</Text>
          </View>

          {/* Current Reveal (if any) */}
          {currentReveal && (
            <Card style={styles.currentRevealCard}>
              {currentReveal.position && (
                <Text style={styles.positionText}>
                  {currentReveal.position} من {currentReveal.total}
                </Text>
              )}
              
              <Text style={styles.currentRevealText}>
                {currentReveal.text}
              </Text>
              
              {currentReveal.voteCount !== undefined && (
                <View style={styles.votesContainer}>
                  <Text style={styles.votesLabel}>الأصوات:</Text>
                  <Badge 
                    text={`${currentReveal.voteCount} ${currentReveal.voteCount === 1 ? 'صوت' : 'أصوات'}`}
                    variant="primary"
                  />
                  {currentReveal.voters && currentReveal.voters.length > 0 && (
                    <Text style={styles.votersText}>
                      {currentReveal.voters.join(' • ')}
                    </Text>
                  )}
                </View>
              )}
              
              {currentReveal.author && (
                <View style={styles.authorContainer}>
                  <Text style={styles.authorLabel}>الكاتب:</Text>
                  <Text style={styles.authorName}>{currentReveal.author}</Text>
                </View>
              )}
            </Card>
          )}

          {/* Revealed Scenarios List */}
          {revealedScenarios.length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>السيناريوهات المكشوفة</Text>
              
              <View style={styles.playersGrid}>
                {revealedScenarios.map((scenario, index) => (
                  <View key={index} style={styles.revealedScenario}>
                    <View style={styles.revealedHeader}>
                      <Badge 
                        text={`#${index + 1}`}
                        variant="secondary"
                      />
                      {scenario.voteCount !== undefined && (
                        <Badge 
                          text={`${scenario.voteCount} ${scenario.voteCount === 1 ? 'صوت' : 'أصوات'}`}
                          variant="primary"
                        />
                      )}
                    </View>
                    
                    <Text style={styles.revealedText}>
                      {scenario.text}
                    </Text>
                    
                    {scenario.author && (
                      <Text style={styles.revealedAuthor}>
                        ✍️ {scenario.author}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Waiting Message */}
          {revealedScenarios.length === 0 && !currentReveal && (
            <View style={styles.centeredContainer}>
              <Text style={styles.largeEmoji}>⏳</Text>
              <Text style={styles.waitingText}>
                جاري تحضير العرض التشويقي...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
  );
};

/**
 * شاشة مراقبة اللعب للمضيف (الموجودة سابقاً - تم الاحتفاظ بها)
 */
export const HostGameScreen = ({ players = [], waitingFor = [] }) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  const submittedCount = players.length - waitingFor.length;

  return (
    <ImageBackground
      source={require('../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>مراقبة اللعب</Text>
          </View>

          {/* Progress Card */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>
              📝 التقارير المقدمة
            </Text>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {submittedCount} / {players.length}
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(submittedCount / players.length) * 100}%` }
                ]} 
              />
            </View>
          </Card>

          {/* Players Status */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>حالة اللاعبين</Text>
            
            <View style={styles.playersGrid}>
              {players.map((player, index) => {
                const hasSubmitted = !waitingFor.includes(player.id);
                return (
                  <View key={player.id || index} style={styles.playerItem}>
                    <Text style={styles.playerNumber}>#{index + 1}</Text>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: hasSubmitted ? theme.colors.teamGood : theme.colors.warning }
                    ]}>
                      <Text style={styles.statusText}>
                        {hasSubmitted ? '✓ تم' : '⏳ ينتظر'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⏳ في انتظار تسليم جميع اللاعبين لتقاريرهم...
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
  );
};

/**
 * شاشة التصويت المباشر للمضيف
 */
export const HostVotingScreen = ({ 
  votingType = 'quality', // 'quality' or 'culprit'
  scenarios = [],
  liveVotes = [],
  players = []
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  const votedCount = liveVotes.length;
  const totalPlayers = players.length;

  const getVotesForScenario = (index) => {
    return liveVotes.filter(vote => vote.choice === index).length;
  };

  return (
    <ImageBackground
      source={require('../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {votingType === 'quality' ? 'تصويت الجودة' : 'تصويت الجاني'}
            </Text>
          </View>

          {/* Cards Grid Container */}
          <View style={styles.cardsGrid}>
            {/* Progress */}
            <Card style={[styles.card, styles.gridCard]}>
              <View style={styles.compactHeader}>
                <Text style={styles.sectionTitle}>التقدم</Text>
                <Text style={styles.progressText}>
                  {votedCount} / {totalPlayers}
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(votedCount / totalPlayers) * 100}%` }
                  ]} 
                />
              </View>
            </Card>

            {/* Voters List */}
            <Card style={[styles.card, styles.gridCard]}>
              <Text style={styles.sectionTitle}>من صوّت؟</Text>
              
              <View style={styles.votersList}>
                {players.map((player, index) => {
                  const hasVoted = liveVotes.some(vote => vote.playerId === player.id);
                  return (
                    <View key={player.id || index} style={styles.voterItem}>
                      <Text style={styles.voterIcon}>{hasVoted ? '✓' : '○'}</Text>
                      <Text style={[
                        styles.voterName,
                        hasVoted && styles.voterNameVoted
                      ]}>
                        {player.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card>

            {/* Live Votes */}
            <Card style={[styles.card, styles.fullWidthCard]}>
              <Text style={styles.sectionTitle}>الأصوات الحية</Text>
              
              <View style={styles.playersGrid}>
                {scenarios.map((scenario, index) => {
                  const votes = getVotesForScenario(index);
                  return (
                    <View key={index} style={styles.voteItem}>
                      <Text style={styles.voteLabel}>
                        {votingType === 'quality' 
                          ? `تقرير #${index + 1}` 
                          : scenario.playerName || scenario.author || `لاعب ${index + 1}`}
                      </Text>
                      <View style={styles.voteBar}>
                        <View 
                          style={[
                            styles.voteBarFill, 
                            { width: totalPlayers > 0 ? `${(votes / totalPlayers) * 100}%` : '0%' }
                          ]} 
                        />
                      </View>
                      <Text style={styles.voteCount}>{votes}</Text>
                    </View>
                  );
                })}
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
  );
};

/**
 * شاشة النتائج للمضيف
 */
export const HostResultsScreen = ({ 
  roundResults = null,
  onContinue,
  isLastRound = false
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  return (
    <ImageBackground
      source={require('../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.title}>نتائج الجولة</Text>

          {/* Winner & Culprit Row */}
          <View style={styles.cardsGrid}>
            {/* Winner Scenario */}
            {roundResults && roundResults.bestScenario && (
              <Card style={[styles.card, styles.gridCard]}>
                <Text style={styles.sectionTitle}>🥇 أفضل سيناريو</Text>
                <View style={styles.winnerBox}>
                  <Text style={styles.winnerName}>{roundResults.bestScenario.author}</Text>
                  <Text style={styles.winnerScore}>+{roundResults.bestScenario.points} نقطة</Text>
                </View>
              </Card>
            )}

            {/* Culprit Result */}
            {roundResults && roundResults.culpritVote && (
              <Card style={[styles.card, styles.gridCard]}>
                <Text style={styles.sectionTitle}>🔍 نتيجة التصويت</Text>
                <View style={styles.culpritBox}>
                  <Text style={styles.culpritText}>
                    المتهم: {roundResults.culpritVote.accused}
                  </Text>
                  <Text style={styles.culpritSubtext}>
                    {roundResults.culpritVote.isCorrect 
                      ? '✓ صحيح!' 
                      : '✗ خطأ!'}
                  </Text>
                </View>
              </Card>
            )}
          </View>

          {/* Current Standings */}
          {roundResults && roundResults.standings && (
            <Card style={[styles.card, styles.fullWidthCard]}>
              <Text style={styles.sectionTitle}>📊 الترتيب الحالي</Text>
              
              <View style={styles.playersGrid}>
                {roundResults.standings.map((player, index) => (
                  <View key={index} style={styles.standingItem}>
                    <View style={styles.standingRank}>
                      <Text style={styles.standingRankText}>#{index + 1}</Text>
                    </View>
                    <Text style={styles.standingName}>{player.name}</Text>
                    <Text style={styles.standingScore}>{player.totalScore}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Continue Button */}
          <Button
            title={isLastRound ? "النتائج النهائية 🎉" : "الجولة التالية ➡️"}
            onPress={onContinue}
            size="large"
            fullWidth
            style={styles.continueButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
  );
};

const getStyles = (isDesktop) => StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1410',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: isDesktop ? moderateScale(3) : spacing.xl,
  },
  container: {
    flex: 1,
    padding: getContainerPadding(),
    alignItems: 'center',
    maxWidth: isDesktop ? 1200 : 800,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: isDesktop ? moderateScale(1) : spacing.xl,
  },
  title: {
    fontSize: isDesktop ? fonts.medium : fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: isDesktop ? 700 : 600,
    marginBottom: isDesktop ? moderateScale(1) : spacing.l,
    paddingVertical: isDesktop ? moderateScale(2) : undefined,
    paddingHorizontal: isDesktop ? moderateScale(3) : undefined,
  },

  // Section Title
  sectionTitle: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: isDesktop ? spacing.xs : spacing.m,
    textTransform: 'uppercase',
  },

  // Progress
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  progressText: {
    fontSize: isDesktop ? fonts.medium : fonts.xlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },
  progressBar: {
    width: '100%',
    height: isDesktop ? moderateScale(8) : moderateScale(12),
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.teamGood,
    borderRadius: borderRadius.medium,
  },

  // Players/Voters List
  playersGrid: {
    flexDirection: isDesktop ? 'row' : 'column',
    flexWrap: isDesktop ? 'wrap' : 'nowrap',
    gap: isDesktop ? moderateScale(4) : 0,
    width: '100%',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isDesktop ? moderateScale(1.5) : spacing.m,
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.small,
    marginBottom: isDesktop ? 0 : spacing.s,
    width: isDesktop ? '24%' : '100%',
  },
  playerNumber: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.stamp,
    width: moderateScale(25),
  },
  playerName: {
    flex: 1,
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  statusText: {
    fontSize: isDesktop ? moderateScale(7) : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.paper,
    fontWeight: '700',
  },

  // Vote Items
  voteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isDesktop ? spacing.s : spacing.m,
    width: isDesktop ? '48%' : '100%',
  },
  voteLabel: {
    fontSize: isDesktop ? moderateScale(7) : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    width: moderateScale(100),
  },
  voteBar: {
    flex: 1,
    height: isDesktop ? moderateScale(16) : moderateScale(24),
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.small,
    overflow: 'hidden',
    marginHorizontal: spacing.s,
  },
  voteBarFill: {
    height: '100%',
    backgroundColor: theme.colors.stamp,
  },
  voteCount: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    width: moderateScale(30),
    textAlign: 'right',
  },

  // Voters List
  votersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    justifyContent: isDesktop ? 'center' : 'flex-start',
  },
  voterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.small,
  },
  voterIcon: {
    fontSize: moderateScale(16),
    marginRight: spacing.xs,
  },
  voterName: {
    fontSize: isDesktop ? moderateScale(7) : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },
  voterNameVoted: {
    color: theme.colors.text,
    fontWeight: '700',
  },

  // Results
  winnerBox: {
    alignItems: 'center',
    padding: isDesktop ? spacing.s : spacing.l,
    backgroundColor: theme.colors.stickyNote + '20',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.stickyNote,
    flexDirection: isDesktop ? 'row' : 'column',
    justifyContent: 'space-between',
  },
  winnerName: {
    fontSize: isDesktop ? fonts.small : fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: isDesktop ? 0 : spacing.s,
  },
  winnerScore: {
    fontSize: isDesktop ? fonts.small : fonts.xlarge,
    fontFamily: theme.fonts.main,
    color: theme.colors.stickyNote,
    fontWeight: '700',
  },
  culpritBox: {
    padding: isDesktop ? spacing.s : spacing.l,
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.medium,
    flexDirection: isDesktop ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  culpritText: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    textAlign: isDesktop ? 'left' : 'center',
    marginBottom: isDesktop ? 0 : spacing.s,
  },
  culpritSubtext: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    textAlign: isDesktop ? 'right' : 'center',
  },
  standingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isDesktop ? moderateScale(1.5) : spacing.m,
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.small,
    marginBottom: isDesktop ? 0 : spacing.s,
    width: isDesktop ? '24%' : '100%',
  },
  standingRank: {
    width: isDesktop ? moderateScale(30) : moderateScale(40),
    height: isDesktop ? moderateScale(30) : moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: theme.colors.stamp,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  standingRankText: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.paper,
  },
  standingName: {
    flex: 1,
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },
  standingScore: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.stickyNote,
  },

  // Buttons
  continueButton: {
    maxWidth: isDesktop ? 400 : 400,
    width: '100%',
    alignSelf: 'center',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.stickyNote + '20',
    padding: isDesktop ? moderateScale(3) : spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.stickyNote,
    maxWidth: isDesktop ? 700 : 600,
    width: '100%',
  },
  successBox: {
    backgroundColor: theme.colors.teamGood + '20',
    borderColor: theme.colors.teamGood,
  },
  infoIcon: {
    fontSize: moderateScale(24),
    marginLeft: spacing.s,
  },
  infoText: {
    flex: 1,
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },

  // Centered Container (for intro/waiting screens)
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getContainerPadding(),
    maxWidth: isDesktop ? 1000 : 800,
    alignSelf: 'center',
    width: '100%',
  },
  largeEmoji: {
    fontSize: isDesktop ? moderateScale(48) : moderateScale(96),
    marginBottom: isDesktop ? moderateScale(2) : spacing.xl,
  },
  roundBadge: {
    backgroundColor: theme.colors.stamp,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.medium,
    marginBottom: isDesktop ? moderateScale(2) : spacing.xl,
  },
  roundText: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.paper,
    textTransform: 'uppercase',
  },
  scenarioCard: {
    width: '100%',
    maxWidth: isDesktop ? 700 : 600,
    padding: isDesktop ? moderateScale(6) : spacing.xl,
    marginBottom: isDesktop ? moderateScale(2) : spacing.xl,
    alignItems: 'center',
  },
  scenarioLabel: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    marginBottom: spacing.m,
  },
  scenarioTitle: {
    fontSize: isDesktop ? fonts.medium : fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: isDesktop ? fonts.medium * 1.4 : fonts.xxlarge * 1.4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isDesktop ? moderateScale(2) : spacing.xxl,
  },
  statusEmoji: {
    fontSize: moderateScale(32),
    marginLeft: spacing.m,
  },
  statusText: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },
  waitingText: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Timer Card
  timerCard: {
    width: '100%',
    maxWidth: isDesktop ? '100%' : 400,
    padding: isDesktop ? moderateScale(2) : spacing.m,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: isDesktop ? moderateScale(1) : spacing.m,
    // Horizontal on web?
    flexDirection: isDesktop ? 'row' : 'column',
    justifyContent: isDesktop ? 'space-between' : 'center',
  },
  timerLabel: {
    fontSize: isDesktop ? fonts.tiny : fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    marginBottom: isDesktop ? 0 : spacing.xs,
    marginRight: isDesktop ? spacing.m : 0,
  },
  timerText: {
    fontSize: isDesktop ? moderateScale(20) : moderateScale(36),
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    marginBottom: isDesktop ? 0 : spacing.s,
  },
  timerBar: {
    width: isDesktop ? '40%' : '100%',
    height: moderateScale(8),
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
    marginLeft: isDesktop ? spacing.m : 0,
  },
  timerBarFill: {
    height: '100%',
    borderRadius: borderRadius.medium,
  },

  // Player Item (Drafting)
  playerItemSubmitted: {
    backgroundColor: theme.colors.teamGood + '20',
    borderWidth: 1,
    borderColor: theme.colors.teamGood,
  },
  playerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: moderateScale(20),
    marginLeft: spacing.s,
  },
  statusTextSubmitted: {
    color: theme.colors.teamGood,
    fontWeight: '700',
  },

  // Dramatic Reveal
  currentRevealCard: {
    width: '100%',
    maxWidth: isDesktop ? 700 : 700,
    padding: isDesktop ? spacing.m : spacing.xxl,
    marginBottom: isDesktop ? spacing.m : spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.stamp,
  },
  currentRevealText: {
    fontSize: isDesktop ? fonts.medium : fonts.xlarge,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    lineHeight: isDesktop ? fonts.medium * 1.3 : fonts.xlarge * 1.5,
    marginBottom: isDesktop ? spacing.m : spacing.l,
    textAlign: 'center',
  },
  votesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.m,
    gap: spacing.m,
  },
  votesLabel: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
    
  },
  authorLabel: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },
  authorName: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.stamp,
  },
  revealedScenario: {
    padding: isDesktop ? spacing.s : spacing.l,
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.medium,
    marginBottom: isDesktop ? spacing.s : spacing.m,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.stamp,
    width: isDesktop ? '48%' : '100%',
  },
  revealedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: isDesktop ? spacing.xs : spacing.m,
  },
  revealedText: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    lineHeight: isDesktop ? fonts.tiny * 1.5 : fonts.medium * 1.5,
    marginBottom: spacing.s,
  },
  revealedAuthor: {
    fontSize: isDesktop ? moderateScale(7) : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.stamp,
    fontWeight: '700',
  },
  // Grids
  cardsGrid: {
    flexDirection: isDesktop ? 'row' : 'column',
    flexWrap: isDesktop ? 'wrap' : 'nowrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: moderateScale(16),
  },
  gridCard: {
    width: isDesktop ? '48%' : '100%',
    marginBottom: 0,
  },
  fullWidthCard: {
    width: '100%',
    maxWidth: '100%',
    marginTop: isDesktop ? moderateScale(8) : 0,
  },
  // Compact Header for Grid Cards
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
