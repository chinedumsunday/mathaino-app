import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Input, Button, Toast, useToast } from '../components/UI';
import { apiCreateStudent } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function CreateStudentScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    matricNumber: '',
    department: '',
    level: '',
  });
  const [saving, setSaving] = useState(false);
  const [discardVisible, setDiscardVisible] = useState(false);
  const [formError, setFormError] = useState('');
  const { toast, showToast } = useToast();

  const update = (key, value) => { setForm(prev => ({ ...prev, [key]: value })); setFormError(''); };

  const handleCreate = async () => {
    setFormError('');
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError('First name and last name are required.');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiCreateStudent({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        ...(form.matricNumber.trim() && { matricNumber: form.matricNumber.trim() }),
        ...(form.department.trim() && { department: form.department.trim() }),
        ...(form.level.trim() && { level: form.level.trim() }),
      });
      const created = res.data.user;
      showToast(`Account created for ${created.firstName} ${created.lastName}`, 'success');
      setTimeout(() => navigation.goBack(), 1600);
    } catch (e) {
      setFormError(e.message || 'Could not create account. The email may already be in use.');
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    scrollContent: { paddingHorizontal: SPACING.xxl, paddingBottom: 20 },
    label: { fontSize: 12, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 4, marginLeft: 2 },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 14, marginBottom: 20 },
    infoText: { flex: 1, fontSize: 11, color: COLORS.t2, lineHeight: 18 },
    sectionDivider: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16, marginBottom: 8, marginTop: 8 },
    sectionLabel: { fontSize: 11, color: COLORS.t3, fontWeight: FONT.bold, textTransform: 'uppercase', letterSpacing: 1 },
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
          const hasChanges = form.firstName || form.email;
          if (!hasChanges) { navigation.goBack(); return; }
          setDiscardVisible(true);
        }}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <Text style={styles.title}>Register Student</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={18} color={COLORS.blue} />
          <Text style={styles.infoText}>
            Create a student account. The student will be able to log in immediately with these credentials.
          </Text>
        </View>

        <Text style={styles.label}>First Name *</Text>
        <Input placeholder="e.g. John" value={form.firstName} onChangeText={v => update('firstName', v)} />

        <Text style={styles.label}>Last Name *</Text>
        <Input placeholder="e.g. Doe" value={form.lastName} onChangeText={v => update('lastName', v)} />

        <Text style={styles.label}>Email Address *</Text>
        <Input
          placeholder="student@example.com"
          value={form.email}
          onChangeText={v => update('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password *</Text>
        <Input
          placeholder="At least 6 characters"
          value={form.password}
          onChangeText={v => update('password', v)}
          secureTextEntry
        />

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionLabel}>Optional Profile Info</Text>
        </View>

        <Text style={styles.label}>Matric Number</Text>
        <Input placeholder="e.g. MAT/2024/001" value={form.matricNumber} onChangeText={v => update('matricNumber', v)} />

        <Text style={styles.label}>Department</Text>
        <Input placeholder="e.g. Computer Science" value={form.department} onChangeText={v => update('department', v)} />

        <Text style={styles.label}>Level</Text>
        <Input placeholder="e.g. 200 Level" value={form.level} onChangeText={v => update('level', v)} />

        {!!formError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        <View style={{ height: 20 }} />

        <Button onPress={handleCreate} disabled={saving}>
          {saving ? 'Creating Account...' : 'Create Student Account'}
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

