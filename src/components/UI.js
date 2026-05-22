import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, StyleSheet, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT, progressColor } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

// ═══ AVATAR ═══
export const Avatar = ({ size = 40, url, color, name = '' }) => {
  const { colors: COLORS } = useTheme();
  const resolvedColor = color !== undefined ? color : COLORS.orange;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const styles = useMemo(() => StyleSheet.create({
    avatar: {
      backgroundColor: COLORS.card,
      borderWidth: 2,
      borderColor: COLORS.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarText: {
      fontWeight: FONT.bold,
    },
  }), [COLORS]);
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.35 }]}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: '100%', height: '100%', borderRadius: size * 0.35 }} />
      ) : (
        <Text style={[styles.avatarText, { fontSize: size * 0.35, color: resolvedColor }]}>{initials || '?'}</Text>
      )}
    </View>
  );
};

// ═══ PROGRESS BAR ═══
const progressTrackStyle = StyleSheet.create({
  track: { width: '100%', backgroundColor: '#1A1A1A', overflow: 'hidden' },
  fill: { transition: 'width 0.6s ease' },
});

export const ProgressBar = ({ value = 0, height = 6 }) => (
  <View style={[progressTrackStyle.track, { height, borderRadius: height + 2 }]}>
    <View style={[progressTrackStyle.fill, { width: `${value}%`, height, borderRadius: height + 2, backgroundColor: progressColor(value) }]} />
  </View>
);

// ═══ CHIP ═══
export const Chip = ({ label, active, onPress, color }) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.card,
    },
    chipText: {
      fontSize: 12,
      fontWeight: FONT.medium,
      color: COLORS.t3,
    },
  }), [COLORS]);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && { backgroundColor: color || COLORS.accent, borderColor: 'transparent' }]}>
      <Text style={[styles.chipText, active && { color: '#000', fontWeight: FONT.bold }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ═══ BUTTON ═══
export const Button = ({ children, onPress, variant = 'primary', disabled, style: customStyle }) => {
  const { colors: COLORS } = useTheme();
  const variants = {
    primary: { backgroundColor: COLORS.accent, borderWidth: 0 },
    secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
    danger: { backgroundColor: 'transparent', borderWidth: 0 },
  };
  const textColors = { primary: '#000', secondary: COLORS.silver, danger: COLORS.red };
  const styles = useMemo(() => StyleSheet.create({
    button: {
      width: '100%',
      padding: 14,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: FONT.bold,
    },
  }), [COLORS]);

  return (
    <TouchableOpacity onPress={disabled ? null : onPress} style={[styles.button, variants[variant], disabled && { opacity: 0.5 }, customStyle]} activeOpacity={0.7}>
      <Text style={[styles.buttonText, { color: textColors[variant] }]}>{children}</Text>
    </TouchableOpacity>
  );
};

// ═══ INPUT ═══
export const Input = ({ placeholder, value, onChangeText, type = 'text', multiline, rows = 4 }) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    input: {
      width: '100%',
      padding: 14,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: RADIUS.md,
      color: COLORS.t1,
      fontSize: 14,
    },
  }), [COLORS]);
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#444"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={type === 'password'}
        keyboardType={type === 'email' ? 'email-address' : type === 'phone' ? 'phone-pad' : 'default'}
        multiline={multiline}
        numberOfLines={multiline ? rows : 1}
        style={[styles.input, multiline && { height: rows * 24, textAlignVertical: 'top' }]}
      />
    </View>
  );
};

// ═══ CARD ═══
export const Card = ({ children, style: customStyle, onPress }) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: COLORS.card,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SPACING.lg,
      marginBottom: SPACING.sm,
    },
  }), [COLORS]);
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.7} style={[styles.card, customStyle]}>
      {children}
    </Wrapper>
  );
};

// ═══ SECTION HEADER ═══
export const SectionHeader = ({ title, actionText, onAction }) => {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: FONT.bold,
      color: COLORS.t1,
    },
    sectionAction: {
      fontSize: 12,
      color: COLORS.silver,
    },
  }), [COLORS]);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionText && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{actionText} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ═══ BADGE ═══
export const Badge = ({ label, color }) => (
  <View style={[badgeStyle.badge, { backgroundColor: color + '20' }]}>
    <Text style={[badgeStyle.badgeText, { color }]}>{label}</Text>
  </View>
);

const badgeStyle = StyleSheet.create({
  badge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 },
  badgeText: { fontSize: 9, fontWeight: FONT.bold },
});

// ═══ STATUS DOT ═══
export const StatusDot = ({ status }) => {
  const { colors: COLORS } = useTheme();
  const colorMap = { active: COLORS.green, pending: COLORS.orange, suspended: COLORS.red };
  return <View style={[statusDotStyle.dot, { backgroundColor: colorMap[status] || COLORS.t3 }]} />;
};

const statusDotStyle = StyleSheet.create({
  dot: { width: 6, height: 6, borderRadius: 3 },
});

