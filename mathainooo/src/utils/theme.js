export const COLORS = {
  bg: '#000000',
  card: '#111111',
  border: '#1C1C1C',
  elevated: '#161616',
  t1: '#E8E8E8',
  t2: '#AAAAAA',
  t3: '#666666',
  silver: '#C0C0C0',
  accent: '#FFD93D',
  green: '#2ECC71',
  red: '#FF4D4D',
  blue: '#4DA6FF',
  pink: '#FF6B8A',
  orange: '#FFB347',
  teal: '#6BCB77',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const FONT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 20,
  avatar: 14,
};

export const progressColor = (value) => {
  if (value < 30) return '#FF4D4D';
  if (value < 50) return '#FF8C42';
  if (value < 70) return '#FFD93D';
  if (value < 85) return '#6BCB77';
  return '#2ECC71';
};

export const roleBadgeColor = (role) => ({
  Student: COLORS.blue,
  Lecturer: COLORS.teal,
  Faculty: COLORS.orange,
  'Super Admin': COLORS.pink,
}[role] || COLORS.blue);

export const statusColor = (status) => ({
  active: COLORS.green,
  pending: COLORS.orange,
  suspended: COLORS.red,
}[status] || COLORS.t3);
