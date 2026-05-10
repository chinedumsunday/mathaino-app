import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { apiLogin, apiRegister, apiGetMe, apiUpdateProfile, setToken, loadToken } from '../services/api';

let firebaseAuth = null;
let fbSignIn = null;
let fbSignOut = null;
let fbSendReset = null;

// Dynamic import to handle web vs native
const initFirebase = async () => {
  try {
    const { auth } = require('../services/firebase');
    const { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } = require('firebase/auth');
    firebaseAuth = auth;
    fbSignIn = signInWithEmailAndPassword;
    fbSignOut = signOut;
    fbSendReset = sendPasswordResetEmail;
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
  }
};

const normalizeUser = (raw) => {
  if (!raw) return null;
  const profile = raw.studentProfile || raw.lecturerProfile || raw.facultyProfile || {};
  return {
    id: raw.id || 'unknown',
    firstName: raw.firstName || raw.first_name || '',
    lastName: raw.lastName || raw.last_name || '',
    email: raw.email || '',
    phone: raw.phone || '',
    role: (raw.role || 'STUDENT').toUpperCase(),
    status: raw.status || 'ACTIVE',
    bio: raw.bio || '',
    avatarUrl: raw.avatarUrl || raw.avatar_url || null,
    matric: profile.matricNumber || profile.matric_number || '',
    dept: profile.department || '',
    level: profile.level || '',
    specialization: profile.specialization || '',
    title: profile.title || '',
    xp: raw.xp || 0,
    streak: raw.streak || 0,
  };
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await initFirebase();
      try {
        const token = await loadToken();
        if (token) {
          const res = await apiGetMe();
          setUser(normalizeUser(res.data.user));
          setIsLoggedIn(true);
        }
      } catch (err) {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const register = async ({ email, password, firstName, lastName, phone, role, department, matricNumber, level, specialization, title }) => {
    const res = await apiRegister({
      email, password, firstName, lastName, phone, role,
      department, matricNumber, level, specialization, title,
    });
    await setToken(res.data.accessToken);
    setUser(normalizeUser(res.data.user));
    setIsLoggedIn(true);
    return res.data;
  };

  const login = async (email, password) => {
    if (!firebaseAuth || !fbSignIn) {
      throw new Error('Firebase not initialized. Please restart the app.');
    }
    try {
      const cred = await fbSignIn(firebaseAuth, email, password);
      const idToken = await cred.user.getIdToken();
      const res = await apiLogin(idToken);
      await setToken(res.data.accessToken);
      setUser(normalizeUser(res.data.user));
      setIsLoggedIn(true);
      return res.data;
    } catch (err) {
      const code = err.code || '';
      if (code.includes('user-not-found')) throw new Error('No account found with this email. Please register first.');
      if (code.includes('wrong-password')) throw new Error('Incorrect password. Please try again.');
      if (code.includes('invalid-credential')) throw new Error('Invalid email or password. Please check and try again.');
      if (code.includes('invalid-email')) throw new Error('Please enter a valid email address.');
      if (code.includes('too-many-requests')) throw new Error('Too many failed attempts. Please wait a few minutes.');
      if (code.includes('user-disabled')) throw new Error('This account has been disabled. Contact support.');
      if (err.message && !code) throw err;
      throw new Error('Login failed. Please check your credentials and try again.');
    }
  };

  const devLogin = (role = 'STUDENT') => {
    const roles = {
      STUDENT: { firstName: 'Ada', lastName: 'Okonkwo', email: 'ada@mathaino.app', role: 'STUDENT', matric: 'STU/2024/001', dept: 'Computer Science', level: '400' },
      LECTURER: { firstName: 'John', lastName: 'Lecturer', email: 'john@mathaino.app', role: 'LECTURER', dept: 'Computer Science', specialization: 'Machine Learning' },
      FACULTY: { firstName: 'Jane', lastName: 'Faculty', email: 'jane@mathaino.app', role: 'FACULTY', dept: 'Computer Science', title: 'Dean of Studies' },
      SUPER_ADMIN: { firstName: 'Super', lastName: 'Admin', email: 'admin@mathaino.app', role: 'SUPER_ADMIN', dept: 'Administration' },
    };
    const data = roles[role] || roles.STUDENT;
    setUser({
      id: `dev-${role.toLowerCase()}`,
      ...data,
      phone: '+234 801 234 5678',
      status: 'ACTIVE',
      bio: '',
      avatarUrl: null,
      xp: 2450,
      streak: 7,
    });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    try {
      if (firebaseAuth && fbSignOut) {
        try { await fbSignOut(firebaseAuth); } catch (_) {}
      }
      try { await setToken(null); } catch (_) {}
    } finally {
      // Always runs — clears state regardless of any errors above
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  const resetPassword = async (email) => {
    if (!firebaseAuth || !fbSendReset) {
      throw new Error('Firebase not initialized.');
    }
    try {
      await fbSendReset(firebaseAuth, email);
    } catch (err) {
      const code = err.code || '';
      if (code.includes('user-not-found')) throw new Error('No account found with this email.');
      if (code.includes('invalid-email')) throw new Error('Please enter a valid email address.');
      throw new Error('Failed to send reset email. Please try again.');
    }
  };

  const updateUser = async (updates) => {
    try {
      const res = await apiUpdateProfile(updates);
      setUser(normalizeUser(res.data.user));
    } catch (err) {
      setUser(u => ({ ...u, ...updates }));
    }
  };

  const addXp = (amount) => {
    setUser(u => u ? { ...u, xp: (u.xp || 0) + amount } : u);
  };

  const syncXpStreak = (xp, streak) => {
    setUser(u => u ? { ...u, xp, streak } : u);
  };

  // Role helpers
  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isFaculty = user?.role === 'FACULTY';
  const isLecturer = user?.role === 'LECTURER';
  const isStudent = user?.role === 'STUDENT';
  const canManageUsers = isAdmin || isFaculty;
  const canCreateCourses = isAdmin || isFaculty || isLecturer;

  return (
    <AuthContext.Provider value={{
      user, isLoggedIn, loading,
      login, devLogin, register, logout, resetPassword, updateUser, addXp, syncXpStreak,
      isAdmin, isFaculty, isLecturer, isStudent, canManageUsers, canCreateCourses,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};