// ═══ TOAST ═══
// Usage: const { toast, showToast } = useToast();
// Then render <Toast toast={toast} /> anywhere in the screen JSX.
// showToast('message', 'success' | 'error' | 'info')
export function useToast() {
  const [toast, setToast] = React.useState(null);
  const timer = React.useRef(null);
  const show = React.useCallback((message, type = 'info') => {
    clearTimeout(timer.current);
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return { toast, showToast: show };
}

export function Toast({ toast }) {
  const { colors: COLORS } = useTheme();
  if (!toast) return null;
  const color = { success: COLORS.green, error: COLORS.red, info: COLORS.accent }[toast.type] || COLORS.accent;
  const icon  = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' }[toast.type] || 'information-circle';
  const toastS = useMemo(() => StyleSheet.create({
    wrap: {
      position: 'absolute', top: 12, left: 14, right: 14, zIndex: 9999,
      backgroundColor: '#1C1C1C', borderRadius: 12, borderLeftWidth: 4,
      padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10,
    },
    msg: { flex: 1, fontSize: 13, color: COLORS.t1, fontWeight: FONT.medium },
  }), [COLORS]);
  return (
    <View style={[toastS.wrap, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={toastS.msg}>{toast.message}</Text>
    </View>
  );
}

// ═══ CONFIRM MODAL ═══
// Usage: <ConfirmModal visible={...} title="..." message="..." onConfirm={...} onCancel={...} danger />
export function ConfirmModal({ visible, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  const { colors: COLORS } = useTheme();
  const cmS = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    box: { width: '100%', maxWidth: 340, backgroundColor: '#1C1C1C', borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
    title: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 8 },
    msg: { fontSize: 13, color: COLORS.t3, lineHeight: 20, marginBottom: 20 },
    row: { flexDirection: 'row', gap: 12 },
    cancel: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
    cancelTxt: { fontSize: 14, color: COLORS.silver },
    confirm: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.accent, alignItems: 'center' },
    confirmTxt: { fontSize: 14, fontWeight: FONT.bold, color: '#000' },
    danger: { backgroundColor: COLORS.red + '20', borderWidth: 1, borderColor: COLORS.red + '50' },
  }), [COLORS]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={cmS.overlay}>
        <View style={cmS.box}>
          <Text style={cmS.title}>{title}</Text>
          {!!message && <Text style={cmS.msg}>{message}</Text>}
          <View style={cmS.row}>
            <TouchableOpacity onPress={onCancel} style={cmS.cancel}>
              <Text style={cmS.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[cmS.confirm, danger && cmS.danger]}>
              <Text style={[cmS.confirmTxt, danger && { color: COLORS.red }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ═══ VIDEO PLAYER ═══
// Embeds YouTube on web (via iframe), links out on native.
function extractYouTubeId(url) {
  if (!url) return null;
  const ps = [/youtube\.com\/watch\?v=([^&\n?#]+)/, /youtube\.com\/embed\/([^?#]+)/, /youtu\.be\/([^?#]+)/];
  for (const p of ps) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

export function VideoPlayer({ url, title }) {
  const { colors: COLORS } = useTheme();
  const vpS = useMemo(() => StyleSheet.create({
    webWrap: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000', marginBottom: 16 },
    card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#0A0A0A', borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 16 },
    thumb: { width: 70, height: 56, borderRadius: 8, backgroundColor: '#FF000015', alignItems: 'center', justifyContent: 'center' },
    playBtn: { position: 'absolute', bottom: 6, right: 6, width: 22, height: 22, borderRadius: 6, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1 },
    title: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1, lineHeight: 18, marginBottom: 4 },
    sub: { fontSize: 11, color: COLORS.accent },
  }), [COLORS]);

  if (!url) return null;
  const ytId = extractYouTubeId(url);

  if (Platform.OS === 'web' && ytId) {
    return (
      <View style={vpS.webWrap}>
        {React.createElement('iframe', {
          src: `https://www.youtube.com/embed/${ytId}`,
          style: { width: '100%', height: '100%', border: 'none', borderRadius: 10 },
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowFullScreen: true,
        })}
      </View>
    );
  }

  // Native: tap-to-play card
  return (
    <TouchableOpacity onPress={() => Linking.openURL(url)} style={vpS.card} activeOpacity={0.8}>
      <View style={vpS.thumb}>
        <Ionicons name="logo-youtube" size={40} color="#FF0000" />
        <View style={vpS.playBtn}>
          <Ionicons name="play" size={18} color="#000" />
        </View>
      </View>
      <View style={vpS.info}>
        {title ? <Text style={vpS.title} numberOfLines={2}>{title}</Text> : null}
        <Text style={vpS.sub}>{ytId ? 'Opens in YouTube' : 'Tap to play video'}</Text>
      </View>
    </TouchableOpacity>
  );
}
