import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { Card, Button } from '../ui';

/**
 * شاشة التصويت على جودة السيناريو (Quality Voting)
 */
export const QualityVotingScreen = ({ 
  scenarios = [], 
  onVote, 
  hasVoted = false,
  selectedScenario = null 
}) => {
  const [selected, setSelected] = useState(selectedScenario);

  const handleVote = () => {
    if (selected !== null) {
      onVote(selected);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.stampContainer}>
            <Text style={styles.stampText}>مرحلة التقييم</Text>
            <Text style={styles.stampSubtext}>EVALUATION PHASE</Text>
          </View>

          {/* Instructions */}
          <Card style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              📋 اقرأ جميع السيناريوهات واختر الأفضل
            </Text>
            <Text style={styles.instructionSubtext}>
              (الأسماء مخفية - اختر بناءً على الجودة فقط)
            </Text>
          </Card>

          {/* Scenarios */}
          {scenarios.map((scenario, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.scenarioCard,
                selected === index && styles.scenarioCardSelected,
                hasVoted && styles.scenarioCardDisabled,
              ]}
              onPress={() => !hasVoted && setSelected(index)}
              disabled={hasVoted}
              activeOpacity={0.7}
            >
              <View style={styles.scenarioHeader}>
                <Text style={styles.scenarioNumber}>تقرير #{index + 1}</Text>
                {selected === index && !hasVoted && (
                  <Text style={styles.selectedBadge}>✓ محدد</Text>
                )}
              </View>
              <Text style={styles.scenarioText}>
                {scenario.answer || scenario.text || (typeof scenario === 'string' ? scenario : 'لا يوجد نص')}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Vote Button */}
          <Button
            title={hasVoted ? "تم التصويت ✓" : "تأكيد التصويت 🗳️"}
            onPress={handleVote}
            disabled={hasVoted || selected === null}
            size="large"
            fullWidth
            style={styles.voteButton}
          />

          {hasVoted && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✅ تم تسجيل صوتك! في انتظار باقي اللاعبين...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * شاشة التصويت على الجاني (Culprit Voting)
 */
export const CulpritVotingScreen = ({ 
  scenarios = [], 
  onVote, 
  hasVoted = false,
  selectedCulprit = null 
}) => {
  const [selected, setSelected] = useState(selectedCulprit);

  const handleVote = () => {
    if (selected !== null) {
      onVote(selected);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.stampContainer, { backgroundColor: theme.colors.teamEvil }]}>
            <Text style={styles.stampText}>من الجاني؟</Text>
            <Text style={styles.stampSubtext}>WHO IS THE CULPRIT?</Text>
          </View>

          {/* Instructions */}
          <Card style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              🔍 اقرأ السيناريوهات مع أسماء الكتّاب
            </Text>
            <Text style={styles.instructionSubtext}>
              صوّت على من تعتقد أنه الجاني
            </Text>
          </Card>

          {/* Scenarios with Authors */}
          {scenarios.map((scenario, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.scenarioCard,
                selected === index && styles.scenarioCardSelected,
                hasVoted && styles.scenarioCardDisabled,
              ]}
              onPress={() => !hasVoted && setSelected(index)}
              disabled={hasVoted}
              activeOpacity={0.7}
            >
              <View style={styles.scenarioHeader}>
                <View style={styles.authorInfo}>
                  <Text style={styles.authorIcon}>🕵️</Text>
                  <Text style={styles.authorName}>{scenario.author || scenario.name || 'مجهول'}</Text>
                </View>
                {selected === index && !hasVoted && (
                  <Text style={styles.selectedBadge}>✓ محدد</Text>
                )}
              </View>
              <Text style={styles.scenarioText}>
                {scenario.answer || scenario.text || (typeof scenario === 'string' ? scenario : 'لا يوجد نص')}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Vote Button */}
          <Button
            title={hasVoted ? "تم التصويت ✓" : "اتهم هذا اللاعب 👉"}
            onPress={handleVote}
            disabled={hasVoted || selected === null}
            size="large"
            fullWidth
            style={styles.voteButton}
          />

          {hasVoted && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✅ تم تسجيل اتهامك! في انتظار النتائج...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * شاشة انتظار العرض الدرامي
 */
export const WaitingRevealScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingEmoji}>🎭</Text>
          <Text style={styles.waitingTitle}>العرض الدرامي</Text>
          <Text style={styles.waitingText}>
            المضيف يعرض النتائج الآن...
          </Text>
          <Text style={styles.waitingSubtext}>
            شاهد الشاشة الرئيسية
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

/**
 * شاشة النهاية
 */
export const EndScreen = ({ results = null, onPlayAgain, onExit }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Trophy */}
          <Text style={styles.trophyEmoji}>🏆</Text>

          {/* Results Card */}
          {results && (
            <Card style={styles.card}>
              <Text style={styles.resultsTitle}>النتائج النهائية</Text>
              
              {results.players && results.players.map((player, index) => (
                <View key={index} style={styles.resultItem}>
                  <View style={styles.resultRank}>
                    <Text style={styles.resultRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{player.name}</Text>
                    <Text style={styles.resultRole}>{player.role}</Text>
                  </View>
                  <Text style={styles.resultScore}>{player.score} نقطة</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Thank You Message */}
          <Card style={styles.card}>
            <Text style={styles.thankYouText}>
              🎉 شكراً لمشاركتك في اللعبة!
            </Text>
            <Text style={styles.thankYouSubtext}>
              نتمنى أن تكون قد استمتعت بالتحقيق
            </Text>
          </Card>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {onPlayAgain && (
              <Button
                title="لعبة جديدة 🔄"
                onPress={onPlayAgain}
                variant="secondary"
                size="large"
                fullWidth
                style={styles.actionButton}
              />
            )}
            <Button
              title="خروج 🚪"
              onPress={onExit}
              variant="outline"
              size="large"
              fullWidth
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * شاشة مشاهدة العرض التشويقي للاعب
 */
export const PlayerDramaticRevealScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.centeredContainer}>
        {/* TV Icon */}
        <Text style={styles.largeEmoji}>📺</Text>

        {/* Main Message */}
        <Card style={styles.messageCard}>
          <Text style={styles.messageTitle}>🎬 العرض التشويقي</Text>
          <Text style={styles.messageText}>
            شاهد نتائج التصويت على الشاشة الرئيسية
          </Text>
        </Card>

        {/* Waiting Indicator */}
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingEmoji}>⏳</Text>
          <Text style={styles.waitingText}>
            سيتم الانتقال للتصويت التالي تلقائياً
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.revealInfoBox}>
          <Text style={styles.revealInfoIcon}>💡</Text>
          <Text style={styles.revealInfoText}>
            تابع الشاشة الرئيسية لرؤية السيناريوهات والأصوات والكتّاب
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
  },
  container: {
    flex: 1,
    padding: getContainerPadding(),
    alignItems: 'center',
  },

  // Stamp
  stampContainer: {
    backgroundColor: theme.colors.stamp,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.small,
    transform: [{ rotate: '-3deg' }],
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.stamp,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stampText: {
    fontSize: fonts.xlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '800',
    color: theme.colors.paper,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  stampSubtext: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.paper,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Cards
  card: {
    width: '100%',
    maxWidth: 600,
    marginBottom: spacing.l,
  },
  instructionCard: {
    width: '100%',
    maxWidth: 600,
    marginBottom: spacing.l,
    backgroundColor: theme.colors.stickyNote + '20',
    borderColor: theme.colors.stickyNote,
  },
  instructionText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  instructionSubtext: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Scenario Cards
  scenarioCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: theme.colors.paper,
    borderRadius: borderRadius.small,
    padding: spacing.l,
    marginBottom: spacing.m,
    borderWidth: 2,
    borderColor: '#D4C5A9',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scenarioCardSelected: {
    borderColor: theme.colors.stamp,
    borderWidth: 3,
    backgroundColor: theme.colors.stamp + '05',
  },
  scenarioCardDisabled: {
    opacity: 0.6,
  },
  scenarioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  scenarioNumber: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  selectedBadge: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.stamp,
    fontWeight: '700',
  },
  scenarioText: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    lineHeight: fonts.regular * 1.5,
  },

  // Author Info
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorIcon: {
    fontSize: moderateScale(20),
    marginRight: spacing.s,
  },
  authorName: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Vote Button
  voteButton: {
    maxWidth: 600,
    width: '100%',
    marginTop: spacing.m,
  },

  // Success Box
  successBox: {
    backgroundColor: theme.colors.teamGood + '20',
    padding: spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.teamGood,
    marginTop: spacing.l,
    maxWidth: 600,
    width: '100%',
  },
  successText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.teamGood,
    textAlign: 'center',
  },

  // Waiting Screen
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  waitingEmoji: {
    fontSize: moderateScale(80),
    marginBottom: spacing.xl,
  },
  waitingTitle: {
    fontSize: fonts.title,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.m,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  waitingText: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  waitingSubtext: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // End Screen
  trophyEmoji: {
    fontSize: moderateScale(100),
    marginBottom: spacing.xl,
  },
  resultsTitle: {
    fontSize: fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: spacing.l,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.small,
    marginBottom: spacing.s,
  },
  resultRank: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: theme.colors.stamp,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.m,
  },
  resultRankText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.paper,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    fontWeight: '700',
    color: theme.colors.text,
  },
  resultRole: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },
  resultScore: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.stickyNote,
  },
  thankYouText: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  thankYouSubtext: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  actionButton: {
    marginBottom: spacing.m,
  },

  // Player Dramatic Reveal Screen
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getContainerPadding(),
  },
  largeEmoji: {
    fontSize: moderateScale(120),
    marginBottom: spacing.xxl,
  },
  messageCard: {
    width: '100%',
    maxWidth: 500,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  messageTitle: {
    fontSize: fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: spacing.m,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    textAlign: 'center',
    lineHeight: fonts.large * 1.5,
  },
  revealInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.stickyNote + '20',
    padding: spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.stickyNote,
    maxWidth: 500,
    width: '100%',
  },
  revealInfoIcon: {
    fontSize: moderateScale(24),
    marginLeft: spacing.m,
  },
  revealInfoText: {
    flex: 1,
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },
});
