import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/useGameStore';
import { useSocket } from '../hooks/useGameSocket';
import {
  MinimalLayout,
  MinimalHeader,
  MinimalCard,
  MinimalButton,
  MinimalInput
} from '../components/minimal';
import { PlayerBadge } from '../components/minimal/PlayerBadge';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * LoginScreen - Minimalist V3
 */
export const LoginScreen = () => {
  const navigation = useNavigation();
  const playerName = useGameStore((state) => state.playerName);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const roomCode = useGameStore((state) => state.roomCode);
  const setRoomCode = useGameStore((state) => state.setRoomCode);
  const connecting = useGameStore((state) => state.connecting);
  const setConnecting = useGameStore((state) => state.setConnecting);
  const { socket } = useSocket();

  const canJoin = playerName.trim().length >= 2 && roomCode.trim().length >= 4;

  const handleJoinRoom = () => {
    if (socket) {
      setConnecting(true);
      socket.emit('joinRoom', { roomCode, playerName, isHost: false });
    }
  };

  return (
    <MinimalLayout>
      <View style={styles.centerBox}>
        <MinimalHeader
          title="الانضمام"
          subtitle="أدخل بيانات الدخول"
        />

        <MinimalCard style={styles.formCard}>
          <MinimalInput
            label="الاسم الحركي"
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="مثال: الظل"
            maxLength={30}
            editable={!connecting}
            style={styles.input}
          />

          <MinimalInput
            label="رمز الغرفة"
            value={roomCode}
            onChangeText={(text) => setRoomCode(text.toUpperCase())}
            placeholder="XXXX"
            maxLength={6}
            autoCapitalize="characters"
            editable={!connecting}
            style={styles.input}
          />

          <MinimalButton
            title={connecting ? "جاري الاتصال..." : "دخول"}
            onPress={handleJoinRoom}
            disabled={!canJoin || connecting}
            loading={connecting}
            size="medium"
            style={styles.actionButton}
          />
        </MinimalCard>

        <MinimalButton
          title="رجوع"
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="small"
          style={styles.backButton}
          textStyle={styles.backButtonText}
        />
      </View>
    </MinimalLayout>
  );
};

/**
 * LobbyScreen - Minimalist V3
 */
export const LobbyScreen = () => {
  const { isDesktop } = useResponsiveLayout();
  const players = useGameStore((state) => state.players);
  const roomCode = useGameStore((state) => state.roomCode);

  return (
    <MinimalLayout>
      <View style={[styles.lobbyContainer, { maxWidth: isDesktop ? 900 : 500 }]}>
        <MinimalHeader
          title="غرفة الانتظار"
          subtitle="في انتظار بدء المهمة"
        />

        {/* Room Code Badge */}
        <View style={styles.roomBadge}>
          <Text style={styles.roomBadgeLabel}>رمز الغرفة</Text>
          <Text style={styles.roomBadgeCode}>{roomCode}</Text>
        </View>

        {/* Players Grid */}
        <MinimalCard flex style={styles.playersCard}>
          <Text style={styles.sectionTitle}>اللاعبون ({players.length})</Text>

          {players.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>لا يوجد لاعبون...</Text>
            </View>
          ) : (
            <View style={[styles.playersGrid, { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.m, justifyContent: 'center' }]}>
              {players.map((player, index) => (
                <View key={player.id || index} style={{ margin: spacing.xs }}>
                  <PlayerBadge name={player.name} size="medium" />
                </View>
              ))}
            </View>
          )}
        </MinimalCard>

        <View style={styles.statusBox}>
          <Text style={styles.statusText}>⚠️ بانتظار إشارة المضيف...</Text>
        </View>
      </View>
    </MinimalLayout>
  );
};

const styles = StyleSheet.create({
  centerBox: {
    width: '100%',
    maxWidth: 450,
    alignItems: 'center',
  },
  formCard: {
    gap: spacing.m,
  },
  input: {
    backgroundColor: '#FFF',
  },
  actionButton: {
    marginTop: spacing.s,
  },
  backButton: {
    marginTop: spacing.m,
  },
  backButtonText: {
    color: '#E8DCC8',
    opacity: 0.8,
  },

  // Lobby Styles
  lobbyContainer: {
    flex: 1,
    width: '100%',
    gap: spacing.m,
    paddingVertical: spacing.m,
  },
  roomBadge: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.text,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: '#000',
    minWidth: 150,
  },
  roomBadgeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fonts.tiny,
    textTransform: 'uppercase',
  },
  roomBadgeCode: {
    color: '#FFF',
    fontSize: fonts.xlarge,
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  playersCard: {
    backgroundColor: 'rgba(235, 225, 210, 0.95)',
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: fonts.medium,
    color: theme.colors.text,
    marginBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: spacing.xs,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  playerItem: {
    width: '48%', // 2 columns
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: spacing.s,
    borderRadius: borderRadius.small,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerNumber: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginRight: spacing.s,
    width: 24,
  },
  playerName: {
    flex: 1,
    fontFamily: theme.fonts.main,
    color: theme.colors.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.l,
  },
  emptyText: {
    color: theme.colors.textSecondary,
  },
  statusBox: {
    padding: spacing.m,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFD700',
    fontFamily: theme.fonts.main,
  }
});
