/**
 * design-v2/tokens/index.js
 * Design tokens for V2 "Classified Dossier" theme.
 * No textures or images — structure & color only (Phase 1).
 */
import { Platform, useWindowDimensions } from 'react-native';

// ─── Color Palettes ───────────────────────────────────────────
export const light = {
  // Surfaces
  bg:         '#E8DDB5',   // kraft paper
  surface:    '#F5EDD8',   // aged document
  surfaceAlt: '#EDE0C4',   // slightly darker paper
  cardBg:     '#F5EDD8',
  cardBorder: '#8A6E3F',

  // Text
  text:       '#1A0E04',   // deep ink
  textSub:    '#5C3D1E',   // brown ink secondary
  textMuted:  '#8A6E4A',   // faded ink

  // Accent
  red:        '#B22222',   // classification red
  gold:       '#9B7A2C',   // aged gold
  green:      '#2E5E2E',   // field operative green
  blue:       '#1A3A5C',   // classified blue

  // UI States
  border:     '#8A6E3F',
  divider:    '#C9A96B',
  inputBg:    '#FFFEF5',
  inputBorder:'#8A6E3F',
  overlay:    'rgba(26,14,4,0.55)',
  shadow:     'rgba(26,14,4,0.35)',

  // Semantic
  danger:     '#B22222',
  success:    '#2E5E2E',
  warning:    '#9B7A2C',
  info:       '#1A3A5C',
  accent:     '#B22222',   // alias for red/danger

  // Teams
  teamGood:   '#2E5E2E',
  teamEvil:   '#B22222',
  teamNeutral:'#5C3D1E',
};

export const dark = {
  // Surfaces
  bg:         '#080D18',   // ops room
  surface:    '#111927',   // file surface
  surfaceAlt: '#162030',
  cardBg:     '#111927',
  cardBorder: '#1E3A5F',

  // Text
  text:       '#D4C5A0',   // amber terminal
  textSub:    '#A89070',   // dimmed amber
  textMuted:  '#607080',   // muted slate

  // Accent
  red:        '#CC2200',   // danger red
  gold:       '#D4AF37',   // classified gold
  green:      '#1A8A4A',   // clear green
  blue:       '#2A6FAA',   // intel blue

  // UI States
  border:     '#1E3A5F',
  divider:    '#1E3050',
  inputBg:    '#0D1520',
  inputBorder:'#2A4A70',
  overlay:    'rgba(0,0,0,0.70)',
  shadow:     'rgba(0,0,0,0.85)',

  // Semantic
  danger:     '#CC2200',
  success:    '#1A8A4A',
  warning:    '#D4AF37',
  info:       '#2A6FAA',
  accent:     '#CC2200',   // alias for red/danger

  // Teams
  teamGood:   '#1A8A4A',
  teamEvil:   '#CC2200',
  teamNeutral:'#607080',
};

export const getColors = (mode) => mode === 'dark' ? dark : light;

// ─── Typography ───────────────────────────────────────────────
export const fontFamily = {
  mono: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
};

export const fontSize = {
  label:   11,
  small:   12,
  body:    13,
  medium:  14,
  heading: 16,
  title:   20,
  display: 26,
};

export const lineHeight = {
  tight:  1.2,
  normal: 1.45,
  loose:  1.7,
};

// ─── Spacing (compact) ────────────────────────────────────────
export const sp = {
  xxs: 2,
  xs:  4,
  s:   6,
  m:   10,
  l:   14,
  xl:  20,
  xxl: 28,
};

// ─── Border Radius ────────────────────────────────────────────
export const radius = {
  xs:  2,
  s:   4,
  m:   6,
  l:   10,
  xl:  14,
  pill:999,
};

// ─── Layout — 3-Zone constants ────────────────────────────────
// These are FLEX weights, not pixel heights, so they adapt to any screen.
export const zones = {
  topFlex:    2,    // ~20-25%
  centerFlex: 6,    // ~60-65%
  bottomFlex: 1,    // ~10-15%
};

// ─── Shadows (comic-style hard offset) ───────────────────────
export const makeShadow = (color = 'rgba(0,0,0,0.35)') => ({
  shadowColor:  color,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 5,
});

// ─── Hook: responsive info ────────────────────────────────────
export const useLayout = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWeb       = Platform.OS === 'web';
  const isDesktop   = isWeb && width >= 900;
  const isTablet    = width >= 600 && !isDesktop;
  const isMobile    = !isDesktop && !isTablet;
  const contentMaxW = isDesktop ? 900 : '100%';  // only web desktop gets constrained
  return { width, height, isLandscape, isWeb, isDesktop, isTablet, isMobile, contentMaxW };
};
