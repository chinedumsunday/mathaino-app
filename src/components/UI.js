import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Pressable, Image, Modal,
  StyleSheet, Platform, Linking, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT, TYPE, progressColor, presenceColor } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';

// ═══ HAPTICS (no-op on web) ═══
let Haptics = null;
if (Platform.OS !== 'web') {
  try { Haptics = require('expo-haptics'); } catch (_) {}
}

export const haptic = {
  light: () => Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => Haptics?.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () => Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () => Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
  error: () => Haptics?.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};

// ═══ AVATAR ═══
export const Avatar = ({ size = 40, url, color, name = '' }) => {
  const { colors: COLORS } = useTheme();
  const resolvedColor = color !== undefined ? color : COLORS.silver;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.32,
      backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border,
      alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {url ? (
        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} />
      ) : (
        <Text style={{ fontSize: size * 0.34, fontWeight: FONT.bold, color: resolvedColor }}>{initials || '?'}</Text>
      )}
    </View>
  );
};

// ═══ PROGRESS BAR ═══
export const ProgressBar = ({ value = 0, height = 8 }) => {
  const { colors: COLORS } = useTheme();
  return (
    <View style={{ width: '100%', height, borderRadius: height / 2, backgroundColor: COLORS.elevated, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.max(0, value))}%`, height, borderRadius: height / 2, backgroundColor: progressColor(value) }} />
    </View>
  );
};

// ═══ CHIP ═══
export const Chip = ({ label, active, onPress, color }) => {
  const { colors: COLORS } = useTheme();
  const accent = color || COLORS.accent;
  return (
    <Pressable
      onPress={() => { haptic.light(); onPress?.(); }}
      style={({ pressed }) => ({
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: active ? 'transparent' : COLORS.border,
        backgroundColor: active ? accent : COLORS.card,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
    >
      <Text style={{
        fontSize: TYPE.caption,
        fontWeight: active ? FONT.bold : FONT.regular,
        color: active ? '#16181D' : COLORS.t2,
      }}>{label}</Text>
    </Pressable>
  );
};

// ═══ BUTTON ═══
// 56pt primary target — comfortable in the thumb zone.
export const Button = ({ children, onPress, variant = 'primary', disabled, loading, style: customStyle, icon }) => {
  const { colors: COLORS } = useTheme();
  const variants = {
    primary: { backgroundColor: COLORS.accent, borderWidth: 0 },
    secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
    danger: { backgroundColor: COLORS.red + '18', borderWidth: 1, borderColor: COLORS.red + '50' },
    ghost: { backgroundColor: 'transparent', borderWidth: 0 },
  };
  const textColors = { primary: '#16181D', secondary: COLORS.t1, danger: COLORS.red, ghost: COLORS.t2 };
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? null : () => { haptic.medium(); onPress?.(); }}
      style={({ pressed }) => ([
        {
          width: '100%',
          height: 56,
          borderRadius: RADIUS.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: SPACING.sm,
          opacity: isDisabled ? 0.4 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        variants[variant],
        customStyle,
      ])}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={textColors[variant]} />}
          <Text style={{ fontSize: TYPE.title, fontWeight: FONT.bold, color: textColors[variant] }}>{children}</Text>
        </>
      )}
    </Pressable>
  );
};

// ═══ INPUT ═══
export const Input = ({ label, placeholder, value, onChangeText, type = 'text', multiline, rows = 4, ...rest }) => {
  const { colors: COLORS } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label ? (
        <Text style={{ fontSize: TYPE.caption, color: COLORS.t2, marginBottom: SPACING.xs, marginLeft: SPACING.xs }}>{label}</Text>
      ) : null}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={COLORS.t3}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        secureTextEntry={type === 'password'}
        keyboardType={type === 'email' ? 'email-address' : type === 'phone' ? 'phone-pad' : rest.keyboardType || 'default'}
        autoCapitalize={type === 'email' ? 'none' : rest.autoCapitalize}
        multiline={multiline}
        numberOfLines={multiline ? rows : 1}
        style={[
          {
            width: '100%',
            padding: SPACING.lg,
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: focused ? COLORS.accent : COLORS.border,
            borderRadius: RADIUS.md,
            color: COLORS.t1,
            fontSize: TYPE.body,
          },
          multiline && { height: rows * 24 + SPACING.lg, textAlignVertical: 'top' },
        ]}
      />
    </View>
  );
};

// ═══ CARD ═══
export const Card = ({ children, style: customStyle, onPress }) => {
  const { colors: COLORS } = useTheme();
  const base = {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  };
  if (!onPress) return <View style={[base, customStyle]}>{children}</View>;
  return (
    <Pressable
      onPress={() => { haptic.light(); onPress(); }}
      style={({ pressed }) => ([base, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }, customStyle])}
    >
      {children}
    </Pressable>
  );
};

// ═══ SCREEN HEADER ═══
// Shared header: 40pt back target, centered weight, optional right slot.
export const ScreenHeader = ({ title, onBack, right }) => {
  const { colors: COLORS } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, gap: SPACING.sm,
    }}>
      {onBack && (
        <Pressable
          onPress={() => { haptic.light(); onBack(); }}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: RADIUS.md,
            backgroundColor: pressed ? COLORS.elevated : COLORS.card,
            borderWidth: 1, borderColor: COLORS.border,
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.t1} />
        </Pressable>
      )}
      <Text style={{ flex: 1, fontSize: TYPE.header, fontWeight: FONT.bold, color: COLORS.t1, marginLeft: SPACING.xs }}>{title}</Text>
      {right}
    </View>
  );
};

// ═══ SECTION HEADER ═══
export const SectionHeader = ({ title, actionText, onAction }) => {
  const { colors: COLORS } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
      <Text style={{ fontSize: TYPE.title, fontWeight: FONT.bold, color: COLORS.t1 }}>{title}</Text>
      {actionText && (
        <TouchableOpacity onPress={onAction} hitSlop={8}>
          <Text style={{ fontSize: TYPE.caption, color: COLORS.t2 }}>{actionText} →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ═══ BADGE ═══
export const Badge = ({ label, color }) => (
  <View style={{ paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm + 2, borderRadius: RADIUS.pill, backgroundColor: color + '1F' }}>
    <Text style={{ fontSize: TYPE.micro, fontWeight: FONT.bold, color }}>{label}</Text>
  </View>
);

// ═══ STATUS DOT ═══
export const StatusDot = ({ status }) => {
  const { colors: COLORS } = useTheme();
  const colorMap = { active: COLORS.green, pending: COLORS.amber, suspended: COLORS.red };
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colorMap[status] || COLORS.t3 }} />;
};

// ═══ PRESENCE DOT ═══
// The attendance language: green = in class, amber = switched app, red = left.
export const PresenceDot = ({ presence, size = 10 }) => {
  const { colors: COLORS } = useTheme();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: presenceColor(presence, COLORS),
    }} />
  );
};

// ═══ EMPTY STATE ═══
export const EmptyState = ({ icon = 'file-tray-outline', title, message }) => {
  const { colors: COLORS } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: SPACING.xxl * 2, paddingHorizontal: SPACING.xl }}>
      <View style={{
        width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.card,
        borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={28} color={COLORS.t3} />
      </View>
      <Text style={{ fontSize: TYPE.title, fontWeight: FONT.bold, color: COLORS.t1, marginTop: SPACING.lg }}>{title}</Text>
      {message ? <Text style={{ fontSize: TYPE.caption, color: COLORS.t3, marginTop: SPACING.xs, textAlign: 'center' }}>{message}</Text> : null}
    </View>
  );
};

// ═══ TOAST ═══
export function useToast() {
  const [toast, setToast] = React.useState(null);
  const timer = React.useRef(null);
  const show = React.useCallback((message, type = 'info') => {
    clearTimeout(timer.current);
    if (type === 'success') haptic.success();
    else if (type === 'error') haptic.error();
    setToast({ message, type });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return { toast, showToast: show };
}

export function Toast({ toast }) {
  const { colors: COLORS } = useTheme();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  const color = { success: COLORS.green, error: COLORS.red, info: COLORS.accent }[toast.type] || COLORS.accent;
  const icon = { success: 'checkmark-circle', error: 'alert-circle', info: 'information-circle' }[toast.type] || 'information-circle';
  return (
    <View style={{
      position: 'absolute', top: insets.top + SPACING.sm, left: SPACING.lg, right: SPACING.lg, zIndex: 9999,
      backgroundColor: COLORS.elevated, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
      borderLeftWidth: 4, borderLeftColor: color,
      padding: SPACING.lg, flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
    }}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={{ flex: 1, fontSize: TYPE.body, color: COLORS.t1 }}>{toast.message}</Text>
    </View>
  );
}

// ═══ CONFIRM MODAL ═══
export function ConfirmModal({ visible, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }) {
  const { colors: COLORS } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: SPACING.xl }}>
        <View style={{
          width: '100%', maxWidth: 340, backgroundColor: COLORS.elevated,
          borderRadius: RADIUS.lg + 4, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl,
        }}>
          <Text style={{ fontSize: TYPE.title, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: SPACING.sm }}>{title}</Text>
          {!!message && <Text style={{ fontSize: TYPE.body, color: COLORS.t2, lineHeight: 20, marginBottom: SPACING.xl }}>{message}</Text>}
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => ({
                flex: 1, height: 48, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
                alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontSize: TYPE.body, color: COLORS.t2 }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => { danger ? haptic.warning() : haptic.medium(); onConfirm?.(); }}
              style={({ pressed }) => ({
                flex: 1, height: 48, borderRadius: RADIUS.md,
                backgroundColor: danger ? COLORS.red + '20' : COLORS.accent,
                borderWidth: danger ? 1 : 0, borderColor: COLORS.red + '50',
                alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: TYPE.body, fontWeight: FONT.bold, color: danger ? COLORS.red : '#16181D' }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ═══ VIDEO PLAYER ═══
// Plays a lesson video from any pasted host — YouTube, Vimeo, Google Drive,
// Dropbox, or a direct file link — inline, in-app.
function extractYouTubeId(url) {
  if (!url) return null;
  const ps = [/youtube\.com\/watch\?v=([^&\n?#]+)/, /youtube\.com\/embed\/([^?#]+)/, /youtu\.be\/([^?#]+)/, /youtube\.com\/shorts\/([^?#/]+)/];
  for (const p of ps) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

// Native in-app playback via WebView; loaded lazily so web builds skip it
let RNWebView = null;
if (Platform.OS !== 'web') {
  try { RNWebView = require('react-native-webview').WebView; } catch (_) {}
}

// YouTube uses the dedicated iframe-player library on native — raw WebView embeds
// get the origin/referrer wrong and hit YouTube "Error 150/152/153". Native-only.
let YoutubePlayer = null;
if (Platform.OS !== 'web') {
  try { YoutubePlayer = require('react-native-youtube-iframe').default; } catch (_) {}
}

// A direct video file (mp4/webm/m3u8/etc.) rather than a page to embed
const isDirectVideoFile = (url) => /\.(mp4|m4v|webm|ogg|ogv|mov|m3u8|mpd)(\?|#|$)/i.test(url);

// Normalize any pasted link into something a player can actually load. Raw share
// links (Drive "/view", Dropbox "?dl=0", a vimeo.com page) don't play as-is, so map
// each known host to its embeddable/raw form. Returns one of:
//   { embed, baseUrl } — an iframe player page (paired with a same-host baseUrl)
//   { file }           — a direct video file for an HTML5 <video>
//   { uri }            — load the URL directly (other embed-friendly pages)
function resolveVideoSource(url) {
  const u = (url || '').trim();
  if (!u) return { uri: '' };

  // YouTube → privacy-domain embed, loaded as a direct navigation (see the native
  // branch for the Error 150/152/153 referrer rationale)
  const yt = extractYouTubeId(u);
  if (yt) return {
    youtubeId: yt,
    embed: `https://www.youtube-nocookie.com/embed/${yt}?playsinline=1&rel=0&modestbranding=1&fs=1`,
    baseUrl: 'https://www.youtube.com',
  };

  // Vimeo → player embed. Handles vimeo.com/ID and private vimeo.com/ID/HASH
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/);
  if (vimeo) return {
    embed: `https://player.vimeo.com/video/${vimeo[1]}${vimeo[2] ? `?h=${vimeo[2]}` : ''}`,
    baseUrl: 'https://vimeo.com',
  };

  // Google Drive → /preview iframe (Drive's own player; the share "/view" won't play)
  const drive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
  if (drive) return {
    embed: `https://drive.google.com/file/d/${drive[1]}/preview`,
    baseUrl: 'https://drive.google.com',
  };

  // Dropbox share link → force the raw file, then play it as a direct video
  if (/dropbox\.com\//.test(u)) {
    const [path, query = ''] = u.split('?');
    const params = query.split('&').filter(p => p && !/^(dl|raw)=/.test(p));
    params.push('raw=1');
    return { file: `${path}?${params.join('&')}` };
  }

  // A direct video file on any host
  if (isDirectVideoFile(u)) return { file: u };

  // Unknown host — load it directly (covers Loom, OneDrive embeds, custom players…)
  return { uri: u };
}

