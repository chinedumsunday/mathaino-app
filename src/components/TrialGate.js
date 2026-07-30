import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { TRIAL, trialEndsAtMs } from '../config/trial';
import { apiHealth } from '../services/api';

// Countdown pill + hard lock for the client review build. The deadline is an
// absolute timestamp baked into the bundle, and it is compared against the
// API server's clock (not the device's) so changing the system date does not
// buy extra time. If the API is unreachable we fall back to the device clock —
// the deadline itself still holds.
export default function TrialGate() {
  const { colors: COLORS } = useTheme();
  const [skewMs, setSkewMs] = useState(0); // serverNow - deviceNow
  const [now, setNow] = useState(() => Date.now());

  // Sync to server time on mount, then periodically for long-open sessions.
  useEffect(() => {
    if (!TRIAL.ENABLED) return undefined;
    let cancelled = false;
    const sync = async () => {
      try {
        const res = await apiHealth();
        const serverMs = new Date(res?.timestamp).getTime();
        if (!cancelled && Number.isFinite(serverMs)) setSkewMs(serverMs - Date.now());
      } catch (_) {
        // Offline — keep using the device clock against the same deadline.
      }
    };
    sync();
    const iv = setInterval(sync, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  useEffect(() => {
    if (!TRIAL.ENABLED) return undefined;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const s = useMemo(() => StyleSheet.create({
    pill: {
      position: 'absolute', bottom: 84, left: 16, zIndex: 60,
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: COLORS.card, borderWidth: 1, borderRadius: 22,
      paddingVertical: 8, paddingHorizontal: 14,
      shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 }, elevation: 6,
    },
    pillText: { fontSize: 12, fontWeight: FONT.bold, fontVariant: ['tabular-nums'] },
    lock: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999, backgroundColor: COLORS.bg,
      alignItems: 'center', justifyContent: 'center', padding: 28,
    },
    card: {
      width: '100%', maxWidth: 420, alignItems: 'center',
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
      borderRadius: RADIUS.lg, padding: 28,
    },
    logo: {
      width: 60, height: 60, borderRadius: 20, backgroundColor: COLORS.accent,
      alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    },
    logoText: { fontSize: 26, fontWeight: FONT.extrabold, color: '#16181D' },
    title: { fontSize: 19, fontWeight: FONT.bold, color: COLORS.t1, textAlign: 'center' },
    body: { fontSize: 13, color: COLORS.t2, lineHeight: 21, textAlign: 'center', marginTop: 12 },
    contactBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22,
      backgroundColor: COLORS.accent, borderRadius: RADIUS.md,
      paddingVertical: 13, paddingHorizontal: 22,
    },
    contactText: { fontSize: 14, fontWeight: FONT.bold, color: '#16181D' },
    contactHint: { fontSize: 11, color: COLORS.t3, marginTop: 14, textAlign: 'center' },
  }), [COLORS]);

  if (!TRIAL.ENABLED) return null;

  const remaining = trialEndsAtMs() - (now + skewMs);

  // ── Expired: block the whole app ──
  if (remaining <= 0) {
    return (
      <View style={s.lock}>
        <View style={s.card}>
          <View style={s.logo}><Text style={s.logoText}>iL</Text></View>
          <Text style={s.title}>Demo period has ended</Text>
          <Text style={s.body}>
            Thanks for reviewing iLearn. This preview was available for 2 days and has now closed.
            Get in touch to activate full, unrestricted access for your team.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${TRIAL.CONTACT}?subject=iLearn%20full%20access`)}
            style={s.contactBtn}
          >
            <Ionicons name="mail" size={16} color="#16181D" />
            <Text style={s.contactText}>Contact {TRIAL.OWNER}</Text>
          </TouchableOpacity>
          <Text style={s.contactHint}>{TRIAL.CONTACT}</Text>
        </View>
      </View>
    );
  }

  // ── Active: countdown pill ──
  const secs = Math.floor(remaining / 1000);
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const sec = secs % 60;
  const label = d > 0 ? `${d}d ${h}h left`
    : h > 0 ? `${h}h ${m}m left`
    : `${m}m ${String(sec).padStart(2, '0')}s left`;
  const urgent = remaining < 6 * 60 * 60 * 1000; // final 6 hours
  const tint = urgent ? COLORS.orange : COLORS.t2;

  return (
    <View style={[s.pill, { borderColor: tint + '60' }]} pointerEvents="none">
      <Ionicons name="time-outline" size={14} color={tint} />
      <Text style={[s.pillText, { color: tint }]}>Demo · {label}</Text>
    </View>
  );
}
