import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApi } from '@/lib/useApi';
import { useUserStore } from '@/store/useUserStore';
import { useColors } from '@/store/useThemeStore';
import { CourseSelect } from '@/components/CourseSelect';
import { Button } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { makeType, spacing, radius, type Palette } from '@/constants/theme';

// First-run profile setup: name, home course (optional), handicap index. Shown
// when a signed-in user has no first_name yet (see (app)/_layout redirect).
export default function OnboardingScreen() {
  const api = useApi();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const setUser = useUserStore.setState;
  const user = useUserStore((s) => s.user);

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [homeCourseId, setHomeCourseId] = useState<string | null>(user?.home_course_id ?? null);
  const [homeCourseName, setHomeCourseName] = useState<string | null>(null);
  const [handicap, setHandicap] = useState(user?.handicap != null ? String(user.handicap) : '');
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    if (!firstName.trim()) { Alert.alert('Your name', 'Enter at least a first name so opponents know who they’re playing.'); return; }
    const patch: Record<string, unknown> = {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      home_course_id: homeCourseId,
    };
    if (handicap.trim() !== '') {
      const raw = handicap.trim();
      const value = raw.startsWith('+') ? -Number(raw.slice(1)) : Number(raw);
      if (!Number.isFinite(value) || value < -10 || value > 54) {
        Alert.alert('Handicap Index', 'Enter a number like 8.4, or +1.2 for a plus handicap.'); return;
      }
      patch.handicap = value;
    }
    setSaving(true);
    try {
      const updated = await api.updateMe(patch);
      setUser({ user: updated });
      haptics.success();
      router.replace('/(app)/(tabs)');
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>Welcome to Quell</Text>
        <Text style={styles.sub}>A couple of details so we can match you up.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>First name</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First" placeholderTextColor={colors.muted} autoCapitalize="words" />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Last name (optional)</Text>
          <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last" placeholderTextColor={colors.muted} autoCapitalize="words" />
        </View>

        <CourseSelect
          label="Home course (optional)"
          valueName={homeCourseName}
          onSelect={(course) => { setHomeCourseId(course?.id ?? null); setHomeCourseName(course?.name ?? null); }}
          placeholder="Search your home course…"
        />

        <View style={styles.field}>
          <Text style={styles.label}>Handicap Index (optional)</Text>
          <TextInput style={styles.input} value={handicap} onChangeText={setHandicap} placeholder="e.g. 8.4 (use + for plus)" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" />
          <Text style={styles.hint}>You can set this later, but you'll be asked to confirm it before a match.</Text>
        </View>

        <Button title="Get started" loading={saving} onPress={finish} style={styles.cta} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: Palette) {
  const t = makeType(c);
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    container: { padding: spacing.lg, gap: spacing.md },
    brand: { ...t.hero, fontSize: 32, marginTop: spacing.md },
    sub: { ...t.body, color: c.muted, marginBottom: spacing.sm },
    field: { gap: spacing.xs },
    label: { ...t.overline, color: c.muted },
    input: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, fontSize: 16, color: c.text },
    hint: { ...t.caption, color: c.muted },
    cta: { marginTop: spacing.md },
  });
}
