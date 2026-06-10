import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Switch, ScrollView } from 'react-native';
import { useColors } from '@/store/useThemeStore';
import { Button } from '@/components/ui';
import { CourseSelect } from '@/components/CourseSelect';
import { haptics } from '@/lib/haptics';
import { makeType, spacing, radius, type Palette } from '@/constants/theme';

export type DiscoveryFilterState = { match_type: string; course: string; all: boolean; starred: boolean; fromDate: string; toDate: string };
export const DEFAULT_FILTERS: DiscoveryFilterState = { match_type: 'any', course: '', all: false, starred: false, fromDate: '', toDate: '' };
export const isFiltered = (f: DiscoveryFilterState) =>
  f.match_type !== 'any' || f.course.trim() !== '' || f.all || f.starred || f.fromDate !== '' || f.toDate !== '';

const p2 = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

// The player's LOCAL today (YYYY-MM-DD) — used as the discovery floor so a match
// posted for "today" doesn't vanish in the evening when the server's UTC clock
// has already rolled to tomorrow.
export function localTodayISO(): string {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  return isoDate(d);
}

// Upcoming days for the date-range picker.
type Day = { iso: string; weekday: string; day: number; month: string };
function rangeDays(n: number): Day[] {
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const out: Day[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(base); d.setDate(base.getDate() + i);
    out.push({
      iso: isoDate(d),
      weekday: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString(undefined, { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString(undefined, { month: 'short' }),
    });
  }
  return out;
}

const shortLabel = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
function rangeSummary(from: string, to: string): string {
  if (!from && !to) return 'Any date';
  if (from && (!to || from === to)) return shortLabel(from);
  return `${shortLabel(from)} – ${shortLabel(to)}`;
}

const TYPE_OPTIONS = [
  { k: 'any', label: 'Any' },
  { k: 'front_nine', label: 'Front 9' },
  { k: 'back_nine', label: 'Back 9' },
  { k: 'eighteen', label: '18' },
];

// Bottom-sheet filter for the discovery feed. Overlay pattern (not RN Modal);
// keyboard-lifted for the course field.
export function DiscoveryFilters({ visible, value, onApply, onClose }: {
  visible: boolean;
  value: DiscoveryFilterState;
  onApply: (f: DiscoveryFilterState) => void;
  onClose: () => void;
}) {
  const c = useColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [local, setLocal] = useState<DiscoveryFilterState>(value);
  const days = useMemo(() => rangeDays(21), []);

  useEffect(() => { if (visible) setLocal(value); }, [visible, value]);

  // Tap a day → that single date. Tap a second day → a range (earlier becomes the
  // start). Tap the lone selected day again → clear. Matches are typically a
  // single day, so first-tap = single-day is the common case.
  const onDayPress = (iso: string) => {
    haptics.select();
    setLocal((s) => {
      const { fromDate, toDate } = s;
      const hasRange = !!fromDate && !!toDate && fromDate !== toDate;
      if (!fromDate || hasRange) return { ...s, fromDate: iso, toDate: iso };
      if (iso === fromDate) return { ...s, fromDate: '', toDate: '' };
      if (iso > fromDate) return { ...s, toDate: iso };
      return { ...s, fromDate: iso, toDate: fromDate };
    });
  };
  const isEnd = (iso: string) => iso === local.fromDate || iso === local.toDate;
  const inMid = (iso: string) => !!local.fromDate && !!local.toDate && iso > local.fromDate && iso < local.toDate;

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrap} pointerEvents="box-none">
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Filter matches</Text>

          {/* Course first so its type-ahead sits above the keyboard (the sheet is
              bottom-anchored and not lifted, so the top fields stay on-screen). */}
          <CourseSelect
            label="Course"
            valueName={local.course || null}
            onSelect={(course) => setLocal((s) => ({ ...s, course: course?.name ?? '' }))}
            placeholder="Any course"
          />

          <Text style={styles.label}>Match type</Text>
          <View style={styles.seg}>
            {TYPE_OPTIONS.map((o) => {
              const active = local.match_type === o.k;
              return (
                <Pressable
                  key={o.k}
                  onPress={() => { haptics.select(); setLocal((s) => ({ ...s, match_type: o.k })); }}
                  style={[styles.segBtn, active && styles.segActive]}
                >
                  <Text style={[styles.segText, active && styles.segTextActive]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.whenHead}>
            <Text style={styles.label}>When</Text>
            <Text style={styles.whenSummary}>{rangeSummary(local.fromDate, local.toDate)}</Text>
            {(local.fromDate || local.toDate) ? (
              <Pressable onPress={() => { haptics.select(); setLocal((s) => ({ ...s, fromDate: '', toDate: '' })); }} hitSlop={8}>
                <Text style={styles.clearDates}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow} keyboardShouldPersistTaps="handled">
            {days.map((d) => {
              const sel = isEnd(d.iso);
              const mid = inMid(d.iso);
              return (
                <Pressable key={d.iso} onPress={() => onDayPress(d.iso)} style={[styles.dateChip, mid && styles.dateChipMid, sel && styles.dateChipSel]}>
                  <Text style={[styles.dateWeekday, sel && styles.dateTextSel]}>{d.weekday}</Text>
                  <Text style={[styles.dateDay, sel && styles.dateTextSel]}>{d.day}</Text>
                  <Text style={[styles.dateMonth, sel && styles.dateTextSel]}>{d.month}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={styles.whenHint}>Tap a day for that date; tap a second for a range.</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Saved only</Text>
              <Text style={styles.switchHint}>Just the matches you've starred to revisit</Text>
            </View>
            <Switch
              value={local.starred}
              onValueChange={(v) => { haptics.select(); setLocal((s) => ({ ...s, starred: v })); }}
              trackColor={{ true: c.accent, false: c.surfaceRaised }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Browse everything</Text>
              <Text style={styles.switchHint}>Ignore your home course and handicap range</Text>
            </View>
            <Switch
              value={local.all}
              onValueChange={(v) => { haptics.select(); setLocal((s) => ({ ...s, all: v })); }}
              trackColor={{ true: c.accent, false: c.surfaceRaised }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Button title="Apply filters" onPress={() => onApply(local)} />
          <Pressable onPress={() => onApply(DEFAULT_FILTERS)} style={styles.reset}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function makeStyles(c: Palette) {
  const t = makeType(c);
  return StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheetWrap: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
      borderWidth: 1, borderColor: c.border, padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm,
    },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, marginBottom: spacing.sm },
    title: { ...t.heading },
    label: { ...t.overline, color: c.muted, marginTop: spacing.sm },
    seg: { flexDirection: 'row', gap: spacing.sm },
    segBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceRaised },
    segActive: { backgroundColor: c.accentGlow, borderColor: c.accent },
    segText: { ...t.label, color: c.text },
    segTextActive: { color: c.accent },
    whenHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    whenSummary: { ...t.bodySemiBold, color: c.accent, flex: 1 },
    clearDates: { ...t.caption, color: c.muted },
    dateRow: { gap: spacing.sm, paddingVertical: spacing.xs, paddingRight: spacing.md },
    dateChip: { width: 54, alignItems: 'center', paddingVertical: spacing.sm, gap: 1, backgroundColor: c.surfaceRaised, borderWidth: 1, borderColor: c.border, borderRadius: radius.md },
    dateChipMid: { backgroundColor: c.accentGlow, borderColor: c.accent },
    dateChipSel: { backgroundColor: c.accent, borderColor: c.accent },
    dateWeekday: { ...t.caption, fontSize: 11, color: c.muted, textTransform: 'uppercase' },
    dateDay: { ...t.heading, fontSize: 18, color: c.text },
    dateMonth: { ...t.caption, fontSize: 11, color: c.muted },
    dateTextSel: { color: c.onAccent },
    whenHint: { ...t.caption, color: c.muted },
    input: {
      backgroundColor: c.surfaceRaised, borderWidth: 1, borderColor: c.border, borderRadius: radius.md,
      paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, color: c.text,
    },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm, marginBottom: spacing.sm },
    switchLabel: { ...t.bodySemiBold },
    switchHint: { ...t.caption, color: c.muted },
    reset: { alignItems: 'center', paddingVertical: spacing.sm },
    resetText: { ...t.body, color: c.muted },
  });
}
