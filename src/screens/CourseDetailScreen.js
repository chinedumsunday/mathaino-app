import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS, progressColor } from '../utils/theme';
import { Avatar, ProgressBar, Card, Button, Badge, Toast, useToast } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  apiGetCourse, apiEnroll, apiCreateModule, apiCreateContent,
  apiGetCertificate, apiListDiscussions, apiCreateDiscussion,
  apiDeleteDiscussion, apiCreateReply, apiDeleteReply,
  apiTogglePublish, apiCourseStudents, apiUnregisterStudent,
  apiApproveEnrollment,
} from '../services/api';

const CONTENT_TYPES = ['VIDEO', 'DOCUMENT', 'QUIZ', 'ASSIGNMENT'];

// ── Default empty quiz question ──
const emptyQ = () => ({ q: '', options: ['', '', '', ''], correct: 0 });

export default function CourseDetailScreen({ route, navigation }) {
  const { colors: COLORS } = useTheme();
  const { user, addXp } = useAuth();
  const courseId  = route.params?.courseId;
  const preloaded = route.params?.course;

  const [course, setCourse]         = useState(preloaded || null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading]       = useState(!!courseId && !preloaded);
  const [enrolling, setEnrolling]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedModule, setExpandedModule] = useState(0);
  const [activeTab, setActiveTab]   = useState('Modules');
  const [saving, setSaving]         = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [publishing, setPublishing] = useState(false);

  // Discussion state
  const [discussions, setDiscussions]     = useState([]);
  const [discLoading, setDiscLoading]     = useState(false);
  const [newPost, setNewPost]             = useState('');
  const [posting, setPosting]             = useState(false);
  const [expandedDisc, setExpandedDisc]   = useState(null);
  const [replyText, setReplyText]         = useState({});
  const [replyingTo, setReplyingTo]       = useState(null);

  const [deleteDiscId, setDeleteDiscId] = useState(null);
  const { toast, showToast } = useToast();

  // Students tab (managers only)
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null); // enrollment row
  const [removeReason, setRemoveReason] = useState('');
  const [removing, setRemoving] = useState(false);

  const CONTENT_ICON = useMemo(() => ({
    VIDEO:        { name: 'play-circle',      color: COLORS.teal },
    QUIZ:         { name: 'checkmark-circle', color: COLORS.accent },
    DOCUMENT:     { name: 'document-text',    color: COLORS.blue },
    ASSIGNMENT:   { name: 'create',           color: COLORS.pink },
    LIVE_SESSION: { name: 'radio',            color: COLORS.red },
  }), [COLORS]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    hero: { height: 150, backgroundColor: COLORS.elevated, alignItems: 'center', justifyContent: 'center' },
    heroEmoji: { fontSize: 64 },
    backBtn: { position: 'absolute', top: 14, left: 14 },
    content: { padding: SPACING.xl },
    title: { fontSize: 20, fontWeight: FONT.extrabold, color: COLORS.t1 },
    code: { fontSize: 12, color: COLORS.t3, marginTop: 2, marginBottom: 8 },
    desc: { fontSize: 12, color: COLORS.t2, lineHeight: 20, marginBottom: 14 },
    lecturerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    lecName: { fontSize: 13, color: COLORS.t1, fontWeight: FONT.semibold },
    lecDept: { fontSize: 11, color: COLORS.t3 },
    statsCard: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, marginBottom: 18 },
    statItem: { flex: 1, alignItems: 'center' },
    statBorder: { borderRightWidth: 1, borderRightColor: COLORS.border },
    statNum: { fontSize: 18, fontWeight: FONT.extrabold },
    statLabel: { fontSize: 10, color: COLORS.t3, marginTop: 2 },
    certBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent + '15', borderWidth: 1, borderColor: COLORS.accent + '40', borderRadius: RADIUS.lg, padding: 14, marginBottom: 16 },
    certEmoji: { fontSize: 28 },
    certTitle: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.accent },
    certSub: { fontSize: 11, color: COLORS.t2, marginTop: 2 },
    tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 18 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: COLORS.accent },
    tabText: { fontSize: 11, color: COLORS.t3, fontWeight: FONT.regular },
    tabTextActive: { color: COLORS.t1, fontWeight: FONT.bold },
    moduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 14 },
    moduleHeaderExpanded: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    moduleNum: { fontSize: 12, fontWeight: FONT.extrabold, color: COLORS.accent, minWidth: 24 },
    moduleTitle: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1, flex: 1 },
    moduleLessonCount: { fontSize: 10, color: COLORS.t3, marginRight: 4 },
    lessonList: { backgroundColor: COLORS.elevated, borderWidth: 1, borderTopWidth: 0, borderColor: COLORS.border, borderBottomLeftRadius: RADIUS.lg, borderBottomRightRadius: RADIUS.lg, paddingVertical: 6 },
    lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16, paddingLeft: 50 },
    lessonTitle: { fontSize: 12, color: COLORS.t2, flex: 1 },
    lessonDone: { textDecorationLine: 'line-through', color: COLORS.green },
    lessonDur: { fontSize: 10, color: COLORS.t3 },
    addLessonBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 50, borderTopWidth: 1, borderTopColor: COLORS.border },
    addLessonBtnText: { fontSize: 12, color: COLORS.teal, fontWeight: FONT.medium },
    addModuleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderColor: COLORS.accent + '40', borderRadius: RADIUS.lg, borderStyle: 'dashed', marginTop: 4 },
    addModuleBtnText: { fontSize: 13, color: COLORS.accent, fontWeight: FONT.semibold },
    submissionsLink: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 14, marginTop: 12 },
    submissionsLinkText: { flex: 1, fontSize: 13, color: COLORS.accent, fontWeight: FONT.semibold },
    publishBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, padding: 12, marginBottom: 16, borderWidth: 1 },
    publishedBanner: { backgroundColor: COLORS.green + '10', borderColor: COLORS.green + '30' },
    draftBanner: { backgroundColor: COLORS.orange + '10', borderColor: COLORS.orange + '30' },
    publishBannerText: { fontSize: 12, fontWeight: FONT.semibold },
    publishBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10 },
    publishBtnText: { fontSize: 12, fontWeight: FONT.bold },
    tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#0A0A1A', borderRadius: RADIUS.md, padding: 12, marginTop: 10, marginBottom: 4 },
    tipText: { flex: 1, fontSize: 11, color: COLORS.t2, lineHeight: 17 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, paddingHorizontal: SPACING.xl, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border },
    completedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    completedBadgeText: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.teal },
    certBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    certBtnText: { fontSize: 13, fontWeight: FONT.bold, color: '#000' },
    // Discussion
    postInput: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 10, marginBottom: 16 },
    postTextInput: { flex: 1, color: COLORS.t1, fontSize: 13, maxHeight: 100 },
    postBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
    discCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 14, marginBottom: 10 },
    discHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    discAuthor: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    discTime: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
    discBody: { fontSize: 13, color: COLORS.t2, lineHeight: 20, marginBottom: 10 },
    discReplyToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    discReplyToggleText: { fontSize: 11, color: COLORS.t3 },
    repliesSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
    replyRow: { flexDirection: 'row', marginBottom: 10 },
    replyAuthor: { fontSize: 11, fontWeight: FONT.semibold, color: COLORS.t2 },
    replyBody: { fontSize: 12, color: COLORS.t3, marginTop: 2 },
    replyInput: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    replyTextInput: { flex: 1, backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: COLORS.t1 },
    replyBtn: { padding: 8 },
    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.xl, maxHeight: '90%' },
    modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 17, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 20 },
    modalLabel: { fontSize: 11, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 6, marginTop: 14 },
    modalInput: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: COLORS.t1 },
    modalInputMulti: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.elevated },
    typeChipText: { fontSize: 11, color: COLORS.t3, fontWeight: FONT.medium },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
    modalBtn: { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: 'center' },
    modalBtnPrimary: { backgroundColor: COLORS.accent },
    modalBtnPrimaryText: { fontSize: 14, fontWeight: FONT.bold, color: '#000' },
    modalBtnSecondary: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border },
    modalBtnSecondaryText: { fontSize: 14, fontWeight: FONT.medium, color: COLORS.t2 },
    // Quiz builder
    questionBlock: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, marginBottom: 12 },
    questionNum: { fontSize: 11, fontWeight: FONT.bold, color: COLORS.accent },
    radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.t3, alignItems: 'center', justifyContent: 'center' },
    radioOuterActive: { borderColor: COLORS.accent },
    radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
    addQuestionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accent + '40', borderRadius: RADIUS.md, borderStyle: 'dashed' },
    addQuestionBtnText: { fontSize: 12, color: COLORS.accent, fontWeight: FONT.semibold },
    // Students tab
    studentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 12, marginBottom: 8 },
    studentName: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    studentMeta: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
    studentIconBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: COLORS.red + '40', alignItems: 'center', justifyContent: 'center' },
    // Confirm dialog
    confirmOverlay: { flex: 1, backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center', padding: 32 },
    confirmBox: { width: '100%', backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
    confirmTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 10 },
    confirmMsg: { fontSize: 13, color: COLORS.t3, lineHeight: 20, marginBottom: 24 },
    confirmActions: { flexDirection: 'row', gap: 10 },
    confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
    confirmCancel: { borderColor: COLORS.border },
    confirmCancelText: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t2 },
    confirmDanger: { borderColor: COLORS.red, backgroundColor: COLORS.red + '18' },
    confirmDangerText: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.red },
  }), [COLORS]);

  // Add Module modal
  const [modModal, setModModal] = useState({ visible: false, title: '' });

  // Add Content modal (with quiz builder)
  const emptyContent = { visible: false, moduleId: null, title: '', type: 'DOCUMENT', mediaUrl: '', body: '', durationMin: '', quizQuestions: [emptyQ()] };
  const [contentModal, setContentModal] = useState(emptyContent);

  const load = useCallback(async () => {
    const id = courseId || preloaded?.id;
    if (!id) return;
    try {
      const res = await apiGetCourse(id);
      setCourse(res.data.course);
      setEnrollment(res.data.enrollment);
    } catch (e) {
      if (!preloaded) {
        showToast('Could not load course details.', 'error');
        setTimeout(() => navigation.goBack(), 1500);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId, preloaded?.id]);

  useEffect(() => { load(); }, [load]);

  // Load certificate if enrolled
  useEffect(() => {
    const id = courseId || preloaded?.id;
    if (!id || !enrollment) return;
    apiGetCertificate(id)
      .then(res => { if (res.data?.certificate) setCertificate(res.data.certificate); })
      .catch(() => {});
  }, [courseId, preloaded?.id, enrollment?.status]);

  const loadDiscussions = useCallback(async () => {
    const id = courseId || preloaded?.id;
    if (!id) return;
    setDiscLoading(true);
    try {
      const res = await apiListDiscussions(id);
      setDiscussions(res.data?.discussions || []);
    } catch (_) {}
    finally { setDiscLoading(false); }
  }, [courseId, preloaded?.id]);

  useEffect(() => {
    if (activeTab === 'Discussion') loadDiscussions();
  }, [activeTab, loadDiscussions]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const handleEnroll = async () => {
    if (!course) return;
    setEnrolling(true);
    try {
      await apiEnroll(course.id);
      setEnrollment({ status: 'PENDING', progress: 0 });
      showToast('Request sent! You\'ll be notified once the lecturer approves.', 'success');
    } catch (e) {
      showToast(e.message || 'Could not send the request. Please try again.', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  // ── Students tab (managers) ──
  const loadStudents = useCallback(async () => {
    const id = courseId || preloaded?.id;
    if (!id) return;
    setStudentsLoading(true);
    try {
      const res = await apiCourseStudents(id, { limit: 100 });
      setStudents(res.data?.enrollments || []);
    } catch (_) {}
    finally { setStudentsLoading(false); }
  }, [courseId, preloaded?.id]);

  useEffect(() => {
    if (activeTab === 'Students' && canManage) loadStudents();
  }, [activeTab, canManage, loadStudents]);

  const confirmRemoveStudent = async () => {
    const target = removeTarget;
    if (!target) return;
    setRemoving(true);
    try {
      await apiUnregisterStudent(course.id, target.user.id, removeReason.trim() || undefined);
      setStudents(prev => prev.filter(s => s.id !== target.id));
      showToast(`${target.user.firstName} was unregistered from this course.`, 'success');
      setRemoveTarget(null);
      setRemoveReason('');
    } catch (e) {
      showToast(e.message || 'Could not unregister the student.', 'error');
    } finally {
      setRemoving(false);
    }
  };

  const handleApproveStudent = async (enrollmentRow, action) => {
    try {
      await apiApproveEnrollment(enrollmentRow.id, action);
      if (action === 'approve') {
        setStudents(prev => prev.map(s => (s.id === enrollmentRow.id ? { ...s, status: 'ENROLLED' } : s)));
        showToast(`${enrollmentRow.user.firstName} approved.`, 'success');
      } else {
        setStudents(prev => prev.filter(s => s.id !== enrollmentRow.id));
        showToast('Request declined.', 'info');
      }
    } catch (e) {
      showToast(e.message || 'Action failed.', 'error');
    }
  };

  // ── Add Module ──
  const handleAddModule = async () => {
    const title = modModal.title.trim();
    if (!title) { showToast('Module title cannot be empty.', 'error'); return; }
    setSaving(true);
    try {
      const res = await apiCreateModule(course.id, { title });
      setCourse(c => ({ ...c, modules: [...(c.modules || []), { ...res.data.module, contents: [] }] }));
      setModModal({ visible: false, title: '' });
      setExpandedModule((course?.modules?.length || 0));
    } catch (e) {
      showToast(e.message || 'Could not add module.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Add Content ──
  const handleAddContent = async () => {
    const title = contentModal.title.trim();
    if (!title) { showToast('Lesson title cannot be empty.', 'error'); return; }
    setSaving(true);
    try {
      let body = contentModal.body.trim() || undefined;

      // For QUIZ: serialize questions to JSON
      if (contentModal.type === 'QUIZ') {
        const qs = contentModal.quizQuestions.filter(q => q.q.trim());
        if (qs.length === 0) { showToast('Add at least one question for the quiz.', 'error'); setSaving(false); return; }
        body = JSON.stringify(qs);
      }

      const payload = {
        title,
        type: contentModal.type,
        ...(contentModal.mediaUrl.trim() && { mediaUrl: contentModal.mediaUrl.trim() }),
        ...(body && { body }),
        ...(contentModal.durationMin && { durationMin: parseInt(contentModal.durationMin) }),
      };
      const res = await apiCreateContent(contentModal.moduleId, payload);
      setCourse(c => ({
        ...c,
        modules: c.modules.map(m =>
          m.id === contentModal.moduleId
            ? { ...m, contents: [...(m.contents || []), res.data.content] }
            : m
        ),
      }));
      setContentModal(emptyContent);
    } catch (e) {
      showToast(e.message || 'Could not add lesson.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Discussion: Post ──
  const handlePost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const res = await apiCreateDiscussion(courseId || preloaded?.id, newPost.trim());
      setDiscussions(d => [res.data.discussion, ...d]);
      setNewPost('');
    } catch (e) {
      showToast(e.message || 'Could not post.', 'error');
    } finally {
      setPosting(false);
    }
  };

  // ── Discussion: Reply ──
  const handleReply = async (discId) => {
    const body = replyText[discId]?.trim();
    if (!body) return;
    setReplyingTo(discId);
    try {
      const res = await apiCreateReply(discId, body);
      setDiscussions(d => d.map(disc =>
        disc.id === discId
          ? { ...disc, replies: [...(disc.replies || []), res.data.reply] }
          : disc
      ));
      setReplyText(r => ({ ...r, [discId]: '' }));
    } catch (e) {
      showToast(e.message || 'Could not reply.', 'error');
    } finally {
      setReplyingTo(null);
    }
  };

  // ── Discussion: Delete ──
  const handleDeleteDisc = (id) => setDeleteDiscId(id);

  const confirmDeleteDisc = async () => {
    const id = deleteDiscId;
    setDeleteDiscId(null);
    try {
      await apiDeleteDiscussion(id);
      setDiscussions(d => d.filter(disc => disc.id !== id));
    } catch (e) {
      showToast(e.message || 'Could not delete.', 'error');
    }
  };

  // ── Publish / Unpublish ──
  const handleTogglePublish = async () => {
    if (!course) return;
    setPublishing(true);
    try {
      const res = await apiTogglePublish(course.id);
      setCourse(c => ({ ...c, isPublished: res.data.course.isPublished }));
      showToast(
        res.data.course.isPublished ? 'Course published — students can enroll!' : 'Course saved as draft.',
        'success'
      );
    } catch (e) {
      showToast(e.message || 'Could not update publish status.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // ── Quiz builder helpers ──
  const updateQuestion = (qi, field, value) => {
    setContentModal(s => {
      const qs = [...s.quizQuestions];
      qs[qi] = { ...qs[qi], [field]: value };
      return { ...s, quizQuestions: qs };
    });
  };
  const updateOption = (qi, oi, value) => {
    setContentModal(s => {
      const qs = [...s.quizQuestions];
      const opts = [...qs[qi].options];
      opts[oi] = value;
      qs[qi] = { ...qs[qi], options: opts };
      return { ...s, quizQuestions: qs };
    });
  };
  const addQuestion = () => setContentModal(s => ({ ...s, quizQuestions: [...s.quizQuestions, emptyQ()] }));
  const removeQuestion = (qi) => setContentModal(s => ({
    ...s, quizQuestions: s.quizQuestions.filter((_, i) => i !== qi),
  }));

  const courseEmoji = (c) => {
    if (!c) return '📚';
    const t = (c.title || '').toLowerCase();
    if (t.includes('database') || t.includes('data')) return '📊';
    if (t.includes('machine') || t.includes('ai'))    return '🤖';
    if (t.includes('software') || t.includes('engineer')) return '⚙️';
    if (t.includes('security') || t.includes('cyber')) return '🔐';
    if (t.includes('network')) return '🌐';
    return '📚';
  };

  const contentIcon = (type) => CONTENT_ICON[type] || { name: 'document-text', color: COLORS.blue };

  // canManage must come first — modules display depends on it.
  // Lecturers only manage courses they created; faculty/admin manage all.
  const canManage =
    (user && course?.creator?.id && user.id === course.creator.id) ||
    user?.role === 'FACULTY' ||
    user?.role === 'SUPER_ADMIN';

  const realModules  = course?.modules || [];
  const modules      = realModules;
  const isPending    = enrollment?.status === 'PENDING';
  const isEnrolled   = ['ENROLLED', 'COMPLETED'].includes(enrollment?.status);
  const isCompleted  = enrollment?.status === 'COMPLETED' || (enrollment?.progress || 0) >= 100;
  const progress    = enrollment?.progress || course?.progress || 0;
  const creatorName = course?.creator
    ? `${course.creator.firstName} ${course.creator.lastName}`.trim()
    : (preloaded?.lecturer || 'Instructor');
  const totalLessons = modules.reduce((n, m) => n + (m.contents?.length || 0), 0);
  const TABS = canManage
    ? ['Modules', 'Discussion', 'Description', 'Students']
    : ['Modules', 'Discussion', 'Description'];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.hero}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
          </TouchableOpacity>
        </View>
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!course) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{courseEmoji(course)}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.code}>{course.code}</Text>
          {course.description ? <Text style={styles.desc}>{course.description}</Text> : null}

          {/* Lecturer */}
          <View style={styles.lecturerRow}>
            <Avatar size={30} name={creatorName} color={COLORS.orange} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.lecName}>{creatorName}</Text>
              <Text style={styles.lecDept}>Instructor</Text>
            </View>
            {isEnrolled
              ? <Badge label="Enrolled" color={COLORS.green} />
              : isPending
                ? <Badge label="Pending Approval" color={COLORS.orange} />
                : <Badge label="Not Enrolled" color={COLORS.t3} />
            }
          </View>

          {/* Stats — enrollment numbers are lecturer/admin information only */}
          <View style={styles.statsCard}>
            {[
              { n: course._count?.modules ?? course.modules?.length ?? 0, l: 'Modules', c: COLORS.accent },
              canManage
                ? { n: course._count?.enrollments ?? '—', l: 'Students', c: COLORS.teal }
                : { n: totalLessons, l: 'Lessons', c: COLORS.teal },
              { n: isEnrolled ? `${Math.round(progress)}%` : '—', l: 'Progress', c: COLORS.blue },
            ].map((stat, i) => (
              <View key={i} style={[styles.statItem, i < 2 && styles.statBorder]}>
                <Text style={[styles.statNum, { color: stat.c }]}>{stat.n}</Text>
                <Text style={styles.statLabel}>{stat.l}</Text>
              </View>
            ))}
          </View>

          {/* Progress bar */}
          {isEnrolled && (
            <View style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: COLORS.t3 }}>Overall Progress</Text>
                <Text style={{ fontSize: 12, color: progressColor(progress), fontWeight: FONT.bold }}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <ProgressBar value={progress} height={8} />
            </View>
          )}

          {/* Publish status banner — only for managers */}
          {canManage && (
            <View style={[styles.publishBanner, course?.isPublished ? styles.publishedBanner : styles.draftBanner]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons
                  name={course?.isPublished ? 'checkmark-circle' : 'cloud-outline'}
                  size={16}
                  color={course?.isPublished ? COLORS.green : COLORS.orange}
                />
                <Text style={[styles.publishBannerText, { color: course?.isPublished ? COLORS.green : COLORS.orange }]}>
                  {course?.isPublished ? 'Published — visible to students' : 'Draft — hidden from students'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleTogglePublish}
                disabled={publishing}
                style={[styles.publishBtn, { backgroundColor: course?.isPublished ? COLORS.orange + '20' : COLORS.green + '20' }]}
              >
                <Text style={[styles.publishBtnText, { color: course?.isPublished ? COLORS.orange : COLORS.green }]}>
                  {publishing ? '...' : course?.isPublished ? 'Unpublish' : 'Publish'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Certificate banner */}
          {certificate && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Certificate', { certificate })}
              style={styles.certBanner}
            >
              <Text style={styles.certEmoji}>🏆</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.certTitle}>Course Completed!</Text>
                <Text style={styles.certSub}>Tap to view your certificate</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          )}

          {/* Tabs — Students is management-only */}
          <View style={styles.tabRow}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setActiveTab(t)}
                style={[styles.tab, activeTab === t && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]} numberOfLines={1}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Modules Tab ── */}
          {activeTab === 'Modules' && (
            <>
              {modules.map((mod, i) => {
                const contents = mod.contents || [];
                return (
                  <View key={mod.id} style={{ marginBottom: 8 }}>
                    <TouchableOpacity
                      onPress={() => setExpandedModule(expandedModule === i ? -1 : i)}
                      style={[styles.moduleHeader, expandedModule === i && styles.moduleHeaderExpanded]}
                    >
                      <Text style={styles.moduleNum}>{String(i + 1).padStart(2, '0')}</Text>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleLessonCount}>{contents.length} items</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={COLORS.t3}
                        style={{ transform: [{ rotate: expandedModule === i ? '90deg' : '0deg' }] }}
                      />
                    </TouchableOpacity>
                    {expandedModule === i && (
                      <View style={styles.lessonList}>
                        {contents.length === 0 && !canManage ? (
                          <Text style={{ fontSize: 12, color: COLORS.t3, padding: 14, textAlign: 'center' }}>No content yet</Text>
                        ) : contents.map(item => {
                          const icon = contentIcon(item.type);
                          return (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => isEnrolled || canManage
                                ? navigation.navigate('Lesson', { lesson: item, courseTitle: course.title })
                                : showToast(
                                    isPending
                                      ? 'Your enrollment is awaiting approval — lessons unlock once approved.'
                                      : 'Enroll in this course to access lessons.',
                                    'info'
                                  )
                              }
                              style={styles.lessonRow}
                            >
                              <Ionicons name={icon.name} size={16} color={icon.color} />
                              <Text style={styles.lessonTitle} numberOfLines={1}>{item.title}</Text>
                              {item.durationMin && <Text style={styles.lessonDur}>{item.durationMin}m</Text>}
                            </TouchableOpacity>
                          );
                        })}
                        {canManage && (
                          <TouchableOpacity
                            onPress={() => setContentModal({ ...emptyContent, visible: true, moduleId: mod.id })}
                            style={styles.addLessonBtn}
                          >
                            <Ionicons name="add-circle-outline" size={15} color={COLORS.teal} />
                            <Text style={styles.addLessonBtnText}>Add Lesson</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
              {canManage && (
                <TouchableOpacity onPress={() => setModModal({ visible: true, title: '' })} style={styles.addModuleBtn}>
                  <Ionicons name="add-circle" size={18} color={COLORS.accent} />
                  <Text style={styles.addModuleBtnText}>Add Module</Text>
                </TouchableOpacity>
              )}
              {canManage && modules.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Ionicons name="layers-outline" size={40} color={COLORS.t3} />
                  <Text style={{ color: COLORS.t3, marginTop: 12, fontSize: 14, textAlign: 'center' }}>
                    No modules yet.{'\n'}Tap "+ Add Module" to start building this course.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* ── Discussion Tab ── */}
          {activeTab === 'Discussion' && (
            <View>
              {/* New post input */}
              {(isEnrolled || canManage) ? (
                <View style={styles.postInput}>
                  <TextInput
                    value={newPost}
                    onChangeText={setNewPost}
                    placeholder="Share a question or insight..."
                    placeholderTextColor="#555"
                    style={styles.postTextInput}
                    multiline
                  />
                  <TouchableOpacity
                    onPress={handlePost}
                    disabled={posting || !newPost.trim()}
                    style={[styles.postBtn, (!newPost.trim() || posting) && { opacity: 0.4 }]}
                  >
                    {posting
                      ? <ActivityIndicator size="small" color="#000" />
                      : <Ionicons name="send" size={16} color="#000" />
                    }
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: COLORS.t3, marginBottom: 16, textAlign: 'center' }}>
                  Enroll to participate in discussions
                </Text>
              )}

              {discLoading && <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />}

              {!discLoading && discussions.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Ionicons name="chatbubbles-outline" size={36} color={COLORS.t3} />
                  <Text style={{ color: COLORS.t3, marginTop: 12, fontSize: 13 }}>
                    No discussions yet. Be the first to post!
                  </Text>
                </View>
              )}

              {discussions.map(disc => {
                const authorName = `${disc.user?.firstName || ''} ${disc.user?.lastName || ''}`.trim();
                const isExpanded = expandedDisc === disc.id;
                const canDelete  = disc.userId === user?.id || canManage;
                return (
                  <View key={disc.id} style={styles.discCard}>
                    <View style={styles.discHeader}>
                      <Avatar size={28} name={authorName} color={COLORS.teal} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.discAuthor}>{authorName}</Text>
                        <Text style={styles.discTime}>
                          {disc.user?.role} · {new Date(disc.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {canDelete && (
                        <TouchableOpacity onPress={() => handleDeleteDisc(disc.id)}>
                          <Ionicons name="trash-outline" size={16} color={COLORS.t3} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.discBody}>{disc.body}</Text>

                    {/* Replies */}
                    <TouchableOpacity
                      onPress={() => setExpandedDisc(isExpanded ? null : disc.id)}
                      style={styles.discReplyToggle}
                    >
                      <Ionicons name="chatbubble-outline" size={14} color={COLORS.t3} />
                      <Text style={styles.discReplyToggleText}>
                        {disc._count?.replies ?? disc.replies?.length ?? 0} replies
                      </Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} color={COLORS.t3} />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.repliesSection}>
                        {(disc.replies || []).map(reply => (
                          <View key={reply.id} style={styles.replyRow}>
                            <Avatar size={22} name={`${reply.user?.firstName || ''} ${reply.user?.lastName || ''}`.trim()} color={COLORS.blue} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text style={styles.replyAuthor}>
                                {reply.user?.firstName} {reply.user?.lastName}
                              </Text>
                              <Text style={styles.replyBody}>{reply.body}</Text>
                            </View>
                          </View>
                        ))}
                        {(isEnrolled || canManage) && (
                          <View style={styles.replyInput}>
                            <TextInput
                              value={replyText[disc.id] || ''}
                              onChangeText={v => setReplyText(r => ({ ...r, [disc.id]: v }))}
                              placeholder="Write a reply..."
                              placeholderTextColor="#555"
                              style={styles.replyTextInput}
                            />
                            <TouchableOpacity
                              onPress={() => handleReply(disc.id)}
                              disabled={replyingTo === disc.id}
                              style={styles.replyBtn}
                            >
                              {replyingTo === disc.id
                                ? <ActivityIndicator size="small" color={COLORS.accent} />
                                : <Ionicons name="send" size={14} color={COLORS.accent} />
                              }
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Course Description Tab ── */}
          {activeTab === 'Description' && (
            <View style={{ padding: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 8 }}>
                Course Description
              </Text>
              <Text style={{ fontSize: 13, color: COLORS.t2, lineHeight: 22, marginBottom: 16 }}>
                {course.description || 'No course description has been added yet.'}
              </Text>
              {!isEnrolled && !isPending && !canManage && (
                <Card style={{ backgroundColor: COLORS.accent + '10', borderColor: COLORS.accent + '30' }}>
                  <Text style={{ fontSize: 13, color: COLORS.accent, fontWeight: FONT.semibold, marginBottom: 4 }}>
                    Enroll to unlock all content
                  </Text>
                  <Text style={{ fontSize: 11, color: COLORS.t2 }}>
                    Access all modules, lessons, quizzes, and assignments after enrolling.
                  </Text>
                </Card>
              )}
              {canManage && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('Submissions', { courseId: course.id })}
                  style={styles.submissionsLink}
                >
                  <Ionicons name="document-text-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.submissionsLinkText}>View Student Submissions</Text>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Students Tab (managers only) ── */}
          {activeTab === 'Students' && canManage && (
            <View style={{ padding: 4 }}>
              {studentsLoading ? (
                <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 24 }} />
              ) : students.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                  <Ionicons name="people-outline" size={36} color={COLORS.t3} />
                  <Text style={{ color: COLORS.t3, marginTop: 12, fontSize: 13, textAlign: 'center' }}>
                    No students registered yet.{'\n'}Approved enrollments will appear here.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={{ fontSize: 12, color: COLORS.t3, marginBottom: 12 }}>
                    {students.length} student{students.length === 1 ? '' : 's'} registered
                  </Text>
                  {students.map(en => {
                    const sName = `${en.user?.firstName || ''} ${en.user?.lastName || ''}`.trim();
                    const matric = en.user?.studentProfile?.matricNumber;
                    const pendingRow = en.status === 'PENDING';
                    return (
                      <View key={en.id} style={styles.studentRow}>
                        <Avatar size={38} name={sName} url={en.user?.avatarUrl} color={COLORS.blue} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.studentName}>{sName}</Text>
                          <Text style={styles.studentMeta}>
                            {matric ? `${matric} • ` : ''}{en.user?.email}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <Badge
                              label={pendingRow ? 'Pending' : en.status === 'COMPLETED' ? 'Completed' : 'Enrolled'}
                              color={pendingRow ? COLORS.orange : en.status === 'COMPLETED' ? COLORS.teal : COLORS.green}
                            />
                            {!pendingRow && (
                              <Text style={{ fontSize: 10, color: progressColor(en.progress || 0), fontWeight: FONT.bold }}>
                                {Math.round(en.progress || 0)}%
                              </Text>
                            )}
                          </View>
                        </View>
                        {pendingRow ? (
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity onPress={() => handleApproveStudent(en, 'reject')} style={styles.studentIconBtn}>
                              <Ionicons name="close" size={17} color={COLORS.red} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleApproveStudent(en, 'approve')} style={[styles.studentIconBtn, { borderColor: COLORS.green + '50' }]}>
                              <Ionicons name="checkmark" size={17} color={COLORS.green} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => { setRemoveTarget(en); setRemoveReason(''); }}
                            style={styles.studentIconBtn}
                          >
                            <Ionicons name="person-remove-outline" size={16} color={COLORS.red} />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {canManage ? (
          <Button onPress={() => setModModal({ visible: true, title: '' })}>+ Add Module</Button>
        ) : isCompleted ? (
          <View style={styles.completedBar}>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.teal} />
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Certificate', { certificate })}
              style={styles.certBtn}
            >
              <Ionicons name="ribbon-outline" size={15} color="#000" />
              <Text style={styles.certBtnText}>View Certificate</Text>
            </TouchableOpacity>
          </View>
        ) : isEnrolled ? (
          <Button onPress={() => {
            const firstContent = modules[0]?.contents?.[0];
            if (firstContent) navigation.navigate('Lesson', { lesson: firstContent, courseTitle: course.title });
            else showToast('This course has no lessons added yet.', 'info');
          }}>
            Continue Learning
          </Button>
        ) : isPending ? (
          <Button variant="secondary" disabled>
            ⏳ Awaiting Lecturer Approval
          </Button>
        ) : (
          <Button onPress={handleEnroll} disabled={enrolling}>
            {enrolling ? 'Sending Request...' : 'Request Enrollment — Free'}
          </Button>
        )}
      </View>

      {/* ═══ Delete Discussion Confirm Modal ═══ */}
      <Modal visible={!!deleteDiscId} transparent animationType="fade" onRequestClose={() => setDeleteDiscId(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Delete Post?</Text>
            <Text style={styles.confirmMsg}>This post and all its replies will be permanently removed.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={() => setDeleteDiscId(null)} style={[styles.confirmBtn, styles.confirmCancel]}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDeleteDisc} style={[styles.confirmBtn, styles.confirmDanger]}>
                <Text style={styles.confirmDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ Unregister Student Modal ═══ */}
      <Modal visible={!!removeTarget} transparent animationType="fade" onRequestClose={() => setRemoveTarget(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Unregister student?</Text>
            <Text style={styles.confirmMsg}>
              {removeTarget ? `${removeTarget.user.firstName} ${removeTarget.user.lastName}` : ''} will be removed
              from this course and notified. You can add a short note — for example, advising them to switch
              to a course that fits them better.
            </Text>
            <TextInput
              value={removeReason}
              onChangeText={setRemoveReason}
              placeholder="Optional note to the student..."
              placeholderTextColor="#555"
              style={[styles.modalInput, { marginBottom: 18 }]}
              multiline
            />
            <View style={styles.confirmActions}>
              <TouchableOpacity onPress={() => setRemoveTarget(null)} style={[styles.confirmBtn, styles.confirmCancel]}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmRemoveStudent} disabled={removing} style={[styles.confirmBtn, styles.confirmDanger]}>
                {removing
                  ? <ActivityIndicator size="small" color={COLORS.red} />
                  : <Text style={styles.confirmDangerText}>Unregister</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ Add Module Modal ═══ */}
      <Modal visible={modModal.visible} transparent animationType="slide" onRequestClose={() => setModModal({ visible: false, title: '' })}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Module</Text>
            <Text style={styles.modalLabel}>Module Title *</Text>
            <TextInput
              value={modModal.title}
              onChangeText={v => setModModal(s => ({ ...s, title: v }))}
              placeholder="e.g. Introduction to the Course"
              placeholderTextColor="#555"
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setModModal({ visible: false, title: '' })} style={[styles.modalBtn, styles.modalBtnSecondary]}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddModule} disabled={saving} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.modalBtnPrimaryText}>Add Module</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ Add Content Modal ═══ */}
      <Modal visible={contentModal.visible} transparent animationType="slide" onRequestClose={() => setContentModal(emptyContent)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <ScrollView style={styles.modalSheet} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Lesson</Text>

            <Text style={styles.modalLabel}>Lesson Title *</Text>
            <TextInput
              value={contentModal.title}
              onChangeText={v => setContentModal(s => ({ ...s, title: v }))}
              placeholder="e.g. Introduction to Variables"
              placeholderTextColor="#555"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Type</Text>
            <View style={styles.typeRow}>
              {CONTENT_TYPES.map(t => {
                const active = contentModal.type === t;
                const icon   = CONTENT_ICON[t] || { name: 'document-text', color: COLORS.blue };
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setContentModal(s => ({ ...s, type: t }))}
                    style={[styles.typeChip, active && { borderColor: icon.color, backgroundColor: icon.color + '20' }]}
                  >
                    <Ionicons name={icon.name} size={13} color={active ? icon.color : COLORS.t3} />
                    <Text style={[styles.typeChipText, active && { color: icon.color }]}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Video hosting tip */}
            {contentModal.type === 'VIDEO' && (
              <View style={styles.tipBox}>
                <Ionicons name="information-circle-outline" size={15} color={COLORS.blue} />
                <Text style={styles.tipText}>
                  Paste a link from YouTube, Vimeo, Google Drive, or Dropbox — or a direct video file (.mp4). It plays right inside the app for students.
                </Text>
              </View>
            )}
            {contentModal.type === 'ASSIGNMENT' && (
              <View style={styles.tipBox}>
                <Ionicons name="information-circle-outline" size={15} color={COLORS.pink} />
                <Text style={styles.tipText}>
                  Write clear instructions in the text box. Students will submit their answer as text or a file link (Google Drive, etc.).
                </Text>
              </View>
            )}

            {/* Quiz Question Builder */}
            {contentModal.type === 'QUIZ' ? (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.modalLabel, { marginTop: 4 }]}>Quiz Questions *</Text>
                {contentModal.quizQuestions.map((q, qi) => (
                  <View key={qi} style={styles.questionBlock}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.questionNum}>Q{qi + 1}</Text>
                      {contentModal.quizQuestions.length > 1 && (
                        <TouchableOpacity onPress={() => removeQuestion(qi)} style={{ marginLeft: 'auto' }}>
                          <Ionicons name="close-circle-outline" size={18} color={COLORS.t3} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      value={q.q}
                      onChangeText={v => updateQuestion(qi, 'q', v)}
                      placeholder="Question text..."
                      placeholderTextColor="#555"
                      style={styles.modalInput}
                    />
                    <Text style={[styles.modalLabel, { marginTop: 10 }]}>Options (tap radio to set correct answer)</Text>
                    {q.options.map((opt, oi) => (
                      <View key={oi} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <TouchableOpacity onPress={() => updateQuestion(qi, 'correct', oi)}>
                          <View style={[styles.radioOuter, q.correct === oi && styles.radioOuterActive]}>
                            {q.correct === oi && <View style={styles.radioInner} />}
                          </View>
                        </TouchableOpacity>
                        <TextInput
                          value={opt}
                          onChangeText={v => updateOption(qi, oi, v)}
                          placeholder={`Option ${oi + 1}`}
                          placeholderTextColor="#555"
                          style={[styles.modalInput, { flex: 1 }]}
                        />
                      </View>
                    ))}
                  </View>
                ))}
                <TouchableOpacity onPress={addQuestion} style={styles.addQuestionBtn}>
                  <Ionicons name="add-circle-outline" size={16} color={COLORS.accent} />
                  <Text style={styles.addQuestionBtnText}>Add Question</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.modalLabel}>
                  {contentModal.type === 'VIDEO' ? 'Video URL' : contentModal.type === 'DOCUMENT' ? 'Resource URL (optional)' : 'Reference URL (optional)'}
                </Text>
                <TextInput
                  value={contentModal.mediaUrl}
                  onChangeText={v => setContentModal(s => ({ ...s, mediaUrl: v }))}
                  placeholder="https://..."
                  placeholderTextColor="#555"
                  style={styles.modalInput}
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <Text style={styles.modalLabel}>
                  {contentModal.type === 'ASSIGNMENT' ? 'Assignment Instructions' : 'Content / Notes (optional)'}
                </Text>
                <TextInput
                  value={contentModal.body}
                  onChangeText={v => setContentModal(s => ({ ...s, body: v }))}
                  placeholder={contentModal.type === 'ASSIGNMENT' ? 'Describe the assignment task...' : 'Lesson text, notes, or description...'}
                  placeholderTextColor="#555"
                  style={[styles.modalInput, styles.modalInputMulti]}
                  multiline
                  numberOfLines={4}
                />
              </>
            )}

            <Text style={styles.modalLabel}>Duration (minutes)</Text>
            <TextInput
              value={contentModal.durationMin}
              onChangeText={v => setContentModal(s => ({ ...s, durationMin: v.replace(/[^0-9]/g, '') }))}
              placeholder="e.g. 15"
              placeholderTextColor="#555"
              style={styles.modalInput}
              keyboardType="numeric"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setContentModal(emptyContent)} style={[styles.modalBtn, styles.modalBtnSecondary]}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddContent} disabled={saving} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                {saving ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.modalBtnPrimaryText}>Add Lesson</Text>}
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

