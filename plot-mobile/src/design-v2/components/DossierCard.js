/**
 * DossierCard.js — Card container for V2.
 * Variants: 'default' | 'alert' | 'gold' | 'flat'
 *
 * dogEar   — folded top-right corner (default: true, off for 'flat')
 * noLines  — disable ruled-paper texture inside the card (default: false)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useGameStore } from '../../store/useGameStore';
import { getColors, sp, radius, makeShadow } from '../tokens';

const DOG_EAR   = 18;
const LINE_COUNT = 30;

// ── Ruled-paper texture rendered inside each card ─────────────────────────────
// Light: warm brown horizontal lines — aged document / dossier file feel
// Dark:  cool blue horizontal lines  — intel terminal / file readout feel
const CardLines = ({ themeMode }) => {
  const lineColor = themeMode === 'light'
    ? 'rgba(100, 70, 20, 0.09)'
    : 'rgba(50, 100, 160, 0.05)';
  const spacing = themeMode === 'light' ? 20 : 14;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: LINE_COUNT }).map((_, i) => (
        <View key={i} style={[styles.cardLine, { top: i * spacing, backgroundColor: lineColor }]} />
      ))}
    </View>
  );
};

const DossierCard = ({
  children,
  style,
  variant  = 'default',
  noPad    = false,
  dogEar   = true,
  noLines  = false,
}) => {
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);

  const borderColor = variant === 'alert' ? c.red
    : variant === 'gold'  ? c.gold
    : variant === 'flat'  ? 'transparent'
    : c.cardBorder;

  const bgColor = variant === 'flat' ? 'transparent' : c.cardBg;

  // Dog-ear fold color: visibly different from card background
  const foldColor = themeMode === 'light'
    ? '#C9A870'              // warm amber — distinct from #F5EDD8 cardBg
    : '#060B12';             // darker than #111927 cardBg
  const shadowColor = themeMode === 'light'
    ? 'rgba(80, 40, 5, 0.30)'
    : 'rgba(0, 0, 0, 0.55)';

  const showDogEar = dogEar && variant !== 'flat';
  const showLines  = !noLines && variant !== 'flat';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderColor,
          borderTopRightRadius: showDogEar ? 0 : radius.m,
          ...makeShadow(c.shadow),
        },
        variant === 'flat' && styles.flat,
        noPad && styles.noPad,
        style,
      ]}
    >
      {/* Ruled-paper lines (behind content, clipped by overflow:hidden) */}
      {showLines && <CardLines themeMode={themeMode} />}

      {children}

      {/* Dog-ear: folded top-right corner */}
      {showDogEar && (
        <View style={styles.dogEarWrap} pointerEvents="none">
          {/* Shadow layer */}
          <View style={[styles.tri, {
            borderTopColor: shadowColor,
            borderRightColor: shadowColor,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
          }]} />
          {/* Fold flap */}
          <View style={[styles.tri, styles.triInner, {
            borderTopColor: foldColor,
            borderRightColor: foldColor,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
          }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.m,
    padding: sp.m,
    borderWidth: 1.5,
    width: '100%',
    overflow: 'hidden',   // clips ruled lines to card bounds
  },
  flat: {
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  noPad: {
    padding: 0,
  },
  cardLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  dogEarWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: DOG_EAR,
    height: DOG_EAR,
  },
  // React Native 4-border triangle:
  // 0x0 element + 4 equal borders = 4 triangles at center.
  // Top+right colored, bottom+left transparent → visible top-right triangle only.
  tri: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopWidth: DOG_EAR,
    borderRightWidth: DOG_EAR,
    borderBottomWidth: DOG_EAR,
    borderLeftWidth: DOG_EAR,
  },
  triInner: {
    borderTopWidth: DOG_EAR - 2,
    borderRightWidth: DOG_EAR - 2,
    borderBottomWidth: DOG_EAR - 2,
    borderLeftWidth: DOG_EAR - 2,
    top: 1,
    right: 1,
  },
});

export default DossierCard;
