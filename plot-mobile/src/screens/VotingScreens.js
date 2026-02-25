import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalCard from '../components/minimal/MinimalCard';
import MinimalButton from '../components/minimal/MinimalButton';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius, moderateScale } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * QualityVotingScreen - V3
 */
export const QualityVotingScreen = ({ 
  scenarios = [], 
  onVote, 
  hasVoted = false,
  selectedScenario = null,
  roleData,
  myAnswer
}) => {
  const { isDesktop } = useResponsiveLayout();
  const [selected, setSelected] = useState(selectedScenario);

  const handleVote = () => {
    if (selected !== null) onVote(selected);
  };

  return (
    <MinimalLayout roleData={roleData}>
      <View style={[styles.container, { maxWidth: isDesktop ? 1000 : 700 }]}>
        <MinimalHeader title="التقييم" subtitle="اختر أفضل سيناريو" />

        {/* Scenarios Grid/List - Using ScrollView here as lists can be long, 
            but kept minimal visuals */}
        <View style={styles.listContainer}>
           <ScrollView 
             showsVerticalScrollIndicator={true}
             contentContainerStyle={styles.gridContent}
           >
             {scenarios.map((scenario, index) => {
               const isSelf = scenario.answer === myAnswer;
               return (
                 <TouchableOpacity
                   key={index}
                   style={[
                     styles.voteCard,
                     selected === index && styles.voteCardSelected,
                     hasVoted && styles.voteCardDisabled,
                     isSelf && styles.voteCardSelf,
                     isDesktop && styles.voteCardDesktop
                   ]}
                   onPress={() => !hasVoted && !isSelf && setSelected(index)}
                   activeOpacity={0.8}
                   disabled={hasVoted || isSelf}
                 >
                   <View style={styles.cardHeader}>
                     <Text style={styles.cardIndex}>#{index + 1}</Text>
                     {selected === index && !hasVoted && <Text style={styles.checkMark}>✓</Text>}
                   </View>
                   <Text style={styles.scenarioText}>
                     {scenario.answer || scenario.text || '...'}
                   </Text>
                   {isSelf && <Text style={styles.selfVoteLabel}>تصويتك</Text>}
                 </TouchableOpacity>
               );
             })}
           </ScrollView>
        </View>

        <View style={styles.footer}>
          {hasVoted ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>تم تسجيل صوتك ✅</Text>
            </View>
          ) : (
            <MinimalButton
              title="تأكيد التصويت"
              onPress={handleVote}
              disabled={selected === null}
              size="large"
              style={styles.voteBtn}
            />
          )}
        </View>
      </View>
    </MinimalLayout>
  );
};

/**
 * CulpritVotingScreen - V3
 */
