import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT, SPACING } from '../utils/theme';
import { Input, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logo}><Text style={styles.logoText}>M</Text></View>
            <Text style={styles.appName}>Mathaino</Text>
            <Text style={styles.tagline}>Learn • Create • Grow</Text>
          </View>

          {/* Error message */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input placeholder="Email address" type="email" value={email} onChangeText={(v) => { setEmail(v); setError(''); }} />
          <Input placeholder="Password" type="password" value={password} onChangeText={(v) => { setPassword(v); setError(''); }} />

          <TouchableOpacity onPress={handleLogin} disabled={loading} style={[styles.loginBtn, loading && { opacity: 0.7 }]} activeOpacity={0.7}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.loginBtnText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button variant="secondary" onPress={() => navigation.navigate('Register')}>Create Account</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xxl },
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoText: { fontSize: 30, fontWeight: FONT.extrabold, color: '#000' },
  appName: { fontSize: 26, fontWeight: FONT.extrabold, color: COLORS.t1, letterSpacing: -0.5 },
  tagline: { fontSize: 11, color: COLORS.t3, letterSpacing: 2, textTransform: 'uppercase', marginTop: 6 },
  errorBox: { backgroundColor: '#FF4D4D18', borderWidth: 1, borderColor: '#FF4D4D40', borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: '#FF6B6B', textAlign: 'center', lineHeight: 18 },
  loginBtn: { width: '100%', padding: 15, backgroundColor: COLORS.accent, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  loginBtnText: { fontSize: 15, fontWeight: FONT.bold, color: '#000' },
  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { fontSize: 13, color: COLORS.silver },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 11, color: COLORS.t3, textTransform: 'uppercase', letterSpacing: 1 },
});