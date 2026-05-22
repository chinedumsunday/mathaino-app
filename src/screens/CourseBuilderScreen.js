import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Input, Button, Card, Toast, useToast } from '../components/UI';
import { apiCreateCourse } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function CourseBuilderScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [form, setForm] = useState({
    title: '',
    code: '',
    description: '',
    department: '',
    coverImage: null,
    publishNow: false,
  });
  const [saving, setSaving] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [formError, setFormError] = useState('');
  const { toast, showToast } = useToast();

  const update = (key, value) => { setForm(prev => ({ ...prev, [key]: value })); setFormError(''); };

  const pickCoverImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Gallery permission needed to upload a cover image.', 'error');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      update('coverImage', result.assets[0].uri);
    }
  };

  const submit = async (publishNow) => {
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Course title is required.');
      return;
    }
    if (!form.code.trim()) {
      setFormError('Course code is required (e.g. CSC 401).');
      return;
    }
    setSaving(true);
    try {
      const res = await apiCreateCourse({
        title: form.title.trim(),
        code: form.code.trim(),
        description: form.description.trim(),
        isPublished: publishNow,
      });
      const created = res.data.course;
      showToast(publishNow ? `"${created.title}" published!` : `"${created.title}" saved as draft`, 'success');
      setTimeout(() => navigation.replace('CourseDetail', { courseId: created.id }), 1200);
    } catch (e) {
      setFormError(e.message || 'Could not create course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => submit(form.publishNow);
  const handleSaveDraft = () => submit(false);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    scrollContent: { paddingHorizontal: SPACING.xxl, paddingBottom: 20 },
    label: { fontSize: 12, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 4, marginLeft: 2 },
    imageUpload: { marginBottom: 16, borderRadius: RADIUS.lg, overflow: 'hidden' },
    imagePlaceholder: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#333', borderRadius: RADIUS.lg, padding: 32, alignItems: 'center', backgroundColor: '#0A0A0A' },
    imagePlaceholderText: { fontSize: 12, color: COLORS.t3, fontWeight: FONT.medium, marginTop: 8 },
    imagePlaceholderHint: { fontSize: 10, color: COLORS.t3, marginTop: 4, opacity: 0.6 },
    imagePreviewWrap: { position: 'relative' },
    imagePreview: { width: '100%', height: 180, borderRadius: RADIUS.lg },
    removeImage: { position: 'absolute', top: 8, right: 8 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: COLORS.border, marginBottom: 16 },
    toggleLabel: { fontSize: 13, color: COLORS.t1, fontWeight: FONT.medium },
    toggleDesc: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 },
    infoText: { flex: 1, fontSize: 11, color: COLORS.t2, lineHeight: 18 },
    buttonRow: { flexDirection: 'row', gap: 10 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.red + '15', borderRadius: RADIUS.md, padding: 10, marginBottom: 8 },
    errorText: { fontSize: 12, color: COLORS.red, flex: 1 },
  }), [COLORS]);

  const discardModal = useMemo(() => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center', padding: 32 },
    box: { width: '100%', backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
    title: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 10 },
    message: { fontSize: 13, color: COLORS.t3, lineHeight: 20, marginBottom: 24 },
    actions: { flexDirection: 'row', gap: 10 },
    btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
    cancelBtn: { borderColor: COLORS.border },
    cancelText: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t2 },
    dangerBtn: { borderColor: COLORS.red, backgroundColor: COLORS.red + '18' },
    dangerText: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.red },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />
      {/* Header */}
      <Modal visible={discardVisible} transparent animationType="fade" onRequestClose={() => setDiscardVisible(false)}>
        <View style={discardModal.overlay}>
          <View style={discardModal.box}>
            <Text style={discardModal.title}>Discard Changes?</Text>
            <Text style={discardModal.message}>You have unsaved changes. Are you sure you want to go back?</Text>
            <View style={discardModal.actions}>
              <TouchableOpacity onPress={() => setDiscardVisible(false)} style={[discardModal.btn, discardModal.cancelBtn]}>
                <Text style={discardModal.cancelText}>Keep Editing</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setDiscardVisible(false); navigation.goBack(); }} style={[discardModal.btn, discardModal.dangerBtn]}>
                <Text style={discardModal.dangerText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          const hasChanges = form.title || form.code || form.description;
          if (!hasChanges) { navigation.goBack(); return; }
          setDiscardVisible(true);
        }}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Course</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Form */}
        <Text style={styles.label}>Course Title *</Text>
        <Input placeholder="e.g. Introduction to Algorithms" value={form.title} onChangeText={v => update('title', v)} />

        <Text style={styles.label}>Course Code *</Text>
        <Input placeholder="e.g. CSC 401" value={form.code} onChangeText={v => update('code', v)} />

        <Text style={styles.label}>Description</Text>
        <Input placeholder="What will students learn in this course?" multiline rows={4} value={form.description} onChangeText={v => update('description', v)} />

        <Text style={styles.label}>Department</Text>
        <Input placeholder="e.g. Computer Science" value={form.department} onChangeText={v => update('department', v)} />

        {/* Cover Image */}
        <Text style={styles.label}>Cover Image</Text>
        <TouchableOpacity onPress={pickCoverImage} style={styles.imageUpload}>
          {form.coverImage ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: form.coverImage }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => update('coverImage', null)} style={styles.removeImage}>
                <Ionicons name="close-circle" size={24} color={COLORS.red} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={COLORS.t3} />
              <Text style={styles.imagePlaceholderText}>Tap to upload cover image</Text>
              <Text style={styles.imagePlaceholderHint}>Recommended: 1280x720</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Publish Toggle */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.toggleLabel}>Publish immediately</Text>
            <Text style={styles.toggleDesc}>Students can enroll right away</Text>
          </View>
          <Switch
            value={form.publishNow}
            onValueChange={v => update('publishNow', v)}
            trackColor={{ false: '#1A1A1A', true: COLORS.accent + '60' }}
            thumbColor={form.publishNow ? COLORS.accent : COLORS.t3}
          />
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={COLORS.blue} />
          <Text style={styles.infoText}>
            After creating the course, you can add modules and lessons from the course detail page.
          </Text>
        </Card>

        {/* Buttons */}
        {!!formError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <View style={{ flex: 1 }}>
            <Button variant="secondary" onPress={handleSaveDraft} disabled={saving}>Save Draft</Button>
          </View>
          <View style={{ flex: 1 }}>
            <Button onPress={handleCreate} disabled={saving}>{saving ? 'Saving...' : 'Create Course'}</Button>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