export const CulpritVotingScreen = ({ 
  scenarios = [], 
  onVote, 
  hasVoted = false, 
  selectedCulprit = null,
  roleData,
  myPlayerId
}) => {
  const { isDesktop } = useResponsiveLayout();
  const [selected, setSelected] = useState(selectedCulprit);

  const handleVote = () => {
    if (selected !== null) onVote(selected);
  };

  return (
    <MinimalLayout roleData={roleData}>
      <View style={[styles.container, { maxWidth: isDesktop ? 1000 : 700 }]}>
        <View style={styles.dangerHeader}>
           <MinimalHeader title="من الجاني؟" subtitle="اكشف الحقيقة" />
        </View>

        <View style={styles.listContainer}>
           <ScrollView 
             showsVerticalScrollIndicator={true}
             contentContainerStyle={styles.gridContent}
           >
             {scenarios.map((scenario, index) => {
               const isSelf = scenario.playerId === myPlayerId;
               return (
                 <TouchableOpacity
                   key={index}
                   style={[
                     styles.voteCard,
                     selected === index && styles.voteCardSelectedDanger,
                     hasVoted && styles.voteCardDisabled,
                     isSelf && styles.voteCardSelf,
                     isDesktop && styles.voteCardDesktop
                   ]}
                   onPress={() => !hasVoted && !isSelf && setSelected(index)}
                   activeOpacity={0.8}
                   disabled={hasVoted || isSelf}
                 >
                   <View style={styles.cardHeader}>
                     <View style={styles.authorBadge}>
                        <Text style={styles.authorIcon}>👤</Text>
                        <Text style={styles.authorName}>{scenario.playerName || scenario.author || 'مجهول'}</Text>
                     </View>
                     {selected === index && !hasVoted && <Text style={styles.checkMarkDanger}>🎯</Text>}
                   </View>
                   <Text style={styles.scenarioText}>
                     {scenario.answer || scenario.text || '...'}
                   </Text>
                   {isSelf && <Text style={styles.selfVoteLabel}>تصويتك</Text>}
                 </TouchableOpacity>
               );
             })}
           </ScrollView>
        </View>

        <View style={styles.footer}>
          {hasVoted ? (
            <View style={[styles.statusBadge, styles.statusBadgeDanger]}>
              <Text style={styles.statusText}>تم توجيه الاتهام ⚖️</Text>
            </View>
          ) : (
            <MinimalButton
              title="توجيه الاتهام"
              onPress={handleVote}
              disabled={selected === null}
              variant="secondary" // Use danger/secondary color
              size="large"
              style={styles.voteBtnDanger}
            />
          )}
        </View>
      </View>
    </MinimalLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingVertical: spacing.m,
    gap: spacing.m,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: borderRadius.medium,
    padding: spacing.s,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    paddingBottom: spacing.l,
  },
  
  // Vote Card
  voteCard: {
    width: '100%', // Mobile: Stack vertically
    backgroundColor: '#FDF5E6', // Old lace
    borderRadius: borderRadius.small,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: '#D2B48C',
  },
  voteCardDesktop: {
    width: '48%', // Desktop: 2 columns
  },
  voteCardSelected: {
    borderColor: '#2D5F2E',
    borderWidth: 2,
    backgroundColor: '#F0FFF0',
    transform: [{ scale: 1.02 }],
  },
  voteCardSelectedDanger: {
    borderColor: '#FF4444',
    borderWidth: 2,
    backgroundColor: '#FFF0F0',
    transform: [{ scale: 1.02 }],
  },
  voteCardDisabled: {
    opacity: 0.6,
  },
  voteCardSelf: {
    opacity: 0.5,
    backgroundColor: '#E8E8E8',
    borderColor: '#999',
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardIndex: {
    fontFamily: theme.fonts.bold,
    color: '#8B4513',
  },
  checkMark: {
    color: '#2D5F2E',
    fontWeight: 'bold',
    fontSize: 18,
  },
  checkMarkDanger: {
    fontSize: 16,
  },
  scenarioText: {
    fontFamily: theme.fonts.main,
    fontSize: fonts.small,
    color: '#333',
    lineHeight: 20,
  },
  selfVoteLabel: {
    marginTop: spacing.s,
    fontSize: fonts.tiny,
    color: '#999',
    fontStyle: 'italic',
    fontFamily: theme.fonts.main,
  },
  
  // Author Badge
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: borderRadius.small,
  },
  authorIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  authorName: {
    fontSize: fonts.tiny,
    fontFamily: theme.fonts.bold,
    color: '#555',
  },
  
  // Footer
  footer: {
    paddingTop: spacing.s,
  },
  statusBadge: {
    backgroundColor: '#2D5F2E',
    padding: spacing.m,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  statusBadgeDanger: {
    backgroundColor: '#8B0000',
  },
  statusText: {
    color: '#FFF',
    fontFamily: theme.fonts.bold,
    fontSize: fonts.medium,
  },
  voteBtn: {
    backgroundColor: theme.colors.primary,
  },
  voteBtnDanger: {
    backgroundColor: '#8B0000', // Dark Red
    borderColor: '#FF0000',
  },
  dangerHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,0,0,0.3)',
    paddingBottom: spacing.s,
  }
});

/**
 * WaitingRevealScreen - V3
 */
export const WaitingRevealScreen = ({ message = "انتظر قليلاً...", roleData }) => {
    return (
      <MinimalLayout roleData={roleData}>
        <View style={styles.centerContainer}>
            <Text style={styles.waitingTitle}>⏳</Text>
            <Text style={styles.waitingText}>{message}</Text>
        </View>
      </MinimalLayout>
    );
};

/**
 * EndScreen - V3
 */
export const EndScreen = ({ results, onRestart }) => {
    return (
        <MinimalLayout>
           <View style={styles.centerContainer}>
              <MinimalHeader title="النهاية" subtitle="نتيجة اللعبة" />
              <View style={styles.resultBox}>
                  {/* Simplistic result display for now */}
                  <Text style={styles.resultText}>انتهت اللعبة!</Text>
              </View>
              <MinimalButton title="عودة للرئيسية" onPress={onRestart} />
           </View>
        </MinimalLayout>
    );
};

/**
 * PlayerDramaticRevealScreen - V3
 */
