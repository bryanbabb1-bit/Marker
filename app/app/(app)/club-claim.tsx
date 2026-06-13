import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '@/lib/useApi';
import { useColors } from '@/store/useThemeStore';
import { haptics } from '@/lib/haptics';
import type { ClubDetail } from '@/types';
import { spacing, radius, typography, fonts, type Palette } from '@/constants/theme';

// "Is this your club? Claim it" — the staff-facing pager (strategy doc A4
// front door). Verification + billing happen over email for now; the Stripe
// checkout replaces the mailto when club billing lands.
const CLAIM_EMAIL = 'hello@foretera.app';

const PERKS: { icon: string; title: string; body: string }[] = [
  { icon: 'shield-checkmark', title: 'Branded club board', body: 'Your crest and colors on every member’s screen, with the gold network mark.' },
  { icon: 'podium-outline', title: 'Members’ leaderboard', body: 'Club-only standings — the season-long conversation in the grill room.' },
  { icon: 'pulse-outline', title: 'Staff pulse', body: 'Matches per week, active members, live games — engagement you can see.' },
  { icon: 'people-outline', title: 'New-member welcome', body: 'New joiners get an instant pool of compatible games at their level.' },
];

export default function ClubClaimScreen() {
  const { club_id, club_name } = useLocalSearchParams<{ club_id: string; club_name?: string }>();
  const api = useApi();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [club, setClub] = useState<ClubDetail | null>(null);

  // Best-effort detail load — the screen still sells with just the route name.
  useFocusEffect(useCallback(() => {
    if (!club_id) return;
    api.getClub(club_id).then(setClub).catch(() => {});
  }, [api, club_id]));

  const name = club?.name ?? club_name ?? 'Your club';
  const asked = club?.interest_count ?? 0;

  // The screen's only conversion action must never dead-end: devices with no
  // mail client (Apple Mail removed, never configured) can't open mailto — in
  // that case show the address itself so the prospect still leaves with a way
  // to reach us.
  const emailUs = async () => {
    haptics.select();
    const subject = encodeURIComponent(`Claim ${name} on Foretera`);
    const body = encodeURIComponent(
      `Hi Foretera,\n\nI'm with ${name} and I'd like to claim our club.\n\nName / role at the club:\nBest contact:\n`
    );
    const url = `mailto:${CLAIM_EMAIL}?subject=${subject}&body=${body}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) throw new Error('no mail client');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Email us directly', `No mail app is set up on this device.\n\nReach us at ${CLAIM_EMAIL} and we'll take it from there.`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>Foretera for clubs</Text>
        <Text style={styles.title}>{name}</Text>
        {asked > 0 && (
          <View style={styles.demand}>
            <Ionicons name="trending-up" size={16} color={colors.gold} />
            <Text style={styles.demandText}>
              {asked === 1 ? '1 member here has asked for this club on Foretera.' : `${asked} members here have asked for this club on Foretera.`}
            </Text>
          </View>
        )}
        <Text style={styles.lead}>
          Your members already play here. Claiming the club turns this board into yours — branded,
          measurable, and working for the shop.
        </Text>

        {PERKS.map((p) => (
          <View key={p.title} style={styles.perk}>
            <Ionicons name={p.icon as any} size={20} color={colors.gold} />
            <View style={styles.perkMid}>
              <Text style={styles.perkTitle}>{p.title}</Text>
              <Text style={styles.perkBody}>{p.body}</Text>
            </View>
          </View>
        ))}

        <View style={styles.priceCard}>
          <Text style={styles.priceLine}>$149/mo  ·  $1,490/yr</Text>
          <Text style={styles.priceSub}>Founders rate for the first 10 clubs: $990/yr, locked for life.</Text>
        </View>

        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={emailUs} accessibilityRole="button">
          <Ionicons name="mail-outline" size={18} color={colors.onAccent} />
          <Text style={styles.ctaText}>Email us to claim this club</Text>
        </TouchableOpacity>
        <Text style={styles.fine}>
          One email is all it takes — we verify you’re with the club and turn the board on.
          Members always play free; the club membership is the only thing for sale here.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    kicker: {
      fontFamily: fonts.bodySemi, fontSize: 12, color: colors.gold,
      textTransform: 'uppercase', letterSpacing: 1.2,
    },
    title: { ...typography.title, color: colors.text },
    demand: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      backgroundColor: colors.goldGlow, borderWidth: 1, borderColor: colors.gold,
      borderRadius: radius.md, padding: spacing.md,
    },
    demandText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text, flex: 1 },
    lead: { ...typography.body, color: colors.muted },
    perk: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
    perkMid: { flex: 1, gap: 2 },
    perkTitle: { ...typography.bodySemiBold, color: colors.text },
    perkBody: { ...typography.caption, color: colors.muted },
    priceCard: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.xs,
      marginTop: spacing.sm,
    },
    priceLine: { fontFamily: fonts.display, fontSize: 24, color: colors.text, fontVariant: ['tabular-nums'] },
    priceSub: { ...typography.caption, color: colors.gold, textAlign: 'center' },
    cta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
      backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: spacing.md,
    },
    ctaText: { ...typography.bodySemiBold, color: colors.onAccent },
    fine: { ...typography.caption, color: colors.muted, textAlign: 'center' },
  });
}
