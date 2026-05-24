import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { useSocket } from '../../hooks/useGameSocket';
import {
    MinimalLayout,
    MinimalHeader,
    MinimalCard,
    MinimalButton,
    MinimalInput,
    MinimalTimer,
    MinimalTypewriter,
    MinimalNotification,
    MinimalStamp,
    MinimalDossier
} from '../../components/minimal';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { gameScreenStyles as styles } from './gameScreenStyles';

/**
 * DraftingScreen - شاشة كتابة التقرير (كلاسيك وبلتز)
 * تشمل: قدرات الأدوار، نظام العروض، إدخال الفراغات (blitz)
 */
export const DraftingScreen = () => {
    const { isDesktop } = useResponsiveLayout();

    // Store
    const answer = useGameStore((state) => state.answer);
    const setAnswer = useGameStore((state) => state.setAnswer);
    const timeLeft = useGameStore((state) => state.timeLeft);
    const isSubmitted = useGameStore((state) => state.isSubmitted);
    const setIsSubmitted = useGameStore((state) => state.setIsSubmitted);
    const scenario = useGameStore((state) => state.scenario);
    const template = useGameStore((state) => state.template);
    const roleData = useGameStore((state) => state.roleData);
    const players = useGameStore((state) => state.players);
    const roomCode = useGameStore((state) => state.roomCode);
    const gameMode = useGameStore((state) => state.gameMode);
    const currentRound = useGameStore((state) => state.currentRound);

    // Socket
    const { socket } = useSocket();

    // Local state — Ability
    const [witnessKeywords, setWitnessKeywords] = useState([]);
    const [showWitnessModal, setShowWitnessModal] = useState(false);
    const [targetId, setTargetId] = useState(null);
    const [abilityUsed, setAbilityUsed] = useState(false);

    // Local state — Blitz
    const [filledBlanks, setFilledBlanks] = useState({});

    // Local state — Offers
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');
    const [offerTargetId, setOfferTargetId] = useState(null);
    const [viaMastermind, setViaMastermind] = useState(false);
    const [incomingOffer, setIncomingOffer] = useState(null);
    const [proxyRequest, setProxyRequest] = useState(null);
    const [proxyTargetId, setProxyTargetId] = useState(null);
    const [offerSent, setOfferSent] = useState(false); // حد عرض واحد كل جولة

    // Local state — UI
    const [notification, setNotification] = useState({ visible: false, message: '', type: 'info' });
    const [selectedPlayerDossier, setSelectedPlayerDossier] = useState(null);

    const showNotification = (message, type = 'info') => {
        setNotification({ visible: true, message, type });
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // إعادة تعيين الحالة عند كل جولة جديدة (currentRound من Store موثوق أكثر من roleData?.round)
    useEffect(() => {
        setAbilityUsed(false);
        setTargetId(null);
        setFilledBlanks({});
        setOfferSent(false);
    }, [currentRound]);

    // Socket events
    useEffect(() => {
        if (!socket) return;

        const handleFlash = ({ keywords }) => {
            setWitnessKeywords(keywords);
            setShowWitnessModal(true);
            setTimeout(() => setShowWitnessModal(false), 2000);
        };
        socket.on('witnessFlash', handleFlash);

        socket.on('receiveOffer', ({ offerId, amount }) => {
            setIncomingOffer({ id: offerId, amount });
        });

        socket.on('mastermindProxyRequest', (data) => {
            setProxyRequest(data);
        });

        socket.on('offerResult', ({ success, message }) => {
            showNotification(message, success ? 'success' : 'error');
            if (success) {
                setShowOfferModal(false);
                setOfferAmount('');
                setOfferTargetId(null);
                setProxyRequest(null);
            }
        });

        socket.on('offerStatus', ({ status, targetName, amountRefunded }) => {
            if (status === 'ACCEPTED') {
                showNotification(`✅ العرض تم قبوله من قبل ${targetName || 'اللاعب'}!`, 'success');
            } else {
                showNotification(`❌ العرض تم رفضه.${amountRefunded ? ` تمت إعادة ${amountRefunded} نقطة.` : ''}`, 'error');
            }
        });

        socket.on('offerRefunded', ({ amount }) => {
            showNotification(`ℹ️ تم استرجاع عرض سابق بقيمة ${amount} نقطة.`, 'info');
        });

        socket.on('abilityDisabled', ({ message }) => {
            showNotification(`⚠️ ${message}`, 'warning');
        });

        socket.on('fillBlitzBlanks', ({ blanks }) => {
            const newBlanks = {};
            blanks.forEach((val, i) => { newBlanks[i] = val; });
            setFilledBlanks(newBlanks);

            if (template) {
                const parts = template.split('_____');
                let fullAnswer = '';
                parts.forEach((p, i) => {
                    fullAnswer += p;
                    if (i < parts.length - 1) fullAnswer += (newBlanks[i] || '_____');
                });
                setAnswer(fullAnswer);
                setIsSubmitted(true);
                setAbilityUsed(true);
                showNotification(`🔮 تم اكتشاف القصة وإرسال التقرير تلقائياً! (الفراغ الأول: 70%، الثاني: 50%...)`, 'info');
            }
        });

        return () => {
            socket.off('witnessFlash', handleFlash);
            socket.off('receiveOffer');
            socket.off('mastermindProxyRequest');
            socket.off('offerResult');
            socket.off('offerStatus');
            socket.off('offerRefunded');
            socket.off('abilityDisabled');
            socket.off('fillBlitzBlanks');
        };
    }, [socket, template]);

    // ============ Handlers ============

    const handleSubmit = () => {
        if (!socket || isSubmitted) return;
        setIsSubmitted(true);
        socket.emit('submitAnswer', { roomCode, answer });
    };

    const handleUseAbility = () => {
        if (!socket || (!targetId && roleData?.role !== 'SEER') || abilityUsed) return;

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
            showNotification('⚠️ لقد أرسلت عرضاً بالفعل هذه الجولة!', 'warning');
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
        socket.emit('mastermindSelectTarget', { roomCode, targetId: proxyTargetId, amount: proxyRequest.amount });
        setProxyRequest(null);
    };

    // ============ Computed ============

    const showAbilityControls = !isSubmitted && roleData && !abilityUsed &&
        ['DETECTIVE', 'SABOTEUR', 'SEER'].includes(roleData.role);

    const canSendOffers = !isSubmitted && roleData &&
        ['BENEFICIARY', 'MINISTER'].includes(roleData.role);

    // ============ Blitz Mode Renderer ============

    const renderBlitzInput = () => {
        if (!template) return null;
        const parts = template.split('_____');

        return (
            <View style={styles.blitzContainer}>
                <Text style={styles.label}>أكمل القصة:</Text>
                <View style={styles.blitzRow}>
                    {parts.map((part, index) => (
                        <React.Fragment key={index}>
                            <Text style={styles.blitzText}>{part}</Text>
                            {index < parts.length - 1 && (
                                <RNTextInput
                                    style={[styles.blitzInput, isSubmitted && styles.disabledInput]}
                                    value={filledBlanks[index] || ''}
                                    onChangeText={(text) => {
                                        const newBlanks = { ...filledBlanks, [index]: text };
                                        setFilledBlanks(newBlanks);
                                        let fullAnswer = '';
                                        parts.forEach((p, i) => {
                                            fullAnswer += p;
                                            if (i < parts.length - 1) fullAnswer += (newBlanks[i] || '_____');
                                        });
                                        setAnswer(fullAnswer);
                                    }}
                                    placeholder="..."
                                    placeholderTextColor="#666"
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

    // ============ JSX ============

    return (
        <MinimalLayout roleData={roleData} roomCode={roomCode}>
            <View style={[styles.container, { maxWidth: isDesktop ? 1000 : 700 }]}>

                <MinimalNotification
                    visible={notification.visible}
                    message={notification.message}
                    type={notification.type}
                    onDismiss={() => setNotification(prev => ({ ...prev, visible: false }))}
                />

                <MinimalDossier
                    player={selectedPlayerDossier}
                    visible={!!selectedPlayerDossier}
                    onClose={() => setSelectedPlayerDossier(null)}
                />

                {/* Witness Keywords Flash Modal */}
                <Modal visible={showWitnessModal} transparent animationType="fade">
                    <View style={styles.flashModal}>
                        <Text style={styles.flashText}>{witnessKeywords.join(' - ')}</Text>
                    </View>
                </Modal>

                {/* Incoming Offer Modal */}
                <Modal visible={!!incomingOffer} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>💰 عرض سري!</Text>
                            <Text style={styles.modalText}>لقد وصلك عرض بقيمة:</Text>
                            <Text style={styles.amountText}>{incomingOffer?.amount} نقطة</Text>
                            <View style={styles.modalButtons}>
                                <MinimalButton title="قبول" onPress={() => handleRespondToOffer(true)} style={{ backgroundColor: '#4CAF50' }} />
                                <MinimalButton title="رفض" onPress={() => handleRespondToOffer(false)} style={{ backgroundColor: '#F44336' }} />
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Mastermind Proxy Modal */}
                <Modal visible={!!proxyRequest} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>🧠 طلب وساطة</Text>
                            <Text style={styles.modalText}>المستفيد يريد إرسال {proxyRequest?.amount} نقطة.</Text>
                            <Text style={styles.modalText}>لقد حصلت على حصتك: {proxyRequest?.feeEarned} نقطة.</Text>
                            <Text style={styles.label}>اختر المستلم:</Text>
                            <View style={styles.targetList}>
                                {players?.filter(p => p.id !== socket?.id).map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[styles.targetChip, proxyTargetId === p.id && styles.targetChipSelected]}
                                        onPress={() => setProxyTargetId(p.id)}
                                    >
                                        <Text style={[styles.targetText, proxyTargetId === p.id && styles.targetTextSelected]}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <MinimalButton title="إرسال العرض" onPress={handleProxyForward} disabled={!proxyTargetId} />
                        </View>
                    </View>
                </Modal>

                {/* Offer Composer Modal */}
                <Modal visible={showOfferModal} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>💸 تقديم عرض</Text>

                            <Text style={styles.label}>المبلغ:</Text>
                            <MinimalInput
                                keyboardType="numeric"
                                value={offerAmount}
                                onChangeText={setOfferAmount}
                                placeholder="أدخل المبلغ"
                            />

                            {roleData?.role === 'BENEFICIARY' && (
                                <TouchableOpacity
                                    style={[styles.checkbox, viaMastermind && styles.checkboxSelected]}
                                    onPress={() => setViaMastermind(!viaMastermind)}
                                >
                                    <Text style={styles.checkboxText}>{viaMastermind ? '✅ عبر الوسيط (العقل المدبر)' : '⬜ عبر الوسيط (العقل المدبر)'}</Text>
                                </TouchableOpacity>
                            )}

                            {!viaMastermind && (
                                <>
                                    <Text style={styles.label}>المستلم:</Text>
                                    <View style={styles.targetList}>
                                        {players?.filter(p => p.id !== socket?.id).map(p => (
                                            <TouchableOpacity
                                                key={p.id}
                                                style={[styles.targetChip, offerTargetId === p.id && styles.targetChipSelected]}
                                                onPress={() => setOfferTargetId(p.id)}
                                                onLongPress={() => setSelectedPlayerDossier(p)}
                                            >
                                                <Text style={[styles.targetText, offerTargetId === p.id && styles.targetTextSelected]}>{p.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}

                            <View style={styles.modalButtons}>
                                <MinimalButton title="إرسال" onPress={handleSendOffer} disabled={!offerAmount || (!offerTargetId && !viaMastermind)} />
                                <MinimalButton title="إلغاء" onPress={() => setShowOfferModal(false)} style={{ backgroundColor: '#999' }} />
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Secret Hint for Culprit */}
                {roleData?.secretHint && (
                    <MinimalCard style={styles.secretHintCard}>
                        <Text style={styles.secretHintTitle}>🕵️ تلميح سري للجاني:</Text>
                        <Text style={styles.secretHintText}>{roleData.secretHint}</Text>
                    </MinimalCard>
                )}

                {/* Header + Timer */}
                <View style={styles.draftHeader}>
                    <View style={styles.timerWrapper}>
                        <MinimalTimer timeLeft={timeLeft} size={60} />
                    </View>
                    <MinimalHeader title="كتابة التقرير" />
                </View>

                {/* Scenario + Input */}
                <View style={styles.splitLayout}>
                    <MinimalCard style={[styles.scenarioCard, isDesktop && styles.scenarioCardDesktop]}>
                        <Text style={styles.label}>ملف القضية:</Text>
                        <MinimalTypewriter
                            text={scenario || 'جاري تحميل البيانات...'}
                            style={styles.scenarioText}
                            speed={20}
                        />
                    </MinimalCard>

                    <MinimalCard flex style={styles.inputCard}>
                        {template
                            ? renderBlitzInput()
                            : <Text style={styles.blitzWaiting}>⏳ جاري تحميل النموذج...</Text>}
                    </MinimalCard>
                </View>

                {/* Ability Controls */}
                {showAbilityControls && (
                    <View style={styles.abilityBox}>
                        <Text style={styles.abilityTitle}>
                            {roleData.role === 'DETECTIVE' ? '🕵️ التحقيق السري' :
                                roleData.role === 'SABOTEUR' ? '😈 التضليل' : '🔮 الوحي'}
                        </Text>

                        {roleData.role === 'SEER' ? (
                            <MinimalButton title="استخدام الوحي (إرسال القصة الحقيقية)" onPress={handleUseAbility} size="small" />
                        ) : (
                            <View style={styles.targetList}>
                                {players?.filter(p => p.id !== socket?.id).map(p => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[styles.targetChip, targetId === p.id && styles.targetChipSelected]}
                                        onPress={() => setTargetId(p.id)}
                                        onLongPress={() => setSelectedPlayerDossier(p)}
                                    >
                                        <Text style={[styles.targetText, targetId === p.id && styles.targetTextSelected]}>{p.name}</Text>
                                    </TouchableOpacity>
                                ))}
                                <MinimalButton title="نفّذ" onPress={handleUseAbility} disabled={!targetId} size="small" />
                            </View>
                        )}
                    </View>
                )}

                {/* Offers Button */}
                {canSendOffers && (
                    <View style={styles.abilityBox}>
                        <Text style={styles.abilityTitle}>💰 المفاوضات</Text>
                        <MinimalButton
                            title="تقديم عرض مالي"
                            onPress={() => setShowOfferModal(true)}
                            size="small"
                            style={{ backgroundColor: '#DAA520' }}
                        />
                    </View>
                )}

                {/* Submit Section */}
                <View style={styles.footer}>
                    {isSubmitted ? (
                        <View style={styles.submittedBadge}>
                            <Text style={styles.submittedText}>✅ تم إرسال التقرير</Text>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <MinimalStamp
                                label="إرسال"
                                onPress={handleSubmit}
                                disabled={(answer.trim().length < 5 && roleData?.role !== 'SEER')}
                                color="#B22222"
                            />
                            <Text style={styles.stampHint}>اضغط للختم والإرسال</Text>
                        </View>
                    )}
                </View>

            </View>
        </MinimalLayout>
    );
};
