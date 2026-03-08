/**
 * design-v2/screens/VotingScreens.js
 * QualityVotingScreen, CulpritVotingScreen, WaitingRevealScreen,
 * PlayerDramaticRevealScreen, PlayerResultsScreen, EndScreen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket, ROUTES } from '../../hooks/useGameSocket';
import { DossierLayout, StampButton, FileBadge, CaseHeader, ClassifiedBanner, DossierCard } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';

const getRoleEmoji = (role) =>
  ({ CULPRIT:'🎭',DETECTIVE:'🕵️',WITNESS:'👁️',SABOTEUR:'🧨',MINISTER:'📜',BENEFICIARY:'💰',SEER:'🔮',MASTERMIND:'🧠' })[role] || '👤';

const useTheme = () => getColors(useGameStore(s => s.themeMode) || 'light');

/* ══════════════════════════════════════════════════════
   QualityVotingScreen
══════════════════════════════════════════════════════ */
export const QualityVotingScreen = () => {
  const c         = useTheme();
  const { socket }= useSocket();
  const scenarios = useGameStore(s => s.scenarios) || [];
  const hasVoted  = useGameStore(s => s.hasVoted);
  const myAnswer  = useGameStore(s => s.answer);
  const roleData  = useGameStore(s => s.roleData);
  const roomCode  = useGameStore(s => s.roomCode);
  const myName    = useGameStore(s => s.playerName);
  const setHasVoted = useGameStore(s => s.setHasVoted);
  const setSelectedScenario = useGameStore(s => s.setSelectedScenario);

  const [selected, setSelected] = useState(null);

  const handleVote = () => {
    if (selected !== null && socket) {
      setHasVoted(true);
      setSelectedScenario(selected);
      socket.emit('submitQualityVote', { roomCode, scenarioIndex: selected });
    }
  };

  const emoji = getRoleEmoji(roleData?.role);

  return (
    <DossierLayout
      top={<CaseHeader mode="player" roomCode={roomCode} roleName={roleData?.roleName} roleEmoji={emoji} playerId={myName} />}
      bottom={
        hasVoted
          ? <ClassifiedBanner label="تم التصويت" variant="success" style={{ flex: 1 }}>✅ تم تسجيل صوتك</ClassifiedBanner>
          : <StampButton title="تأكيد التصويت ✓" onPress={handleVote} disabled={selected === null} variant="primary" size="sm" style={{ flex: 1 }} />
      }
    >
      <View style={[styles.listLabel, { borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.textMuted }]}>اختر أفضل سيناريو</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.cardsGrid}>
          {scenarios.map((s, i) => {
            const isSelf  = s.answer === myAnswer;
            const isChosen= selected === i;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.voteCard,
                  { borderColor: isChosen ? c.gold : c.cardBorder, backgroundColor: c.cardBg },
                  isChosen && styles.voteCardSelected,
                  (hasVoted || isSelf) && styles.voteCardDisabled,
                  isSelf && { borderColor: c.border, opacity: 0.5 },
                ]}
                onPress={() => !hasVoted && !isSelf && setSelected(i)}
                activeOpacity={0.8}
                disabled={hasVoted || isSelf}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.cardIdx, { color: c.textMuted }]}>#{i+1}</Text>
                  {isChosen && !hasVoted && <Text style={{ color: c.gold, fontWeight: '700' }}>✓</Text>}
                  {isSelf && <Text style={[styles.selfTag, { color: c.textMuted }]}>تقريرك</Text>}
                </View>
                <Text style={[styles.cardText, { color: c.text }]}>{s.answer || s.text || '…'}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════
   CulpritVotingScreen
