import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { FONT, TYPE, SPACING, RADIUS } from '../utils/theme';
import { Input, Button, haptic } from '../components/UI';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, isGoogleConfigured } from '../config/auth';
import { FEATURES } from '../config/features';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

WebBrowser.maybeCompleteAuthSession();

// The Google provider hook THROWS if the platform's client ID is missing,
// so it can only ever run when this returns true for the current platform.
const googleReadyForPlatform = () => {
  if (!FEATURES.GOOGLE_LOGIN || !isGoogleConfigured()) return false;
  if (Platform.OS === 'web') return true;
  // Expo Go's package name doesn't match the OAuth registration — installed builds only
  if (Constants.appOwnership === 'expo') return false;
  if (Platform.OS === 'android') return !!GOOGLE_ANDROID_CLIENT_ID;
  if (Platform.OS === 'ios') return !!GOOGLE_IOS_CLIENT_ID;
  return false;
};

// Isolated so the useAuthRequest hook only executes when rendered
function GoogleSignInButton({ onToken, onError, loading }) {
  const { colors: COLORS } = useTheme();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.authentication?.idToken || response.params?.id_token;
      if (idToken) {
        onToken(idToken);
      } else {
        const got = response.authentication ? Object.keys(response.authentication).join(', ') : 'nothing';
        onError(`Google sign-in came back without an ID token (received: ${got}). Please try again.`);
      }
    } else if (response.type === 'error') {
      onError(`Google sign-in failed: ${response.error?.message || response.params?.error_description || response.error || 'unknown error'}`);
    } else if (response.type === 'dismiss' || response.type === 'cancel') {
      onError('Google sign-in closed before finishing (the response never reached the app). Please try again.');
    } else {
      onError(`Google sign-in ended unexpectedly (${response.type}).`);
    }
  }, [response]);

  return (
    <Pressable
      onPress={() => { haptic.light(); promptAsync(); }}
      disabled={loading || !request}
      style={({ pressed }) => ({
        width: '100%', height: 56, borderRadius: RADIUS.lg,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.md,
        backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
        marginBottom: SPACING.md,
        opacity: loading ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name="logo-google" size={20} color={COLORS.t1} />
      <Text style={{ fontSize: TYPE.title, fontWeight: FONT.bold, color: COLORS.t1 }}>
        {loading ? 'Signing in…' : 'Continue with Google'}
      </Text>
    </Pressable>
  );
}

export default function LoginScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();

  const showGoogle = googleReadyForPlatform();

  const handleGoogleToken = async (idToken) => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(idToken);
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

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

          {showGoogle && (
            <GoogleSignInButton onToken={handleGoogleToken} onError={setError} loading={googleLoading} />
          )}

          <Button variant="secondary" onPress={() => navigation.navigate('Register')}>Create Account</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
