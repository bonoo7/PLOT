import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, TextInput as RNTextInput } from 'react-native';
import { 
  MinimalLayout, 
  MinimalHeader, 
  MinimalCard, 
  MinimalButton, 
  MinimalInput, 
  MinimalBadge,
  MinimalSpinner,
  MinimalTimer,
  MinimalTypewriter,
  MinimalNotification,
  MinimalStamp,
  MinimalDossier
} from '../components/minimal';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * GameScreen - Role Reveal V3
 */
export const GameScreen = ({ roleData, onReady }) => {
  const { isDesktop } = useResponsiveLayout();

  if (!roleData) {
    return (
      <MinimalLayout>
        <Text style={styles.loadingText}>جاري استلام الملف السري...</Text>
      </MinimalLayout>
    );
  }

  const { role, roleName, description, info, specialInfo } = roleData;
  const emoji = getRoleEmoji(role);

  const renderSpecialInfo = () => {
      if (!specialInfo && !info) return null;
      
      // Legacy string info
      if (typeof info === 'string') return <Text style={styles.intelText}>{info}</Text>;
      if (typeof specialInfo === 'string') return <Text style={styles.intelText}>{specialInfo}</Text>;
      if (Array.isArray(specialInfo)) return <Text style={styles.intelText}>{specialInfo.join('\n')}</Text>;

      // Object info
      if (specialInfo?.type === 'MASTERMIND_INTEL') {
          return (
              <View>
                  <Text style={styles.intelTitle}>أعضاء فريق الجريمة:</Text>
                  {specialInfo.crimeTeam.map(p => (
                      <Text key={p.id} style={styles.intelText}>• {p.name} ({p.role})</Text>
                  ))}
              </View>
          );
      }
      if (specialInfo?.type === 'MINISTER_INTEL') {
          return (
              <View>
                  <Text style={styles.intelTitle}>معلومات سرية:</Text>
                  <Text style={styles.intelText}>• المستفيد: {specialInfo.beneficiary?.name || 'غير معروف'}</Text>
                  <Text style={styles.intelText}>• المحقق: {specialInfo.detective?.name || 'غير معروف'}</Text>
              </View>
          );
      }
      if (specialInfo?.type === 'WITNESS_INTEL') {
          return (
              <View>
                  <Text style={styles.intelTitle}>كلمات مفتاحية:</Text>
                  <Text style={styles.intelText}>{specialInfo.keywords.join(' - ')}</Text>
              </View>
          );
      }
      return <Text style={styles.intelText}>{JSON.stringify(specialInfo)}</Text>;
  };

  return (
    <MinimalLayout roleData={roleData}>
      <View style={[styles.container, { maxWidth: isDesktop ? 900 : 600 }]}>
        
        {/* Top Section: Role Identity */}
        <View style={styles.identitySection}>
          {theme.roleImages && theme.roleImages[role] ? (
             <Image 
               source={theme.roleImages[role]} 
               style={styles.roleImageLarge} 
               resizeMode="contain"
             />
          ) : (
             <Text style={styles.roleEmoji}>{emoji}</Text>
          )}
          <MinimalHeader title={roleName} subtitle="هويتك السرية" />
        </View>

        {/* Content Card */}
        <MinimalCard flex style={styles.dossierCard}>
           <View style={styles.stampWrapper}>
             <MinimalBadge text="TOP SECRET" variant="primary" />
           </View>

           <View style={styles.missionSection}>
             <Text style={styles.label}>المهمة:</Text>
             <Text style={styles.missionText}>{description}</Text>
           </View>

           <View style={styles.intelSection}>
               <Text style={styles.label}>معلومات استخباراتية:</Text>
               <View style={styles.intelBox}>
                   {renderSpecialInfo()}
               </View>
           </View>
        </MinimalCard>

        {/* Action Footer */}
        <View style={styles.footer}>
          <MinimalButton
            title="فهمت المهمة - ابدأ"
            onPress={onReady}
            size="large"
            style={styles.readyBtn}
          />
        </View>

      </View>
    </MinimalLayout>
  );
};

/**
 * DraftingScreen - V3
 */
