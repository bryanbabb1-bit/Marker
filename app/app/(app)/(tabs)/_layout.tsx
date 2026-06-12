import { useEffect } from 'react';
import { StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/lib/haptics';
import { useApi } from '@/lib/useApi';
import { useResultsStore, selectUnseenCount } from '@/store/useResultsStore';
import { useColors } from '@/store/useThemeStore';
import { fonts } from '@/constants/theme';

export default function TabsLayout() {
  const colors = useColors();
  const api = useApi();
  const hydrate = useResultsStore((s) => s.hydrate);
  const setCompleted = useResultsStore((s) => s.setCompleted);
  const unseen = useResultsStore(selectUnseenCount);

  useEffect(() => { hydrate(); }, [hydrate]);

  // Keep the completed-match list fresh so the badge reflects new results.
  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const { matches } = await api.myMatches();
        if (active) setCompleted(matches.filter((m) => m.status === 'completed').map((m) => m.id));
      } catch { /* transient — try again on the next tick */ }
    };
    run();
    const t = setInterval(run, 20000);
    return () => { active = false; clearInterval(t); };
  }, [api, setCompleted]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text, fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.3 },
        headerShadowVisible: false,
        // Foretera mark in the top-left of every tab header.
        headerLeft: () => (
          <Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />
        ),
        // Settings lives behind the menu (tab bar stays at 5 — the surfaces
        // members actually live in; Settings is low-frequency).
        headerRight: () => (
          <TouchableOpacity
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Menu"
            style={styles.headerMenu}
            onPress={() => { haptics.select(); router.push('/(app)/settings'); }}
          >
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
        ),
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, height: 88, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: fonts.bodyMed, fontSize: 11, letterSpacing: 0.2 },
        tabBarItemStyle: { paddingTop: 4 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discovery',
          tabBarIcon: ({ color, size }) => <Ionicons name="golf-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="newspaper-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'My Matches',
          tabBarBadge: unseen > 0 ? unseen : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.loss, color: colors.text, fontFamily: fonts.bodySemi, fontSize: 11 },
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLogo: { width: 30, height: 30, borderRadius: 7, marginLeft: 16 },
  headerMenu: { marginRight: 16 },
});
