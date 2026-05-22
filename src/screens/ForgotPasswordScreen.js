import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { Input, Button, Toast, useToast } from '../components/UI';
import { apiForgotPassword, apiVerifyOTP, apiResetPassword } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);
  const { toast, showToast } = useToast();

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const startResendTimer = () => {
    setResendTimer(60);
    timerRef.current = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  // ── Step 1: Request OTP ──
  const handleRequestOTP = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await apiForgotPassword(email.trim());
      setStep(2);
      startResendTimer();
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      await apiForgotPassword(email.trim());
      setOtp(['', '', '', '', '', '']);
      startResendTimer();
      showToast('A new code has been sent to your email.', 'success');
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } catch (err) {
      setError(err.message || 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──
  const handleOTPChange = (index, value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 1) {
      const next = [...otp];
      for (let i = 0; i < digits.length && index + i < 6; i++) {
        next[index + i] = digits[i];
      }
      setOtp(next);
      const focusIdx = Math.min(index + digits.length, 5);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    if (digits && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await apiVerifyOTP(email.trim(), code);
      setStep(3);
    } catch (err) {
      setError(err.message || 'The code is incorrect or has expired.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ──
  const handleResetPassword = async () => {
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await apiResetPassword(email.trim(), otp.join(''), password);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Could not reset password. Please start over.');
    } finally {
      setLoading(false);
    }
  };

  const stepProgress = Math.min(step, 3) / 3;

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    progressTrack: { height: 3, backgroundColor: '#1a1a1a', marginHorizontal: SPACING.xl, borderRadius: 2, marginBottom: 8 },
    progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 2 },
    content: { flex: 1, paddingHorizontal: SPACING.xxl, justifyContent: 'center', gap: 0 },
    iconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
    stepTitle: { fontSize: 20, fontWeight: FONT.bold, color: COLORS.t1, textAlign: 'center', marginBottom: 8 },
    stepDesc: { fontSize: 13, color: COLORS.t3, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
    errorMsg: { fontSize: 12, color: COLORS.red, marginBottom: 12, marginTop: -4 },
    otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 28 },
    otpBox: { width: 46, height: 56, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.card, textAlign: 'center', fontSize: 22, fontWeight: FONT.bold, color: COLORS.t1 },
    otpBoxFilled: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '10' },
    backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20 },
    backLinkText: { fontSize: 13, color: COLORS.silver },
    resendBtn: { alignItems: 'center', marginTop: 16 },
    resendText: { fontSize: 13, color: COLORS.accent },
    resendDisabled: { color: COLORS.t3 },
    successContent: { flex: 1, paddingHorizontal: SPACING.xxl, alignItems: 'center', justifyContent: 'center' },
    successIcon: { marginBottom: 24 },
    successTitle: { fontSize: 26, fontWeight: FONT.extrabold, color: COLORS.t1, marginBottom: 12, textAlign: 'center' },
    successDesc: { fontSize: 14, color: COLORS.t3, textAlign: 'center', lineHeight: 22 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />

      <View style={styles.header}>
        {step < 4 && (
          <TouchableOpacity onPress={() => { setError(''); step > 1 ? setStep(step - 1) : navigation.goBack(); }}>
            <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Reset Password</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${stepProgress * 100}%` }]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── Step 1: Email ── */}
        {step === 1 && (
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="lock-open-outline" size={34} color={COLORS.accent} />
            </View>
            <Text style={styles.stepTitle}>Forgot your password?</Text>
            <Text style={styles.stepDesc}>Enter your account email and we'll send a 6-digit verification code.</Text>
            <Input
              placeholder="Email address"
              type="email"
              value={email}
              onChangeText={v => { setEmail(v); setError(''); }}
              autoFocus
            />
            {!!error && <Text style={styles.errorMsg}>{error}</Text>}
            <Button onPress={handleRequestOTP} disabled={loading || !email.trim()}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
              <Ionicons name="arrow-back" size={14} color={COLORS.silver} />
              <Text style={styles.backLinkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 2 && (
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="mail-open-outline" size={34} color={COLORS.accent} />
            </View>
            <Text style={styles.stepTitle}>Enter verification code</Text>
            <Text style={styles.stepDesc}>
              We sent a 6-digit code to{'\n'}
              <Text style={{ color: COLORS.t1, fontWeight: FONT.semibold }}>{email}</Text>
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={r => { otpRefs.current[i] = r; }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={v => { handleOTPChange(i, v); setError(''); }}
                  onKeyPress={({ nativeEvent }) => handleOTPKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={6}
                  selectTextOnFocus
                />
              ))}
            </View>

            {!!error && <Text style={[styles.errorMsg, { textAlign: 'center', marginBottom: 12 }]}>{error}</Text>}

            <Button onPress={handleVerifyOTP} disabled={loading || otp.join('').length < 6}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <TouchableOpacity onPress={handleResend} style={styles.resendBtn} disabled={resendTimer > 0 || loading}>
              <Text style={[styles.resendText, (resendTimer > 0 || loading) && styles.resendDisabled]}>
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't get it? Resend"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 3: New Password ── */}
        {step === 3 && (
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Ionicons name="shield-checkmark-outline" size={34} color={COLORS.accent} />
            </View>
            <Text style={styles.stepTitle}>Create new password</Text>
            <Text style={styles.stepDesc}>Choose a strong password you haven't used before.</Text>
            <Input
              placeholder="New password (min 8 chars)"
              type="password"
              value={password}
              onChangeText={v => { setPassword(v); setError(''); }}
            />
            <Input
              placeholder="Confirm new password"
              type="password"
              value={confirmPassword}
              onChangeText={v => { setConfirmPassword(v); setError(''); }}
            />
            {!!error && <Text style={styles.errorMsg}>{error}</Text>}
            <Button onPress={handleResetPassword} disabled={loading || !password || !confirmPassword}>
              {loading ? 'Updating...' : 'Reset Password'}
            </Button>
          </View>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && (
          <View style={styles.successContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color={COLORS.accent} />
            </View>
            <Text style={styles.successTitle}>Password Updated!</Text>
            <Text style={styles.successDesc}>
              Your password has been reset successfully.{'\n'}You can now log in with your new password.
            </Text>
            <View style={{ width: '100%', marginTop: 36 }}>
              <Button onPress={() => navigation.replace('Login')}>
                Go to Login
              </Button>
            </View>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