export const DraftingScreen = ({ 
  answer, 
  setAnswer, 
  onSubmit, 
  timeLeft, 
  isSubmitted,
  scenario,
  template,
  roleData,
  players,
  socket,
  roomCode,
  gameMode
}) => {
  const { isDesktop } = useResponsiveLayout();
  const [witnessKeywords, setWitnessKeywords] = useState([]);
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [abilityUsed, setAbilityUsed] = useState(false);
  
  // Blitz Mode State
  const [filledBlanks, setFilledBlanks] = useState({});
  
  // V4 Offers State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerTargetId, setOfferTargetId] = useState(null);
  const [viaMastermind, setViaMastermind] = useState(false);
  
  const [incomingOffer, setIncomingOffer] = useState(null); // { id, amount }
  const [proxyRequest, setProxyRequest] = useState(null); // { amount, feeEarned }
  const [proxyTargetId, setProxyTargetId] = useState(null);

  const [notification, setNotification] = useState({ visible: false, message: '', type: 'info' });
  const [selectedPlayerDossier, setSelectedPlayerDossier] = useState(null);

  const showNotification = (message, type = 'info') => {
      setNotification({ visible: true, message, type });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  const timerColor = timeLeft < 30 ? '#FF4444' : '#FFD700';

  // Reset ability state when round changes
  useEffect(() => {
    setAbilityUsed(false);
    setTargetId(null);
    setFilledBlanks({});
  }, [roleData?.round]);

  useEffect(() => {
    if (!socket) return;
    const handleFlash = ({ keywords }) => {
        setWitnessKeywords(keywords);
        setShowWitnessModal(true);
        setTimeout(() => setShowWitnessModal(false), 2000);
    };
    socket.on('witnessFlash', handleFlash);
    
    // Offers Listeners
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
        blanks.forEach((val, i) => {
            newBlanks[i] = val;
        });
        setFilledBlanks(newBlanks);
        
        // Reconstruct full answer
        if (template) {
            const parts = template.split('_____');
            let fullAnswer = "";
            parts.forEach((p, i) => {
              fullAnswer += p;
              if (i < parts.length - 1) {
                fullAnswer += (newBlanks[i] || "_____"); 
              }
            });
            setAnswer(fullAnswer);
            showNotification("🔮 تم كشف بعض الحقائق! أكمل الباقي بنفسك.", 'info');
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

  const handleUseAbility = () => {
    if ((!targetId && roleData?.role !== 'SEER') || abilityUsed) return;
    
    let abilityType = '';
    if (roleData?.role === 'DETECTIVE') abilityType = 'INVESTIGATE';
    else if (roleData?.role === 'SABOTEUR') abilityType = 'SABOTAGE';
    else if (roleData?.role === 'SEER') abilityType = 'REVELATION';
    
    if (abilityType) {
        socket.emit('useAbility', { 
            roomCode, 
            abilityType,
            targetId 
        });
        setAbilityUsed(true);
    }
  };

  const handleSendOffer = () => {
      if (!offerAmount || isNaN(offerAmount)) return;
      if (!offerTargetId && !viaMastermind) return;

      socket.emit('sendOffer', {
          roomCode,
          targetId: offerTargetId,
          amount: parseInt(offerAmount),
          isViaMastermind: viaMastermind
      });
  };

  const handleRespondToOffer = (accepted) => {
      if (!incomingOffer) return;
      socket.emit('respondToOffer', {
          roomCode,
          offerId: incomingOffer.id,
          accepted
      });
      setIncomingOffer(null);
  };

  const handleProxyForward = () => {
      if (!proxyTargetId || !proxyRequest) return;
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

  // Blitz Mode UI Renderer
  const renderBlitzInput = () => {
    if (!template) return null;
    
    const parts = template.split('_____');
    
    return (
      <View style={styles.blitzContainer}>
        <Text style={styles.label}>أكمل القصة:</Text>
        <View style={styles.blitzRow}>
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {/* Ensure text parts render RTL correctly */}
              <Text style={styles.blitzText}>{part}</Text>
              {index < parts.length - 1 && (
                <RNTextInput
                  style={[styles.blitzInput, isSubmitted && styles.disabledInput]}
                  value={filledBlanks[index] || ''}
                  onChangeText={(text) => {
                    const newBlanks = { ...filledBlanks, [index]: text };
                    setFilledBlanks(newBlanks);
                    
                    // Reconstruct full answer
                    let fullAnswer = "";
                    parts.forEach((p, i) => {
                      fullAnswer += p;
                      if (i < parts.length - 1) {
                        fullAnswer += (newBlanks[i] || "_____"); 
                      }
                    });
                    setAnswer(fullAnswer);
                  }}
                  placeholder="..."
                  placeholderTextColor="#666"
                  editable={!isSubmitted}
                  // Force RTL text input direction for Arabic
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
    <MinimalLayout roleData={roleData}>
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
                        <MinimalButton title="قبول" onPress={() => handleRespondToOffer(true)} style={{backgroundColor: '#4CAF50'}} />
                        <MinimalButton title="رفض" onPress={() => handleRespondToOffer(false)} style={{backgroundColor: '#F44336'}} />
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
                        style={styles.offerInputContainer}
                        inputStyle={styles.input} 
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
                        <MinimalButton title="إلغاء" onPress={() => setShowOfferModal(false)} style={{backgroundColor: '#999'}} />
                    </View>
                </View>
            </View>
        </Modal>

        {roleData?.secretHint && (
            <MinimalCard style={styles.secretHintCard}>
                <Text style={styles.secretHintTitle}>🕵️ تلميح سري للجاني:</Text>
                <Text style={styles.secretHintText}>{roleData.secretHint}</Text>
            </MinimalCard>
        )}

        <View style={styles.draftHeader}>
          <View style={styles.timerWrapper}>
             <MinimalTimer timeLeft={timeLeft} size={60} />
          </View>
          
          <MinimalHeader title="كتابة التقرير" />

          {roleData?.score > 0 && (
             <View style={styles.balanceBadge}>
                 <Text style={styles.balanceText}>💰 {roleData.score}</Text>
             </View>
          )}
        </View>

        <View style={styles.splitLayout}>
           <MinimalCard style={[styles.scenarioCard, isDesktop && styles.scenarioCardDesktop]}>
             <Text style={styles.label}>ملف القضية:</Text>
             <MinimalTypewriter 
               text={scenario || "جاري تحميل البيانات..."} 
               style={styles.scenarioText}
               speed={20}
             />
           </MinimalCard>

           <MinimalCard flex style={styles.inputCard}>
             {gameMode === 'BLITZ' ? renderBlitzInput() : (
               <MinimalInput
                 value={answer}
                 onChangeText={setAnswer}
                 placeholder={roleData?.role === 'SEER' ? "اكتب تقريرك بنفسك أو استخدم زر الوحي..." : "اكتب تبريرك هنا..."}
                 multiline
                 maxLength={500}
                 editable={!isSubmitted}
                 style={{ flex: 1, marginVertical: 0 }} // Override container margin
                 inputStyle={styles.textArea}
               />
             )}
           </MinimalCard>
        </View>

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
                                onLongPress={() => setSelectedPlayerDossier(p)} // Long press to see dossier
                            >
                                <Text style={[styles.targetText, targetId === p.id && styles.targetTextSelected]}>{p.name}</Text>
                            </TouchableOpacity>
                        ))}
                        <MinimalButton 
                            title="نفّذ" 
                            onPress={handleUseAbility} 
                            disabled={!targetId} 
                            size="small" 
                        />
                    </View>
                )}
            </View>
        )}

        {canSendOffers && (
            <View style={styles.abilityBox}>
                <Text style={styles.abilityTitle}>💰 المفاوضات</Text>
                <MinimalButton 
                    title="تقديم عرض مالي" 
                    onPress={() => setShowOfferModal(true)} 
                    size="small" 
                    style={{backgroundColor: '#DAA520'}} // Golden
                />
            </View>
        )}

        <View style={styles.footer}>
           {isSubmitted ? (
             <View style={styles.submittedBadge}>
               <Text style={styles.submittedText}>✅ تم إرسال التقرير</Text>
             </View>
           ) : (
             <View style={{ alignItems: 'center' }}>
               <MinimalStamp
                 label="إرسال"
                 onPress={onSubmit}
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

// Helper
const getRoleEmoji = (role) => {
  const map = {
    'CULPRIT': '🎭', 'FORGER': '🧩', 'INFILTRATOR': '🕵️',
    'ACCOMPLICE': '🤝', 'LAWYER': '⚖️', 'CHIEF_DETECTIVE': '🔍',
    'ANALYST': '📊', 'OFFICER': '👮', 'WITNESS': '👁️', 'SABOTEUR': '😈',
  };
  return map[role] || '👤';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingVertical: spacing.m,
    gap: spacing.m,
  },
  loadingText: {
    color: '#E8DCC8',
    fontFamily: theme.fonts.main,
    fontSize: fonts.medium,
  },
  
  // Identity Section
  identitySection: {
    alignItems: 'center',
  },
  roleImageLarge: {
    width: 120,
    height: 120,
    marginBottom: spacing.s,
  },
  roleEmoji: {
    fontSize: 60,
    marginBottom: -10,
    zIndex: 1,
  },
  
  // Dossier Card
  dossierCard: {
    backgroundColor: '#F5F5DC', // Beige file color
    borderWidth: 4,
    borderColor: '#D2B48C', // Tan border
    padding: spacing.l,
    position: 'relative',
  },
  stampWrapper: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    transform: [{ rotate: '-15deg' }],
    opacity: 0.8,
  },
  missionSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.l,
  },
  label: {
    fontFamily: theme.fonts.bold,
    color: '#8B4513',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontSize: fonts.small,
    textAlign: 'right', 
  },
  missionText: {
    fontFamily: theme.fonts.heading,
    fontSize: fonts.medium,
    color: '#2F4F4F',
    lineHeight: 28,
    textAlign: 'right', 
  },
  intelSection: {
    flex: 1,
  },
  intelBox: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: spacing.m,
    borderRightWidth: 3, 
    borderLeftWidth: 0,
    borderRightColor: '#8B4513',
    borderRadius: borderRadius.small,
  },
  intelTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: fonts.small,
    color: '#8B4513',
    marginBottom: 4,
    textAlign: 'right',
  },
  intelText: {
    fontFamily: theme.fonts.main,
    fontSize: fonts.small,
    color: '#333',
    lineHeight: 24,
    textAlign: 'right',
  },
  
  // Footer
  footer: {
    paddingTop: spacing.s,
  },
  readyBtn: {
    backgroundColor: '#2F4F4F',
    borderColor: '#1A2F2F',
  },
  
  // Drafting Styles
  draftHeader: {
    alignItems: 'center',
    position: 'relative',
    justifyContent: 'center',
  },
  timerWrapper: {
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  timerText: {
    fontFamily: theme.fonts.bold,
    fontSize: fonts.large,
    fontVariant: ['tabular-nums'],
  },
  balanceBadge: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#DAA520', // Gold
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  balanceText: {
    fontFamily: theme.fonts.bold,
    fontSize: fonts.medium,
    color: '#FFF',
  },
  
  splitLayout: {
    flex: 1,
    gap: spacing.m,
  },
  scenarioCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    maxHeight: '30%', // Limit height on mobile
  },
  scenarioCardDesktop: {
    maxHeight: '40%',
  },
  scenarioText: {
    fontFamily: theme.fonts.main,
    fontSize: fonts.small,
    color: '#333',
    lineHeight: 22,
  },
  inputCard: {
    padding: 0, // Remove padding to let input fill
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  textArea: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 0,
    fontSize: fonts.medium,
    fontFamily: theme.fonts.main,
  },
  submittedBadge: {
    backgroundColor: '#4CAF50',
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  submittedText: {
    color: '#FFF',
    fontFamily: theme.fonts.bold,
    fontSize: fonts.medium,
  },
  stampHint: {
    fontFamily: theme.fonts.main,
    fontSize: 10,
    color: '#8B4513',
    opacity: 0.7,
    marginTop: -10,
  },
  // New Styles
  flashModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  flashText: {
    color: '#FFF',
    fontSize: 32,
    fontFamily: theme.fonts.bold,
    textAlign: 'center',
  },
  abilityBox: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginTop: 10,
  },
  abilityTitle: {
    fontFamily: theme.fonts.bold,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  targetList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  targetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  targetChipSelected: {
    backgroundColor: '#2F4F4F',
    borderColor: '#2F4F4F',
  },
  targetText: {
    fontFamily: theme.fonts.main,
    color: '#333',
  },
  targetTextSelected: {
    color: '#FFF',
  },
  // Offers Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    gap: 15,
  },
  modalTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalText: {
    fontFamily: theme.fonts.main,
    fontSize: 16,
    textAlign: 'center',
  },
  amountText: {
    fontFamily: theme.fonts.bold,
    fontSize: 24,
    textAlign: 'center',
    color: '#DAA520',
    marginVertical: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 10,
    borderRadius: 5,
    fontFamily: theme.fonts.main,
    textAlign: 'right',
  },
  checkbox: {
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  checkboxSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  checkboxText: {
    fontFamily: theme.fonts.main,
  },
  // Blitz Mode Styles
  blitzContainer: {
    padding: spacing.m,
  },
  blitzRow: {
    flexDirection: 'row', 
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  blitzText: {
    fontFamily: theme.fonts.heading,
    fontSize: fonts.medium,
    color: '#2F4F4F',
    lineHeight: 40,
    textAlign: 'right',
  },
  blitzInput: {
    borderBottomWidth: 2,
    borderBottomColor: '#8B4513',
    minWidth: 80,
    maxWidth: 150,
    textAlign: 'center',
    fontFamily: theme.fonts.bold,
    fontSize: fonts.medium,
    color: '#B22222', // Red for emphasis
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 254, 247, 0.6)', // Paper-like translucent
  },
  disabledInput: {
    opacity: 0.7,
    backgroundColor: '#EEE',
  },
  secretHintCard: {
    backgroundColor: '#1A1A1A',
    borderColor: '#E74C3C',
    borderWidth: 1,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderRadius: borderRadius.medium,
  },
  secretHintTitle: {
    color: '#E74C3C',
    fontFamily: theme.fonts.bold,
    fontSize: fonts.small,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  secretHintText: {
    color: '#FFF',
    fontFamily: theme.fonts.heading, 
    fontSize: fonts.medium,
    lineHeight: 24,
  },
  stampHint: {
    fontFamily: theme.fonts.main,
    fontSize: 10,
    color: '#8B4513',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: -5,
  }
});
