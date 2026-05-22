import { Platform, useWindowDimensions } from 'react-native';

const palette = {
  bg: '#000000',
  bgAlt: '#0A0A0A',
  surface: '#0D1A0D',
  surfaceAlt: '#111F11',
  textPrimary: '#00FF41',
  textSub: '#00CC33',
  textMuted: '#007A1F',
  textDim: '#004010',
  accentGreen: '#39FF14',
  accentCyan: '#00FFFF',
  accentYellow: '#FFFF00',
  accentRed: '#FF0033',
  accentPurple: '#CC00FF',
  border: '#003300',
  borderBright: '#00CC33',
  divider: '#002200',
  teamGood: '#00FF41',
  teamEvil: '#FF0033',
  teamNeutral: '#FFFF00',
  overlay: 'rgba(0,255,65,0.05)',
};

export const getColors = () => ({
  ...palette,
  text: palette.textPrimary,
  cardBg: palette.surface,
  cardBorder: palette.border,
  inputBg: palette.surfaceAlt,
  inputBorder: palette.border,
  accent: palette.accentGreen,
  success: palette.accentGreen,
  warning: palette.accentYellow,
  danger: palette.accentRed,
  info: palette.accentCyan,
  shadow: 'rgba(0, 255, 65, 0.16)',
});

export const fontFamily = {
  mono: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
};

export const fontSize = {
  label: 11,
  small: 12,
  body: 14,
  medium: 16,
  heading: 18,
  title: 24,
  display: 36,
};

export const sp = {
  xxs: 2,
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

export const zones = {
  topMin: 84,
  bottomMin: 68,
};

export const alpha = (hex, suffix = '22') => `${hex}${suffix}`;

export const ROLE_META = {
  CULPRIT: {
    code: 'CULPRIT',
    name: 'الجاني',
    emoji: '🎭',
    team: 'CRIME',
    color: palette.teamEvil,
    bracket: '[CULPRIT]',
  },
  DETECTIVE: {
    code: 'DETECTIVE',
    name: 'المحقق',
    emoji: '🕵️',
    team: 'JUSTICE',
    color: palette.teamGood,
    bracket: '[DETECTIVE]',
  },
  WITNESS: {
    code: 'WITNESS',
    name: 'الشاهد',
    emoji: '👁️',
    team: 'JUSTICE',
    color: palette.teamGood,
    bracket: '[WITNESS]',
  },
  SABOTEUR: {
    code: 'SABOTEUR',
    name: 'المخرب',
    emoji: '🧨',
    team: 'CRIME',
    color: palette.teamEvil,
    bracket: '[SABOTEUR]',
  },
  MINISTER: {
    code: 'MINISTER',
    name: 'الوزير',
    emoji: '📜',
    team: 'JUSTICE',
    color: palette.accentCyan,
    bracket: '[MINISTER]',
  },
  BENEFICIARY: {
    code: 'BENEFICIARY',
    name: 'المستفيد',
    emoji: '💰',
    team: 'NEUTRAL',
    color: palette.teamNeutral,
    bracket: '[BENEFICIARY]',
  },
  SEER: {
    code: 'SEER',
    name: 'العرّاف',
    emoji: '🔮',
    team: 'JUSTICE',
    color: palette.accentPurple,
    bracket: '[SEER]',
  },
  MASTERMIND: {
    code: 'MASTERMIND',
    name: 'العقل المدبر',
    emoji: '🧠',
    team: 'CRIME',
    color: palette.accentPurple,
    bracket: '[MASTERMIND]',
  },
};

export const getRoleMeta = (role) => ROLE_META[role] || {
  code: role || 'UNKNOWN',
  name: role || 'غير معروف',
  emoji: '👤',
  team: 'NEUTRAL',
  color: palette.teamNeutral,
  bracket: `[${role || 'UNKNOWN'}]`,
};

export const getTeamColor = (team, role) => {
  if (team === 'CRIME') return palette.teamEvil;
  if (team === 'JUSTICE' || team === 'GOOD') return palette.teamGood;
  if (team === 'NEUTRAL') return palette.teamNeutral;
  return getRoleMeta(role).color;
};

export const formatTime = (seconds = 0) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const buildAsciiBar = (value, max = 100, segments = 12) => {
  const normalizedMax = Math.max(1, Number(max) || 1);
  const safeValue = clamp(Number(value) || 0, 0, normalizedMax);
  const pct = safeValue / normalizedMax;
  const filledCount = Math.round(pct * segments);
  return {
    pct,
    filled: '█'.repeat(filledCount),
    empty: '─'.repeat(Math.max(0, segments - filledCount)),
    text: `[${'█'.repeat(filledCount)}${'─'.repeat(Math.max(0, segments - filledCount))}]`,
  };
};

export const formatScore = (score = 0) => {
  const numeric = Number(score) || 0;
  if (numeric > 0) return `+${numeric} pts`;
  if (numeric < 0) return `${numeric} pts`;
  return '0 pts';
};

export const makeIndexLabel = (index) => `[${String(Number(index) || 0).padStart(2, '0')}]`;

export const useLayout = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 960;
  const isTablet = width >= 680 && !isDesktop;
  return {
    width,
    height,
    isLandscape,
    isWeb,
    isDesktop,
    isTablet,
    contentMaxW: isDesktop ? 980 : '100%',
  };
};

export const getHighlightedParts = (text, template) => {
  if (!text) return [];
  if (!template || !template.includes('_____')) return [{ text, filled: false }];
  const parts = template.split('_____');
  const result = [];
  let remaining = text;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue; // empty blank at start of template
    const idx = remaining.indexOf(part);
    if (idx === -1) {
      result.push({ text: remaining, filled: false });
      remaining = '';
      break;
    }
    if (idx > 0) {
      result.push({ text: remaining.substring(0, idx), filled: true });
    }
    result.push({ text: part, filled: false });
    remaining = remaining.substring(idx + part.length);
  }
  if (remaining.length > 0) {
    result.push({ text: remaining, filled: true });
  }
  return result;
};

