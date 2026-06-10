import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Avatar, Card, Badge, Toast, useToast } from '../components/UI';
import { apiPendingEnrollments, apiApproveEnrollment } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function PendingStudentsScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);
  const { toast, showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await apiPendingEnrollments();
      setEnrollments(res.data.enrollments || []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not load pending enrollments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const handleAction = async (enrollment, action) => {
    const studentName = `${enrollment.user.firstName} ${enrollment.user.lastName}`;
    const courseTitle = enrollment.course.title;
    setActing(enrollment.id);
    try {
      await apiApproveEnrollment(enrollment.id, action);
      setEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
      showToast(
        action === 'approve'
          ? `${studentName} approved for ${courseTitle}`
          : `${studentName}'s request declined`,
        action === 'approve' ? 'success' : 'info'
      );
    } catch (e) {
      showToast(e.message || 'Action failed. Please try again.', 'error');
    } finally {
      setActing(null);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    countBadge: { backgroundColor: COLORS.orange, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    countText: { fontSize: 11, fontWeight: FONT.bold, color: '#000' },
    listContent: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
    card: { gap: 12 },
    cardTop: { flexDirection: 'row', alignItems: 'center' },
    studentName: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t1 },
    studentEmail: { fontSize: 11, color: COLORS.t3, marginTop: 1 },
    dateWrap: { backgroundColor: COLORS.elevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    dateText: { fontSize: 10, color: COLORS.t3 },
    courseRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    courseTitle: { flex: 1, fontSize: 12, color: COLORS.t2 },
    actionRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md },
    rejectBtn: { backgroundColor: COLORS.red + '15', borderWidth: 1, borderColor: COLORS.red + '30' },
    approveBtn: { backgroundColor: COLORS.accent },
    disabledBtn: { opacity: 0.5 },
    actionText: { fontSize: 13, fontWeight: FONT.semibold },
    errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    errorText: { fontSize: 14, color: COLORS.t3, marginVertical: 12, textAlign: 'center' },
    retryBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    retryText: { fontSize: 13, color: COLORS.silver },
    empty: { alignItems: 'center', paddingVertical: 80 },
    emptyTitle: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 16 },
    emptyText: { fontSize: 13, color: COLORS.t3, marginTop: 6, textAlign: 'center' },
  }), [COLORS]);

  const renderItem = ({ item }) => {
    const isActing = acting === item.id;
    const studentName = `${item.user.firstName} ${item.user.lastName}`;
    const enrolledDate = new Date(item.enrolledAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short',
    });

    return (
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <Avatar size={44} name={studentName} url={item.user.avatarUrl} color={COLORS.blue} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.studentEmail}>{item.user.email}</Text>
          </View>
          <View style={styles.dateWrap}>
            <Text style={styles.dateText}>{enrolledDate}</Text>
          </View>
        </View>

        <View style={styles.courseRow}>
          <Ionicons name="book-outline" size={14} color={COLORS.accent} />
          <Text style={styles.courseTitle} numberOfLines={1}>
            {item.course.title}
          </Text>
          <Badge label={item.course.code} color={COLORS.accent} />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn, isActing && styles.disabledBtn]}
            onPress={() => !isActing && handleAction(item, 'reject')}
          >
            <Ionicons name="close" size={16} color={COLORS.red} />
            <Text style={[styles.actionText, { color: COLORS.red }]}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn, isActing && styles.disabledBtn]}
            onPress={() => !isActing && handleAction(item, 'approve')}
          >
            {isActing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#000" />
                <Text style={[styles.actionText, { color: '#000' }]}>Approve</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
        <Text style={styles.title}>Pending Approvals</Text>
        {enrollments.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{enrollments.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.t3} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={enrollments}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color={COLORS.teal} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>No students waiting for approval right now.</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

