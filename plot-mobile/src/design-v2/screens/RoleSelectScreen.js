/**
 * design-v2/screens/RoleSelectScreen.js
 * Entry screen — choose Host / Player / Training / How To Play
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../../store/useGameStore';
import { ROUTES } from '../../hooks/useGameSocket';
import { playMusic } from '../../utils/soundManager';
import { DossierLayout, DossierCard, StampButton, CaseHeader } from '../components';
import { getColors, sp, fontSize, fontFamily, radius, useLayout } from '../tokens';

const MENU_ITEMS = [
  { key: 'host',     emoji: '🎯', title: 'مضيف',        desc: 'إنشاء غرفة جديدة',       role: 'HOST',   route: ROUTES.HOST_SETUP },
  { key: 'player',   emoji: '🕵️', title: 'لاعب',        desc: 'انضمام للعبة',           role: 'PLAYER', route: ROUTES.LOGIN },
  { key: 'training', emoji: '🤖', title: 'تدريب',       desc: 'اللعب مع بوتات',         role: 'PLAYER', route: ROUTES.TRAINING_ROLE_SELECT },
  { key: 'howto',    emoji: '📖', title: 'دليل اللعبة', desc: 'شرح الأدوار والقوانين',  role: null,     route: ROUTES.HOW_TO_PLAY },
];

export const RoleSelectScreen = () => {
  const navigation  = useNavigation();
  const setUserRole = useGameStore(s => s.setUserRole);
  const themeMode   = useGameStore(s => s.themeMode) || 'light';
  const setTheme    = useGameStore(s => s.setThemeMode);
  const setDesign   = useGameStore(s => s.setDesignVersion);
  const c = getColors(themeMode);
  const { isLandscape, isDesktop } = useLayout();

  React.useEffect(() => { playMusic('lobby'); }, []);

  const handleSelect = (item) => {
    if (item.role) setUserRole(item.role);
    navigation.navigate(item.route);
  };

  return (
    <DossierLayout
      top={
        <CaseHeader
          mode="neutral"
          title="القائمة الرئيسية"
          subtitle="لعبة التحقيقات السرية — PLOT"
        />
      }
      bottom={
        <View style={styles.footerRow}>
          <Text style={[styles.footerNote, { color: c.textMuted }]}>4 – 8 لاعبين</Text>
          <View style={styles.footerBtns}>
            <StampButton
              title={themeMode === 'light' ? '🌙 داكن' : '☀️ فاتح'}
              onPress={() => setTheme(themeMode === 'light' ? 'dark' : 'light')}
              variant="ghost"
              size="sm"
            />
            <StampButton
              title="← V1"
              onPress={() => setDesign?.('v1')}
              variant="ghost"
              size="sm"
            />
            <StampButton
              title="← V3"
              onPress={() => setDesign?.('v3')}
              variant="ghost"
              size="sm"
            />
          </View>
        </View>
      }
    >
      {/* Grid — 2 cols on landscape/desktop, 1 col on portrait mobile */}
      <View style={[styles.grid, (isLandscape || isDesktop) && styles.gridWide]}>
        {MENU_ITEMS.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.menuCard,
              { backgroundColor: c.cardBg, borderColor: c.border },
              (isLandscape || isDesktop) && styles.menuCardWide,
            ]}
            onPress={() => handleSelect(item)}
            activeOpacity={0.75}
          >
            <Text style={styles.menuEmoji}>{item.emoji}</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: c.text }]}>{item.title}</Text>
              <Text style={[styles.menuDesc,  { color: c.textMuted }]}>{item.desc}</Text>
            </View>
            <Text style={[styles.arrow, { color: c.textMuted }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </DossierLayout>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: sp.s,
    paddingTop: sp.xs,
    paddingBottom: sp.s,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sp.s,
    paddingHorizontal: sp.m,
    borderRadius: radius.m,
    borderWidth: 1.5,
    gap: sp.s,
    minHeight: 48,
  },
  menuCardWide: {
    flex: 1,
    minWidth: 160,
    maxWidth: '48%',
  },
  menuEmoji: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    gap: sp.xxs,
  },
  menuTitle: {
    fontSize: fontSize.medium,
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
  menuDesc: {
    fontSize: fontSize.small,
    fontFamily: fontFamily.mono,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '700',
  },
  footerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerNote: {
    fontSize: fontSize.label,
    fontFamily: fontFamily.mono,
  },
  footerBtns: {
    flexDirection: 'row',
    gap: sp.xs,
  },
});
