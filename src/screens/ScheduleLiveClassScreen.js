import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, Linking, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, TYPE, SPACING, RADIUS } from '../utils/theme';
import { Input, Button, Card, Toast, useToast, ScreenHeader, EmptyState, haptic } from '../components/UI';
import {
  apiMyCourses, apiCreateLiveSession, apiListLiveSessions,
  apiCancelLiveSession, apiStartLiveSession,
} from '../services/api';
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

// In-app classes run on a Jitsi room generated per session
function generateRoomLink(courseCode = '') {
  const slug = courseCode.replace(/[^a-zA-Z0-9]/g, '') || 'class';
  const rand = Math.random().toString(36).slice(2, 10);
  return `https://meet.jit.si/iLearn-${slug}-${rand}`;
}

export default function ScheduleLiveClassScreen({ navigation }) {
  const { colors: COLORS } = useTheme();

  const PLATFORMS = useMemo(() => [
    { id: 'in_app', label: 'iLearn Live (in-app)', icon: 'school', color: COLORS.accent, hint: 'Room link is created for you' },
    { id: 'zoom', label: 'Zoom', icon: 'videocam', color: '#2D8CFF', hint: 'https://zoom.us/j/...' },
    { id: 'google_meet', label: 'Google Meet', icon: 'logo-google', color: '#00897B', hint: 'https://meet.google.com/...' },
    { id: 'teams', label: 'Microsoft Teams', icon: 'people', color: '#6264A7', hint: 'https://teams.microsoft.com/...' },
    { id: 'other', label: 'Other / Custom', icon: 'link', color: COLORS.t3, hint: 'https://...' },
  ], [COLORS]);

  const [courses, setCourses] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(null);
  const [starting, setStarting] = useState(null);
  const [tab, setTab] = useState('schedule'); // 'schedule' | 'upcoming'

  const def = buildDefaultDateTime();
  const [form, setForm] = useState({
    courseId: '',
    courseName: '',
    courseCode: '',
    title: '',
    description: '',
    platform: 'in_app',
    meetingLink: '',
    date: def.date,
    time: def.time,
    durationMin: '60',
    focusMode: true,
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
    } catch (_) {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectedPlatform = PLATFORMS.find(p => p.id === form.platform) || PLATFORMS[0];
  const isInApp = form.platform === 'in_app';

  const handleSubmit = async () => {
    setFormError('');
    if (!form.courseId) { setFormError('Please select a course.'); return; }
    if (!form.title.trim()) { setFormError('Session title is required.'); return; }
    if (!isInApp && !form.meetingLink.trim()) { setFormError('Meeting link is required.'); return; }
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
        meetingLink: isInApp ? generateRoomLink(form.courseCode) : form.meetingLink.trim(),
        scheduledAt: scheduledAt.toISOString(),
        durationMin: form.durationMin ? parseInt(form.durationMin) : undefined,
        focusMode: form.focusMode,
      });

      showToast('Live class scheduled. Enrolled students have been notified.', 'success');
      const nd = buildDefaultDateTime();
      setForm({
        courseId: '', courseName: '', courseCode: '', title: '', description: '',
        platform: 'in_app', meetingLink: '',
        date: nd.date, time: nd.time, durationMin: '60', focusMode: true,
      });
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

  // Go live now: flips the session to LIVE, notifies students, then opens the room
  const handleGoLive = async (session) => {
    setStarting(session.id);
    try {
      const res = await apiStartLiveSession(session.id, session.focusMode);
      const live = res.data.session;
      haptic.success();
      setUpcomingSessions(prev => prev.map(s => (s.id === session.id ? { ...s, status: 'LIVE' } : s)));
      if (session.platform === 'in_app') {
        navigation.navigate('LiveClassroom', { session: { ...session, ...live } });
      } else {
        openLink(session.meetingLink);
        navigation.navigate('LiveAttendance', { sessionId: session.id });
      }
    } catch (e) {
      showToast(e.message || 'Could not start the class.', 'error');
    } finally {
      setStarting(null);
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
    tabRow: { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.xs },
    tab: { flex: 1, paddingVertical: SPACING.sm + 2, alignItems: 'center', borderRadius: RADIUS.sm },
    tabActive: { backgroundColor: COLORS.accent },
    tabText: { fontSize: TYPE.body, color: COLORS.t3 },
    tabTextActive: { color: '#16181D', fontWeight: FONT.bold },
    scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.lg },
    infoText: { flex: 1, fontSize: TYPE.caption, color: COLORS.t2, lineHeight: 18 },
    label: { fontSize: TYPE.caption, color: COLORS.t2, marginBottom: SPACING.xs, marginLeft: SPACING.xs },
    selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg - 2, marginBottom: SPACING.lg },
    selectorValue: { fontSize: TYPE.body, color: COLORS.t1 },
    selectorPlaceholder: { fontSize: TYPE.body, color: COLORS.t3 },
    platformRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    platformIcon: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
    autoLinkCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.accent + '10', borderWidth: 1, borderColor: COLORS.accent + '30', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg },
    autoLinkText: { flex: 1, fontSize: TYPE.caption, color: COLORS.t2, lineHeight: 16 },
    focusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.lg },
    focusTitle: { fontSize: TYPE.body, fontWeight: FONT.bold, color: COLORS.t1 },
    focusDesc: { fontSize: TYPE.micro, color: COLORS.t3, marginTop: 2, lineHeight: 15 },
    dateTimeRow: { flexDirection: 'row', gap: SPACING.md },
    dateHint: { fontSize: TYPE.micro, color: COLORS.t3, marginTop: -SPACING.sm, marginBottom: SPACING.lg, marginLeft: SPACING.xs },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.red + '15', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
    errorText: { fontSize: TYPE.caption, color: COLORS.red, flex: 1 },
    // Upcoming
    sessionCard: { marginBottom: SPACING.md },
    sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
    sessionTitle: { fontSize: TYPE.body, fontWeight: FONT.bold, color: COLORS.t1 },
    sessionCourse: { fontSize: TYPE.micro, color: COLORS.t3, marginTop: 2 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.red + '18', borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs },
    liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.red },
    liveBadgeText: { fontSize: TYPE.micro, fontWeight: FONT.bold, color: COLORS.red },
    focusBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.accent + '14', borderRadius: RADIUS.pill, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs },
    focusBadgeText: { fontSize: TYPE.micro, fontWeight: FONT.bold, color: COLORS.accent },
    sessionMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
    sessionMetaText: { fontSize: TYPE.caption, color: COLORS.t2 },
    sessionActions: { flexDirection: 'row', gap: SPACING.sm },
    sessionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs + 2, paddingVertical: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1 },
    sessionBtnText: { fontSize: TYPE.caption, fontWeight: FONT.bold },
    // Bottom sheet
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.elevated, borderTopLeftRadius: RADIUS.lg + 8, borderTopRightRadius: RADIUS.lg + 8, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, maxHeight: '70%' },
    sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginBottom: SPACING.lg },
    sheetTitle: { fontSize: TYPE.title, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: SPACING.lg },
    sheetEmpty: { fontSize: TYPE.body, color: COLORS.t3, textAlign: 'center', paddingVertical: SPACING.xl },
    sheetItem: { paddingVertical: SPACING.lg - 2, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    sheetItemText: { fontSize: TYPE.body, color: COLORS.t1 },
    sheetItemSub: { fontSize: TYPE.micro, color: COLORS.t3, marginTop: 2 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />

      {/* Course picker */}
      <Modal visible={coursePickerVisible} transparent animationType="slide" onRequestClose={() => setCoursePickerVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setCoursePickerVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Course</Text>
            {courses.length === 0 ? (
              <Text style={styles.sheetEmpty}>No published courses found.</Text>
            ) : (
              <FlatList
                data={courses}
                keyExtractor={c => c.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setForm(prev => ({ ...prev, courseId: item.id, courseName: item.title, courseCode: item.code || '' }));
                      setFormError('');
                      setCoursePickerVisible(false);
                    }}
                    style={styles.sheetItem}
                  >
                    <Text style={[styles.sheetItemText, form.courseId === item.id && { color: COLORS.accent, fontWeight: FONT.bold }]}>{item.title}</Text>
                    <Text style={styles.sheetItemSub}>{item.code}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Platform picker */}
      <Modal visible={platformPickerVisible} transparent animationType="slide" onRequestClose={() => setPlatformPickerVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setPlatformPickerVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Where will class run?</Text>
            {PLATFORMS.map(p => (
              <TouchableOpacity
                key={p.id}
                onPress={() => { update('platform', p.id); update('meetingLink', ''); setPlatformPickerVisible(false); }}
                style={styles.sheetItem}
              >
                <View style={styles.platformRow}>
                  <View style={[styles.platformIcon, { backgroundColor: p.color + '20' }]}>
                    <Ionicons name={p.icon} size={18} color={p.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sheetItemText, form.platform === p.id && { color: COLORS.accent, fontWeight: FONT.bold }]}>{p.label}</Text>
                    {p.id === 'in_app' && <Text style={styles.sheetItemSub}>Students join inside iLearn — attendance tracking works best here</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScreenHeader title="Live Classes" onBack={() => navigation.goBack()} />

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
          <Card style={styles.infoCard}>
            <Ionicons name="information-circle" size={18} color={COLORS.accent} />
            <Text style={styles.infoText}>
              Enrolled students are notified immediately, get a 5-minute reminder, and a "class is live" alert when you go live.
            </Text>
          </Card>

          <Text style={styles.label}>Course *</Text>
          <TouchableOpacity onPress={() => setCoursePickerVisible(true)} style={styles.selector}>
            <Text style={form.courseId ? styles.selectorValue : styles.selectorPlaceholder}>
              {form.courseName || 'Select a course'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={COLORS.t3} />
          </TouchableOpacity>

          <Input
            label="Session Title *"
            placeholder="e.g. Week 3 Live Tutorial"
            value={form.title}
            onChangeText={v => update('title', v)}
          />

          <Input
            label="Description"
            placeholder="What will you cover in this session?"
            value={form.description}
            onChangeText={v => update('description', v)}
            multiline
            rows={3}
          />

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

          {isInApp ? (
            <View style={styles.autoLinkCard}>
              <Ionicons name="sparkles" size={16} color={COLORS.accent} />
              <Text style={styles.autoLinkText}>
                A private video room is created automatically. Students join with one tap inside the app — no links to share.
              </Text>
            </View>
          ) : (
            <Input
              label="Meeting Link *"
              placeholder={selectedPlatform.hint}
              value={form.meetingLink}
              onChangeText={v => update('meetingLink', v)}
              autoCapitalize="none"
              keyboardType="url"
            />
          )}

          {/* Focus mode */}
          <View style={styles.focusRow}>
            <Ionicons name="eye" size={20} color={form.focusMode ? COLORS.accent : COLORS.t3} />
            <View style={{ flex: 1 }}>
              <Text style={styles.focusTitle}>Focus mode</Text>
              <Text style={styles.focusDesc}>
                Track attendance live: green = in class, amber = switched apps, red = left. Students are told tracking is on.
              </Text>
            </View>
            <Switch
              value={form.focusMode}
              onValueChange={v => { haptic.light(); update('focusMode', v); }}
              trackColor={{ false: COLORS.border, true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.dateTimeRow}>
            <View style={{ flex: 1 }}>
              <Input label="Date *" placeholder="YYYY-MM-DD" value={form.date} onChangeText={v => update('date', v)} keyboardType="numbers-and-punctuation" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Time *" placeholder="HH:MM" value={form.time} onChangeText={v => update('time', v)} keyboardType="numbers-and-punctuation" />
            </View>
          </View>
          <Text style={styles.dateHint}>24-hour format · e.g. 14:30 for 2:30 PM</Text>

          <Input label="Duration (minutes)" placeholder="60" value={form.durationMin} onChangeText={v => update('durationMin', v)} keyboardType="number-pad" />

          {!!formError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}

          <View style={{ height: SPACING.sm }} />
          <Button onPress={handleSubmit} loading={saving} icon="calendar">
            Schedule Live Class
          </Button>
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {upcomingSessions.length === 0 ? (
            <EmptyState icon="calendar-outline" title="No upcoming sessions" message="Schedule a live class from the Schedule tab." />
          ) : (
            upcomingSessions.map(session => {
              const platform = PLATFORMS.find(p => p.id === session.platform) || PLATFORMS[4];
              const isLive = session.status === 'LIVE';
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
                    {isLive && (
                      <View style={styles.liveBadge}>
                        <View style={styles.liveBadgeDot} />
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                      </View>
                    )}
                    {session.focusMode && !isLive && (
                      <View style={styles.focusBadge}>
                        <Ionicons name="eye" size={10} color={COLORS.accent} />
                        <Text style={styles.focusBadgeText}>FOCUS</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.sessionMeta}>
                    <Ionicons name="time-outline" size={13} color={COLORS.t3} />
                    <Text style={styles.sessionMetaText}>{formatSessionDate(session.scheduledAt)}</Text>
                    {session.durationMin && <Text style={styles.sessionMetaText}>· {session.durationMin} min</Text>}
                  </View>

                  <View style={styles.sessionActions}>
                    {isLive ? (
                      <>
                        <TouchableOpacity
                          onPress={() => session.platform === 'in_app'
                            ? navigation.navigate('LiveClassroom', { session })
                            : openLink(session.meetingLink)}
                          style={[styles.sessionBtn, { borderColor: COLORS.red, backgroundColor: COLORS.red + '15' }]}
                        >
                          <Ionicons name="videocam" size={14} color={COLORS.red} />
                          <Text style={[styles.sessionBtnText, { color: COLORS.red }]}>Enter Class</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('LiveAttendance', { sessionId: session.id })}
                          style={[styles.sessionBtn, { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '12' }]}
                        >
                          <Ionicons name="people" size={14} color={COLORS.accent} />
                          <Text style={[styles.sessionBtnText, { color: COLORS.accent }]}>Attendance</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() => handleGoLive(session)}
                          disabled={starting === session.id}
                          style={[styles.sessionBtn, { borderColor: COLORS.green, backgroundColor: COLORS.green + '14' }]}
                        >
                          <Ionicons name="radio" size={14} color={COLORS.green} />
                          <Text style={[styles.sessionBtnText, { color: COLORS.green }]}>
                            {starting === session.id ? 'Starting…' : 'Go Live'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleCancel(session)}
                          disabled={cancelling === session.id}
                          style={[styles.sessionBtn, { borderColor: COLORS.border }]}
                        >
                          <Text style={[styles.sessionBtnText, { color: COLORS.t2 }]}>
                            {cancelling === session.id ? 'Cancelling…' : 'Cancel'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </Card>
              );
            })
          )}
          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
