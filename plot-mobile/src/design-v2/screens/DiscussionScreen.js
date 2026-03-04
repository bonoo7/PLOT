/**
 * design-v2/screens/DiscussionScreen.js
 * Discussion phase — player + host views
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket, ROUTES } from '../../hooks/useGameSocket';
import { useNavigation } from '@react-navigation/native';
import { DossierLayout, StampButton, FileBadge, CaseHeader, ClassifiedBanner, DossierCard } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';
import { InvestigationNote } from '../../components/InvestigationNote';

export const DiscussionScreen = ({ isHost = false }) => {
  const navigation    = useNavigation();
  const { socket }    = useSocket();
  const [showScenarios, setShowScenarios] = useState(true);
  const themeMode     = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);

  const roomCode            = useGameStore(s => s.roomCode);
  const roleData            = useGameStore(s => s.roleData);
  const players             = useGameStore(s => s.players) || [];
  const speakingPlayerId    = useGameStore(s => s.speakingPlayerId);
  const scenarios           = useGameStore(s => s.revealedScenarios) || [];
  const hint                = useGameStore(s => s.lastHint);
  const pendingAbilityResult = useGameStore(s => s.pendingAbilityResult);
  const abilityResultSeen   = useGameStore(s => s.abilityResultSeen);
  const setAbilityResultSeen = useGameStore(s => s.setAbilityResultSeen);
  const myName              = useGameStore(s => s.playerName);

  const speakingPlayer = players.find(p => p.id === speakingPlayerId);
  const emoji = roleData ? { CULPRIT:'🎭',DETECTIVE:'🕵️',WITNESS:'👁️',SABOTEUR:'🧨',MINISTER:'📜',BENEFICIARY:'💰',SEER:'🔮',MASTERMIND:'🧠' }[roleData.role] || '👤' : '🎮';

  const handleSelectSpeaker = (playerId) => {
    if (!socket || !roomCode) return;
    socket.emit('setSpeaker', { roomCode, playerId });
  };
  const handleEndDiscussion = () => {
    if (!socket || !roomCode) return;
    socket.emit('endDiscussion', { roomCode });
  };

  return (
    <DossierLayout
      top={
        <CaseHeader
          mode={isHost ? 'host' : 'player'}
          roomCode={roomCode}
          roleName={isHost ? 'النقاش' : roleData?.roleName}
          roleEmoji={emoji}
          playerId={isHost ? null : myName}
          phase="النقاش"
        />
      }
      bottom={
        isHost
          ? <StampButton title="إنهاء النقاش →" onPress={handleEndDiscussion} variant="primary" size="sm" style={{ flex: 1 }} />
          : null
      }
    >
      {/* Ability result — full InvestigationNote modal */}
      <InvestigationNote
        visible={!!(pendingAbilityResult && !abilityResultSeen)}
        type={pendingAbilityResult?.type}
        targetName={pendingAbilityResult?.targetName}
        result={pendingAbilityResult?.result}
        isSabotaged={pendingAbilityResult?.isSabotaged}
        message={pendingAbilityResult?.message}
        content={pendingAbilityResult?.content}
        keywords={pendingAbilityResult?.keywords}
        onDismiss={() => setAbilityResultSeen && setAbilityResultSeen(true)}
      />

      {/* Hint */}
      {hint && <ClassifiedBanner label="تلميح" variant="info">{hint}</ClassifiedBanner>}

      <View style={styles.body}>
        {/* Speaker card */}
        <View style={[styles.speakerBox, { borderColor: speakingPlayer ? c.accent : c.border, backgroundColor: c.surface }]}>
          {speakingPlayer ? (
            <View style={styles.speakerActive}>
              <Text style={styles.micIcon}>🎤</Text>
              <FileBadge name={speakingPlayer.name} size="lg" />
              {/* sound wave bars */}
              <View style={styles.waveRow}>
                {[20,35,25,42,18,36,28].map((h, i) => (
                  <View key={i} style={[styles.waveBar, { height: h, backgroundColor: c.accent }]} />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.speakerEmpty}>
              <Text style={styles.muteIcon}>🔇</Text>
              <Text style={[styles.muteText, { color: c.textMuted }]}>
                {isHost ? 'اختر لاعباً للتحدث' : 'بانتظار المضيف…'}
              </Text>
            </View>
          )}
        </View>

        {/* Host: player buttons OR Player: scenarios */}
        {isHost ? (
          <View style={[styles.playersPanel, { borderColor: c.border }]}>
            <Text style={[styles.panelLabel, { color: c.textMuted }]}>المتحدثون</Text>
            <ScrollView contentContainerStyle={styles.playerGrid} showsVerticalScrollIndicator={false}>
              {players.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.playerBtn, {
                    borderColor: speakingPlayerId === p.id ? c.accent : c.border,
                    backgroundColor: speakingPlayerId === p.id ? c.accent + '22' : 'transparent',
                  }]}
                  onPress={() => handleSelectSpeaker(p.id === speakingPlayerId ? null : p.id)}
                >
                  <FileBadge name={p.name} size="sm" />
                  {speakingPlayerId === p.id && <Text style={{ fontSize: 14 }}>🎤</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          scenarios.length > 0 && (
            <View style={[styles.playersPanel, { borderColor: c.border, flex: 1 }]}>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setShowScenarios(!showScenarios)}
              >
                <Text style={[styles.panelLabel, { color: c.textMuted }]}>
                  السيناريوهات ({scenarios.length}) {showScenarios ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {showScenarios && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {scenarios.map((s, i) => (
                    <View key={i} style={[styles.scenarioRow, { borderColor: c.border }]}>
                      <FileBadge name={s.author || '؟'} size="sm" />
                      <Text style={[styles.scenarioTxt, { color: c.text, flex: 1 }]}>{s.text || s.answer || '—'}</Text>
                      {s.voteCount > 0 && <Text style={[styles.votes, { color: c.gold }]}>⭐{s.voteCount}</Text>}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )
        )}
      </View>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  body: { flex: 1, gap: sp.s },
  speakerBox: {
    borderWidth: 1.5, borderRadius: radius.m,
    padding: sp.m, alignItems: 'center', minHeight: 100,
  },
  speakerActive: { alignItems: 'center', gap: sp.xs },
  micIcon: { fontSize: 28 },
  waveRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 48 },
  waveBar: { width: 4, borderRadius: 2 },
  speakerEmpty: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: sp.xs },
  muteIcon: { fontSize: 28 },
  muteText: { fontSize: fontSize.body, fontFamily: fontFamily.mono, fontStyle: 'italic' },

  playersPanel: {
    flex: 1, borderWidth: 1, borderRadius: radius.m, padding: sp.m, gap: sp.xs,
  },
  panelLabel: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '700' },
  playerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.xs },
  playerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: sp.xs,
    borderWidth: 1, borderRadius: radius.m, padding: sp.xs,
  },

  toggleRow: { paddingBottom: sp.xs },
  scenarioRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: sp.s,
    borderBottomWidth: 1, paddingVertical: sp.s,
  },
  scenarioTxt: { fontSize: fontSize.body, fontFamily: fontFamily.mono, lineHeight: fontSize.body * 1.4, textAlign: 'right' },
  votes: { fontSize: fontSize.small, fontFamily: fontFamily.mono, fontWeight: '700' },
});
