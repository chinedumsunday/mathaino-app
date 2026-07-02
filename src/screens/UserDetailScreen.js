import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { Avatar, Card, Button, Badge, StatusDot, Toast, useToast, ConfirmModal } from '../components/UI';
import {
  apiGetUser, apiChangeRole, apiChangeStatus,
  apiUserEnrollments, apiRegisterStudent, apiUnregisterStudent, apiListCourses,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const roleLabel = (role) => ({
  STUDENT: 'Student', LECTURER: 'Lecturer', FACULTY: 'Admin', SUPER_ADMIN: 'Super Admin',
}[role] || role);

export default function UserDetailScreen({ route, navigation }) {
  const { colors: COLORS } = useTheme();
  const { isAdmin } = useAuth();
  const userId   = route.params?.userId;
  const preloaded = route.params?.user;

  const [user, setUser]     = useState(preloaded || null);
  const [loading, setLoading] = useState(!preloaded && !!userId);
  const [acting, setActing]   = useState(false);
  const { toast, showToast }  = useToast();

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm, danger }
  // Role picker modal
  const [roleModal, setRoleModal] = useState(false);

  // Enrollment management (students only)
  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [coursePicker, setCoursePicker] = useState(false);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const roleColor = (role) => ({
    STUDENT: COLORS.blue, LECTURER: COLORS.teal, FACULTY: COLORS.orange, SUPER_ADMIN: COLORS.pink,
  }[role] || COLORS.blue);

  const statusColor = (status) => ({
    ACTIVE: COLORS.green, PENDING: COLORS.orange, SUSPENDED: COLORS.red, DEACTIVATED: COLORS.t3,
  }[status] || COLORS.t3);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiGetUser(userId);
      setUser(res.data.user);
    } catch (e) {
      showToast(e.message || 'Could not load user', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Load the student's course registrations
  const loadEnrollments = useCallback(async () => {
    if (!userId) return;
    setEnrollLoading(true);
    try {
      const res = await apiUserEnrollments(userId);
      setEnrollments((res.data?.enrollments || []).filter(e => e.status !== 'DROPPED'));
    } catch (_) {}
    finally { setEnrollLoading(false); }
  }, [userId]);

  useEffect(() => {
    if (user?.role === 'STUDENT') loadEnrollments();
  }, [user?.role, loadEnrollments]);

  const openCoursePicker = async () => {
    setCoursePicker(true);
    setCoursesLoading(true);
    try {
      const res = await apiListCourses({ published: 'true', limit: 100 });
      const enrolledCourseIds = new Set(enrollments.map(e => e.course?.id));
      setCourses((res.data?.courses || []).filter(c => !enrolledCourseIds.has(c.id)));
    } catch (e) {
      showToast(e.message || 'Could not load courses', 'error');
      setCoursePicker(false);
    } finally {
      setCoursesLoading(false);
    }
  };

  const registerIntoCourse = async (course) => {
    setCoursePicker(false);
    setActing(true);
    try {
      await apiRegisterStudent(course.id, user.id);
      showToast(`Registered for ${course.title}`, 'success');
      loadEnrollments();
    } catch (e) {
      showToast(e.message || 'Could not register the student', 'error');
    } finally {
      setActing(false);
    }
  };

  const removeFromCourse = (en) => {
    setConfirmModal({
      title: 'Unregister from course',
      message: `Remove ${user.firstName} from ${en.course?.title}? They will be notified.`,
      danger: true,
      confirmLabel: 'Unregister',
      onConfirm: async () => {
        setConfirmModal(null);
        setActing(true);
        try {
          await apiUnregisterStudent(en.course.id, user.id);
          setEnrollments(prev => prev.filter(e => e.id !== en.id));
          showToast('Student unregistered from the course', 'success');
        } catch (e) {
          showToast(e.message || 'Could not unregister', 'error');
        } finally {
          setActing(false);
        }
      },
    });
  };

  const doChangeStatus = (newStatus, label) => {
    if (!user) return;
    setConfirmModal({
      title: `${label} user`,
      message: `${label} ${user.firstName} ${user.lastName}?`,
      danger: newStatus === 'SUSPENDED',
      confirmLabel: label,
      onConfirm: async () => {
        setConfirmModal(null);
        setActing(true);
        try {
          const res = await apiChangeStatus(user.id, newStatus);
          setUser(prev => ({ ...prev, status: newStatus }));
          showToast(res.message || `Status updated to ${newStatus}`, 'success');
        } catch (e) {
          showToast(e.message || 'Could not update status', 'error');
        } finally {
          setActing(false);
        }
      },
    });
  };

  const doChangeRole = () => {
    if (!user) return;
    setRoleModal(true);
  };

  const applyRole = async (role) => {
    setRoleModal(false);
    setActing(true);
    try {
      await apiChangeRole(user.id, role);
      setUser(prev => ({ ...prev, role }));
      showToast(`Role changed to ${roleLabel(role)}`, 'success');
    } catch (e) {
      showToast(e.message || 'Could not change role', 'error');
    } finally {
      setActing(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    scrollContent: { paddingHorizontal: SPACING.xl },
    profileCard: { alignItems: 'center', paddingVertical: 24, marginBottom: 16 },
    userName: { fontSize: 20, fontWeight: FONT.extrabold, color: COLORS.t1, marginTop: 12 },
    userEmail: { fontSize: 12, color: COLORS.t3, marginTop: 2 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: FONT.semibold, textTransform: 'capitalize' },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
    infoRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    infoLabel: { fontSize: 12, color: COLORS.t3, flex: 1 },
    infoValue: { fontSize: 12, color: COLORS.silver, fontWeight: FONT.semibold },
    actionsTitle: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 20, marginBottom: 12 },
    roleOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    roleSheet: { backgroundColor: COLORS.elevated, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 34 },
    roleSheetTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 4 },
    roleSheetSub: { fontSize: 12, color: COLORS.t3, marginBottom: 16 },
    roleOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    roleColor: { width: 10, height: 10, borderRadius: 5 },
    roleOptionText: { flex: 1, fontSize: 14, color: COLORS.t1 },
    // Enrollment management
    enrollRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
    enrollTitle: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    enrollMeta: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
    removeBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: COLORS.red + '40', alignItems: 'center', justifyContent: 'center' },
    pickerSheet: { backgroundColor: COLORS.elevated, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 34, maxHeight: '70%' },
    pickerTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 12 },
    pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    pickerCourse: { flex: 1, fontSize: 13, color: COLORS.t1 },
    pickerCode: { fontSize: 11, color: COLORS.t3 },
  }), [COLORS]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
          </TouchableOpacity>
          <Text style={styles.title}>User Detail</Text>
        </View>
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!user) return null;

  const profile = user.studentProfile || user.lecturerProfile || user.facultyProfile || {};

  const infoRows = [
    { label: 'Email', value: user.email, icon: 'mail-outline' },
    { label: 'Department', value: profile.department || '—', icon: 'school-outline' },
    { label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: 'calendar-outline' },
    { label: 'Last Login', value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never', icon: 'log-in-outline' },
    { label: 'Status', value: user.status, icon: 'shield-outline' },
  ];

  if (user.role === 'STUDENT' && profile.matricNumber) {
    infoRows.splice(1, 0, { label: 'Matric', value: profile.matricNumber, icon: 'card-outline' });
  }
  if (user.role === 'LECTURER' && profile.specialization) {
    infoRows.splice(1, 0, { label: 'Specialization', value: profile.specialization, icon: 'flask-outline' });
  }

  const uColor = roleColor(user.role);
  const availableRoles = ['STUDENT', 'LECTURER', 'FACULTY'].filter(r => r !== user.role);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          visible
          title={confirmModal.title}
          message={confirmModal.message}
          danger={confirmModal.danger}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Role picker modal */}
      <Modal visible={roleModal} transparent animationType="fade" onRequestClose={() => setRoleModal(false)}>
        <TouchableOpacity style={styles.roleOverlay} activeOpacity={1} onPress={() => setRoleModal(false)}>
          <View style={styles.roleSheet}>
            <Text style={styles.roleSheetTitle}>Change Role</Text>
            <Text style={styles.roleSheetSub}>Current: {roleLabel(user.role)}</Text>
            {availableRoles.map(r => (
              <TouchableOpacity key={r} style={styles.roleOption} onPress={() => applyRole(r)}>
                <View style={[styles.roleColor, { backgroundColor: roleColor(r) }]} />
                <Text style={styles.roleOptionText}>{roleLabel(r)}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.t3} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.roleOption, { borderBottomWidth: 0 }]} onPress={() => setRoleModal(false)}>
              <Text style={[styles.roleOptionText, { color: COLORS.t3 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Course picker for direct registration */}
      <Modal visible={coursePicker} transparent animationType="slide" onRequestClose={() => setCoursePicker(false)}>
        <TouchableOpacity style={styles.roleOverlay} activeOpacity={1} onPress={() => setCoursePicker(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Register {user.firstName} for…</Text>
            {coursesLoading ? (
              <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 24 }} />
            ) : courses.length === 0 ? (
              <Text style={{ fontSize: 12, color: COLORS.t3, textAlign: 'center', paddingVertical: 20 }}>
                No other published courses available.
              </Text>
            ) : (
              <ScrollView>
                {courses.map(c => (
                  <TouchableOpacity key={c.id} style={styles.pickerRow} onPress={() => registerIntoCourse(c)}>
                    <Ionicons name="book-outline" size={16} color={COLORS.accent} />
                    <Text style={styles.pickerCourse} numberOfLines={1}>{c.title}</Text>
                    <Text style={styles.pickerCode}>{c.code}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
        <Text style={styles.title}>User Detail</Text>
        {acting && <ActivityIndicator color={COLORS.accent} size="small" />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <Avatar size={72} name={`${user.firstName} ${user.lastName}`} color={uColor} url={user.avatarUrl} />
          <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.badgeRow}>
            <Badge label={roleLabel(user.role)} color={uColor} />
            <View style={[styles.statusPill, { backgroundColor: statusColor(user.status) + '20' }]}>
              <StatusDot status={user.status?.toLowerCase()} />
              <Text style={[styles.statusText, { color: statusColor(user.status) }]}>
                {user.status?.toLowerCase()}
              </Text>
            </View>
          </View>
        </View>

        <Card style={{ padding: 0 }}>
          {infoRows.map((row, i) => (
            <View key={i} style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}>
              <Ionicons name={row.icon} size={16} color={COLORS.t3} />
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={[styles.infoValue, row.label === 'Status' && { color: statusColor(user.status), textTransform: 'capitalize' }]}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card>

        {/* Course registrations — admin/faculty manage who is registered where */}
        {user.role === 'STUDENT' && (
          <>
            <Text style={styles.actionsTitle}>Course Registrations</Text>
            <Card style={{ padding: 0 }}>
              {enrollLoading ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
              ) : enrollments.length === 0 ? (
                <Text style={{ fontSize: 12, color: COLORS.t3, textAlign: 'center', paddingVertical: 18 }}>
                  Not registered in any course yet.
                </Text>
              ) : (
                enrollments.map((en, i) => (
                  <View key={en.id} style={[styles.enrollRow, i < enrollments.length - 1 && styles.infoRowBorder]}>
                    <Ionicons name="book-outline" size={16} color={COLORS.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.enrollTitle} numberOfLines={1}>{en.course?.title}</Text>
                      <Text style={styles.enrollMeta}>
                        {en.course?.code} • {Math.round(en.progress || 0)}% complete
                      </Text>
                    </View>
                    <Badge
                      label={en.status === 'PENDING' ? 'Pending' : en.status === 'COMPLETED' ? 'Completed' : 'Enrolled'}
                      color={en.status === 'PENDING' ? COLORS.orange : en.status === 'COMPLETED' ? COLORS.teal : COLORS.green}
                    />
                    <TouchableOpacity onPress={() => removeFromCourse(en)} style={styles.removeBtn}>
                      <Ionicons name="person-remove-outline" size={14} color={COLORS.red} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </Card>
            <View style={{ marginTop: 10 }}>
              <Button variant="secondary" onPress={openCoursePicker} disabled={acting}>
                <Text style={{ color: COLORS.teal }}>+ Register for a Course</Text>
              </Button>
            </View>
          </>
        )}

        <Text style={styles.actionsTitle}>Actions</Text>

        {user.status === 'PENDING' && (
          <View style={{ marginBottom: 10 }}>
            <Button onPress={() => doChangeStatus('ACTIVE', 'Approve')} disabled={acting}>
              Approve Account
            </Button>
          </View>
        )}

        {user.status === 'ACTIVE' && (
          <View style={{ marginBottom: 10 }}>
            <Button variant="secondary" onPress={() => doChangeStatus('SUSPENDED', 'Suspend')} disabled={acting}>
              <Text style={{ color: COLORS.orange }}>Suspend User</Text>
            </Button>
          </View>
        )}

        {user.status === 'SUSPENDED' && (
          <View style={{ marginBottom: 10 }}>
            <Button onPress={() => doChangeStatus('ACTIVE', 'Reactivate')} disabled={acting}>
              Reactivate User
            </Button>
          </View>
        )}

        {isAdmin && (
          <View style={{ marginBottom: 10 }}>
            <Button variant="secondary" onPress={doChangeRole} disabled={acting}>
              Change Role
            </Button>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
