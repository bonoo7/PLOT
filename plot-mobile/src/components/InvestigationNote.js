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

/**
 * InvestigationNote - نتيجة تحقيق المحقق كنوتة Noir
 * تظهر كورقة مختومة بأسلوب المحقق البيروقراطي
 */
export const InvestigationNote = ({ visible, targetName, result, isSabotaged, onDismiss }) => {
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

    return (
        <Modal visible={visible} transparent animationType="none">
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View style={[styles.noteContainer, { backgroundColor: t.cardBg, borderColor: t.cardBorder, transform: [{ translateY: slideAnim }] }]}>
                    {/* رأس النوتة */}
                    <View style={[styles.noteHeader, { backgroundColor: t.background }]}>
                        <Text style={[styles.noteHeaderText, { color: t.text }]}>◈ تقرير سري — مكتب التحقيقات ◈</Text>
                    </View>

                    {/* محتوى النوتة */}
                    <View style={styles.noteBody}>
                        <Text style={[styles.caseLabel, { color: t.textMuted }]}>الملف رقم: #{Math.floor(Math.random() * 9000) + 1000}</Text>
                        <View style={[styles.divider, { backgroundColor: t.cardBorder }]} />

                        <Text style={[styles.noteText, { color: t.text }]}>
                            بعد مراجعة السجلات وتحليل الأدلة المتاحة،
                        </Text>
                        <Text style={[styles.noteText, { color: t.text }]}>
                            تبيّن أن المشتبه به:
                        </Text>

                        <View style={[styles.targetBox, { borderColor: t.cardBorder }]}>
                            <Text style={[styles.targetName, { color: t.text, fontFamily: 'Courier', fontWeight: 'bold' }]}>「 {targetName} 」</Text>
                        </View>

                        <Text style={[styles.noteText, { color: t.text }]}>ينتمي إلى:</Text>

                        <View style={[styles.resultBox, { borderColor: isCrime ? t.accent : t.accentSecondary, backgroundColor: isCrime ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)' }]}>
                            <Text style={[styles.resultText, { color: isCrime ? t.accent : t.accentSecondary }]}>
                                {result}
                            </Text>
                        </View>

                        {isSabotaged && (
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>
                                    ⚠️ تحذير: قد تكون هذه المعلومات ملفقة
                                </Text>
                            </View>
                        )}
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
                        <View style={[styles.stamp, { borderColor: isCrime ? t.accent : t.accentSecondary, backgroundColor: isCrime ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)' }]}>
                            <Text style={[styles.stampText, { color: isCrime ? t.accent : t.accentSecondary }]}>
                                {isCrime ? 'مشبوه\nجنائي' : 'مشبوه\nنظيف'}
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
