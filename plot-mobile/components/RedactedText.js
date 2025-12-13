import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../src/styles/theme';

export default function RedactedText({ text, style }) {
  if (!text) return null;

  const textLength = text.length;
  const barWidth = Math.max(textLength * 8, 60);

  return (
    <View style={[styles.redactedContainer, style]}>
      <View style={[styles.redactedBar, { width: barWidth }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  redactedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  redactedBar: {
    height: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
  },
});
