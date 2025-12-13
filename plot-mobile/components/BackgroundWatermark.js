import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function BackgroundWatermark() {
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={[styles.text, { top: '10%', left: '5%', transform: [{ rotate: '-25deg' }] }]}>
        سري للغاية
      </Text>
      <Text style={[styles.text, { top: '40%', right: '5%', transform: [{ rotate: '45deg' }] }]}>
        سري جداً
      </Text>
      <Text style={[styles.text, { bottom: '15%', left: '10%', transform: [{ rotate: '-15deg' }] }]}>
        محدود
      </Text>
      <Text style={[styles.text, { top: '60%', left: '15%', transform: [{ rotate: '25deg' }] }]}>
        سري
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    overflow: 'hidden',
    opacity: 0.12,
  },
  text: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
    width: 400,
  },
});
