import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Card, Button, Badge, Toast, useToast } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { apiSubmitCoursework, apiMyCoursework } from '../services/api';

const STATUS_META = {
  PENDING: { label: 'Awaiting review', icon: 'time-outline' },
  ADDED: { label: 'Added to app', icon: 'checkmark-circle' },
  DECLINED: { label: 'Declined', icon: 'close-circle' },
};

export default function LecturerCourseworkScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const { toast, showToast } = useToast();

  const [form, setForm] = useState({ title: '', courseCode: '', description: '', fileUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const statusColor = (status) => ({
    PENDING: COLORS.orange, ADDED: COLORS.green, DECLINED: COLORS.red,
  }[status] || COLORS.t3);

  const load = useCallback(async () => {
    try {
      const res = await apiMyCoursework();
      setDocs(res.data.coursework || []);
    } catch (_) {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { showToast('Please add a title for the document.', 'error'); return; }
    if (!form.fileUrl.trim()) { showToast('Please paste a link to the document.', 'error'); return; }
    if (!/^https?:\/\//i.test(form.fileUrl.trim())) {
      showToast('The document link must start with http:// or https://', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiSubmitCoursework({
        title: form.title.trim(),
        courseCode: form.courseCode.trim() || undefined,
        description: form.description.trim() || undefined,
        fileUrl: form.fileUrl.trim(),
      });
      setDocs(prev => [res.data.coursework, ...prev]);
      setForm({ title: '', courseCode: '', description: '', fileUrl: '' });
      showToast('Document submitted — the admin has been notified.', 'success');
    } catch (e) {
      showToast(e.message || 'Could not submit the document.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    scrollContent: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
    intro: { fontSize: 12, color: COLORS.t3, lineHeight: 18, marginBottom: 16 },
    label: { fontSize: 11, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 6, marginTop: 12 },
    input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: COLORS.t1 },
    inputMulti: { height: 90, textAlignVertical: 'top', paddingTop: 12 },
    tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.blue + '12', borderRadius: RADIUS.md, padding: 12, marginTop: 12 },
    tipText: { flex: 1, fontSize: 11, color: COLORS.t2, lineHeight: 17 },
    sectionTitle: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 28, marginBottom: 12 },
    docTitle: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1, flex: 1 },
    docMeta: { fontSize: 11, color: COLORS.t3, marginTop: 2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    statusText: { fontSize: 11, fontWeight: FONT.semibold },
    noteBox: { backgroundColor: COLORS.elevated, borderRadius: RADIUS.sm, padding: 10, marginTop: 8 },
    noteText: { fontSize: 11, color: COLORS.t2, lineHeight: 16 },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    linkText: { fontSize: 11, color: COLORS.accent, fontWeight: FONT.medium },
    empty: { alignItems: 'center', paddingVertical: 24 },
    emptyText: { fontSize: 12, color: COLORS.t3, marginTop: 8, textAlign: 'center' },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
        <Text style={styles.title}>Submit Coursework</Text>
        <Ionicons name="document-attach-outline" size={20} color={COLORS.accent} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        <Text style={styles.intro}>
          Prefer not to build the course in the app yourself? Share your exam or
          coursework document here and the admin will add it to the app for you.
        </Text>

        <Text style={styles.label}>Document Title *</Text>
        <TextInput
          value={form.title}
          onChangeText={v => update('title', v)}
          placeholder="e.g. CSC 401 Exam Questions — 2026"
          placeholderTextColor={COLORS.t3}
          style={styles.input}
        />

        <Text style={styles.label}>Course Code (optional)</Text>
        <TextInput
          value={form.courseCode}
          onChangeText={v => update('courseCode', v)}
          placeholder="e.g. CSC 401"
          placeholderTextColor={COLORS.t3}
          style={styles.input}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Document Link *</Text>
        <TextInput
          value={form.fileUrl}
          onChangeText={v => update('fileUrl', v)}
          placeholder="https://drive.google.com/..."
          placeholderTextColor={COLORS.t3}
          style={styles.input}
          keyboardType="url"
          autoCapitalize="none"
        />
        <View style={styles.tipBox}>
          <Ionicons name="information-circle-outline" size={15} color={COLORS.blue} />
          <Text style={styles.tipText}>
            Upload your document to Google Drive, Dropbox or OneDrive, set it to
            "Anyone with the link can view", then paste the share link here.
          </Text>
        </View>

        <Text style={styles.label}>Notes for the Admin (optional)</Text>
        <TextInput
          value={form.description}
          onChangeText={v => update('description', v)}
          placeholder="e.g. Please add this as a quiz under Module 3..."
          placeholderTextColor={COLORS.t3}
          style={[styles.input, styles.inputMulti]}
          multiline
        />

        <View style={{ marginTop: 18 }}>
          <Button onPress={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit to Admin'}
          </Button>
        </View>

        {/* Previous submissions */}
        <Text style={styles.sectionTitle}>My Submissions</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginVertical: 20 }} />
        ) : docs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="folder-open-outline" size={32} color={COLORS.t3} />
            <Text style={styles.emptyText}>Nothing submitted yet.</Text>
          </View>
        ) : (
          docs.map(doc => {
            const meta = STATUS_META[doc.status] || STATUS_META.PENDING;
            const color = statusColor(doc.status);
            return (
              <Card key={doc.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <Text style={styles.docMeta}>
                      {doc.courseCode ? `${doc.courseCode} • ` : ''}
                      {new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <Badge label={meta.label} color={color} />
                </View>
                {doc.adminNote ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>Admin: {doc.adminNote}</Text>
                  </View>
                ) : null}
                <TouchableOpacity onPress={() => Linking.openURL(doc.fileUrl)} style={styles.linkRow}>
                  <Ionicons name="open-outline" size={13} color={COLORS.accent} />
                  <Text style={styles.linkText}>Open document</Text>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
