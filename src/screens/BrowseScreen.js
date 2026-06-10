import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Card, Button, Badge, Toast, useToast } from '../components/UI';
import { apiListCourses, apiEnroll, apiMyEnrollments } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function BrowseScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [enrolling, setEnrolling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState(null);
  const { toast, showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const [coursesRes, enrollmentsRes] = await Promise.allSettled([
        apiListCourses({ published: 'true' }),
        apiMyEnrollments(),
      ]);

      if (coursesRes.status === 'fulfilled') {
        setCourses(coursesRes.value.data.courses || []);
        setError(null);
      } else {
        setError('Could not load courses.');
      }

      if (enrollmentsRes.status === 'fulfilled') {
        const ids = new Set(
          (enrollmentsRes.value.data.enrollments || []).map(e => e.courseId || e.course?.id)
        );
        setEnrolledIds(ids);
      }
    } catch (e) {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const handleEnrollPress = (course) => {
    if (enrolledIds.has(course.id)) {
      navigation.navigate('CourseDetail', { courseId: course.id });
      return;
    }
    setEnrollTarget(course);
  };

  const confirmEnroll = async () => {
    const course = enrollTarget;
    setEnrollTarget(null);
    if (!course) return;
    setEnrolling(course.id);
    try {
      await apiEnroll(course.id);
      setEnrolledIds(prev => new Set([...prev, course.id]));
      showToast(`Enrolled in ${course.title}!`, 'success');
      setTimeout(() => navigation.navigate('CourseDetail', { courseId: course.id }), 1000);
    } catch (e) {
      showToast(e.message || 'Could not enroll. Please try again.', 'error');
    } finally {
      setEnrolling(null);
    }
  };

  const courseEmoji = (course) => {
    const title = (course.title || '').toLowerCase();
    if (title.includes('database') || title.includes('data')) return '📊';
    if (title.includes('machine') || title.includes('ai') || title.includes('ml')) return '🤖';
    if (title.includes('software') || title.includes('engineer')) return '⚙️';
    if (title.includes('security') || title.includes('cyber')) return '🔐';
    if (title.includes('network')) return '🌐';
    return '📚';
  };

  const filtered = search.trim()
    ? courses.filter(c =>
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
      )
    : courses;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SPACING.xl, paddingVertical: 14 },
    title: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    searchWrap: { marginHorizontal: SPACING.xl, marginBottom: 8, position: 'relative' },
    searchIcon: { position: 'absolute', left: 14, top: 13, zIndex: 1 },
    searchInput: { width: '100%', paddingVertical: 12, paddingLeft: 40, paddingRight: 36, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, color: COLORS.t1, fontSize: 13 },
    clearBtn: { position: 'absolute', right: 12, top: 12 },
    scrollContent: { paddingHorizontal: SPACING.xl },
    subtitle: { fontSize: 12, color: COLORS.t3, marginBottom: 16 },
    courseHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
    courseEmoji: { fontSize: 36 },
    courseTitle: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.t1 },
    courseSub: { fontSize: 11, color: COLORS.t3, marginTop: 2 },
    courseDesc: { fontSize: 12, color: COLORS.t2, lineHeight: 20, marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: 11, color: COLORS.t3 },
    errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    errorText: { fontSize: 14, color: COLORS.t3, marginBottom: 12 },
    retryBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    retryText: { fontSize: 13, color: COLORS.silver },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 16 },
    emptyText: { fontSize: 13, color: COLORS.t3, marginTop: 4 },
  }), [COLORS]);

  const modal = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center', padding: 32 },
    box: { width: '100%', backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 24, alignItems: 'center' },
    title: { fontSize: 17, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 6, textAlign: 'center' },
    courseName: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.accent, marginBottom: 10, textAlign: 'center' },
    message: { fontSize: 12, color: COLORS.t3, lineHeight: 18, marginBottom: 24, textAlign: 'center' },
    actions: { flexDirection: 'row', gap: 10, width: '100%' },
    btn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
    cancelBtn: { borderColor: COLORS.border },
    cancelText: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t2 },
    enrollBtn: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
    enrollText: { fontSize: 14, fontWeight: FONT.bold, color: '#000' },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
        <Text style={styles.title}>Browse Courses</Text>
      </View>

      {/* Enroll confirmation modal */}
      <Modal visible={!!enrollTarget} transparent animationType="fade" onRequestClose={() => setEnrollTarget(null)}>
        <View style={modal.overlay}>
          <View style={modal.box}>
            <Ionicons name="school-outline" size={32} color={COLORS.accent} style={{ marginBottom: 12 }} />
            <Text style={modal.title}>Enroll in course?</Text>
            <Text style={modal.courseName}>{enrollTarget?.title}</Text>
            <Text style={modal.message}>You can start learning immediately after enrolling. This course is free.</Text>
            <View style={modal.actions}>
              <TouchableOpacity onPress={() => setEnrollTarget(null)} style={[modal.btn, modal.cancelBtn]}>
                <Text style={modal.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmEnroll} style={[modal.btn, modal.enrollBtn]}>
                <Text style={modal.enrollText}>Enroll Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={COLORS.t3} style={styles.searchIcon} />
        <TextInput
          placeholder="Search by title, code or topic..."
          placeholderTextColor={COLORS.t3}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={COLORS.t3} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      ) : error ? (
        <View style={styles.errorWrap}>
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
          <Text style={styles.subtitle}>
            {filtered.length} {filtered.length === 1 ? 'course' : 'courses'} available
          </Text>

          {filtered.map(course => {
            const isEnrolled = enrolledIds.has(course.id);
            const isEnrollingThis = enrolling === course.id;
            const creatorName = course.creator
              ? `${course.creator.firstName} ${course.creator.lastName}`.trim()
              : 'Instructor';

            return (
              <Card key={course.id}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseEmoji}>{courseEmoji(course)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseSub}>{creatorName} • {course.code}</Text>
                  </View>
                  {isEnrolled && <Badge label="Enrolled" color={COLORS.teal} />}
                </View>

                {course.description && (
                  <Text style={styles.courseDesc} numberOfLines={2}>{course.description}</Text>
                )}

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Ionicons name="layers-outline" size={14} color={COLORS.accent} />
                    <Text style={styles.statText}>
                      <Text style={{ color: COLORS.accent, fontWeight: FONT.bold }}>
                        {course._count?.modules || 0}
                      </Text>{' '}Modules
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="people-outline" size={14} color={COLORS.accent} />
                    <Text style={styles.statText}>
                      <Text style={{ color: COLORS.accent, fontWeight: FONT.bold }}>
                        {course._count?.enrollments || 0}
                      </Text>{' '}Students
                    </Text>
                  </View>
                </View>

                <Button
                  onPress={() => handleEnrollPress(course)}
                  variant={isEnrolled ? 'secondary' : 'primary'}
                  disabled={isEnrollingThis}
                >
                  {isEnrollingThis ? 'Enrolling...' : isEnrolled ? 'Continue Learning →' : 'Enroll Now — Free'}
                </Button>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="search" size={48} color={COLORS.t3} />
              <Text style={styles.emptyTitle}>No courses found</Text>
              <Text style={styles.emptyText}>Try a different search term</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

