import { Tabs } from 'expo-router';
import { User } from 'lucide-react-native';

/**
 * Tabs layout — only Profile for now. Tracker / Quests / Templates will
 * be added as separate tabs in later passes.
 */
export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="profile"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B0F19',
          borderTopColor: '#1E293B',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#60A5FA',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
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
