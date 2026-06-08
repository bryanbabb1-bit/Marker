import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/lib/useApi';
import type { RevealResponse, HoleResult } from '@/types';
import { deltaLabel } from '@/lib/format';
import { colors, spacing, radius, typography } from '@/constants/theme';

const STEP_MS = 850; // pace between holes during the auto-reveal

type Outcome = 'win' | 'loss' | 'tie';

export default function RevealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const api = useApi();

  const [data, setData] = useState<RevealResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0); // holes revealed so far

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setError(null);
      setData(await api.getReveal(id));
    } catch (e: any) {
      setError(e?.message ?? 'Could not load the reveal.');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const meIsCreator = !!data && data.match.creator_id === userId;
  const holes: HoleResult[] = data?.progression?.holes ?? [];
  const finished = step >= holes.length && holes.length > 0;

  // My-perspective signed delta for a given hole result.
  const myDeltaAt = useCallback(
    (h: HoleResult) => (meIsCreator ? h.creator_delta : -h.creator_delta),
    [meIsCreator]
  );

  // Auto-advance one hole at a time until the closeout.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (loading || !holes.length || finished) return;
    timer.current = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [loading, holes.length, finished, step]);

  const myDelta = step > 0 ? myDeltaAt(holes[Math.min(step, holes.length) - 1]) : 0;
  const current = step > 0 ? holes[step - 1] : null;

  const outcome: Outcome | null = useMemo(() => {
    const p = data?.progression;
    if (!p) return null;
    if (p.final_result === 'tie') return 'tie';
    return (p.final_result === 'creator_wins') === meIsCreator ? 'win' : 'loss';
  }, [data, meIsCreator]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.fairway} size="large" /></View>;
  }

  if (error || !data) {
    // Locked until both submit (API 409), or a transient failure.
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.muted} />
        <Text style={styles.lockedText}>{error ?? 'The reveal is not ready yet.'}</Text>
        <TouchableOpacity onPress={load}><Text style={styles.link}>Check again</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.linkMuted}>Back to match</Text></TouchableOpacity>
      </View>
    );
  }

  if (!data.progression) {
    return (
      <View style={styles.center}>
        <Ionicons name="golf-outline" size={40} color={colors.muted} />
        <Text style={styles.lockedText}>Both cards are in, but this match has no course data to score against.</Text>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Back to match</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Climbing scoreline — pops on each hole */}
        <View style={styles.statusWrap}>
          <Text style={styles.statusCaption}>{finished ? 'Final' : `Through ${step} of ${holes.length}`}</Text>
          <Animated.Text key={`status-${step}`} entering={ZoomIn.springify().damping(14)} style={[styles.statusBig, deltaColor(myDelta)]}>
            {deltaLabel(myDelta)}
          </Animated.Text>
        </View>

        {/* Hole-by-hole pip strip — the whole round at a glance, filling in */}
        <View style={styles.pips}>
          {holes.map((h, i) => {
            const revealed = i < step;
            const iWon = h.winner === (meIsCreator ? 'creator' : 'opponent');
            const halve = h.winner === 'tie';
            return (
              <View
                key={h.hole}
                style={[
                  styles.pip,
                  !revealed && styles.pipPending,
                  revealed && (halve ? styles.pipHalve : iWon ? styles.pipWin : styles.pipLoss),
                  revealed && i === step - 1 && styles.pipCurrent,
                ]}
              >
                <Text style={[styles.pipText, revealed && !halve && styles.pipTextOn]}>{h.hole}</Text>
              </View>
            );
          })}
        </View>

        {/* Current hole detail */}
        {current && !finished && (
          <Animated.View key={`hole-${step}`} entering={FadeInDown.springify().damping(16)} style={styles.holeCard}>
            <Text style={styles.holeCardTitle}>Hole {current.hole}</Text>
            <View style={styles.holeCardRow}>
              <HoleSide
                label="You"
                gross={meIsCreator ? current.creator_gross : current.opponent_gross}
                net={meIsCreator ? current.creator_net : current.opponent_net}
                strokes={meIsCreator ? current.creator_strokes : current.opponent_strokes}
                won={current.winner === (meIsCreator ? 'creator' : 'opponent')}
              />
              <HoleSide
                label="Them"
                gross={meIsCreator ? current.opponent_gross : current.creator_gross}
                net={meIsCreator ? current.opponent_net : current.creator_net}
                strokes={meIsCreator ? current.opponent_strokes : current.creator_strokes}
                won={current.winner === (meIsCreator ? 'opponent' : 'creator')}
              />
            </View>
            <Text style={styles.holeCardOutcome}>
              {current.winner === 'tie'
                ? 'Halved'
                : current.winner === (meIsCreator ? 'creator' : 'opponent')
                ? 'You win the hole'
                : 'They win the hole'}
            </Text>
          </Animated.View>
        )}

        {/* Final banner */}
        {finished && outcome && (
          <Animated.View entering={ZoomIn.springify().damping(11)} style={[styles.banner, bannerStyle(outcome)]}>
            <Text style={styles.bannerTitle}>{bannerTitle(outcome)}</Text>
            {outcome !== 'tie' && <Text style={styles.bannerScore}>{data.progression.final_delta}</Text>}
            {data.progression.decided_on_hole != null && (
              <Text style={styles.bannerSub}>Closed out on hole {data.progression.decided_on_hole}</Text>
            )}
            <Text style={styles.bannerTotals}>
              Gross {meIsCreator ? data.creator_scorecard.total_gross : data.opponent_scorecard.total_gross}
              {' – '}
              {meIsCreator ? data.opponent_scorecard.total_gross : data.creator_scorecard.total_gross}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!finished ? (
          <Animated.View entering={FadeIn}>
            <TouchableOpacity style={styles.skipBtn} onPress={() => setStep(holes.length)}>
              <Text style={styles.skipText}>Skip to result</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(0)}>
              <Ionicons name="refresh" size={18} color={colors.fairway} />
              <Text style={styles.secondaryText}>Replay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
              <Text style={styles.primaryText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function HoleSide({ label, gross, net, strokes, won }: {
  label: string; gross: number; net: number; strokes: number; won: boolean;
}) {
  return (
    <View style={styles.side}>
      <Text style={styles.sideLabel}>{label}</Text>
      <Text style={[styles.sideNet, won && styles.sideNetWon]}>{net}</Text>
      <Text style={styles.sideGross}>
        gross {gross}{strokes > 0 ? ` · −${strokes}` : ''}
      </Text>
    </View>
  );
}

function deltaColor(delta: number) {
  if (delta > 0) return { color: colors.fairway };
  if (delta < 0) return { color: colors.flagRed };
  return { color: colors.muted };
}
function bannerTitle(o: Outcome): string {
  return o === 'win' ? 'You win! 🏌️' : o === 'loss' ? 'You lost' : 'All Square';
}
function bannerStyle(o: Outcome) {
  if (o === 'win') return { borderColor: colors.fairway, backgroundColor: '#EAF5EE' };
  if (o === 'loss') return { borderColor: colors.flagRed, backgroundColor: '#FBEAEA' };
  return { borderColor: colors.border, backgroundColor: colors.sand };
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.paper },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  statusWrap: {
    alignItems: 'center', paddingVertical: spacing.lg, backgroundColor: colors.surface,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  statusCaption: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusBig: { ...typography.title, fontSize: 40, marginTop: spacing.xs },
  pips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' },
  pip: {
    width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  pipPending: { opacity: 0.4 },
  pipWin: { backgroundColor: colors.fairway, borderColor: colors.fairway },
  pipLoss: { backgroundColor: colors.flagRed, borderColor: colors.flagRed },
  pipHalve: { backgroundColor: colors.sand, borderColor: colors.border },
  pipCurrent: { transform: [{ scale: 1.15 }] },
  pipText: { ...typography.caption, fontSize: 12, color: colors.muted },
  pipTextOn: { color: colors.surface, fontWeight: '700' },
  holeCard: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm,
  },
  holeCardTitle: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  holeCardRow: { flexDirection: 'row' },
  side: { flex: 1, alignItems: 'center' },
  sideLabel: { ...typography.caption, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  sideNet: { ...typography.title, fontSize: 30, color: colors.ink },
  sideNetWon: { color: colors.fairway },
  sideGross: { ...typography.caption, fontSize: 12 },
  holeCardOutcome: { ...typography.bodySemiBold, textAlign: 'center', color: colors.ink },
  banner: {
    alignItems: 'center', borderWidth: 2, borderRadius: radius.lg, padding: spacing.lg,
    gap: spacing.xs,
  },
  bannerTitle: { ...typography.title, fontSize: 32 },
  bannerScore: { ...typography.heading, fontSize: 24, color: colors.ink },
  bannerSub: { ...typography.caption },
  bannerTotals: { ...typography.caption, marginTop: spacing.xs },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  skipBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  skipText: { ...typography.bodySemiBold, color: colors.muted },
  primaryBtn: { flex: 1, backgroundColor: colors.fairway, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  primaryText: { ...typography.bodySemiBold, color: colors.surface },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', gap: spacing.sm, borderWidth: 1, borderColor: colors.fairway,
    borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center',
  },
  secondaryText: { ...typography.bodySemiBold, color: colors.fairway },
  lockedText: { ...typography.body, color: colors.muted, textAlign: 'center' },
  link: { ...typography.bodySemiBold, color: colors.fairway },
  linkMuted: { ...typography.body, color: colors.muted },
});
