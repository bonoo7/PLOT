/**
 * design-v2/screens/HostGameScreens.js
 * HostGameIntroScreen, HostDraftingScreen, HostVotingScreen,
 * HostResultsScreen, HostDramaticRevealScreen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket, ROUTES } from '../../hooks/useGameSocket';
import { DossierLayout, StampButton, FileBadge, CaseHeader, ClassifiedBanner, DossierCard } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';

const useTheme = () => {
  const mode = useGameStore(s => s.themeMode) || 'light';
  return getColors(mode);
};

/* ══════════════════════════════════════════════════════
   HostGameIntroScreen
══════════════════════════════════════════════════════ */
export const HostGameIntroScreen = () => {
  const c = useTheme();
  const roomCode     = useGameStore(s => s.roomCode);
  const round        = useGameStore(s => s.currentRound);
  const totalRounds  = useGameStore(s => s.totalRounds);
  const scenario     = useGameStore(s => s.scenario);

  return (
    <DossierLayout
      top={<CaseHeader mode="host" roomCode={roomCode} phase="بداية الجولة" round={`${round}/${totalRounds}`} />}
    >
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🎮</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
          <Text style={[styles.cardLabel, { color: c.textMuted }]}>عنوان القضية</Text>
          <Text style={[styles.cardTitle, { color: c.text }]}>{scenario || 'جاري التحميل…'}</Text>
        </View>
        <ClassifiedBanner label="الحالة" variant="gold">⚙️ جارٍ توزيع الأدوار…</ClassifiedBanner>
      </View>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════
   HostDraftingScreen
══════════════════════════════════════════════════════ */
export const HostDraftingScreen = () => {
  const c = useTheme();
  const roomCode   = useGameStore(s => s.roomCode);
  const players    = useGameStore(s => s.players) || [];
  const waitingFor = useGameStore(s => s.waitingFor) || [];
  const timeLeft   = useGameStore(s => s.timeLeft) || 0;
  const hint       = useGameStore(s => s.lastHint);
  const round      = useGameStore(s => s.currentRound);
  const totalRounds= useGameStore(s => s.totalRounds);

  const submitted = players.length - waitingFor.length;
  const progress  = players.length > 0 ? submitted / players.length : 0;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerStr = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const alert = timeLeft <= 30;

  return (
    <DossierLayout
      top={<CaseHeader mode="host" roomCode={roomCode} phase="الكتابة" round={`${round}/${totalRounds}`} />}
    >
      {hint && <ClassifiedBanner label="تلميح" variant="info">{hint}</ClassifiedBanner>}

      <View style={styles.body}>
        {/* Timer + progress */}
        <View style={[styles.statsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.timerRow}>
            <Text style={[styles.timerVal, { color: alert ? c.accent : c.text }]}>{timerStr}</Text>
            <Text style={[styles.timerLabel, { color: c.textMuted }]}>الوقت المتبقي</Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: c.border }]}>
            <View style={[styles.progressFill, { width: `${(timeLeft / 90) * 100}%`, backgroundColor: alert ? c.accent : c.gold }]} />
          </View>

          <View style={[styles.divider, { backgroundColor: c.border }]} />

          <View style={styles.timerRow}>
            <Text style={[styles.timerVal, { color: c.text }]}>{submitted} / {players.length}</Text>
            <Text style={[styles.timerLabel, { color: c.textMuted }]}>تم التسليم</Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: c.border }]}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: c.success }]} />
          </View>
        </View>

        {/* Players list */}
        <View style={[styles.listBox, { borderColor: c.border, flex: 1 }]}>
          <Text style={[styles.boxLabel, { color: c.textMuted }]}>حالة اللاعبين</Text>
          <ScrollView contentContainerStyle={styles.playerList} showsVerticalScrollIndicator={false}>
            {players.map((p, i) => {
              const done = !waitingFor.includes(p.id);
              return (
                <View key={p.id || i} style={styles.playerStatusRow}>
                  <FileBadge name={p.name} size="sm" number={i + 1} />
                  <Text style={[styles.statusTag, { color: done ? c.success : c.textMuted }]}>
                    {done ? 'تم ✅' : '…'}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════
   HostVotingScreen (quality or culprit)
══════════════════════════════════════════════════════ */
export const HostVotingScreen = ({ route }) => {
  const c = useTheme();
  const votingType = route?.params?.votingType || 'quality';
  const roomCode   = useGameStore(s => s.roomCode);
  const scenarios  = useGameStore(s => s.scenarios) || [];
  const liveVotes  = useGameStore(s => s.liveVotes) || [];
  const players    = useGameStore(s => s.players) || [];
  const voteTieInfo= useGameStore(s => s.voteTieInfo);
  const round      = useGameStore(s => s.currentRound);
  const totalRounds= useGameStore(s => s.totalRounds);

  const voted = liveVotes.length;
  const total = players.length;

  const getVotes = (i) => {
    if (votingType === 'culprit') {
      const tid = scenarios[i]?.playerId;
      return liveVotes.filter(v => v.choice === tid).length;
    }
    return liveVotes.filter(v => v.choice === i).length;
  };

  return (
    <DossierLayout
      top={<CaseHeader mode="host" roomCode={roomCode} phase={votingType === 'quality' ? 'تصويت الجودة' : 'تصويت الجاني'} round={`${round}/${totalRounds}`} />}
    >
      {voteTieInfo && (
        <ClassifiedBanner label="تعادل ⚖️" variant="danger">
          إعادة التصويت بين: {(voteTieInfo.candidates || []).join(' — ')}
        </ClassifiedBanner>
      )}

      <View style={styles.body}>
        {/* Progress */}
        <View style={[styles.statsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.timerLabel, { color: c.textMuted }]}>التقدم: {voted} / {total}</Text>
          <View style={[styles.progressBg, { backgroundColor: c.border }]}>
            <View style={[styles.progressFill, { width: total > 0 ? `${(voted / total) * 100}%` : '0%', backgroundColor: c.gold }]} />
          </View>
          <View style={styles.badgesRow}>
            {players.map(p => (
              <View key={p.id} style={{ opacity: liveVotes.some(v => v.playerId === p.id) ? 1 : 0.35 }}>
                <FileBadge name={p.name} size="sm" />
              </View>
            ))}
          </View>
        </View>

        {/* Live vote bars */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {scenarios.map((s, i) => {
            const votes = getVotes(i);
            const name = votingType === 'quality' ? `سيناريو #${i+1}` : (s.playerName || `لاعب ${i+1}`);
            const pct = total > 0 ? (votes / total) * 100 : 0;
            return (
              <View key={i} style={[styles.voteBarRow, { borderColor: c.border }]}>
                {votingType === 'culprit'
                  ? <FileBadge name={s.playerName || '؟'} size="sm" />
                  : <Text style={[styles.barLabel, { color: c.textSub }]}>{name}</Text>
                }
                <View style={[styles.barTrack, { backgroundColor: c.border, flex: 1 }]}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: votingType === 'culprit' ? c.accent : c.gold }]} />
                </View>
                <Text style={[styles.barCount, { color: c.text }]}>{votes}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </DossierLayout>
  );
};

export const HostQualityVotingScreen = () => <HostVotingScreen route={{ params: { votingType: 'quality' } }} />;
export const HostCulpritVotingScreen = () => <HostVotingScreen route={{ params: { votingType: 'culprit' } }} />;

/* ══════════════════════════════════════════════════════
   HostResultsScreen
══════════════════════════════════════════════════════ */
export const HostResultsScreen = () => {
  const c = useTheme();
  const [revealStep, setRevealStep]     = useState(0);
  const [expandedIdx, setExpandedIdx]   = useState(null);
  const { socket }   = useSocket();

  const roomCode          = useGameStore(s => s.roomCode);
  const roundResults      = useGameStore(s => s.roundResults);
  const currentRound      = useGameStore(s => s.currentRound);
  const totalRounds       = useGameStore(s => s.totalRounds);

  useEffect(() => {
    if (roundResults) {
      setRevealStep(0);
      setExpandedIdx(null);
      const t1 = setTimeout(() => setRevealStep(1), 500);
      const t2 = setTimeout(() => setRevealStep(2), 3000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [roundResults]);

  if (!roundResults) return null;

  const { winner, reason, eliminatedPlayer, scores, round, totalRounds: totalR } = roundResults;
  const isLastRound = roundResults.isLastRound ?? (round != null && totalR != null ? round >= totalR : currentRound >= totalRounds);
  const isContinue = winner === 'CONTINUE';
  const isCrime    = winner === 'CRIME';
  const btnTitle   = isContinue ? 'متابعة النقاش ←' : (isLastRound ? 'إنهاء اللعبة' : 'جولة جديدة ←');

  const handleContinue = () => { if (socket) socket.emit('nextRound', { roomCode }); };

  return (
    <DossierLayout
      top={<CaseHeader mode="host" roomCode={roomCode} phase="النتائج" round={round && totalR ? `${round}/${totalR}` : undefined} />}
      bottom={
        revealStep >= 2
          ? <StampButton title={btnTitle} onPress={handleContinue} variant={isContinue ? 'secondary' : 'primary'} size="sm" style={{ flex: 1 }} />
          : null
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Eliminated player */}
        {eliminatedPlayer && (
          <View style={[styles.eliminatedRow, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.boxLabel, { color: c.textMuted }]}>تم استبعاد:</Text>
            {revealStep >= 1
              ? <FileBadge name={eliminatedPlayer.name} size="md" />
              : <Text style={{ color: c.textMuted }}>···</Text>
            }
          </View>
        )}

        {revealStep >= 2 && (
          <>
            {/* Winner banner */}
            {!isContinue && (
              <View style={[styles.winnerBanner, { backgroundColor: isCrime ? c.accent : c.gold + '33', borderColor: isCrime ? c.accent : c.gold }]}>
                <Text style={[styles.winnerTitle, { color: isCrime ? '#fff' : c.gold }]}>
                  {isCrime ? '🔴 فاز فريق الجريمة' : '🔵 فاز فريق العدالة'}
                </Text>
                {reason ? <Text style={[styles.winnerReason, { color: isCrime ? '#ffcccc' : c.textSub }]}>{reason}</Text> : null}
              </View>
            )}

            {/* Scores */}
            <View style={[styles.scoresBox, { borderColor: c.border, backgroundColor: c.surface }]}>
              <Text style={[styles.boxLabel, { color: c.textMuted }]}>ترتيب النقاط</Text>
              {scores?.map((p, i) => {
                const teamColor = p.team === 'CRIME' ? c.accent : p.team === 'JUSTICE' ? '#3498db' : c.textMuted;
                const expanded  = expandedIdx === i;
                return (
                  <View key={i}>
                    <TouchableOpacity
                      style={[styles.scoreRow, { borderColor: c.border }]}
                      onPress={() => p.breakdown?.length && setExpandedIdx(expanded ? null : i)}
                      activeOpacity={p.breakdown?.length ? 0.7 : 1}
                    >
                      <Text style={[styles.rank, { color: i === 0 ? c.gold : c.textMuted }]}>#{i+1}</Text>
                      <View style={[styles.teamStripe, { backgroundColor: teamColor }]} />
                      <FileBadge name={p.name} size="sm" />
                      {p.role && p.role !== '؟؟؟' && (
                        <Text style={[styles.roleTag, { color: teamColor }]}>{p.role}</Text>
                      )}
                      <View style={{ flex: 1 }} />
                      {p.roundScore !== undefined && (
                        <Text style={[styles.delta, { color: p.roundScore > 0 ? c.success : c.textMuted }]}>
                          {p.roundScore > 0 ? `+${p.roundScore}` : p.roundScore}
                        </Text>
                      )}
                      <Text style={[styles.totalScore, { color: i === 0 ? c.gold : c.text }]}>{p.totalScore}</Text>
                      {p.breakdown?.length ? <Text style={[styles.expandIcon, { color: c.textMuted }]}>{expanded ? '▲' : '▼'}</Text> : null}
                    </TouchableOpacity>
                    {expanded && (
                      <View style={[styles.breakdownBox, { backgroundColor: c.cardBg }]}>
                        {p.breakdown.map((line, j) => (
                          <Text key={j} style={[styles.breakdownLine, { color: c.textSub }]}>• {line}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </DossierLayout>
  );
};

/* ══════════════════════════════════════════════════════
   HostDramaticRevealScreen
══════════════════════════════════════════════════════ */
export const HostDramaticRevealScreen = () => {
  const c = useTheme();
  const roomCode          = useGameStore(s => s.roomCode);
  const revealedScenarios = useGameStore(s => s.revealedScenarios) || [];
  const currentReveal     = useGameStore(s => s.currentReveal);

  if (currentReveal?.type === 'HINT') {
    return (
      <DossierLayout
        top={<CaseHeader mode="host" roomCode={roomCode} phase="تلميح درامي" />}
      >
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>🔍</Text>
          <View style={[styles.hintCard, { backgroundColor: c.cardBg, borderColor: c.gold }]}>
            <Text style={[styles.hintText, { color: c.gold }]}>{currentReveal.text}</Text>
          </View>
        </View>
      </DossierLayout>
    );
  }

  const showVoters = currentReveal?.voters !== undefined;
  const showAuthor = currentReveal?.author !== undefined;

  return (
    <DossierLayout
      top={<CaseHeader mode="host" roomCode={roomCode} phase="كشف النتائج" />}
    >
      <View style={styles.revealContent}>
        {currentReveal ? (
          <View style={[styles.revealCard, { backgroundColor: c.cardBg, borderColor: c.cardBorder }]}>
            <Text style={[styles.revealText, { color: c.text }]}>{currentReveal.text}</Text>
            {showAuthor && currentReveal.author && (
              <View style={styles.revealMeta}>
                <FileBadge name={currentReveal.author} size="md" />
              </View>
            )}
            {showVoters && currentReveal.voters?.length > 0 && (
              <View style={styles.votersRow}>
                <Text style={[styles.boxLabel, { color: c.textMuted }]}>صوّت له:</Text>
                {(Array.isArray(currentReveal.voters) ? currentReveal.voters : []).map((v, i) => (
                  <FileBadge key={i} name={typeof v === 'object' ? v.name : v} size="sm" />
                ))}
              </View>
            )}
          </View>
        ) : (
          <ClassifiedBanner label="الحالة" variant="gold">جاري التحضير…</ClassifiedBanner>
        )}

        {/* History */}
        {revealedScenarios.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.historyScroll}>
            {revealedScenarios.map((s, i) => (
              <View key={i} style={[styles.miniCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.miniText, { color: c.text }]} numberOfLines={2}>{s.text}</Text>
                <FileBadge name={s.author || '؟'} size="sm" />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: sp.m },
  bigEmoji: { fontSize: 64 },
  card: { borderWidth: 1, borderRadius: radius.m, padding: sp.l, alignItems: 'center', gap: sp.xs, width: '100%' },
  cardLabel: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '700' },
  cardTitle: { fontSize: fontSize.heading, fontFamily: fontFamily.mono, fontWeight: '900', textAlign: 'center' },

  body: { flex: 1, gap: sp.s },

  statsCard: { borderWidth: 1, borderRadius: radius.m, padding: sp.m, gap: sp.xs },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerVal: { fontSize: fontSize.title, fontFamily: fontFamily.mono, fontWeight: '900' },
  timerLabel: { fontSize: fontSize.label, fontFamily: fontFamily.mono },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  divider: { height: 1, marginVertical: sp.xs },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.xs, marginTop: sp.xs },

  listBox: { borderWidth: 1, borderRadius: radius.m, padding: sp.m, gap: sp.xs },
  boxLabel: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '700', letterSpacing: 0.5 },
  playerList: { gap: sp.xs },
  playerStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTag: { fontSize: fontSize.small, fontFamily: fontFamily.mono, fontWeight: '700' },

  voteBarRow: {
    flexDirection: 'row', alignItems: 'center', gap: sp.s,
    borderBottomWidth: 1, paddingVertical: sp.s,
  },
  barLabel: { fontSize: fontSize.small, fontFamily: fontFamily.mono, minWidth: 60 },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barCount: { fontSize: fontSize.small, fontFamily: fontFamily.mono, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  // Results
  eliminatedRow: { flexDirection: 'row', alignItems: 'center', gap: sp.s, padding: sp.m, borderWidth: 1, borderRadius: radius.m, marginBottom: sp.s },
  winnerBanner: { borderWidth: 1.5, borderRadius: radius.m, padding: sp.m, marginBottom: sp.s, alignItems: 'center', gap: sp.xs },
  winnerTitle: { fontSize: fontSize.heading, fontFamily: fontFamily.mono, fontWeight: '900' },
  winnerReason: { fontSize: fontSize.small, fontFamily: fontFamily.mono, textAlign: 'center' },
  scoresBox: { borderWidth: 1, borderRadius: radius.m, padding: sp.m, gap: 0 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: sp.xs, borderBottomWidth: 1, paddingVertical: sp.s },
  rank: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '900', minWidth: 24 },
  teamStripe: { width: 3, height: 20, borderRadius: 1.5 },
  roleTag: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontStyle: 'italic' },
  delta: { fontSize: fontSize.small, fontFamily: fontFamily.mono, fontWeight: '700', minWidth: 30, textAlign: 'right' },
  totalScore: { fontSize: fontSize.medium, fontFamily: fontFamily.mono, fontWeight: '900', minWidth: 30, textAlign: 'right' },
  expandIcon: { fontSize: 10, marginLeft: sp.xs },
  breakdownBox: { padding: sp.s, borderRadius: radius.s, marginBottom: sp.xs, gap: 2 },
  breakdownLine: { fontSize: fontSize.small, fontFamily: fontFamily.mono },

  // Dramatic reveal
  revealContent: { flex: 1, gap: sp.s },
  revealCard: { borderWidth: 1.5, borderRadius: radius.m, padding: sp.l, gap: sp.m },
  revealText: { fontSize: fontSize.medium, fontFamily: fontFamily.mono, lineHeight: fontSize.medium * 1.5, textAlign: 'right' },
  revealMeta: { flexDirection: 'row', gap: sp.s, alignItems: 'center' },
  votersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.xs, alignItems: 'center' },
  historyScroll: { maxHeight: 100 },
  miniCard: { width: 160, borderWidth: 1, borderRadius: radius.s, padding: sp.s, marginRight: sp.s, gap: sp.xs },
  miniText: { fontSize: fontSize.small, fontFamily: fontFamily.mono, lineHeight: fontSize.small * 1.4 },

  hintCard: { borderWidth: 2, borderRadius: radius.m, padding: sp.l, maxWidth: 340 },
  hintText: { fontSize: fontSize.heading, fontFamily: fontFamily.mono, fontWeight: '700', textAlign: 'center' },
});
