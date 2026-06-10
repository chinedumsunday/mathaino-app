import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { apiListNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// Map backend notification titles/types to accent colors
const accentForNotif = (n, COLORS) => {
  if (n.type === 'announcement') return COLORS.accent;
  if (n.type === 'live_started' || n.type === 'live_reminder') return COLORS.red;
  const t = (n.title || '').toLowerCase();
  if (t.includes('approved') || t.includes('complete') || t.includes('enrolled')) return COLORS.green;
  if (t.includes('rejected') || t.includes('error')) return COLORS.pink;
  if (t.includes('xp') || t.includes('streak') || t.includes('reward')) return COLORS.accent;
  if (t.includes('course') || t.includes('module')) return COLORS.teal;
  return COLORS.blue;
};

// Format ISO date to a short relative time string
const relativeTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

// Normalize a backend notification to the shape this screen expects
const normalize = (n, COLORS) => ({
  id: n.id,
  title: n.title,
  desc: n.message || n.desc || '',
  time: relativeTime(n.createdAt),
  unread: !n.isRead,
  accent: accentForNotif(n, COLORS),
});


export default function NotificationsScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await apiListNotifications({ limit: 50 });
      const items = (res.data?.notifications || []).map(n => normalize(n, COLORS));
      setNotifs(items);
    } catch (e) {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    try { await apiMarkNotificationRead(id); } catch (_) {}
  };

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false })));
    try { await apiMarkAllNotificationsRead(); } catch (_) {}
  };

  const unreadCount = notifs.filter(n => n.unread).length;
  const newNotifs = notifs.filter(n => n.unread);
  const oldNotifs = notifs.filter(n => !n.unread);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    markAllText: { fontSize: 12, color: COLORS.silver },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    scrollContent: { paddingHorizontal: SPACING.xl },
    sectionLabel: { fontSize: 10, fontWeight: FONT.bold, color: COLORS.t3, letterSpacing: 1.5, marginBottom: 10 },
    notifCard: {
      backgroundColor: COLORS.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 8,
      overflow: 'hidden',
      flexDirection: 'row',
    },
    notifUnread: { backgroundColor: COLORS.elevated },
    accentBar: { width: 3 },
    notifContent: { flex: 1, flexDirection: 'row', padding: 14, gap: 12 },
    notifTitle: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 3 },
    notifDesc: { fontSize: 11, color: COLORS.t2, lineHeight: 16 },
    notifRight: { alignItems: 'flex-end', gap: 6 },
    notifTime: { fontSize: 10, color: COLORS.t3 },
    unreadDot: { width: 6, height: 6, borderRadius: 3 },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 16 },
    emptyText: { fontSize: 13, color: COLORS.t3, marginTop: 4 },
    retryBtn: { marginTop: 14, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    retryText: { fontSize: 13, color: COLORS.silver },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={44} color={COLORS.t3} />
          <Text style={styles.emptyTitle}>Could not load notifications</Text>
          <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.accent}
              colors={[COLORS.accent]}
            />
          }
        >
          {/* Unread */}
          {newNotifs.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>NEW ({newNotifs.length})</Text>
              {newNotifs.map(n => (
                <TouchableOpacity key={n.id} onPress={() => markRead(n.id)} style={[styles.notifCard, styles.notifUnread]}>
                  <View style={[styles.accentBar, { backgroundColor: n.accent }]} />
                  <View style={styles.notifContent}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifDesc}>{n.desc}</Text>
                    </View>
                    <View style={styles.notifRight}>
                      <Text style={styles.notifTime}>{n.time}</Text>
                      <View style={[styles.unreadDot, { backgroundColor: n.accent }]} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Read */}
          {oldNotifs.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, newNotifs.length > 0 && { marginTop: 20 }]}>EARLIER</Text>
              {oldNotifs.map(n => (
                <View key={n.id} style={styles.notifCard}>
                  <View style={[styles.accentBar, { backgroundColor: n.accent }]} />
                  <View style={styles.notifContent}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{n.title}</Text>
                      <Text style={styles.notifDesc}>{n.desc}</Text>
                    </View>
                    <Text style={styles.notifTime}>{n.time}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {notifs.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.t3} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>You're all caught up!</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

