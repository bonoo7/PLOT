import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#F5F5DC',
    text: '#2F4F4F',
    accentRed: '#B22222',
    accentYellow: '#E1AD01',
    white: '#FFFFFF',
    error: '#FF0000',
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
