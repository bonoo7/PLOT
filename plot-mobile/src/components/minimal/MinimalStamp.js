import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius } from '../../styles/responsive';

/**
 * MinimalStamp - A button that acts like a rubber stamp.
 * Animates a forceful "press" and leaves a "stamp mark".
 */
const MinimalStamp = ({ 
  label = "APPROVED", 
  onPress,
  color = theme.colors.stamp || '#B22222', 
  disabled = false,
  style = {}
}) => {
  // Use useRef for animated values to prevent recreation on re-renders
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;
  const [stamped, setStamped] = useState(false);

  const handlePress = () => {
    if (disabled || stamped) return;

    // Stamp Animation: Quick shrink, then boom
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1.2,
        friction: 2,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setStamped(true);
      if (onPress) onPress();
    });
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={1} 
      disabled={disabled}
      style={[styles.container, style]}
    >
      <Animated.View style={[
        styles.stampBody,
        { transform: [{ scale }], opacity: disabled ? 0.5 : 1 }
      ]}>
        {/* Handle */}
        <View style={styles.handleTop} />
        <View style={styles.handleStem} />
        
        {/* Base */}
        <View style={[styles.base, { borderColor: color }]}>
          <Text style={[styles.text, { color }]}>{label}</Text>
        </View>
      </Animated.View>
      
      {/* The "Ink" Mark left behind (optional effect, maybe just sound) */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.m,
  },
  stampBody: {
    alignItems: 'center',
  },
  handleTop: {
    width: 40,
    height: 20,
    backgroundColor: '#3E2723', // Dark Wood
    borderRadius: 20,
    marginBottom: -5,
    zIndex: 2,
  },
  handleStem: {
    width: 12,
    height: 30,
    backgroundColor: '#4E342E',
    zIndex: 1,
  },
  base: {
    width: 120,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 3,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 3,
    marginTop: -5, // Connect to stem
  },
  text: {
    fontFamily: theme.fonts.bold,
    fontSize: fonts.medium,
    fontWeight: '900',
    letterSpacing: 2,
    transform: [{ rotate: '-2deg' }],
  },
});

export default MinimalStamp;
