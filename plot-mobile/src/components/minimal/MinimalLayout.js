import React, { useEffect } from 'react';
import { View, ImageBackground, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { spacing } from '../../styles/responsive';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import GameHeader from './GameHeader';

/**
 * MinimalLayout - The base wrapper for all V3 minimalist screens.
 */
const MinimalLayout = ({ children, style, roleData, roomCode, onRefresh }) => {
  const { isDesktop } = useResponsiveLayout();
  
  // Immersive Mode (Android)
  useEffect(() => {
    if (Platform.OS === 'android') {
      const enableImmersiveMode = async () => {
        try {
          // Force immediate hidden state
          await NavigationBar.setVisibilityAsync('hidden');
          // Set behavior to swipe-up to show
          await NavigationBar.setBehaviorAsync('overlay-swipe');
          // Ensure it stays transparent if it does appear
          await NavigationBar.setBackgroundColorAsync('#00000000');
        } catch (e) {
          console.warn('Failed to enable immersive mode:', e);
        }
      };
      
      // Run immediately
      enableImmersiveMode();
    }
  }, []);



  return (
    <ImageBackground
      source={require('../../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar style="light" hidden={Platform.OS !== 'web'} />
      <SafeAreaView style={styles.safeArea}>
        
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
            paddingTop: isDesktop ? 80 : 100 // Add padding for header
          },
          style
        ]}>
          {children}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1410', 
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center', 
    alignItems: 'center',     
  },
});

export default MinimalLayout;
