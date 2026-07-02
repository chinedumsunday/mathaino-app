import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Linking, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Avatar, Card, Chip, Badge, Toast, useToast } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { apiListCoursework, apiReviewCoursework } from '../services/api';

const FILTERS = ['Pending', 'All'];

export default function CourseworkInboxScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const { toast, showToast } = useToast();

  const [docs, setDocs] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  // Review modal: { doc, status: 'ADDED' | 'DECLINED' }
  const [review, setReview] = useState(null);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);

  const statusColor = (status) => ({
    PENDING: COLORS.orange, ADDED: COLORS.green, DECLINED: COLORS.red,
  }[status] || COLORS.t3);

  const load = useCallback(async (filterVal = filter) => {
    try {
      const params = filterVal === 'Pending' ? { status: 'PENDING' } : {};
      const res = await apiListCoursework(params);
      setDocs(res.data.coursework || []);
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not load coursework submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const confirmReview = async () => {
    if (!review) return;
    setActing(true);
    try {
      const res = await apiReviewCoursework(review.doc.id, review.status, note.trim() || undefined);
      setDocs(prev => prev.map(d => (d.id === review.doc.id ? res.data.coursework : d)));
      showToast(
        review.status === 'ADDED'
          ? 'Marked as added — the lecturer has been notified.'
          : 'Declined — the lecturer has been notified.',
        'success'
      );
      setReview(null);
      setNote('');
    } catch (e) {
      showToast(e.message || 'Could not update the submission.', 'error');
    } finally {
      setActing(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.xl, marginBottom: 12 },
    listContent: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
    lecturerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    lecturerName: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    lecturerDept: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
    docTitle: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.t1 },
    docMeta: { fontSize: 11, color: COLORS.t3, marginTop: 2 },
    desc: { fontSize: 12, color: COLORS.t2, lineHeight: 18, marginTop: 8 },
    openBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.accent + '12', borderWidth: 1, borderColor: COLORS.accent + '40', borderRadius: RADIUS.md, padding: 12, marginTop: 12 },
    openBtnText: { flex: 1, fontSize: 12, fontWeight: FONT.semibold, color: COLORS.accent },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1 },
    addBtn: { backgroundColor: COLORS.green + '15', borderColor: COLORS.green + '40' },
    declineBtn: { backgroundColor: COLORS.red + '12', borderColor: COLORS.red + '30' },
    actionText: { fontSize: 12, fontWeight: FONT.bold },
    noteBox: { backgroundColor: COLORS.elevated, borderRadius: RADIUS.sm, padding: 10, marginTop: 8 },
    noteText: { fontSize: 11, color: COLORS.t2 },
    empty: { alignItems: 'center', paddingVertical: 70 },
    emptyTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 14 },
    emptyText: { fontSize: 12, color: COLORS.t3, marginTop: 4, textAlign: 'center' },
    errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    errorText: { fontSize: 14, color: COLORS.t3, marginVertical: 12, textAlign: 'center' },
    retryBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    retryText: { fontSize: 13, color: COLORS.silver },
    // Modal
    overlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'center', padding: 28 },
    box: { backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 22 },
    modalTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 6 },
    modalMsg: { fontSize: 12, color: COLORS.t3, lineHeight: 18, marginBottom: 14 },
    modalInput: { backgroundColor: COLORS.elevated, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: COLORS.t1, height: 70, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
    modalCancel: { borderColor: COLORS.border },
    modalCancelText: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t2 },
  }), [COLORS]);

  const renderItem = ({ item }) => {
    const lecturerName = `${item.lecturer?.firstName || ''} ${item.lecturer?.lastName || ''}`.trim() || 'Lecturer';
    const isPending = item.status === 'PENDING';
    return (
      <Card>
        <View style={styles.lecturerRow}>
          <Avatar size={34} name={lecturerName} url={item.lecturer?.avatarUrl} color={COLORS.teal} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.lecturerName}>{lecturerName}</Text>
            <Text style={styles.lecturerDept}>
              {item.lecturer?.lecturerProfile?.department || 'Lecturer'} • {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </Text>
          </View>
          <Badge
            label={isPending ? 'Pending' : item.status === 'ADDED' ? 'Added' : 'Declined'}
            color={statusColor(item.status)}
          />
        </View>

        <Text style={styles.docTitle}>{item.title}</Text>
        {item.courseCode ? <Text style={styles.docMeta}>{item.courseCode}</Text> : null}
        {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}

        <TouchableOpacity onPress={() => Linking.openURL(item.fileUrl)} style={styles.openBtn}>
          <Ionicons name="document-text-outline" size={16} color={COLORS.accent} />
          <Text style={styles.openBtnText}>Open Document</Text>
          <Ionicons name="open-outline" size={14} color={COLORS.accent} />
        </TouchableOpacity>

        {item.adminNote ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>Note: {item.adminNote}</Text>
          </View>
        ) : null}

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => { setReview({ doc: item, status: 'DECLINED' }); setNote(''); }}
              style={[styles.actionBtn, styles.declineBtn]}
            >
              <Ionicons name="close" size={15} color={COLORS.red} />
              <Text style={[styles.actionText, { color: COLORS.red }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setReview({ doc: item, status: 'ADDED' }); setNote(''); }}
              style={[styles.actionBtn, styles.addBtn]}
            >
              <Ionicons name="checkmark" size={15} color={COLORS.green} />
              <Text style={[styles.actionText, { color: COLORS.green }]}>Mark as Added</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />

      {/* Review modal */}
      <Modal visible={!!review} transparent animationType="fade" onRequestClose={() => setReview(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
          <View style={styles.box}>
            <Text style={styles.modalTitle}>
              {review?.status === 'ADDED' ? 'Mark as added?' : 'Decline submission?'}
            </Text>
            <Text style={styles.modalMsg}>
              {review?.status === 'ADDED'
                ? `Confirm that "${review?.doc?.title}" has been added to the app. The lecturer will be notified.`
                : `"${review?.doc?.title}" will be marked as declined and the lecturer will be notified.`}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Optional note to the lecturer..."
              placeholderTextColor={COLORS.t3}
              style={styles.modalInput}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setReview(null)} style={[styles.modalBtn, styles.modalCancel]}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmReview}
                disabled={acting}
                style={[styles.modalBtn, review?.status === 'ADDED' ? styles.addBtn : styles.declineBtn]}
              >
                {acting
                  ? <ActivityIndicator size="small" color={review?.status === 'ADDED' ? COLORS.green : COLORS.red} />
                  : <Text style={[styles.actionText, { color: review?.status === 'ADDED' ? COLORS.green : COLORS.red }]}>
                      {review?.status === 'ADDED' ? 'Mark as Added' : 'Decline'}
                    </Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
        <Text style={styles.title}>Coursework Inbox</Text>
        <Ionicons name="file-tray-full-outline" size={20} color={COLORS.accent} />
      </View>

      <View style={styles.chipRow}>
        {FILTERS.map(f => (
          <Chip key={f} label={f} active={filter === f} onPress={() => { setFilter(f); setLoading(true); }} />
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 50 }} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Ionicons name="cloud-offline-outline" size={40} color={COLORS.t3} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={52} color={COLORS.teal} />
              <Text style={styles.emptyTitle}>
                {filter === 'Pending' ? 'All caught up!' : 'No submissions yet'}
              </Text>
              <Text style={styles.emptyText}>
                {filter === 'Pending'
                  ? 'No coursework documents waiting for review.'
                  : 'Lecturers can submit exam and coursework documents for you to add to the app.'}
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}
