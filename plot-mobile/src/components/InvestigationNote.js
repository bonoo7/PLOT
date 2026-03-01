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

/**
 * InvestigationNote - نتيجة تحقيق المحقق كنوتة Noir
 * تظهر كورقة مختومة بأسلوب المحقق البيروقراطي
 */
export const InvestigationNote = ({ visible, targetName, result, isSabotaged, onDismiss }) => {
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
                <Animated.View style={[styles.noteContainer, { transform: [{ translateY: slideAnim }] }]}>
                    {/* رأس النوتة */}
                    <View style={styles.noteHeader}>
                        <Text style={styles.noteHeaderText}>◈ تقرير سري — مكتب التحقيقات ◈</Text>
                    </View>

                    {/* محتوى النوتة */}
                    <View style={styles.noteBody}>
                        <Text style={styles.caseLabel}>الملف رقم: #{Math.floor(Math.random() * 9000) + 1000}</Text>
                        <View style={styles.divider} />

                        <Text style={styles.noteText}>
                            بعد مراجعة السجلات وتحليل الأدلة المتاحة،
                        </Text>
                        <Text style={styles.noteText}>
                            تبيّن أن المشتبه به:
                        </Text>

                        <View style={styles.targetBox}>
                            <Text style={styles.targetName}>「 {targetName} 」</Text>
                        </View>

                        <Text style={styles.noteText}>ينتمي إلى:</Text>

                        <View style={[styles.resultBox, isCrime ? styles.resultCrime : styles.resultJustice]}>
                            <Text style={[styles.resultText, isCrime ? styles.resultTextCrime : styles.resultTextJustice]}>
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
                        <View style={[styles.stamp, isCrime ? styles.stampRed : styles.stampGreen]}>
                            <Text style={styles.stampText}>
                                {isCrime ? 'مشبوه\nجنائي' : 'مشبوه\nنظيف'}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* زر الإغلاق */}
                    <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
                        <Text style={styles.dismissText}>— تم الاطلاع —</Text>
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
