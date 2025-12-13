import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../src/styles/theme';

export default function RedactedText({ text, style }) {
  if (!text) return null;
  const [revealed, setRevealed] = useState(false);

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => setRevealed(!revealed)}
      style={[styles.container, style]}
    >
      <Text style={[styles.text, revealed ? styles.revealed : styles.hidden]}>
        {text}
      </Text>
      {!revealed && <Text style={styles.hint}>(اضغط للكشف)</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    alignSelf: 'flex-start',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Courier New',
  },
  revealed: {
    color: '#fff',
  },
  hidden: {
    color: 'black',
    backgroundColor: 'black', // Ensures text is hidden
  },
  hint: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
  }
});
