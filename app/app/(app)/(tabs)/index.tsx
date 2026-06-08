import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/lib/useApi';
import { useUserStore } from '@/store/useUserStore';
import { ConfirmIndexSheet } from '@/components/ConfirmIndexSheet';
import type { DiscoveryMatch } from '@/types';
import { MATCH_TYPE_LABELS } from '@/types';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { formatHandicap, formatPlayWhen, isIndexStale } from '@/lib/format';

export default function DiscoveryScreen() {
  const api = useApi();
  const [matches, setMatches] = useState<DiscoveryMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState<string | null>(null);
  const user = useUserStore((s) => s.user);
  const [pendingAccept, setPendingAccept] = useState<DiscoveryMatch | null>(null);
  const [sheetBusy, setSheetBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const { matches } = await api.discover();
      setMatches(matches);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load matches.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  // Reload every time the tab regains focus (after posting/accepting elsewhere).
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };
  const pass = (id: string) => setPassed((p) => new Set(p).add(id));

  const doAccept = async (m: DiscoveryMatch) => {
    setActing(m.id);
    try {
      await api.acceptMatch(m.id);
      router.push(`/(app)/match/${m.id}`);
    } catch (e: any) {
      Alert.alert('Could not accept', e?.message ?? 'Please try again.');
    } finally {
      setActing(null);
    }
  };

  // Confirm/refresh the index before locking it onto the match (only nudges when
  // it's unset or stale); otherwise accept straight away.
  const requestAccept = (m: DiscoveryMatch) => {
    if (user && isIndexStale(user.handicap, user.handicap_updated_at)) setPendingAccept(m);
    else doAccept(m);
  };

  const confirmIndexAndAccept = async (index: number) => {
    setSheetBusy(true);
    try {
      const updated = await api.updateMe({ handicap: index });
      useUserStore.setState({ user: updated });
      const m = pendingAccept;
      setPendingAccept(null);
      if (m) await doAccept(m);
    } catch (e: any) {
      Alert.alert('Could not save your index', e?.message ?? 'Please try again.');
    } finally {
      setSheetBusy(false);
    }
  };

  const visible = matches.filter((m) => !passed.has(m.id));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.fairway} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={visible}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.fairway} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="golf-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>{error ?? 'No open matches right now'}</Text>
            <Text style={styles.emptyHint}>
              {error ? 'Pull to retry.' : 'Post one and let someone accept, or pull to refresh.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const name = [item.creator_first_name, item.creator_last_name].filter(Boolean).join(' ') || 'A golfer';
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.idx}>{formatHandicap(item.creator_handicap_index)}</Text>
              </View>
              <Text style={styles.course}>{item.course_name} · {item.tee_color} tees</Text>
              <View style={styles.metaRow}>
                <Meta icon="calendar-outline" text={formatPlayWhen(item.play_date, item.play_time)} />
                <Meta icon="flag-outline" text={MATCH_TYPE_LABELS[item.match_type]} />
              </View>
              <View style={styles.metaRow}>
                <Meta icon="people-outline" text={`Wants hcp ${item.hcp_range_min}–${item.hcp_range_max}`} />
                {item.stakes != null && <Meta icon="cash-outline" text={`$${item.stakes} (for context)`} />}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.passBtn]} onPress={() => pass(item.id)} disabled={acting === item.id}>
                  <Text style={styles.passText}>Pass</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={() => requestAccept(item)} disabled={acting === item.id}>
                  {acting === item.id
                    ? <ActivityIndicator color={colors.surface} />
                    : <Text style={styles.acceptText}>Accept</Text>}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(app)/create')} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color={colors.surface} />
      </TouchableOpacity>

      <ConfirmIndexSheet
        visible={!!pendingAccept}
        handicap={user?.handicap ?? null}
        updatedAt={user?.handicap_updated_at ?? null}
        actionLabel="Accept match"
        busy={sheetBusy}
        onCancel={() => setPendingAccept(null)}
        onConfirm={confirmIndexAndAccept}
      />
    </SafeAreaView>
  );
}

function Meta({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={15} color={colors.muted} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  list: { padding: spacing.md, gap: spacing.md, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.heading },
  idx: { ...typography.bodySemiBold, color: colors.fairway },
  course: { ...typography.body, color: colors.ink },
  metaRow: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...typography.caption },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: spacing.sm + 2, alignItems: 'center', justifyContent: 'center' },
  passBtn: { backgroundColor: colors.sand },
  passText: { ...typography.bodySemiBold, color: colors.ink },
  acceptBtn: { backgroundColor: colors.fairway },
  acceptText: { ...typography.bodySemiBold, color: colors.surface },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.xl * 2 },
  emptyTitle: { ...typography.heading, color: colors.muted, textAlign: 'center' },
  emptyHint: { ...typography.caption, textAlign: 'center', maxWidth: 260 },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.fairway,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
});
