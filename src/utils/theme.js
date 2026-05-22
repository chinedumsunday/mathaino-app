export const DARK_COLORS = {
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

export const LIGHT_COLORS = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  border: '#E0E0E0',
  elevated: '#FAFAFA',
  t1: '#111111',
  t2: '#555555',
  t3: '#999999',
  silver: '#666666',
  accent: '#E6A800',
  green: '#1FAD5E',
  red: '#E63939',
  blue: '#2E86E8',
  pink: '#E8446E',
  orange: '#E8952A',
  teal: '#3FAD5C',
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

export const roleBadgeColor = (role, colors) => ({
  Student: colors.blue,
  Lecturer: colors.teal,
  Faculty: colors.orange,
  'Super Admin': colors.pink,
}[role] || colors.blue);

export const statusColor = (status, colors) => ({
  active: colors.green,
  pending: colors.orange,
  suspended: colors.red,
}[status] || colors.t3);
