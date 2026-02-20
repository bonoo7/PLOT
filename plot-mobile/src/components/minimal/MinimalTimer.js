import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { fonts } from '../../styles/responsive';

/**
 * MinimalTimer - Analog/Mechanical countdown.
 * Renders a circular timer that fills/unfills.
 */
const MinimalTimer = ({ 
  timeLeft, 
  totalTime = 60, 
  size = 60,
  warningThreshold = 10 
}) => {
  // Calculate percentage
  const percentage = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const isWarning = timeLeft <= warningThreshold;
  
  // Color transition
  const color = isWarning ? '#B22222' : '#2F4F4F'; // Red vs Dark Green
  
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
       {/* Background Dial */}
       <View style={[styles.dial, { borderColor: '#D2B48C' }]} />
       
       {/* "Hand" or Fill - Simplified as a shrinking circle for now due to RN limitations without SVG */}
       <View style={[
         styles.fill, 
         { 
           backgroundColor: color,
           height: `${percentage}%`,
           width: `${percentage}%`,
           borderRadius: size,
           opacity: 0.2
         }
       ]} />
       
       {/* Digital Text Overlay */}
       <View style={styles.overlay}>
         <Text style={[styles.text, isWarning && styles.warningText]}>
           {Math.floor(timeLeft)}
         </Text>
         <Text style={styles.subText}>SEC</Text>
       </View>

       {/* Ticks */}
       <View style={styles.tickTop} />
       <View style={styles.tickRight} />
       <View style={styles.tickBottom} />
       <View style={styles.tickLeft} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8DC', // Cornsilk/Paper
    borderWidth: 2,
    borderColor: '#8B4513',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  dial: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 4,
    borderRadius: 100,
    opacity: 0.3,
  },
  fill: {
    position: 'absolute',
  },
  overlay: {
    alignItems: 'center',
    zIndex: 10,
  },
  text: {
    fontFamily: theme.fonts.bold, // Monospace/Courier
    fontSize: fonts.medium,
    fontWeight: 'bold',
    color: '#333',
  },
  warningText: {
    color: '#B22222',
  },
  subText: {
    fontSize: 8,
    color: '#666',
    marginTop: -2,
  },
  // Ticks
  tickTop: { position: 'absolute', top: 0, width: 2, height: 5, backgroundColor: '#333' },
  tickBottom: { position: 'absolute', bottom: 0, width: 2, height: 5, backgroundColor: '#333' },
  tickRight: { position: 'absolute', right: 0, width: 5, height: 2, backgroundColor: '#333' },
  tickLeft: { position: 'absolute', left: 0, width: 5, height: 2, backgroundColor: '#333' },
});

export default MinimalTimer;
