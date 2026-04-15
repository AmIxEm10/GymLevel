import '../global.css';

import { Stack, useSegments, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LootDropModal } from '@/components/LootDropModal';
import { useAppStore } from '@/store/useAppStore';

/**
 * Root layout — loads global styles, boots the store, gates the app behind
 * onboarding, and mounts the global LootDropModal overlay so any screen can
 * trigger it.
 */
export default function RootLayout() {
  const initializeApp = useAppStore(s => s.initializeApp);
  const needsOnboarding = useAppStore(s => s.needsOnboarding);
  const segments = useSegments();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Onboarding gate
  useEffect(() => {
    const first = segments[0];
    if (needsOnboarding && first !== 'onboarding') {
      router.replace('/onboarding');
    } else if (!needsOnboarding && first === 'onboarding') {
      router.replace('/');
    }
  }, [needsOnboarding, segments]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0B0F19' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="workout/selection" />
        <Stack.Screen name="workout/active" />
        <Stack.Screen name="workout/recap" />
      </Stack>

      {/* Global loot drop overlay */}
      <LootDropModal />
    </SafeAreaProvider>
  );
}
