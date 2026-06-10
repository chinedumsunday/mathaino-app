import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, AppState, Platform, ActivityIndicator, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, TYPE, SPACING, RADIUS } from '../utils/theme';
import { Button, ConfirmModal, ScreenHeader, Toast, useToast, haptic } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  apiJoinLiveSession, apiSessionHeartbeat, apiLeaveLiveSession, apiEndLiveSession,
} from '../services/api';

let WebView = null;
if (Platform.OS !== 'web') {
  try { WebView = require('react-native-webview').WebView; } catch (_) {}
}

const HEARTBEAT_MS = 10 * 1000;

// Jitsi: skip the "open in app" interstitial and the prejoin page
function buildMeetingUrl(link, displayName) {
  if (!link) return link;
  if (!link.includes('jit.si')) return link;
  const name = encodeURIComponent(`"${displayName}"`);
  return `${link}#config.disableDeepLinking=true&config.prejoinConfig.enabled=false&userInfo.displayName=${name}`;
}

export default function LiveClassroomScreen({ navigation, route }) {
  const { colors: COLORS } = useTheme();
  const { user } = useAuth();
  const sessionParam = route.params?.session;
  const sessionId = route.params?.sessionId || sessionParam?.id;

  const [session, setSession] = useState(sessionParam || null);
  const [joining, setJoining] = useState(true);
  const [error, setError] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const heartbeatRef = useRef(null);
  const joinedRef = useRef(false);
  const { toast, showToast } = useToast();

  const isCreator = session && session.creatorId === user?.id;
  const focusMode = !!session?.focusMode;

  const sendHeartbeat = useCallback((state) => {
    if (!joinedRef.current) return;
    apiSessionHeartbeat(sessionId, state).catch(() => {});
  }, [sessionId]);

  // Join on mount, leave on unmount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiJoinLiveSession(sessionId);
        if (!mounted) return;
        joinedRef.current = true;
        setSession(res.data.session);
        setError(null);
      } catch (e) {
        if (mounted) setError(e.message || 'Could not join this class.');
      } finally {
        if (mounted) setJoining(false);
      }
    })();

    return () => {
      mounted = false;
      clearInterval(heartbeatRef.current);
      if (joinedRef.current) {
        joinedRef.current = false;
        apiLeaveLiveSession(sessionId).catch(() => {});
      }
    };
  }, [sessionId]);

  // Presence: heartbeat every 10s + report app-switches the moment they happen
  useEffect(() => {
    if (joining || error) return;

    heartbeatRef.current = setInterval(() => {
      sendHeartbeat(appStateRef.current === 'active' ? 'ACTIVE' : 'BACKGROUND');
    }, HEARTBEAT_MS);

    const sub = AppState.addEventListener('change', (next) => {
      const wasAway = appStateRef.current !== 'active';
      appStateRef.current = next;
      sendHeartbeat(next === 'active' ? 'ACTIVE' : 'BACKGROUND');
      // Focus-mode pop-up: tell returning students their absence was recorded
      if (focusMode && !isCreator && next === 'active' && wasAway) {
        haptic.warning();
        showToast('Welcome back — the time you spent outside the app was marked on your attendance.', 'error');
      }
    });

    return () => {
      clearInterval(heartbeatRef.current);
      sub.remove();
    };
  }, [joining, error, sendHeartbeat, focusMode, isCreator, showToast]);

  const leave = useCallback(() => {
    clearInterval(heartbeatRef.current);
    if (joinedRef.current) {
      joinedRef.current = false;
      apiLeaveLiveSession(sessionId).catch(() => {});
    }
    navigation.goBack();
  }, [navigation, sessionId]);

  const requestLeave = useCallback(() => {
    if (focusMode && !isCreator) setConfirmLeave(true);
    else leave();
    return true;
  }, [focusMode, isCreator, leave]);

  // Android hardware back goes through the same confirm flow
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', requestLeave);
    return () => sub.remove();
  }, [requestLeave]);

  const endClass = async () => {
    try {
      await apiEndLiveSession(sessionId);
      haptic.success();
    } catch (_) {}
    leave();
  };

  const meetingUrl = useMemo(
    () => buildMeetingUrl(session?.meetingLink, `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student'),
    [session?.meetingLink, user]
  );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red },
    liveText: { fontSize: TYPE.caption, fontWeight: FONT.bold, color: COLORS.red, letterSpacing: 1 },
    focusBanner: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
      backgroundColor: COLORS.accent + '14', borderWidth: 1, borderColor: COLORS.accent + '40',
      borderRadius: RADIUS.md, padding: SPACING.md,
    },
    focusText: { flex: 1, fontSize: TYPE.caption, color: COLORS.t2, lineHeight: 16 },
    webWrap: { flex: 1, marginHorizontal: SPACING.lg, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: COLORS.border },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xxl },
    centerTitle: { fontSize: TYPE.title, fontWeight: FONT.bold, color: COLORS.t1, marginTop: SPACING.lg, textAlign: 'center' },
    centerText: { fontSize: TYPE.body, color: COLORS.t2, marginTop: SPACING.sm, textAlign: 'center', lineHeight: 20 },
    footer: { padding: SPACING.lg, paddingBottom: SPACING.sm, gap: SPACING.sm },
  }), [COLORS]);

  const title = session?.title || 'Live Class';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Toast toast={toast} />
      <ScreenHeader
        title={title}
        onBack={requestLeave}
        right={
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        }
      />

      {focusMode && (
        <View style={styles.focusBanner}>
          <Ionicons name="eye" size={16} color={COLORS.accent} />
          <Text style={styles.focusText}>
            Focus mode is on — your attendance is being tracked. Switching apps or leaving will show on your lecturer's roster.
          </Text>
        </View>
      )}

      {joining ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} size="large" />
          <Text style={styles.centerText}>Joining class…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="videocam-off-outline" size={44} color={COLORS.t3} />
          <Text style={styles.centerTitle}>Could not join</Text>
          <Text style={styles.centerText}>{error}</Text>
          <View style={{ width: '100%', marginTop: SPACING.xl }}>
            <Button variant="secondary" onPress={() => navigation.goBack()}>Go Back</Button>
          </View>
        </View>
      ) : Platform.OS === 'web' ? (
        <View style={styles.webWrap}>
          {React.createElement('iframe', {
            src: meetingUrl,
            style: { width: '100%', height: '100%', border: 'none' },
            allow: 'camera; microphone; fullscreen; display-capture; autoplay',
          })}
        </View>
      ) : WebView ? (
        <View style={styles.webWrap}>
          <WebView
            source={{ uri: meetingUrl }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            mediaCapturePermissionGrantType="grant"
            startInLoadingState
            renderLoading={() => (
              <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }]}>
                <ActivityIndicator color={COLORS.accent} size="large" />
              </View>
            )}
          />
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.centerText}>WebView is unavailable on this device.</Text>
        </View>
      )}

      {!joining && !error && isCreator && (
        <View style={styles.footer}>
          <Button variant="secondary" icon="people" onPress={() => navigation.navigate('LiveAttendance', { sessionId })}>
            View Attendance
          </Button>
          <Button variant="danger" icon="stop-circle" onPress={endClass}>End Class for Everyone</Button>
        </View>
      )}

      <ConfirmModal
        visible={confirmLeave}
        title="Leave the class?"
        message="Focus mode is on. Leaving now will be marked on your attendance record."
        confirmLabel="Leave"
        danger
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => { setConfirmLeave(false); leave(); }}
      />
    </SafeAreaView>
  );
}
