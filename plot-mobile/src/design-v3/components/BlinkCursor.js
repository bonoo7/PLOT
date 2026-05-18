import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { getColors, fontFamily } from '../tokens';

const BlinkCursor = ({ style, color }) => {
  const c = getColors();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 420, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <Text style={[styles.cursor, { color: color || c.accentGreen }, style]}>▋</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cursor: {
    fontFamily: fontFamily.mono,
    fontWeight: '700',
  },
});

export default BlinkCursor;