// Direct video files get a minimal player page with native controls
const directVideoHtml = (url) => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>html,body{margin:0;background:#000;height:100%}video{width:100%;height:100%;object-fit:contain}</style>
</head><body><video src="${url}" controls playsinline autoplay></video></body></html>`;

export function VideoPlayer({ url, title }) {
  const { colors: COLORS } = useTheme();
  const [boxW, setBoxW] = useState(0); // measured player width → drives 16:9 height
  const vpS = useMemo(() => StyleSheet.create({
    webWrap: { width: '100%', aspectRatio: 16 / 9, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#000', marginBottom: SPACING.lg },
    ytWrap: { width: '100%', aspectRatio: 16 / 9, borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#000', marginBottom: SPACING.lg, alignItems: 'center', justifyContent: 'center' },
    card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.lg },
    thumb: { width: 72, height: 56, borderRadius: RADIUS.sm, backgroundColor: '#FF000015', alignItems: 'center', justifyContent: 'center' },
    playBtn: { position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: RADIUS.sm - 2, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: TYPE.body, fontWeight: FONT.bold, color: COLORS.t1, lineHeight: 18, marginBottom: SPACING.xs },
    sub: { fontSize: TYPE.micro, color: COLORS.t2 },
  }), [COLORS]);

  if (!url) return null;
  const v = resolveVideoSource(url);

  // Web: the browser gives iframes a real origin, so embeds just work
  if (Platform.OS === 'web') {
    return (
      <View style={vpS.webWrap}>
        {v.file
          ? React.createElement('video', {
              src: v.file, controls: true, playsInline: true,
              style: { width: '100%', height: '100%', background: '#000' },
            })
          : React.createElement('iframe', {
              src: v.embed || v.uri,
              style: { width: '100%', height: '100%', border: 'none' },
              allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen',
              allowFullScreen: true,
            })}
      </View>
    );
  }

  // Native YouTube → dedicated iframe-player library (gets the WebView origin/
  // referrer right; raw embeds hit YouTube Error 150/152/153). Falls through to
  // the WebView below if the library somehow isn't available.
  if (v.youtubeId && YoutubePlayer) {
    return (
      <View style={vpS.ytWrap} onLayout={e => setBoxW(e.nativeEvent.layout.width)}>
        {boxW > 0 && (
          <YoutubePlayer
            width={boxW}
            height={Math.round((boxW * 9) / 16)}
            videoId={v.youtubeId}
            initialPlayerParams={{ rel: false, modestbranding: true }}
            webViewProps={{ allowsInlineMediaPlayback: true, mediaPlaybackRequiresUserAction: false }}
          />
        )}
      </View>
    );
  }

  // Native: play inside the app via WebView
  if (RNWebView) {
    // Load embeds as a real top-level navigation, NOT injected HTML. Android's
    // loadDataWithBaseURL doesn't send a proper Referer, which YouTube rejects with
    // "Error 150/152/153"; a direct navigation gives the page a genuine origin so
    // the player loads instead of showing a "Watch on YouTube" link.
    // embed → load player URL directly · file → HTML5 <video> page · uri → as-is
    const source = v.embed
      ? { uri: v.embed }
      : v.file
        ? { html: directVideoHtml(v.file), baseUrl: 'https://localhost' }
        : { uri: v.uri };
    return (
      <View style={vpS.webWrap}>
        <RNWebView
          source={source}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          style={{ backgroundColor: '#000' }}
        />
      </View>
    );
  }

  // Fallback if WebView is unavailable: open externally
  return (
    <TouchableOpacity onPress={() => Linking.openURL(url)} style={vpS.card} activeOpacity={0.8}>
      <View style={vpS.thumb}>
        <Ionicons name="logo-youtube" size={36} color="#FF0000" />
        <View style={vpS.playBtn}>
          <Ionicons name="play" size={16} color="#16181D" />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {title ? <Text style={vpS.title} numberOfLines={2}>{title}</Text> : null}
        <Text style={vpS.sub}>Tap to play video</Text>
      </View>
    </TouchableOpacity>
  );
}
