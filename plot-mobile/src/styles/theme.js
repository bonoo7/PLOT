import { Platform } from 'react-native';

export const theme = {
  colors: {
    background: '#F5F5DC', // Beige - classic bureaucratic theme
    text: '#2F4F4F', // Dark slate gray for professional look
    accentRed: '#B22222', // Fire brick - muted red for stamps
    accentYellow: '#E1AD01', // Khaki - vintage note color
    accentGreen: '#6B8E23', // Olive green - authority documents
    white: '#FFFFFF',
    lightBg: '#FFFAF0', // Floral white for cards
    darkOverlay: 'rgba(0, 0, 0, 0.08)', // Subtle dark overlay
    error: '#B22222',
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
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 5,
    },
    light: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
  },
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
  },
};
