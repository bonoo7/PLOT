import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import TerminalCard from './TerminalCard';
import { fontFamily, fontSize, getColors, getRoleMeta, sp } from '../tokens';

const ResultCard = ({ players = [], style, hideDetails = false }) => {
  const c = getColors();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (index) => {
    setExpandedIndex(prev => prev === index ? null : index);
  };

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
        const isExpanded = !hideDetails && expandedIndex === index;
        const hasBreakdown = !hideDetails && Array.isArray(player.breakdown) && player.breakdown.length > 0;
        
        return (
          <View key={`${player.name}-${index}`} style={{ borderBottomWidth: 1, borderBottomColor: c.divider }}>
            <TouchableOpacity 
              activeOpacity={hasBreakdown ? 0.7 : 1.0}
              onPress={() => hasBreakdown && toggleExpand(index)}
              style={[styles.row, { backgroundColor: isWinner ? 'rgba(57,255,20,0.08)' : 'transparent' }]}
            >
              <Text style={[styles.cell, styles.rank, { color: isWinner ? c.accentGreen : c.textSub }]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.name, { color: c.textPrimary }]} numberOfLines={1}>{player.name}</Text>
              <Text style={[styles.cell, styles.role, { color: hideDetails ? c.textMuted : meta.color }]} numberOfLines={1}>
                {hideDetails ? '📂 [مُشفر]' : `${meta.emoji} ${meta.name}`}
              </Text>
              <View style={styles.scoreWrapper}>
                <Text style={[styles.cell, styles.score, { color: isWinner ? c.accentGreen : c.textPrimary }]}>{player.totalScore ?? player.score ?? 0}</Text>
                {hasBreakdown && (
                  <Text style={[styles.expandIcon, { color: c.textMuted }]}>{isExpanded ? ' ▲' : ' ▼'}</Text>
                )}
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <View style={[styles.breakdownContainer, { backgroundColor: 'rgba(0, 255, 65, 0.03)', borderColor: c.divider }]}>
                <Text style={[styles.breakdownTitle, { color: c.accentGreen }]}>⚡ تفاصيل النقاط / SCORE BREAKDOWN:</Text>
                {player.breakdown.map((line, li) => (
                  <Text key={li} style={[styles.breakdownLine, { color: c.textPrimary }]}>
                    • {line}
                  </Text>
                ))}
                {player.role && (
                  <Text style={[styles.breakdownRole, { color: meta.color }]}>
                    📂 التحالف والكتلة: {meta.emoji} {meta.bracket} ({meta.name})
                  </Text>
                )}
              </View>
            )}
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
  scoreWrapper: {
    width: '24%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  score: {
    textAlign: 'right',
  },
  expandIcon: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
  },
  breakdownContainer: {
    padding: sp.s,
    marginLeft: '10%',
    marginRight: sp.s,
    marginBottom: sp.s,
    borderLeftWidth: 1,
    gap: 4,
  },
  breakdownTitle: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small - 1,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'right',
  },
  breakdownLine: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small - 1,
    lineHeight: (fontSize.small - 1) * 1.4,
    textAlign: 'right',
  },
  breakdownRole: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small - 1,
    marginTop: 4,
    fontWeight: 'bold',
    textAlign: 'right',
  },
});

export default ResultCard;
