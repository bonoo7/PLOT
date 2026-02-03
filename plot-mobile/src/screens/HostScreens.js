import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, shadows, getContainerPadding } from '../styles/responsive';
import { Button, Card, Badge, ListItem, Divider } from '../ui';

/**
 * شاشة إعداد المضيف
 */
export const HostSetupScreen = ({ onCreateRoom, connecting }) => {
  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Card variant="paper" style={styles.card}>
          <Text style={styles.title}>👑 مركز القيادة</Text>
          <Text style={styles.subtitle}>
            أنت المضيف - قم بإنشاء غرفة جديدة للعبة
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎭</Text>
              <Text style={styles.featureText}>توزيع الأدوار التلقائي</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📝</Text>
              <Text style={styles.featureText}>إدارة السيناريوهات</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🗳️</Text>
              <Text style={styles.featureText}>نظام التصويت المباشر</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={styles.featureText}>تتبع النقاط والنتائج</Text>
            </View>
          </View>

          <Button
            title={connecting ? "جاري الإنشاء..." : "إنشاء غرفة جديدة 🚀"}
            onPress={onCreateRoom}
            disabled={connecting}
            loading={connecting}
            size="large"
            fullWidth
            style={styles.createButton}
          />

          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>المتطلبات:</Text>
            <Text style={styles.requirementsText}>• 4-8 لاعبين</Text>
            <Text style={styles.requirementsText}>• اتصال إنترنت مستقر</Text>
            <Text style={styles.requirementsText}>• مدة اللعبة: 30-45 دقيقة</Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

/**
 * شاشة غرفة انتظار المضيف
 */
export const HostLobbyScreen = ({ 
  roomCode, 
  players = [], 
  onStartGame, 
  onShareCode 
}) => {
  const canStart = players.length >= 4 && players.length <= 8;
  const needsMorePlayers = players.length < 4;

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `انضم إلى لعبة PLOT! 🕵️\n\nرمز الغرفة: ${roomCode}\n\nاستخدم التطبيق للانضمام`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Card variant="paper" style={styles.card}>
          {/* رأس الصفحة */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>غرفة العمليات</Text>
            <Badge text={`👑 مضيف`} variant="warning" size="medium" />
          </View>

          {/* رمز الغرفة */}
          <View style={styles.roomCodeContainer}>
            <Text style={styles.roomCodeLabel}>رمز الغرفة:</Text>
            <View style={styles.roomCodeBox}>
              <Text style={styles.roomCodeText}>{roomCode}</Text>
            </View>
            <Button
              title="مشاركة 📤"
              onPress={onShareCode || handleShareCode}
              variant="secondary"
              size="small"
              style={styles.shareButton}
            />
          </View>

          <Divider />

          {/* قائمة اللاعبين */}
          <View style={styles.playersSection}>
            <Text style={styles.sectionTitle}>
              العملاء المتصلون ({players.length}/8)
            </Text>

            {needsMorePlayers && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ يلزم 4 لاعبين على الأقل لبدء اللعبة
                </Text>
              </View>
            )}

            {players.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>
                  في انتظار انضمام اللاعبين...
                </Text>
                <Text style={styles.emptySubtext}>
                  شارك رمز الغرفة مع الآخرين
                </Text>
              </View>
            ) : (
              <View style={styles.playersList}>
                {players.map((player, index) => (
                  <ListItem
                    key={player.id || index}
                    title={player.name}
                    subtitle={`متصل منذ ${getTimeAgo(player.joinedAt)}`}
                    leftIcon={<Text style={styles.playerNumber}>#{index + 1}</Text>}
                    rightIcon={<Text style={styles.playerIcon}>🕵️</Text>}
                    style={styles.playerItem}
                  />
                ))}
              </View>
            )}
          </View>

          {/* زر بدء اللعبة */}
          <Button
            title={needsMorePlayers 
              ? `يلزم ${4 - players.length} لاعبين آخرين` 
              : "بدء العملية 🚀"}
            onPress={onStartGame}
            disabled={!canStart}
            size="large"
            variant="success"
            fullWidth
            style={styles.startButton}
          />

          {canStart && (
            <Text style={styles.readyText}>
              ✅ جاهز للبدء! اضغط للانطلاق
            </Text>
          )}
        </Card>
      </View>
    </ScrollView>
  );
};

// دالة مساعدة لحساب الوقت
const getTimeAgo = (timestamp) => {
  if (!timestamp) return 'الآن';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'الآن';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  return `${hours} س`;
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.l,
  },
  container: {
    flex: 1,
    padding: getContainerPadding(),
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 600,
  },

  // العناوين
  title: {
    fontSize: fonts.xxlarge,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.l,
  },

  // الميزات
  featuresContainer: {
    width: '100%',
    marginVertical: spacing.l,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
    padding: spacing.m,
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.medium,
  },
  featureIcon: {
    fontSize: moderateScale(32),
    marginRight: spacing.m,
  },
  featureText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    flex: 1,
  },

  // الأزرار
  createButton: {
    marginTop: spacing.l,
  },
  startButton: {
    marginTop: spacing.xl,
  },

  // المتطلبات
  requirementsContainer: {
    marginTop: spacing.l,
    padding: spacing.m,
    backgroundColor: theme.colors.accentYellow + '15',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.accentYellow + '40',
  },
  requirementsTitle: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.s,
  },
  requirementsText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    marginVertical: spacing.xs,
  },

  // رمز الغرفة
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  roomCodeContainer: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  roomCodeLabel: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
    marginBottom: spacing.s,
  },
  roomCodeBox: {
    backgroundColor: theme.colors.accentRed,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.l,
    borderRadius: borderRadius.large,
    ...shadows.large,
    marginBottom: spacing.m,
  },
  roomCodeText: {
    fontSize: fonts.title,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.white,
    letterSpacing: moderateScale(8),
  },
  shareButton: {
    minWidth: moderateScale(120),
  },

  // اللاعبون
  playersSection: {
    width: '100%',
    marginTop: spacing.l,
  },
  sectionTitle: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.m,
  },
  warningBox: {
    backgroundColor: theme.colors.warning + '20',
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.warning,
    marginBottom: spacing.m,
  },
  warningText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    textAlign: 'center',
  },
  playersList: {
    width: '100%',
  },
  playerItem: {
    marginBottom: spacing.s,
  },
  playerNumber: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.accentRed,
    minWidth: moderateScale(30),
  },
  playerIcon: {
    fontSize: moderateScale(24),
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: moderateScale(64),
    marginBottom: spacing.m,
  },
  emptyText: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  readyText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.success,
    textAlign: 'center',
    marginTop: spacing.m,
  },
});
