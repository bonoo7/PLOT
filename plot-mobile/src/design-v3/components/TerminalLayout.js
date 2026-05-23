import React, { useEffect, useRef } from 'react';
import { SafeAreaView, View, StyleSheet, Platform, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ScanLines from './ScanLines';
import { getColors, sp, useLayout, zones } from '../tokens';

const TerminalLayout = ({ top, bottom, children, style, centerStyle }) => {
  const c = getColors();
  const { contentMaxW } = useLayout();

  // Animation values for screen glitch transition on mount
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;
  const glitchOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let active = true;
    let count = 0;
    const maxGlitches = 6;

    const runGlitchTransition = () => {
      if (!active || count >= maxGlitches) {
        // Reset to normal values
        shakeX.setValue(0);
        shakeY.setValue(0);
        glitchOpacity.setValue(1);
        return;
      }

      // Random offsets and opacity drop to simulate system static glitch
      const rx = (Math.random() - 0.5) * 8; // -4px to +4px
      const ry = (Math.random() - 0.5) * 8;
      const ro = 0.82 + Math.random() * 0.18; // 82% to 100% opacity

      Animated.parallel([
        Animated.timing(shakeX, { toValue: rx, duration: 25, useNativeDriver: true }),
        Animated.timing(shakeY, { toValue: ry, duration: 25, useNativeDriver: true }),
        Animated.timing(glitchOpacity, { toValue: ro, duration: 25, useNativeDriver: true }),
      ]).start(() => {
        count++;
        if (active) setTimeout(runGlitchTransition, 25);
      });
    };

    runGlitchTransition();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <StatusBar style="light" hidden={Platform.OS !== 'web'} />
      <ScanLines />
      <Animated.View
        style={[
          styles.inner,
          {
            maxWidth: contentMaxW,
            opacity: glitchOpacity,
            transform: [{ translateX: shakeX }, { translateY: shakeY }],
          },
        ]}
      > 
        {top ? <View style={[styles.topZone, { borderBottomColor: c.divider, minHeight: zones.topMin }]}>{top}</View> : null}
        <View style={[styles.centerZone, centerStyle, style]}>{children}</View>
        {bottom ? (
          <View
            style={[
              styles.bottomZone,
              {
                borderTopColor: c.divider,
                minHeight: zones.bottomMin,
                paddingBottom: Platform.OS === 'ios' ? 20 : sp.s,
              },
            ]}
          >
            {bottom}
          </View>
        ) : null}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    zIndex: 1,
  },
  topZone: {
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
    borderBottomWidth: 1,
  },
  centerZone: {
    flex: 1,
    paddingHorizontal: sp.m,
    paddingVertical: sp.s,
  },
  bottomZone: {
    borderTopWidth: 1,
    paddingHorizontal: sp.m,
    paddingTop: sp.s,
  },
});

export default TerminalLayout;
