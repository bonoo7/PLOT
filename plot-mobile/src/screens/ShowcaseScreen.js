import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { getTheme } from '../constants/theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import MinimalCard from '../components/minimal/MinimalCard';
import MinimalButton from '../components/minimal/MinimalButton';
import { PlayerBadge } from '../components/minimal/PlayerBadge';
import { InvestigationNote } from '../components/InvestigationNote';
import { spacing, fonts } from '../styles/responsive';

export const ShowcaseScreen = ({ navigation }) => {
    const themeMode = useGameStore(state => state.themeMode);
    const setThemeMode = useGameStore(state => state.setThemeMode);
    const t = getTheme(themeMode);

    const toggleTheme = () => {
        setThemeMode(themeMode === 'light' ? 'dark' : 'light');
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: t.background }} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: t.text }]}>Component Showcase</Text>
                <MinimalButton title={themeMode === 'light' ? "🌙 داكن" : "☀️ فاتح"} onPress={toggleTheme} variant="secondary" />
                <MinimalButton title="رجوع" onPress={() => navigation.goBack()} variant="danger" />
            </View>

            {/* Typography */}
            <MinimalCard>
                <Text style={[styles.sectionTitle, { color: t.text }]}>Typography</Text>
                <Text style={{ fontFamily: fonts.primary, fontSize: 24, color: t.text }}>العنوان الرئيسي (24)</Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text }}>خط عريض (18)</Text>
                <Text style={{ fontFamily: fonts.typewriter, fontSize: 16, color: t.text }}>خط الآلة الكاتبة / Typewriter (16)</Text>
            </MinimalCard>

            {/* Buttons */}
            <MinimalCard>
                <Text style={[styles.sectionTitle, { color: t.text }]}>Buttons</Text>
                <View style={styles.buttonRow}>
                    <MinimalButton title="Primary" variant="primary" />
                    <MinimalButton title="Secondary" variant="secondary" />
                </View>
                <View style={styles.buttonRow}>
                    <MinimalButton title="Danger" variant="danger" />
                    <MinimalButton title="Outline" variant="outline" />
                </View>
                <MinimalButton title="Disabled" disabled={true} />
            </MinimalCard>

            {/* Player Badges */}
            <MinimalCard>
                <Text style={[styles.sectionTitle, { color: t.text }]}>Player Badges</Text>
                <View style={styles.badgeRow}>
                    <PlayerBadge name="أنا المحقق" isSelf={true} />
                    <PlayerBadge name="لاعب دائم" isActive={true} />
                    <PlayerBadge name="لاعب منتظر" />
                    <PlayerBadge name="شخص مقتول" isEliminated={true} />
                </View>
            </MinimalCard>

            {/* Investigation Note */}
            <MinimalCard>
                <Text style={[styles.sectionTitle, { color: t.text }]}>Investigation Note</Text>
                <InvestigationNote
                    text="هناك شخص يتآمر في الخفاء... هل هو الوزير؟ أم شخص آخر؟"
                />
                <InvestigationNote
                    text="لقد تم القبض على الجاني وتسليمه للعدالة."
                    result="criminal"
                />
                <InvestigationNote
                    text="تبين أن المشتبه به بريء تماماً من هذه التهمة."
                    result="innocent"
                />
            </MinimalCard>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: spacing.m,
        alignItems: 'center',
        gap: spacing.l,
        paddingBottom: 100
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
        flexWrap: 'wrap',
        gap: spacing.s
    },
    title: {
        fontSize: 28,
        fontFamily: fonts.bold,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: fonts.bold,
        marginBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        paddingBottom: spacing.s,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: spacing.m,
        gap: spacing.s
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.m
    }
});
