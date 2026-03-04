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
  root: {
    flex: 1,
    // Note: NO alignItems: 'center' here — it prevents full-width layout on landscape/web.
    // Centering is handled by inner's alignSelf.
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',   // centers content on wide desktop screens
    flexDirection: 'column',
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
