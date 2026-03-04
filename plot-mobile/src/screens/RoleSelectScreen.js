import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalButton from '../components/minimal/MinimalButton';
import { theme } from '../styles/theme';
import { spacing, fonts, borderRadius } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useGameStore } from '../store/useGameStore';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../hooks/useGameSocket';

/**
 * RoleSelectScreen - Minimalist design.
 * Full screen layout with centered cards.
 */
export const RoleSelectScreen = () => {
  const { isDesktop, isLandscape } = useResponsiveLayout();
  const navigation = useNavigation();
  const setUserRole = useGameStore((state) => state.setUserRole);
  const themeMode = useGameStore(state => state.themeMode);
  const setThemeMode = useGameStore(state => state.setThemeMode);
  const setDesignVersion = useGameStore(state => state.setDesignVersion);

  // Determine layout direction based on screen size/orientation
  const isHorizontalLayout = isDesktop || isLandscape;

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  const handleSelectHost = () => {
    setUserRole('HOST');
    navigation.navigate(ROUTES.HOST_SETUP);
  };

  const handleSelectPlayer = () => {
    setUserRole('PLAYER');
    navigation.navigate(ROUTES.LOGIN);
  };

  const handleSelectTraining = () => {
    setUserRole('PLAYER');
    navigation.navigate(ROUTES.TRAINING_ROLE_SELECT);
  };

  const handleHowToPlay = () => {
    navigation.navigate(ROUTES.HOW_TO_PLAY);
  };

  return (
    <MinimalLayout>
      <MinimalHeader
        title="PLOT"
        subtitle="لعبة التحقيقات السرية"
      />

      <ScrollView
        style={{ width: '100%' }}
        contentContainerStyle={[
          styles.contentContainer,
          isHorizontalLayout && styles.contentContainerHorizontal
        ]}
      >

        {/* Role Cards Container */}
        <View style={[
          styles.cardsWrapper,
          isHorizontalLayout && styles.cardsWrapperHorizontal
        ]}>

          {/* Host Card */}
          <RoleCard
            title="المضيف"
            description="إنشاء غرفة جديدة"
            onPress={handleSelectHost}
            color="#EBE1D2"
          />

          {/* Player Card */}
          <RoleCard
            title="لاعب"
            description="انضمام للعبة"
            onPress={handleSelectPlayer}
            color="#EBE1D2"
          />

          {/* Training Card */}
          <RoleCard
            title="تدريب"
            description="اللعب مع بوتات"
            onPress={handleSelectTraining}
            color="#FFF0C8"
            borderColor={theme.colors.accentYellow}
          />

          {/* How To Play Card */}
          <RoleCard
            title="دليل اللعبة"
            description="شرح الأدوار والقوانين"
            onPress={handleHowToPlay}
            color="#E0F7FA"
            borderColor="#006064"
          />
          {/* Component Showcase Card */}
          <RoleCard
            title="اختبار المكونات"
            description="معاينة الواجهة"
            onPress={() => navigation.navigate(ROUTES.SHOWCASE)}
            color="#E0E0E0"
            borderColor="#9E9E9E"
          />
        </View>

        {/* Footer Info & Theme Toggle */}
        <View style={styles.footerRow}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>عدد اللاعبين: 4 - 8</Text>
          </View>
          <MinimalButton
            title="🆕 تصميم V2"
            onPress={() => setDesignVersion('v2')}
            variant="secondary"
            size="small"
          />
          <MinimalButton
            title={themeMode === 'light' ? "🌙 داكن" : "☀️ فاتح"}
            onPress={toggleTheme}
            variant="secondary"
            size="small"
          />
        </View>
      </ScrollView>
    </MinimalLayout>
  );
};

const RoleCard = ({ title, description, onPress, color, borderColor }) => (
  <TouchableOpacity
    style={[
      styles.card,
      { backgroundColor: color, borderColor: borderColor || '#8B7355' }
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardDesc}>{description}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.l,
    paddingVertical: spacing.l,
  },
  contentContainerHorizontal: {
    justifyContent: 'center',
  },
  cardsWrapper: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.m,
  },
  cardsWrapperHorizontal: {
    flexDirection: 'row',
    maxWidth: 900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  footer: {
    padding: spacing.s,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: borderRadius.medium,
  },
  footerText: {
    color: '#FFD700',
    fontFamily: theme.fonts.main,
    fontSize: fonts.small,
  },

  // Card Internal Styles
  card: {
    padding: spacing.l,
    borderRadius: borderRadius.small,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    flex: 1, // Distribute space equally in flex container
    minHeight: 120, // Minimum height for touch target
    width: '100%', // Full width in vertical mode
  },
  cardTitle: {
    fontSize: fonts.large,
    fontFamily: theme.fonts.heading,
    fontWeight: 'bold',
    color: '#2C1810',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: fonts.small,
    fontFamily: theme.fonts.main,
    color: '#5C4A3A',
    textAlign: 'center',
  },
});

export default RoleSelectScreen;
