import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalCard from '../components/minimal/MinimalCard';
import MinimalButton from '../components/minimal/MinimalButton';
import { theme } from '../styles/theme';
import { fonts, spacing } from '../styles/responsive';

export const HowToPlayScreen = () => {
  const navigation = useNavigation();

  return (
    <MinimalLayout>
      <View style={styles.container}>
        <MinimalHeader title="دليل اللعبة" subtitle="كيف تلعب؟" />

        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>

          {/* Section 1: Game Flow */}
          <MinimalCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. سير اللعبة (Game Flow)</Text>

            <View style={styles.step}>
              <Text style={styles.stepTitle}>📝 مرحلة الكتابة (Drafting):</Text>
              <Text style={styles.text}>
                يقوم الجميع (بمن فيهم الجاني) بكتابة "سيناريو" أو "تبرير" بناءً على عنوان القضية.
                الجاني يمتلك القصة الكاملة، ويحاول تضليل الآخرين.
              </Text>
              <Text style={styles.note}>💡 ميزة جديدة: العروض والمفاوضات تتم في هذه المرحلة فقط.</Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepTitle}>🗳️ تصويت الجودة (Quality Vote):</Text>
              <Text style={styles.text}>
                تظهر جميع السيناريوهات (بدون أسماء). يصوت اللاعبون لأفضل سيناريو.
                الهدف: كسب نقاط إضافية.
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepTitle}>🎬 العرض التشويقي (Dramatic Reveal):</Text>
              <Text style={styles.text}>
                يتم كشف السيناريوهات بالترتيب من الأكثر تصويتًا إلى الأقل، مع كشف كاتب كل سيناريو.
              </Text>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepTitle}>🕵️ تصويت الجاني (Culprit Vote):</Text>
              <Text style={styles.text}>
                يصوت الجميع على من يعتقدون أنه "الجاني".
                    إذا حصل الجاني على أعلى الأصوات -> يفوز فريق العدالة.
                    إذا نجا الجاني -> يفوز فريق الجريمة.
              </Text>
            </View>
          </MinimalCard>

          {/* Section 2: Roles */}
          <MinimalCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. الأدوار (Roles)</Text>

            <Text style={styles.teamTitle}>👮 فريق العدالة (Justice Team)</Text>

            <View style={styles.roleBox}>
              <Text style={styles.roleHeader}>🕵️‍♂️ المحقق (Detective)</Text>
              <Text style={styles.text}>يمكنك فحص لاعب واحد لمعرفة فريقه (الجريمة أو العدالة). (+1000 نقطة إذا كشف الجاني).</Text>
            </View>

            <View style={styles.roleBox}>
              <Text style={styles.roleHeader}>👁️ الشاهد (Witness)</Text>
              <Text style={styles.text}>تظهر لك كلمات مفتاحية من القصة الحقيقية. (+50 نقطة لكل كلمة إذا كان سيناريوه الأفضل).</Text>
            </View>

            <View style={styles.roleBox}>
              <Text style={styles.roleHeader}>🔮 العرّاف (Seer)</Text>
              <Text style={styles.text}>يمكنك "نسخ" القصة الحقيقية وإرسالها مباشرة. (+500 نقطة إذا فعل ذلك وكان الأفضل).</Text>
            </View>

            <View style={styles.roleBox}>
              <Text style={styles.roleHeader}>📜 الوزير (Minister)</Text>
              <Text style={styles.text}>يعرف هوية المحقق والمستفيد. يبدأ بـ +1000 نقطة. يمكنه إرسال عروض لتحصين اللاعبين.</Text>
            </View>

            <Text style={[styles.teamTitle, { color: '#8B0000', marginTop: 15 }]}>🎭 فريق الجريمة (Crime Team)</Text>

            <View style={styles.roleBox}>
              <Text style={styles.roleHeader}>🎭 الجاني (Culprit)</Text>
              <Text style={styles.text}>يعرف القصة الكاملة. هدفه خداع الجميع والنجاة. (+500 نقطة للنجاة).</Text>
            </View>

            <View style={styles.roleBox}>
              <Text style={styles.roleHeader}>🧠 العقل المدبر (Mastermind)</Text>
              <Text style={styles.text}>يعرف جميع أعضاء فريقه. يعمل كوسيط للعروض ويحصل على 25% عمولة.</Text>
            </View>

            <View style={styles.roleBox}>
              <Text style={styles.roleHeader}>🧨 المخرب (Saboteur)</Text>
              <Text style={styles.text}>يمكنه اختيار لاعب لتغيير نتيجة فحصه من قبل المحقق (يظهر عكس فريقه).</Text>
            </View>

            <View style={styles.roleBox}>
              <Text style={styles.roleHeader}>💰 المستفيد (Beneficiary)</Text>
              <Text style={styles.text}>يبدأ بـ +1000 نقطة. يمكنه رشوة اللاعبين لتعطيل قدراتهم (الشاهد، العراف، المحقق).</Text>
            </View>
          </MinimalCard>

          {/* Section 3: Offers */}
          <MinimalCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. نظام العروض (Offers)</Text>
            <Text style={styles.text}>
              • يمكن للمستفيد والوزير إرسال "نقاط" للاعبين آخرين.
              {"\n"}• إذا قبل اللاعب العرض: يكسب النقاط، ولكن **تتعطل قدرته الخاصة**.
              {"\n"}• المستفيد يمكنه إرسال العرض عبر "العقل المدبر" (وسيط) لإخفاء هويته، مقابل 25% عمولة.
              {"\n"}• الوزير يحاول كشف المستفيد (إذا أرسل له عرضًا مباشرًا) أو تحصين المحقق.
            </Text>
          </MinimalCard>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <MinimalButton title="العودة للقائمة" onPress={() => navigation.goBack()} size="large" />
        </View>
      </View>
    </MinimalLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.m,
    gap: spacing.m,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: spacing.xl,
    gap: spacing.m,
  },
  sectionCard: {
    padding: spacing.l,
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: '#8B4513',
    marginBottom: spacing.m,
    textAlign: 'left',
  },
  step: {
    marginBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: spacing.s,
  },
  stepTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: '#2F4F4F',
    marginBottom: 4,
    textAlign: 'left',
  },
  text: {
    fontFamily: theme.fonts.main,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'left',
  },
  note: {
    fontFamily: theme.fonts.main,
    fontSize: 14,
    color: '#DAA520',
    marginTop: 4,
    textAlign: 'left',
  },
  teamTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: '#2F4F4F',
    marginBottom: 10,
    textAlign: 'center',
    backgroundColor: '#F0F0F0',
    padding: 5,
    borderRadius: 5,
  },
  roleBox: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#DDD',
  },
  roleHeader: {
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
    textAlign: 'left',
  },
  footer: {
    paddingTop: spacing.s,
  }
});
