import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

// Native-only; web builds skip notifications entirely (same pattern as push.js)
let Notifications = null;
if (Platform.OS !== 'web') {
  try { Notifications = require('expo-notifications'); } catch (_) {}
}

const STORAGE_KEY = 'focusSession';
const XP_PER_SESSION = 50;
// How long after backgrounding the app before we nudge the student back.
// Short app switches (checking a formula, replying to mum) don't nag.
const AWAY_REMINDER_SECONDS = 20;

const FocusContext = createContext(null);

async function cancelNotif(id) {
  if (!Notifications || !id) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch (_) {}
}

async function scheduleNotif(content, seconds) {
  if (!Notifications || seconds <= 0) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { sound: 'default', ...content },
      trigger: { seconds, channelId: Platform.OS === 'android' ? 'default' : undefined },
    });
  } catch (_) {
    return null;
  }
}

export function FocusProvider({ children }) {
  const { addXp } = useAuth();
  // session: { endsAt (ms), durationMin, completionNotifId }
  const [session, setSession] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const awayNotifRef = useRef(null);
  const sessionRef = useRef(null);
  sessionRef.current = session;

  const persist = useCallback(async (s) => {
    try {
      if (s) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
  }, []);

  const finishSession = useCallback((completed) => {
    const s = sessionRef.current;
    if (!s) return;
    cancelNotif(s.completionNotifId);
    cancelNotif(awayNotifRef.current);
    awayNotifRef.current = null;
    setSession(null);
    persist(null);
    if (completed) {
      addXp(XP_PER_SESSION);
      setJustCompleted(true);
    }
  }, [addXp, persist]);

  // Restore a session that was running when the app was last closed
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved.endsAt > Date.now()) {
          setSession(saved);
        } else {
          // Finished while the app was closed — credit the XP now
          await AsyncStorage.removeItem(STORAGE_KEY);
          addXp(XP_PER_SESSION);
          setJustCompleted(true);
        }
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wall-clock tick — survives navigation and short backgrounding
  useEffect(() => {
    if (!session) { setRemaining(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.round((session.endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) finishSession(true);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session, finishSession]);

  // Leaving the app mid-session schedules a "come back" reminder;
  // returning cancels it
  useEffect(() => {
    if (!session) return;
    const sub = AppState.addEventListener('change', async (next) => {
      if (!sessionRef.current) return;
      if (next === 'active') {
        cancelNotif(awayNotifRef.current);
        awayNotifRef.current = null;
      } else {
        const secondsLeft = Math.round((sessionRef.current.endsAt - Date.now()) / 1000);
        if (secondsLeft > AWAY_REMINDER_SECONDS) {
          awayNotifRef.current = await scheduleNotif({
            title: '⏳ Your focus session is still running',
            body: `${Math.max(1, Math.round(secondsLeft / 60))} min left — come back and keep studying to earn your ${XP_PER_SESSION} XP!`,
          }, AWAY_REMINDER_SECONDS);
        }
      }
    });
    return () => sub.remove();
  }, [session]);

  const start = useCallback(async (durationMin) => {
    const endsAt = Date.now() + durationMin * 60 * 1000;
    const completionNotifId = await scheduleNotif({
      title: '🎉 Focus session complete!',
      body: `Great work — you stayed focused for ${durationMin} minutes and earned ${XP_PER_SESSION} XP.`,
    }, durationMin * 60);
    const s = { endsAt, durationMin, completionNotifId };
    setSession(s);
    setJustCompleted(false);
    persist(s);
  }, [persist]);

  const stop = useCallback(() => finishSession(false), [finishSession]);
  const clearCompleted = useCallback(() => setJustCompleted(false), []);

  const totalSeconds = (session?.durationMin || 0) * 60;

  return (
    <FocusContext.Provider value={{
      active: !!session,
      durationMin: session?.durationMin || 0,
      remaining,
      totalSeconds,
      pct: session && totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0,
      justCompleted,
      xpPerSession: XP_PER_SESSION,
      start, stop, clearCompleted,
    }}>
      {children}
    </FocusContext.Provider>
  );
}

export const useFocus = () => {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
};
