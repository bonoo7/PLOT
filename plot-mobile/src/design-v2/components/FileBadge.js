/**
 * FileBadge.js — Compact player identity badge for V2.
 * Shows initials + name + optional number.
 * Sizes: 'sm' | 'md' | 'lg'
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { getColors, sp, fontSize, fontFamily, radius } from '../tokens';

// Deterministic color from name
const PALETTE = [
  '#8B3A3A','#3A5F8B','#3A8B5F','#8B6A3A',
  '#5F3A8B','#3A8B8B','#8B3A6A','#6A8B3A',
];
const getBgColor = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return PALETTE[h % PALETTE.length];
};

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const FileBadge = ({ name = '?', number, size = 'md', style }) => {
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);
  const bg = useMemo(() => getBgColor(name), [name]);
  const initials = useMemo(() => getInitials(name), [name]);

  const dim = size === 'sm' ? 28 : size === 'lg' ? 44 : 34;
  const fSz = size === 'sm' ? fontSize.label : size === 'lg' ? fontSize.medium : fontSize.small;
  const nameSz = size === 'sm' ? fontSize.label : size === 'lg' ? fontSize.body : fontSize.small;

  return (
    <View style={[styles.row, style]}>
      {/* Avatar circle */}
      <View style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg, borderColor: c.border }]}>
        <Text style={[styles.initials, { fontSize: fSz }]}>{initials}</Text>
        {number != null && (
          <View style={[styles.numBadge, { backgroundColor: c.red }]}>
            <Text style={styles.numText}>{number}</Text>
          </View>
        )}
      </View>
      {/* Name */}
      {size !== 'sm' && (
        <Text style={[styles.name, { color: c.text, fontSize: nameSz }]} numberOfLines={1}>
          {name}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sp.xs,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'visible',
  },
  initials: {
    color: '#FFF',
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
  numBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
  },
  name: {
    fontFamily: fontFamily.mono,
    fontWeight: '600',
    flexShrink: 1,
  },
});

export default FileBadge;
