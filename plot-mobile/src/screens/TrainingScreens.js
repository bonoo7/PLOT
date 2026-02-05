import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image, ImageBackground } from 'react-native';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius, getContainerPadding } from '../styles/responsive';
import { Button, TextInput, Card } from '../ui';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

// خريطة صور الأدوار
const ROLE_IMAGES = {
  WITNESS: require('../../assets/roles/WITNESS.png'),
  ARCHITECT: require('../../assets/roles/ARCHITECT.png'),
  DETECTIVE: require('../../assets/roles/DETECTIVE.png'),
  SPY: require('../../assets/roles/SPY.png'),
  ACCOMPLICE: require('../../assets/roles/ACCOMPLICE.png'),
  LAWYER: require('../../assets/roles/LAWYER.png'),
  TRICKSTER: require('../../assets/roles/TRICKSTER.png'),
  CITIZEN: require('../../assets/roles/CITIZEN.png'),
};

/**
 * شاشة اختيار الدور للتدريب
 */
export const TrainingRoleSelectScreen = ({ onSelectRole, onBack }) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  const roles = [
    { id: 'CULPRIT', nameAr: 'الجاني', description: 'تعرف القصة الكاملة', image: ROLE_IMAGES.TRICKSTER },
    { id: 'FORGER', nameAr: 'المزور', description: 'احصل على كلمات مفتاحية', image: ROLE_IMAGES.ARCHITECT },
    { id: 'CHIEF_DETECTIVE', nameAr: 'المحقق الرئيسي', description: 'اكتشف الحقيقة', image: ROLE_IMAGES.DETECTIVE },
    { id: 'INFILTRATOR', nameAr: 'المخترق', description: 'تجسس على الفريق', image: ROLE_IMAGES.SPY },
    { id: 'ACCOMPLICE', nameAr: 'الشريك', description: 'ساعد الجاني', image: ROLE_IMAGES.ACCOMPLICE },
    { id: 'SABOTEUR', nameAr: 'المخرب', description: 'أربك الجميع', image: ROLE_IMAGES.LAWYER },
  ];

  return (
    <ImageBackground
      source={require('../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>تدريب فردي</Text>
            <Text style={styles.subtitle}>اختر الدور الذي تريد لعبه</Text>
          </View>

          {/* Roles Grid */}
          <View style={styles.rolesGrid}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={styles.roleCard}
                onPress={() => onSelectRole(role.id)}
                activeOpacity={0.8}
              >
                {role.image && (
                  <Image 
                    source={role.image} 
                    style={styles.roleImage}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.roleName}>{role.nameAr}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </TouchableOpacity>
            ))}
            
            {/* Random Role */}
            <TouchableOpacity
              style={[styles.roleCard, styles.randomCard]}
              onPress={() => onSelectRole(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.roleName}>دور عشوائي</Text>
              <Text style={styles.roleDescription}>اختيار عشوائي</Text>
            </TouchableOpacity>
          </View>

          {/* Back Button */}
          <Button
            title="رجوع"
            onPress={onBack}
            variant="secondary"
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  </ImageBackground>
  );
};

/**
 * شاشة الانضمام للغرفة للتدريب
 */
