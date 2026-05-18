import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { ProgressBar, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalInput, TerminalLayout } from '../components';
import { formatTime, getRoleMeta, sp } from '../tokens';

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
  const meta = getRoleMeta(roleData?.role);

  const handleSubmit = () => {
    const text = answer.trim();
    if (!text || !socket) return;
    setIsSubmitted(true);
    socket.emit('submitAnswer', { roomCode, answer: text });
  };

  return (
    <TerminalLayout
      top={<TerminalHeader title="DRAFTING PHASE" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}
      bottom={<TerminalButton title={isSubmitted ? 'تم الإرسال' : 'إرسال النص'} onPress={handleSubmit} disabled={isSubmitted || answer.trim().length < 8} size="sm" style={{ flex: 1 }} />}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <TerminalCard title={template ? '> TEMPLATE' : '> SCENARIO'} tone="info">
            <View>
              <TerminalBanner variant="info" label="المطلوب">{template || scenario || 'اكتب روايتك الآن.'}</TerminalBanner>
            </View>
          </TerminalCard>

          <ProgressBar value={timeLeft} max={90} label="> TIMER" showTime timeText={formatTime(timeLeft)} />

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
});
