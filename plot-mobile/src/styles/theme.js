import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#FDF5E6',
    text: '#1A1A1A',
    accentRed: '#D32F2F',
    accentYellow: '#FFC107',
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
  },
  transitions: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  }
};
