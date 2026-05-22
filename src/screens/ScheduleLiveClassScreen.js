import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Input, Button, Card, Toast, useToast } from '../components/UI';
import { apiMyCourses, apiCreateLiveSession, apiListLiveSessions, apiCancelLiveSession } from '../services/api';
import { useTheme } from '../context/ThemeContext';

function pad(n) { return String(n).padStart(2, '0'); }

function buildDefaultDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function formatSessionDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function isPast(isoStr) {
  return new Date(isoStr) < new Date();
}

export default function ScheduleLiveClassScreen({ navigation }) {
  const { colors: COLORS } = useTheme();

  const PLATFORMS = useMemo(() => [
    { id: 'zoom', label: 'Zoom', icon: 'videocam', color: '#2D8CFF', hint: 'https://zoom.us/j/...' },
    { id: 'google_meet', label: 'Google Meet', icon: 'logo-google', color: '#00897B', hint: 'https://meet.google.com/...' },
    { id: 'teams', label: 'Microsoft Teams', icon: 'people', color: '#6264A7', hint: 'https://teams.microsoft.com/...' },
    { id: 'other', label: 'Other / Custom', icon: 'link', color: COLORS.t3, hint: 'https://...' },
  ], [COLORS]);

  const [courses, setCourses] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [tab, setTab] = useState('schedule'); // 'schedule' | 'upcoming'

  const def = buildDefaultDateTime();
  const [form, setForm] = useState({
    courseId: '',
    courseName: '',
    title: '',
    description: '',
    platform: 'zoom',
    meetingLink: '',
    date: def.date,
    time: def.time,
    durationMin: '60',
  });
  const [formError, setFormError] = useState('');
  const [coursePickerVisible, setCoursePickerVisible] = useState(false);
  const [platformPickerVisible, setPlatformPickerVisible] = useState(false);
  const { toast, showToast } = useToast();

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFormError('');
  };

  const loadData = useCallback(async () => {
    try {
      const [coursesRes, sessionsRes] = await Promise.allSettled([
        apiMyCourses(),
        apiListLiveSessions({ upcoming: 'true' }),
      ]);
      if (coursesRes.status === 'fulfilled') {
        setCourses(coursesRes.value.data.courses || []);
      }
      if (sessionsRes.status === 'fulfilled') {
        setUpcomingSessions(sessionsRes.value.data.sessions || []);
      }
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedPlatform = PLATFORMS.find(p => p.id === form.platform) || PLATFORMS[0];

  const handleSubmit = async () => {
    setFormError('');
    if (!form.courseId) { setFormError('Please select a course.'); return; }
    if (!form.title.trim()) { setFormError('Session title is required.'); return; }
    if (!form.meetingLink.trim()) { setFormError('Meeting link is required.'); return; }
    if (!form.date || !form.time) { setFormError('Please set a date and time.'); return; }

    const scheduledAt = new Date(`${form.date}T${form.time}:00`);
    if (isNaN(scheduledAt.getTime())) { setFormError('Invalid date or time format.'); return; }
    if (scheduledAt <= new Date()) { setFormError('Session must be scheduled in the future.'); return; }

    setSaving(true);
    try {
      await apiCreateLiveSession({
        courseId: form.courseId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        platform: form.platform,
        meetingLink: form.meetingLink.trim(),
        scheduledAt: scheduledAt.toISOString(),
        durationMin: form.durationMin ? parseInt(form.durationMin) : undefined,
      });

      showToast('Live class scheduled! Enrolled students have been notified.', 'success');
      // Reset form
      const nd = buildDefaultDateTime();
      setForm({
        courseId: '', courseName: '', title: '', description: '',
        platform: 'zoom', meetingLink: '',
        date: nd.date, time: nd.time, durationMin: '60',
      });
      // Refresh upcoming list
      const sessRes = await apiListLiveSessions({ upcoming: 'true' });
      setUpcomingSessions(sessRes.data.sessions || []);
      setTab('upcoming');
    } catch (e) {
      setFormError(e.message || 'Could not schedule live class. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (session) => {
    setCancelling(session.id);
    try {
      await apiCancelLiveSession(session.id);
      showToast('Live class cancelled. Students have been notified.', 'info');
      setUpcomingSessions(prev => prev.filter(s => s.id !== session.id));
    } catch (e) {
      showToast(e.message || 'Could not cancel session.', 'error');
    } finally {
      setCancelling(null);
    }
  };

  const openLink = (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(() => showToast('Could not open link', 'error'));
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    headerTitle: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    tabRow: { flexDirection: 'row', marginHorizontal: SPACING.xl, marginBottom: 12, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 4 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.sm },
    tabActive: { backgroundColor: COLORS.accent },
    tabText: { fontSize: 13, fontWeight: FONT.medium, color: COLORS.t3 },
    tabTextActive: { color: '#000', fontWeight: FONT.bold },
    scrollContent: { paddingHorizontal: SPACING.xxl, paddingBottom: 20 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 },
    infoText: { flex: 1, fontSize: 11, color: COLORS.t2, lineHeight: 18 },
    label: { fontSize: 12, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 4, marginLeft: 2 },
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16 },
    selectorValue: { fontSize: 13, color: COLORS.t1 },
    selectorPlaceholder: { fontSize: 13, color: '#444' },
    platformRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    platformIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    dateTimeRow: { flexDirection: 'row', gap: 12 },
    dateHint: { fontSize: 10, color: COLORS.t3, marginTop: -10, marginBottom: 14, marginLeft: 2 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.red + '15', borderRadius: RADIUS.md, padding: 10, marginBottom: 8 },
    errorText: { fontSize: 12, color: COLORS.red, flex: 1 },
    // Upcoming
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 16 },
    emptyText: { fontSize: 13, color: COLORS.t3, marginTop: 4 },
    sessionCard: { marginBottom: 12 },
    sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    sessionTitle: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.t1 },
    sessionCourse: { fontSize: 11, color: COLORS.t3, marginTop: 2 },
    sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    sessionMetaText: { fontSize: 12, color: COLORS.t2 },
    sessionActions: { flexDirection: 'row', gap: 10 },
    sessionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: RADIUS.sm, borderWidth: 1 },
    sessionBtnText: { fontSize: 12, fontWeight: FONT.semibold },
    // Bottom sheet
    sheetOverlay: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 20, maxHeight: '70%' },
    sheetTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 16 },
    sheetEmpty: { fontSize: 13, color: COLORS.t3, textAlign: 'center', paddingVertical: 20 },
    sheetItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    sheetItemActive: { opacity: 1 },
    sheetItemText: { fontSize: 14, color: COLORS.t1, fontWeight: FONT.medium },
    sheetItemSub: { fontSize: 11, color: COLORS.t3, marginTop: 2 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />

      {/* Course picker modal */}
      <Modal visible={coursePickerVisible} transparent animationType="slide" onRequestClose={() => setCoursePickerVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setCoursePickerVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Course</Text>
            {courses.length === 0 ? (
              <Text style={styles.sheetEmpty}>No published courses found.</Text>
            ) : (
              <FlatList
                data={courses}
                keyExtractor={c => c.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => { update('courseId', item.id); update('courseName', item.title); setCoursePickerVisible(false); }}
                    style={[styles.sheetItem, form.courseId === item.id && styles.sheetItemActive]}
                  >
                    <Text style={[styles.sheetItemText, form.courseId === item.id && { color: COLORS.accent }]}>{item.title}</Text>
                    <Text style={styles.sheetItemSub}>{item.code}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Platform picker modal */}
      <Modal visible={platformPickerVisible} transparent animationType="slide" onRequestClose={() => setPlatformPickerVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setPlatformPickerVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select Platform</Text>
            {PLATFORMS.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => { update('platform', p.id); update('meetingLink', ''); setPlatformPickerVisible(false); }}
                style={[styles.sheetItem, form.platform === p.id && styles.sheetItemActive]}
              >
                <View style={styles.platformRow}>
                  <View style={[styles.platformIcon, { backgroundColor: p.color + '20' }]}>
                    <Ionicons name={p.icon} size={18} color={p.color} />
                  </View>
                  <Text style={[styles.sheetItemText, form.platform === p.id && { color: COLORS.accent }]}>{p.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Classes</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setTab('schedule')} style={[styles.tab, tab === 'schedule' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'schedule' && styles.tabTextActive]}>Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('upcoming')} style={[styles.tab, tab === 'upcoming' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>
            Upcoming {upcomingSessions.length > 0 ? `(${upcomingSessions.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'schedule' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Info card */}
          <Card style={styles.infoCard}>
            <Ionicons name="information-circle" size={18} color={COLORS.blue} />
            <Text style={styles.infoText}>
              Schedule a live class and all enrolled students will be notified immediately. They'll also get a 5-minute reminder before class starts.
            </Text>
          </Card>

          {/* Course selector */}
          <Text style={styles.label}>Course *</Text>
          <TouchableOpacity onPress={() => setCoursePickerVisible(true)} style={styles.selector}>
            <Text style={form.courseId ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.courseName || 'Select a course'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.t3} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.label}>Session Title *</Text>
          <Input
            placeholder="e.g. Week 3 Live Tutorial"
            value={form.title}
            onChangeText={v => update('title', v)}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <Input
            placeholder="What will you cover in this session?"
            value={form.description}
            onChangeText={v => update('description', v)}
            multiline
            rows={3}
          />

          {/* Platform */}
          <Text style={styles.label}>Platform *</Text>
          <TouchableOpacity onPress={() => setPlatformPickerVisible(true)} style={styles.selector}>
            <View style={styles.platformRow}>
              <View style={[styles.platformIcon, { backgroundColor: selectedPlatform.color + '20' }]}>
                <Ionicons name={selectedPlatform.icon} size={16} color={selectedPlatform.color} />
              </View>
              <Text style={styles.selectorValue}>{selectedPlatform.label}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={COLORS.t3} />
          </TouchableOpacity>

          {/* Meeting link */}
          <Text style={styles.label}>Meeting Link *</Text>
          <Input
            placeholder={selectedPlatform.hint}
            value={form.meetingLink}
            onChangeText={v => update('meetingLink', v)}
            autoCapitalize="none"
            keyboardType="url"
          />

          {/* Date & Time */}
          <View style={styles.dateTimeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Date *</Text>
              <Input
                placeholder="YYYY-MM-DD"
                value={form.date}
                onChangeText={v => update('date', v)}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Time *</Text>
              <Input
                placeholder="HH:MM"
                value={form.time}
                onChangeText={v => update('time', v)}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <Text style={styles.dateHint}>24-hour format • e.g. 14:30 for 2:30 PM</Text>

          {/* Duration */}
          <Text style={styles.label}>Duration (minutes)</Text>
          <Input
            placeholder="60"
            value={form.durationMin}
            onChangeText={v => update('durationMin', v)}
            keyboardType="number-pad"
          />

          {!!formError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}

          <View style={{ height: 16 }} />
          <Button onPress={handleSubmit} disabled={saving}>
            {saving ? 'Scheduling...' : '📅 Schedule Live Class'}
          </Button>
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {upcomingSessions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.t3} />
              <Text style={styles.emptyTitle}>No upcoming sessions</Text>
              <Text style={styles.emptyText}>Schedule a live class from the Schedule tab</Text>
            </View>
          ) : (
            upcomingSessions.map(session => {
              const platform = PLATFORMS.find(p => p.id === session.platform) || PLATFORMS[3];
              return (
                <Card key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                      <Ionicons name={platform.icon} size={18} color={platform.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <Text style={styles.sessionCourse}>{session.course?.title}</Text>
                    </View>
                  </View>

                  <View style={styles.sessionMeta}>
                    <Ionicons name="time-outline" size={13} color={COLORS.accent} />
                    <Text style={styles.sessionMetaText}>{formatSessionDate(session.scheduledAt)}</Text>
                    {session.durationMin && (
                      <Text style={styles.sessionMetaText}> · {session.durationMin} min</Text>
                    )}
                  </View>

                  <View style={styles.sessionActions}>
                    <TouchableOpacity
                      onPress={() => openLink(session.meetingLink)}
                      style={[styles.sessionBtn, { borderColor: platform.color, backgroundColor: platform.color + '15' }]}
                    >
                      <Ionicons name="open-outline" size={14} color={platform.color} />
                      <Text style={[styles.sessionBtnText, { color: platform.color }]}>Open Link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleCancel(session)}
                      disabled={cancelling === session.id}
                      style={[styles.sessionBtn, { borderColor: COLORS.red, backgroundColor: COLORS.red + '10' }]}
                    >
                      <Text style={[styles.sessionBtnText, { color: COLORS.red }]}>
                        {cancelling === session.id ? 'Cancelling...' : 'Cancel'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

