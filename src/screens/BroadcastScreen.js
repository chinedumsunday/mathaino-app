import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, TYPE, SPACING, RADIUS } from '../utils/theme';
import { Input, Button, Chip, ScreenHeader, ConfirmModal, Toast, useToast } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { apiBroadcastNotification } from '../services/api';

const AUDIENCES = [
  { id: 'ALL', label: 'Everyone' },
  { id: 'STUDENT', label: 'Students' },
  { id: 'LECTURER', label: 'Lecturers' },
];

export default function BroadcastScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast, showToast } = useToast();

  const audienceLabel = AUDIENCES.find(a => a.id === audience)?.label || 'Everyone';
  const canSend = title.trim().length > 0 && message.trim().length > 0;

  const send = async () => {
    setConfirm(false);
    setSending(true);
    try {
      const res = await apiBroadcastNotification(title.trim(), message.trim(), audience);
      showToast(res.message || 'Announcement sent.', 'success');
      setTitle('');
      setMessage('');
    } catch (e) {
      showToast(e.message || 'Could not send announcement.', 'error');
    } finally {
      setSending(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
    infoCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md,
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
      borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.xl,
    },
    infoText: { flex: 1, fontSize: TYPE.caption, color: COLORS.t2, lineHeight: 18 },
    label: { fontSize: TYPE.caption, color: COLORS.t2, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
    chipRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
    counter: { fontSize: TYPE.micro, color: COLORS.t3, textAlign: 'right', marginTop: -SPACING.sm, marginBottom: SPACING.md },
    footer: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Toast toast={toast} />
      <ScreenHeader title="Announcement" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.infoCard}>
            <Ionicons name="megaphone" size={18} color={COLORS.accent} />
            <Text style={styles.infoText}>
              Sends an in-app notification to every active user in the selected audience. Use this for app updates, schedule changes, and important news.
            </Text>
          </View>

          <Text style={styles.label}>Audience</Text>
          <View style={styles.chipRow}>
            {AUDIENCES.map(a => (
              <Chip key={a.id} label={a.label} active={audience === a.id} onPress={() => setAudience(a.id)} />
            ))}
          </View>

          <Input
            label="Title"
            placeholder="e.g. App update — new live classes"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Message"
            placeholder="What do you want everyone to know?"
            value={message}
            onChangeText={setMessage}
            multiline
            rows={5}
          />
          <Text style={styles.counter}>{message.length}/500</Text>
        </ScrollView>

        <View style={styles.footer}>
          <Button onPress={() => setConfirm(true)} disabled={!canSend} loading={sending} icon="send">
            Send to {audienceLabel}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={confirm}
        title={`Send to ${audienceLabel.toLowerCase()}?`}
        message={`"${title.trim()}" will be delivered to every active ${audience === 'ALL' ? 'user' : audience.toLowerCase()} immediately. This cannot be unsent.`}
        confirmLabel="Send"
        onCancel={() => setConfirm(false)}
        onConfirm={send}
      />
    </SafeAreaView>
  );
}
