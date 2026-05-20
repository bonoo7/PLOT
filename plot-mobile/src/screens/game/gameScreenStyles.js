import { StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius } from '../../styles/responsive';

/**
 * Shared styles for game-related screens (GameScreen, DraftingScreen)
 */
export const gameScreenStyles = StyleSheet.create({
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
        backgroundColor: '#F5F5DC',
        borderWidth: 4,
        borderColor: '#D2B48C',
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
        backgroundColor: '#DAA520',
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
        maxHeight: '30%',
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
        padding: 0,
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
        backgroundColor: 'rgba(255, 255, 255, 0.07)',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DAA520',
        marginTop: 10,
    },
    abilityTitle: {
        fontFamily: theme.fonts.bold,
        marginBottom: 10,
        fontSize: 16,
        color: '#DAA520',
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
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    targetChipSelected: {
        backgroundColor: '#DAA520',
        borderColor: '#DAA520',
    },
    targetText: {
        fontFamily: theme.fonts.main,
        color: '#EEE',
    },
    targetTextSelected: {
        color: '#1A1A1A',
    },
    blitzWaiting: {
        color: '#888',
        fontFamily: theme.fonts.main,
        fontSize: 14,
        textAlign: 'center',
        padding: 20,
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
        color: '#B22222',
        paddingVertical: 4,
        backgroundColor: 'rgba(255, 254, 247, 0.6)',
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
});

export const getRoleEmoji = (role) => {
    const map = {
        'CULPRIT': '🎭', 'FORGER': '🧩', 'INFILTRATOR': '🕵️',
        'ACCOMPLICE': '🤝', 'LAWYER': '⚖️', 'CHIEF_DETECTIVE': '🔍',
        'ANALYST': '📊', 'OFFICER': '👮', 'WITNESS': '👁️', 'SABOTEUR': '😈',
    };
    return map[role] || '👤';
};
