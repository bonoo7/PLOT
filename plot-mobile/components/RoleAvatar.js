import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../src/styles/theme';
import { moderateScale, spacing, fonts, borderRadius, shadows } from '../src/styles/responsive';

const ROLE_IMAGES = {
  WITNESS: require('../assets/roles/WITNESS.png'),
  ARCHITECT: require('../assets/roles/ARCHITECT.png'),
  DETECTIVE: require('../assets/roles/DETECTIVE.png'),
  SPY: require('../assets/roles/SPY.png'),
  ACCOMPLICE: require('../assets/roles/ACCOMPLICE.png'),
  LAWYER: require('../assets/roles/LAWYER.png'),
  TRICKSTER: require('../assets/roles/TRICKSTER.png'),
  CITIZEN: require('../assets/roles/CITIZEN.png'),
};

const ROLE_ICONS = {
  HOST: '👑'
};

const ROLE_LABELS = {
  WITNESS: 'الشاهد',
  ARCHITECT: 'المهندس',
  DETECTIVE: 'المحقق',
  SPY: 'الجاسوس',
  ACCOMPLICE: 'المتواطئ',
  LAWYER: 'المحامي',
  TRICKSTER: 'المخادع',
  CITIZEN: 'المواطن',
  HOST: 'المدير'
};

export default function RoleAvatar({ role, size = 100, showLabel = true }) {
  const imageSource = ROLE_IMAGES[role];
  const icon = ROLE_ICONS[role] || '❓';
  const label = ROLE_LABELS[role] || role;
  
  // responsive sizing
  const scaledSize = moderateScale(size);
  const containerHeight = scaledSize * 1.2;
  const iconSize = scaledSize * 0.5;
  const labelFontSize = moderateScale(12);
  const stampFontSize = moderateScale(8);
  const paperclipWidth = moderateScale(10);
  const paperclipHeight = moderateScale(30);

  if (imageSource) {
    return (
      <View style={[styles.container, { width: scaledSize, height: containerHeight }]}>
        <Image 
          source={imageSource} 
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }} 
        />
        {showLabel && <Text style={[styles.label, { fontSize: labelFontSize }]}>{label}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: scaledSize, height: containerHeight }]}>
      {/* Paperclip effect */}
      <View style={[
        styles.paperclip, 
        { 
          width: paperclipWidth, 
          height: paperclipHeight,
          top: -moderateScale(10),
          right: moderateScale(20),
        }
      ]} />
      
      {/* Photo Frame */}
      <View style={[styles.photoFrame, shadows.medium]}>
        <View style={styles.photoInner}>
            <Text style={[styles.icon, { fontSize: iconSize }]}>{icon}</Text>
        </View>
        {showLabel && <Text style={[styles.label, { fontSize: labelFontSize }]}>{label}</Text>}
      </View>
      
      {/* Stamp effect */}
      <View style={[
        styles.stamp,
        {
          bottom: moderateScale(10),
          right: -moderateScale(10),
          borderRadius: borderRadius.small,
        }
      ]}>
        <Text style={[styles.stampText, { fontSize: stampFontSize }]}>CONFIDENTIAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.m,
    transform: [{ rotate: '-3deg' }],
  },
  photoFrame: {
    backgroundColor: theme.colors.white,
    padding: spacing.xs,
    paddingBottom: spacing.m,
    alignItems: 'center',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    borderRadius: borderRadius.small,
  },
  photoInner: {
    backgroundColor: '#f0f0f0',
    width: '100%',
    height: '75%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  icon: {
    textAlign: 'center',
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  paperclip: {
    position: 'absolute',
    backgroundColor: '#aaa',
    borderRadius: borderRadius.small,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#888',
  },
  stamp: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(178, 34, 34, 0.6)',
    padding: spacing.xs,
    transform: [{ rotate: '-15deg' }],
  },
  stampText: {
    color: 'rgba(178, 34, 34, 0.6)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    fontFamily: theme.fonts.main,
  }
});
