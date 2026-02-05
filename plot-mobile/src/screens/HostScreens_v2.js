import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Share, TouchableOpacity, ImageBackground, Platform, Dimensions } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { Button, Card } from '../ui';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * شاشة إعداد المضيف
 */
export const HostSetupScreen = ({ onCreateRoom, connecting, onBack }) => {
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
            <Text style={styles.title}>مركز القيادة</Text>
            <Text style={styles.subtitle}>أنشئ غرفة جديدة للعبة</Text>
          </View>

          {/* Features */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>مميزات المضيف:</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>• توزيع الأدوار</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>• إدارة السيناريوهات</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>• التصويت المباشر</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureText}>• النتائج والنقاط</Text>
              </View>
            </View>

            <Button
              title={connecting ? "جاري الإنشاء..." : "إنشاء غرفة"}
              onPress={onCreateRoom}
              disabled={connecting}
              loading={connecting}
              size="large"
              fullWidth
              style={styles.button}
            />
          </Card>

          {/* Requirements */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>متطلبات اللعبة:</Text>
            <Text style={styles.infoText}>• 4-8 لاعبين</Text>
            <Text style={styles.infoText}>• مدة اللعبة: 30-45 دقيقة</Text>
          </View>

          {/* Back Button */}
          {onBack && (
            <Button
              title="رجوع"
              onPress={onBack}
              variant="secondary"
              style={styles.backButtonBottom}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
  );
};

/**
 * شاشة غرفة انتظار المضيف
 */
export const HostLobbyScreen = ({ 
  roomCode, 
  players = [], 
  onStartGame,
  onFillBots,
  onBack,
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  const canStart = players.length >= 4 && players.length <= 8;
  const needsMore = 4 - players.length;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `انضم إلى لعبة PLOT! 🕵️\n\nرمز الغرفة: ${roomCode}\n\nاستخدم التطبيق للانضمام`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
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
            <Text style={styles.title}>غرفة الانتظار</Text>
            
            {/* Room Code */}
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCodeLabel}>رمز الغرفة</Text>
              <View style={styles.roomCodeBox}>
                <Text style={styles.roomCodeText}>{roomCode}</Text>
              </View>
              <Text style={styles.roomCodeHint}>شارك هذا الرمز مع اللاعبين</Text>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareText}>مشاركة الرمز</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Players Card */}
          <Card style={styles.card}>
            <View style={styles.playersHeader}>
              <Text style={styles.sectionTitle}>
                اللاعبون ({players.length}/8)
              </Text>
              {!canStart && needsMore > 0 && (
                <View style={styles.warningBadge}>
                  <Text style={styles.warningText}>يلزم {needsMore} لاعبين</Text>
                </View>
              )}
            </View>

            {players.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>في انتظار اللاعبين...</Text>
                <Text style={styles.emptySubtext}>شارك رمز الغرفة</Text>
              </View>
            ) : (
              <View style={styles.playersList}>
                {players.map((player, index) => (
                  <View key={player.id || index} style={styles.playerItem}>
                    <Text style={styles.playerNumber}>#{index + 1}</Text>
                    <Text style={styles.playerName}>{player.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          {/* Start Button */}
          <Button
            title={canStart ? "بدء اللعبة 🚀" : `يلزم ${needsMore} لاعبين آخرين`}
            onPress={onStartGame}
            disabled={!canStart}
            size="large"
            variant={canStart ? "primary" : "outline"}
            fullWidth
            style={styles.startButton}
          />
          
          {/* Fill Bots Button */}
          {players.length < 8 && (
            <Button
              title="إضافة بوتات"
              onPress={onFillBots}
              size="large"
              variant="secondary"
              fullWidth
              style={styles.fillBotsButton}
            />
          )}

          {canStart && (
            <Text style={styles.readyText}>✅ جاهز للبدء!</Text>
          )}

          {/* Back Button */}
          {onBack && (
            <Button
              title="إلغاء وإغلاق الغرفة"
              onPress={onBack}
              variant="secondary"
              style={styles.backButtonBottom}
            />
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
    justifyContent: 'center',
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
    width: '100%',
  },
  title: {
    fontSize: isDesktop ? fonts.large : fonts.xxlarge,
    fontFamily: theme.fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: isDesktop ? 0 : spacing.s,
  },
  subtitle: {
    fontSize: isDesktop ? fonts.tiny : fonts.regular,
    fontFamily: theme.fonts.main,
    color: '#E8DCC8',
    textAlign: 'center',
  },

  // Back Button Bottom
  backButtonBottom: {
    marginTop: isDesktop ? moderateScale(2) : spacing.m,
    maxWidth: isDesktop ? 400 : 500,
    width: '100%',
    alignSelf: 'center',
  },

  // Card
  card: {
    width: '100%',
    maxWidth: isDesktop ? 700 : 500,
    marginBottom: isDesktop ? moderateScale(1) : spacing.s,
    paddingVertical: isDesktop ? moderateScale(2) : undefined,
    paddingHorizontal: isDesktop ? moderateScale(3) : undefined,
  },

  // Section Title
  sectionTitle: {
    fontSize: isDesktop ? fonts.medium : fonts.large,
    fontFamily: theme.fonts.bold,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: isDesktop ? spacing.xs : spacing.xs,
  },

  // Features
  featuresList: {
    marginBottom: isDesktop ? spacing.s : spacing.s,
    width: '100%',
    maxWidth: isDesktop ? '100%' : '100%',
    // Grid layout for web
    flexDirection: isDesktop ? 'row' : 'column',
    flexWrap: isDesktop ? 'wrap' : 'nowrap',
    justifyContent: isDesktop ? 'center' : 'flex-start',
    gap: isDesktop ? moderateScale(4) : 0,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isDesktop ? moderateScale(2) : spacing.m,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.medium,
    marginBottom: isDesktop ? 0 : 0,
    // Width for grid items
    width: isDesktop ? '45%' : '100%',
  },
  featureText: {
    fontSize: isDesktop ? fonts.small : fonts.medium,
    fontFamily: theme.fonts.main,
    color: '#FFFFFF',
  },

  // Button
  button: {
    marginTop: isDesktop ? moderateScale(3) : spacing.m,
    maxWidth: isDesktop ? 400 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  startButton: {
    maxWidth: isDesktop ? 400 : 500,
    width: '100%',
    alignSelf: 'center',
  },

  // Room Code
  roomCodeContainer: {
    alignItems: 'center',
    marginTop: isDesktop ? moderateScale(2) : spacing.l,
  },
  roomCodeLabel: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    marginBottom: isDesktop ? 0 : spacing.s,
  },
  roomCodeBox: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: isDesktop ? spacing.l : spacing.xl,
    paddingVertical: isDesktop ? spacing.m : spacing.l,
    borderRadius: borderRadius.large,
    borderWidth: 3,
    borderColor: theme.colors.primaryDark,
    marginBottom: isDesktop ? spacing.m : spacing.m,
    minWidth: isDesktop ? 200 : 280,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  roomCodeText: {
    fontSize: isDesktop ? moderateScale(24) : moderateScale(42),
    fontFamily: theme.fonts.bold,
    fontWeight: '900',
    color: theme.colors.white,
    letterSpacing: moderateScale(4),
    textAlign: 'center',
  },
  roomCodeHint: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    marginBottom: isDesktop ? moderateScale(2) : spacing.m,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isDesktop ? spacing.m : spacing.l,
    paddingVertical: isDesktop ? spacing.s : spacing.m,
    backgroundColor: theme.colors.secondary,
    borderRadius: borderRadius.medium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shareText: {
    fontSize: isDesktop ? fonts.small : fonts.medium,
    fontFamily: theme.fonts.bold,
    fontWeight: '600',
    color: theme.colors.text,
  },

  // Players
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isDesktop ? moderateScale(2) : spacing.m,
  },
  warningBadge: {
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.medium,
  },
  warningText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.warning,
  },
  playersList: {
    width: '100%',
    maxWidth: isDesktop ? 800 : 500,
    // Grid for players on web
    flexDirection: isDesktop ? 'row' : 'column',
    flexWrap: isDesktop ? 'wrap' : 'nowrap',
    gap: isDesktop ? moderateScale(4) : 0,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isDesktop ? moderateScale(2) : spacing.m,
    backgroundColor: theme.colors.gray50,
    borderRadius: borderRadius.medium,
    marginBottom: isDesktop ? 0 : spacing.s,
    // Grid item width
    width: isDesktop ? '48%' : '100%',
  },
  playerNumber: {
    fontSize: isDesktop ? fonts.small : fonts.medium,
    fontFamily: theme.fonts.bold,
    fontWeight: '700',
    color: theme.colors.primary,
    width: moderateScale(40),
  },
  playerName: {
    flex: 1,
    fontSize: isDesktop ? fonts.small : fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: isDesktop ? spacing.l : spacing.xl,
  },
  emptyText: {
    fontSize: isDesktop ? fonts.medium : fonts.large,
    fontFamily: theme.fonts.bold,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: isDesktop ? fonts.tiny : fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },
  
  // Buttons
  fillBotsButton: {
    marginTop: isDesktop ? moderateScale(3) : spacing.m,
    maxWidth: isDesktop ? 400 : 500,
    width: '100%',
    alignSelf: 'center',
  },

  // Info Box
  infoBox: {
    padding: isDesktop ? moderateScale(3) : spacing.l,
    backgroundColor: theme.colors.gray100,
    borderRadius: borderRadius.medium,
    width: '100%',
    maxWidth: isDesktop ? 700 : 400,
    // Horizontal layout for info items on web
    flexDirection: isDesktop ? 'row' : 'column',
    alignItems: isDesktop ? 'center' : 'flex-start',
    justifyContent: isDesktop ? 'space-around' : 'flex-start',
  },
  infoTitle: {
    fontSize: isDesktop ? fonts.small : fonts.medium,
    fontFamily: theme.fonts.bold,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: isDesktop ? 0 : spacing.s,
    marginRight: isDesktop ? spacing.m : 0,
  },
  infoText: {
    fontSize: isDesktop ? fonts.tiny : fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    marginVertical: isDesktop ? 0 : spacing.xs,
  },

  // Ready Text
  readyText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.success,
    marginTop: spacing.m,
    textAlign: 'center',
  },
});
