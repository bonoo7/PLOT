import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Share, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { Button, Card } from '../ui';

/**
 * شاشة إعداد المضيف
 */
export const HostSetupScreen = ({ onCreateRoom, connecting }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>👑</Text>
            <Text style={styles.title}>مركز القيادة</Text>
            <Text style={styles.subtitle}>أنشئ غرفة جديدة للعبة</Text>
          </View>

          {/* Features */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>مميزات المضيف:</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🎭</Text>
                <Text style={styles.featureText}>توزيع الأدوار</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📝</Text>
                <Text style={styles.featureText}>إدارة السيناريوهات</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🗳️</Text>
                <Text style={styles.featureText}>التصويت المباشر</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🏆</Text>
                <Text style={styles.featureText}>النتائج والنقاط</Text>
              </View>
            </View>

            <Button
              title={connecting ? "جاري الإنشاء..." : "إنشاء غرفة 🚀"}
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
        </View>
      </ScrollView>
    </SafeAreaView>
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
}) => {
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>👑</Text>
            <Text style={styles.title}>غرفة الانتظار</Text>
            
            {/* Room Code */}
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCodeLabel}>رمز الغرفة</Text>
              <View style={styles.roomCodeBox}>
                <Text style={styles.roomCodeText}>{roomCode}</Text>
              </View>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareText}>مشاركة 📤</Text>
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
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>في انتظار اللاعبين...</Text>
                <Text style={styles.emptySubtext}>شارك رمز الغرفة</Text>
              </View>
            ) : (
              <View style={styles.playersList}>
                {players.map((player, index) => (
                  <View key={player.id || index} style={styles.playerItem}>
                    <Text style={styles.playerNumber}>#{index + 1}</Text>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerIcon}>🕵️</Text>
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
              title="إضافة بوتات 🤖"
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
        </View>
      </ScrollView>
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

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  emoji: {
    fontSize: moderateScale(64),
    marginBottom: spacing.m,
  },
  title: {
    fontSize: fonts.xxlarge,
    fontFamily: theme.fonts.bold,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: spacing.s,
  },
  subtitle: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 500,
    marginBottom: spacing.l,
  },

  // Section Title
  sectionTitle: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.bold,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.m,
  },

  // Features
  featuresList: {
    marginBottom: spacing.l,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: theme.colors.gray50,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.s,
  },
  featureIcon: {
    fontSize: moderateScale(28),
    marginRight: spacing.m,
  },
  featureText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },

  // Button
  button: {
    marginTop: spacing.m,
  },
  startButton: {
    maxWidth: 500,
    width: '100%',
  },

  // Room Code
  roomCodeContainer: {
    alignItems: 'center',
    marginTop: spacing.l,
  },
  roomCodeLabel: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    marginBottom: spacing.s,
  },
  roomCodeBox: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.l,
    borderRadius: borderRadius.large,
    marginBottom: spacing.m,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  roomCodeText: {
    fontSize: fonts.title,
    fontFamily: theme.fonts.bold,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: moderateScale(8),
  },
  shareButton: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    backgroundColor: theme.colors.gray100,
    borderRadius: borderRadius.medium,
  },
  shareText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },

  // Players
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
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
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: theme.colors.gray50,
    borderRadius: borderRadius.medium,
    marginBottom: spacing.s,
  },
  playerNumber: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.bold,
    fontWeight: '700',
    color: theme.colors.primary,
    width: moderateScale(40),
  },
  playerName: {
    flex: 1,
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },
  playerIcon: {
    fontSize: moderateScale(24),
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: moderateScale(48),
    marginBottom: spacing.m,
  },
  emptyText: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.bold,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },
  
  // Buttons
  fillBotsButton: {
    marginTop: spacing.m,
    maxWidth: 500,
    width: '100%',
  },

  // Info Box
  infoBox: {
    padding: spacing.l,
    backgroundColor: theme.colors.gray100,
    borderRadius: borderRadius.medium,
    width: '100%',
    maxWidth: 400,
  },
  infoTitle: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.bold,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.s,
  },
  infoText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    marginVertical: spacing.xs,
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
