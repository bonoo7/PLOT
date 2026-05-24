/**
 * design-v2/screens/DraftingScreen.js
 * Writing phase — full + blitz modes, keyboard-safe layout
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput as RNTextInput, Keyboard, Platform, ScrollView
} from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import { DossierLayout, DossierCard, StampButton, FileBadge, CaseHeader, SecretInput, ClassifiedBanner } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';
import { InvestigationNote } from '../../components/InvestigationNote';

const getRoleEmoji = (role) => {
  const map = {
    CULPRIT:'🎭', DETECTIVE:'🕵️', WITNESS:'👁️', SABOTEUR:'🧨',
    MINISTER:'📜', BENEFICIARY:'💰', SEER:'🔮', MASTERMIND:'🧠',
  };
  return map[role] || '👤';
};

export const DraftingScreen = () => {
  const { isLandscape } = useLayout();
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);

  // Store
  const answer       = useGameStore(s => s.answer);
  const setAnswer    = useGameStore(s => s.setAnswer);
  const timeLeft     = useGameStore(s => s.timeLeft);
  const isSubmitted  = useGameStore(s => s.isSubmitted);
  const setIsSubmitted = useGameStore(s => s.setIsSubmitted);
  const scenario     = useGameStore(s => s.scenario);
  const template     = useGameStore(s => s.template);
  const roleData     = useGameStore(s => s.roleData);
  const setRoleData  = useGameStore(s => s.setRoleData);
  const players      = useGameStore(s => s.players) || [];
  const roomCode     = useGameStore(s => s.roomCode);
  const gameMode     = useGameStore(s => s.gameMode);
  const myName       = useGameStore(s => s.playerName);
  const pendingAbilityResult = useGameStore(s => s.pendingAbilityResult);
  const abilityResultSeen    = useGameStore(s => s.abilityResultSeen);
  const setAbilityResultSeen = useGameStore(s => s.setAbilityResultSeen);
  const { socket }   = useSocket();

  // State
  const [witnessKeywords, setWitnessKeywords]     = useState([]);
  const [showWitnessModal, setShowWitnessModal]   = useState(false);
  const [targetId, setTargetId]                   = useState(null);
  const [abilityUsed, setAbilityUsed]             = useState(false);
  const [filledBlanks, setFilledBlanks]           = useState({});
  const [showOfferModal, setShowOfferModal]       = useState(false);
  const [offerAmount, setOfferAmount]             = useState('');
  const [offerTargetId, setOfferTargetId]         = useState(null);
  const [viaMastermind, setViaMastermind]         = useState(false);
  const [incomingOffer, setIncomingOffer]         = useState(null);
  const [proxyRequest, setProxyRequest]           = useState(null);
  const [proxyTargetId, setProxyTargetId]         = useState(null);
  const [offerSent, setOfferSent]                 = useState(false);
  const [notification, setNotification]           = useState(null);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerStr = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  const timerAlert = timeLeft <= 30;

  useEffect(() => {
    setAbilityUsed(false);
    setTargetId(null);
    setFilledBlanks({});
    setOfferSent(false);
  }, [roleData?.round]);

  // Socket
  useEffect(() => {
    if (!socket) return;
    socket.on('witnessFlash', ({ keywords }) => {
      setWitnessKeywords(keywords);
      setShowWitnessModal(true);
      setTimeout(() => setShowWitnessModal(false), 2000);
    });
    socket.on('receiveOffer', ({ offerId, amount }) => setIncomingOffer({ id: offerId, amount }));
    socket.on('mastermindProxyRequest', setProxyRequest);
    socket.on('offerResult', ({ success, message }) => {
      setNotification({ text: message, ok: success });
      if (success) {
        // تتبع العروض المُرسلة في ملف الدور
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
        setShowOfferModal(false); setOfferAmount(''); setOfferTargetId(null); setProxyRequest(null);
      }
    });
    socket.on('offerStatus', ({ status, targetName, amountRefunded }) => {
      if (status === 'ACCEPTED') setNotification({ text: `✅ قَبِلَ ${targetName || 'اللاعب'} العرض`, ok: true });
      else setNotification({ text: `❌ رُفض العرض${amountRefunded ? ` — استرجعت ${amountRefunded} نقطة` : ''}`, ok: false });
    });
    socket.on('offerRefunded', ({ amount }) => setNotification({ text: `ℹ️ استُرجع عرض بقيمة ${amount} نقطة`, ok: null }));
    socket.on('abilityDisabled', ({ message }) => setNotification({ text: `⚠️ ${message}`, ok: false }));
    socket.on('fillBlitzBlanks', ({ blanks }) => {
      const nb = {};
      blanks.forEach((val, i) => { nb[i] = val; });
      setFilledBlanks(nb);
      if (template) {
        const parts = template.split('_____');
        let full = '';
        parts.forEach((p, i) => { full += p; if (i < parts.length - 1) full += (nb[i] || '_____'); });
        setAnswer(full);
        setIsSubmitted(true);
        setAbilityUsed(true);
      }
    });
    return () => {
      ['witnessFlash','receiveOffer','mastermindProxyRequest','offerResult','offerStatus','offerRefunded','abilityDisabled','fillBlitzBlanks']
        .forEach(e => socket.off(e));
    };
  }, [socket, template]);

  // Handlers
  const handleSubmit = () => {
    if (!socket || isSubmitted) return;
    setIsSubmitted(true);
    socket.emit('submitAnswer', { roomCode, answer });
  };

  const handleUseAbility = () => {
    if (!socket || (!targetId && roleData?.role !== 'SEER') || abilityUsed) return;
    const map = { DETECTIVE:'INVESTIGATE', SABOTEUR:'SABOTAGE', SEER:'REVELATION' };
    const abilityType = map[roleData?.role];
    if (abilityType) { socket.emit('useAbility', { roomCode, abilityType, targetId }); setAbilityUsed(true); }
  };

  const handleSendOffer = () => {
    if (!socket || !offerAmount || isNaN(offerAmount)) return;
    if (!offerTargetId && !viaMastermind) return;
    if (offerSent) { setNotification({ text: 'أرسلت عرضاً بالفعل هذه الجولة', ok: false }); return; }
    socket.emit('sendOffer', { roomCode, targetId: offerTargetId, amount: parseInt(offerAmount), isViaMastermind: viaMastermind });
    setOfferSent(true);
  };

  const handleRespondToOffer = (accepted) => {
    if (!socket || !incomingOffer) return;
    socket.emit('respondToOffer', { roomCode, offerId: incomingOffer.id, accepted });
    setIncomingOffer(null);
  };

  const handleProxyForward = () => {
    if (!socket || !proxyTargetId || !proxyRequest) return;
    socket.emit('mastermindSelectTarget', { roomCode, targetId: proxyTargetId, amount: proxyRequest.amount });
    setProxyRequest(null);
  };

  const showAbilityControls = !isSubmitted && roleData && !abilityUsed &&
    ['DETECTIVE','SABOTEUR','SEER'].includes(roleData.role);
  const canSendOffers = !isSubmitted && roleData &&
    ['BENEFICIARY','MINISTER'].includes(roleData.role);

  const emoji = getRoleEmoji(roleData?.role);

  // Blitz blanks renderer
  const renderBlitzInput = () => {
    if (!template) return null;
    const parts = template.split('_____');
    return (
      <View style={styles.blitzWrap}>
        <Text style={[styles.blitzLabel, { color: c.textMuted }]}>أكمل القصة:</Text>
        <View style={styles.blitzRow}>
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              <Text style={[styles.blitzText, { color: c.text }]}>{part}</Text>
              {i < parts.length - 1 && (
                <RNTextInput
                  style={[styles.blitzInput, { borderColor: c.accent, color: c.text, backgroundColor: c.cardBg }]}
                  value={filledBlanks[i] || ''}
                  onChangeText={t => {
                    const nb = { ...filledBlanks, [i]: t };
                    setFilledBlanks(nb);
                    let full = '';
                    parts.forEach((p, j) => { full += p; if (j < parts.length - 1) full += (nb[j] || '_____'); });
                    setAnswer(full);
                  }}
                  placeholder="..."
                  placeholderTextColor={c.textMuted}
                  editable={!isSubmitted}
                  textAlign="center"
                />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  return (
    <DossierLayout
      top={
        <CaseHeader
          mode="player"
          roomCode={roomCode}
          roleName={roleData?.roleName}
          roleEmoji={emoji}
          playerId={myName}
          extra={
            <View style={[styles.timerPill, { backgroundColor: timerAlert ? c.accent : c.surface, borderColor: timerAlert ? c.accent : c.border }]}>
              <Text style={[styles.timerText, { color: timerAlert ? '#fff' : c.text }]}>{timerStr}</Text>
            </View>
          }
        />
      }
      bottom={
        isSubmitted
          ? <ClassifiedBanner label="تم الإرسال" variant="success" style={{ flex: 1 }}>✅ في انتظار اللاعبين الآخرين…</ClassifiedBanner>
          : (
            <View style={styles.footerRow}>
              {showAbilityControls && (
                <StampButton
                  title={roleData.role === 'DETECTIVE' ? '🕵️ تحقق' : roleData.role === 'SABOTEUR' ? '🧨 تضليل' : '🔮 وحي'}
                  onPress={handleUseAbility}
                  variant="secondary"
                  size="sm"
                  disabled={!targetId && roleData?.role !== 'SEER'}
                />
              )}
              {canSendOffers && (
                <StampButton
                  title="💰 عرض"
                  onPress={() => setShowOfferModal(true)}
                  variant="secondary"
                  size="sm"
                />
              )}
              <StampButton
                title="ختم وإرسال ✓"
                onPress={handleSubmit}
                variant="primary"
                size="sm"
                disabled={!isSubmitted && answer.trim().length < 5 && roleData?.role !== 'SEER'}
                style={{ flex: 1 }}
              />
            </View>
          )
      }
    >
      {/* Ability result modal */}
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

      {/* Notification toast */}
      {notification && (
        <TouchableOpacity onPress={() => setNotification(null)} activeOpacity={0.8}>
          <View style={[styles.toast, { backgroundColor: notification.ok === true ? '#2d5a27' : notification.ok === false ? '#5a2727' : c.surface, borderColor: c.border }]}>
            <Text style={[styles.toastText, { color: c.text }]}>{notification.text}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Witness Flash */}
      <Modal visible={showWitnessModal} transparent animationType="fade">
        <View style={styles.flashOverlay}>
          <View style={[styles.flashBox, { backgroundColor: c.cardBg, borderColor: c.gold }]}>
            <Text style={[styles.flashText, { color: c.gold }]}>{witnessKeywords.join(' — ')}</Text>
          </View>
        </View>
      </Modal>

      {/* Incoming Offer */}
      <Modal visible={!!incomingOffer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: c.cardBg, borderColor: c.gold }]}>
            <Text style={[styles.modalTitle, { color: c.gold }]}>💰 عرض سري وصلك</Text>
            <Text style={[styles.modalAmount, { color: c.text }]}>{incomingOffer?.amount} نقطة</Text>
            <View style={styles.modalBtns}>
              <StampButton title="قبول ✓" onPress={() => handleRespondToOffer(true)} variant="primary" size="sm" style={{ flex: 1 }} />
              <StampButton title="رفض ✗" onPress={() => handleRespondToOffer(false)} variant="danger" size="sm" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Proxy Request */}
      <Modal visible={!!proxyRequest} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>🧠 طلب وساطة</Text>
            <Text style={[styles.modalSub, { color: c.textSub }]}>المستفيد يريد إرسال {proxyRequest?.amount} نقطة</Text>
            <Text style={[styles.modalSub, { color: c.gold }]}>حصتك: {proxyRequest?.feeEarned} نقطة</Text>
            <View style={styles.chipRow}>
              {players.filter(p => p.id !== socket?.id).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, { borderColor: proxyTargetId === p.id ? c.accent : c.border, backgroundColor: proxyTargetId === p.id ? c.accent : 'transparent' }]}
                  onPress={() => setProxyTargetId(p.id)}
                >
                  <Text style={[styles.chipText, { color: proxyTargetId === p.id ? '#fff' : c.textSub }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <StampButton title="إرسال" onPress={handleProxyForward} disabled={!proxyTargetId} variant="primary" size="sm" />
          </View>
        </View>
      </Modal>

      {/* Offer Composer */}
      <Modal visible={showOfferModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>💸 تقديم عرض</Text>
            <SecretInput label="المبلغ" value={offerAmount} onChangeText={setOfferAmount} keyboardType="numeric" placeholder="0" />
            {roleData?.role === 'BENEFICIARY' && (
              <TouchableOpacity style={[styles.chip, { borderColor: viaMastermind ? c.gold : c.border, backgroundColor: viaMastermind ? c.gold + '33' : 'transparent' }]} onPress={() => setViaMastermind(!viaMastermind)}>
                <Text style={[styles.chipText, { color: c.textSub }]}>{viaMastermind ? '✅' : '⬜'} عبر الوسيط</Text>
              </TouchableOpacity>
            )}
            {!viaMastermind && (
              <View style={styles.chipRow}>
                {players.filter(p => p.id !== socket?.id).map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, { borderColor: offerTargetId === p.id ? c.accent : c.border, backgroundColor: offerTargetId === p.id ? c.accent : 'transparent' }]}
                    onPress={() => setOfferTargetId(p.id)}
                  >
                    <Text style={[styles.chipText, { color: offerTargetId === p.id ? '#fff' : c.textSub }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.modalBtns}>
              <StampButton title="إرسال" onPress={handleSendOffer} disabled={!offerAmount || (!offerTargetId && !viaMastermind)} variant="primary" size="sm" style={{ flex: 1 }} />
              <StampButton title="إلغاء" onPress={() => setShowOfferModal(false)} variant="ghost" size="sm" />
            </View>
          </View>
        </View>
      </Modal>

      {/* Main content: scenario + input + ability target selector */}
      <View style={[styles.main, isLandscape && styles.mainLandscape]}>

        {/* Scenario block */}
        <View style={[
          styles.scenarioBlock,
          { borderColor: c.cardBorder, backgroundColor: c.cardBg },
          isLandscape && styles.scenarioBlockLandscape,
        ]}>
          <Text style={[styles.scenarioLabel, { color: c.gold }]}>
            {scenario ? `📁 ${scenario}` : 'ملف القضية'}
          </Text>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={[styles.scenarioText, { color: c.text }]}>{scenario || '…'}</Text>
          </ScrollView>
        </View>

        {/* Input block */}
        <View style={[
          styles.inputBlock,
          { borderColor: c.cardBorder, backgroundColor: c.cardBg },
          isLandscape && styles.scenarioBlockLandscape,
        ]}>
          {renderBlitzInput()}
        </View>

        {/* Ability target chips */}
        {showAbilityControls && roleData?.role !== 'SEER' && (
          <View style={[styles.abilityBlock, { borderColor: c.border }]}>
            <Text style={[styles.scenarioLabel, { color: c.textMuted }]}>
              {roleData.role === 'DETECTIVE' ? '🕵️ اختر هدف التحقيق' : '🧨 اختر هدف التضليل'}
            </Text>
            <View style={styles.chipRow}>
              {players.filter(p => p.id !== socket?.id).map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, { borderColor: targetId === p.id ? c.accent : c.border, backgroundColor: targetId === p.id ? c.accent : 'transparent' }]}
                  onPress={() => setTargetId(p.id)}
                >
                  <Text style={[styles.chipText, { color: targetId === p.id ? '#fff' : c.textSub }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  footerRow: { flex: 1, flexDirection: 'row', gap: sp.xs, alignItems: 'center' },

  toast: { borderWidth: 1, borderRadius: radius.s, padding: sp.s, marginBottom: sp.xs },
  toastText: { fontSize: fontSize.small, fontFamily: fontFamily.mono, textAlign: 'right' },

  timerPill: {
    paddingHorizontal: sp.s, paddingVertical: 2,
    borderRadius: radius.pill, borderWidth: 1,
    minWidth: 50, alignItems: 'center',
  },
  timerText: { fontSize: fontSize.medium, fontFamily: fontFamily.mono, fontWeight: '700' },

  main: { flex: 1, gap: sp.s },
  mainLandscape: { flexDirection: 'row' },

  scenarioBlock: {
    borderWidth: 1, borderRadius: radius.m,
    padding: sp.m, gap: sp.xs,
    maxHeight: 110,         // compact — just enough to show scenario
  },
  scenarioBlockLandscape: {
    flex: 1,
    maxHeight: undefined,   // remove constraint in landscape (side by side)
  },
  inputBlock: {
    flex: 1, borderWidth: 1, borderRadius: radius.m,
    padding: sp.m, gap: sp.xs,
    minHeight: 100,         // writing area gets all remaining space
  },
  scenarioLabel: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '700', letterSpacing: 0.5 },
  scenarioText: { fontSize: fontSize.body, fontFamily: fontFamily.mono, lineHeight: fontSize.body * 1.5, textAlign: 'right' },
  textArea: {
    flex: 1, borderWidth: 1, borderRadius: radius.s,
    padding: sp.s, fontSize: fontSize.body, fontFamily: fontFamily.mono,
    lineHeight: fontSize.body * 1.55,
    minHeight: 80,
  },

  abilityBlock: {
    borderWidth: 1, borderRadius: radius.m,
    padding: sp.m, gap: sp.xs,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.xs },
  chip: { paddingHorizontal: sp.s, paddingVertical: sp.xs, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontSize: fontSize.small, fontFamily: fontFamily.mono },

  // Blitz
  blitzWrap: { flex: 1 },
  blitzLabel: { fontSize: fontSize.label, fontFamily: fontFamily.mono, fontWeight: '700', marginBottom: sp.xs },
  blitzRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 2 },
  blitzText: { fontSize: fontSize.body, fontFamily: fontFamily.mono },
  blitzInput: {
    minWidth: 60, maxWidth: 100, height: 28,
    borderBottomWidth: 2, padding: 2,
    fontSize: fontSize.body, fontFamily: fontFamily.mono, textAlign: 'center',
  },

  // Modals
  flashOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  flashBox: { padding: sp.l, borderRadius: radius.m, borderWidth: 2, maxWidth: 300 },
  flashText: { fontSize: fontSize.heading, fontFamily: fontFamily.mono, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { borderTopWidth: 2, borderTopLeftRadius: radius.l, borderTopRightRadius: radius.l, padding: sp.l, gap: sp.m },
  modalTitle: { fontSize: fontSize.heading, fontFamily: fontFamily.mono, fontWeight: '900', textAlign: 'right' },
  modalSub: { fontSize: fontSize.body, fontFamily: fontFamily.mono, textAlign: 'right' },
  modalAmount: { fontSize: 32, fontFamily: fontFamily.mono, fontWeight: '900', textAlign: 'center' },
  modalBtns: { flexDirection: 'row', gap: sp.s },
});
