import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { InvestigationNote } from '../../components/InvestigationNote';
import { PlayerBadge, ProgressBar, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalLayout } from '../components';
import { formatTime, getRoleMeta, sp, useLayout, fontFamily, fontSize, getHighlightedParts } from '../tokens';

const renderBlitzText = (text, template, baseStyle, highlightStyle) => {
  if (!template || !template.includes('_____')) {
    return <Text style={baseStyle}>{text}</Text>;
  }
  const parts = getHighlightedParts(text, template);
  return (
    <Text style={baseStyle}>
      {parts.map((p, idx) => (
        <Text key={idx} style={p.filled ? highlightStyle : undefined}>
          {p.text}
        </Text>
      ))}
    </Text>
  );
};


export const DiscussionScreen = ({ isHost = false }) => {
  const { socket } = useSocket();
  const [showHint, setShowHint] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const [showPlayerHint, setShowPlayerHint] = useState(false);
  const [showPlayerScenarios, setShowPlayerScenarios] = useState(false);
  const roomCode = useGameStore((s) => s.roomCode);
  const roleData = useGameStore((s) => s.roleData);
  const players = useGameStore((s) => s.players) || [];
  const speakingPlayerId = useGameStore((s) => s.speakingPlayerId);
  const revealedScenarios = useGameStore((s) => s.revealedScenarios) || [];
  const hint = useGameStore((s) => s.lastHint);
  const pendingAbilityResult = useGameStore((s) => s.pendingAbilityResult);
  const abilityResultSeen = useGameStore((s) => s.abilityResultSeen);
  const setAbilityResultSeen = useGameStore((s) => s.setAbilityResultSeen);
  const playerName = useGameStore((s) => s.playerName);
  const timeLeft = useGameStore((s) => s.timeLeft) || 0;
  const { isLandscape, isDesktop } = useLayout();
  const wide = isLandscape || isDesktop;
  const meta = getRoleMeta(roleData?.role);
  const speakingPlayer = players.find((player) => player.id === speakingPlayerId);

  // Animated sound wave bars for active speaker
  const barHeights = useRef([
    new Animated.Value(6), new Animated.Value(14), new Animated.Value(10),
    new Animated.Value(18), new Animated.Value(8),
  ]).current;
  const barMaxes = [12, 22, 18, 28, 14];
  const barMins  = [4,   6,  5,  8,  4];
  const animLoops = useRef([]);

  useEffect(() => {
    if (speakingPlayerId) {
      animLoops.current.forEach((l) => l.stop());
      animLoops.current = barHeights.map((val, i) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: barMaxes[i], duration: 350, delay: i * 80, useNativeDriver: false }),
            Animated.timing(val, { toValue: barMins[i],  duration: 350,                useNativeDriver: false }),
          ])
        );
        loop.start();
        return loop;
      });
    } else {
      animLoops.current.forEach((l) => l.stop());
      [6, 14, 10, 18, 8].forEach((v, i) =>
        Animated.timing(barHeights[i], { toValue: v, duration: 200, useNativeDriver: false }).start()
      );
    }
    return () => { animLoops.current.forEach((l) => l.stop()); };
  }, [speakingPlayerId]);

  return (
    <TerminalLayout
      top={<TerminalHeader title={isHost ? 'DISCUSSION CONTROL' : 'DISCUSSION FEED'} subtitle={playerName} roomCode={roomCode} roleName={isHost ? '[HOST]' : meta.bracket} roleEmoji={isHost ? '🎙️' : meta.emoji} />}
      bottom={isHost ? <TerminalButton title="إنهاء النقاش" onPress={() => socket?.emit('endDiscussion', { roomCode })} size="sm" style={{ flex: 1 }} /> : null}
    >
      <InvestigationNote
        visible={!!(pendingAbilityResult && !abilityResultSeen)}
        type={pendingAbilityResult?.type}
        targetName={pendingAbilityResult?.targetName}
        result={pendingAbilityResult?.result}
        isSabotaged={pendingAbilityResult?.isSabotaged}
        message={pendingAbilityResult?.message}
        content={pendingAbilityResult?.content}
        keywords={pendingAbilityResult?.keywords}
        onDismiss={() => setAbilityResultSeen?.(true)}
      />

      <View style={styles.body}>
        {!isHost && hint && showPlayerHint ? <TerminalBanner variant="info" label="HINT">{hint}</TerminalBanner> : null}

        <TerminalCard
          title="> ACTIVE SPEAKER"
          tone={speakingPlayer ? 'info' : 'warning'}
          bodyStyle={isHost ? styles.hostActiveSpeakerBody : null}
        >
          {speakingPlayer ? (
            <View style={styles.speakerRow}>
              <PlayerBadge
                name={speakingPlayer.name}
                index={(players.findIndex((p) => p.id === speakingPlayer.id) || 0) + 1}
                style={[{ flex: 1 }, isHost && styles.hostActiveSpeakerBadge]}
                size={isHost ? 'large' : 'default'}
              />
              <View style={[styles.soundWave, isHost && styles.hostSoundWave]}>
                {barHeights.map((height, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.soundBar,
                      isHost && styles.hostSoundBar,
                      { height: Animated.multiply(height, isHost ? 1.5 : 1) }
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : (
            <Text style={[styles.emptyText, isHost && styles.hostEmptyText]}>
              {isHost ? 'اختر لاعباً لبدء الحديث.' : 'بانتظار أن يحدد المضيف المتحدث.'}
            </Text>
          )}
        </TerminalCard>

        {isHost && (
          <View style={styles.toggleRow}>
            <TerminalButton
              title={showHint ? "[- إخفاء التلميح]" : "[+ إظهار التلميح]"}
              onPress={() => setShowHint(!showHint)}
              size="sm"
              variant={showHint ? "primary" : "ghost"}
              style={{ flex: 1 }}
            />
            <TerminalButton
              title={showScenarios ? "[- إخفاء الكتابات]" : "[+ إظهار الكتابات]"}
              onPress={() => setShowScenarios(!showScenarios)}
              size="sm"
              variant={showScenarios ? "primary" : "ghost"}
              style={{ flex: 1 }}
            />
          </View>
        )}

        {!isHost && (
          <View style={styles.toggleRow}>
            {hint ? (
              <TerminalButton
                title={showPlayerHint ? "[- إخفاء التلميح]" : "[+ إظهار التلميح]"}
                onPress={() => setShowPlayerHint(!showPlayerHint)}
                size="sm"
                variant={showPlayerHint ? "primary" : "ghost"}
                style={{ flex: 1 }}
              />
            ) : null}
            <TerminalButton
              title={showPlayerScenarios ? "[- إخفاء كتابات اللاعبين]" : "[+ إظهار كتابات اللاعبين]"}
              onPress={() => setShowPlayerScenarios(!showPlayerScenarios)}
              size="sm"
              variant={showPlayerScenarios ? "primary" : "ghost"}
              style={{ flex: 1 }}
            />
          </View>
        )}

        {isHost && (showHint || showScenarios) && (
          <View style={styles.sideBySideRow}>
            {showHint && (
              <TerminalCard
                title="💡 HINT"
                tone="warning"
                style={[styles.halfCard, !showScenarios && { width: '100%' }]}
                bodyStyle={{ padding: sp.s }}
              >
                <Text style={styles.miniHintText}>{hint || 'لا يوجد تلميح بعد'}</Text>
              </TerminalCard>
            )}
            {showScenarios && (
              <TerminalCard
                title="📝 SCENARIOS"
                tone="info"
                style={[styles.halfCard, !showHint && { width: '100%' }]}
                bodyStyle={{ padding: sp.s }}
              >
                <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={true}>
                  {revealedScenarios.map((scenario, index) => (
                    <View key={index} style={styles.miniScenarioItem}>
                      {renderBlitzText(
                        scenario.text || scenario.answer || '...',
                        scenario.template,
                        styles.miniScenarioText,
                        { color: '#FFFF00', fontWeight: '700', textDecorationLine: 'underline' }
                      )}
                      {scenario.author ? <Text style={styles.miniScenarioMeta}>{`— ${scenario.author}`}</Text> : null}
                    </View>
                  ))}
                  {revealedScenarios.length === 0 && (
                    <Text style={styles.emptyMiniText}>لا توجد كتابات مكشوفة بعد</Text>
                  )}
                </ScrollView>
              </TerminalCard>
            )}
          </View>
        )}

        {isHost ? (
          <ScrollView contentContainerStyle={[styles.playerGrid, wide && styles.playerGridWide]} showsVerticalScrollIndicator={false}>
            {players.map((player, index) => (
              <TouchableOpacity key={player.id || index} style={wide ? styles.playerWide : null} onPress={() => socket?.emit('setSpeaker', { roomCode, playerId: player.id === speakingPlayerId ? null : player.id })}>
                <PlayerBadge name={player.name} index={index + 1} isActive={player.id === speakingPlayerId} style={{ width: '100%' }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          showPlayerScenarios ? (
            <ScrollView contentContainerStyle={styles.scenarioList} showsVerticalScrollIndicator={false}>
              {revealedScenarios.map((scenario, index) => (
                <TerminalCard key={index} title={`> LOG ${index + 1}`} tone="info">
                  {renderBlitzText(
                    scenario.text || scenario.answer || '...',
                    scenario.template,
                    styles.scenarioText,
                    { color: '#FFFF00', fontWeight: '700', textDecorationLine: 'underline' }
                  )}
                  {scenario.author ? <Text style={styles.scenarioMeta}>{`— ${scenario.author}`}</Text> : null}
                </TerminalCard>
              ))}
            </ScrollView>
          ) : null
        )}
      </View>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: sp.s,
  },
  emptyText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    color: '#00CC33',
    textAlign: 'center',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundWave: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingBottom: 4,
    height: 36,
  },
  soundBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: '#00FF41',
  },
  playerGrid: {
    gap: sp.s,
    paddingBottom: sp.l,
  },
  playerGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  playerWide: {
    width: '48%',
  },
  scenarioList: {
    gap: sp.s,
    paddingBottom: sp.l,
  },
  scenarioText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    color: '#00FF41',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  scenarioMeta: {
    marginTop: sp.xs,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00CC33',
    textAlign: 'left',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: sp.s,
    marginTop: sp.xs,
  },
  sideBySideRow: {
    flexDirection: 'row',
    gap: sp.s,
    marginTop: sp.xs,
    width: '100%',
  },
  halfCard: {
    flex: 1,
    minWidth: '48%',
  },
  miniHintText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#FFFF00',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  miniScenarioItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(57, 255, 20, 0.1)',
    paddingVertical: sp.xs,
  },
  miniScenarioText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00FF41',
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  miniScenarioMeta: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    color: '#00CC33',
    textAlign: 'left',
    marginTop: 2,
  },
  emptyMiniText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    color: '#007A1F',
    textAlign: 'center',
    paddingVertical: sp.s,
  },
  hostActiveSpeakerBody: {
    paddingVertical: sp.l,
    paddingHorizontal: sp.l,
  },
  hostActiveSpeakerBadge: {
    paddingVertical: sp.m,
  },
  hostSoundWave: {
    height: 48,
    gap: 6,
  },
  hostSoundBar: {
    width: 8,
    borderRadius: 4,
  },
  hostEmptyText: {
    fontSize: fontSize.medium,
    paddingVertical: sp.m,
  },
});