export const TrainingJoinScreen = ({ 
  selectedRole, 
  playerName, 
  setPlayerName, 
  roomCode, 
  setRoomCode, 
  onJoin, 
  connecting,
  onBack 
}) => {
  const { isDesktop } = useResponsiveLayout();
  const styles = useMemo(() => getStyles(isDesktop), [isDesktop]);

  const getRoleInfo = (roleId) => {
    const roles = {
      'CULPRIT': { nameAr: 'الجاني' },
      'FORGER': { nameAr: 'المزور' },
      'CHIEF_DETECTIVE': { nameAr: 'المحقق الرئيسي' },
      'INFILTRATOR': { nameAr: 'المخترق' },
      'ACCOMPLICE': { nameAr: 'الشريك' },
      'SABOTEUR': { nameAr: 'المخرب' },
    };
    return roles[roleId] || { nameAr: 'دور عشوائي' };
  };

  const roleInfo = getRoleInfo(selectedRole);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>تدريب فردي</Text>
            <Text style={styles.subtitle}>الدور المختار</Text>
          </View>

          {/* Selected Role Card */}
          <Card style={styles.selectedRoleCard}>
            <Text style={styles.selectedRoleName}>{roleInfo.nameAr}</Text>
          </Card>

          {/* Input Fields */}
          <View style={styles.form}>
            <TextInput
              label="اسمك"
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="أدخل اسمك"
              maxLength={20}
            />
            
            <TextInput
              label="رمز الغرفة"
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              placeholder="مثال: ABCD"
              maxLength={6}
              autoCapitalize="characters"
              style={styles.codeInput}
            />
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              يجب على المضيف إنشاء الغرفة أولاً وإضافة البوتات (3 على الأقل)
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Button
              title={connecting ? 'جاري الانضمام...' : 'انضم للغرفة'}
              onPress={onJoin}
              loading={connecting}
              disabled={connecting || !playerName.trim() || !roomCode.trim()}
            />
            
            <Button
              title="رجوع"
              onPress={onBack}
              variant="secondary"
              style={styles.backButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (isDesktop) => StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1410',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: isDesktop ? spacing.xs : spacing.xl,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: getContainerPadding(),
    maxWidth: isDesktop ? '90%' : 900,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: isDesktop ? moderateScale(1) : spacing.xxl,
  },
  title: {
    fontSize: isDesktop ? fonts.medium : fonts.xxlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.main,
    color: '#E8DCC8',
  },

  // Roles Grid
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  roleCard: {
    width: isDesktop ? '22%' : '48%',
    minWidth: 150,
    backgroundColor: 'rgba(235, 225, 210, 0.95)',
    borderRadius: borderRadius.small,
    padding: isDesktop ? moderateScale(2) : spacing.s,
    marginBottom: isDesktop ? moderateScale(2) : spacing.s,
    borderWidth: 2,
    borderColor: '#8B7355',
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  randomCard: {
    backgroundColor: 'rgba(255, 240, 200, 0.95)',
    borderColor: theme.colors.accentYellow,
    borderWidth: 2,
  },
  roleImage: {
    width: isDesktop ? moderateScale(60) : moderateScale(70),
    height: isDesktop ? moderateScale(60) : moderateScale(70),
    marginBottom: spacing.xs,
  },
  roleName: {
    fontSize: isDesktop ? fonts.tiny : fonts.medium,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: isDesktop ? moderateScale(7) : fonts.small,
    fontFamily: theme.fonts.main,
    color: '#5C4A3A',
    textAlign: 'center',
  },

  // Selected Role Card
  selectedRoleCard: {
    alignItems: 'center',
    padding: spacing.l,
    marginBottom: spacing.l,
    backgroundColor: theme.colors.accentYellow + '15',
    borderColor: theme.colors.accentYellow,
    borderWidth: 1.5,
    maxWidth: isDesktop ? 500 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  selectedRoleName: {
    fontSize: fonts.xlarge,
    fontFamily: theme.fonts.heading,
    fontWeight: '700',
    color: theme.colors.text,
  },

  // Form
  form: {
    marginBottom: spacing.l,
    maxWidth: isDesktop ? 400 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  codeInput: {
    marginTop: spacing.m,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    padding: isDesktop ? moderateScale(3) : spacing.m,
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: isDesktop ? moderateScale(2) : spacing.xl,
    alignItems: 'center',
    maxWidth: isDesktop ? 600 : '100%',
    width: '100%',
    alignSelf: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: '#FFD700',
    lineHeight: fonts.small * 1.5,
    textAlign: 'center',
  },

  // Buttons
  buttons: {
    gap: isDesktop ? moderateScale(3) : spacing.m,
    maxWidth: isDesktop ? 400 : undefined,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    marginTop: isDesktop ? moderateScale(3) : spacing.m,
    maxWidth: isDesktop ? '100%' : 450,
    alignSelf: 'center',
  },
});
