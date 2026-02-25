import React, { useEffect, useState } from 'react';
import { View, ImageBackground, StyleSheet, SafeAreaView, Platform, TouchableOpacity, Text, Modal, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { getContainerPadding, borderRadius, spacing, fonts } from '../../styles/responsive';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { theme } from '../../styles/theme';

/**
 * MinimalLayout - The base wrapper for all V3 minimalist screens.
 */
const MinimalLayout = ({ children, style, roleData, roomCode }) => {
  const { isDesktop } = useResponsiveLayout();
  const [showRole, setShowRole] = useState(false);
  
  // Render Room Code if provided
  const renderRoomCode = () => {
      if (!roomCode) return null;
      return (
          <View style={styles.roomCodeBadge}>
              <Text style={styles.roomCodeLabel}>CODE</Text>
              <Text style={styles.roomCodeValue}>{roomCode}</Text>
          </View>
      );
  };

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
      <StatusBar style="light" hidden={Platform.OS !== 'web'} />
      <SafeAreaView style={styles.safeArea}>
        <View style={[
          styles.container, 
          { 
            maxWidth: isDesktop ? 1400 : '100%',
            padding: isDesktop ? spacing.m : spacing.s 
          },
          style
        ]}>
          {children}
        </View>

        {/* Persistent Room Code Badge */}
        {renderRoomCode()}

        {/* Persistent Role Badge & Score */}
        {roleData && (
            <>
                <View style={styles.roleContainer}>
                    {/* Score Badge (appears to the left of the image) */}
                    {(roleData.totalScore !== undefined || roleData.score !== undefined) && (
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>
                                {roleData.totalScore !== undefined ? roleData.totalScore : roleData.score}
                            </Text>
                            <Text style={styles.scoreIcon}>💰</Text>
                        </View>
                    )}

                    {/* Role Image Button */}
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
                            <View style={[styles.roleButtonImage, {backgroundColor: '#333', justifyContent: 'center', alignItems: 'center'}]}>
                                <Text style={styles.roleButtonIcon}>🆔</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

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
  
  // Role Container (Top Right)
  roleContainer: {
      position: 'absolute',
      top: 40, 
      right: 20, 
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 100,
      gap: 8,
  },
  
  roleButton: {
      width: 70, // Slightly larger
      height: 70,
      borderRadius: 35,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#DAA520', // Gold border
      backgroundColor: '#FFF',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
  },
  roleButtonIcon: { fontSize: 24 },
  roleButtonImage: {
    width: 66,
    height: 66,
    resizeMode: 'contain',
    borderRadius: 33,
  },
  
  // Score Badge
  scoreBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.8)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#DAA520',
  },
  scoreText: {
      color: '#FFD700',
      fontSize: 14,
      fontFamily: theme.fonts.bold,
      fontWeight: 'bold',
      marginRight: 4,
  },
  scoreIcon: {
      fontSize: 12,
  },

  // Room Code Badge (Top Left)
  roomCodeBadge: {
      position: 'absolute',
      top: 50,
      left: 20, 
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      zIndex: 100,
  },
  roomCodeLabel: {
      color: '#AAA',
      fontSize: 10,
      fontFamily: theme.fonts.main,
  },
  roomCodeValue: {
      color: '#FFD700',
      fontSize: 16,
      fontFamily: theme.fonts.bold,
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
      textAlign: 'right', // RTL
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
      textAlign: 'right',
  },
  modalSubtitle: {
      fontFamily: theme.fonts.bold,
      fontSize: fonts.small,
      color: '#555',
      marginBottom: 2,
      marginTop: 8,
      textAlign: 'right',
  },
  modalText: {
      fontFamily: theme.fonts.main,
      fontSize: fonts.medium,
      color: '#444',
      lineHeight: 24,
      marginBottom: spacing.s,
      textAlign: 'right',
  },
  divider: {
      height: 1,
      backgroundColor: '#D2B48C',
      marginVertical: spacing.m,
  },
  intelBox: {
      backgroundColor: 'rgba(0,0,0,0.05)',
      padding: spacing.s,
      borderRadius: borderRadius.small,
      marginBottom: spacing.s,
  }
});

export default MinimalLayout;
