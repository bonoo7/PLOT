import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GlitchText from './GlitchText';
import { buildAsciiBar, fontFamily, fontSize, getColors, sp } from '../tokens';

const TerminalHeader = ({ title, subtitle, roomCode, playerName, roleName, roleEmoji, round, totalRounds, phase }) => {
  const c = getColors();
  const numericRound = typeof round === 'number' ? round : Number(String(round || '').split('/')[0]);
  const numericTotal = totalRounds || Number(String(round || '').split('/')[1]);
  const roundLabel = numericRound && numericTotal ? `${numericRound}/${numericTotal}` : typeof round === 'string' ? round : null;
  const roundBar = numericRound && numericTotal ? buildAsciiBar(numericRound, numericTotal, 8).text : null;
  const mainTitle = title || phase || roleName || 'SYSTEM';

  return (
    <View style={[styles.box, { borderColor: c.borderBright, backgroundColor: c.bgAlt }]}>
      <View style={styles.rowTop}>
        <Text style={[styles.brand, { color: c.accentGreen }]}>[PLOT]</Text>
        {roundBar ? <Text style={[styles.roundBar, { color: c.textMuted }]}>{roundBar}</Text> : <View style={{ flex: 1 }} />}
        {roundLabel ? <Text style={[styles.roundText, { color: c.accentCyan }]}>{`ROUND ${roundLabel}`}</Text> : null}
      </View>
      <View style={styles.rowMid}>
        <GlitchText text={`> ${mainTitle}`} glitch intensity="low" style={[styles.title, { color: c.textPrimary }]} />
        {roomCode ? <Text style={[styles.code, { color: c.accentGreen }]}>{`▶ ${roomCode} ◀`}</Text> : null}
      </View>
      {(subtitle || playerName || roleName) ? (
        <View style={styles.rowBottom}>
          <Text style={[styles.subtitle, { color: c.textMuted }]} numberOfLines={1}>{subtitle || playerName || ''}</Text>
          {(roleName || roleEmoji) ? <Text style={[styles.role, { color: c.accentYellow }]}>{`${roleEmoji || ''} ${roleName || ''}`.trim()}</Text> : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
    gap: sp.xs,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.s,
  },
  rowMid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp.s,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp.s,
  },
  brand: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.heading,
    fontWeight: '700',
  },
  roundBar: {
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    writingDirection: 'ltr',
  },
  roundText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.medium,
    fontWeight: '700',
  },
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.medium,
    fontWeight: '700',
  },
  subtitle: {
    flex: 1,
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
  },
  role: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
  },
});

export default TerminalHeader;
