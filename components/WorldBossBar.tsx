import { Skull } from 'lucide-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

/**
 * WorldBossBar — neon HP gauge displayed on the Quêtes home.
 * Each kg of working volume shaves 1 HP. The bar pulses softly while the
 * boss is alive, and flashes briefly whenever HP drops.
 */
export function WorldBossBar() {
  const hp = useAppStore(s => s.worldBossHp);
  const max = useAppStore(s => s.worldBossMaxHp);
  const kills = useAppStore(s => s.worldBossKills);

  const ratio = Math.max(0, Math.min(1, hp / Math.max(1, max)));
  const pct = Math.round(ratio * 100);

  // Damage flash — listens to `hp` and animates a quick white burst.
  const flash = useRef(new Animated.Value(0)).current;
  const lastHp = useRef(hp);
  useEffect(() => {
    if (hp < lastHp.current) {
      flash.setValue(1);
      Animated.timing(flash, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();
    }
    lastHp.current = hp;
  }, [hp, flash]);

  // Idle pulse so the bar feels alive even when nothing is happening.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const accent = useMemo(() => {
    if (ratio > 0.66) return { color: '#F43F5E', glow: '#FCA5A5', label: 'INTACT' };
    if (ratio > 0.33) return { color: '#FBBF24', glow: '#FEF3C7', label: 'BLESSÉ' };
    return { color: '#22D3EE', glow: '#A5F3FC', label: 'AGONIE' };
  }, [ratio]);

  const flashOpacity = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.35],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.95],
  });

  return (
    <View
      className="mt-4 rounded-2xl border bg-white/[0.03] p-3"
      style={{
        borderColor: accent.color,
        shadowColor: accent.color,
        shadowOpacity: 0.55,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Skull size={14} color={accent.color} strokeWidth={2.25} />
          <Text
            className="ml-2 text-[10px] font-black uppercase tracking-[4px]"
            style={{
              color: accent.color,
              textShadowColor: accent.color,
              textShadowRadius: 8,
            }}
          >
            BOSS MONDIAL
          </Text>
          <Text className="ml-2 text-[9px] uppercase tracking-widest text-slate-500">
            · {accent.label}
          </Text>
        </View>
        <Text className="text-[10px] font-bold text-slate-400">
          {Math.max(0, hp).toLocaleString()} / {max.toLocaleString()} HP
        </Text>
      </View>

      {/* HP bar — gradient fill + flash overlay */}
      <View className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-800">
        <Animated.View
          className="h-full"
          style={{
            width: `${pct}%`,
            backgroundColor: accent.color,
            opacity: pulseOpacity,
          }}
        />
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0"
          style={{
            backgroundColor: '#FFFFFF',
            opacity: flashOpacity,
          }}
        />
      </View>

      <View className="mt-1.5 flex-row items-center justify-between">
        <Text className="text-[9px] italic text-slate-600">
          Chaque kilo soulevé entaille sa carapace.
        </Text>
        <Text
          className="text-[9px] font-black uppercase tracking-widest"
          style={{ color: accent.glow }}
        >
          KILLS · {kills}
        </Text>
      </View>
    </View>
  );
}
