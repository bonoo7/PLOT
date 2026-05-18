import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { getColors } from '../tokens';

const ScanLines = () => {
  const c = getColors();
  const { height } = useWindowDimensions();
  const count = Math.ceil(height / 6);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.line,
            {
              top: index * 6,
              backgroundColor: index % 2 === 0 ? 'rgba(0,255,65,0.05)' : 'rgba(0,255,65,0.015)',
            },
          ]}
        />
      ))}
      <View style={[styles.vignette, { borderColor: c.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
});

export default ScanLines;
