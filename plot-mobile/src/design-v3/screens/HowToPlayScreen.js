import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TerminalButton, TerminalCard, TerminalHeader, TerminalLayout } from '../components';
import { ROLE_META, fontFamily, fontSize, getColors, sp } from '../tokens';

const FLOW = [
  { title: 'مرحلة الكتابة', text: 'يكتب كل لاعب روايته. الجاني يعرف الحقيقة ويحاول إخفاءها بين السطور.' },
  { title: 'تصويت الجودة', text: 'تظهر الإجابات مجهولة. صوّت لأفضل رواية دون معرفة صاحبها.' },
  { title: 'مرحلة النقاش', text: 'المتهمون يتحدثون بالتتابع. راقب التناقضات وابحث عن الدافع.' },
  { title: 'تصويت الجاني', text: 'اختر الشخص الذي تعتقد أنه الجاني. القرار الجماعي يحسم الجولة.' },
  { title: 'النتائج', text: 'تنكشف الأدوار وتحتسب النقاط. الفائز يتصدر لوحة النتائج.' },
];

export const HowToPlayScreen = () => {
  const navigation = useNavigation();
  const [tab, setTab] = React.useState('flow');
  const c = getColors();
  const roles = Object.values(ROLE_META);

  return (
    <TerminalLayout
      top={<TerminalHeader title="GAME MANUAL" subtitle="دليل لعب سريع" />}
      bottom={<TerminalButton title="← رجوع" onPress={() => navigation.goBack()} variant="ghost" size="sm" />}
    >
      <View style={styles.container}>
        <View style={styles.tabs}>
          {[
            { key: 'flow', label: '> المراحل' },
            { key: 'roles', label: '> الأدوار' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, { borderColor: tab === item.key ? c.borderBright : c.border, backgroundColor: tab === item.key ? 'rgba(0,255,65,0.08)' : c.bgAlt }]}
              onPress={() => setTab(item.key)}
            >
              <Text style={[styles.tabText, { color: tab === item.key ? c.accentGreen : c.textMuted }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {tab === 'flow'
            ? FLOW.map((step, index) => (
                <TerminalCard key={step.title} title={`> STEP ${index + 1}`} tone="info">
                  <Text style={[styles.cardTitle, { color: c.textPrimary }]}>{step.title}</Text>
                  <Text style={[styles.cardText, { color: c.textSub }]}>{step.text}</Text>
                </TerminalCard>
              ))
            : roles.map((role) => (
                <TerminalCard key={role.code} title={role.bracket} tone="special">
                  <Text style={[styles.roleLine, { color: role.color }]}>{`${role.emoji} ${role.name}`}</Text>
                  <Text style={[styles.cardText, { color: c.textSub }]}>{role.team === 'CRIME' ? 'فريق الجريمة' : role.team === 'JUSTICE' ? 'فريق العدالة' : 'فريق محايد'}</Text>
                </TerminalCard>
              ))}
        </ScrollView>
      </View>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: sp.s,
  },
  tabs: {
    flexDirection: 'row',
    gap: sp.s,
  },
  tab: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: sp.s,
    alignItems: 'center',
  },
  tabText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
  scrollContent: {
    gap: sp.s,
    paddingBottom: sp.l,
  },
  cardTitle: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    fontWeight: '700',
    marginBottom: sp.xs,
  },
  cardText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  roleLine: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    fontWeight: '700',
    marginBottom: sp.xs,
  },
});
