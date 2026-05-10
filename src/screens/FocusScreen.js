import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONT, SPACING, RADIUS, progressColor } from '../utils/theme';
import { Chip, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function FocusScreen({ navigation }) {
  const [duration, setDuration] = useState(25);
  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm }
  const [doneModal, setDoneModal] = useState(false);
  const intervalRef = useRef(null);
  const { addXp } = useAuth();

  const totalSeconds = duration * 60;
  const remaining = totalSeconds - elapsed;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = active ? (elapsed / totalSeconds) * 100 : 0;

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev >= totalSeconds - 1) {
            clearInterval(intervalRef.current);
            setActive(false);
            addXp(50);
            setDoneModal(true);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    } else {
      clearInterval(intervalRef.current);
    }
  }, [active, totalSeconds]);

  const showConfirm = (title, message, onConfirm) => setConfirmModal({ title, message, onConfirm });
  const dismissConfirm = () => setConfirmModal(null);

  const handleToggle = () => {
    if (active) {
      showConfirm(
        'Stop Focus Session?',
        "You won't earn XP for this session if you stop now.",
        () => { setActive(false); setElapsed(0); }
      );
    } else {
      setElapsed(0);
      setActive(true);
    }
  };

  const handleBack = () => {
    if (!active) { navigation.goBack(); return; }
    showConfirm(
      'Leave Focus?',
      'Your current session progress will be lost.',
      () => { setActive(false); setElapsed(0); navigation.goBack(); }
    );
  };

  // SVG circle
  const size = 220;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct / 100);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Focus complete modal */}
      <Modal visible={doneModal} transparent animationType="fade" onRequestClose={() => { setDoneModal(false); setElapsed(0); }}>
        <View style={modal.overlay}>
          <View style={modal.box}>
            <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>🎉</Text>
            <Text style={modal.title}>Focus Complete!</Text>
            <Text style={modal.message}>You earned 50 XP! Great focus session. Keep up the momentum!</Text>
            <TouchableOpacity
              onPress={() => { setDoneModal(false); setElapsed(0); }}
              style={[modal.btn, modal.primaryBtn, { marginTop: 8 }]}
            >
              <Text style={modal.primaryText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!confirmModal} transparent animationType="fade" onRequestClose={dismissConfirm}>
        <View style={modal.overlay}>
          <View style={modal.box}>
            <Text style={modal.title}>{confirmModal?.title}</Text>
            <Text style={modal.message}>{confirmModal?.message}</Text>
            <View style={modal.actions}>
              <TouchableOpacity onPress={dismissConfirm} style={[modal.btn, modal.cancelBtn]}>
                <Text style={modal.cancelText}>Keep Going</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { dismissConfirm(); confirmModal?.onConfirm?.(); }}
                style={[modal.btn, modal.dangerBtn]}
              >
                <Text style={modal.dangerText}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <Text style={styles.title}>Focus Mode</Text>
        <Ionicons name="timer" size={22} color={COLORS.pink} />
      </View>

      <View style={styles.content}>
        {/* Timer Ring */}
        <View style={styles.timerWrap}>
          <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1A1A1A" strokeWidth={strokeWidth} />
            <Circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={active ? progressColor(pct) : '#333'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </Svg>
          <View style={styles.timerCenter}>
            <Text style={styles.timerText}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </Text>
            <Text style={styles.timerLabel}>
              {active ? 'Stay focused!' : 'Ready?'}
            </Text>
          </View>
        </View>

        {/* Duration selector */}
        {!active && (
          <View style={styles.durationRow}>
            {[15, 25, 45, 60].map(m => (
              <Chip key={m} label={`${m}m`} active={duration === m} onPress={() => setDuration(m)} />
            ))}
          </View>
        )}

        {/* Start/Stop button */}
        <View style={{ width: '60%' }}>
          <Button onPress={handleToggle}>
            {active ? 'Stop Session' : 'Start Focus'}
          </Button>
        </View>

        {/* XP info */}
        <View style={styles.xpInfo}>
          <Ionicons name="star" size={16} color={COLORS.accent} />
          <Text style={styles.xpText}>
            {active ? '+50 XP on completion' : 'Earn 50 XP per completed session'}
          </Text>
        </View>

        {/* Tips */}
        {!active && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Focus Tips</Text>
            {[
              'Put your phone on silent mode',
              'Close all unnecessary tabs',
              'Have water nearby',
              'Take a break between sessions',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.teal} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {active && (
          <View style={styles.encourageCard}>
            <Text style={styles.encourageEmoji}>💪</Text>
            <Text style={styles.encourageText}>You're doing great! Stay in the zone.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  timerWrap: { position: 'relative', width: 220, height: 220, marginBottom: 30 },
  timerCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 40, fontWeight: FONT.extrabold, color: COLORS.t1 },
  timerLabel: { fontSize: 12, color: COLORS.t3, marginTop: 4 },
  durationRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  xpInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20 },
  xpText: { fontSize: 12, color: COLORS.t3 },
  tipsCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 16, marginTop: 24, width: '100%' },
  tipsTitle: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipText: { fontSize: 12, color: COLORS.t2 },
  encourageCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 20, marginTop: 24, alignItems: 'center' },
  encourageEmoji: { fontSize: 32, marginBottom: 8 },
  encourageText: { fontSize: 13, color: COLORS.t2, textAlign: 'center' },
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
  dangerBtn: { borderColor: COLORS.red, backgroundColor: COLORS.red + '18' },
  dangerText: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.red },
  primaryBtn: { borderColor: COLORS.accent, backgroundColor: COLORS.accent, width: '100%' },
  primaryText: { fontSize: 14, fontWeight: FONT.bold, color: '#000', textAlign: 'center' },
});
