import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../utils/theme';
import { Avatar, Card, Button, Badge, StatusDot, Toast, useToast, ConfirmModal } from '../components/UI';
import { apiGetUser, apiChangeRole, apiChangeStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

const roleColor = (role) => ({
  STUDENT: COLORS.blue, LECTURER: COLORS.teal, FACULTY: COLORS.orange, SUPER_ADMIN: COLORS.pink,
}[role] || COLORS.blue);

const roleLabel = (role) => ({
  STUDENT: 'Student', LECTURER: 'Lecturer', FACULTY: 'Admin', SUPER_ADMIN: 'Super Admin',
}[role] || role);

const statusColor = (status) => ({
  ACTIVE: COLORS.green, PENDING: COLORS.orange, SUSPENDED: COLORS.red, DEACTIVATED: COLORS.t3,
}[status] || COLORS.t3);

export default function UserDetailScreen({ route, navigation }) {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
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

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
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

const styles = StyleSheet.create({
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
  roleSheet: { backgroundColor: '#1C1C1C', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 34 },
  roleSheetTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 4 },
  roleSheetSub: { fontSize: 12, color: COLORS.t3, marginBottom: 16 },
  roleOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  roleColor: { width: 10, height: 10, borderRadius: 5 },
  roleOptionText: { flex: 1, fontSize: 14, color: COLORS.t1 },
});
