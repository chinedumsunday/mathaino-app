import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { FEATURES } from '../config/features';
import { useTheme } from '../context/ThemeContext';
import { Card, Avatar, Badge, StatusDot } from '../components/UI';
import { apiGetStats, apiListUsers } from '../services/api';

export default function AdminDashboardScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGetStats();
      setStats(res.data);
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const roleColor = (role) => ({
    STUDENT: COLORS.blue, LECTURER: COLORS.teal, FACULTY: COLORS.orange, SUPER_ADMIN: COLORS.pink,
  }[role] || COLORS.blue);

  const roleLabel = (role) => ({
    STUDENT: 'Student', LECTURER: 'Lecturer', FACULTY: 'Admin', SUPER_ADMIN: 'Super Admin',
  }[role] || role);

  const quickActions = [
    FEATURES.ANNOUNCEMENTS && { label: 'Send Announcement', desc: 'Notify all users', icon: 'megaphone-outline', go: () => navigation.navigate('Broadcast') },
    { label: 'Coursework Inbox', desc: 'Docs from lecturers', icon: 'file-tray-full-outline', go: () => navigation.navigate('CourseworkInbox') },
    { label: 'Enrollment Requests', desc: 'Pending approvals', icon: 'school-outline', go: () => navigation.navigate('PendingStudents') },
    { label: 'Manage Users', desc: 'Roles & permissions', icon: 'people-outline', go: () => navigation.navigate('UserManagement') },
    { label: 'Create Lecturer', desc: 'Add new lecturer', icon: 'person-add-outline', go: () => navigation.navigate('CreateLecturer') },
    { label: 'Register Student', desc: 'Add new student', icon: 'school-outline', go: () => navigation.navigate('CreateStudent') },
    { label: 'Course Builder', desc: 'Create content', icon: 'create-outline', go: () => navigation.navigate('CourseBuilder') },
    { label: 'Leaderboard', desc: 'Student rankings', icon: 'trophy-outline', go: () => navigation.navigate('Leaderboard') },
  ].filter(Boolean);

  const statCards = stats ? [
    { n: stats.totalUsers || 0, label: 'Users', color: COLORS.accent, icon: 'people' },
    { n: stats.byRole?.STUDENT || 0, label: 'Students', color: COLORS.blue, icon: 'person' },
    { n: stats.byRole?.LECTURER || 0, label: 'Lecturers', color: COLORS.teal, icon: 'school' },
    { n: stats.byStatus?.PENDING || 0, label: 'Pending', color: COLORS.orange, icon: 'time' },
  ] : [];

  const roleChartData = stats ? [
    { label: 'Students', value: stats.byRole?.STUDENT || 0, color: COLORS.blue },
    { label: 'Lecturers', value: stats.byRole?.LECTURER || 0, color: COLORS.teal },
    { label: 'Admins', value: stats.byRole?.FACULTY || 0, color: COLORS.orange },
    { label: 'Super Admins', value: stats.byRole?.SUPER_ADMIN || 0, color: COLORS.pink },
  ] : [];

  const maxBarValue = Math.max(...roleChartData.map(d => d.value), 1);
  const pendingCount = stats?.byStatus?.PENDING || 0;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    scrollContent: { paddingHorizontal: SPACING.xl },
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    statCard: { flex: 1, minWidth: '44%', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 16, alignItems: 'center' },
    statNum: { fontSize: 24, fontWeight: FONT.extrabold },
    statLabel: { fontSize: 10, color: COLORS.t3, fontWeight: FONT.semibold, marginTop: 2 },
    pendingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.orange + '10', borderWidth: 1, borderColor: COLORS.orange + '30', borderRadius: RADIUS.lg, padding: 14, marginBottom: 16 },
    pendingTitle: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.orange },
    pendingDesc: { fontSize: 11, color: COLORS.t3, marginTop: 1 },
    cardTitle: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 14 },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    barLabel: { fontSize: 10, color: COLORS.t3, width: 58, fontWeight: FONT.medium },
    barTrack: { flex: 1, height: 10, backgroundColor: COLORS.elevated, borderRadius: 5, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 5, minWidth: 4 },
    barValue: { fontSize: 11, color: COLORS.silver, fontWeight: FONT.semibold, minWidth: 28, textAlign: 'right' },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 },
    viewAll: { fontSize: 12, color: COLORS.silver },
    userRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, gap: 8 },
    userRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    userName: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    userEmail: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
    actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    actionCard: { width: '48%', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 16 },
    actionLabel: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 2 },
    actionDesc: { fontSize: 10, color: COLORS.t3 },
    errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    errorText: { fontSize: 14, color: COLORS.t3, marginVertical: 12, textAlign: 'center' },
    retryBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    retryText: { fontSize: 13, color: COLORS.silver },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.title}>Dashboard</Text>
        <Ionicons name="shield-checkmark" size={22} color={COLORS.accent} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.t3} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
        >
          {/* Stat Cards */}
          <View style={styles.statGrid}>
            {statCards.map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Ionicons name={s.icon} size={18} color={s.color} style={{ marginBottom: 6 }} />
                <Text style={[styles.statNum, { color: s.color }]}>{s.n}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Pending Alert */}
          {pendingCount > 0 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('UserManagement', { filter: 'Pending' })}
              style={styles.pendingCard}
            >
              <Ionicons name="alert-circle" size={20} color={COLORS.orange} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.pendingTitle}>
                  {pendingCount} pending approval{pendingCount > 1 ? 's' : ''}
                </Text>
                <Text style={styles.pendingDesc}>New accounts waiting for review</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.t3} />
            </TouchableOpacity>
          )}

          {/* User Role Chart */}
          <Card>
            <Text style={styles.cardTitle}>Users by role</Text>
            {roleChartData.map((bar, i) => (
              <View key={i} style={styles.barRow}>
                <Text style={styles.barLabel}>{bar.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(bar.value / maxBarValue) * 100}%`, backgroundColor: bar.color }]} />
                </View>
                <Text style={styles.barValue}>{bar.value}</Text>
              </View>
            ))}
          </Card>

          {/* Recent Registrations */}
          {stats?.recentUsers?.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.cardTitle}>Recent registrations</Text>
                <TouchableOpacity onPress={() => navigation.navigate('UserManagement')}>
                  <Text style={styles.viewAll}>View All →</Text>
                </TouchableOpacity>
              </View>
              <Card style={{ padding: 0 }}>
                {stats.recentUsers.map((u, i, arr) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => navigation.navigate('UserDetail', { userId: u.id })}
                    style={[styles.userRow, i < arr.length - 1 && styles.userRowBorder]}
                  >
                    <Avatar size={36} name={`${u.firstName} ${u.lastName}`} color={roleColor(u.role)} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.userName}>{u.firstName} {u.lastName}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                    </View>
                    <Badge label={roleLabel(u.role)} color={roleColor(u.role)} />
                  </TouchableOpacity>
                ))}
              </Card>
            </>
          )}

          {/* Quick Actions */}
          <Text style={[styles.cardTitle, { marginTop: 20, marginBottom: 10 }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            {quickActions.map((a, i) => (
              <TouchableOpacity key={i} onPress={a.go} style={styles.actionCard}>
                <Ionicons name={a.icon} size={22} color={COLORS.accent} style={{ marginBottom: 8 }} />
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Text style={styles.actionDesc}>{a.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
