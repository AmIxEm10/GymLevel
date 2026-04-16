import { Shield, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';

import { MUSCLE_GROUP_BY_ID } from '@/data/muscleGroups';
import { TIER_META, type MuscleTier } from '@/data/muscleTiers';
import { useAppStore } from '@/store/useAppStore';
import type { MuscleGroupId } from '@/types';

export interface MuscleRankUp {
  muscleId: MuscleGroupId;
  from: MuscleTier;
  to: MuscleTier;
  at: number;
}

export function MuscleRankUpModal() {
  const rankUp = useAppStore(s => s.lastMuscleRankUp);
  const dismiss = useAppStore(s => s.dismissLastMuscleRankUp);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (rankUp) {
      opacity.setValue(0);
      scale.setValue(0.85);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [rankUp, opacity, scale]);

  if (!rankUp) return null;

  const muscle = MUSCLE_GROUP_BY_ID[rankUp.muscleId];
  const fromMeta = TIER_META[rankUp.from];
  const toMeta = TIER_META[rankUp.to];

  return (
    <Modal
      visible={rankUp !== null}
      transparent
      animationType="none"
      onRequestClose={dismiss}
    >
      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: 'rgba(2,6,23,0.92)',
          opacity,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...({ backdropFilter: 'blur(14px)' } as any),
        }}
      >
        <Text
          className="mb-2 text-center text-base font-black tracking-[3px] text-slate-100"
          style={{
            textShadowColor: toMeta.glow,
            textShadowRadius: 10,
          }}
        >
          Download it and{'\n'}Level UP ✅
        </Text>

        <Animated.View
          style={{
            width: '100%',
            maxWidth: 340,
            borderRadius: 24,
            padding: 24,
            backgroundColor: 'rgba(3,7,18,0.92)',
            borderWidth: 2,
            borderColor: toMeta.color,
            transform: [{ scale }],
            shadowColor: toMeta.glow,
            shadowOpacity: 0.95,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 0 },
            alignItems: 'center',
          }}
        >
          {/* Shield hero */}
          <View
            className="h-24 w-24 items-center justify-center rounded-2xl"
            style={{
              borderWidth: 2,
              borderColor: toMeta.color,
              backgroundColor: `${toMeta.color}30`,
              shadowColor: toMeta.glow,
              shadowOpacity: 1,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <ShieldCheck size={48} color={toMeta.glow} strokeWidth={2} />
          </View>

          {/* RANK UP banner */}
          <Text
            className="mt-4 text-[10px] font-black uppercase tracking-[6px]"
            style={{
              color: toMeta.color,
              textShadowColor: toMeta.glow,
              textShadowRadius: 10,
            }}
          >
            RANK UP
          </Text>

          {/* Muscle name */}
          <Text
            className="mt-1 text-2xl font-black tracking-wider text-slate-100"
            style={{ textShadowColor: toMeta.glow, textShadowRadius: 12 }}
          >
            {muscle.nameEn}
          </Text>

          {/* From → To tiers */}
          <View className="mt-4 flex-row items-center">
            <View
              className="rounded-lg border px-2.5 py-1"
              style={{
                borderColor: fromMeta.color,
                backgroundColor: 'rgba(255,255,255,0.03)',
              }}
            >
              <Text
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: fromMeta.color }}
              >
                {fromMeta.label}
              </Text>
            </View>
            <Text className="mx-2 text-lg font-black text-slate-600">→</Text>
            <View
              className="flex-row items-center rounded-lg px-2.5 py-1"
              style={{
                borderWidth: 1,
                borderColor: toMeta.color,
                backgroundColor: `${toMeta.color}20`,
                shadowColor: toMeta.glow,
                shadowOpacity: 0.9,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <Shield size={12} color={toMeta.glow} strokeWidth={2.25} />
              <Text
                className="ml-1.5 text-[11px] font-black uppercase tracking-widest"
                style={{
                  color: toMeta.color,
                  textShadowColor: toMeta.glow,
                  textShadowRadius: 8,
                }}
              >
                {toMeta.label}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Pressable
          onPress={dismiss}
          className="mt-8 w-full max-w-md rounded-2xl border-2 border-cyan-400 bg-cyan-500/20 py-4 active:opacity-70"
          style={{
            shadowColor: '#22D3EE',
            shadowOpacity: 0.9,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Text
            className="text-center text-sm font-black uppercase tracking-[5px] text-cyan-100"
            style={{ textShadowColor: '#22D3EE', textShadowRadius: 10 }}
          >
            Continue
          </Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}
