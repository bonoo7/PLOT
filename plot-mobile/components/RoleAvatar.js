import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../src/styles/theme';

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

  if (imageSource) {
    return (
      <View style={[styles.container, { width: size, height: size * 1.2, transform: [{ rotate: '0deg' }] }]}>
        <Image 
          source={imageSource} 
          style={{ width: '100%', height: '100%', resizeMode: 'contain' }} 
        />
        {showLabel && <Text style={styles.label}>{label}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size * 1.2 }]}>
      {/* Paperclip effect */}
      <View style={styles.paperclip} />
      
      {/* Photo Frame */}
      <View style={styles.photoFrame}>
        <View style={styles.photoInner}>
            <Text style={[styles.icon, { fontSize: size * 0.5 }]}>{icon}</Text>
        </View>
        {showLabel && <Text style={styles.label}>{label}</Text>}
      </View>
      
      {/* Stamp effect */}
      <View style={styles.stamp}>
        <Text style={styles.stampText}>CONFIDENTIAL</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    transform: [{ rotate: '-3deg' }],
  },
  photoFrame: {
    backgroundColor: '#fff',
    padding: 5,
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
    alignItems: 'center',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between'
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
    fontFamily: 'Courier New',
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
    marginTop: 5,
  },
  paperclip: {
    position: 'absolute',
    top: -10,
    right: 20,
    width: 10,
    height: 30,
    backgroundColor: '#aaa',
    borderRadius: 5,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#888',
  },
  stamp: {
    position: 'absolute',
    bottom: 10,
    right: -10,
    borderWidth: 2,
    borderColor: 'rgba(178, 34, 34, 0.6)', // Faded red
    padding: 2,
    transform: [{ rotate: '-15deg' }],
    borderRadius: 5,
  },
  stampText: {
    color: 'rgba(178, 34, 34, 0.6)',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});
