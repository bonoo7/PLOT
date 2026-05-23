import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import { getColors } from '../tokens';

const ScanLines = () => {
  const c = getColors();
  const { height } = useWindowDimensions();
  const count = Math.ceil(height / 6);

  // Opacity animated value for CRT scanline flickering/glow
  const flickerAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    let active = true;
    const startFlicker = () => {
      if (!active) return;
      Animated.sequence([
        Animated.timing(flickerAnim, {
          toValue: 0.88 + Math.random() * 0.12, // subtle glow pulse
          duration: 80 + Math.random() * 100,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 0.96 + Math.random() * 0.04,
          duration: 60 + Math.random() * 80,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 0.86 + Math.random() * 0.14,
          duration: 70 + Math.random() * 90,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (active) startFlicker();
      });
    };
    startFlicker();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: flickerAnim }]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.line,
            {
              top: index * 6,
              backgroundColor: index % 2 === 0 ? 'rgba(0,255,65,0.035)' : 'rgba(0,255,65,0.012)',
            },
          ]}
        />
      ))}
      <View style={[styles.vignette, { borderColor: c.border }]} />
    </Animated.View>
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
