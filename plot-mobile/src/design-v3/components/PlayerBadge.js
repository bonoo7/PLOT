import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { alpha, fontFamily, fontSize, formatScore, getColors, getRoleMeta, makeIndexLabel, sp } from '../tokens';

const PlayerBadge = ({ name = 'UNKNOWN', index = 0, score, role, isMe = false, isHost = false, isActive = false, isSpeaking = false, isEliminated = false, style }) => {
  const c = getColors();
  const meta = role ? getRoleMeta(role) : null;
  const borderColor = isSpeaking ? c.accentCyan : isActive ? c.borderBright : isEliminated ? c.accentRed : c.border;
  const scoreColor = Number(score) < 0 ? c.accentRed : c.accentGreen;

  return (
    <View style={[styles.row, { borderColor, backgroundColor: alpha(c.surface, 'CC'), opacity: isEliminated ? 0.55 : 1 }, style]}>
      <View style={styles.left}>
        <Text style={[styles.index, { color: borderColor }]}>{makeIndexLabel(index)}</Text>
        <View style={styles.nameWrap}>
          <Text style={[styles.name, { color: c.textPrimary }]} numberOfLines={1}>{name}</Text>
          <View style={styles.flags}>
            {meta ? <Text style={[styles.meta, { color: meta.color }]}>{`${meta.emoji} ${meta.bracket}`}</Text> : null}
            {isHost ? <Text style={[styles.meta, { color: '#00FFFF' }]}>🖥️ [HOST]</Text> : null}
            {isMe ? <Text style={[styles.meta, { color: c.accentYellow }]}>[YOU]</Text> : null}
            {isEliminated ? <Text style={[styles.meta, { color: c.accentRed }]}>[OFFLINE]</Text> : null}
          </View>
        </View>
      </View>
      <View style={styles.right}>
        {isSpeaking ? <Text style={[styles.speaking, { color: c.accentCyan }]}>▶</Text> : null}
        {score !== undefined && score !== null ? <Text style={[styles.score, { color: scoreColor }]}>{formatScore(score)}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sp.s,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.s,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.s,
  },
  index: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    fontWeight: '700',
    minWidth: 44,
  },
  nameWrap: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  flags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sp.xs,
  },
  meta: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.label,
  },
  speaking: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    fontWeight: '700',
  },
  score: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.small,
    fontWeight: '700',
  },
});

export default PlayerBadge;
