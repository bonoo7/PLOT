import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, ImageBackground } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { Button, Card, TextInput } from '../ui';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * شاشة تسجيل دخول اللاعب
 */
export const LoginScreen = ({ 
  playerName, 
  setPlayerName, 
  roomCode, 
  setRoomCode, 
  onJoinRoom, 
  connecting,
  onBack
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);
  const canJoin = playerName.trim().length >= 2 && roomCode.trim().length >= 4;

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
          {/* Header */}
          <View style={styles.header}>
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
              title={connecting ? "جاري الاتصال..." : "دخول"}
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
            <Text style={styles.infoText}>
              اطلب رمز الغرفة من المضيف
            </Text>
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
 * شاشة غرفة الانتظار
 */
export const LobbyScreen = ({ players = [], roomCode }) => {
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
                <Text style={styles.emptyText}>لا يوجد لاعبون بعد</Text>
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

          {/* Waiting Message */}
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>
              في انتظار بدء المضيف للعبة...
            </Text>
          </View>
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
    paddingVertical: isDesktop ? moderateScale(2) : spacing.xl,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: getContainerPadding(),
    alignItems: 'center',
    maxWidth: isDesktop ? 900 : 800,
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
    fontSize: isDesktop ? fonts.medium : fonts.xxlarge,
    fontFamily: theme.fonts.bold,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: isDesktop ? fonts.tiny : fonts.regular,
    fontFamily: theme.fonts.main,
    color: '#E8DCC8',
    textAlign: 'center',
  },

  // Back Button Bottom
  backButtonBottom: {
    marginTop: isDesktop ? moderateScale(3) : spacing.m,
    maxWidth: isDesktop ? 400 : 450,
    width: '100%',
    alignSelf: 'center',
  },

  // Card
  card: {
    width: '100%',
    maxWidth: isDesktop ? 450 : 450,
    marginBottom: isDesktop ? moderateScale(1) : spacing.s,
    paddingVertical: isDesktop ? moderateScale(2) : undefined,
  },

  // Button
  button: {
    marginTop: isDesktop ? moderateScale(4) : spacing.l,
    maxWidth: isDesktop ? 400 : undefined,
    width: '100%',
    alignSelf: 'center',
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

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
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
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    padding: isDesktop ? moderateScale(3) : spacing.m,
    borderRadius: borderRadius.medium,
    maxWidth: isDesktop ? '100%' : 400,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  infoText: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: '#FFD700',
    flex: 1,
    textAlign: 'center',
  },

  // Waiting Box
  waitingBox: {
    padding: spacing.l,
    backgroundColor: theme.colors.info + '10',
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: theme.colors.info + '30',
    width: '100%',
    maxWidth: isDesktop ? 700 : 400,
  },
  waitingText: {
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
    color: theme.colors.info,
    textAlign: 'center',
  },
});
