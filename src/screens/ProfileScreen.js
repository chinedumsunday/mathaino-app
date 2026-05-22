import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Avatar, Button, Card } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ROLE_LABELS = {
  STUDENT: 'Student',
  LECTURER: 'Lecturer',
  FACULTY: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

export default function ProfileScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const { user, logout, canManageUsers, canCreateCourses, isLecturer } = useAuth();

  // All hooks MUST come before any early return
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [logoutVisible, setLogoutVisible] = React.useState(false);

  const ROLE_COLORS = useMemo(() => ({
    STUDENT: COLORS.blue,
    LECTURER: COLORS.teal,
    FACULTY: COLORS.orange,
    SUPER_ADMIN: COLORS.pink,
  }), [COLORS]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    profileHeader: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: SPACING.xl },
    name: { fontSize: 18, fontWeight: FONT.extrabold, color: COLORS.t1, marginTop: 12 },
    email: { fontSize: 12, color: COLORS.t3, marginTop: 2 },
    roleBadge: { marginTop: 8, paddingVertical: 5, paddingHorizontal: 14, borderRadius: 12 },
    roleText: { fontSize: 11, fontWeight: FONT.bold },
    statsRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
    stat: { alignItems: 'center' },
    statNum: { fontSize: 16, fontWeight: FONT.extrabold },
    statLabel: { fontSize: 10, color: COLORS.t3, marginTop: 2 },
    content: { paddingHorizontal: SPACING.xl },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    infoLabel: { fontSize: 12, color: COLORS.t3 },
    infoValue: { fontSize: 12, color: COLORS.silver, fontWeight: FONT.semibold, maxWidth: '60%', textAlign: 'right' },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
    menuLabel: { flex: 1, fontSize: 13, color: COLORS.t1 },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 32 },
    modalCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: 28, width: '100%', maxWidth: 340, alignItems: 'center' },
    modalIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.red + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 17, fontWeight: FONT.extrabold, color: COLORS.t1, marginBottom: 8 },
    modalMessage: { fontSize: 13, color: COLORS.t3, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    modalBtnRow: { flexDirection: 'row', gap: 10, width: '100%' },
    modalBtn: { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: COLORS.border },
    modalBtnCancelText: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t2 },
    modalBtnConfirm: { backgroundColor: COLORS.red },
    modalBtnConfirmText: { fontSize: 14, fontWeight: FONT.bold, color: '#fff' },
  }), [COLORS]);

  if (!user) return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: COLORS.t3 }}>Loading profile...</Text>
      </View>
    </SafeAreaView>
  );

  const doLogout = async () => {
    if (loggingOut) return;
    setLogoutVisible(false);
    setLoggingOut(true);
    try { await logout(); } catch (_) {} finally { setLoggingOut(false); }
  };

  const roleColor = ROLE_COLORS[user.role] || COLORS.blue;
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  const info = [];
  if (user.role === 'STUDENT') info.push({ label: 'Matric No.', value: user.matric || 'N/A' });
  info.push({ label: 'Department', value: user.dept || 'N/A' });
  if (user.role === 'STUDENT') info.push({ label: 'Level', value: user.level || 'N/A' });
  if (user.role === 'LECTURER') info.push({ label: 'Specialization', value: user.specialization || 'N/A' });
  if (user.role === 'FACULTY') info.push({ label: 'Title', value: user.title || 'N/A' });
  info.push({ label: 'Phone', value: user.phone || 'N/A' });
  info.push({ label: 'Bio', value: user.bio || 'Not set' });

  const menuItems = [
    { label: 'Notifications', icon: 'notifications-outline', go: () => navigation.navigate('Notifications') },
    { label: 'Focus Mode', icon: 'timer-outline', go: () => navigation.navigate('Focus') },
    { label: 'Leaderboard', icon: 'trophy-outline', go: () => navigation.navigate('Leaderboard') },
    { label: 'My Certificates', icon: 'ribbon-outline', go: () => navigation.navigate('MyCertificates') },
    { label: 'Settings', icon: 'settings-outline', go: () => navigation.navigate('Settings') },
    { label: 'Help & Support', icon: 'help-circle-outline', go: () => navigation.navigate('HelpSupport') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <Avatar size={76} url={user.avatarUrl} name={`${user.firstName} ${user.lastName}`} />
          </TouchableOpacity>
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: COLORS.accent }]}>{(user.xp || 0).toLocaleString()}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: '#FF8C42' }]}>{user.streak || 0}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: COLORS.teal }]}>4</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Info Card */}
          <Card>
            {info.map((r, i) => (
              <View key={i} style={[styles.infoRow, i < info.length - 1 && styles.borderBottom]}>
                <Text style={styles.infoLabel}>{r.label}</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{r.value}</Text>
              </View>
            ))}
          </Card>

          <Button variant="secondary" onPress={() => navigation.navigate('EditProfile')}>Edit Profile</Button>
          <View style={{ height: 12 }} />

          {/* Menu */}
          <Card style={{ padding: 0 }}>
            {menuItems.map((s, i) => (
              <TouchableOpacity key={i} onPress={s.go} style={[styles.menuRow, i < menuItems.length - 1 && styles.borderBottom]}>
                <Ionicons name={s.icon} size={18} color={COLORS.t3} />
                <Text style={styles.menuLabel}>{s.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.t3} />
              </TouchableOpacity>
            ))}
          </Card>

          {/* Admin / Faculty access */}
          {canManageUsers && (
            <>
              <View style={{ height: 12 }} />
              <Button variant="secondary" onPress={() => navigation.navigate('AdminDashboard')}>
                <Text style={{ color: COLORS.orange }}>Admin Dashboard</Text>
              </Button>
              <View style={{ height: 8 }} />
              <Button variant="secondary" onPress={() => navigation.navigate('UserManagement')}>
                <Text style={{ color: COLORS.silver }}>Manage Users</Text>
              </Button>
              <View style={{ height: 8 }} />
              <Button variant="secondary" onPress={() => navigation.navigate('CreateLecturer')}>
                <Text style={{ color: COLORS.teal }}>Create Lecturer Account</Text>
              </Button>
              <View style={{ height: 8 }} />
              <Button variant="secondary" onPress={() => navigation.navigate('CreateStudent')}>
                <Text style={{ color: COLORS.blue }}>Register Student</Text>
              </Button>
            </>
          )}

          {canCreateCourses && (
            <>
              <View style={{ height: 8 }} />
              <Button variant="secondary" onPress={() => navigation.navigate('CourseBuilder')}>
                <Text style={{ color: COLORS.teal }}>Create Course</Text>
              </Button>
            </>
          )}

          {isLecturer && (
            <>
              <View style={{ height: 8 }} />
              <Button variant="secondary" onPress={() => navigation.navigate('PendingStudents')}>
                <Text style={{ color: COLORS.blue }}>Pending Enrollments</Text>
              </Button>
            </>
          )}

          <View style={{ height: 12 }} />
          <Button variant="danger" onPress={() => setLogoutVisible(true)} disabled={loggingOut}>
            {loggingOut ? 'Logging out...' : 'Log Out'}
          </Button>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* ═══ Custom Logout Confirmation Modal ═══ */}
      <Modal visible={logoutVisible} transparent animationType="fade" onRequestClose={() => setLogoutVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color={COLORS.red} />
            </View>
            <Text style={styles.modalTitle}>Log Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out of your account?
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setLogoutVisible(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={doLogout}
                style={[styles.modalBtn, styles.modalBtnConfirm]}
              >
                <Text style={styles.modalBtnConfirmText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

