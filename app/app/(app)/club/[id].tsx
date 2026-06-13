import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/lib/useApi';
import { useColors } from '@/store/useThemeStore';
import { Avatar } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import type { ClubChampions, ChampionEntry, ChampionCategory } from '@/types';
import { spacing, radius, typography, fonts, type Palette } from '@/constants/theme';

// Club home / hall of fame — the network club's champions, current month plus a
// step-back through prior crowned months. Reached from the board's champions
// strip ("See all").
const CATEGORIES: { key: ChampionCategory; label: string; icon: string }[] = [
  { key: 'won', label: 'Most Wins', icon: 'trophy' },
  { key: 'played', label: 'Most Played', icon: 'golf' },
  { key: 'win_pct', label: 'Best Win %', icon: 'trending-up' },
];

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function ClubHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState<ClubChampions | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setData(await api.getChampions(id, month));
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, id, month]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const atCurrent = month >= thisMonth();
  const live = data && !data.crowned;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.gold} />}
      >
        {/* Month navigator */}
        <View style={styles.monthBar}>
          <TouchableOpacity hitSlop={10} accessibilityRole="button" accessibilityLabel="Previous month"
            onPress={() => { haptics.select(); setMonth((m) => shiftMonth(m, -1)); }}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.monthMid}>
            <Text style={styles.monthName}>{monthLabel(month)}</Text>
            <Text style={styles.monthTag}>{live ? 'Leaders' : 'Champions'}</Text>
          </View>
          <TouchableOpacity hitSlop={10} disabled={atCurrent} accessibilityRole="button" accessibilityLabel="Next month"
            onPress={() => { haptics.select(); setMonth((m) => shiftMonth(m, 1)); }}>
            <Ionicons name="chevron-forward" size={22} color={atCurrent ? colors.border : colors.text} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.note}>Loading…</Text>
        ) : !data || (data.won.length === 0 && data.played.length === 0 && data.win_pct.length === 0) ? (
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={36} color={colors.muted} />
            <Text style={styles.note}>No completed matches this month yet. Champions are crowned from games played at the club.</Text>
          </View>
        ) : (
          CATEGORIES.map((cat) => (
            <CategoryBlock key={cat.key} cat={cat} entries={data[cat.key]} live={!!live} colors={colors} styles={styles} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryBlock({ cat, entries, live, colors, styles }: {
  cat: { key: ChampionCategory; label: string; icon: string };
  entries: ChampionEntry[]; live: boolean; colors: Palette; styles: ReturnType<typeof makeStyles>;
}) {
  const winner = entries[0];
  const runners = entries.slice(1);
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Ionicons name={cat.icon as any} size={16} color={colors.gold} />
        <Text style={styles.blockTitle}>{cat.label}</Text>
      </View>
      {winner ? (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.winnerRow} activeOpacity={0.7}
            onPress={() => { haptics.select(); router.push(`/(app)/player/${winner.user_id}`); }}
          >
            <Ionicons name="trophy" size={18} color={colors.gold} />
            <Avatar name={winner.name} size={44} photoUrl={winner.photo_url} />
            <View style={styles.winnerMid}>
              <Text style={styles.winnerName} numberOfLines={1}>{winner.name}</Text>
              <Text style={styles.winnerDetail}>{winner.detail}{live ? ' · leading' : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
          {runners.map((r, i) => (
            <TouchableOpacity
              key={r.user_id} style={[styles.runnerRow, styles.rowDivider]} activeOpacity={0.7}
              onPress={() => { haptics.select(); router.push(`/(app)/player/${r.user_id}`); }}
            >
              <Text style={styles.runnerRank}>{i + 2}</Text>
              <Avatar name={r.name} size={28} photoUrl={r.photo_url} />
              <Text style={styles.runnerName} numberOfLines={1}>{r.name}</Text>
              <Text style={styles.runnerDetail}>{r.detail}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.note}>No qualifier yet{cat.key === 'win_pct' ? ' (needs 3+ matches)' : ''}.</Text>
      )}
    </View>
  );
}

function makeStyles(c: Palette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
    monthMid: { alignItems: 'center', gap: 2 },
    monthName: { ...typography.heading, color: c.text },
    monthTag: { ...typography.caption, fontSize: 11, color: c.gold, textTransform: 'uppercase', letterSpacing: 1 },
    block: { gap: spacing.sm },
    blockHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    blockTitle: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5, color: c.text },
    card: { backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
    winnerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: c.goldGlow },
    winnerMid: { flex: 1 },
    winnerName: { ...typography.bodySemiBold, color: c.text },
    winnerDetail: { ...typography.caption, color: c.muted },
    runnerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    rowDivider: { borderTopWidth: 1, borderTopColor: c.border },
    runnerRank: { width: 16, textAlign: 'center', ...typography.caption, color: c.muted },
    runnerName: { flex: 1, ...typography.body },
    runnerDetail: { ...typography.caption, color: c.muted },
    empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
    note: { ...typography.caption, color: c.muted, textAlign: 'center' },
  });
}
