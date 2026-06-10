import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, FlatList, ActivityIndicator, RefreshControl, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS, progressColor } from '../utils/theme';
import { Avatar, ProgressBar, Card, SectionHeader, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  apiMyEnrollments,
  apiMyCourses,
  apiGetStats,
  apiListUsers,
  apiPendingEnrollments,
  apiListLiveSessions,
  apiGetLeaderboard,
  apiStartLiveSession,
} from '../services/api';

// Students join in-app rooms inside the app; external platforms open their own app
function openSession(session, navigation) {
  if (session.platform === 'in_app') {
    navigation.navigate('LiveClassroom', { session });
  } else {
    const url = session.meetingLink;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url);
  }
}

// ─── Shared header used by all role views ────────────────────────────────────
function HomeHeader({ user, navigation, roleColor, roleLabel }) {
  const { colors: COLORS } = useTheme();
  const styles = useHomeStyles();
  const firstName = user?.firstName || 'Learner';
  const lastName = user?.lastName || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.name}>{firstName} {lastName}</Text>
        {roleLabel && (
          <View style={[styles.rolePill, { backgroundColor: roleColor + '22' }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        )}
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellWrap}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.t3} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
          <Avatar size={40} url={user?.avatarUrl} name={`${firstName} ${lastName}`} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ErrorRetry({ message, onRetry }) {
  const { colors: COLORS } = useTheme();
  const styles = useHomeStyles();
  return (
    <View style={styles.errorWrap}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── STUDENT HOME ─────────────────────────────────────────────────────────────
function StudentHome({ navigation, user }) {
  const { colors: COLORS } = useTheme();
  const styles = useHomeStyles();
  const [enrollments, setEnrollments] = useState([]);
  const [liveSessions, setLiveSessions] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [enrollRes, sessionsRes, rankRes] = await Promise.allSettled([
        apiMyEnrollments(),
        apiListLiveSessions({ upcoming: 'true' }),
        apiGetLeaderboard({ limit: 200 }),
      ]);
      if (enrollRes.status === 'fulfilled') {
        setEnrollments(enrollRes.value.data.enrollments || []);
        setError(null);
      } else {
        setError('Could not load courses. Pull down to retry.');
      }
      if (sessionsRes.status === 'fulfilled') {
        setLiveSessions(sessionsRes.value.data.sessions || []);
      }
      if (rankRes.status === 'fulfilled') {
        const idx = (rankRes.value.data.users || []).findIndex(u => u.id === user?.id);
        if (idx >= 0) setUserRank(idx + 1);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const courseEmoji = (code = '') => {
    if (code.includes('DB') || code.includes('CSC 4')) return '📊';
    if (code.includes('ML') || code.includes('AI')) return '🤖';
    if (code.includes('SE')) return '⚙️';
    return '🌐';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        <HomeHeader user={user} navigation={navigation} roleColor={COLORS.blue} roleLabel="Student" />

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Ionicons name="flame" size={14} color={COLORS.orange} />
            <Text style={[styles.statText, { color: COLORS.orange }]}>{user?.streak || 0} day streak</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={[styles.statText, { color: COLORS.accent }]}>{(user?.xp || 0).toLocaleString()} XP</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={styles.statPill}>
            <Ionicons name="trophy" size={14} color={COLORS.accent} />
            <Text style={[styles.statText, { color: COLORS.accent }]}>
              {userRank ? `Rank #${userRank}` : 'Leaderboard'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={COLORS.t3} style={styles.searchIcon} />
          <TextInput
            placeholder="Search courses, topics..."
            placeholderTextColor={COLORS.t3}
            style={styles.searchInput}
            onFocus={() => navigation.navigate('Browse')}
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Continue Learning" actionText="See All" onAction={() => navigation.navigate('CoursesTab')} />
          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={enrollments.slice(0, 6)}
              keyExtractor={item => String(item.id)}
              ListEmptyComponent={
                <TouchableOpacity onPress={() => navigation.navigate('Browse')} style={styles.enrollCTA}>
                  <Ionicons name="compass-outline" size={28} color={COLORS.accent} />
                  <Text style={styles.enrollCTAText}>Browse & enroll in courses</Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => {
                const c = item.course;
                const creatorName = c?.creator
                  ? `${c.creator.firstName} ${c.creator.lastName}`.trim()
                  : 'Lecturer';
                const isCompleted = item.status === 'COMPLETED' || (item.progress || 0) >= 100;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (isCompleted) {
                        navigation.navigate('Certificate', { courseId: c?.id });
                      } else {
                        navigation.navigate('CourseDetail', { courseId: c?.id });
                      }
                    }}
                    style={[styles.courseCard, isCompleted && styles.courseCardCompleted]}
                  >
                    <Text style={styles.courseEmoji}>{courseEmoji(c?.code)}</Text>
                    <Text style={styles.courseTitle} numberOfLines={1}>{c?.title || 'Course'}</Text>
                    <Text style={styles.courseLecturer} numberOfLines={1}>{creatorName}</Text>
                    {isCompleted ? (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={13} color={COLORS.teal} />
                        <Text style={styles.completedText}>Completed</Text>
                      </View>
                    ) : (
                      <>
                        <ProgressBar value={item.progress || 0} />
                        <Text style={[styles.coursePercent, { color: progressColor(item.progress || 0) }]}>
                          {Math.round(item.progress || 0)}%
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
          {error && <Text style={styles.offlineNote}>{error}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: 'chatbubble-ellipses', label: 'AI Chat', color: COLORS.blue, go: () => navigation.navigate('ChatTab') },
              { icon: 'timer', label: 'Focus', color: COLORS.pink, go: () => navigation.navigate('Focus') },
              { icon: 'trophy', label: 'Ranks', color: COLORS.accent, go: () => navigation.navigate('Leaderboard') },
              { icon: 'compass', label: 'Browse', color: COLORS.teal, go: () => navigation.navigate('Browse') },
            ].map((a, i) => (
              <TouchableOpacity key={i} onPress={a.go} style={styles.quickAction}>
                <Ionicons name={a.icon} size={22} color={a.color} />
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Classes</Text>
          {liveSessions.length === 0 ? (
            <Card style={styles.upcomingEmpty}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.t3} />
              <Text style={styles.upcomingEmptyText}>No upcoming live classes</Text>
            </Card>
          ) : (
            liveSessions.slice(0, 4).map(session => {
              const isLive = session.status === 'LIVE';
              const d = new Date(session.scheduledAt);
              const dateStr = d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              return (
                <Card key={session.id} style={[styles.liveCard, isLive && styles.liveCardActive]}>
                  <View style={styles.liveCardLeft}>
                    <View style={[styles.liveDot, { backgroundColor: isLive ? COLORS.red : COLORS.t3 }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.liveTitle} numberOfLines={1}>{session.title}</Text>
                      <Text style={styles.liveCourse} numberOfLines={1}>{session.course?.title}</Text>
                      <Text style={[styles.liveTime, { color: isLive ? COLORS.red : COLORS.t3 }]}>
                        {isLive ? 'Happening now' : dateStr}
                      </Text>
                    </View>
                  </View>
                  {isLive ? (
                    <TouchableOpacity onPress={() => openSession(session, navigation)} style={styles.joinBtn}>
                      <Text style={styles.joinBtnText}>Join Now</Text>
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="time-outline" size={18} color={COLORS.t3} />
                  )}
                </Card>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── LECTURER HOME ─────────────────────────────────────────────────────────────
function LecturerHome({ navigation, user }) {
  const { colors: COLORS } = useTheme();
  const styles = useHomeStyles();
  const [courses, setCourses] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(null);

  const goLive = async (session) => {
    setStarting(session.id);
    try {
      const res = await apiStartLiveSession(session.id, session.focusMode);
      const live = { ...session, ...res.data.session };
      setUpcomingSessions(prev => prev.map(s => (s.id === session.id ? live : s)));
      if (session.platform === 'in_app') {
        navigation.navigate('LiveClassroom', { session: live });
      } else {
        openSession(session, navigation);
        navigation.navigate('LiveAttendance', { sessionId: session.id });
      }
    } catch (e) {
      // Session may already be live — refresh the list
      load();
    } finally {
      setStarting(null);
    }
  };

  const load = useCallback(async () => {
    try {
      const [coursesRes, pendingRes, sessionsRes] = await Promise.allSettled([
        apiMyCourses(),
        apiPendingEnrollments(),
        apiListLiveSessions({ upcoming: 'true' }),
      ]);
      if (coursesRes.status === 'fulfilled') {
        setCourses(coursesRes.value.data.courses || []);
      }
      if (pendingRes.status === 'fulfilled') {
        setPendingCount(pendingRes.value.data.enrollments?.length || 0);
      }
      if (sessionsRes.status === 'fulfilled') {
        setUpcomingSessions(sessionsRes.value.data.sessions || []);
      }
    } catch (e) {
      // ignore — screens show empty states
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        <HomeHeader user={user} navigation={navigation} roleColor={COLORS.teal} roleLabel="Lecturer" />

        {/* Pending approvals banner */}
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.pendingBanner}
            onPress={() => navigation.navigate('PendingStudents')}
          >
            <Ionicons name="alert-circle" size={18} color={COLORS.orange} />
            <Text style={styles.pendingBannerText}>
              {pendingCount} student{pendingCount > 1 ? 's' : ''} awaiting approval
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.orange} />
          </TouchableOpacity>
        )}

        {/* My Courses */}
        <View style={styles.section}>
          <SectionHeader
            title="My Courses"
            actionText="Create +"
            onAction={() => navigation.navigate('CourseBuilder')}
          />
          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
          ) : courses.length === 0 ? (
            <TouchableOpacity onPress={() => navigation.navigate('CourseBuilder')} style={styles.createCourseCTA}>
              <Ionicons name="add-circle-outline" size={32} color={COLORS.teal} />
              <Text style={styles.ctaTitle}>Create your first course</Text>
              <Text style={styles.ctaDesc}>Build modules, add content, and publish for students</Text>
            </TouchableOpacity>
          ) : (
            courses.map(c => (
              <Card
                key={c.id}
                onPress={() => navigation.navigate('CourseDetail', { courseId: c.id })}
                style={styles.lecturerCourseCard}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.lcTitle} numberOfLines={1}>{c.title}</Text>
                  <Text style={styles.lcCode}>{c.code}</Text>
                </View>
                <View style={styles.lcMeta}>
                  <Text style={styles.lcStat}>{c._count?.enrollments || 0} students</Text>
                  <Text style={styles.lcStat}>{c._count?.modules || 0} modules</Text>
                  <View style={[styles.publishBadge, { backgroundColor: c.isPublished ? COLORS.teal + '20' : COLORS.elevated }]}>
                    <Text style={[styles.publishText, { color: c.isPublished ? COLORS.teal : COLORS.t3 }]}>
                      {c.isPublished ? 'Published' : 'Draft'}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: 'create-outline', label: 'New Course', color: COLORS.teal, go: () => navigation.navigate('CourseBuilder') },
              { icon: 'people-outline', label: 'Students', color: COLORS.blue, go: () => navigation.navigate('PendingStudents') },
              { icon: 'radio-outline', label: 'Live Class', color: COLORS.red, go: () => navigation.navigate('ScheduleLiveClass') },
              { icon: 'person-add-outline', label: 'Approvals', color: COLORS.orange, go: () => navigation.navigate('PendingStudents') },
            ].map((a, i) => (
              <TouchableOpacity key={i} onPress={a.go} style={styles.quickAction}>
                <Ionicons name={a.icon} size={22} color={a.color} />
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Live Sessions */}
        <View style={styles.section}>
          <SectionHeader
            title="Upcoming Live Classes"
            actionText="Manage"
            onAction={() => navigation.navigate('ScheduleLiveClass')}
          />
          {upcomingSessions.length === 0 ? (
            <Card style={styles.upcomingEmpty}>
              <Ionicons name="calendar-outline" size={22} color={COLORS.t3} />
              <Text style={styles.upcomingEmptyText}>No upcoming sessions scheduled</Text>
            </Card>
          ) : (
            upcomingSessions.slice(0, 3).map(session => {
              const isLive = session.status === 'LIVE';
              const d = new Date(session.scheduledAt);
              const dateStr = d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
              return (
                <Card key={session.id} style={[styles.liveCard, isLive && styles.liveCardActive]}>
                  <View style={styles.liveCardLeft}>
                    <View style={[styles.liveDot, { backgroundColor: isLive ? COLORS.red : COLORS.t3 }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.liveTitle} numberOfLines={1}>{session.title}</Text>
                      <Text style={styles.liveCourse} numberOfLines={1}>{session.course?.title}</Text>
                      <Text style={[styles.liveTime, { color: isLive ? COLORS.red : COLORS.t3 }]}>
                        {isLive ? 'Live now' : dateStr}
                      </Text>
                    </View>
                  </View>
                  {isLive ? (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('LiveAttendance', { sessionId: session.id })}
                      style={styles.joinBtn}
                    >
                      <Text style={styles.joinBtnText}>Roster</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => goLive(session)}
                      disabled={starting === session.id}
                      style={styles.goLiveBtn}
                    >
                      <Ionicons name="radio" size={13} color={COLORS.green} />
                      <Text style={styles.goLiveBtnText}>{starting === session.id ? 'Starting…' : 'Go Live'}</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── FACULTY HOME ──────────────────────────────────────────────────────────────
function FacultyHome({ navigation, user }) {
  const { colors: COLORS } = useTheme();
  const styles = useHomeStyles();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGetStats();
      setStats(res.data);
    } catch (e) {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const statCards = stats ? [
    { label: 'Students', n: stats.byRole?.STUDENT || 0, color: COLORS.blue, icon: 'person' },
    { label: 'Lecturers', n: stats.byRole?.LECTURER || 0, color: COLORS.teal, icon: 'school' },
    { label: 'Courses', n: stats.totalCourses || '—', color: COLORS.accent, icon: 'book' },
    { label: 'Pending', n: stats.byStatus?.PENDING || 0, color: COLORS.orange, icon: 'time' },
  ] : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        <HomeHeader user={user} navigation={navigation} roleColor={COLORS.orange} roleLabel="Faculty" />

        {/* Dept Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Department Overview</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.statGrid}>
              {statCards.map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <Ionicons name={s.icon} size={16} color={s.color} />
                  <Text style={[styles.statCardNum, { color: s.color }]}>{s.n}</Text>
                  <Text style={styles.statCardLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Management Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage</Text>
          {[
            { icon: 'megaphone-outline', label: 'Send Announcement', desc: 'Notify all users about updates & news', color: COLORS.accent, go: () => navigation.navigate('Broadcast') },
            { icon: 'person-add-outline', label: 'Create Lecturer Account', desc: 'Add a new lecturer to the platform', color: COLORS.teal, go: () => navigation.navigate('CreateLecturer') },
            { icon: 'people-outline', label: 'User Management', desc: 'View, approve & manage all users', color: COLORS.blue, go: () => navigation.navigate('UserManagement') },
            { icon: 'book-outline', label: 'All Courses', desc: 'View & manage department courses', color: COLORS.orange, go: () => navigation.navigate('Browse') },
            { icon: 'bar-chart-outline', label: 'Admin Dashboard', desc: 'Stats, audit logs & system health', color: COLORS.pink, go: () => navigation.navigate('AdminDashboard') },
          ].map((item, i) => (
            <TouchableOpacity key={i} onPress={item.go} style={styles.managementRow}>
              <View style={[styles.managementIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.managementLabel}>{item.label}</Text>
                <Text style={styles.managementDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.t3} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── SUPER ADMIN HOME ──────────────────────────────────────────────────────────
function AdminHome({ navigation, user }) {
  const { colors: COLORS } = useTheme();
  const styles = useHomeStyles();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGetStats();
      setStats(res.data);
    } catch (e) {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const statCards = stats ? [
    { label: 'Total Users', n: stats.totalUsers || 0, color: COLORS.accent, icon: 'people' },
    { label: 'Students', n: stats.byRole?.STUDENT || 0, color: COLORS.blue, icon: 'person' },
    { label: 'Lecturers', n: stats.byRole?.LECTURER || 0, color: COLORS.teal, icon: 'school' },
    { label: 'Pending', n: stats.byStatus?.PENDING || 0, color: COLORS.orange, icon: 'time' },
  ] : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        <HomeHeader user={user} navigation={navigation} roleColor={COLORS.pink} roleLabel="Super Admin" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Stats</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
          ) : !stats ? (
            <ErrorRetry message="Could not load stats" onRetry={load} />
          ) : (
            <View style={styles.statGrid}>
              {statCards.map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <Ionicons name={s.icon} size={16} color={s.color} />
                  <Text style={[styles.statCardNum, { color: s.color }]}>{s.n}</Text>
                  <Text style={styles.statCardLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Users */}
        {stats?.recentUsers?.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Recent Registrations"
              actionText="View All"
              onAction={() => navigation.navigate('UserManagement')}
            />
            <Card style={{ padding: 0 }}>
              {stats.recentUsers.map((u, i) => (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => navigation.navigate('UserDetail', { userId: u.id })}
                  style={[styles.recentUserRow, i < stats.recentUsers.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.border }]}
                >
                  <Avatar size={36} name={`${u.firstName} ${u.lastName}`} color={COLORS.accent} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.recentUserName}>{u.firstName} {u.lastName}</Text>
                    <Text style={styles.recentUserEmail}>{u.email}</Text>
                  </View>
                  <Badge label={u.role} color={
                    u.role === 'STUDENT' ? COLORS.blue :
                    u.role === 'LECTURER' ? COLORS.teal :
                    u.role === 'FACULTY' ? COLORS.orange : COLORS.pink
                  } />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {[
            { icon: 'megaphone-outline', label: 'Send Announcement', desc: 'Notify everyone about app updates', color: COLORS.accent, go: () => navigation.navigate('Broadcast') },
            { icon: 'people-outline', label: 'Manage Users', desc: 'Roles, status & permissions', color: COLORS.blue, go: () => navigation.navigate('UserManagement') },
            { icon: 'person-add-outline', label: 'Create Lecturer', desc: 'Add a new lecturer account', color: COLORS.teal, go: () => navigation.navigate('CreateLecturer') },
            { icon: 'book-outline', label: 'Course Builder', desc: 'Create & manage courses', color: COLORS.orange, go: () => navigation.navigate('CourseBuilder') },
            { icon: 'shield-checkmark-outline', label: 'Admin Dashboard', desc: 'Full platform overview', color: COLORS.pink, go: () => navigation.navigate('AdminDashboard') },
          ].map((item, i) => (
            <TouchableOpacity key={i} onPress={item.go} style={styles.managementRow}>
              <View style={[styles.managementIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.managementLabel}>{item.label}</Text>
                <Text style={styles.managementDesc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.t3} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── ROOT ROUTER ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const { user, isLecturer, isFaculty, isAdmin } = useAuth();

  if (isLecturer) return <LecturerHome navigation={navigation} user={user} />;
  if (isFaculty) return <FacultyHome navigation={navigation} user={user} />;
  if (isAdmin) return <AdminHome navigation={navigation} user={user} />;
  return <StudentHome navigation={navigation} user={user} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function useHomeStyles() {
  const { colors: COLORS } = useTheme();
  return useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: 4 },
    greeting: { fontSize: 12, color: COLORS.t3 },
    name: { fontSize: 22, fontWeight: FONT.extrabold, color: COLORS.t1 },
    rolePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
    roleText: { fontSize: 10, fontWeight: FONT.bold },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    bellWrap: { position: 'relative', padding: 2 },
    bellDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red, borderWidth: 2, borderColor: COLORS.bg },
    statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.xl, marginBottom: 16 },
    statPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: COLORS.elevated },
    statText: { fontSize: 11, fontWeight: FONT.bold },
    searchWrap: { marginHorizontal: SPACING.xl, marginBottom: 18, position: 'relative' },
    searchIcon: { position: 'absolute', left: 14, top: 14, zIndex: 1 },
    searchInput: { width: '100%', paddingVertical: 13, paddingLeft: 42, paddingRight: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, color: COLORS.t1, fontSize: 13 },
    section: { paddingHorizontal: SPACING.xl, marginBottom: 22 },
    sectionTitle: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 12 },
    courseCard: { width: 190, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.lg, marginRight: 12, borderWidth: 1, borderColor: COLORS.border },
    courseEmoji: { fontSize: 32, marginBottom: 8 },
    courseTitle: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t1, marginBottom: 3 },
    courseLecturer: { fontSize: 11, color: COLORS.t3, marginBottom: 10 },
    coursePercent: { fontSize: 11, fontWeight: FONT.bold, marginTop: 6 },
    enrollCTA: { width: 190, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
    enrollCTAText: { fontSize: 12, color: COLORS.t3, textAlign: 'center', marginTop: 8 },
    quickGrid: { flexDirection: 'row', gap: 10 },
    quickAction: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center', gap: 6 },
    quickLabel: { fontSize: 9, color: COLORS.t3, fontWeight: FONT.semibold },
    upcomingEmpty: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', paddingVertical: 18 },
    upcomingEmptyText: { fontSize: 12, color: COLORS.t3 },
    offlineNote: { fontSize: 10, color: COLORS.t3, marginTop: 4, textAlign: 'center' },
    errorWrap: { alignItems: 'center', paddingVertical: 20 },
    errorText: { fontSize: 13, color: COLORS.t3, marginBottom: 8 },
    retryBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
    retryText: { fontSize: 12, color: COLORS.silver },
    // Lecturer
    pendingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: SPACING.xl, marginBottom: 16, backgroundColor: COLORS.orange + '15', borderWidth: 1, borderColor: COLORS.orange + '30', borderRadius: RADIUS.lg, padding: 12 },
    pendingBannerText: { flex: 1, fontSize: 13, fontWeight: FONT.semibold, color: COLORS.orange },
    createCourseCTA: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', padding: 24, alignItems: 'center' },
    ctaTitle: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 10 },
    ctaDesc: { fontSize: 11, color: COLORS.t3, textAlign: 'center', marginTop: 4 },
    lecturerCourseCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    lcTitle: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t1 },
    lcCode: { fontSize: 11, color: COLORS.t3, marginTop: 1 },
    lcMeta: { alignItems: 'flex-end', gap: 4 },
    lcStat: { fontSize: 10, color: COLORS.t3 },
    publishBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    publishText: { fontSize: 9, fontWeight: FONT.bold },
    // Faculty / Admin
    statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { flex: 1, minWidth: '44%', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 14, alignItems: 'center', gap: 4 },
    statCardNum: { fontSize: 24, fontWeight: FONT.extrabold },
    statCardLabel: { fontSize: 9, color: COLORS.t3, fontWeight: FONT.semibold },
    managementRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
    managementIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    managementLabel: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    managementDesc: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
    recentUserRow: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 14 },
    recentUserName: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    recentUserEmail: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
    // Completed course card
    courseCardCompleted: { borderColor: COLORS.teal + '40', backgroundColor: COLORS.card },
    completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    completedText: { fontSize: 11, color: COLORS.teal, fontWeight: FONT.semibold },
    // Live session cards
    liveCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    liveCardActive: { borderColor: COLORS.red + '50' },
    liveCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.red, marginTop: 2 },
    liveTitle: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    liveCourse: { fontSize: 11, color: COLORS.t3, marginTop: 1 },
    liveTime: { fontSize: 10, color: COLORS.accent, marginTop: 2 },
    joinBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.sm, backgroundColor: COLORS.red + '15', borderWidth: 1, borderColor: COLORS.red },
    joinBtnText: { fontSize: 11, fontWeight: FONT.bold, color: COLORS.red },
    goLiveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.sm, backgroundColor: COLORS.green + '14', borderWidth: 1, borderColor: COLORS.green },
    goLiveBtnText: { fontSize: 11, fontWeight: FONT.bold, color: COLORS.green },
  }), [COLORS]);
}
