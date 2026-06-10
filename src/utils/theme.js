// ═══════════════════════════════════════════════════════════════════
// iLearn design tokens
// 60/30/10 — dominant canvas / structural surfaces / ONE amber accent.
// 8-point grid throughout. Two font weights only (400 / 700).
// ═══════════════════════════════════════════════════════════════════

export const DARK_COLORS = {
  // 60% — dominant canvas (deep ink, blue-shifted; never muddy grey)
  bg: '#0B0C0F',
  // 30% — structural surfaces
  card: '#14161B',
  elevated: '#1B1E25',
  border: '#23262E',
  // Text tiers
  t1: '#F2F3F5',
  t2: '#9BA1AB',
  t3: '#5E646E',
  silver: '#B7BCC4',
  // 10% — the single brand accent. Primary actions + focus only.
  accent: '#FFC53D',
  // Semantic status — reserved for actual status (presence, success, danger)
  green: '#34C759',
  amber: '#FFB020',
  red: '#FF453A',
  // Supporting hues (badges / role tags only, muted usage)
  blue: '#5AA9FF',
  pink: '#FF6B8A',
  orange: '#FF9F45',
  teal: '#3DD68C',
};

export const LIGHT_COLORS = {
  bg: '#F4F4F1',
  card: '#FFFFFF',
  elevated: '#FAFAF8',
  border: '#E4E4DE',
  t1: '#16181D',
  t2: '#5A6068',
  t3: '#9AA0A8',
  silver: '#5A6068',
  accent: '#E0A800',
  green: '#1FA84F',
  amber: '#D98E00',
  red: '#E03B30',
  blue: '#2E7CD6',
  pink: '#D63B64',
  orange: '#DB7A1F',
  teal: '#149A60',
};

// 8-point grid (4 allowed for tight elements)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Exactly two weights per screen: Regular (400) and Bold (700)
export const FONT = {
  regular: '400',
  medium: '400',
  semibold: '700',
  bold: '700',
  extrabold: '700',
};

// Type scale — Header / Body / Caption (+ display for hero numerals)
export const TYPE = {
  display: 32,
  header: 22,
  title: 16,
  body: 14,
  caption: 12,
  micro: 11,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 16,
  pill: 999,
  avatar: 12,
};

export const progressColor = (value) => {
  if (value < 30) return '#FF453A';
  if (value < 70) return '#FFB020';
  return '#34C759';
};

export const roleBadgeColor = (role, colors) => ({
  Student: colors.blue,
  Lecturer: colors.teal,
  Faculty: colors.orange,
  'Super Admin': colors.pink,
}[role] || colors.blue);

export const statusColor = (status, colors) => ({
  active: colors.green,
  pending: colors.amber,
  suspended: colors.red,
}[status] || colors.t3);

// Live-class presence: green = in class, amber = switched app, red = exited
export const presenceColor = (presence, colors) => ({
  ACTIVE: colors.green,
  BACKGROUND: colors.amber,
  EXITED: colors.red,
  NOT_JOINED: colors.t3,
}[presence] || colors.t3);

export const presenceLabel = (presence) => ({
  ACTIVE: 'In class',
  BACKGROUND: 'Switched app',
  EXITED: 'Left',
  NOT_JOINED: 'Not joined',
}[presence] || presence);
