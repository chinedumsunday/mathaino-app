import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { FocusProvider } from './src/context/FocusContext';
import AppNavigator from './src/navigation/AppNavigator';

// Surfaces render-time crashes instead of leaving a blank screen in
// production builds, so failures are diagnosable from the device itself.
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <ScrollView style={{ maxHeight: 320 }}>
            <Text style={styles.errorMsg}>
              {String(this.state.error?.message || this.state.error)}
            </Text>
          </ScrollView>
          <Text style={styles.errorHint}>Close and reopen the app. If this keeps happening, send a screenshot of this screen to support.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <View style={[styles.logo, { backgroundColor: colors.accent }]}>
          <Text style={styles.logoText}>iL</Text>
        </View>
        <Text style={[styles.appName, { color: colors.t1 }]}>iLearn</Text>
        <Text style={[styles.tagline, { color: colors.t3 }]}>LEARN · CREATE · GROW</Text>
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <FocusProvider>
              <AppContent />
            </FocusProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#16181D',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 8,
  },
  errorWrap: {
    flex: 1,
    backgroundColor: '#0B0C0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  errorMsg: {
    color: '#9BA1AB',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorHint: {
    color: '#5E646E',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 16,
  },
});
