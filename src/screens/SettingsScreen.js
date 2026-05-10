import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../utils/theme';
import { Card, Button, Toast, useToast } from '../components/UI';
import { useAuth } from '../context/AuthContext';

function ConfirmModal({ visible, title, message, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={modal.overlay}>
        <View style={modal.box}>
          <Text style={modal.title}>{title}</Text>
          <Text style={modal.message}>{message}</Text>
          <View style={modal.actions}>
            <TouchableOpacity onPress={onCancel} style={[modal.btn, modal.cancelBtn]}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[modal.btn, danger ? modal.dangerBtn : modal.confirmBtn]}>
              <Text style={danger ? modal.dangerText : modal.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const { toast, showToast } = useToast();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    darkMode: true,
    soundEffects: true,
    autoPlayVideos: false,
    focusReminders: true,
    streakReminders: true,
  });
  const [clearVisible, setClearVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        { key: 'pushNotifications', label: 'Push Notifications', icon: 'notifications-outline', desc: 'Receive alerts on your device' },
        { key: 'emailNotifications', label: 'Email Notifications', icon: 'mail-outline', desc: 'Get updates via email' },
        { key: 'focusReminders', label: 'Focus Reminders', icon: 'timer-outline', desc: 'Daily focus session reminders' },
        { key: 'streakReminders', label: 'Streak Reminders', icon: 'flame-outline', desc: "Don't lose your streak!" },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { key: 'darkMode', label: 'Dark Mode', icon: 'moon-outline', desc: 'Always on' },
        { key: 'soundEffects', label: 'Sound Effects', icon: 'volume-medium-outline', desc: 'Play sounds for actions' },
        { key: 'autoPlayVideos', label: 'Auto-play Videos', icon: 'play-circle-outline', desc: 'Videos play automatically' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Toast toast={toast} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ConfirmModal
        visible={clearVisible}
        title="Clear Cache"
        message="This will clear cached data. You may need to re-download course content."
        confirmLabel="Clear"
        danger
        onConfirm={() => { setClearVisible(false); showToast('Cache cleared successfully.', 'success'); }}
        onCancel={() => setClearVisible(false)}
      />

      <ConfirmModal
        visible={deleteVisible}
        title="Delete Account"
        message="This action is permanent. All your data, progress, and XP will be deleted and cannot be recovered."
        confirmLabel="Delete Forever"
        danger
        onConfirm={() => { setDeleteVisible(false); logout(); }}
        onCancel={() => setDeleteVisible(false)}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {settingSections.map(section => (
          <View key={section.title} style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={{ padding: 0 }}>
              {section.items.map((item, i) => (
                <View key={item.key} style={[styles.settingRow, i < section.items.length - 1 && styles.settingBorder]}>
                  <Ionicons name={item.icon} size={18} color={COLORS.t3} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => toggle(item.key)}
                    trackColor={{ false: '#1A1A1A', true: COLORS.accent + '60' }}
                    thumbColor={settings[item.key] ? COLORS.accent : COLORS.t3}
                  />
                </View>
              ))}
            </Card>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Storage & Data</Text>
        <Card style={{ padding: 0 }}>
          <TouchableOpacity onPress={() => setClearVisible(true)} style={styles.actionRow}>
            <Ionicons name="trash-outline" size={18} color={COLORS.t3} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.settingLabel}>Clear Cache</Text>
              <Text style={styles.settingDesc}>Free up space on your device</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.t3} />
          </TouchableOpacity>
        </Card>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card style={{ padding: 0 }}>
            {[
              { label: 'App Version', value: '1.0.0' },
              { label: 'Build', value: '2026.04.17' },
            ].map((item, i, arr) => (
              <View key={i} style={[styles.infoRow, i < arr.length - 1 && styles.settingBorder]}>
                <Text style={styles.settingLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </Card>
        </View>

        <View style={{ marginTop: 28 }}>
          <Text style={[styles.sectionTitle, { color: COLORS.red }]}>Danger Zone</Text>
          <Button variant="danger" onPress={() => setDeleteVisible(true)}>
            Delete Account
          </Button>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
  scrollContent: { paddingHorizontal: SPACING.xl },
  sectionTitle: { fontSize: 12, fontWeight: FONT.bold, color: COLORS.t3, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingLabel: { fontSize: 13, fontWeight: FONT.medium, color: COLORS.t1 },
  settingDesc: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  infoValue: { fontSize: 13, color: COLORS.silver, fontWeight: FONT.medium },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000AA', alignItems: 'center', justifyContent: 'center', padding: 32 },
  box: { width: '100%', backgroundColor: COLORS.card, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
  title: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 10 },
  message: { fontSize: 13, color: COLORS.t3, lineHeight: 20, marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  cancelBtn: { borderColor: COLORS.border },
  cancelText: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t2 },
  confirmBtn: { borderColor: COLORS.accent, backgroundColor: COLORS.accent + '18' },
  confirmText: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.accent },
  dangerBtn: { borderColor: COLORS.red, backgroundColor: COLORS.red + '18' },
  dangerText: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.red },
});
