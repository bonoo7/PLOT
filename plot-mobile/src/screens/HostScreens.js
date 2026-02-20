import React from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import { 
  MinimalLayout, 
  MinimalHeader, 
  MinimalCard, 
  MinimalButton 
} from '../components/minimal';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * HostSetupScreen - Minimalist V3
 */
export const HostSetupScreen = ({ onCreateRoom, connecting, onBack }) => {
  return (
    <MinimalLayout>
      <View style={styles.centerBox}>
        <MinimalHeader title="مركز القيادة" subtitle="إعداد غرفة جديدة" />
        
        <MinimalCard style={styles.setupCard}>
          <Text style={styles.infoTitle}>معلومات المهمة:</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>• اللاعبون: 4 - 8</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoText}>• الوقت: 30 - 45 دقيقة</Text>
          </View>
          
          <View style={styles.spacer} />

          <MinimalButton
            title={connecting ? "جاري الإنشاء..." : "إنشاء غرفة"}
            onPress={onCreateRoom}
            disabled={connecting}
            loading={connecting}
            size="medium"
          />
        </MinimalCard>

        {onBack && (
          <MinimalButton
            title="رجوع"
            onPress={onBack}
            variant="ghost"
            size="small"
            style={styles.backButton}
            textStyle={styles.backButtonText}
          />
        )}
      </View>
    </MinimalLayout>
  );
};

/**
 * HostLobbyScreen - Minimalist V3
 */
