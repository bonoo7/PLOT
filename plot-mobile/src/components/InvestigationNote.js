import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { theme } from '../styles/theme';
import { fonts, spacing, borderRadius } from '../styles/responsive';
import { getTheme } from '../constants/theme';
import { useGameStore } from '../store/useGameStore';
import { getColors as getColorsV3, fontFamily as fontFamilyV3, fontSize as fontSizeV3, sp as spV3 } from '../design-v3/tokens';
import ScanLines from '../design-v3/components/ScanLines';
import TerminalCard from '../design-v3/components/TerminalCard';
import TerminalButton from '../design-v3/components/TerminalButton';
import TerminalBanner from '../design-v3/components/TerminalBanner';


/**
 * InvestigationNote - نتيجة القدرة كنوتة Noir
 * تظهر كورقة مختومة بأسلوب المحقق البيروقراطي
 * تدعم: INVESTIGATE, SABOTAGE, REVELATION, REVELATION_SUCCESS, FLASH_MEMORY
 */
export const InvestigationNote = ({ visible, targetName, result, isSabotaged, onDismiss, type, content, message, keywords }) => {
    const themeMode = useGameStore(state => state.themeMode);
    const t = getTheme(themeMode);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-60)).current;
    const stampScale = useRef(new Animated.Value(3)).current;
    const stampOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // ظهور الورقة
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
            ]).start(() => {
                // ختم الطابع بعد ظهور الورقة
                setTimeout(() => {
                    Animated.parallel([
                        Animated.timing(stampScale, { toValue: 1, duration: 300, useNativeDriver: true }),
                        Animated.timing(stampOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                    ]).start();
                }, 500);
            });
        } else {
            // إعادة تعيين
            fadeAnim.setValue(0);
            slideAnim.setValue(-60);
            stampScale.setValue(3);
            stampOpacity.setValue(0);
        }
    }, [visible]);

    const isCrime = result && result.includes('الجريمة');

    // إعداد المحتوى حسب نوع القدرة
    const getConfig = () => {
        switch (type) {
            case 'SABOTAGE':
                return {
                    header: '◈ بلاغ سري — قسم التخريب ◈',
                    stamp: '🧨',
                    stampLabel: 'تم\nالتخريب',
                    stampColor: '#8B1A1A',
                    stampBg: 'rgba(139,26,26,0.12)',
                    body: (
                        <Text style={[styles.noteText, { color: t.text }]}>{message || 'تم تنفيذ عملية التخريب بنجاح.'}</Text>
                    ),
                };
            case 'REVELATION':
            case 'REVELATION_SUCCESS':
                return {
                    header: '◈ وحي سري — العراف ◈',
                    stamp: '🔮',
                    stampLabel: 'تم\nالوحي',
                    stampColor: '#4B0082',
                    stampBg: 'rgba(75,0,130,0.12)',
                    body: (
                        <Text style={[styles.noteText, { color: t.text }]}>{content || message || 'تم استلام الوحي.'}</Text>
                    ),
                };
            case 'FLASH_MEMORY':
                return {
                    header: '◈ تقرير سري — ذاكرة الشاهد ◈',
                    stamp: '👁️',
                    stampLabel: 'ذاكرة\nمستعادة',
                    stampColor: '#1A4A8B',
                    stampBg: 'rgba(26,74,139,0.12)',
                    body: (
                        <>
                            <Text style={[styles.noteText, { color: t.text }]}>الكلمات المفتاحية التي رصدتها:</Text>
                            <View style={[styles.resultBox, { borderColor: '#1A4A8B', backgroundColor: 'rgba(26,74,139,0.08)' }]}>
                                <Text style={[styles.resultText, { color: '#1A4A8B' }]}>
                                    {keywords ? keywords.join(' - ') : '—'}
                                </Text>
                            </View>
                        </>
                    ),
                };
            default: // INVESTIGATE
                return {
                    header: '◈ تقرير سري — مكتب التحقيقات ◈',
                    stamp: isCrime ? 'مشبوه\nجنائي' : 'مشبوه\nنظيف',
                    stampLabel: null,
                    stampColor: isCrime ? '#8B1A1A' : '#1A6B1A',
                    stampBg: isCrime ? 'rgba(139,26,26,0.12)' : 'rgba(26,107,26,0.12)',
                    body: (
                        <>
                            <Text style={[styles.noteText, { color: t.text }]}>بعد مراجعة السجلات وتحليل الأدلة المتاحة،</Text>
                            <Text style={[styles.noteText, { color: t.text }]}>تبيّن أن المشتبه به:</Text>
                            <View style={[styles.targetBox, { borderColor: t.cardBorder }]}>
                                <Text style={[styles.targetName, { color: t.text, fontFamily: 'Courier', fontWeight: 'bold' }]}>「 {targetName} 」</Text>
                            </View>
                            <Text style={[styles.noteText, { color: t.text }]}>ينتمي إلى:</Text>
                            <View style={[styles.resultBox, { borderColor: isCrime ? t.accent : t.accentSecondary, backgroundColor: isCrime ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)' }]}>
                                <Text style={[styles.resultText, { color: isCrime ? t.accent : t.accentSecondary }]}>{result}</Text>
                            </View>
                            {isSabotaged && (
                                <View style={styles.warningBox}>
                                    <Text style={styles.warningText}>⚠️ تحذير: قد تكون هذه المعلومات ملفقة</Text>
                                </View>
                            )}
                        </>
                    ),
                };
        }
    };

    const designVersion = useGameStore(state => state.designVersion);
    const cfg = getConfig();

    if (designVersion === 'v3') {
        const c3 = getColorsV3();
        const isCrime = result && result.includes('الجريمة');

        let title = 'DECRYPTED LOG';
        let bannerLabel = 'INFO';
        let bannerVariant = 'info';
        let bodyElement = null;

        if (type === 'SABOTAGE') {
            title = 'SABOTAGE REPORT';
            bannerLabel = 'SYSTEM CORRUPTED';
            bannerVariant = 'error';
            bodyElement = (
                <Text style={[v3Styles.text, { color: c3.textPrimary }]}>
                    {`[LOG] ${message || 'SABOTAGE SEQUENCE EXECUTED SUCCESSFULLY.'}`}
                </Text>
            );
        } else if (type === 'REVELATION' || type === 'REVELATION_SUCCESS') {
            title = 'DECRYPTED REVELATION';
            bannerLabel = 'SEER INPUT';
            bannerVariant = 'warning';
            bodyElement = (
                <Text style={[v3Styles.text, { color: c3.textPrimary }]}>
                    {`[DATA] ${content || message || 'NO REVELATION DATA AVAILABLE.'}`}
                </Text>
            );
        } else if (type === 'FLASH_MEMORY') {
            title = 'RESTORED DATA';
            bannerLabel = 'WITNESS MEMORY';
            bannerVariant = 'info';
            bodyElement = (
                <View style={{ gap: spV3.s }}>
                    <Text style={[v3Styles.text, { color: c3.textPrimary }]}>
                        [LOG] SECURE MEMORY BLOCK RETRIEVED.
                    </Text>
                    <Text style={[v3Styles.text, { color: c3.textSub }]}>
                        [KEYWORDS]
                    </Text>
                    <View style={v3Styles.keywordWrap}>
                        {(keywords || []).map((kw, i) => (
                            <View key={i} style={[v3Styles.keywordBadge, { borderColor: c3.borderBright }]}>
                                <Text style={[v3Styles.keywordText, { color: c3.accentGreen }]}>{kw}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            );
        } else {
            // INVESTIGATE
            title = 'DECRYPTED RECORD';
            bannerLabel = 'INVESTIGATION REPORT';
            bannerVariant = isCrime ? 'error' : 'success';
            bodyElement = (
                <View style={{ gap: spV3.s }}>
                    <Text style={[v3Styles.text, { color: c3.textPrimary }]}>
                        {`[SUBJECT] CLIENT ${targetName}`}
                    </Text>
                    <Text style={[v3Styles.text, { color: c3.textPrimary }]}>
                        {`[AFFILIATION] ${result}`}
                    </Text>
                    
                    <View style={[v3Styles.verdictBox, { borderColor: isCrime ? c3.accentRed : c3.accentGreen }]}>
                        <Text style={[v3Styles.verdictText, { color: isCrime ? c3.accentRed : c3.accentGreen }]}>
                            {isCrime ? '▲ CRITICAL: THREAT DETECTED' : '▼ SECURE: NO CRIME LINK'}
                        </Text>
                    </View>

                    {isSabotaged && (
                        <View style={[v3Styles.warningBox, { borderColor: c3.accentYellow }]}>
                            <Text style={[v3Styles.warningText, { color: c3.accentYellow }]}>
                                ⚠️ [WARNING] FORGED METADATA DETECTED
                            </Text>
                        </View>
                    )}
                </View>
            );
        }

        return (
            <Modal visible={visible} transparent animationType="none">
                <Animated.View style={[v3Styles.overlay, { opacity: fadeAnim }]}>
                    <Animated.View style={[v3Styles.container, { transform: [{ translateY: slideAnim }] }]}>
                        <TerminalCard title={`> ${title}`} tone={bannerVariant === 'error' ? 'danger' : bannerVariant === 'success' ? 'success' : 'warning'}>
                            <View style={{ gap: spV3.m, paddingVertical: spV3.s }}>
                                <TerminalBanner variant={bannerVariant} label={bannerLabel}>
                                    {`FILE ID: #${Math.floor(Math.random() * 9000) + 1000}`}
                                </TerminalBanner>
                                
                                {bodyElement}

                                <TerminalButton
                                    title="[ DISMISS UPLINK ]"
                                    onPress={onDismiss}
                                    style={{ marginTop: spV3.s }}
                                />
                            </View>
                        </TerminalCard>
                    </Animated.View>
                </Animated.View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="none">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View style={[styles.noteContainer, { backgroundColor: t.cardBg, borderColor: t.cardBorder, transform: [{ translateY: slideAnim }] }]}>
                    {/* رأس النوتة */}
                    <View style={[styles.noteHeader, { backgroundColor: t.background }]}>
                        <Text style={[styles.noteHeaderText, { color: t.text }]}>{cfg.header}</Text>
                    </View>

                    {/* محتوى النوتة */}
                    <View style={styles.noteBody}>
                        <Text style={[styles.caseLabel, { color: t.textMuted }]}>الملف رقم: #{Math.floor(Math.random() * 9000) + 1000}</Text>
                        <View style={[styles.divider, { backgroundColor: t.cardBorder }]} />
                        {cfg.body}
                    </View>

                    {/* الختم المائل */}
                    <Animated.View
                        style={[
                            styles.stampWrapper,
                            {
                                opacity: stampOpacity,
                                transform: [{ scale: stampScale }, { rotate: '-15deg' }]
                            }
                        ]}
                    >
                        <View style={[styles.stamp, { borderColor: cfg.stampColor, backgroundColor: cfg.stampBg }]}>
                            <Text style={[styles.stampText, { color: cfg.stampColor }]}>
                                {cfg.stampLabel ?? cfg.stamp}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* زر الإغلاق */}
                    <TouchableOpacity style={[styles.dismissBtn, { borderTopColor: t.cardBorder }]} onPress={onDismiss}>
                        <Text style={[styles.dismissText, { color: t.text }]}>— تم الاطلاع —</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    noteContainer: {
        backgroundColor: '#F5F0DC', // لون ورق قديم
        maxWidth: 420,
        width: '100%',
        borderWidth: 2,
        borderColor: '#8B7355',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 20,
        position: 'relative',
    },
    noteHeader: {
        backgroundColor: '#1A1A1A',
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        alignItems: 'center',
    },
    noteHeaderText: {
        color: '#B8A878',
        fontFamily: theme.fonts.bold,
        fontSize: fonts.small,
        letterSpacing: 1,
        textAlign: 'center',
    },
    noteBody: {
        padding: spacing.l,
        paddingTop: spacing.m,
    },
    caseLabel: {
        fontFamily: theme.fonts.main,
        fontSize: 11,
        color: '#888',
        textAlign: 'right',
        marginBottom: spacing.xs,
    },
    divider: {
        height: 1,
        backgroundColor: '#C8B898',
        marginBottom: spacing.m,
    },
    noteText: {
        fontFamily: theme.fonts.main,
        fontSize: fonts.small,
        color: '#3A2E1E',
        lineHeight: 22,
        textAlign: 'right',
        marginBottom: 4,
    },
    targetBox: {
        backgroundColor: 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        borderColor: '#C8B898',
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        marginVertical: spacing.m,
        alignItems: 'center',
    },
    targetName: {
        fontFamily: theme.fonts.heading,
        fontSize: fonts.large,
        color: '#1A1A1A',
        textAlign: 'center',
    },
    resultBox: {
        paddingVertical: spacing.s,
        paddingHorizontal: spacing.m,
        marginTop: spacing.xs,
        marginBottom: spacing.m,
        borderWidth: 2,
        alignItems: 'center',
    },
    resultCrime: {
        borderColor: '#8B1A1A',
        backgroundColor: 'rgba(139,26,26,0.08)',
    },
    resultJustice: {
        borderColor: '#1A4A8B',
        backgroundColor: 'rgba(26,74,139,0.08)',
    },
    resultText: {
        fontFamily: theme.fonts.bold,
        fontSize: fonts.medium,
    },
    resultTextCrime: {
        color: '#8B1A1A',
    },
    resultTextJustice: {
        color: '#1A4A8B',
    },
    warningBox: {
        backgroundColor: '#FFF3CD',
        borderWidth: 1,
        borderColor: '#DAA520',
        padding: spacing.s,
        marginTop: spacing.xs,
    },
    warningText: {
        fontFamily: theme.fonts.main,
        fontSize: 12,
        color: '#856404',
        textAlign: 'center',
    },
    stampWrapper: {
        position: 'absolute',
        top: spacing.xl + 16,
        left: spacing.m,
    },
    stamp: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stampRed: {
        borderColor: '#8B1A1A',
        backgroundColor: 'rgba(139,26,26,0.12)',
    },
    stampGreen: {
        borderColor: '#1A6B1A',
        backgroundColor: 'rgba(26,107,26,0.12)',
    },
    stampText: {
        fontFamily: theme.fonts.bold,
        fontSize: 11,
        textAlign: 'center',
        color: '#8B1A1A',
        lineHeight: 15,
    },
    dismissBtn: {
        borderTopWidth: 1,
        borderTopColor: '#C8B898',
        paddingVertical: spacing.m,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.04)',
    },
    dismissText: {
        fontFamily: theme.fonts.bold,
        fontSize: fonts.small,
        color: '#5A4A3A',
        letterSpacing: 2,
    },
});

const v3Styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(3,7,18,0.94)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        maxWidth: 440,
        width: '100%',
    },
    text: {
        fontFamily: fontFamilyV3.mono,
        fontSize: fontSizeV3.body,
        lineHeight: fontSizeV3.body * 1.5,
        textAlign: 'left',
    },
    keywordWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
    },
    keywordBadge: {
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(0,255,0,0.05)',
    },
    keywordText: {
        fontFamily: fontFamilyV3.mono,
        fontSize: fontSizeV3.small,
        fontWeight: 'bold',
    },
    verdictBox: {
        borderWidth: 1.5,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    verdictText: {
        fontFamily: fontFamilyV3.mono,
        fontSize: fontSizeV3.medium,
        fontWeight: 'bold',
    },
    warningBox: {
        borderWidth: 1,
        padding: 10,
        backgroundColor: 'rgba(255,255,0,0.05)',
        marginTop: 4,
    },
    warningText: {
        fontFamily: fontFamilyV3.mono,
        fontSize: fontSizeV3.small,
        textAlign: 'center',
    },
});

