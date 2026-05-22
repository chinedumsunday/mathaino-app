import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal,
  KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Avatar, Button, Toast, useToast } from '../components/UI';
import { apiCourseSubmissions, apiGradeSubmission } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function SubmissionsScreen({ route, navigation }) {
  const { colors: COLORS } = useTheme();
  const { courseId } = route.params || {};

  const STATUS_COLOR = useMemo(() => ({
    SUBMITTED: COLORS.accent,
    GRADED:    COLORS.green,
    RETURNED:  COLORS.blue,
  }), [COLORS]);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [filter, setFilter]           = useState('ALL');

  // Grade modal
  const [gradeModal, setGradeModal]   = useState({ visible: false, submission: null, grade: '', feedback: '' });
  const [grading, setGrading]         = useState(false);
  const [gradeError, setGradeError]   = useState('');
  const { toast, showToast }          = useToast();

  const load = useCallback(async () => {
    try {
      const res = await apiCourseSubmissions(courseId);
      setSubmissions(res.data?.submissions || []);
    } catch (e) {
      showToast(e.message || 'Could not load submissions.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const handleGrade = async () => {
    const { submission, grade, feedback } = gradeModal;
    const gradeNum = parseInt(grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
      setGradeError('Grade must be a number between 0 and 100.');
      return;
    }
    setGradeError('');
    setGrading(true);
    try {
      const res = await apiGradeSubmission(submission.content.id, submission.id, {
        grade: gradeNum,
        ...(feedback.trim() && { feedback: feedback.trim() }),
      });
      setSubmissions(s => s.map(sub =>
        sub.id === submission.id ? { ...sub, ...res.data.submission } : sub
      ));
      setGradeModal({ visible: false, submission: null, grade: '', feedback: '' });
      showToast('Submission graded — student notified', 'success');
    } catch (e) {
      setGradeError(e.message || 'Could not grade submission.');
    } finally {
      setGrading(false);
    }
  };

  const filtered = filter === 'ALL' ? submissions : submissions.filter(s => s.status === filter);
  const counts   = {
    ALL: submissions.length,
    SUBMITTED: submissions.filter(s => s.status === 'SUBMITTED').length,
    GRADED: submissions.filter(s => s.status === 'GRADED').length,
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.xl, paddingVertical: 12 },
    filterChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    filterChipText: { fontSize: 12, color: COLORS.t3, fontWeight: FONT.medium },
    filterChipTextActive: { color: '#000', fontWeight: FONT.bold },
    card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    studentName: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t1 },
    lessonName: { fontSize: 11, color: COLORS.t3, marginTop: 1 },
    statusBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: FONT.bold },
    submissionText: { fontSize: 12, color: COLORS.t2, lineHeight: 18, marginBottom: 8, backgroundColor: '#0A0A0A', padding: 10, borderRadius: RADIUS.md },
    fileLink: { fontSize: 11, color: COLORS.blue, marginBottom: 8 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    submittedAt: { fontSize: 10, color: COLORS.t3, flex: 1 },
    gradePill: { fontSize: 13, fontWeight: FONT.extrabold },
    gradeBtn: { backgroundColor: COLORS.accent, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10 },
    gradeBtnText: { fontSize: 12, fontWeight: FONT.bold, color: '#000' },
    feedbackBox: { marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
    feedbackLabel: { fontSize: 10, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 3 },
    feedbackText: { fontSize: 12, color: COLORS.t2 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 14, color: COLORS.t3, marginTop: 12 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalSheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.xl },
    modalHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 17, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 4 },
    modalSub: { fontSize: 12, color: COLORS.t3, marginBottom: 16 },
    modalLabel: { fontSize: 11, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 6, marginTop: 14 },
    modalInput: { backgroundColor: '#111', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: COLORS.t1 },
    modalInputMulti: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
    modalBtn: { flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, alignItems: 'center' },
    modalBtnPrimary: { backgroundColor: COLORS.accent },
    modalBtnPrimaryText: { fontSize: 14, fontWeight: FONT.bold, color: '#000' },
    modalBtnSecondary: { backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: COLORS.border },
    modalBtnSecondaryText: { fontSize: 14, fontWeight: FONT.medium, color: COLORS.t2 },
  }), [COLORS]);

  const renderItem = ({ item }) => {
    const studentName = `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim();
    const statusColor = STATUS_COLOR[item.status] || COLORS.t3;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Avatar size={36} name={studentName} color={COLORS.teal} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.lessonName} numberOfLines={1}>{item.content?.title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '25' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        {item.text && (
          <Text style={styles.submissionText} numberOfLines={3}>{item.text}</Text>
        )}
        {item.fileUrl && (
          <Text style={styles.fileLink} numberOfLines={1}>{item.fileUrl}</Text>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.submittedAt}>
            {new Date(item.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.grade !== null && item.grade !== undefined && (
            <Text style={[styles.gradePill, { color: item.grade >= 50 ? COLORS.green : COLORS.red }]}>
              {item.grade}/100
            </Text>
          )}
          {item.status !== 'GRADED' && (
            <TouchableOpacity
              onPress={() => setGradeModal({ visible: true, submission: item, grade: '', feedback: '' })}
              style={styles.gradeBtn}
            >
              <Text style={styles.gradeBtnText}>Grade</Text>
            </TouchableOpacity>
          )}
          {item.status === 'GRADED' && (
            <TouchableOpacity
              onPress={() => setGradeModal({ visible: true, submission: item, grade: String(item.grade || ''), feedback: item.feedback || '' })}
              style={[styles.gradeBtn, { backgroundColor: '#1A1A1A' }]}
            >
              <Text style={[styles.gradeBtnText, { color: COLORS.t3 }]}>Edit Grade</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.feedback && (
          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackLabel}>Your feedback</Text>
            <Text style={styles.feedbackText}>{item.feedback}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submissions</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {['ALL', 'SUBMITTED', 'GRADED'].map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f} ({counts[f]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={40} color={COLORS.t3} />
              <Text style={styles.emptyText}>
                {filter === 'ALL' ? 'No submissions yet' : `No ${filter.toLowerCase()} submissions`}
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}

      {/* Grade Modal */}
      <Modal
        visible={gradeModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setGradeModal(s => ({ ...s, visible: false }))}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Grade Submission</Text>
            {gradeModal.submission && (
              <Text style={styles.modalSub}>
                {`${gradeModal.submission.user?.firstName} ${gradeModal.submission.user?.lastName}`} — {gradeModal.submission.content?.title}
              </Text>
            )}

            <Text style={styles.modalLabel}>Grade (0–100) *</Text>
            <TextInput
              value={gradeModal.grade}
              onChangeText={v => setGradeModal(s => ({ ...s, grade: v.replace(/[^0-9]/g, '') }))}
              placeholder="e.g. 85"
              placeholderTextColor="#555"
              style={styles.modalInput}
              keyboardType="numeric"
              maxLength={3}
              autoFocus
            />

            <Text style={styles.modalLabel}>Feedback (optional)</Text>
            <TextInput
              value={gradeModal.feedback}
              onChangeText={v => setGradeModal(s => ({ ...s, feedback: v }))}
              placeholder="Write constructive feedback for the student..."
              placeholderTextColor="#555"
              style={[styles.modalInput, styles.modalInputMulti]}
              multiline
              numberOfLines={4}
            />

            {!!gradeError && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.red + '15', borderRadius: 8, padding: 10, marginTop: 8 }}>
                <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} />
                <Text style={{ fontSize: 12, color: COLORS.red, flex: 1 }}>{gradeError}</Text>
              </View>
            )}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => { setGradeModal(s => ({ ...s, visible: false })); setGradeError(''); }} style={[styles.modalBtn, styles.modalBtnSecondary]}>
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGrade} disabled={grading} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                {grading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.modalBtnPrimaryText}>Submit Grade</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