══════════════════════════════════════════════════════ */
export const CulpritVotingScreen = () => {
  const c         = useTheme();
  const { socket }= useSocket();
  const scenarios = useGameStore(s => s.scenarios) || [];
  const hasVoted  = useGameStore(s => s.hasVoted);
  const roleData  = useGameStore(s => s.roleData);
  const roomCode  = useGameStore(s => s.roomCode);
  const myName    = useGameStore(s => s.playerName);
  const myPlayerId= socket?.id;
  const setHasVoted = useGameStore(s => s.setHasVoted);
  const setSelectedCulprit = useGameStore(s => s.setSelectedCulprit);

  const [selected, setSelected] = useState(null);

  const handleVote = () => {
    if (selected !== null && socket) {
      setHasVoted(true);
      setSelectedCulprit(selected);
      const choice = scenarios[selected]?.playerId || selected;
      socket.emit('submitCulpritVote', { roomCode, playerId: choice });
    }
  };

  const emoji = getRoleEmoji(roleData?.role);

  return (
    <DossierLayout
      top={<CaseHeader mode="player" roomCode={roomCode} roleName={roleData?.roleName} roleEmoji={emoji} playerId={myName} />}
      bottom={
        hasVoted
          ? <ClassifiedBanner label="تم الاتهام" variant="danger" style={{ flex: 1 }}>⚖️ تم توجيه الاتهام</ClassifiedBanner>
          : <StampButton title="توجيه الاتهام 🎯" onPress={handleVote} disabled={selected === null} variant="danger" size="sm" style={{ flex: 1 }} />
      }
    >
      <View style={[styles.listLabel, { borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.accent }]}>من الجاني؟</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.cardsGrid}>
          {scenarios.map((s, i) => {
            const isSelf  = s.playerId === myPlayerId;
            const isChosen= selected === i;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.voteCard,
                  { borderColor: isChosen ? c.accent : c.cardBorder, backgroundColor: c.cardBg },
                  isChosen && { borderWidth: 2, borderColor: c.accent },
                  (hasVoted || isSelf) && styles.voteCardDisabled,
                  isSelf && { borderColor: c.border, opacity: 0.5 },
                ]}
                onPress={() => !hasVoted && !isSelf && setSelected(i)}
                activeOpacity={0.8}
                disabled={hasVoted || isSelf}
              >
                {/* RTL: badge (right) + text (left) */}
                <View style={styles.culpritRow}>
                  <Text style={[styles.cardText, { color: c.text, flex: 1 }]}>{s.answer || s.text || '…'}</Text>
                  <FileBadge name={s.playerName || s.author || '؟'} size="sm" />
                </View>
                {isChosen && !hasVoted && <Text style={{ color: c.accent, textAlign: 'center', marginTop: sp.xs }}>🎯</Text>}
                {isSelf && <Text style={[styles.selfTag, { color: c.textMuted }]}>تقريرك</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════
   WaitingRevealScreen
══════════════════════════════════════════════════════ */
export const WaitingRevealScreen = ({ message = 'انتظر قليلاً…' }) => {
  const c       = useTheme();
  const roleData= useGameStore(s => s.roleData);
  const roomCode= useGameStore(s => s.roomCode);
  const myName  = useGameStore(s => s.playerName);
  const emoji   = getRoleEmoji(roleData?.role);

  return (
    <DossierLayout
      top={<CaseHeader mode="player" roomCode={roomCode} roleName={roleData?.roleName} roleEmoji={emoji} playerId={myName} />}
    >
      <View style={styles.center}>
        <Text style={styles.waitEmoji}>⏳</Text>
        <Text style={[styles.waitText, { color: c.textMuted }]}>{message}</Text>
      </View>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════
   PlayerDramaticRevealScreen
══════════════════════════════════════════════════════ */
export const PlayerDramaticRevealScreen = () => {
  const c            = useTheme();
  const roleData     = useGameStore(s => s.roleData);
  const roomCode     = useGameStore(s => s.roomCode);
  const currentReveal= useGameStore(s => s.currentReveal);
  const myName       = useGameStore(s => s.playerName);
  const emoji        = getRoleEmoji(roleData?.role);

  if (currentReveal?.type === 'HINT') {
    return (
      <DossierLayout top={<CaseHeader mode="player" roomCode={roomCode} roleName={roleData?.roleName} roleEmoji={emoji} playerId={myName} />}>
        <View style={styles.center}>
          <Text style={styles.waitEmoji}>🔍</Text>
          <ClassifiedBanner label="تلميح هام" variant="gold">{currentReveal.text}</ClassifiedBanner>
        </View>
      </DossierLayout>
    );
  }

  const showAuthor = currentReveal?.author !== undefined;
  const showVoters = currentReveal?.voters !== undefined;

  return (
    <DossierLayout
      top={<CaseHeader mode="player" roomCode={roomCode} roleName={roleData?.roleName} roleEmoji={emoji} playerId={myName} />}
    >
      <View style={styles.center}>
        <Text style={styles.waitEmoji}>⚠️</Text>
        {currentReveal?.text ? (
          <View style={[styles.revealCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <Text style={[styles.revealText, { color: c.text }]}>{currentReveal.text}</Text>
            {showAuthor && currentReveal.author && <FileBadge name={currentReveal.author} size="md" />}
            {showVoters && currentReveal.voters?.length > 0 && (
              <View style={styles.votersRow}>
                <Text style={[styles.selfTag, { color: c.textMuted }]}>صوّت له:</Text>
                {(currentReveal.voters || []).map((v, i) => (
                  <FileBadge key={i} name={typeof v === 'object' ? v.name : v} size="sm" />
                ))}
              </View>
            )}
          </View>
        ) : (
          <Text style={[styles.waitText, { color: c.textMuted }]}>جاري التحضير…</Text>
        )}
      </View>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════
   PlayerResultsScreen
══════════════════════════════════════════════════════ */
export const PlayerResultsScreen = () => {
  const c       = useTheme();
  const roleData= useGameStore(s => s.roleData);
  const roomCode= useGameStore(s => s.roomCode);
  const results = useGameStore(s => s.roundResults);
  const myName  = useGameStore(s => s.playerName);
  const emoji   = getRoleEmoji(roleData?.role);

  if (!results) return <WaitingRevealScreen message="جاري حساب النتائج…" />;

  return (
    <DossierLayout
      top={<CaseHeader mode="player" roomCode={roomCode} roleName={roleData?.roleName} roleEmoji={emoji} playerId={myName} />}
    >
      <View style={styles.center}>
        <View style={[styles.hostCardBox, { backgroundColor: c.cardBg, borderColor: c.gold }]}>
          <Text style={styles.waitEmoji}>📺</Text>
          <Text style={[styles.hostMsg, { color: c.text }]}>انظر إلى شاشة المضيف</Text>
          <Text style={[styles.waitText, { color: c.textMuted }]}>لرؤية نتائج الجولة وترتيب النقاط</Text>
        </View>
        <Text style={[styles.waitText, { color: c.textMuted, marginTop: sp.s }]}>انتظر تعليمات المضيف…</Text>
      </View>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════
   EndScreen
══════════════════════════════════════════════════════ */
export const EndScreen = () => {
  const c            = useTheme();
  const navigation   = useNavigation();
  const resetGame    = useGameStore(s => s.resetGame);
  const finalResults = useGameStore(s => s.finalResults) || [];
  const { socket }   = useSocket();

  const handleRestart = () => {
    if (socket) socket.disconnect();
    resetGame();
    navigation.navigate(ROUTES.ROLE_SELECT);
  };

  const medalFor = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `${rank + 1}.`;
  };

  return (
    <DossierLayout
      top={<CaseHeader mode="neutral" title="النهاية" subtitle="انتهت المهمة" />}
      bottom={
        <StampButton title="عودة للرئيسية" onPress={handleRestart} variant="primary" size="sm" style={{ flex: 1 }} />
      }
    >
      <ScrollView contentContainerStyle={{ gap: sp.m, paddingBottom: sp.xl }}>
        {/* Banner */}
        <View style={styles.center}>
          <Text style={styles.waitEmoji}>🏁</Text>
          <ClassifiedBanner label="النتيجة" variant="gold">انتهت اللعبة!</ClassifiedBanner>
        </View>
        {/* Leaderboard */}
        {finalResults.length > 0 ? (
          <View style={[styles.leaderboard, { borderColor: c.gold, backgroundColor: c.surface }]}>
            <Text style={[styles.leaderboardTitle, { color: c.gold, borderBottomColor: c.border }]}>
              🏆 الترتيب النهائي
            </Text>
            {finalResults.map((player, idx) => (
              <View
                key={idx}
                style={[
                  styles.leaderboardRow,
                  { borderBottomColor: c.border },
                  idx === 0 && { backgroundColor: c.surfaceAlt },
                ]}
              >
                <Text style={[styles.leaderboardMedal, { color: c.gold }]}>
                  {medalFor(idx)}
                </Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.leaderboardName, { color: c.text }]}>
                    {player.name}
                  </Text>
                  <Text style={[styles.leaderboardRole, { color: c.textMuted }]}>
                    {getRoleEmoji(player.role)} {player.roleName || player.role}
                  </Text>
                </View>
                <Text style={[styles.leaderboardScore, { color: idx === 0 ? c.gold : c.text }]}>
                  {player.totalScore} نقطة
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: sp.m },
  waitEmoji: { fontSize: 56 },
  waitText: { fontSize: fontSize.body, fontFamily: fontFamily.mono, fontStyle: 'italic', textAlign: 'center' },

  listLabel: { borderBottomWidth: 1, paddingBottom: sp.xs, marginBottom: sp.xs },
  sectionTitle: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '700' },

  cardsGrid: { gap: sp.s, paddingBottom: sp.m },
  voteCard: {
    borderWidth: 1, borderRadius: radius.m, padding: sp.m, gap: sp.xs,
  },
  voteCardSelected: { borderWidth: 2 },
  voteCardDisabled: { opacity: 0.55 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardIdx: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '700' },
  cardText: { fontSize: fontSize.body, fontFamily: fontFamily.mono, lineHeight: fontSize.body * 1.45, textAlign: 'right' },
  selfTag: { fontSize: fontSize.small, fontFamily: fontFamily.mono, fontStyle: 'italic' },

  culpritRow: { flexDirection: 'row', alignItems: 'flex-start', gap: sp.s },

  revealCard: { borderWidth: 1.5, borderRadius: radius.m, padding: sp.l, gap: sp.m, width: '100%' },
  revealText: { fontSize: fontSize.medium, fontFamily: fontFamily.mono, lineHeight: fontSize.medium * 1.5, textAlign: 'right' },
  votersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.xs, alignItems: 'center' },

  hostCardBox: { borderWidth: 1.5, borderRadius: radius.m, padding: sp.l, alignItems: 'center', gap: sp.s, width: '100%', maxWidth: 340 },
  hostMsg: { fontSize: fontSize.heading, fontFamily: fontFamily.mono, fontWeight: '900', textAlign: 'center' },

  leaderboard: { borderWidth: 1.5, borderRadius: radius.m, overflow: 'hidden' },
  leaderboardTitle: {
    fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '700',
    paddingHorizontal: sp.m, paddingVertical: sp.s, borderBottomWidth: 1, textAlign: 'center',
  },
  leaderboardRow: {
    flexDirection: 'row', alignItems: 'center', gap: sp.s,
    paddingHorizontal: sp.m, paddingVertical: sp.s, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leaderboardMedal: { fontSize: fontSize.body, fontFamily: fontFamily.mono, fontWeight: '700', minWidth: 30, textAlign: 'center' },
  leaderboardName: { fontSize: fontSize.body, fontFamily: fontFamily.mono, fontWeight: '700' },
  leaderboardRole: { fontSize: fontSize.small, fontFamily: fontFamily.mono },
  leaderboardScore: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '900', textAlign: 'right' },
});
