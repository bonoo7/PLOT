import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { ProgressBar, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalInput, TerminalLayout } from '../components';
import { formatTime, getRoleMeta, sp, fontFamily, fontSize } from '../tokens';

export const DraftingScreen = () => {
  const { socket } = useSocket();
  const roleData = useGameStore((s) => s.roleData);
  const roomCode = useGameStore((s) => s.roomCode);
  const answer = useGameStore((s) => s.answer);
  const setAnswer = useGameStore((s) => s.setAnswer);
  const isSubmitted = useGameStore((s) => s.isSubmitted);
  const setIsSubmitted = useGameStore((s) => s.setIsSubmitted);
  const scenario = useGameStore((s) => s.scenario);
  const template = useGameStore((s) => s.template);
  const timeLeft = useGameStore((s) => s.timeLeft) || 0;
  const playerName = useGameStore((s) => s.playerName);
  const gameMode = useGameStore((s) => s.gameMode);
  const currentRound = useGameStore((s) => s.currentRound);
  const players = useGameStore((s) => s.players) || [];
  const playerId = useGameStore((s) => s.playerId);
  const meta = getRoleMeta(roleData?.role);

  const [abilityUsed, setAbilityUsed] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [filledBlanks, setFilledBlanks] = useState({});

  // Reset ability and blanks each new round
  useEffect(() => {
    setAbilityUsed(false);
    setTargetId(null);
    setFilledBlanks({});
  }, [currentRound]);

  const handleSubmit = () => {
    const text = answer.trim();
    if (!text || !socket) return;
    setIsSubmitted(true);
    socket.emit('submitAnswer', { roomCode, answer: text });
  };

  const handleAbility = () => {
    if (!socket || abilityUsed) return;
    if (roleData?.role !== 'SEER' && !targetId) return;
    let abilityType = '';
    if (roleData?.role === 'DETECTIVE') abilityType = 'INVESTIGATE';
    else if (roleData?.role === 'SABOTEUR') abilityType = 'SABOTAGE';
    else if (roleData?.role === 'SEER') abilityType = 'REVELATION';
    if (abilityType) {
      socket.emit('useAbility', { roomCode, abilityType, targetId });
      setAbilityUsed(true);
    }
  };

  const showAbilityControls = !isSubmitted && roleData && !abilityUsed &&
    ['DETECTIVE', 'SABOTEUR', 'SEER'].includes(roleData.role);

  const targets = players.filter((p) => p.id !== playerId);
  const isBlitzWaiting = gameMode === 'BLITZ' && !template;
  const isBlitzActive  = gameMode === 'BLITZ' && !!template;

  const abilityLabel =
    roleData?.role === 'DETECTIVE' ? '🕵️ التحقيق السري' :
    roleData?.role === 'SABOTEUR'  ? '😈 التضليل'       : '🔮 الوحي';

  // Blitz fill-in-the-blanks renderer
  const renderBlitzBlanks = () => {
    const parts = template.split('_____');
    return (
      <TerminalCard title="> FILL THE BLANKS" tone="warning">
        <View style={styles.blitzContainer}>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part ? <Text style={styles.blitzText}>{part}</Text> : null}
              {index < parts.length - 1 && (
                <TextInput
                  style={[styles.blitzInput, isSubmitted && styles.blitzInputDisabled]}
                  value={filledBlanks[index] || ''}
                  onChangeText={(text) => {
                    const nb = { ...filledBlanks, [index]: text };
                    setFilledBlanks(nb);
                    let full = '';
                    parts.forEach((p, i) => {
                      full += p;
                      if (i < parts.length - 1) full += (nb[i] || '_____');
                    });
                    setAnswer(full);
                  }}
                  placeholder="..."
                  placeholderTextColor="#00663A"
                  editable={!isSubmitted}
                  textAlign="center"
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </TerminalCard>
    );
  };

  return (
    <TerminalLayout
      top={<TerminalHeader title="DRAFTING PHASE" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}
      bottom={<TerminalButton title={isSubmitted ? 'تم الإرسال' : 'إرسال النص'} onPress={handleSubmit} disabled={isSubmitted || answer.trim().length < 8} size="sm" style={{ flex: 1 }} />}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <TerminalCard title={template ? '> TEMPLATE' : '> SCENARIO'} tone="info">
            <TerminalBanner variant="info" label="المطلوب">{template || scenario || 'اكتب روايتك الآن.'}</TerminalBanner>
          </TerminalCard>

          <ProgressBar value={timeLeft} max={90} label="> TIMER" showTime timeText={formatTime(timeLeft)} />

          {isBlitzWaiting ? (
            <TerminalBanner variant="warning" label="SYNC">⏳ جاري تحميل نموذج الجولة...</TerminalBanner>
          ) : isBlitzActive ? (
            renderBlitzBlanks()
          ) : (
            <TerminalInput
              label="الإجابة"
              value={answer}
              onChangeText={setAnswer}
              placeholder="اكتب السيناريو هنا..."
              multiline
              numberOfLines={8}
              editable={!isSubmitted}
              style={styles.inputWrap}
            />
          )}

          {showAbilityControls && (
            <TerminalCard title={`> ${abilityLabel}`} tone="warning">
              {roleData?.role !== 'SEER' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targetRow}>
                  {targets.map((p, i) => (
                    <TouchableOpacity
                      key={p.id || i}
                      style={[styles.targetChip, targetId === p.id && styles.targetChipSelected]}
                      onPress={() => setTargetId(p.id)}
                    >
                      <Text style={[styles.targetText, targetId === p.id && styles.targetTextSelected]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <TerminalButton
                title={roleData?.role === 'SEER' ? 'تفعيل الوحي' : `تنفيذ${targetId ? ` على ${targets.find((p) => p.id === targetId)?.name}` : ''}`}
                disabled={roleData?.role !== 'SEER' && !targetId}
                onPress={handleAbility}
                size="sm"
              />
            </TerminalCard>
          )}

          {isSubmitted ? <TerminalBanner variant="success" label="UPLINK">تم إرسال إجابتك. انتظر بقية اللاعبين.</TerminalBanner> : null}
        </View>
      </KeyboardAvoidingView>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    gap: sp.s,
  },
  inputWrap: {
    flex: 1,
  },
  targetRow: {
    flexDirection: 'row',
    gap: sp.xs,
    paddingBottom: sp.xs,
  },
  targetChip: {
    paddingHorizontal: sp.s,
    paddingVertical: sp.xs,
    borderWidth: 1,
    borderColor: '#00CC33',
    borderRadius: 4,
  },
  targetChipSelected: {
    backgroundColor: '#00CC33',
  },
  targetText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    color: '#00CC33',
  },
  targetTextSelected: {
    color: '#000',
  },
  blitzContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  blitzText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    color: '#00FF41',
    lineHeight: fontSize.body * 1.6,
  },
  blitzInput: {
    borderBottomWidth: 2,
    borderBottomColor: '#00CC33',
    minWidth: 80,
    color: '#00FF41',
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,204,51,0.07)',
  },
  blitzInputDisabled: {
    opacity: 0.5,
  },
});
