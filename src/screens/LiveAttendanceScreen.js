import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, TYPE, SPACING, RADIUS, presenceColor, presenceLabel } from '../utils/theme';
import { Avatar, Button, ConfirmModal, ScreenHeader, EmptyState, Toast, useToast, haptic } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { apiSessionAttendance, apiEndLiveSession } from '../services/api';

const POLL_MS = 5 * 1000;

function fmtDuration(totalSec) {
  const m = Math.floor(totalSec / 60);
  if (m < 1) return '<1 min';
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function LiveAttendanceScreen({ navigation, route }) {
  const { colors: COLORS } = useTheme();
  const sessionId = route.params?.sessionId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const pollRef = useRef(null);
  const { toast, showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await apiSessionAttendance(sessionId);
      setData(res.data);
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not load attendance.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [load]);

  // Stop polling once the class has ended — the roster is final
  useEffect(() => {
    if (data?.session?.status && data.session.status !== 'LIVE') {
      clearInterval(pollRef.current);
    }
  }, [data?.session?.status]);

  const endClass = async () => {
    setConfirmEnd(false);
    setEnding(true);
    try {
      await apiEndLiveSession(sessionId);
      haptic.success();
      showToast('Class ended. Attendance is saved below.', 'success');
      await load();
    } catch (e) {
      showToast(e.message || 'Could not end the class.', 'error');
    } finally {
      setEnding(false);
    }
  };

  const session = data?.session;
  const counts = data?.counts;
  const isLive = session?.status === 'LIVE';

  const summary = counts ? [
    { key: 'ACTIVE', n: counts.active, label: 'In class' },
    { key: 'BACKGROUND', n: counts.background, label: 'Away' },
    { key: 'EXITED', n: counts.exited, label: 'Left' },
    { key: 'NOT_JOINED', n: counts.notJoined, label: 'No-show' },
  ] : [];

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: isLive ? COLORS.red : COLORS.t3 },
    statusText: { fontSize: TYPE.caption, fontWeight: FONT.bold, color: isLive ? COLORS.red : COLORS.t2, letterSpacing: 1 },
    courseText: { fontSize: TYPE.caption, color: COLORS.t3, flex: 1 },
    focusPill: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.accent + '14', borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs },
    focusPillText: { fontSize: TYPE.micro, fontWeight: FONT.bold, color: COLORS.accent },
    summaryRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
    summaryCard: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', gap: SPACING.xs },
    summaryNum: { fontSize: TYPE.header, fontWeight: FONT.bold },
    summaryLabel: { fontSize: TYPE.micro, color: COLORS.t3 },
    listContent: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
      borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    },
    name: { fontSize: TYPE.body, fontWeight: FONT.bold, color: COLORS.t1 },
    sub: { fontSize: TYPE.micro, color: COLORS.t3, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: SPACING.xs },
    presenceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2 },
    presenceText: { fontSize: TYPE.caption, fontWeight: FONT.bold },
    dot: { width: 10, height: 10, borderRadius: 5 },
    footer: {
      position: 'absolute', left: 0, right: 0, bottom: 0,
      padding: SPACING.lg, paddingBottom: SPACING.xl,
      backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  }), [COLORS, isLive]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />
      <ScreenHeader title="Attendance" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>
      ) : error && !data ? (
        <EmptyState icon="cloud-offline-outline" title="Could not load" message={error} />
      ) : (
        <>
          <View style={styles.statusRow}>
            <View style={styles.liveDot} />
            <Text style={styles.statusText}>{isLive ? 'LIVE' : session?.status === 'ENDED' ? 'ENDED' : session?.status}</Text>
            <Text style={styles.courseText} numberOfLines={1}>
              {session?.title} · {session?.course?.code}
            </Text>
            {session?.focusMode && (
              <View style={styles.focusPill}>
                <Ionicons name="eye" size={10} color={COLORS.accent} />
                <Text style={styles.focusPillText}>FOCUS</Text>
              </View>
            )}
          </View>

          <View style={styles.summaryRow}>
            {summary.map(s => (
              <View key={s.key} style={styles.summaryCard}>
                <Text style={[styles.summaryNum, { color: presenceColor(s.key, COLORS) }]}>{s.n}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <FlatList
            data={data?.roster || []}
            keyExtractor={r => r.user.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.accent} />}
            ListEmptyComponent={<EmptyState icon="people-outline" title="No students enrolled" message="Students appear here once they enroll in this course." />}
            renderItem={({ item }) => {
              const color = presenceColor(item.presence, COLORS);
              return (
                <View style={styles.row}>
                  <Avatar size={40} url={item.user.avatarUrl} name={`${item.user.firstName} ${item.user.lastName}`} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.user.firstName} {item.user.lastName}</Text>
                    <Text style={styles.sub}>
                      {item.joinedAt
                        ? `${fmtDuration(item.activeSeconds)} active · ${item.attendancePct}% attendance`
                        : 'Has not joined'}
                    </Text>
                  </View>
                  <View style={styles.right}>
                    <View style={styles.presenceRow}>
                      <View style={[styles.dot, { backgroundColor: color }]} />
                      <Text style={[styles.presenceText, { color }]}>{presenceLabel(item.presence)}</Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />

          {isLive && (
            <View style={styles.footer}>
              <Button variant="danger" icon="stop-circle" loading={ending} onPress={() => setConfirmEnd(true)}>
                End Class
              </Button>
            </View>
          )}
        </>
      )}

      <ConfirmModal
        visible={confirmEnd}
        title="End this class?"
        message="Students will be disconnected and the attendance record will be finalized."
        confirmLabel="End Class"
        danger
        onCancel={() => setConfirmEnd(false)}
        onConfirm={endClass}
      />
    </SafeAreaView>
  );
}
