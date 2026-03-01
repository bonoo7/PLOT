import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { useSocket, ROUTES } from '../hooks/useGameSocket';
import { useNavigation } from '@react-navigation/native';

import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalCard from '../components/minimal/MinimalCard';
import MinimalButton from '../components/minimal/MinimalButton';
import { PlayerBadge } from '../components/minimal/PlayerBadge';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { InvestigationNote } from '../components/InvestigationNote';

/**
 * DiscussionScreen - Manages the discussion phase
 * Host can select players to speak (only visible on host view). Players see who is speaking.
 */
export const DiscussionScreen = ({ isHost = false }) => {
    const { isDesktop } = useResponsiveLayout();
    const { socket } = useSocket();
    const navigation = useNavigation();

    const [showScenarios, setShowScenarios] = useState(true);

    const roomCode = useGameStore((state) => state.roomCode);
    const roleData = useGameStore((state) => state.roleData);
    const players = useGameStore((state) => state.players) || [];
    const speakingPlayerId = useGameStore((state) => state.speakingPlayerId);
    const scenarios = useGameStore((state) => state.revealedScenarios) || [];
    const hint = useGameStore((state) => state.lastHint);

    // نتيجة تحقيق المحقق — تُعرض عند بداية النقاش كنوتة Noir
    const [investigationNote, setInvestigationNote] = useState(null);

    useEffect(() => {
        if (!socket) return;
        const handleAbilityResult = ({ type, targetName, result, isSabotaged }) => {
            if (type === 'INVESTIGATE') {
                setInvestigationNote({ targetName, result, isSabotaged });
            }
        };
        socket.on('abilityResult', handleAbilityResult);
        return () => socket.off('abilityResult', handleAbilityResult);
    }, [socket]);

    const speakingPlayer = players.find(p => p.id === speakingPlayerId);

    const handleSelectSpeaker = (playerId) => {
        if (!socket || !roomCode) return;
        socket.emit('setSpeaker', { roomCode, playerId });
    };

    const handleEndDiscussion = () => {
        if (!socket || !roomCode) return;
        socket.emit('endDiscussion', { roomCode });
    };

    const handleRefresh = () => {
        // Option to refresh if needed
    };

    return (
        <MinimalLayout roleData={roleData} roomCode={roomCode} onRefresh={handleRefresh}>
            {/* نوتة نتيجة تحقيق المحقق */}
            <InvestigationNote
                visible={!!investigationNote}
                targetName={investigationNote?.targetName}
                result={investigationNote?.result}
                isSabotaged={investigationNote?.isSabotaged}
                onDismiss={() => setInvestigationNote(null)}
            />

            <View style={styles.container}>
                <MinimalHeader
                    title="وقت النقاش"
                    subtitle={isHost ? "إدارة النقاش" : "استمع للمناقشة"}
                />

                {/* Display Hint if available */}
                {hint && (
                    <MinimalCard style={styles.hintCard}>
                        <Text style={styles.hintTitle}>💡 تلميح:</Text>
                        <Text style={styles.hintText}>{hint}</Text>
                    </MinimalCard>
                )}

                <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
                    {/* Left Panel: Active Speaker & Scenarios */}
                    <ScrollView
                        style={[styles.mainPanel, isHost && isDesktop && styles.mainPanelWithSide]}
                        contentContainerStyle={styles.mainPanelContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <MinimalCard style={styles.speakerCard}>
                            {speakingPlayer ? (
                                <>
                                    <View style={styles.micIconContainer}>
                                        <Text style={styles.micIcon}>🎤</Text>
                                    </View>
                                    <Text style={styles.speakingLabel}>المتحدث الحالي</Text>
                                    <Text style={styles.speakingName}>{speakingPlayer.name}</Text>
                                    <View style={styles.soundWave}>
                                        <View style={[styles.bar, { height: 20 }]} />
                                        <View style={[styles.bar, { height: 40 }]} />
                                        <View style={[styles.bar, { height: 30 }]} />
                                        <View style={[styles.bar, { height: 50 }]} />
                                        <View style={[styles.bar, { height: 25 }]} />
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.noSpeakerIcon}>🔇</Text>
                                    <Text style={styles.noSpeakerText}>
                                        {isHost ? "اختر لاعباً للتحدث" : "في انتظار المضيف..."}
                                    </Text>
                                </>
                            )}
                        </MinimalCard>

                        {/* Scenarios Reference Toggle */}
                        {scenarios.length > 0 && (
                            <View style={styles.scenariosSection}>
                                <TouchableOpacity
                                    style={styles.toggleScenariosBtn}
                                    onPress={() => setShowScenarios(!showScenarios)}
                                >
                                    <Text style={styles.toggleBtnText}>
                                        {showScenarios ? 'إخفاء السيناريوهات' : 'عرض السيناريوهات'} 👁️
                                    </Text>
                                </TouchableOpacity>

                                {showScenarios && (
                                    <View style={styles.scenariosListContainer}>
                                        <ScrollView horizontal contentContainerStyle={styles.scenariosScrollContent}>
                                            {scenarios.map((s, i) => (
                                                <View key={i} style={styles.miniScenarioCard}>
                                                    <ScrollView style={{ flex: 1 }}>
                                                        <Text style={styles.miniScenarioText}>{s.text || s.answer}</Text>
                                                    </ScrollView>

                                                    {/* Voters Display */}
                                                    {s.voters && s.voters.length > 0 && (
                                                        <View style={styles.votersContainer}>
                                                            <Text style={styles.votersLabel}>المصوتون:</Text>
                                                            <View style={[styles.votersList, { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginTop: spacing.s }]}>
                                                                {s.voters.map((v, idx) => (
                                                                    <PlayerBadge key={idx} name={typeof v === 'object' ? v.name : v} size="small" />
                                                                ))}
                                                            </View>
                                                        </View>
                                                    )}

                                                    <View style={[styles.miniScenarioMeta, { flexDirection: 'column', gap: spacing.s, alignItems: 'flex-start' }]}>
                                                        {s.author && (
                                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
                                                                <Text style={{ fontSize: 12 }}>الكاتب:</Text>
                                                                <PlayerBadge name={s.author} size="small" />
                                                            </View>
                                                        )}
                                                        <Text style={styles.miniScenarioVotes}>⭐ {s.voteCount || 0}</Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        )}
                    </ScrollView>

                    {/* Right Panel: Host Controls */}
                    {isHost && (
                        <View style={[styles.sidePanel, isDesktop && styles.sidePanelDesktop]}>
                            <Text style={styles.sectionTitle}>قائمة المتحدثين</Text>
                            <ScrollView style={styles.playersList} contentContainerStyle={styles.playersListContent}>
                                <View style={styles.playersGrid}>
                                    {players.map((player) => (
                                        <TouchableOpacity
                                            key={player.id}
                                            style={[
                                                styles.playerButton,
                                                speakingPlayerId === player.id && styles.playerButtonActive
                                            ]}
                                            onPress={() => handleSelectSpeaker(player.id === speakingPlayerId ? null : player.id)}
                                        >
                                            <PlayerBadge
                                                name={player.name}
                                                score={player.score}
                                                isSelf={false}
                                                isActive={speakingPlayerId === player.id}
                                                isEliminated={player.eliminated}
                                                size="small"
                                                style={{ borderWidth: 0, backgroundColor: 'transparent', padding: 0 }}
                                            />
                                            {speakingPlayerId === player.id && <Text style={styles.micStatus}>🎤</Text>}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            <MinimalButton
                                title="بدء التصويت على الجاني"
                                onPress={handleEndDiscussion}
                                style={styles.nextButton}
                            />
                        </View>
                    )}
                </View>
            </View>
        </MinimalLayout>
    );
};

export const HostDiscussionScreen = () => <DiscussionScreen isHost={true} />;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        padding: spacing.m,
        gap: spacing.m,
    },
    contentWrapper: {
        flex: 1,
        width: '100%',
        gap: spacing.xl,
        alignItems: 'center',
        flexDirection: 'column',
    },
    contentWrapperDesktop: {
        flexDirection: 'row',
        alignItems: 'stretch', // Fill height
        justifyContent: 'center',
        paddingHorizontal: spacing.l,
    },

    // Hint
    hintCard: {
        width: '100%',
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        borderColor: 'rgba(212, 175, 55, 0.5)',
        borderWidth: 1,
        marginBottom: spacing.m,
        alignItems: 'center',
        padding: spacing.m,
        borderRadius: borderRadius.medium,
    },
    hintTitle: {
        fontFamily: theme.fonts.bold,
        color: '#D4AF37',
        marginBottom: spacing.xs,
        fontSize: fonts.medium,
    },
    hintText: {
        fontFamily: theme.fonts.main,
        color: '#F4E4C1',
        fontSize: fonts.default,
        textAlign: 'center',
    },

    // Panels
    mainPanel: {
        flex: 1,
        width: '100%',
    },
    mainPanelContent: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: spacing.xl,
        paddingBottom: spacing.xl,
    },
    mainPanelWithSide: {
        flex: 2,
        paddingRight: spacing.xl,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.1)',
    },
    sidePanel: {
        width: '100%',
        maxWidth: 600,
        flex: 1,
        display: 'flex',
        justifyContent: 'flex-start',
        gap: spacing.l,
    },
    sidePanelDesktop: {
        flex: 1,
        maxWidth: 350,
        paddingLeft: spacing.xl,
        justifyContent: 'flex-start',
    },

    // Speaker Card
    speakerCard: {
        width: '100%',
        maxWidth: 500,
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.l,
        minHeight: 220,
        justifyContent: 'center',
        backgroundColor: 'rgba(235, 225, 210, 0.05)',
        borderColor: 'rgba(235, 225, 210, 0.2)',
        borderWidth: 1,
        borderRadius: borderRadius.large,
    },
    micIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    micIcon: {
        fontSize: 30,
    },
    speakingLabel: {
        fontFamily: theme.fonts.main,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: spacing.s,
        fontSize: fonts.small,
        letterSpacing: 1,
    },
    speakingName: {
        fontFamily: theme.fonts.bold,
        fontSize: fonts.xlarge,
        color: '#F4E4C1',
        marginBottom: spacing.l,
        textAlign: 'center',
    },
    soundWave: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 40,
    },
    bar: {
        width: 6,
        backgroundColor: '#D4AF37',
        borderRadius: 3,
    },
    noSpeakerIcon: {
        fontSize: 50,
        opacity: 0.3,
        marginBottom: spacing.m,
    },
    noSpeakerText: {
        fontFamily: theme.fonts.main,
        fontSize: fonts.medium,
        color: 'rgba(255,255,255,0.5)',
    },

    // Controls
    sectionTitle: {
        fontFamily: theme.fonts.bold,
        color: '#F4E4C1',
        textAlign: 'center',
        fontSize: fonts.large,
        letterSpacing: 1,
    },
    playersList: {
        flex: 1,
    },
    playersListContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        paddingVertical: spacing.s,
    },
    playersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.m,
    },
    playerButton: {
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: borderRadius.medium,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minWidth: '45%',
        justifyContent: 'center',
    },
    playerButtonActive: {
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        borderColor: '#D4AF37',
    },
    micStatus: {
        fontSize: 16,
    },
    nextButton: {
        marginTop: 'auto',
        backgroundColor: 'rgba(139, 0, 0, 0.8)',
        borderWidth: 1,
        borderColor: '#5A0000',
        paddingVertical: spacing.m,
    },

    // Scenarios
    scenariosSection: {
        width: '100%',
        alignItems: 'center',
        marginTop: spacing.m,
    },
    toggleScenariosBtn: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        marginBottom: spacing.l,
    },
    toggleBtnText: {
        color: '#FFF',
        fontFamily: theme.fonts.bold,
        fontSize: fonts.small,
    },
    scenariosListContainer: {
        width: '100%',
        paddingVertical: spacing.s,
    },
    scenariosScrollContent: {
        gap: spacing.l,
        paddingHorizontal: spacing.s,
    },
    miniScenarioCard: {
        width: 320,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: borderRadius.medium,
        padding: spacing.l,
        justifyContent: 'flex-start',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    miniScenarioText: {
        fontFamily: theme.fonts.main,
        fontSize: fonts.medium,
        color: '#333',
        lineHeight: 24,
        textAlign: 'right',
        minHeight: 80, // Minimum height for text area
    },
    miniScenarioMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.m,
        paddingTop: spacing.m,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    miniScenarioAuthor: {
        fontSize: fonts.small,
        color: '#666',
        fontFamily: theme.fonts.bold,
    },
    miniScenarioVotes: {
        fontSize: fonts.medium,
        color: '#D4AF37',
        fontFamily: theme.fonts.bold,
    },

    // Voters
    votersContainer: {
        marginTop: spacing.m,
        padding: spacing.s,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: borderRadius.small,
    },
    votersLabel: {
        fontSize: fonts.tiny,
        color: '#888',
        marginBottom: spacing.xs,
        textAlign: 'right',
    },
    votersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'flex-end',
    },
    voterBadge: {
        backgroundColor: '#FFF',
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    voterName: {
        fontSize: fonts.tiny,
        color: '#555',
    },
});
