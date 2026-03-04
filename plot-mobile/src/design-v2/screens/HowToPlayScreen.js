/**
 * design-v2/screens/HowToPlayScreen.js
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DossierLayout, DossierCard, StampButton, CaseHeader, ClassifiedBanner } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';
import { useGameStore } from '../../store/useGameStore';

const SECTIONS = [
  {
    emoji: '📝',
    title: 'مرحلة الكتابة',
    text: 'الجميع يكتب سيناريو بناءً على عنوان القضية. الجاني يعرف القصة الكاملة ويحاول التضليل.',
  },
  {
    emoji: '🗳️',
    title: 'تصويت الجودة',
    text: 'تظهر السيناريوهات بدون أسماء. يصوت اللاعبون للأفضل — نقاط إضافية للفائز.',
  },
  {
    emoji: '💬',
    title: 'مرحلة النقاش',
    text: 'اللاعبون يتناقشون ويحاولون كشف الجاني. المحقق يحقق، المخرب يضلل.',
  },
  {
    emoji: '⚖️',
    title: 'تصويت الجاني',
    text: 'التصويت على من تظنه الجاني. الأغلبية تكشف الحقيقة.',
  },
  {
    emoji: '🏆',
    title: 'النتائج',
    text: 'كشف الجاني + الأدوار + النقاط. الفريق الصح يفوز إذا كشف الجاني.',
  },
];

const ROLES = [
  { emoji: '🎭', name: 'الجاني',        desc: 'يعرف الحقيقة ويحاول الإفلات' },
  { emoji: '👁️', name: 'الشاهد',       desc: 'رأى شيئاً — لكن هل يتذكر؟' },
  { emoji: '🕵️', name: 'المحقق',       desc: 'يمكنه التحقيق مع لاعب مرة واحدة' },
  { emoji: '🧨', name: 'المخرب',       desc: 'يحاول إفشال التحقيق' },
  { emoji: '📜', name: 'الوزير',        desc: 'يؤثر على مسار التصويت' },
  { emoji: '💰', name: 'المستفيد',      desc: 'مصلحته مع الجاني' },
  { emoji: '🔮', name: 'العرّاف',       desc: 'يرى هويات الآخرين' },
  { emoji: '🧠', name: 'العقل المدبر',  desc: 'يخطط للجميع' },
];

export const HowToPlayScreen = () => {
  const navigation = useNavigation();
  const themeMode  = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);
  const [tab, setTab] = useState('flow'); // 'flow' | 'roles'

  return (
    <DossierLayout
      top={
        <CaseHeader mode="neutral" title="دليل اللعبة" subtitle="كيف تلعب؟" />
      }
      bottom={
        <StampButton title="← رجوع" onPress={() => navigation.goBack()} variant="ghost" size="sm" />
      }
    >
      {/* Tabs */}
      <View style={[styles.tabs, { borderColor: c.border }]}>
        {[
          { key: 'flow',  label: 'سير اللعبة' },
          { key: 'roles', label: 'الأدوار' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && { backgroundColor: c.red }]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, { color: tab === t.key ? '#FFF' : c.textSub }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: sp.s, paddingBottom: sp.m }}>
        {tab === 'flow' && SECTIONS.map((s, i) => (
          <View key={i} style={[styles.step, { borderColor: c.border }]}>
            <Text style={styles.stepEmoji}>{s.emoji}</Text>
            <View style={{ flex: 1, gap: sp.xxs }}>
              <Text style={[styles.stepTitle, { color: c.text }]}>{s.title}</Text>
              <Text style={[styles.stepText,  { color: c.textSub }]}>{s.text}</Text>
            </View>
          </View>
        ))}

        {tab === 'roles' && (
          <View style={styles.rolesGrid}>
            {ROLES.map((r, i) => (
              <View key={i} style={[styles.roleCard, { borderColor: c.border, backgroundColor: c.cardBg }]}>
                <Text style={styles.roleEmoji}>{r.emoji}</Text>
                <Text style={[styles.roleName, { color: c.text }]}>{r.name}</Text>
                <Text style={[styles.roleDesc, { color: c.textMuted }]}>{r.desc}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.s,
    overflow: 'hidden',
    marginBottom: sp.s,
  },
  tab: {
    flex: 1,
    paddingVertical: sp.xs + 2,
    alignItems: 'center',
  },
  tabText: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
  step: {
    flexDirection: 'row',
    gap: sp.m,
    borderWidth: 1,
    borderRadius: radius.m,
    padding: sp.m,
    alignItems: 'flex-start',
  },
  stepEmoji: { fontSize: 20, lineHeight: 26 },
  stepTitle: {
    fontSize: fontSize.medium,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
  stepText: {
    fontSize: fontSize.body,
    fontFamily: fontFamily.mono,
    lineHeight: fontSize.body * 1.5,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp.s,
  },
  roleCard: {
    width: '47%',
    padding: sp.m,
    borderWidth: 1,
    borderRadius: radius.m,
    gap: sp.xxs,
    alignItems: 'flex-end',
  },
  roleEmoji: { fontSize: 20 },
  roleName: {
    fontSize: fontSize.body,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
  roleDesc: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
    textAlign: 'right',
    lineHeight: fontSize.label * 1.5,
  },
});
