import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalCard from '../components/minimal/MinimalCard';
import MinimalButton from '../components/minimal/MinimalButton';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * DiscussionScreen - Manages the discussion phase
 * Host can select players to speak. Players see who is speaking.
 */
export const DiscussionScreen = ({ 
    isHost = false, 
    players = [], 
    speakingPlayerId = null,
    onSelectSpeaker, // Host function to set speaker
    onEndDiscussion, // Host function to proceed
    scenarios = [],
    roleData // Added roleData
}) => {
    const { isDesktop } = useResponsiveLayout();
    const [showScenarios, setShowScenarios] = useState(false);

    const speakingPlayer = players.find(p => p.id === speakingPlayerId);

    return (
        <MinimalLayout roleData={roleData}>
            <View style={styles.container}>
                <MinimalHeader 
                    title="وقت النقاش" 
                    subtitle={isHost ? "إدارة النقاش" : "استمع للمناقشة"} 
                />

                <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
                    {/* Left Panel: Active Speaker & Scenarios */}
                    <View style={[styles.mainPanel, isHost && isDesktop && styles.mainPanelWithSide]}>
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
                                                    <Text numberOfLines={4} style={styles.miniScenarioText}>{s.text || s.answer}</Text>
                                                    <View style={styles.miniScenarioMeta}>
                                                        <Text style={styles.miniScenarioAuthor}>✍️ {s.author}</Text>
                                                        <Text style={styles.miniScenarioVotes}>⭐ {s.voteCount || 0}</Text>
                                                    </View>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

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
                                            onPress={() => onSelectSpeaker(player.id === speakingPlayerId ? null : player.id)}
                                        >
                                            <Text style={[
                                                styles.playerName,
                                                speakingPlayerId === player.id && styles.playerNameActive
                                            ]}>
                                                {player.name}
                                            </Text>
                                            {speakingPlayerId === player.id && <Text style={styles.micStatus}>🎤</Text>}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>

                            <MinimalButton 
                                title="بدء التصويت على الجاني" 
                                onPress={onEndDiscussion} 
                                style={styles.nextButton}
                            />
                        </View>
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
        padding: spacing.m,
        gap: spacing.m,
    },
    contentWrapper: {
        flex: 1,
        width: '100%',
        gap: spacing.l,
        alignItems: 'center',
        flexDirection: 'column',
    },
    contentWrapperDesktop: {
        flexDirection: 'row',
        alignItems: 'stretch', // Fill height
        justifyContent: 'center',
        paddingHorizontal: spacing.l,
    },
    
    // Panels
    mainPanel: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.l,
    },
    mainPanelWithSide: {
        flex: 2, // Take more space than side panel
        paddingRight: spacing.l, // Spacing between panels
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.1)',
    },
    sidePanel: {
        width: '100%',
        maxWidth: 600,
        flex: 1,
        display: 'flex',
    },
    sidePanelDesktop: {
        flex: 1,
        maxWidth: 350, // Limit width of controls on desktop
        paddingLeft: spacing.l,
        justifyContent: 'center',
    },

    // Speaker Card
    speakerCard: {
        width: '100%',
        maxWidth: 500, // Reduced max width slightly for better fit
        alignItems: 'center',
        paddingVertical: spacing.l,
        minHeight: 200,
        justifyContent: 'center',
    },
    micIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    micIcon: {
        fontSize: 40,
    },
    speakingLabel: {
        fontFamily: theme.fonts.main,
        color: '#888',
        marginBottom: spacing.xs,
        fontSize: fonts.small,
    },
    speakingName: {
        fontFamily: theme.fonts.bold,
        fontSize: fonts.title,
        color: '#333',
        marginBottom: spacing.l,
    },
    soundWave: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 60,
    },
    bar: {
        width: 8,
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
    noSpeakerIcon: {
        fontSize: 60,
        opacity: 0.3,
        marginBottom: spacing.m,
    },
    noSpeakerText: {
        fontFamily: theme.fonts.main,
        fontSize: fonts.small,
        color: '#888',
    },

    // Controls
    sectionTitle: {
        fontFamily: theme.fonts.bold,
        color: '#EBE1D2',
        marginBottom: spacing.m,
        textAlign: 'center',
        fontSize: fonts.medium,
    },
    playersList: {
        flex: 1,
        marginBottom: spacing.m,
        maxHeight: '70%', // Prevent taking too much height
    },
    playersListContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    playersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.s,
    },
    playerButton: {
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius.medium,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minWidth: '45%', // 2 per row in side panel roughly
        justifyContent: 'center',
    },
    playerButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    playerName: {
        color: '#FFF',
        fontFamily: theme.fonts.main,
        fontSize: fonts.small,
    },
    playerNameActive: {
        color: '#FFF',
        fontFamily: theme.fonts.bold,
    },
    micStatus: {
        fontSize: 12,
    },
    nextButton: {
        marginTop: 'auto', // Push to bottom
        backgroundColor: '#8B0000',
    },
    
    // Scenarios
    scenariosSection: {
        width: '100%',
        alignItems: 'center',
        marginTop: spacing.m,
    },
    toggleScenariosBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 10,
    },
    toggleBtnText: {
        color: '#EBE1D2',
        fontFamily: theme.fonts.main,
        fontSize: fonts.small,
    },
    scenariosListContainer: {
        height: 140,
        width: '100%',
    },
    scenariosScrollContent: {
        gap: 10,
        paddingHorizontal: 10,
    },
    miniScenarioCard: {
        width: 200,
        height: 120,
        backgroundColor: '#FDF5E6',
        borderRadius: 8,
        padding: 10,
        justifyContent: 'space-between',
    },
    miniScenarioText: {
        fontFamily: theme.fonts.main,
        fontSize: 10,
        color: '#333',
        lineHeight: 14,
    },
    miniScenarioMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    miniScenarioAuthor: {
        fontSize: 9,
        color: '#666',
        fontWeight: 'bold',
    },
    miniScenarioVotes: {
        fontSize: 9,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
});
