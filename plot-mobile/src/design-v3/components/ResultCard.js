import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TerminalCard from './TerminalCard';
import { fontFamily, fontSize, getColors, getRoleMeta, sp } from '../tokens';

const ResultCard = ({ players = [], style }) => {
  const c = getColors();

  return (
    <TerminalCard title="> النتائج / RESULTS" tone="info" style={style}>
      <Text style={[styles.borderLine, { color: c.textMuted }]}>┌──────────────────────────────────────────────┐</Text>
      <View style={[styles.headerRow, { borderBottomColor: c.divider }]}> 
        <Text style={[styles.headCell, styles.rank, { color: c.textMuted }]}>#</Text>
        <Text style={[styles.headCell, styles.name, { color: c.textMuted }]}>الاسم</Text>
        <Text style={[styles.headCell, styles.role, { color: c.textMuted }]}>الدور</Text>
        <Text style={[styles.headCell, styles.score, { color: c.textMuted }]}>النقاط</Text>
      </View>
      {players.map((player, index) => {
        const meta = getRoleMeta(player.role);
        const isWinner = player.isWinner || index === 0;
        return (
          <View key={`${player.name}-${index}`} style={[styles.row, { borderBottomColor: c.divider, backgroundColor: isWinner ? 'rgba(57,255,20,0.08)' : 'transparent' }]}>
            <Text style={[styles.cell, styles.rank, { color: isWinner ? c.accentGreen : c.textSub }]}>{index + 1}</Text>
            <Text style={[styles.cell, styles.name, { color: c.textPrimary }]} numberOfLines={1}>{player.name}</Text>
            <Text style={[styles.cell, styles.role, { color: meta.color }]} numberOfLines={1}>{meta.emoji} {meta.name}</Text>
            <Text style={[styles.cell, styles.score, { color: isWinner ? c.accentGreen : c.textPrimary }]}>{player.totalScore ?? player.score ?? 0}</Text>
          </View>
        );
      })}
      <Text style={[styles.borderLine, { color: c.textMuted }]}>└──────────────────────────────────────────────┘</Text>
    </TerminalCard>
  );
};

const styles = StyleSheet.create({
  borderLine: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: sp.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: sp.s,
  },
  headCell: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
    fontWeight: '700',
  },
  cell: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
  },
  rank: {
    width: '10%',
    textAlign: 'center',
  },
  name: {
    width: '34%',
  },
  role: {
    width: '32%',
  },
  score: {
    width: '24%',
    textAlign: 'right',
  },
});

export default ResultCard;
