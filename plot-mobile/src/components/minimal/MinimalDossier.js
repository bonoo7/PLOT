import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Modal } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius } from '../../styles/responsive';
import MinimalCard from './MinimalCard';
import MinimalBadge from './MinimalBadge';
import MinimalMeter from './MinimalMeter';

/**
 * MinimalDossier - A folder style view for player profiles.
 */
const MinimalDossier = ({ 
  player, 
  onClose,
  visible = false 
}) => {
  if (!visible || !player) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.folderTab}>
          <Text style={styles.tabText}>{player.name}</Text>
        </View>
        <View style={styles.folderBody}>
           <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
             <Text style={styles.closeText}>✕</Text>
           </TouchableOpacity>
           
           <View style={styles.header}>
             <View style={styles.photoFrame}>
               {/* Ideally player avatar or generic silhouette */}
               <Text style={styles.silhouette}>👤</Text>
             </View>
             <View style={styles.meta}>
               <Text style={styles.label}>الاسم الحركي:</Text>
               <Text style={styles.value}>{player.name}</Text>
               
               <Text style={styles.label}>الحالة:</Text>
               <MinimalBadge 
                 text={player.isDead ? "ELIMINATED" : "ACTIVE"} 
                 variant={player.isDead ? "danger" : "success"} 
               />
             </View>
           </View>

           <View style={styles.divider} />

           <View style={styles.content}>
             <Text style={styles.sectionTitle}>مؤشر الشك:</Text>
             <MinimalMeter value={Math.floor(Math.random() * 100)} label="SUSPICION LEVEL" />
             
             <Text style={[styles.sectionTitle, { marginTop: spacing.m }]}>ملاحظات التحقيق:</Text>
             <Text style={styles.notesPlaceholder}>
               لا توجد ملاحظات مسجلة بعد...
             </Text>
           </View>

           <View style={styles.stampsArea}>
              <MinimalBadge text="CONFIDENTIAL" variant="primary" style={{ transform: [{ rotate: '-10deg' }] }} />
           </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: spacing.m,
  },
  folderTab: {
    backgroundColor: '#D2B48C', // Tan Folder Color
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderTopLeftRadius: borderRadius.medium,
    borderTopRightRadius: borderRadius.medium,
    alignSelf: 'flex-start',
    marginLeft: spacing.m,
    marginBottom: -5,
    zIndex: 1,
  },
  tabText: {
    fontFamily: theme.fonts.bold,
    color: '#3E2723',
    fontWeight: 'bold',
  },
  folderBody: {
    backgroundColor: '#F5DEB3', // Wheat/Manila Folder
    borderColor: '#D2B48C',
    borderWidth: 2,
    minHeight: 400,
    borderTopRightRadius: borderRadius.medium,
    borderBottomLeftRadius: borderRadius.medium,
    borderBottomRightRadius: borderRadius.medium,
    padding: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    zIndex: 10,
  },
  closeText: {
    fontSize: 24,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.l,
  },
  photoFrame: {
    width: 100,
    height: 120,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  silhouette: {
    fontSize: 60,
    opacity: 0.5,
  },
  meta: {
    marginLeft: spacing.m,
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    fontFamily: theme.fonts.main,
    fontSize: fonts.small,
    color: '#5D4037', // Brown text
    marginBottom: 2,
  },
  value: {
    fontFamily: theme.fonts.bold, // Typewriter
    fontSize: fonts.medium,
    color: '#3E2723',
    marginBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#D7CCC8',
    paddingBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#D7CCC8',
    marginBottom: spacing.l,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: theme.fonts.bold,
    color: '#8B4513',
    marginBottom: spacing.s,
    textDecorationLine: 'underline',
  },
  notesPlaceholder: {
    fontFamily: theme.fonts.main, // Handwriting font ideally
    color: '#6D4C41',
    fontStyle: 'italic',
  },
  stampsArea: {
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
    opacity: 0.6,
  },
});

export default MinimalDossier;
