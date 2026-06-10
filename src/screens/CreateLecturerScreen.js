import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Input, Button, Card, Toast, useToast } from '../components/UI';
import { apiCreateLecturer } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function CreateLecturerScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    specialization: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const { toast, showToast } = useToast();

  const update = (key, val) => { setForm(prev => ({ ...prev, [key]: val })); setFormError(''); };

  const validate = () => {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!form.lastName.trim()) return 'Last name is required.';
    if (!form.email.trim() || !form.email.includes('@')) return 'A valid email is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (!form.department.trim()) return 'Department is required.';
    return null;
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) { setFormError(err); return; }

    setSaving(true);
    try {
      await apiCreateLecturer({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        department: form.department.trim(),
        specialization: form.specialization.trim(),
      });
      showToast(`Lecturer account created for ${form.firstName} ${form.lastName}`, 'success');
      setTimeout(() => navigation.goBack(), 1600);
    } catch (e) {
      setFormError(e.message || 'Could not create lecturer account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    scrollContent: { paddingHorizontal: SPACING.xl },
    infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 },
    infoText: { flex: 1, fontSize: 11, color: COLORS.t2, lineHeight: 18 },
    label: { fontSize: 12, color: COLORS.t3, fontWeight: FONT.medium, marginBottom: 4, marginLeft: 2 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.red + '15', borderRadius: RADIUS.md, padding: 12, marginBottom: 8 },
    errorText: { fontSize: 12, color: COLORS.red, flex: 1 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Lecturer</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.infoCard}>
            <Ionicons name="information-circle" size={18} color={COLORS.teal} />
            <Text style={styles.infoText}>
              The lecturer will receive login credentials at their email. Their account is automatically activated.
            </Text>
          </Card>

          <Text style={styles.label}>First Name *</Text>
          <Input
            placeholder="e.g. Chukwuemeka"
            value={form.firstName}
            onChangeText={v => update('firstName', v)}
          />

          <Text style={styles.label}>Last Name *</Text>
          <Input
            placeholder="e.g. Okafor"
            value={form.lastName}
            onChangeText={v => update('lastName', v)}
          />

          <Text style={styles.label}>Email Address *</Text>
          <Input
            placeholder="lecturer@university.edu"
            value={form.email}
            onChangeText={v => update('email', v)}
            type="email"
          />

          <Text style={styles.label}>Temporary Password *</Text>
          <Input
            placeholder="Min. 6 characters"
            value={form.password}
            onChangeText={v => update('password', v)}
            type="password"
          />

          <Text style={styles.label}>Department *</Text>
          <Input
            placeholder="e.g. Computer Science"
            value={form.department}
            onChangeText={v => update('department', v)}
          />

          <Text style={styles.label}>Specialization</Text>
          <Input
            placeholder="e.g. Machine Learning (optional)"
            value={form.specialization}
            onChangeText={v => update('specialization', v)}
          />

          {!!formError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={14} color={COLORS.red} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          )}

          <View style={{ height: 8 }} />
          <Button onPress={handleCreate} disabled={saving}>
            {saving ? 'Creating Account...' : 'Create Lecturer Account'}
          </Button>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

