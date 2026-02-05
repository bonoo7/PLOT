import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, shadows, getContainerPadding } from '../styles/responsive';
import { Button, Card, TextInput, Badge, ListItem } from '../ui';

/**
 * شاشة تسجيل دخول اللاعب
 */
export const LoginScreen = ({ playerName, setPlayerName, roomCode, setRoomCode, onJoinRoom, connecting, onBack }) => {
  const canJoin = playerName.trim().length >= 2 && roomCode.trim().length >= 4;

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        {/* Back Button */}
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>رجوع</Text>
          </TouchableOpacity>
        )}
        
        <Card variant="paper" style={styles.card}>
          <Text style={styles.title}>🎭 الانضمام للعبة</Text>
          <Text style={styles.subtitle}>أدخل بياناتك للانضمام</Text>

          <View style={styles.formContainer}>
            <TextInput
              label="الاسم الحركي (alias) *"
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="مثال: الظل الخفي"
              maxLength={30}
              editable={!connecting}
            />

            <TextInput
              label="رمز الغرفة *"
              value={roomCode}
              onChangeText={setRoomCode}
              placeholder="XXXX"
              maxLength={6}
              autoCapitalize="characters"
              editable={!connecting}
            />

            <Button
              title={connecting ? "جاري الاتصال..." : "دخول العملية 🚪"}
              onPress={onJoinRoom}
              disabled={!canJoin || connecting}
              loading={connecting}
              size="large"
              fullWidth
              style={styles.joinButton}
            />
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              💡 اطلب رمز الغرفة من المضيف
            </Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

/**
 * شاشة غرفة انتظار اللاعب
 */
export const LobbyScreen = ({ players = [], roomCode }) => {
  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Card variant="paper" style={styles.card}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>غرفة العمليات</Text>
            <Badge text={roomCode} variant="danger" size="large" />
          </View>

          <Text style={styles.subtitle}>
            في انتظار بدء المضيف للعملية...
          </Text>

          <View style={styles.playersContainer}>
            <Text style={styles.sectionTitle}>
              العملاء المتصلون ({players.length})
            </Text>

            {players.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyText}>لا يوجد عملاء بعد</Text>
              </View>
            ) : (
              players.map((player, index) => (
                <ListItem
                  key={player.id || index}
                  title={player.name}
                  leftIcon={<Text style={styles.playerIcon}>🕵️</Text>}
                  rightIcon={
                    player.isReady && (
                      <Badge text="✓" variant="success" size="small" />
                    )
                  }
                  style={styles.playerItem}
                />
              ))
            )}
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.accentRed} />
            <Text style={styles.loadingText}>
              جاري تجهيز الملفات السرية...
            </Text>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
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
    maxWidth: 500,
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

  // زر الرجوع
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: spacing.m,
    marginBottom: spacing.l,
  },
  backIcon: {
    fontSize: moderateScale(24),
    marginRight: spacing.s,
    color: theme.colors.primary,
  },
  backText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },

  // النموذج
  formContainer: {
    width: '100%',
    marginTop: spacing.m,
  },
  joinButton: {
    marginTop: spacing.l,
  },
  helpContainer: {
    marginTop: spacing.l,
    padding: spacing.m,
    backgroundColor: theme.colors.accentYellow + '10',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.accentYellow + '40',
  },
  helpText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
    textAlign: 'center',
  },

  // غرفة الانتظار
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  playersContainer: {
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
  playerItem: {
    marginBottom: spacing.s,
  },
  playerIcon: {
    fontSize: moderateScale(24),
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: moderateScale(48),
    marginBottom: spacing.m,
  },
  emptyText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.l,
  },
  loadingText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.textLight,
    marginTop: spacing.m,
    textAlign: 'center',
  },
});
