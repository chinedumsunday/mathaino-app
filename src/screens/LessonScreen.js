import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Button, Toast, useToast, VideoPlayer } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  apiGetContent, apiMarkComplete, apiGetCompletion,
  apiSubmitQuiz, apiGetQuizAttempts,
  apiSubmitAssignment, apiGetSubmission,
} from '../services/api';

// ─── Quiz Component ──────────────────────────────────────────────────────────
function QuizPanel({ contentId, questions, onPassed }) {
  const { colors: COLORS } = useTheme();
  const [selected, setSelected]     = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [bestAttempt, setBestAttempt] = useState(null);
  const [quizError, setQuizError]   = useState('');

  useEffect(() => {
    apiGetQuizAttempts(contentId)
      .then(res => {
        const attempts = res.data?.attempts || [];
        const best = attempts.reduce((b, a) => (!b || a.score > b.score ? a : b), null);
        if (best) setBestAttempt(best);
      })
      .catch(() => {});
  }, [contentId]);

  const handleSubmit = async () => {
    if (Object.keys(selected).length < questions.length) {
      setQuizError('Please answer all questions before submitting.');
      return;
    }
    setQuizError('');
    setSubmitting(true);
    try {
      const answers = questions.map((_, i) => selected[i] ?? -1);
      const res = await apiSubmitQuiz(contentId, answers);
      setResult(res.data);
      if (res.data.passed) onPassed?.(res.data);
    } catch (e) {
      setQuizError(e.message || 'Could not submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const qStyles = useMemo(() => StyleSheet.create({
    question: { marginBottom: 20 },
    questionText: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t1, marginBottom: 10, lineHeight: 20 },
    option: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#0A0A0A', marginBottom: 8 },
    optionSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '15' },
    optionDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: COLORS.t3, alignItems: 'center', justifyContent: 'center' },
    optionDotSelected: { borderColor: COLORS.accent },
    optionDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
    optionText: { fontSize: 13, color: COLORS.t2, flex: 1 },
    optionTextSelected: { color: COLORS.accent, fontWeight: FONT.semibold },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.red + '15', borderRadius: RADIUS.sm, padding: 10, marginBottom: 8 },
    errorText: { fontSize: 12, color: COLORS.red, flex: 1 },
    submitBtn: { backgroundColor: COLORS.accent, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 8 },
    submitBtnText: { fontSize: 14, fontWeight: FONT.bold, color: '#000' },
    resultCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 20, alignItems: 'center' },
    resultIcon: { fontSize: 40, marginBottom: 10 },
    resultTitle: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 6 },
    resultScore: { fontSize: 15, color: COLORS.accent, fontWeight: FONT.semibold, marginBottom: 8 },
    resultHint: { fontSize: 12, color: COLORS.t3, textAlign: 'center', marginBottom: 12 },
    retryBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.accent },
    retryBtnText: { fontSize: 13, color: COLORS.accent, fontWeight: FONT.semibold },
    reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: RADIUS.sm, marginBottom: 6, width: '100%' },
    reviewCorrect: { backgroundColor: COLORS.green + '20' },
    reviewWrong: { backgroundColor: COLORS.red + '20' },
    reviewText: { fontSize: 12, color: COLORS.t2, flex: 1 },
    bestBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.accent + '15', borderRadius: RADIUS.md, padding: 10, marginBottom: 16 },
    bestText: { fontSize: 12, color: COLORS.accent, fontWeight: FONT.medium },
  }), [COLORS]);

  if (result) {
    return (
      <View style={qStyles.resultCard}>
        <Text style={qStyles.resultIcon}>{result.passed ? '🎉' : '😔'}</Text>
        <Text style={qStyles.resultTitle}>
          {result.passed ? 'Quiz Passed!' : 'Not quite...'}
        </Text>
        <Text style={qStyles.resultScore}>
          {result.score} / {result.total} correct ({Math.round((result.score / result.total) * 100)}%)
        </Text>
        {!result.passed && (
          <>
            <Text style={qStyles.resultHint}>You need 60% to pass. Review the material and try again.</Text>
            <TouchableOpacity
              onPress={() => { setResult(null); setSelected({}); }}
              style={qStyles.retryBtn}
            >
              <Text style={qStyles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ marginTop: 16 }}>
          {result.results?.map((r, i) => (
            <View key={i} style={[qStyles.reviewRow, r.isCorrect ? qStyles.reviewCorrect : qStyles.reviewWrong]}>
              <Ionicons
                name={r.isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={r.isCorrect ? COLORS.green : COLORS.red}
              />
              <Text style={qStyles.reviewText} numberOfLines={2}>{r.question}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View>
      {bestAttempt && (
        <View style={qStyles.bestBanner}>
          <Ionicons name="trophy-outline" size={14} color={COLORS.accent} />
          <Text style={qStyles.bestText}>
            Best score: {bestAttempt.score}/{bestAttempt.total} — {bestAttempt.passed ? 'Passed ✓' : 'Not passed yet'}
          </Text>
        </View>
      )}
      {questions.map((q, qi) => (
        <View key={qi} style={qStyles.question}>
          <Text style={qStyles.questionText}>{qi + 1}. {q.q}</Text>
          {q.options.map((opt, oi) => {
            const isSelected = selected[qi] === oi;
            return (
              <TouchableOpacity
                key={oi}
                onPress={() => { setSelected(s => ({ ...s, [qi]: oi })); setQuizError(''); }}
                style={[qStyles.option, isSelected && qStyles.optionSelected]}
              >
                <View style={[qStyles.optionDot, isSelected && qStyles.optionDotSelected]}>
                  {isSelected && <View style={qStyles.optionDotInner} />}
                </View>
                <Text style={[qStyles.optionText, isSelected && qStyles.optionTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      {!!quizError && (
        <View style={qStyles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} />
          <Text style={qStyles.errorText}>{quizError}</Text>
        </View>
      )}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        style={[qStyles.submitBtn, submitting && { opacity: 0.6 }]}
      >
        {submitting
          ? <ActivityIndicator size="small" color="#000" />
          : <Text style={qStyles.submitBtnText}>Submit Quiz</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Assignment Component ────────────────────────────────────────────────────
function AssignmentPanel({ contentId, lessonBody, onSubmitted }) {
  const { colors: COLORS } = useTheme();
  const [text, setText]           = useState('');
  const [fileUrl, setFileUrl]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting]   = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    apiGetSubmission(contentId)
      .then(res => { if (res.data?.submission) setExisting(res.data.submission); })
      .catch(() => {});
  }, [contentId]);

  const handleSubmit = async () => {
    setSubmitError('');
    if (!text.trim() && !fileUrl.trim()) {
      setSubmitError('Please add your answer text or a file URL.');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        ...(text.trim() && { text: text.trim() }),
        ...(fileUrl.trim() && { fileUrl: fileUrl.trim() }),
      };
      const res = await apiSubmitAssignment(contentId, body);
      setExisting(res.data.submission);
      setSubmitSuccess(true);
      onSubmitted?.();
    } catch (e) {
      setSubmitError(e.message || 'Could not submit assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const aStyles = useMemo(() => StyleSheet.create({
    label: { fontSize: 11, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 6, marginTop: 14 },
    input: { backgroundColor: '#0A0A0A', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: COLORS.t1 },
    inputMulti: { height: 130, paddingTop: 12 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.red + '15', borderRadius: RADIUS.sm, padding: 10, marginTop: 8 },
    errorText: { fontSize: 12, color: COLORS.red, flex: 1 },
    submitBtn: { backgroundColor: COLORS.pink, paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 16 },
    submitBtnText: { fontSize: 14, fontWeight: FONT.bold, color: '#fff' },
    card: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 18 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    statusText: { fontSize: 14, fontWeight: FONT.semibold },
    grade: { fontSize: 22, fontWeight: FONT.extrabold, color: COLORS.green, marginBottom: 10 },
    feedback: { backgroundColor: '#0A0A0A', borderRadius: RADIUS.md, padding: 12, marginTop: 8 },
    feedbackLabel: { fontSize: 10, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 4 },
    feedbackText: { fontSize: 13, color: COLORS.t2, lineHeight: 20 },
    resubmitBtn: { marginTop: 16, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md },
    resubmitText: { fontSize: 13, color: COLORS.t3 },
    instructions: { backgroundColor: COLORS.blue + '15', borderRadius: RADIUS.md, padding: 14, marginBottom: 8 },
    instructionsLabel: { fontSize: 10, color: COLORS.blue, fontWeight: FONT.bold, marginBottom: 4 },
    instructionsText: { fontSize: 13, color: COLORS.t2, lineHeight: 20 },
  }), [COLORS]);

  if (submitSuccess && existing) {
    return (
      <View style={aStyles.card}>
        <View style={[aStyles.statusRow, { backgroundColor: COLORS.green + '15', borderRadius: RADIUS.md, padding: 14, marginBottom: 0 }]}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[aStyles.statusText, { color: COLORS.green }]}>Assignment Submitted!</Text>
            <Text style={{ fontSize: 11, color: COLORS.t3, marginTop: 2 }}>Awaiting grade from your instructor.</Text>
          </View>
        </View>
      </View>
    );
  }

  if (existing) {
    const statusColor = existing.status === 'GRADED' ? COLORS.green : COLORS.accent;
    return (
      <View style={aStyles.card}>
        <View style={aStyles.statusRow}>
          <Ionicons name={existing.status === 'GRADED' ? 'checkmark-circle' : 'time-outline'} size={20} color={statusColor} />
          <Text style={[aStyles.statusText, { color: statusColor }]}>
            {existing.status === 'GRADED' ? 'Graded' : 'Submitted — Awaiting Grade'}
          </Text>
        </View>
        {existing.grade !== null && existing.grade !== undefined && (
          <Text style={aStyles.grade}>Grade: {existing.grade}/100</Text>
        )}
        {existing.feedback && (
          <View style={aStyles.feedback}>
            <Text style={aStyles.feedbackLabel}>Instructor Feedback</Text>
            <Text style={aStyles.feedbackText}>{existing.feedback}</Text>
          </View>
        )}
        {existing.text && (
          <View style={{ marginTop: 12 }}>
            <Text style={aStyles.feedbackLabel}>Your Submission</Text>
            <Text style={aStyles.feedbackText}>{existing.text}</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => setExisting(null)} style={aStyles.resubmitBtn}>
          <Text style={aStyles.resubmitText}>Resubmit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {lessonBody && (
        <View style={aStyles.instructions}>
          <Text style={aStyles.instructionsLabel}>Assignment Instructions</Text>
          <Text style={aStyles.instructionsText}>{lessonBody}</Text>
        </View>
      )}
      <Text style={aStyles.label}>Your Answer *</Text>
      <TextInput
        value={text}
        onChangeText={v => { setText(v); setSubmitError(''); }}
        placeholder="Type your answer or response here..."
        placeholderTextColor="#555"
        style={[aStyles.input, aStyles.inputMulti]}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
      <Text style={aStyles.label}>File / Link (optional)</Text>
      <TextInput
        value={fileUrl}
        onChangeText={v => { setFileUrl(v); setSubmitError(''); }}
        placeholder="https://drive.google.com/... or any file URL"
        placeholderTextColor="#555"
        style={aStyles.input}
        keyboardType="url"
        autoCapitalize="none"
      />
      {!!submitError && (
        <View style={aStyles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} />
          <Text style={aStyles.errorText}>{submitError}</Text>
        </View>
      )}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={submitting}
        style={[aStyles.submitBtn, submitting && { opacity: 0.6 }]}
      >
        {submitting
          ? <ActivityIndicator size="small" color="#000" />
          : <Text style={aStyles.submitBtnText}>Submit Assignment</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main LessonScreen ───────────────────────────────────────────────────────
export default function LessonScreen({ route, navigation }) {
  const { colors: COLORS } = useTheme();
  const { lesson: passedLesson, lessonId, courseTitle = 'Course' } = route.params || {};

  const TYPE_CONFIG = useMemo(() => ({
    VIDEO:      { icon: 'play-circle',      color: COLORS.teal,   label: 'Video Lesson' },
    QUIZ:       { icon: 'checkmark-circle', color: COLORS.accent,  label: 'Quiz' },
    DOCUMENT:   { icon: 'document-text',    color: COLORS.blue,    label: 'Reading Material' },
    ASSIGNMENT: { icon: 'create',           color: COLORS.pink,    label: 'Assignment' },
    video:      { icon: 'play-circle',      color: COLORS.teal,   label: 'Video Lesson' },
    quiz:       { icon: 'checkmark-circle', color: COLORS.accent,  label: 'Quiz' },
    doc:        { icon: 'document-text',    color: COLORS.blue,    label: 'Reading Material' },
  }), [COLORS]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorText: { fontSize: 15, color: COLORS.t3, marginTop: 12 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: 15, fontWeight: FONT.bold, color: COLORS.t1 },
    headerSub: { fontSize: 11, color: COLORS.t3, marginTop: 1 },
    completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.green, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
    completedText: { fontSize: 10, fontWeight: FONT.bold, color: '#000' },
    scrollContent: { paddingBottom: 90 },
    mediaArea: { height: 160, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
    mediaLabel: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    lessonContent: { padding: SPACING.xl },
    lessonTitle: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 12 },
    metaRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#1A1A1A' },
    metaText: { fontSize: 11, color: COLORS.t3, fontWeight: FONT.medium },
    bodyText: { fontSize: 13, color: COLORS.t2, lineHeight: 22, marginBottom: 14 },
    bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, paddingLeft: 4 },
    bullet: { width: 6, height: 6, borderRadius: 3 },
    bulletText: { fontSize: 12, color: COLORS.t2 },
    xpCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 16, marginTop: 10 },
    xpTitle: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    xpSub: { fontSize: 11, color: COLORS.accent, fontWeight: FONT.medium, marginTop: 2 },
    mediaLink: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.accent + '40', borderRadius: RADIUS.md, padding: 14, marginBottom: 18 },
    mediaLinkText: { flex: 1, fontSize: 13, color: COLORS.accent, fontWeight: FONT.semibold },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, paddingHorizontal: SPACING.xl, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border },
    emptyQuiz: { alignItems: 'center', paddingVertical: 40 },
    emptyQuizText: { fontSize: 13, color: COLORS.t3, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  }), [COLORS]);

  const { addXp, syncXpStreak } = useAuth();
  const [lesson, setLesson]       = useState(passedLesson || null);
  const [loading, setLoading]     = useState(!passedLesson && !!lessonId);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completedBanner, setCompletedBanner] = useState(false);
  const { toast, showToast } = useToast();

  useEffect(() => {
    if (passedLesson || !lessonId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetContent(lessonId);
        if (!cancelled) setLesson(res.data?.content || null);
      } catch (_) {}
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [lessonId, passedLesson]);

  useEffect(() => {
    const id = lesson?.id;
    if (!id) return;
    apiGetCompletion(id)
      .then(res => { if (res.data?.completed) setCompleted(true); })
      .catch(() => {});
  }, [lesson?.id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={COLORS.accent} /></View>
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.t3} />
          <Text style={styles.errorText}>Lesson not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const lessonTitle = lesson.title || 'Lesson';
  const lessonType  = lesson.type || 'doc';
  const lessonDur   = lesson.durationMin ? `${lesson.durationMin}m` : (lesson.dur || '—');
  const lessonBody  = lesson.body || lesson.description || null;
  const mediaUrl    = lesson.mediaUrl || lesson.url || null;
  const config      = TYPE_CONFIG[lessonType] || TYPE_CONFIG.doc;

  let quizQuestions = [];
  if (lessonType === 'QUIZ' || lessonType === 'quiz') {
    try { quizQuestions = JSON.parse(lessonBody || '[]'); } catch (_) {}
  }

  const isQuiz       = lessonType === 'QUIZ' || lessonType === 'quiz';
  const isAssignment = lessonType === 'ASSIGNMENT';
  const isVideo      = lessonType === 'VIDEO' || lessonType === 'video';

  const handleMarkComplete = async () => {
    if (completed || completing) return;
    const id = lesson?.id;
    if (id) {
      setCompleting(true);
      try {
        const res = await apiMarkComplete(id);
        const { xpEarned, xp, streak } = res.data || {};
        if (xpEarned > 0) {
          syncXpStreak(xp, streak);
          showToast(`Lesson complete! +${xpEarned} XP 🎉`, 'success');
        } else {
          showToast('Lesson marked as complete!', 'success');
        }
      } catch (_) {
        showToast('Lesson marked as complete!', 'success');
      } finally {
        setCompleting(false);
      }
    }
    setCompleted(true);
    setCompletedBanner(true);
    setTimeout(() => setCompletedBanner(false), 4000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{lessonTitle}</Text>
          <Text style={styles.headerSub}>{courseTitle}</Text>
        </View>
        {completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark" size={12} color="#000" />
            <Text style={styles.completedText}>Done</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Video Player — shows inline for video lessons */}
        {isVideo && mediaUrl ? (
          <View style={{ paddingHorizontal: SPACING.xl, paddingTop: 16 }}>
            <VideoPlayer url={mediaUrl} title={lessonTitle} />
          </View>
        ) : (
          <View style={styles.mediaArea}>
            <Ionicons name={config.icon} size={40} color={config.color} />
            <Text style={styles.mediaLabel}>{config.label}</Text>
          </View>
        )}

        <View style={styles.lessonContent}>
          <Text style={styles.lessonTitle}>{lessonTitle}</Text>

          {/* Meta pills */}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name={config.icon} size={12} color={config.color} />
              <Text style={[styles.metaText, { color: config.color }]}>{config.label}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={12} color={COLORS.t3} />
              <Text style={styles.metaText}>{lessonDur}</Text>
            </View>
          </View>

          {/* Non-video external link (docs, etc.) */}
          {mediaUrl && !isVideo ? (
            <TouchableOpacity
              onPress={() => { const { Linking } = require('react-native'); Linking.openURL(mediaUrl); }}
              style={styles.mediaLink}
            >
              <Ionicons name="open-outline" size={18} color={COLORS.accent} />
              <Text style={styles.mediaLinkText}>Open Resource</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.accent} />
            </TouchableOpacity>
          ) : null}

          {/* ── Quiz Panel ── */}
          {isQuiz && (
            quizQuestions.length > 0 ? (
              <QuizPanel
                contentId={lesson.id}
                questions={quizQuestions}
                onPassed={(quizData) => {
                  setCompleted(true);
                  const { xpEarned, xp, streak } = quizData || {};
                  if (xpEarned > 0) syncXpStreak(xp, streak);
                  showToast(xpEarned > 0 ? `Quiz passed! +${xpEarned} XP 🎉` : 'Quiz passed! 🎉', 'success');
                }}
              />
            ) : (
              <View style={styles.emptyQuiz}>
                <Ionicons name="construct-outline" size={32} color={COLORS.t3} />
                <Text style={styles.emptyQuizText}>
                  Quiz questions haven't been added yet.{'\n'}Check back later.
                </Text>
              </View>
            )
          )}

          {/* ── Assignment Panel ── */}
          {isAssignment && (
            <AssignmentPanel
              contentId={lesson.id}
              lessonBody={lessonBody}
              onSubmitted={() => setCompleted(true)}
            />
          )}

          {/* ── Reading / Video body content ── */}
          {!isQuiz && !isAssignment && lessonBody ? (
            <Text style={styles.bodyText}>{lessonBody}</Text>
          ) : null}

          {/* XP card */}
          {!isQuiz && !isAssignment && (
            <View style={styles.xpCard}>
              <Ionicons name="star" size={20} color={COLORS.accent} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.xpTitle}>Complete to earn XP</Text>
                <Text style={styles.xpSub}>+25 XP for finishing this lesson</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      {!isQuiz && !isAssignment && (
        <View style={styles.bottomBar}>
          <Button onPress={handleMarkComplete} disabled={completed || completing}>
            {completing ? 'Saving...' : completed ? '✓ Completed' : 'Mark as Complete'}
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}

