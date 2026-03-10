/**
 * DossierLayout.js — 3-Zone base layout for all V2 screens.
 *
 * Structure:
 *   ┌─────────────────┐
 *   │   TOP (fixed)   │  ← CaseHeader lives here
 *   ├─────────────────┤
 *   │  CENTER (flex)  │  ← per-screen content
 *   ├─────────────────┤
 *   │ BOTTOM (fixed)  │  ← action buttons
 *   └─────────────────┘
 *
 * Props:
 *   top        — ReactNode rendered in TOP zone
 *   bottom     — ReactNode rendered in BOTTOM zone (optional)
 *   children   — rendered in CENTER zone
 *   style      — extra style for center zone
 */
import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useGameStore } from '../../store/useGameStore';
import { getColors, sp, useLayout } from '../tokens';

// ── Page background: grid + corner registration marks ────────────────────────
//
// Light "Classified Document":
//   - Very faint warm-brown grid (40px cells) — like official document paper
//   - Corner L-brackets in amber — registration marks on printed forms
//
// Dark "Ops Room":
//   - Very faint intel-blue grid (32px cells) — like tactical operations map
//   - Corner L-brackets in cool blue — terminal scan effect
//
const GRID_COUNT = 30; // enough for any screen size
const CORNER_SZ  = 22; // length of each L-bracket arm
const CORNER_TH  = 1.5; // thickness of corner lines

const PageBackground = ({ themeMode }) => {
  const gridColor = themeMode === 'light'
    ? 'rgba(100, 70, 20, 0.07)'    // warm document brown
    : 'rgba(30, 80, 150, 0.05)';   // cool intel blue
  const cornerColor = themeMode === 'light'
    ? 'rgba(100, 70, 20, 0.22)'    // amber registration marks
    : 'rgba(42, 111, 170, 0.18)';  // blue terminal marks
  const spacing = themeMode === 'light' ? 40 : 32;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">

      {/* Horizontal grid lines */}
      {Array.from({ length: GRID_COUNT }).map((_, i) => (
        <View key={`h${i}`} style={[styles.gridH, { top: i * spacing, backgroundColor: gridColor }]} />
      ))}

      {/* Vertical grid lines */}
      {Array.from({ length: GRID_COUNT }).map((_, i) => (
        <View key={`v${i}`} style={[styles.gridV, { left: i * spacing, backgroundColor: gridColor }]} />
      ))}

      {/* ── Corner registration marks ── */}
      {/* Top-left */}
      <View style={[styles.cornerH, { top: 14, left: 14, backgroundColor: cornerColor }]} />
      <View style={[styles.cornerV, { top: 14, left: 14, backgroundColor: cornerColor }]} />
      {/* Top-right */}
      <View style={[styles.cornerH, { top: 14, right: 14, backgroundColor: cornerColor }]} />
      <View style={[styles.cornerV, { top: 14, right: 14, backgroundColor: cornerColor }]} />
      {/* Bottom-left */}
      <View style={[styles.cornerH, { bottom: 14, left: 14, backgroundColor: cornerColor }]} />
      <View style={[styles.cornerV, { bottom: 14, left: 14, backgroundColor: cornerColor }]} />
      {/* Bottom-right */}
      <View style={[styles.cornerH, { bottom: 14, right: 14, backgroundColor: cornerColor }]} />
      <View style={[styles.cornerV, { bottom: 14, right: 14, backgroundColor: cornerColor }]} />

    </View>
  );
};

// On native, hide the phone status bar (battery/time strip).
// On web we leave it as-is.
const HIDE_STATUS_BAR = Platform.OS !== 'web';

const DossierLayout = ({ top, bottom, children, style, centerStyle }) => {
  const themeMode = useGameStore(s => s.themeMode) || 'light';
  const c = getColors(themeMode);
  const { contentMaxW } = useLayout();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar hidden={HIDE_STATUS_BAR} style={themeMode === 'dark' ? 'light' : 'dark'} />

      {/* Page background: grid + corner marks — fills the whole screen behind content */}
      <PageBackground themeMode={themeMode} />

      <View style={[styles.inner, { maxWidth: contentMaxW }]}>

        {/* TOP ZONE */}
        {top && (
          <View style={[styles.topZone, { borderBottomColor: c.divider, backgroundColor: c.surface }]}>
            {top}
          </View>
        )}

        {/* CENTER ZONE */}
        <View style={[styles.centerZone, centerStyle, style]}>
          {children}
        </View>

        {/* BOTTOM ZONE */}
        {bottom && (
          <View style={[styles.bottomZone, { borderTopColor: c.divider, backgroundColor: c.surface }]}>
            {bottom}
          </View>
        )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Grid lines
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },

  // Corner registration marks (L-brackets)
  cornerH: {
    position: 'absolute',
    width: CORNER_SZ,
    height: CORNER_TH,
  },
  cornerV: {
    position: 'absolute',
    width: CORNER_TH,
    height: CORNER_SZ,
  },

  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'column',
    zIndex: 1,
  },
  topZone: {
    width: '100%',
    borderBottomWidth: 1,
    paddingHorizontal: sp.m,
    paddingVertical: sp.l,
  },
  centerZone: {
    flex: 1,
    width: '100%',
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
  },
  bottomZone: {
    width: '100%',
    borderTopWidth: 1,
    paddingHorizontal: sp.m,
    paddingVertical: sp.xs,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: sp.s,
  },
});

export default DossierLayout;
