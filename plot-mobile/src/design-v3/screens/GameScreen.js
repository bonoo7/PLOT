import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../../hooks/useGameSocket';
import { useGameStore } from '../../store/useGameStore';
import { BlinkCursor, TerminalBanner, TerminalButton, TerminalCard, TerminalHeader, TerminalLayout } from '../components';
import { fontFamily, fontSize, getColors, getRoleMeta, getTeamColor, sp } from '../tokens';

const describeSpecialInfo = (specialInfo) => {
  if (!specialInfo) return null;
  if (typeof specialInfo === 'string') return specialInfo;
  if (Array.isArray(specialInfo)) return specialInfo.join(' — ');
  if (specialInfo.type === 'MASTERMIND_INTEL') {
    return (specialInfo.crimeTeam || []).map((player) => `• ${player.name} — ${player.roleName || player.role}`).join('\n');
  }
  if (specialInfo.type === 'MINISTER_INTEL') {
    return `المحقق: ${specialInfo.detective?.name || '?'}\nالمستفيد: ${specialInfo.beneficiary?.name || '?'}`;
  }
  if (specialInfo.type === 'WITNESS_INTEL') {
    return `الكلمات: ${(specialInfo.keywords || []).join(' — ')}`;
  }
  return null;
};

export const GameScreen = () => {
  const navigation = useNavigation();
  const roleData = useGameStore((s) => s.roleData);
  const roomCode = useGameStore((s) => s.roomCode);
  const playerName = useGameStore((s) => s.playerName);
  const c = getColors();
  const [typedLength, setTypedLength] = React.useState(0);

  React.useEffect(() => {
    if (!roleData?.description) return undefined;
    setTypedLength(0);
    const interval = setInterval(() => {
      setTypedLength((current) => {
        if (current >= roleData.description.length) {
          clearInterval(interval);
          return current;
        }
        return current + 1;
      });
    }, 22);

    return () => clearInterval(interval);
  }, [roleData?.description]);

  if (!roleData) {
    return (
      <TerminalLayout top={<TerminalHeader title="ROLE SYNC" subtitle="جارٍ استلام الدور..." />}>
        <View style={styles.waitState}>
          <Text style={[styles.waitText, { color: c.textMuted }]}>في انتظار ملف الدور من الخادم...</Text>
          <BlinkCursor />
        </View>
      </TerminalLayout>
    );
  }

  const meta = getRoleMeta(roleData.role);
  const teamColor = getTeamColor(roleData.team, roleData.role);
  const intel = roleData.info || describeSpecialInfo(roleData.specialInfo);
  const typedDescription = roleData.description ? roleData.description.slice(0, typedLength) : '';

  return (
    <TerminalLayout
      top={<TerminalHeader title="ROLE REVEAL" subtitle={playerName} roomCode={roomCode} roleName={meta.bracket} roleEmoji={meta.emoji} />}
      bottom={<TerminalButton title="جاهز للمتابعة" onPress={() => navigation.navigate(ROUTES.WAITING)} size="sm" style={{ flex: 1 }} />}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TerminalCard tone={roleData.team === 'CRIME' ? 'danger' : roleData.team === 'NEUTRAL' ? 'warning' : 'success'}>
          <Text style={styles.roleEmoji}>{meta.emoji}</Text>
          <Text style={[styles.roleBracket, { color: teamColor }]}>{meta.bracket}</Text>
          <Text style={[styles.roleName, { color: c.textPrimary }]}>{meta.name}</Text>
          <Text style={[styles.roleDescription, { color: c.textSub }]}>{typedDescription}{typedLength < (roleData.description || '').length ? '▋' : ''}</Text>
        </TerminalCard>

        <TerminalCard title="> دليل النظام / SYSTEM GUIDE" tone="warning">
          <Text style={[styles.tutorialText, { color: c.accentYellow }]}>
            💡 يمكنك في أي وقت خلال اللعب استعراض ملف دورك الكامل (الأهداف، التلميحات السرية، والشركاء) عبر الضغط على بطاقة دورك في الشريط العلوي للشاشة:
          </Text>
          <View style={styles.tutorialBadgeWrapper}>
            <Text style={[styles.tutorialBadgeMock, { color: c.accentYellow }]}>
              {`${meta.emoji} ${meta.bracket} 📁`}
            </Text>
          </View>
        </TerminalCard>

        {intel ? <TerminalBanner variant="info" label="INTEL">{intel}</TerminalBanner> : null}
      </ScrollView>
    </TerminalLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: sp.s,
    paddingBottom: sp.l,
  },
  waitState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sp.s,
  },
  waitText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
  },
  roleEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: sp.xs,
  },
  roleBracket: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  roleName: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: sp.xs,
  },
  roleDescription: {
    marginTop: sp.m,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.6,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  tutorialText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    lineHeight: fontSize.small * 1.5,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  tutorialBadgeWrapper: {
    marginTop: sp.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sp.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 204, 0, 0.2)',
    backgroundColor: 'rgba(255, 204, 0, 0.05)',
  },
  tutorialBadgeMock: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    textDecorationLine: 'underline',
  },
});
