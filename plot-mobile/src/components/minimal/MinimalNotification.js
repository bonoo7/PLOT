import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius } from '../../styles/responsive';

/**
 * MinimalNotification - A paper slip notification that slides in.
 * Replaces standard alerts/toasts.
 */
const MinimalNotification = ({ 
  message, 
  type = 'info', // info, success, warning, error
  visible = false,
  onDismiss,
  duration = 4000
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide In
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)), // Bouncy enter
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Auto Dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      // Hide immediately if not visible (or handled by dismiss animation)
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.container, 
      { transform: [{ translateY }], opacity }
    ]}>
      <TouchableOpacity onPress={handleDismiss} activeOpacity={0.9}>
        <View style={[styles.paperSlip, styles[`slip_${type}`]]}>
          <View style={styles.pin} />
          <Text style={styles.text}>{message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Below status bar
    left: spacing.m,
    right: spacing.m,
    zIndex: 9999,
    alignItems: 'center',
  },
  paperSlip: {
    backgroundColor: '#FFFACD', // Lemon Chiffon (Post-it like)
    padding: spacing.m,
    borderRadius: 2, // Sharp corners mostly
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#D2B48C',
    minWidth: 200,
    maxWidth: '90%',
    transform: [{ rotate: '-1deg' }], // Slight organic tilt
  },
  slip_info: {
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.info || '#4682B4',
  },
  slip_success: {
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.success || '#2D5F2E',
    backgroundColor: '#F0FFF0',
  },
  slip_warning: {
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.warning || '#E1AD01',
    backgroundColor: '#FFFFE0',
  },
  slip_error: {
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.error || '#B22222',
    backgroundColor: '#FFF0F0',
  },
  pin: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#B22222', // Red pin head
    borderWidth: 1,
    borderColor: '#800000',
    zIndex: 2,
  },
  text: {
    fontFamily: theme.fonts.main,
    fontSize: fonts.small,
    color: theme.colors.text,
    textAlign: 'center',
  },
});

export default MinimalNotification;
