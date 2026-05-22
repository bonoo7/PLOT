import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { InvestigationNote } from '../../components/InvestigationNote';
import { ProgressBar, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalInput, TerminalLayout, GlitchText, BlinkCursor, PlayerBadge } from '../components';
import { formatTime, getRoleMeta, sp, fontFamily, fontSize, getColors } from '../tokens';

export const DraftingScreen = () => {
  const { socket } = useSocket();
  const roleData = useGameStore((s) => s.roleData);
  const setRoleData = useGameStore((s) => s.setRoleData);
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
  
  const pendingAbilityResult = useGameStore((s) => s.pendingAbilityResult);
  const abilityResultSeen = useGameStore((s) => s.abilityResultSeen);
  const setAbilityResultSeen = useGameStore((s) => s.setAbilityResultSeen);
  
  const meta = getRoleMeta(roleData?.role);
  const c = getColors();

  // Drafting local states
  const [abilityUsed, setAbilityUsed] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [filledBlanks, setFilledBlanks] = useState({});

  // Offer/Abilities states
  const [witnessKeywords, setWitnessKeywords] = useState([]);
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerTargetId, setOfferTargetId] = useState(null);
  const [viaMastermind, setViaMastermind] = useState(false);
  const [offerSent, setOfferSent] = useState(false);

  const [incomingOffer, setIncomingOffer] = useState(null);
  const [proxyRequest, setProxyRequest] = useState(null);
  const [proxyTargetId, setProxyTargetId] = useState(null);
  
  const [notification, setNotification] = useState(null);

  // Reset states on round change
  useEffect(() => {
    setAbilityUsed(false);
    setTargetId(null);
    setFilledBlanks({});
    setOfferSent(false);
    setIncomingOffer(null);
    setProxyRequest(null);
  }, [currentRound]);

  // Setup sockets
  useEffect(() => {
    if (!socket) return;

    socket.on('witnessFlash', ({ keywords }) => {
      setWitnessKeywords(keywords);
      setShowWitnessModal(true);
      const timer = setTimeout(() => setShowWitnessModal(false), 2000);
      return () => clearTimeout(timer);
    });

    socket.on('receiveOffer', ({ offerId, amount }) => {
      setIncomingOffer({ id: offerId, amount });
    });

    socket.on('mastermindProxyRequest', (data) => {
      setProxyRequest(data);
    });

    socket.on('offerResult', ({ success, message }) => {
      setNotification({ text: message, variant: success ? 'success' : 'error' });
      if (success) {
        // Track offers sent in roleData
        const sentToId = offerTargetId || proxyTargetId;
        if (sentToId) {
          const target = players.find(p => p.id === sentToId);
          const prevData = useGameStore.getState().roleData;
          if (prevData && target) {
            const offersSent = [...(prevData.offersSent || []), {
              targetName: target.name,
              amount: parseInt(offerAmount) || 0
            }];
            setRoleData({ ...prevData, offersSent });
          }
        }
        setShowOfferModal(false);
        setOfferAmount('');
        setOfferTargetId(null);
        setProxyRequest(null);
      }
    });

    socket.on('offerStatus', ({ status, targetName, amountRefunded }) => {
      if (status === 'ACCEPTED') {
        setNotification({ text: `✅ قَبِلَ ${targetName || 'اللاعب'} العرض السري`, variant: 'success' });
      } else {
        setNotification({ text: `❌ رُفض العرض${amountRefunded ? ` — تم استرجاع ${amountRefunded} نقطة` : ''}`, variant: 'error' });
      }
    });

    socket.on('offerRefunded', ({ amount }) => {
      setNotification({ text: `ℹ️ استُرجع عرض بقيمة ${amount} نقطة`, variant: 'info' });
    });

    socket.on('abilityDisabled', ({ message }) => {
      setNotification({ text: `⚠️ ${message}`, variant: 'warning' });
    });

    socket.on('culpritAutoSubmit', ({ answer: culpritAnswer, message }) => {
      setAnswer(culpritAnswer);
      setIsSubmitted(true);
      setAbilityUsed(true);
      setNotification({ text: message, variant: 'warning' });
    });

    socket.on('fillBlitzBlanks', ({ blanks }) => {
      const nb = {};
      blanks.forEach((val, i) => { nb[i] = val; });
      setFilledBlanks(nb);
      if (template) {
        const parts = template.split('_____');
        let full = '';
        parts.forEach((p, i) => {
          full += p;
          if (i < parts.length - 1) full += (nb[i] || '_____');
        });
        setAnswer(full);
        setIsSubmitted(true);
        setAbilityUsed(true);
      }
    });

    return () => {
      socket.off('witnessFlash');
      socket.off('receiveOffer');
      socket.off('mastermindProxyRequest');
      socket.off('offerResult');
      socket.off('offerStatus');
      socket.off('offerRefunded');
      socket.off('abilityDisabled');
      socket.off('culpritAutoSubmit');
      socket.off('fillBlitzBlanks');
    };
  }, [socket, template, offerTargetId, proxyTargetId, offerAmount]);

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

  const handleSendOffer = () => {
    if (!socket || !offerAmount || isNaN(offerAmount)) return;
    if (!offerTargetId && !viaMastermind) return;
    if (offerSent) {
      setNotification({ text: 'أرسلت عرضاً بالفعل هذه الجولة', variant: 'error' });
      return;
    }
    socket.emit('sendOffer', {
      roomCode,
      targetId: offerTargetId,
      amount: parseInt(offerAmount),
      isViaMastermind: viaMastermind
    });
    setOfferSent(true);
  };

  const handleRespondToOffer = (accepted) => {
    if (!socket || !incomingOffer) return;
    socket.emit('respondToOffer', { roomCode, offerId: incomingOffer.id, accepted });
    setIncomingOffer(null);
  };

  const handleProxyForward = () => {
    if (!socket || !proxyTargetId || !proxyRequest) return;
    socket.emit('mastermindSelectTarget', {
      roomCode,
      targetId: proxyTargetId,
      amount: proxyRequest.amount
    });
    setProxyRequest(null);
  };

  const showAbilityControls = !isSubmitted && roleData && !abilityUsed &&
    ['DETECTIVE', 'SABOTEUR', 'SEER'].includes(roleData.role);

  const canSendOffers = !isSubmitted && roleData &&
    ['BENEFICIARY', 'MINISTER'].includes(roleData.role);

  const isCulprit = roleData?.role === 'CULPRIT';
  
  const targets = players.filter((p) => p.id !== playerId);
  const isBlitzWaiting = gameMode === 'BLITZ' && !template;
  const isBlitzActive  = gameMode === 'BLITZ' && !!template;

  const abilityLabel =
    roleData?.role === 'DETECTIVE' ? '🕵️ التحقيق السري' :
    roleData?.role === 'SABOTEUR'  ? '😈 التضليل'       : '🔮 الوحي';

  // Blitz blanks renderer
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
                  editable={!isSubmitted && !isCulprit}
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
      bottom={
        isSubmitted ? (
          <TerminalBanner variant="success" label="UPLINK" style={{ flex: 1 }}>تم إرسال إجابتك. انتظر بقية اللاعبين.</TerminalBanner>
        ) : (
          <View style={styles.bottomButtons}>
            {canSendOffers && (
              <TerminalButton
                title="💰 عرض سري"
                onPress={() => setShowOfferModal(true)}
                variant="warning"
                size="sm"
                style={{ flex: 0.4 }}
              />
            )}
            <TerminalButton
              title="إرسال التقرير"
              onPress={handleSubmit}
              disabled={answer.trim().length < 8 && roleData?.role !== 'SEER'}
              size="sm"
              style={{ flex: canSendOffers ? 0.6 : 1 }}
            />
          </View>
        )
      }
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
        onDismiss={() => setAbilityResultSeen && setAbilityResultSeen(true)}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {notification && (
            <TerminalBanner
              variant={notification.variant}
              label="SYSTEM ALERT"
              onPress={() => setNotification(null)}
            >
              {notification.text}
            </TerminalBanner>
          )}

          {/* Classified Intel Card */}
          {roleData?.secretHint && (
            <TerminalCard title="> CLASSIFIED INTEL" tone="danger">
              <TerminalBanner variant="error" label="SECRET INFO">{roleData.secretHint}</TerminalBanner>
            </TerminalCard>
          )}

          {isCulprit && (
            <TerminalBanner variant="error" label="AUTO-SUBMIT">⚠️ كجزء من دور الجاني، سيتم إرسال القصة الحقيقية تلقائياً.</TerminalBanner>
          )}

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
              placeholder={isCulprit ? "سيتم كتابة القصة تلقائياً..." : "اكتب السيناريو هنا..."}
              multiline
              numberOfLines={8}
              editable={!isSubmitted && !isCulprit}
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 1. Witness Flash Modal */}
      <Modal visible={showWitnessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { borderColor: c.warning, backgroundColor: '#000000', borderWidth: 2, padding: sp.xl }]}>
            <GlitchText text="👁️ FLASH DETECTED" style={{ color: c.warning, fontSize: fontSize.heading, textAlign: 'center', marginBottom: sp.m }} />
            <Text style={[styles.flashKeywordsText, { color: c.accentYellow }]}>
              {witnessKeywords.join(' ── ')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* 2. Incoming Offer Modal */}
      <Modal visible={!!incomingOffer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TerminalCard title="> 💰 عَرَض سِرّي وَاصِل" tone="warning" style={styles.modalContent}>
            <Text style={[styles.modalAmountText, { color: c.textPrimary }]}>{incomingOffer?.amount} نقطة</Text>
            <Text style={styles.modalSubText}>المستفيد أو الوزير يقدم لك صفقة مقابل التعاون الصامت.</Text>
            <View style={styles.modalActions}>
              <TerminalButton title="قبول ✓" onPress={() => handleRespondToOffer(true)} size="sm" style={{ flex: 1 }} />
              <TerminalButton title="رفض ✗" onPress={() => handleRespondToOffer(false)} variant="danger" size="sm" style={{ flex: 1 }} />
            </View>
          </TerminalCard>
        </View>
      </Modal>

      {/* 3. Proxy Request Modal */}
      <Modal visible={!!proxyRequest} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TerminalCard title="> 🧠 طلب وساطة سرية" tone="info" style={styles.modalContent}>
            <Text style={styles.modalSubText}>المستفيد يريد إرسال {proxyRequest?.amount} نقطة.</Text>
            <TerminalBanner variant="success" label="COMMISSION">حصتك المكتسبة: +{proxyRequest?.feeEarned} نقطة</TerminalBanner>
            
            <Text style={[styles.label, { color: c.textMuted }]}>اختر اللاعب الهدف لتوصيل العرض:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targetRow}>
              {targets.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.targetChip, proxyTargetId === p.id && styles.targetChipSelected]}
                  onPress={() => setProxyTargetId(p.id)}
                >
                  <Text style={[styles.targetText, proxyTargetId === p.id && styles.targetTextSelected]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TerminalButton title="توجيه العرض" onPress={handleProxyForward} disabled={!proxyTargetId} size="sm" style={{ flex: 1 }} />
              <TerminalButton title="تجاهل" onPress={() => setProxyRequest(null)} variant="ghost" size="sm" />
            </View>
          </TerminalCard>
        </View>
      </Modal>

      {/* 4. Offer Composer Modal */}
      <Modal visible={showOfferModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TerminalCard title="> 💸 تقديم عرض سري" tone="warning" style={styles.modalContent}>
            <TerminalInput
              label="مبلغ العرض (نقاط)"
              value={offerAmount}
              onChangeText={setOfferAmount}
              keyboardType="numeric"
              placeholder="0"
            />

            {roleData?.role === 'BENEFICIARY' && (
              <TouchableOpacity
                style={[styles.proxyToggle, viaMastermind && styles.proxyToggleSelected]}
                onPress={() => {
                  setViaMastermind(!viaMastermind);
                  setOfferTargetId(null);
                }}
              >
                <Text style={[styles.proxyToggleText, { color: viaMastermind ? c.accentYellow : c.textSub }]}>
                  {viaMastermind ? '✅ الإرسال عبر الوسيط (العقل المدبر)' : '⬜ إرسال عبر الوسيط؟'}
                </Text>
              </TouchableOpacity>
            )}

            {!viaMastermind && (
              <>
                <Text style={[styles.label, { color: c.textMuted, marginTop: sp.s }]}>اختر اللاعب المستهدف:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targetRow}>
                  {targets.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.targetChip, offerTargetId === p.id && styles.targetChipSelected]}
                      onPress={() => setOfferTargetId(p.id)}
                    >
                      <Text style={[styles.targetText, offerTargetId === p.id && styles.targetTextSelected]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.modalActions}>
              <TerminalButton
                title="إرسال العرض"
                onPress={handleSendOffer}
                disabled={!offerAmount || (!offerTargetId && !viaMastermind)}
                size="sm"
                style={{ flex: 1 }}
              />
              <TerminalButton
                title="إلغاء"
                onPress={() => {
                  setShowOfferModal(false);
                  setOfferAmount('');
                  setOfferTargetId(null);
                  setViaMastermind(false);
                }}
                variant="ghost"
                size="sm"
              />
            </View>
          </TerminalCard>
        </View>
      </Modal>

    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  body: {
    gap: sp.s,
    paddingBottom: sp.xl,
  },
  inputWrap: {
    minHeight: 140,
  },
  targetRow: {
    flexDirection: 'row',
    gap: sp.xs,
    paddingVertical: sp.xs,
  },
  targetChip: {
    paddingHorizontal: sp.s,
    paddingVertical: sp.xs,
    borderWidth: 1,
    borderColor: '#00CC33',
    borderRadius: 4,
    height: 32,
    justifyContent: 'center',
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
    color: '#FFFF00',
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
  bottomButtons: {
    flexDirection: 'row',
    gap: sp.s,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: sp.m,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 8,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    gap: sp.m,
  },
  flashKeywordsText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.title,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: fontSize.title * 1.4,
  },
  modalAmountText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.display,
    fontWeight: '900',
    textAlign: 'center',
  },
  modalSubText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    color: '#00CC33',
    textAlign: 'right',
    lineHeight: fontSize.body * 1.4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: sp.s,
    marginTop: sp.xs,
  },
  proxyToggle: {
    borderWidth: 1,
    borderColor: '#00CC33',
    padding: sp.s,
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: 'rgba(0,204,51,0.04)',
  },
  proxyToggleSelected: {
    borderColor: '#FFFF00',
    backgroundColor: 'rgba(255,255,0,0.07)',
  },
  proxyToggleText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
  },
});
