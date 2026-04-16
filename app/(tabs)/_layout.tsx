import { Tabs } from 'expo-router';
import {
  Backpack,
  Dumbbell,
  ScrollText,
  Trophy,
  User,
} from 'lucide-react-native';

import { playSound } from '@/services/soundService';

/**
 * Tabs layout.
 * - index     → Quêtes (home)
 * - ranking   → Ranking (leaderboard mondial)
 * - muscles   → Muscle Rankings
 * - inventory → Inventaire
 * - profile   → Statut
 *
 * Each tab press fires a CLICK_NEON synth blip (or the MP3 if installed).
 */
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenListeners={{
        tabPress: () => playSound('CLICK_NEON', { restart: true }),
      }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Quêtes',
          tabBarIcon: ({ color, size }) => (
            <ScrollText color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => (
            <Trophy color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="muscles"
        options={{
          title: 'Muscles',
          tabBarIcon: ({ color, size }) => (
            <Dumbbell color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventaire',
          tabBarIcon: ({ color, size }) => (
            <Backpack color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Statut',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
