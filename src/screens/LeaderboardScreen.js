import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { Avatar, Chip } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { apiGetLeaderboard } from '../services/api';

const PERIODS = ['all-time', 'monthly', 'weekly'];
const PERIOD_LABELS = { 'all-time': 'All Time', monthly: 'This Month', weekly: 'This Week' };

const isOnline = (lastActiveAt) => {
  if (!lastActiveAt) return false;
  return Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000;
};

export default function LeaderboardScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [period, setPeriod] = useState('all-time');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const load = useCallback(async (selectedPeriod = period, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await apiGetLeaderboard({ period: selectedPeriod, limit: 50 });
      setData(res.data.users || []);
    } catch (e) {
      setError('Could not load leaderboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  React.useEffect(() => { load(period); }, [period]);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    load(p);
  };

  const yourIndex = data.findIndex(u => u.id === user?.id);
  const yourRank = yourIndex >= 0 ? yourIndex + 1 : null;
  const top3 = data.length >= 3 ? [data[1], data[0], data[2]] : data.slice(0, 3);
  const rest = data.slice(3);
  const podiumHeights = [100, 140, 80];
  const medals = ['🥈', '🥇', '🥉'];

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: SPACING.xl, marginBottom: 18 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    errorText: { fontSize: 14, color: COLORS.t3, marginTop: 12, marginBottom: 12 },
    retryBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    retryText: { fontSize: 13, color: COLORS.silver },
    emptyTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 16 },
    emptyText: { fontSize: 13, color: COLORS.t3, marginTop: 4, textAlign: 'center', paddingHorizontal: 40 },
    podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 8, paddingHorizontal: SPACING.xl, paddingTop: 10, marginBottom: 24 },
    podiumItem: { flex: 1, alignItems: 'center' },
    podiumName: { fontSize: 12, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 6 },
    podiumXp: { fontSize: 10, color: COLORS.t3, marginTop: 2 },
    podiumBar: { width: '100%', backgroundColor: COLORS.card, borderTopLeftRadius: 12, borderTopRightRadius: 12, marginTop: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderBottomWidth: 0, borderColor: COLORS.border },
    podiumMedal: { fontSize: 28 },
    list: { paddingHorizontal: SPACING.xl },
    rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    rankRowYou: { backgroundColor: COLORS.accent + '10', borderColor: COLORS.accent + '40' },
    rankNum: { fontSize: 14, fontWeight: FONT.extrabold, color: COLORS.t3, minWidth: 28 },
    rankName: { fontSize: 13, fontWeight: FONT.semibold, color: COLORS.t1 },
    rankDept: { fontSize: 10, color: COLORS.t3, marginTop: 1 },
    rankXp: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.accent },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    streakText: { fontSize: 10, color: COLORS.t3 },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: COLORS.bg },
    yourCard: { marginHorizontal: SPACING.xl, marginTop: 16 },
    yourCardInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: 16 },
    yourCardTitle: { fontSize: 13, fontWeight: FONT.bold, color: COLORS.t1 },
    yourCardSub: { fontSize: 11, color: COLORS.accent, fontWeight: FONT.medium, marginTop: 2 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle" size={32} color={COLORS.t2} />
        </TouchableOpacity>
        <Text style={styles.title}>Leaderboard</Text>
        <Ionicons name="trophy" size={22} color={COLORS.accent} />
      </View>

      <View style={styles.tabs}>
        {PERIODS.map(p => (
          <Chip
            key={p}
            label={PERIOD_LABELS[p]}
            active={period === p}
            onPress={() => handlePeriodChange(p)}
          />
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.accent} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={44} color={COLORS.t3} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => load(period)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={44} color={COLORS.t3} />
          <Text style={styles.emptyTitle}>No students yet</Text>
          <Text style={styles.emptyText}>
            {period === 'weekly' ? 'No active students this week.' : period === 'monthly' ? 'No active students this month.' : 'Start learning to appear here!'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(period, true)} tintColor={COLORS.accent} />}
        >
          {/* Podium */}
          {data.length >= 3 && (
            <View style={styles.podium}>
              {top3.map((person, i) => {
                if (!person) return null;
                const isYou = person.id === user?.id;
                const name = `${person.firstName} ${person.lastName}`.trim();
                const dept = person.studentProfile?.department || '';
                return (
                  <View key={person.id} style={styles.podiumItem}>
                    <Avatar
                      size={i === 1 ? 56 : 44}
                      name={name}
                      url={isYou ? user.avatarUrl : person.avatarUrl}
                    />
                    <Text style={[styles.podiumName, isYou && { color: COLORS.accent }]} numberOfLines={1}>
                      {isYou ? 'You' : name.split(' ')[0]}
                    </Text>
                    <Text style={styles.podiumXp}>{(person.xp || 0).toLocaleString()} XP</Text>
                    <View style={[styles.podiumBar, { height: podiumHeights[i] }]}>
                      <Text style={styles.podiumMedal}>{medals[i]}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Rankings list */}
          <View style={styles.list}>
            {rest.map((person, i) => {
              const isYou = person.id === user?.id;
              const name = `${person.firstName} ${person.lastName}`.trim();
              const dept = person.studentProfile?.department || '';
              return (
                <View
                  key={person.id}
                  style={[styles.rankRow, isYou && styles.rankRowYou]}
                >
                  <Text style={styles.rankNum}>#{i + 4}</Text>
                  <View style={{ position: 'relative' }}>
                    <Avatar size={38} name={name} url={isYou ? user.avatarUrl : person.avatarUrl} />
                    <View style={[styles.onlineDot, { backgroundColor: isOnline(person.lastActiveAt) ? COLORS.green : '#333' }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rankName, isYou && { color: COLORS.accent }]}>
                      {name}{isYou ? ' (You)' : ''}
                    </Text>
                    {!!dept && <Text style={styles.rankDept}>{dept}</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.rankXp}>{(person.xp || 0).toLocaleString()}</Text>
                    <View style={styles.streakRow}>
                      <Ionicons name="flame" size={10} color="#FF8C42" />
                      <Text style={styles.streakText}>{person.streak || 0}d</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Your position card */}
          {yourRank && (
            <View style={styles.yourCard}>
              <View style={styles.yourCardInner}>
                <Ionicons name="trending-up" size={20} color={COLORS.accent} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.yourCardTitle}>You're ranked #{yourRank}</Text>
                  {yourRank > 1 && data[yourRank - 2] && (
                    <Text style={styles.yourCardSub}>
                      {(data[yourRank - 2].xp - (user?.xp || 0)).toLocaleString()} XP to overtake {data[yourRank - 2].firstName}
                    </Text>
                  )}
                  {yourRank === 1 && <Text style={styles.yourCardSub}>You're at the top! 🏆 Keep going!</Text>}
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