export const PlayerDramaticRevealScreen = ({ roleData, currentReveal }) => {
    if (currentReveal?.type === 'HINT') {
        return (
            <MinimalLayout roleData={roleData}>
                 <View style={styles.centerContainer}>
                     <Text style={styles.dramaTitle}>🔍</Text>
                     <Text style={styles.dramaText}>تلميح هام!</Text>
                     <View style={[styles.resultBox, { marginTop: 20, backgroundColor: 'rgba(218, 165, 32, 0.2)' }]}>
                        <Text style={[styles.resultText, { textAlign: 'center', lineHeight: 30 }]}>
                            {currentReveal.text}
                        </Text>
                     </View>
                 </View>
            </MinimalLayout>
        );
    }

    return (
        <MinimalLayout roleData={roleData}>
             <View style={styles.centerContainer}>
                 <Text style={styles.dramaTitle}>⚠️</Text>
                 <Text style={styles.dramaText}>كشف الحقائق...</Text>
                 {currentReveal?.text && (
                     <Text style={[styles.waitingText, { textAlign: 'center', marginTop: 10, maxWidth: '80%' }]}>
                        "{currentReveal.text}"
                     </Text>
                 )}
                 {currentReveal?.voteCount !== undefined && (
                     <Text style={[styles.dramaText, { color: '#FFF', fontSize: 24 }]}>
                        {currentReveal.voteCount} صوت
                     </Text>
                 )}
                 {currentReveal?.author && (
                     <Text style={[styles.dramaText, { color: '#DAA520', fontSize: 32 }]}>
                        {currentReveal.author}
                     </Text>
                 )}
             </View>
        </MinimalLayout>
    );
};

/**
 * PlayerResultsScreen - V3
 */
export const PlayerResultsScreen = ({ results, roleData }) => {
    if (!results) return <WaitingRevealScreen message="جاري حساب النتائج..." roleData={roleData} />;

    const { winner, reason, eliminatedPlayer, scores } = results;
    
    // Detailed Eliminated Info
    const detailedEliminated = scores?.find(p => p.isEliminated);
    const eliminatedTeam = detailedEliminated ? detailedEliminated.teamName : '';
    const eliminatedRole = detailedEliminated ? detailedEliminated.role : '';

    // Determine Color & Title
    let bgColor = '#444';
    let title = 'نهاية الجولة';
    let emoji = '🏁';
    
    if (winner === 'JUSTICE') {
        bgColor = '#1E90FF';
        title = 'فاز فريق العدالة!';
        emoji = '⚖️';
    } else if (winner === 'CRIME') {
        bgColor = '#8B0000';
        title = 'فاز فريق الجريمة!';
        emoji = '🕵️‍♂️';
    } else if (winner === 'CONTINUE') {
        bgColor = '#FFA500'; // Orange
        title = 'اللعبة مستمرة...';
        emoji = '🔄';
    }

    return (
        <MinimalLayout roleData={roleData}>
             <View style={styles.centerContainer}>
                 <View style={[styles.resultBox, { backgroundColor: bgColor }]}>
                     <Text style={styles.dramaTitle}>{emoji}</Text>
                     <Text style={[styles.dramaText, { color: '#FFF' }]}>{title}</Text>
                     
                     {eliminatedPlayer && (
                         <View style={{ marginTop: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, alignItems: 'center' }}>
                             <Text style={[styles.waitingText, { fontWeight: 'bold' }]}>
                                 تم استبعاد: {eliminatedPlayer.name}
                             </Text>
                             
                             <View style={{flexDirection: 'row', gap: 5, marginTop: 5}}>
                                <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>{eliminatedTeam}</Text>
                                {detailedEliminated && detailedEliminated.isCulprit && (
                                    <Text style={{ color: '#FF6347' }}>- {eliminatedRole}</Text>
                                )}
                             </View>
                         </View>
                     )}

                     <Text style={[styles.waitingText, { marginTop: 15, textAlign: 'center', fontSize: 14 }]}>{reason}</Text>
                 </View>
                 
                 <Text style={styles.waitingText}>انتظر تعليمات المضيف...</Text>
             </View>
        </MinimalLayout>
    );
};

// Add these new styles to the StyleSheet
const extraStyles = {
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.l,
    },
    waitingTitle: {
        fontSize: 48,
    },
    waitingText: {
        fontFamily: theme.fonts.main,
        fontSize: fonts.large,
        color: '#EBE1D2',
    },
    resultBox: {
        padding: spacing.xl,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: borderRadius.medium,
        width: '100%',
        alignItems: 'center',
    },
    resultText: {
        color: '#FFF',
        fontSize: fonts.large,
        fontFamily: theme.fonts.bold,
    },
    dramaTitle: {
        fontSize: 64,
    },
    dramaText: {
        color: '#FF4444',
        fontSize: fonts.xlarge,
        fontFamily: theme.fonts.bold,
    },
};

Object.assign(styles, extraStyles);
