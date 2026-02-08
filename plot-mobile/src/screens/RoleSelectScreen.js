import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MinimalLayout from '../components/minimal/MinimalLayout';
import MinimalHeader from '../components/minimal/MinimalHeader';
import MinimalCard from '../components/minimal/MinimalCard';
import { theme } from '../styles/theme';
import { spacing, fonts, moderateScale, borderRadius } from '../styles/responsive';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

/**
 * RoleSelectScreen_v3 - Minimalist design.
 * Full screen layout with centered cards.
 */
export const RoleSelectScreen = ({ onSelectHost, onSelectPlayer, onSelectTraining }) => {
  const { isDesktop, isLandscape } = useResponsiveLayout();

  // Determine layout direction based on screen size/orientation
  const isHorizontalLayout = isDesktop || isLandscape;

  return (
    <MinimalLayout>
      <MinimalHeader 
        title="PLOT" 
        subtitle="لعبة التحقيقات السرية" 
      />

      <View style={[
        styles.contentContainer,
        isHorizontalLayout && styles.contentContainerHorizontal
      ]}>
        
        {/* Role Cards Container */}
        <View style={[
          styles.cardsWrapper,
          isHorizontalLayout && styles.cardsWrapperHorizontal
        ]}>
          
          {/* Host Card */}
          <RoleCard 
            title="المضيف"
            description="إنشاء غرفة جديدة"
            onPress={onSelectHost}
            color="#EBE1D2"
          />

          {/* Player Card */}
          <RoleCard 
            title="لاعب"
            description="انضمام للعبة"
            onPress={onSelectPlayer}
            color="#EBE1D2"
          />

          {/* Training Card */}
          <RoleCard 
            title="تدريب"
            description="اللعب مع بوتات"
            onPress={onSelectTraining}
            color="#FFF0C8"
            borderColor={theme.colors.accentYellow}
          />
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>عدد اللاعبين: 4 - 8</Text>
        </View>
      </View>
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
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.l,
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
  footer: {
    marginTop: spacing.m,
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
