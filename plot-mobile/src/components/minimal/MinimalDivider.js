import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing } from '../../styles/responsive';

/**
 * MinimalDivider - A simple divider line, often used on paper.
 */
const MinimalDivider = ({ 
  vertical = false,
  color = '#D2B48C', // Tan/Paper border color
  style = {}
}) => {
  return (
    <View style={[
      styles.divider,
      vertical ? styles.vertical : styles.horizontal,
      { backgroundColor: color },
      style
    ]} />
  );
};

const styles = StyleSheet.create({
  divider: {
    opacity: 0.5,
  },
  horizontal: {
    width: '100%',
    height: 1,
    marginVertical: spacing.m,
  },
  vertical: {
    width: 1,
    height: '100%',
    marginHorizontal: spacing.m,
  },
});

export default MinimalDivider;
