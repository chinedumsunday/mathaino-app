import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING } from '../utils/theme';
import { Input, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
    department: '', matricNumber: '', level: '',
  });
  const { register } = useAuth();

  const update = (key, val) => { setForm(p => ({ ...p, [key]: val })); setError(''); };

  const handleRegister = async () => {
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        role: 'STUDENT',
        department: form.department.trim() || undefined,
        matricNumber: form.matricNumber.trim() || undefined,
        level: form.level.trim() || undefined,
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Registration</Text>
        <Text style={styles.headerSub}>Lecturers and admins are added by your institution's admin.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Input placeholder="First Name *" value={form.firstName} onChangeText={v => update('firstName', v)} />
        <Input placeholder="Last Name *" value={form.lastName} onChangeText={v => update('lastName', v)} />
        <Input placeholder="Email address *" type="email" value={form.email} onChangeText={v => update('email', v)} />
        <Input placeholder="Phone number" type="phone" value={form.phone} onChangeText={v => update('phone', v)} />
        <Input placeholder="Password * (min 8 chars)" type="password" value={form.password} onChangeText={v => update('password', v)} />
        <Input placeholder="Confirm Password *" type="password" value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} />
        <Input placeholder="Matric Number" value={form.matricNumber} onChangeText={v => update('matricNumber', v)} />
        <Input placeholder="Level (e.g. 400)" value={form.level} onChangeText={v => update('level', v)} />
        <Input placeholder="Department" value={form.department} onChangeText={v => update('department', v)} />

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={{ marginTop: 8 }}>
          {loading ? (
            <View style={styles.loadingBtn}>
              <ActivityIndicator color="#000" />
            </View>
          ) : (
            <Button onPress={handleRegister}>Create Student Account</Button>
          )}
        </View>

        <View style={{ height: 16 }} />
        <Button variant="secondary" onPress={() => navigation.goBack()}>
          Already have an account? Sign In
        </Button>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.xl, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
  headerSub: { fontSize: 12, color: COLORS.t3, marginTop: 4, lineHeight: 18 },
  content: { padding: SPACING.xxl, paddingTop: 0 },
  loadingBtn: { width: '100%', padding: 15, backgroundColor: COLORS.accent, borderRadius: 12, alignItems: 'center', opacity: 0.7 },
  errorBanner: { backgroundColor: COLORS.red + '15', borderRadius: 10, padding: 12, marginBottom: 8 },
  errorText: { fontSize: 12, color: COLORS.red, lineHeight: 18 },
});
