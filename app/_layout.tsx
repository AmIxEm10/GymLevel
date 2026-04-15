import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAppStore } from '@/store/useAppStore';

/**
 * Root layout — loads global styles, boots the store, and renders the
 * router stack. Gamification/recovery/quest refresh runs inside
 * initializeApp(); the bodyweight-onboarding gate is handled by the UI
 * (see app/(tabs)/profile.tsx until the dedicated onboarding screen ships).
 */
export default function RootLayout() {
  const initializeApp = useAppStore(s => s.initializeApp);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0B0F19' },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