export const HostLobbyScreen = ({ 
  roomCode, 
  players = [], 
  onStartGame,
  onFillBots,
  onBack,
  gameMode = 'CLASSIC',
  onUpdateSettings
}) => {
  const { isDesktop } = useResponsiveLayout();
  const canStart = players.length >= 4 && players.length <= 8;
  const needsMore = 4 - players.length;

  // Essential Roles Order (matching server/roles.js logic)
  const ROLE_ORDER = [
    { code: 'CULPRIT', name: 'الجاني 🎭' },
    { code: 'DETECTIVE', name: 'المحقق 🕵️‍♂️' },
    { code: 'WITNESS', name: 'الشاهد 👁️' },
    { code: 'MASTERMIND', name: 'العقل المدبر 🧠' },
    { code: 'SEER', name: 'العرّاف 🔮' },
    { code: 'SABOTEUR', name: 'المخرب 🧨' },
    { code: 'MINISTER', name: 'الوزير 📜' },
    { code: 'BENEFICIARY', name: 'المستفيد 💰' }
  ];

  // Calculate next role
  const nextRoleIndex = players.length;
  const nextRole = nextRoleIndex < ROLE_ORDER.length ? ROLE_ORDER[nextRoleIndex] : { name: 'مواطن 👤' };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `انضم إلى لعبة PLOT! 🕵️\nرمز الغرفة: ${roomCode}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <MinimalLayout>
      <View style={[styles.lobbyContainer, { maxWidth: isDesktop ? 1000 : 600 }]}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <MinimalHeader title="غرفة العمليات" />
          
          <View style={styles.codeSection}>
             <View style={styles.codeBadge}>
                <Text style={styles.codeLabel}>CODE</Text>
                <Text style={styles.codeText}>{roomCode}</Text>
             </View>
             <MinimalButton 
               title="مشاركة" 
               onPress={handleShare} 
               variant="secondary" 
               size="small"
               style={styles.shareBtn} 
             />
          </View>
        </View>

        {/* Game Mode Selector */}
        <MinimalCard style={styles.settingsCard}>
          <View style={styles.settingsHeader}>
            <Text style={styles.sectionTitle}>نمط اللعب:</Text>
            <Text style={styles.modeDescription}>
              {gameMode === 'CLASSIC' ? 'كتابة سيناريو كامل' : 'إكمال الفراغات بكلمات'}
            </Text>
          </View>
          <View style={styles.togglesRow}>
             <MinimalButton 
               title="كتابة كاملة ✍️" 
               onPress={() => onUpdateSettings && onUpdateSettings({ gameMode: 'CLASSIC' })}
               variant={gameMode === 'CLASSIC' ? 'primary' : 'outline'}
               size="small"
               style={styles.modeBtn}
             />
             <MinimalButton 
               title="إكمال الفراغ 🧩" 
               onPress={() => onUpdateSettings && onUpdateSettings({ gameMode: 'BLITZ' })}
               variant={gameMode === 'BLITZ' ? 'primary' : 'outline'}
               size="small"
               style={styles.modeBtn}
             />
          </View>
        </MinimalCard>

        {/* Players Area */}
        <MinimalCard flex style={styles.playersCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>العملاء المتصلون ({players.length}/8)</Text>
            {!canStart && needsMore > 0 && (
              <View style={styles.warningBadge}>
                <Text style={styles.warningText}>{needsMore} متبقي</Text>
              </View>
            )}
          </View>

          {players.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>في انتظار انضمام العملاء...</Text>
            </View>
          ) : (
            <View style={styles.playersGrid}>
              {players.map((player, index) => (
                <View key={player.id || index} style={styles.playerItem}>
                  <Text style={styles.playerNumber}>#{index + 1}</Text>
                  <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                </View>
              ))}
            </View>
          )}
        </MinimalCard>

        {/* Actions Footer */}
        <View style={styles.actionsFooter}>
          <View style={styles.mainActions}>
             {players.length < 8 && (
                <MinimalButton 
                  title={`+ بوت (${nextRole.name})`} 
                  onPress={onFillBots} 
                  variant="secondary"
                  size="medium"
                  style={styles.botBtn}
                />
             )}
             <MinimalButton
               title={canStart ? "بدء المهمة 🚀" : "بانتظار اكتمال العدد"}
               onPress={onStartGame}
               disabled={!canStart}
               variant={canStart ? "primary" : "outline"}
               size="medium"
               style={styles.startBtn}
             />
          </View>
          
          <MinimalButton
            title="إغلاق الغرفة"
            onPress={onBack}
            variant="ghost"
            size="small"
            textStyle={styles.closeBtnText}
          />
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
  setupCard: {
    padding: spacing.l,
  },
  infoTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: fonts.medium,
    color: theme.colors.text,
    marginBottom: spacing.m,
    textAlign: 'right', // RTL
  },
  infoRow: {
    marginBottom: spacing.s,
    direction: 'rtl',
  },
  infoText: {
    fontFamily: theme.fonts.main,
    fontSize: fonts.small,
    color: theme.colors.text,
    textAlign: 'right', // RTL
  },
  spacer: {
    height: spacing.l,
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
    paddingVertical: spacing.m,
    gap: spacing.m,
  },
  headerSection: {
    alignItems: 'center',
  },
  codeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginTop: -spacing.s, // Pull up closer to header
  },
  codeBadge: {
    backgroundColor: theme.colors.text, // Dark Charcoal
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.l,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    minWidth: 140,
  },
  codeLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 'bold',
  },
  codeText: {
    fontSize: fonts.large,
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 2,
  },
  shareBtn: {
    height: 44,
  },
  
  // Settings
  settingsCard: {
    padding: spacing.m,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
    direction: 'rtl',
  },
  modeDescription: {
    fontSize: fonts.small,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.main,
  },
  togglesRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  modeBtn: {
    flex: 1,
  },

  // Players Area
  playersCard: {
    backgroundColor: 'rgba(235, 225, 210, 0.95)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: spacing.s,
    direction: 'rtl',
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: fonts.medium,
    color: theme.colors.text,
    textAlign: 'right',
  },
  warningBadge: {
    backgroundColor: '#FFE5B4',
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: '#FFA500',
  },
  warningText: {
    fontSize: fonts.tiny,
    color: '#D2691E',
    fontWeight: 'bold',
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  playerItem: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.6)',
    padding: spacing.s,
    borderRadius: borderRadius.small,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    padding: spacing.xl,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Footer
  actionsFooter: {
    gap: spacing.s,
  },
  mainActions: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  botBtn: {
    flex: 1,
  },
  startBtn: {
    flex: 2,
  },
  closeBtnText: {
    color: '#E8DCC8',
    fontSize: fonts.tiny,
    opacity: 0.6,
  }
});
