import { Ghost, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

/**
 * AriseExtraction — "EXTRAIRE L'OMBRE" ritual.
 * --------------------------------------------------------------
 * Pressing the button:
 *   1. Calls store.extractShadow() which fires the ARISE_EXTRACTION cue.
 *   2. Triggers a short screen-shake animation (the inner Animated.View
 *      that wraps the button is translated horizontally back and forth).
 *   3. Reveals an overlay of swirling glyphs for ~1.5 s.
 *
 * The button is rate-limited to one cast every 30 s to prevent spam.
 */

const COOLDOWN_MS = 30 * 1000;

export function AriseExtraction() {
  const extractShadow = useAppStore(s => s.extractShadow);
  const lastAt = useAppStore(s => s.lastShadowExtractedAt);
  const count = useAppStore(s => s.shadowExtractionCount);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = lastAt ? Math.max(0, COOLDOWN_MS - (now - lastAt)) : 0;
  const onCooldown = remainingMs > 0;
  const remainingS = Math.ceil(remainingMs / 1000);

  // ---- Animations -------------------------------------------------
  const shake = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const [active, setActive] = useState(false);

  const trigger = () => {
    if (onCooldown) return;
    extractShadow();
    setActive(true);

    // Screen shake — 8 alternating offsets of ±6px over ~480 ms.
    const seq = Animated.sequence(
      [6, -6, 5, -5, 4, -4, 2, 0].map(v =>
        Animated.timing(shake, {
          toValue: v,
          duration: 60,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    );
    seq.start();

    // Burst overlay opacity pulse
    burst.setValue(0);
    Animated.sequence([
      Animated.timing(burst, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(burst, {
        toValue: 0,
        duration: 1100,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => setActive(false));
  };

  return (
    <View className="mt-4">
      <Animated.View style={{ transform: [{ translateX: shake }] }}>
        <Pressable
          onPress={trigger}
          disabled={onCooldown}
          className="flex-row items-center justify-center rounded-2xl border-2 py-4 px-3 active:opacity-70"
          style={{
            borderColor: onCooldown ? '#475569' : '#A855F7',
            backgroundColor: onCooldown
              ? 'rgba(71,85,105,0.10)'
              : 'rgba(168,85,247,0.18)',
            shadowColor: onCooldown ? 'transparent' : '#A855F7',
            shadowOpacity: onCooldown ? 0 : 0.95,
            shadowRadius: onCooldown ? 0 : 22,
            shadowOffset: { width: 0, height: 0 },
            opacity: onCooldown ? 0.7 : 1,
          }}
        >
          <Ghost
            size={18}
            color={onCooldown ? '#94A3B8' : '#E9D5FF'}
            strokeWidth={2.25}
          />
          <Text
            className="ml-2 text-sm font-black uppercase tracking-[5px]"
            style={{
              color: onCooldown ? '#94A3B8' : '#E9D5FF',
              textShadowColor: onCooldown ? 'transparent' : '#A855F7',
              textShadowRadius: onCooldown ? 0 : 12,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            {onCooldown
              ? `Récupération · ${remainingS}s`
              : "EXTRAIRE L'OMBRE"}
          </Text>
        </Pressable>
      </Animated.View>

      <Text className="mt-1 text-center text-[9px] italic text-slate-600">
        « I rise. » · {count} ombre{count > 1 ? 's' : ''} arrachée{count > 1 ? 's' : ''}
      </Text>

      {/* Burst overlay — purple-violet glyph storm */}
      {active ? (
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: 'rgba(88,28,135,0.55)',
            opacity: burst,
          }}
        >
          <Sparkles size={48} color="#E9D5FF" strokeWidth={1.5} />
          <Text
            className="mt-1 text-[10px] font-black uppercase tracking-[6px] text-purple-100"
            style={{ textShadowColor: '#A855F7', textShadowRadius: 12 }}
          >
            I · RISE
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
