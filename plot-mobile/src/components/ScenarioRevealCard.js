import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';
import { fonts, spacing, borderRadius } from '../styles/responsive';
import { PlayerBadge } from './minimal/PlayerBadge';

/**
 * يحلل النص مع القالب لإيجاد الكلمات المملوءة (وضع Blitz)
 * يُرجع مصفوفة: [{ text, filled }]
 */
function getHighlightedParts(text, template) {
    if (!template || !template.includes('_____')) return [{ text, filled: false }];
    const parts = template.split('_____');
    const result = [];
    let remaining = text;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue; // فراغ فارغ (قالب يبدأ بفراغ)
        const idx = remaining.indexOf(part);
        if (idx === -1) {
            result.push({ text: remaining, filled: false });
            remaining = '';
            break;
        }
        if (idx > 0) {
            result.push({ text: remaining.substring(0, idx), filled: true });
        }
        result.push({ text: part, filled: false });
        remaining = remaining.substring(idx + part.length);
    }
    if (remaining.length > 0) {
        result.push({ text: remaining, filled: true });
    }
    return result;
}

/**
 * ScenarioRevealCard
 *
 * بطاقة عرض السيناريو مع badges مدمجة:
 * - Author Badge يتداخل مع الحافة العلوية للكارت (negative margin)
 * - Voter Badges تتداخل مع الحافة السفلية للكارت (negative margin)
 * - النص محمي دائماً من التغطية بغض النظر عن عدد المصوتين
 * - يستخدم التدفق الطبيعي (لا position: absolute) لضمان عدم التغطية
 * - في وضع Blitz: يُلوّن الكلمات المملوءة بلون مختلف (template prop)
 *
 * Props:
 *   text       {string}   - نص السيناريو
 *   template   {string}   - القالب الأصلي مع _____ (Blitz فقط)
 *   author     {string}   - اسم الكاتب (undefined = لم يُكشف بعد)
 *   voters     {string[]} - أسماء المصوتين (undefined = لم يُكشف بعد)
 *   isComplete {boolean}  - هل تم الكشف الكامل؟ (يغير لون الحدود)
 *   style      {object}   - أنماط إضافية للحاوية الخارجية
 */
export const ScenarioRevealCard = ({ text, template, author, voters, isComplete = false, style }) => {
    const hasAuthor = author !== undefined;
    const hasVoters = voters !== undefined;
    const parts = template ? getHighlightedParts(text, template) : null;

    return (
        <View style={[styles.wrapper, style]}>
            {/* Author Badge — يتداخل مع الحافة العلوية بـ marginBottom سالب */}
            {hasAuthor && (
                <View style={styles.authorRow}>
                    <PlayerBadge name={author} size="medium" />
                </View>
            )}

            {/* بطاقة السيناريو — padding يحمي النص من أي تغطية */}
            <View style={[
                styles.card,
                isComplete && styles.cardComplete,
                hasAuthor && styles.cardWithAuthor,
            ]}>
                {parts ? (
                    <Text style={styles.scenarioText}>
                        {parts.map((p, i) => (
                            <Text key={i} style={p.filled ? styles.filledWord : undefined}>
                                {p.text}
                            </Text>
                        ))}
                    </Text>
                ) : (
                    <Text style={styles.scenarioText}>"{text}"</Text>
                )}
            </View>

            {/* Voter Badges — يتداخل مع الحافة السفلية بـ marginTop سالب */}
            {/* التدفق الطبيعي يضمن أن أي عدد من الأسطر لن يغطي النص أبداً */}
            {hasVoters && (
                <View style={styles.votersRow}>
                    {voters.length > 0 ? (
                        voters.map((v, i) => (
                            <PlayerBadge key={i} name={v} size="small" />
                        ))
                    ) : (
                        <Text style={styles.noVotes}>لا أحد</Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        alignItems: 'center',
    },
    // Author Badge: marginBottom سالب → يتداخل مع حافة الكارت العلوية فقط
    authorRow: {
        zIndex: 2,
        marginBottom: -18,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        backgroundColor: '#FDF5E6',
        borderWidth: 2,
        borderColor: '#D2B48C',
        borderRadius: borderRadius.medium,
        paddingHorizontal: spacing.l,
        paddingVertical: spacing.l,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    cardComplete: {
        backgroundColor: '#FFF8DC',
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    // مسافة كافية في الأعلى لإخراج النص عن منطقة الـ badge المتداخلة
    cardWithAuthor: {
        paddingTop: 32,
    },
    scenarioText: {
        fontSize: fonts.medium,
        fontFamily: theme.fonts.main,
        textAlign: 'center',
        lineHeight: 28,
        color: '#333',
    },
    // الكلمات المملوءة في وضع Blitz — لون ذهبي بارز
    filledWord: {
        color: '#B8860B',
        fontFamily: theme.fonts.bold,
        textDecorationLine: 'underline',
    },
    // Voter Badges: marginTop سالب → يتداخل مع حافة الكارت السفلية فقط
    // التدفق الطبيعي يسمح بأي عدد من الأسطر دون أن تغطي النص
    votersRow: {
        zIndex: 2,
        marginTop: -14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.m,
    },
    noVotes: {
        color: '#999',
        fontSize: fonts.small,
        fontStyle: 'italic',
        fontFamily: theme.fonts.main,
    },
});

