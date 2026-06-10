import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING, RADIUS } from '../utils/theme';
import { apiMyCertificates } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function MyCertificatesScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const [certs, setCerts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiMyCertificates();
      setCerts(res.data?.certificates || []);
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: SPACING.xl, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { fontSize: 18, fontWeight: FONT.bold, color: COLORS.t1 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.accent + '30', borderRadius: RADIUS.lg, padding: 16 },
    cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
    badge: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.accent + '20', alignItems: 'center', justifyContent: 'center' },
    courseTitle: { fontSize: 14, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 2 },
    courseMeta: { fontSize: 11, color: COLORS.t3 },
    issuedDate: { fontSize: 11, color: COLORS.accent, marginTop: 4, fontWeight: FONT.medium },
    empty: { alignItems: 'center', paddingTop: 80 },
    emptyEmoji: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 16, fontWeight: FONT.bold, color: COLORS.t1, marginBottom: 8 },
    emptySub: { fontSize: 13, color: COLORS.t3, textAlign: 'center', lineHeight: 20 },
  }), [COLORS]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.t1} />
        </TouchableOpacity>
        <Text style={styles.title}>My Certificates</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={certs}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.accent} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyTitle}>No certificates yet</Text>
              <Text style={styles.emptySub}>Complete all lessons in a course to earn your first certificate.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Certificate', { certificate: item })}
              style={styles.card}
            >
              <View style={styles.cardLeft}>
                <View style={styles.badge}>
                  <Ionicons name="ribbon" size={22} color={COLORS.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.courseTitle} numberOfLines={2}>{item.course?.title}</Text>
                  <Text style={styles.courseMeta}>{item.course?.code} · {item.course?.creator ? `${item.course.creator.firstName} ${item.course.creator.lastName}` : 'Instructor'}</Text>
                  <Text style={styles.issuedDate}>
                    Issued {new Date(item.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

