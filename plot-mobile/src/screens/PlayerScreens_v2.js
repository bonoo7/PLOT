import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { Button, Card, TextInput } from '../ui';

/**
 * شاشة تسجيل دخول اللاعب
 */
export const LoginScreen = ({ 
  playerName, 
  setPlayerName, 
  roomCode, 
  setRoomCode, 
  onJoinRoom, 
  connecting 
}) => {
  const canJoin = playerName.trim().length >= 2 && roomCode.trim().length >= 4;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>🎭</Text>
            <Text style={styles.title}>الانضمام للعبة</Text>
            <Text style={styles.subtitle}>أدخل بياناتك للدخول إلى العملية</Text>
          </View>

          {/* Form Card */}
          <Card style={styles.card}>
            <TextInput
              label="الاسم الحركي"
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="مثال: الظل الخفي"
              maxLength={30}
              editable={!connecting}
            />

            <TextInput
              label="رمز الغرفة"
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              placeholder="XXXX"
              maxLength={6}
              autoCapitalize="characters"
              editable={!connecting}
            />

            <Button
              title={connecting ? "جاري الاتصال..." : "دخول 🚪"}
              onPress={onJoinRoom}
              disabled={!canJoin || connecting}
              loading={connecting}
              size="large"
              fullWidth
              style={styles.button}
            />
          </Card>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              اطلب رمز الغرفة من المضيف
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * شاشة غرفة الانتظار
 */
export const LobbyScreen = ({ players = [], roomCode }) => {
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
            <Text style={styles.emoji}>⏳</Text>
            <Text style={styles.title}>غرفة الانتظار</Text>
            <View style={styles.roomCodeBadge}>
              <Text style={styles.roomCodeText}>{roomCode}</Text>
            </View>
          </View>

          {/* Players List */}
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>
              اللاعبون المتصلون ({players.length})
            </Text>

            {players.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>لا يوجد لاعبون بعد</Text>
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

          {/* Waiting Message */}
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>
              في انتظار بدء المضيف للعبة...
            </Text>
          </View>
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
    maxWidth: 450,
    marginBottom: spacing.l,
  },

  // Button
  button: {
    marginTop: spacing.l,
  },

  // Room Code Badge
  roomCodeBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: borderRadius.medium,
    marginTop: spacing.m,
  },
  roomCodeText: {
    fontSize: fonts.xlarge,
    fontFamily: theme.fonts.bold,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: moderateScale(4),
  },

  // Section Title
  sectionTitle: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.bold,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.m,
  },

  // Players List
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
    fontSize: fonts.regular,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    maxWidth: 400,
  },
  infoIcon: {
    fontSize: moderateScale(20),
    marginRight: spacing.m,
  },
  infoText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.textSecondary,
    flex: 1,
  },

  // Waiting Box
  waitingBox: {
    padding: spacing.l,
    backgroundColor: theme.colors.info + '10',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.info + '30',
    width: '100%',
    maxWidth: 400,
  },
  waitingText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.info,
    textAlign: 'center',
  },
});
