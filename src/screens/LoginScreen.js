import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT, TYPE, SPACING, RADIUS } from '../utils/theme';
import { Input, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
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

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
    logoWrap: { alignItems: 'center', marginBottom: SPACING.xxl + SPACING.sm },
    logo: { width: 72, height: 72, borderRadius: 24, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
    logoText: { fontSize: TYPE.display, fontWeight: FONT.bold, color: '#16181D', letterSpacing: -1 },
    appName: { fontSize: TYPE.display - 4, fontWeight: FONT.bold, color: COLORS.t1, letterSpacing: -0.5 },
    tagline: { fontSize: TYPE.micro, color: COLORS.t3, letterSpacing: 2, textTransform: 'uppercase', marginTop: SPACING.sm },
    errorBox: { backgroundColor: COLORS.red + '14', borderWidth: 1, borderColor: COLORS.red + '40', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg },
    errorText: { fontSize: TYPE.caption, color: COLORS.red, textAlign: 'center', lineHeight: 18 },
    forgotBtn: { alignItems: 'center', marginTop: SPACING.lg },
    forgotText: { fontSize: TYPE.body, color: COLORS.t2 },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.xl, gap: SPACING.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    dividerText: { fontSize: TYPE.micro, color: COLORS.t3, textTransform: 'uppercase', letterSpacing: 1 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logo}><Text style={styles.logoText}>iL</Text></View>
            <Text style={styles.appName}>iLearn</Text>
            <Text style={styles.tagline}>Learn · Create · Grow</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input placeholder="Email address" type="email" value={email} onChangeText={(v) => { setEmail(v); setError(''); }} />
          <Input placeholder="Password" type="password" value={password} onChangeText={(v) => { setPassword(v); setError(''); }} />

          <View style={{ height: SPACING.xs }} />
          <Button onPress={handleLogin} loading={loading}>Sign In</Button>

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
