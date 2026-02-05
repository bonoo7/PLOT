import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Platform, Dimensions, ImageBackground } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { Card, Button, TextInput, Badge } from '../ui';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * شاشة عرض الدور المحسّنة (للاعب)
 */
export const GameScreen = ({ roleData, onReady }) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  if (!roleData) {
    return (
    <ImageBackground
      source={require('../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centeredContainer}>
          <Text style={styles.largeEmoji}>⏳</Text>
          <Text style={styles.loadingText}>جاري تحميل دورك...</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
    );
  }

  const { role, roleName, description, info, team } = roleData;

  // Get role emoji
  const getRoleEmoji = (role) => {
    const emojiMap = {
      'CULPRIT': '🎭',
      'FORGER': '🧩',
      'INFILTRATOR': '🕵️',
      'ACCOMPLICE': '🤝',
      'LAWYER': '⚖️',
      'CHIEF_DETECTIVE': '🔍',
      'ANALYST': '📊',
      'OFFICER': '👮',
      'WITNESS': '👁️',
      'SABOTEUR': '😈',
    };
    return emojiMap[role] || '🎭';
  };

  // Parse keywords from info string
  const extractKeywords = (infoText) => {
    if (!infoText || typeof infoText !== 'string') return [];
    
    // Try to extract keywords from patterns like "كلماتك المفتاحية: كلمة1 - كلمة2 - كلمة3"
    const keywordMatch = infoText.match(/كلماتك المفتاحية:\s*(.+)/);
    if (keywordMatch) {
      return keywordMatch[1].split('-').map(k => k.trim()).filter(Boolean);
    }
    
    // Try pattern with commas
    const commaMatch = infoText.match(/كلماتك المفتاحية:\s*(.+)/);
    if (commaMatch) {
      return commaMatch[1].split(',').map(k => k.trim()).filter(Boolean);
    }
    
    return [];
  };

  // Check role type for special rendering
  const isForger = role === 'FORGER';
  const isCulprit = role === 'CULPRIT';
  const isAccomplice = role === 'ACCOMPLICE' || role === 'LAWYER';
  const isInfiltrator = role === 'INFILTRATOR';
  
  const keywords = isForger ? extractKeywords(info) : [];

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
          {/* Header with Role Emoji */}
          <View style={styles.header}>
            <Text style={styles.roleEmoji}>{getRoleEmoji(role)}</Text>
            <Text style={styles.roleTitle}>دورك: {roleName || role}</Text>
          </View>

          {/* Secret Information Card */}
          <Card style={styles.secretCard}>
            <View style={styles.secretHeader}>
              <Badge text="سري للغاية" variant="primary" />
            </View>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>مهمتك:</Text>
              <Text style={styles.description}>{description || 'انتظر التعليمات...'}</Text>
            </View>

            {/* Special Info based on role */}
            {info && (
              <>
                <View style={styles.divider} />
                
                {/* Culprit: Full Story */}
                {isCulprit && (
                  <View style={styles.storyContainer}>
                    <Text style={styles.infoLabel}>📖 القصة الكاملة:</Text>
                    <View style={styles.storyBox}>
                      <Text style={styles.storyText}>{info}</Text>
                    </View>
                  </View>
                )}

                {/* Forger: Keywords */}
                {isForger && keywords.length > 0 && (
                  <View style={styles.keywordsContainer}>
                    <Text style={styles.infoLabel}>🧩 كلماتك المفتاحية:</Text>
                    <View style={styles.keywordsList}>
                      {keywords.map((keyword, index) => (
                        <View key={index} style={styles.keywordBadge}>
                          <Text style={styles.keywordText}>{keyword}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Infiltrator: Scrambled Text */}
                {isInfiltrator && (
                  <View style={styles.infiltratorContainer}>
                    <Text style={styles.infoLabel}>🕵️ المعلومات المشوشة:</Text>
                    <View style={styles.scrambledBox}>
                      <Text style={styles.scrambledText}>{info}</Text>
                    </View>
                  </View>
                )}

                {/* Accomplice/Lawyer: Culprit Name */}
                {isAccomplice && (
                  <View style={styles.accompliceContainer}>
                    <Text style={styles.infoLabel}>🤝 معلوماتك:</Text>
                    <View style={styles.accompliceBox}>
                      <Text style={styles.accompliceText}>{info}</Text>
                    </View>
                  </View>
                )}

                {/* Other roles: General info */}
                {!isCulprit && !isForger && !isInfiltrator && !isAccomplice && (
                  <View style={styles.generalInfoContainer}>
                    <Text style={styles.generalInfo}>{info}</Text>
                  </View>
                )}
              </>
            )}
          </Card>

          {/* Instructions Card */}
          <Card style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>📝 ماذا بعد؟</Text>
            <Text style={styles.instructionsText}>
              {isCulprit && 'اكتب الحقيقة بأسلوب غامض دون أن ينكشف أمرك'}
              {isForger && 'ابنِ قصة متماسكة باستخدام الكلمات المفتاحية'}
              {isInfiltrator && 'استخدم المعلومات الجزئية لكتابة سيناريو مقنع'}
              {isAccomplice && 'ساعد الجاني بكتابة سيناريو داعم'}
              {!isCulprit && !isForger && !isInfiltrator && !isAccomplice && 'اكتب سيناريو مقنع بناءً على عنوان القضية'}
            </Text>
          </Card>

          {/* Ready Button */}
          <Button
            title="جاهز - ابدأ الكتابة ✍️"
            onPress={onReady}
            size="large"
            fullWidth
            style={styles.readyButton}
          />

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              ستبدأ مرحلة الكتابة تلقائياً بعد لحظات
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
  );
};

/**
 * شاشة كتابة التقرير (Drafting)
 */
export const DraftingScreen = ({ 
  answer, 
  setAnswer, 
  onSubmit, 
  timeLeft, 
  isSubmitted,
  scenario 
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  const maxLength = 500;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

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
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.container}>
          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
          </View>

          {/* Scenario */}
          {scenario && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>📝 السيناريو:</Text>
              <Text style={styles.scenarioText}>{scenario}</Text>
            </Card>
          )}

          {/* Drafting Area */}
          <Card style={styles.card}>
            <Text style={styles.instructionText}>
              اكتب تقريرك السري عن الأحداث:
            </Text>

            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="اكتب هنا..."
              maxLength={maxLength}
              multiline
              numberOfLines={8}
              editable={!isSubmitted}
            />

            <Button
              title={isSubmitted ? "تم التسليم ✓" : "تسليم التقرير 📤"}
              onPress={onSubmit}
              disabled={isSubmitted || answer.trim().length < 10}
              size="large"
              fullWidth
              style={styles.submitButton}
            />
          </Card>

          {isSubmitted && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✅ تم تسليم تقريرك بنجاح! في انتظار باقي اللاعبين...
              </Text>
            </View>
          )}
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
    maxWidth: isDesktop ? '90%' : 800,
    alignSelf: 'center',
    width: '100%',
  },

  // Stamp
  stampContainer: {
    backgroundColor: theme.colors.stamp,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.small,
    transform: [{ rotate: '-5deg' }],
    marginBottom: isDesktop ? moderateScale(2) : spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.stamp,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stampText: {
    fontSize: isDesktop ? fonts.medium : fonts.xlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '800',
    color: theme.colors.paper,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  stampSubtext: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.paper,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Avatar
  avatarContainer: {
    marginBottom: isDesktop ? moderateScale(2) : spacing.l,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: isDesktop ? '100%' : 500,
    marginBottom: isDesktop ? moderateScale(1) : spacing.l,
    paddingVertical: isDesktop ? moderateScale(2) : undefined,
  },

  // Role Info
  roleTitle: {
    fontSize: isDesktop ? fonts.medium : fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: isDesktop ? spacing.xs : spacing.m,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  teamBadge: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.medium,
    alignSelf: 'center',
    marginBottom: spacing.m,
  },
  teamText: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    fontWeight: '700',
  },

  // Sections
  divider: {
    height: 1,
    backgroundColor: theme.colors.text + '20',
    marginVertical: isDesktop ? moderateScale(2) : spacing.m,
  },
  sectionTitle: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.s,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: isDesktop ? fonts.tiny : fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    lineHeight: isDesktop ? fonts.tiny * 1.6 : fonts.regular * 1.6,
  },

  // Abilities
  abilityItem: {
    marginBottom: spacing.s,
  },
  abilityText: {
    fontSize: isDesktop ? fonts.tiny : fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },

  // Timer
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.stickyNote + '30',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.stickyNote,
  },
  timerIcon: {
    fontSize: moderateScale(24),
    marginRight: spacing.m,
  },
  timerText: {
    fontSize: isDesktop ? fonts.medium : fonts.xlarge,
    fontFamily: theme.fonts.main,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Scenario
  scenarioText: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    lineHeight: fonts.regular * 1.6,
  },

  // Instructions
  instructionText: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    marginBottom: spacing.m,
  },

  // Submit Button
  submitButton: {
    marginTop: spacing.m,
    maxWidth: isDesktop ? 400 : undefined,
    width: '100%',
    alignSelf: 'center',
  },

  // Info/Success Boxes
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.stickyNote + '20',
    padding: isDesktop ? moderateScale(3) : spacing.m,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: theme.colors.stickyNote,
    maxWidth: isDesktop ? '100%' : 450,
    width: '100%',
  },
  infoIcon: {
    fontSize: moderateScale(20),
    marginLeft: spacing.s,
  },
  infoText: {
    flex: 1,
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },
  successBox: {
    backgroundColor: theme.colors.teamGood + '20',
    padding: isDesktop ? moderateScale(3) : spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.teamGood,
    maxWidth: isDesktop ? '100%' : 450,
    width: '100%',
  },
  successText: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.teamGood,
    textAlign: 'center',
  },

  // GameScreen (Role Reveal) - New Styles
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getContainerPadding(),
    maxWidth: isDesktop ? '90%' : 800,
    alignSelf: 'center',
    width: '100%',
  },
  largeEmoji: {
    fontSize: isDesktop ? moderateScale(48) : moderateScale(80),
    marginBottom: isDesktop ? moderateScale(1) : spacing.xl,
  },
  loadingText: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: isDesktop ? moderateScale(1) : spacing.xl,
  },
  roleEmoji: {
    fontSize: isDesktop ? moderateScale(48) : moderateScale(80),
    marginBottom: isDesktop ? spacing.s : spacing.m,
  },
  secretCard: {
    width: '100%',
    maxWidth: isDesktop ? '100%' : 600,
    padding: isDesktop ? moderateScale(4) : spacing.xl,
    marginBottom: isDesktop ? moderateScale(2) : spacing.l,
  },
  secretHeader: {
    alignItems: 'center',
    marginBottom: isDesktop ? moderateScale(1) : spacing.l,
  },
  descriptionContainer: {
    marginBottom: spacing.m,
  },
  descriptionLabel: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.stamp,
    marginBottom: spacing.s,
    textTransform: 'uppercase',
  },
  infoLabel: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.stamp,
    marginBottom: spacing.m,
  },
  storyContainer: {
    marginTop: spacing.m,
  },
  storyBox: {
    backgroundColor: theme.colors.background,
    padding: spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.stamp + '40',
  },
  storyText: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    lineHeight: fonts.regular * 1.6,
  },
  keywordsContainer: {
    marginTop: spacing.m,
  },
  keywordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  keywordBadge: {
    backgroundColor: theme.colors.accentYellow,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.accentYellow,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  keywordText: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'uppercase',
  },
  infiltratorContainer: {
    marginTop: spacing.m,
  },
  scrambledBox: {
    backgroundColor: theme.colors.background,
    padding: spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary + '40',
  },
  scrambledText: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    lineHeight: fonts.regular * 1.6,
    fontStyle: 'italic',
  },
  accompliceContainer: {
    marginTop: spacing.m,
  },
  accompliceBox: {
    backgroundColor: theme.colors.stamp + '10',
    padding: spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 2,
    borderColor: theme.colors.stamp,
  },
  accompliceText: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.stamp,
    textAlign: 'center',
  },
  generalInfoContainer: {
    marginTop: spacing.m,
  },
  generalInfo: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    lineHeight: fonts.regular * 1.6,
  },
  instructionsCard: {
    width: '100%',
    maxWidth: 600,
    padding: spacing.l,
    marginBottom: spacing.l,
    backgroundColor: theme.colors.stickyNote + '15',
    borderColor: theme.colors.stickyNote,
  },
  instructionsTitle: {
    fontSize: isDesktop ? fonts.small : fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.s,
  },
  instructionsText: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    lineHeight: fonts.regular * 1.5,
  },
  readyButton: {
    maxWidth: isDesktop ? 400 : 500,
    width: '100%',
    marginBottom: spacing.l,
    alignSelf: 'center',
  },
});
