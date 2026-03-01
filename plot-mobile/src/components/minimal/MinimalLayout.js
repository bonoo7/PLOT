import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { spacing } from '../../styles/responsive';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useGameStore } from '../../store/useGameStore';
import GameHeader from './GameHeader';
import { ScreenWrapper } from '../ScreenWrapper';
import { PlayerBadge } from './PlayerBadge';

/**
 * MinimalLayout - The base wrapper for all V3 minimalist screens.
 */
const MinimalLayout = ({ children, style, roleData, roomCode, onRefresh }) => {
  const { isDesktop } = useResponsiveLayout();
  const players = useGameStore(state => state.players) || [];
  const playerName = useGameStore(state => state.playerName);
  const speakingPlayerId = useGameStore(state => state.speakingPlayerId);

  // Immersive Mode (Android)
  useEffect(() => {
    if (Platform.OS === 'android') {
      const enableImmersiveMode = async () => {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
          await NavigationBar.setBackgroundColorAsync('#00000000');
        } catch (e) {
          console.warn('Failed to enable immersive mode:', e);
        }
      };
      enableImmersiveMode();
    }
  }, []);

  return (
    <ScreenWrapper>
      <StatusBar style="light" hidden={Platform.OS !== 'web'} />

      {/* Unified Game Header */}
      <GameHeader
        roleData={roleData}
        roomCode={roomCode}
        onRefresh={onRefresh}
      />

      <View style={[
        styles.container,
        {
          maxWidth: isDesktop ? 1400 : '100%',
          padding: isDesktop ? spacing.m : spacing.s,
          paddingTop: isDesktop ? 90 : 100 // Adjusted padding since players strip is removed
        },
        style
      ]}>
        {children}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playersStripContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 70 : 90, // Below header
    left: 0,
    right: 0,
    height: 50,
    zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.2)', // Slight darkening to separate from header
    justifyContent: 'center'
  },
  playersStrip: {
    paddingHorizontal: spacing.m,
    gap: spacing.s,
    alignItems: 'center',
  }
});

export default MinimalLayout;
