import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, ScrollView, Platform } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius } from '../../styles/responsive';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

const ROLE_LABELS = {
    CULPRIT: 'الجاني', WITNESS: 'الشاهد', DETECTIVE: 'المحقق',
    SABOTEUR: 'المخرب', BENEFICIARY: 'المستفيد', MINISTER: 'الوزير',
    SEER: 'العراف', MASTERMIND: 'العقل المدبر'
};
const getRoleLabel = (role) => ROLE_LABELS[role] || role;

/**
 * GameHeader - A unified, sticky header card for the game.
 * Shows: Room Code, Score, Role (Icon + Name), Refresh Button.
 */
const GameHeader = ({ roleData, roomCode, onRefresh }) => {
    const { isDesktop } = useResponsiveLayout();
    const [showRoleModal, setShowRoleModal] = useState(false);

    if (!roleData) return null;

    return (
        <View style={[styles.headerContainer, isDesktop && styles.headerDesktop]}>
            <View style={styles.card}>
                {/* Left: Refresh & Room Code */}
                <View style={styles.leftSection}>
                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                        <Text style={styles.refreshIcon}>↻</Text>
                    </TouchableOpacity>
                    {roomCode && (
                        <View style={styles.codeContainer}>
                            <Text style={styles.codeLabel}>CODE</Text>
                            <Text style={styles.codeValue}>{roomCode}</Text>
                        </View>
                    )}
                </View>

                {/* Center: Role Name (Desktop) or spacer */}
                {isDesktop && (
                    <Text style={styles.centerTitle}>{roleData.roleName}</Text>
                )}

                {/* Right: Score & Role Icon */}
                <View style={styles.rightSection}>
                    <View style={styles.scoreContainer}>
                        <Text style={styles.scoreValue}>
                            {roleData.totalScore !== undefined ? roleData.totalScore : roleData.score}
                        </Text>
                        <Text style={styles.scoreIcon}>💰</Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.roleIconContainer}
                        onPress={() => setShowRoleModal(true)}
                        activeOpacity={0.8}
                    >
                         {theme.roleImages && theme.roleImages[roleData.role] ? (
                            <Image 
                                source={theme.roleImages[roleData.role]} 
                                style={styles.roleImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <Text style={styles.roleEmoji}>{roleData.emoji || '👤'}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Role Detail Modal */}
            <Modal
                visible={showRoleModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowRoleModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{roleData.roleName}</Text>
                            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={styles.modalBody}>
                             {theme.roleImages && theme.roleImages[roleData.role] && (
                                <View style={{ alignItems: 'center', marginBottom: spacing.m }}>
                                    <Image 
                                        source={theme.roleImages[roleData.role]} 
                                        style={styles.modalRoleImageBig}
                                        resizeMode="contain"
                                    />
                                </View>
                            )}
                            <Text style={styles.modalLabel}>مهمتك:</Text>
                            <Text style={styles.modalText}>{roleData.description}</Text>
                            
                            {roleData.specialInfo && (
                                <>
                                    <View style={styles.divider} />
                                    <Text style={styles.modalLabel}>معلومات سرية:</Text>
                                    {(() => {
                                        const si = roleData.specialInfo;
                                        if (typeof si === 'string') {
                                            return <Text style={styles.modalText}>{si}</Text>;
                                        }
                                        if (si.type === 'MASTERMIND_INTEL') {
                                            return <>
                                                <Text style={styles.modalText}>فريق الجريمة:</Text>
                                                {si.crimeTeam?.map((m, i) => (
                                                    <Text key={i} style={[styles.modalText, {color:'#c0392b', marginRight: 8}]}>
                                                        • {m.name} ({getRoleLabel(m.role)})
                                                    </Text>
                                                ))}
                                            </>;
                                        }
                                        if (si.type === 'MINISTER_INTEL') {
                                            return <>
                                                {si.detective && <Text style={styles.modalText}>المحقق: {si.detective.name}</Text>}
                                                {si.beneficiary && <Text style={styles.modalText}>المستفيد: {si.beneficiary.name}</Text>}
                                            </>;
                                        }
                                        if (si.type === 'WITNESS_INTEL') {
                                            return <Text style={styles.modalText}>الكلمات الدليلية: {si.keywords?.join('، ')}</Text>;
                                        }
                                        return <Text style={styles.modalText}>{JSON.stringify(si)}</Text>;
                                    })()}
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 40, // Safe area top
        left: 0,
        right: 0,
        zIndex: 9999, // Always on top
        alignItems: 'center',
        paddingHorizontal: spacing.m,
    },
    headerDesktop: {
        top: 20,
        paddingHorizontal: spacing.l,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 50, // Pill shape
        paddingVertical: 6,
        paddingHorizontal: 16,
        width: '100%',
        maxWidth: 600,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        borderWidth: 2,
        borderColor: '#DAA520', // Gold border
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    refreshButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#555',
    },
    codeContainer: {
        alignItems: 'center',
    },
    codeLabel: {
        fontSize: 8,
        color: '#888',
        fontWeight: 'bold',
    },
    codeValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    centerTitle: {
        fontSize: fonts.medium,
        fontWeight: 'bold',
        color: '#8B4513',
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scoreValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#DAA520',
    },
    scoreIcon: {
        fontSize: 12,
    },
    roleIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        overflow: 'hidden',
    },
    roleImage: {
        width: 44,
        height: 44,
    },
    roleEmoji: {
        fontSize: 24,
    },
    
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FDF5E6',
        borderRadius: borderRadius.medium,
        padding: spacing.m,
        borderWidth: 2,
        borderColor: '#8B4513',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: '#D2B48C',
        paddingBottom: spacing.s,
    },
    modalTitle: {
        fontSize: fonts.large,
        fontFamily: theme.fonts.bold,
        color: '#8B4513',
        textAlign: 'right', // RTL
    },
    closeButton: {
        fontSize: 24,
        color: '#8B4513',
        fontWeight: 'bold',
    },
    modalBody: {
        maxHeight: 400,
    },
    modalRoleImageBig: {
        width: 100,
        height: 100,
    },
    modalLabel: {
        fontFamily: theme.fonts.bold,
        fontSize: fonts.medium,
        color: '#333',
        marginBottom: 4,
        textAlign: 'right',
    },
    modalText: {
        fontFamily: theme.fonts.main,
        fontSize: fonts.medium,
        color: '#444',
        lineHeight: 24,
        marginBottom: spacing.s,
        textAlign: 'right',
    },
    divider: {
        height: 1,
        backgroundColor: '#D2B48C',
        marginVertical: spacing.m,
    },
});

export default GameHeader;
