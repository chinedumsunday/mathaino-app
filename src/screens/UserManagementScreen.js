import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { useTheme } from '../context/ThemeContext';
import { Avatar, Chip, Badge, StatusDot } from '../components/UI';
import { apiListUsers } from '../services/api';

const FILTERS = ['All', 'Students', 'Lecturers', 'Faculty', 'Pending'];

const ROLE_MAP = { Students: 'STUDENT', Lecturers: 'LECTURER', Faculty: 'FACULTY' };

const roleLabel = (role) => ({
  STUDENT: 'Student', LECTURER: 'Lecturer', FACULTY: 'Admin', SUPER_ADMIN: 'Super Admin',
}[role] || role);

export default function UserManagementScreen({ route, navigation }) {
  const { colors: COLORS } = useTheme();
  const initialFilter = route.params?.filter || 'All';
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const searchTimer = useRef(null);

  const roleColor = (role) => ({
    STUDENT: COLORS.blue, LECTURER: COLORS.teal, FACULTY: COLORS.orange, SUPER_ADMIN: COLORS.pink,
  }[role] || COLORS.blue);

  const load = useCallback(async (searchVal = search, filterVal = filter) => {
    try {
      const params = {};
      if (filterVal === 'Pending') params.status = 'PENDING';
      else if (ROLE_MAP[filterVal]) params.role = ROLE_MAP[filterVal];
      if (searchVal.trim()) params.search = searchVal.trim();
      params.limit = 50;

      const res = await apiListUsers(params);
      setUsers(res.data.users || []);
      setTotal(res.data.pagination?.total || 0);
      setError(null);
    } catch (e) {
      setError(e.message || 'Could not load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, filter]);

  useEffect(() => { load(); }, [filter]);

  const onSearchChange = (text) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load(text, filter), 400);
  };

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: 14, gap: 12 },
    title: { flex: 1, fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    count: { fontSize: 12, color: COLORS.t3 },
    searchWrap: { marginHorizontal: SPACING.xl, marginBottom: 12, position: 'relative' },
    searchIcon: { position: 'absolute', left: 14, top: 14, zIndex: 1 },
    searchInput: { width: '100%', paddingVertical: 12, paddingLeft: 40, paddingRight: 40, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, color: COLORS.t1, fontSize: 13 },
    clearBtn: { position: 'absolute', right: 12, top: 13 },
    chipRow: { flexDirection: 'row', gap: 6, paddingHorizontal: SPACING.xl, marginBottom: 14 },
    listContent: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
    userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 8 },
    userInfo: { flex: 1 },
    userName: { fontSize: 14, fontWeight: FONT.semibold, color: COLORS.t1 },
    userEmail: { fontSize: 11, color: COLORS.t3, marginTop: 1 },
    userMeta: { alignItems: 'flex-end', gap: 4 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusText: { fontSize: 9, fontWeight: FONT.semibold, textTransform: 'capitalize' },
    errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    errorText: { fontSize: 14, color: COLORS.t3, marginBottom: 12, textAlign: 'center' },
    retryBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    retryText: { fontSize: 13, color: COLORS.silver },
    empty: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginTop: 16 },
    emptyText: { fontSize: 13, color: COLORS.t3, marginTop: 4 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.count}>{total} total</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={COLORS.t3} style={styles.searchIcon} />
        <TextInput
          placeholder="Search by name or email..."
          placeholderTextColor={COLORS.t3}
          value={search}
          onChangeText={onSearchChange}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); load('', filter); }} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={COLORS.t3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.chipRow}>
        {FILTERS.map(f => (
          <Chip
            key={f}
            label={f}
            active={filter === f}
            onPress={() => { setFilter(f); setLoading(true); load(search, f); }}
            color={f === 'Pending' ? COLORS.orange : undefined}
          />
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { setLoading(true); load(); }} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={40} color={COLORS.t3} />
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptyText}>Try a different search or filter</Text>
            </View>
          }
          renderItem={({ item }) => {
            const itemStatusColor = item.status === 'ACTIVE' ? COLORS.green : item.status === 'PENDING' ? COLORS.orange : COLORS.red;
            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('UserDetail', { userId: item.id })}
                style={styles.userCard}
              >
                <Avatar size={44} name={`${item.firstName} ${item.lastName}`} color={roleColor(item.role)} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                <View style={styles.userMeta}>
                  <Badge label={roleLabel(item.role)} color={roleColor(item.role)} />
                  <View style={styles.statusRow}>
                    <StatusDot status={item.status?.toLowerCase()} />
                    <Text style={[styles.statusText, { color: itemStatusColor }]}>{item.status?.toLowerCase()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
