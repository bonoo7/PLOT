import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function BackgroundWatermark() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={[styles.text, { top: '10%', left: '5%', transform: [{ rotate: '-25deg' }] }]}>
        CONFIDENTIAL
      </Text>
      <Text style={[styles.text, { top: '40%', right: '-10%', transform: [{ rotate: '45deg' }] }]}>
        TOP SECRET
      </Text>
      <Text style={[styles.text, { bottom: '15%', left: '10%', transform: [{ rotate: '-15deg' }] }]}>
        RESTRICTED
      </Text>
      <View style={styles.grid} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    overflow: 'hidden',
    opacity: 0.08,
  },
  text: {
    position: 'absolute',
    fontSize: 60,
    fontWeight: 'bold',
    color: '#000',
    width: 500,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: '#000',
    opacity: 0.1,
    // Simple grid pattern simulation using borders is hard without many views, 
    // so we'll just leave it as a subtle overlay or skip complex patterns.
  }
});
