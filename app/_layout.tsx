import '../global.css';

import { Stack, useSegments, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LootDropModal } from '@/components/LootDropModal';
import { MuscleRankUpModal } from '@/components/MuscleRankUpModal';
import { SecretQuestModal } from '@/components/SecretQuestModal';
import { useAppStore } from '@/store/useAppStore';

/**
 * Root layout — loads global styles, boots the store, gates the app behind
 * onboarding, and mounts the global LootDropModal overlay so any screen can
 * trigger it.
 *
 * The outermost <View flex:1 bg:#020617> guarantees that even the overscroll
 * region (iOS PWA / browser rubber-band) paints the System's deep navy
 * instead of flashing white.
 *
 * Historical Context:
 * - U-02: ErrorBoundary wraps the entire tree so unhandled JS exceptions
 * show a recoverable crash screen instead of a blank production screen.
 * - U-04: isReady gate waits for initializeApp() to resolve before any
 * routing decision is made, preventing the onboarding flash race condition.
 */
export default function RootLayout() {
  const initializeApp = useAppStore(s => s.initializeApp);
  const needsOnboarding = useAppStore(s => s.needsOnboarding);
  const segments = useSegments();

  // U-04 — block routing until the async store hydration is complete.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // initializeApp is synchronous right now, but might become async.
    // Wrap it in Promise.resolve just in case.
    Promise.resolve(initializeApp()).finally(() => setIsReady(true));
  }, [initializeApp]);

  // Onboarding gate — only runs after the store is fully hydrated.
  useEffect(() => {
    if (!isReady) return;
    const first = segments[0];
    if (needsOnboarding && first !== 'onboarding') {
      router.replace('/onboarding');
    } else if (!needsOnboarding && first === 'onboarding') {
      router.replace('/');
    }
  }, [isReady, needsOnboarding, segments]);

  // Show a minimal splash while the store hydrates to avoid UI flicker.
  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#020617',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View className="flex-1 bg-[#020617]" style={{ flex: 1, backgroundColor: '#020617' }}>
        <SafeAreaProvider style={{ backgroundColor: '#020617' }}>
          <StatusBar style="light" backgroundColor="#020617" translucent />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#020617' },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="workout/selection" />
            <Stack.Screen name="workout/active" />
            <Stack.Screen name="workout/recap" />
            <Stack.Screen name="admin/console" />
            <Stack.Screen name="mailbox/index" />
          </Stack>

          {/* Global overlays */}
          <LootDropModal />
          <SecretQuestModal />
          <MuscleRankUpModal />
        </SafeAreaProvider>
      </View>
    </ErrorBoundary>
  );
}
