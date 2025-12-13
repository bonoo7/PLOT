import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#FDF5E6', // OldLace - warmer/brighter than Beige
    text: '#1A1A1A', // Darker text for better contrast
    accentRed: '#D32F2F', // Brighter/Stronger Red
    accentYellow: '#FFC107', // Amber
    white: '#FFFFFF',
    error: '#D32F2F',
  },
  fonts: {
    main: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    bold: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  spacing: {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
  }
};
