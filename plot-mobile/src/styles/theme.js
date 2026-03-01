/**
 * theme.js - Compatibility shim
 * All new code should import from `src/constants/theme.js` instead.
 * This file re-exports from the new theme system while keeping backward-compat
 * for older screens still importing `{ theme }` from this path.
 */
import { Platform } from 'react-native';
import { spacing, fonts, shadows as responsiveShadows } from './responsive';
import { getTheme, themes, roleImages } from '../constants/theme';

// Re-export new API for any file that imports from here
export { getTheme, themes, roleImages };

// Backward-compat `theme` object – mirrors the OLD shape so nothing breaks
export const theme = {
  colors: {
    background: '#F4EBD0',
    paper: '#FFFEF7',
    text: '#111111',
    textSecondary: '#4F4F4F',
    stamp: '#D9381E',
    stickyNote: '#E1AD01',
    redacted: '#000000',
    coffee: '#8B7355',
    paperclip: '#B8B8B8',
    primary: '#2E7D32',
    secondary: '#E1AD01',
    success: '#2E7D32',
    warning: '#E1AD01',
    error: '#D9381E',
    info: '#4682B4',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    teamGood: '#2E7D32',
    teamEvil: '#D9381E',
    teamNeutral: '#555555',
    accentYellow: '#E1AD01',
  },

  // New-style role images (cartoonish, from assets/roles/)
  roleImages,

  fonts: {
    main: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    bold: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    heading: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    sizes: fonts,
  },

  spacing,

  transitions: {
    fast: 150,
    normal: 250,
    slow: 400,
  },

  shadows: responsiveShadows,

  effects: {
    typewriter: true,
    coffeeStains: true,
    paperclips: true,
    stamps: true,
    redactedText: true,
  },
};



