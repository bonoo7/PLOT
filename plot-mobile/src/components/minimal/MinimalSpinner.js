import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts } from '../../styles/responsive';

/**
 * MinimalSpinner - A simple loading indicator.
 */
const MinimalSpinner = ({ 
  size = 'large', 
  color = theme.colors.stamp, // Red stamp color
  text = null,
  style = {} 
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.m,
  },
  text: {
    marginTop: spacing.s,
    fontFamily: theme.fonts.main,
    fontSize: fonts.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default MinimalSpinner;
