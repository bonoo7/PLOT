import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius } from '../../styles/responsive';

/**
 * MinimalMeter - A horizontal gauge for suspicion/trust.
 */
const MinimalMeter = ({ 
  value = 0, // 0 to 100
  label = "SUSPICION", 
  color = '#B22222' // Red default
}) => {
  const safeValue = Math.min(100, Math.max(0, value));
  
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[
          styles.fill, 
          { width: `${safeValue}%`, backgroundColor: color }
        ]} />
        
        {/* Ticks */}
        {[0, 25, 50, 75, 100].map(tick => (
           <View key={tick} style={[styles.tick, { left: `${tick}%` }]} />
        ))}
      </View>
      <Text style={styles.valueText}>{safeValue}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.s,
    width: '100%',
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    color: '#555',
    marginBottom: 4,
    textAlign: 'left',
  },
  track: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#999',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  valueText: {
    fontFamily: theme.fonts.main,
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
});

export default MinimalMeter;
