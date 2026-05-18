import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../hooks/useGameSocket';
import { useGameStore } from '../../store/useGameStore';
import { playMusic } from '../../utils/soundManager';
import { BlinkCursor, GlitchText, TerminalButton, TerminalCard, TerminalHeader, TerminalLayout } from '../components';
import { alpha, fontFamily, fontSize, getColors, sp, useLayout } from '../tokens';

const MENU_ITEMS = [
  { key: 'host', command: '> HOST_MODE', label: 'مضيف', desc: 'إنشاء غرفة جديدة والتحكم بالجولة', role: 'HOST', route: ROUTES.HOST_SETUP },
  { key: 'player', command: '> PLAYER_LOGIN', label: 'لاعب', desc: 'الانضمام إلى غرفة جارية', role: 'PLAYER', route: ROUTES.LOGIN },
  { key: 'training', command: '> TRAINING_SIM', label: 'تدريب', desc: 'لعبة تدريبية مع أدوار محددة', role: 'PLAYER', route: ROUTES.TRAINING_ROLE_SELECT },
  { key: 'guide', command: '> OPEN_MANUAL', label: 'دليل', desc: 'شرح المراحل والأدوار', role: null, route: ROUTES.HOW_TO_PLAY },
];

const BOOT_LINES = [
  '$ initializing phosphor display...',
  '$ loading secure arabic game kernel...',
  '$ mounting deduction engine...',
  '$ ready for input',
];

export const RoleSelectScreen = () => {
  const navigation = useNavigation();
  const setUserRole = useGameStore((s) => s.setUserRole);
  const setDesignVersion = useGameStore((s) => s.setDesignVersion);
  const [visibleLines, setVisibleLines] = React.useState(0);
  const c = getColors();
  const { isLandscape, isDesktop } = useLayout();
  const wide = isLandscape || isDesktop;

  React.useEffect(() => {
    playMusic('lobby');
    const interval = setInterval(() => {
      setVisibleLines((current) => {
        if (current >= BOOT_LINES.length) {
          clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 320);

    return () => clearInterval(interval);
  }, []);

  const handleSelect = (item) => {
    if (item.role) setUserRole(item.role);
    navigation.navigate(item.route);
  };

  const bootReady = visibleLines >= BOOT_LINES.length;

  return (
    <TerminalLayout
      top={<TerminalHeader title="RETRO TERMINAL" subtitle="P.L.O.T // SOCIAL DEDUCTION SYSTEM" />}
      bottom={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: c.textMuted }]}>V3 RETRO TERMINAL // 4-8 لاعبين</Text>
          <View style={styles.footerButtons}>
            <TerminalButton title="← V1" onPress={() => setDesignVersion('v1')} variant="ghost" size="sm" />
            <TerminalButton title="← V2" onPress={() => setDesignVersion('v2')} variant="ghost" size="sm" />
          </View>
        </View>
      }
    >
      <View style={styles.screen}>
        <TerminalCard tone="success" style={styles.heroCard}>
          <GlitchText text="P.L.O.T" glitch intensity="med" style={[styles.heroTitle, { color: c.accentGreen }]} />
          <Text style={[styles.heroSub, { color: c.textSub }]}>> ملف اجتماعي للغموض والخداع</Text>
        </TerminalCard>

        <TerminalCard title="> BOOT LOG" tone="info">
          <View style={styles.bootLog}>
            {BOOT_LINES.slice(0, visibleLines).map((line) => (
              <Text key={line} style={[styles.bootLine, { color: c.textSub }]}>{line}</Text>
            ))}
            {!bootReady ? <BlinkCursor /> : <Text style={[styles.bootLine, { color: c.accentGreen }]}>$ command interface unlocked</Text>}
          </View>
        </TerminalCard>

        <View style={[styles.menuGrid, wide && styles.menuGridWide]}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.85}
              disabled={!bootReady}
              onPress={() => handleSelect(item)}
              style={[
                styles.menuCard,
                {
                  opacity: bootReady ? 1 : 0.45,
                  borderColor: bootReady ? c.borderBright : c.border,
                  backgroundColor: alpha(c.surfaceAlt, 'E0'),
                },
                wide && styles.menuCardWide,
              ]}
            >
              <Text style={[styles.menuCommand, { color: c.accentGreen }]}>{item.command}</Text>
              <Text style={[styles.menuLabel, { color: c.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.menuDesc, { color: c.textMuted }]}>{item.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: sp.s,
    justifyContent: 'space-between',
  },
  heroCard: {
    alignItems: 'flex-start',
    gap: sp.xs,
  },
  heroTitle: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.display,
    fontWeight: '700',
    letterSpacing: 4,
  },
  heroSub: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
  },
  bootLog: {
    gap: sp.xs,
    minHeight: 86,
  },
  bootLine: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
  },
  menuGrid: {
    gap: sp.s,
  },
  menuGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  menuCard: {
    borderWidth: 1,
    padding: sp.m,
    gap: sp.xs,
  },
  menuCardWide: {
    width: '48%',
  },
  menuCommand: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.medium,
    fontWeight: '700',
  },
  menuLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    fontWeight: '700',
  },
  menuDesc: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    lineHeight: fontSize.small * 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: sp.s,
  },
  footerText: {
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: sp.xs,
  },
});
