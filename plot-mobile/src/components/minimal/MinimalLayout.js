import React, { useEffect, useState } from 'react';
import { View, ImageBackground, StyleSheet, SafeAreaView, StatusBar, Platform, TouchableOpacity, Text, Modal, ScrollView, Image } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { getContainerPadding, borderRadius, spacing, fonts } from '../../styles/responsive';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { theme } from '../../styles/theme';

/**
 * MinimalLayout - The base wrapper for all V3 minimalist screens.
 * Enforces:
 * 1. Full screen noir background
 * 2. No scrolling by default (content must fit)
 * 3. Centralized content container
 * 4. Immersive mode on Android (hidden navigation bar)
 * 5. Optional persistent Role Reveal button
 */
const MinimalLayout = ({ children, style, roleData }) => {
  const { isDesktop } = useResponsiveLayout();
  const [showRole, setShowRole] = useState(false);

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
      
      // Add listener for visibility changes (if user swipes up, try to hide again after delay?)
      // Note: expo-navigation-bar doesn't have a direct "onShow" listener easily accessible without native code,
      // but we can re-enforce it on layout updates or focus.
      // For now, let's just make sure we set the background color too.
    }
  }, []);

  // Helper to render special info in modal
  const renderSpecialInfo = () => {
      let content = [];

      // 1. Ability Result (New Priority)
      if (roleData?.abilityResult) {
          const res = roleData.abilityResult;
          content.push(
              <View key="ability" style={styles.intelBox}>
                  <Text style={styles.modalSubtitle}>🔍 نتيجة القدرة:</Text>
                  {res.type === 'INVESTIGATE' && (
                      <Text style={styles.modalText}>
                          الهدف: {res.targetName}{'\n'}
                          النتيجة: {res.result}
                          {res.isSabotaged && '\n⚠️ (تم التلاعب بالنتيجة!)'}
                      </Text>
                  )}
                  {res.type === 'FLASH_MEMORY' && (
                      <Text style={styles.modalText}>
                          الكلمات: {res.keywords.join(' - ')}
                      </Text>
                  )}
                  {res.type === 'REVELATION' && (
                      <Text style={styles.modalText}>
                          القصة: {res.content}
                      </Text>
                  )}
                  {res.type === 'SABOTAGE' && (
                      <Text style={styles.modalText}>
                          {res.message}
                      </Text>
                  )}
              </View>
          );
      }

      // 2. Static Info
      if (roleData?.specialInfo || roleData?.info) {
          const info = roleData.specialInfo || roleData.info;
          
          if (typeof info === 'string') content.push(<Text key="static" style={styles.modalText}>{info}</Text>);
          else if (Array.isArray(info)) content.push(<Text key="static" style={styles.modalText}>{info.join('\n')}</Text>);
          else if (info?.type === 'MASTERMIND_INTEL') {
              content.push(
                  <View key="static">
                      <Text style={styles.modalSubtitle}>أعضاء فريق الجريمة:</Text>
                      {info.crimeTeam.map(p => (
                          <Text key={p.id} style={styles.modalText}>• {p.name} ({p.role})</Text>
                      ))}
                  </View>
              );
          }
          else if (info?.type === 'MINISTER_INTEL') {
              content.push(
                  <View key="static">
                      <Text style={styles.modalSubtitle}>معلومات سرية:</Text>
                      <Text style={styles.modalText}>• المستفيد: {info.beneficiary?.name || 'غير معروف'}</Text>
                      <Text style={styles.modalText}>• المحقق: {info.detective?.name || 'غير معروف'}</Text>
                  </View>
              );
          }
          else if (typeof info === 'object') {
             content.push(<Text key="static" style={styles.modalText}>{JSON.stringify(info)}</Text>);
          }
      }

      return content;
  };

  return (
    <ImageBackground
      source={require('../../../assets/desk_background_noir.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent hidden={Platform.OS === 'android'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={[
          styles.container, 
          { 
            // On desktop/wide screens, allow up to 1200px but with flex to fill if needed
            // On mobile, use 100%
            maxWidth: isDesktop ? 1400 : '100%',
            // Padding logic: Large Desktop (S), Mobile (S), Medium (M/L) handled by responsive.js?
            // User says it's too narrow. Let's use reduced padding.
            padding: isDesktop ? spacing.m : spacing.s 
          },
          style
        ]}>
          {children}
        </View>

        {/* Persistent Role Button */}
        {roleData && (
            <>
                <TouchableOpacity 
                    style={styles.roleButton}
                    onPress={() => setShowRole(true)}
                    activeOpacity={0.8}
                >
                    {theme.roleImages && theme.roleImages[roleData.role] ? (
                        <Image 
                            source={theme.roleImages[roleData.role]} 
                            style={styles.roleButtonImage}
                        />
                    ) : (
                        <Text style={styles.roleButtonIcon}>🆔</Text>
                    )}
                </TouchableOpacity>

                <Modal
                    visible={showRole}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowRole(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{roleData.roleName}</Text>
                                <TouchableOpacity onPress={() => setShowRole(false)}>
                                    <Text style={styles.closeButton}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <ScrollView style={styles.modalBody}>
                                {theme.roleImages && theme.roleImages[roleData.role] && (
                                    <View style={{ alignItems: 'center', marginBottom: spacing.m }}>
                                        <Image 
                                            source={theme.roleImages[roleData.role]} 
                                            style={styles.modalRoleImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                )}
                                <Text style={styles.modalLabel}>مهمتك:</Text>
                                <Text style={styles.modalText}>{roleData.description}</Text>
                                
                                {(roleData.specialInfo || roleData.info) && (
                                    <>
                                        <View style={styles.divider} />
                                        <Text style={styles.modalLabel}>معلومات:</Text>
                                        {renderSpecialInfo()}
                                    </>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1410', // Fallback color
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center', // Default to center vertically
    alignItems: 'center',     // Default to center horizontally
  },
  
  // Role Button & Modal
  roleButton: {
      position: 'absolute',
      top: 40, // Below status bar
      right: 20, // RTL: positions on visual LEFT, LTR: positions on visual RIGHT
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
  },
  roleButtonIcon: { fontSize: 16 },
  roleButtonImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    borderRadius: 25,
  },
  modalRoleImage: {
    width: 120,
    height: 120,
  },

  
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: '#FDF5E6',
      borderRadius: borderRadius.medium,
      padding: spacing.m,
      borderWidth: 2,
      borderColor: '#8B4513',
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: '#D2B48C',
      paddingBottom: spacing.s,
  },
  modalTitle: {
      fontSize: fonts.large,
      fontFamily: theme.fonts.bold,
      color: '#8B4513',
  },
  closeButton: {
      fontSize: 24,
      color: '#8B4513',
      fontWeight: 'bold',
  },
  modalBody: {
      maxHeight: 400,
  },
  modalLabel: {
      fontFamily: theme.fonts.bold,
      fontSize: fonts.medium,
      color: '#333',
      marginBottom: 4,
  },
  modalSubtitle: {
      fontFamily: theme.fonts.bold,
      fontSize: fonts.small,
      color: '#555',
      marginBottom: 2,
      marginTop: 8,
  },
  modalText: {
      fontFamily: theme.fonts.main,
      fontSize: fonts.medium,
      color: '#444',
      lineHeight: 24,
      marginBottom: spacing.s,
  },
  divider: {
      height: 1,
      backgroundColor: '#D2B48C',
      marginVertical: spacing.m,
  }
});

export default MinimalLayout;
