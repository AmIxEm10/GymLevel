import { Shield, ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientBar } from '@/components/GradientBar';
import {
  ALL_MUSCLE_IDS,
  MUSCLE_GROUP_BY_ID,
} from '@/data/muscleGroups';
import {
  TIER_FAMILIES,
  TIER_META,
  getMuscleTier,
  getOverallTier,
  progressWithinTier,
} from '@/data/muscleTiers';
import { selectProfile, useAppStore } from '@/store/useAppStore';
import type { BodyPart, MuscleGroupId } from '@/types';

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------

type Filter = 'all' | 'upper' | 'lower' | 'core';

const FILTERS: Array<{ id: Filter; label: string; bodyParts?: BodyPart[] }> = [
  { id: 'all',   label: 'All' },
  { id: 'upper', label: 'Upper Body', bodyParts: ['upper'] },
  { id: 'lower', label: 'Lower Body', bodyParts: ['lower'] },
  { id: 'core',  label: 'Core',       bodyParts: ['core'] },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MusclesScreen() {
  const profile = useAppStore(selectProfile);
  const [filter, setFilter] = useState<Filter>('all');

  const muscleIds = useMemo<MuscleGroupId[]>(() => {
    const filterDef = FILTERS.find(f => f.id === filter);
    const bodyParts = filterDef?.bodyParts;
    return ALL_MUSCLE_IDS.filter(id => {
      if (!bodyParts) return true;
      return bodyParts.includes(MUSCLE_GROUP_BY_ID[id].bodyPart);
    });
  }, [filter]);

  const totalMuscleXp = useMemo(() => {
    let s = 0;
    for (const m of Object.values(profile.muscleStats)) s += m.xp;
    return s;
  }, [profile.muscleStats]);

  const overallTier = getOverallTier(totalMuscleXp);
  const overallMeta = TIER_META[overallTier];

  // Recently trained muscles get the FOCUS badge (last 24h).
  const FOCUS_WINDOW_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#020617]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================== HEADER */}
        <View className="px-5 pt-4 pb-4">
          <Text className="text-[10px] font-semibold tracking-[6px] text-blue-400/70">
            LE SYSTÈME
          </Text>
          <Text
            className="mt-1 text-3xl font-black tracking-[3px] text-blue-300"
            style={{
              textShadowColor: '#22D3EE',
              textShadowRadius: 18,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            MUSCLE RANKINGS
          </Text>
          <View className="mt-2 h-[2px] w-20 bg-cyan-400" />
        </View>

        {/* ================================================== TIER LADDER */}
        <View className="px-5 pb-3">
          <View className="flex-row justify-between">
            {TIER_FAMILIES.slice(3).map(f => (
              <View key={f.id} className="flex-1 items-center">
                <View
                  className="h-9 w-9 items-center justify-center rounded-full border"
                  style={{
                    borderColor: f.color,
                    backgroundColor: `${f.color}15`,
                    shadowColor: f.glow,
                    shadowOpacity: 0.65,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <Shield size={16} color={f.color} strokeWidth={2} />
                </View>
                <Text
                  className="mt-1 text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: f.color }}
                >
                  {f.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ================================================== OVERALL RANK */}
        <View className="mx-5 mb-4">
          <View
            className="items-center rounded-2xl border-2 bg-white/[0.03] px-4 py-5"
            style={{
              borderColor: overallMeta.color,
              shadowColor: overallMeta.glow,
              shadowOpacity: 0.85,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <View
              className="h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                borderWidth: 2,
                borderColor: overallMeta.color,
                backgroundColor: `${overallMeta.color}25`,
                shadowColor: overallMeta.glow,
                shadowOpacity: 0.9,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 0 },
              }}
            >
              <ShieldCheck size={30} color={overallMeta.glow} strokeWidth={2} />
            </View>
            <Text
              className="mt-2 text-[9px] font-bold uppercase tracking-[3px] text-slate-400"
            >
              Overall Rank
            </Text>
            <Text
              className="text-2xl font-black tracking-wider"
              style={{
                color: overallMeta.color,
                textShadowColor: overallMeta.glow,
                textShadowRadius: 12,
              }}
            >
              {overallMeta.label}
            </Text>
            <Text className="mt-0.5 text-[11px] text-slate-500">
              {totalMuscleXp >= 1000
                ? `${(totalMuscleXp / 1000).toFixed(1)}k Total XP`
                : `${Math.round(totalMuscleXp)} Total XP`}
            </Text>
          </View>
        </View>

        {/* ================================================== FILTERS */}
        <View className="mx-5 mb-4 flex-row rounded-full border border-blue-500/30 bg-white/[0.03] p-1">
          {FILTERS.map(f => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                className="flex-1 items-center rounded-full py-1.5 active:opacity-70"
                style={{
                  backgroundColor: active ? 'rgba(34,211,238,0.20)' : 'transparent',
                  borderWidth: active ? 1 : 0,
                  borderColor: '#22D3EE',
                  shadowColor: active ? '#22D3EE' : 'transparent',
                  shadowOpacity: active ? 0.7 : 0,
                  shadowRadius: active ? 10 : 0,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text
                  className={`text-[11px] font-black uppercase tracking-[3px] ${
                    active ? 'text-cyan-200' : 'text-slate-500'
                  }`}
                  style={
                    active
                      ? { textShadowColor: '#22D3EE', textShadowRadius: 8 }
                      : undefined
                  }
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ================================================== MUSCLE LIST */}
        <View className="px-5 gap-2">
          {muscleIds.map(id => {
            const muscle = MUSCLE_GROUP_BY_ID[id];
            const stats = profile.muscleStats[id];
            const tier = getMuscleTier(stats.xp);
            const meta = TIER_META[tier];
            const p = progressWithinTier(stats.xp, 'muscle');
            const isFocus =
              stats.lastTrainedAt !== null &&
              now - stats.lastTrainedAt < FOCUS_WINDOW_MS;

            return (
              <View
                key={id}
                className="rounded-2xl border p-3"
                style={{
                  borderColor: meta.color,
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  shadowColor: meta.glow,
                  shadowOpacity: 0.55,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    {/* Mini anatomical dot using the muscle's own color */}
                    <View
                      className="h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        borderWidth: 1.25,
                        borderColor: muscle.colorHex,
                        backgroundColor: `${muscle.colorHex}22`,
                      }}
                    >
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: muscle.colorHex,
                        }}
                      />
                    </View>

                    <Text className="ml-3 text-base font-bold tracking-wider text-slate-100">
                      {muscle.nameEn}
                    </Text>

                    {isFocus ? (
                      <View
                        className="ml-2 rounded-md px-1.5 py-0.5"
                        style={{
                          borderWidth: 1,
                          borderColor: '#F97316',
                          backgroundColor: 'rgba(249,115,22,0.15)',
                          shadowColor: '#F97316',
                          shadowOpacity: 0.8,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 0 },
                        }}
                      >
                        <Text
                          className="text-[9px] font-black uppercase tracking-[2px] text-orange-300"
                          style={{ textShadowColor: '#F97316', textShadowRadius: 4 }}
                        >
                          Focus
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Tier badge */}
                  <View
                    className="flex-row items-center rounded-lg px-2 py-0.5"
                    style={{
                      borderWidth: 1,
                      borderColor: meta.color,
                      backgroundColor: `${meta.color}1A`,
                    }}
                  >
                    <Shield size={10} color={meta.color} strokeWidth={2.25} />
                    <Text
                      className="ml-1 text-[10px] font-black uppercase tracking-widest"
                      style={{
                        color: meta.color,
                        textShadowColor: meta.glow,
                        textShadowRadius: 4,
                      }}
                    >
                      {meta.label}
                    </Text>
                  </View>
                </View>

                <View className="mt-2.5">
                  <GradientBar
                    percent={p.ratio * 100}
                    height={5}
                    startColor="#1e40af"
                    endColor={meta.glow}
                  />
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-[10px] text-slate-500">
                      {Math.round(stats.xp).toLocaleString()} XP
                    </Text>
                    <Text className="text-[10px] font-semibold" style={{ color: meta.color }}>
                      {p.next
                        ? `Nv. ${TIER_META[p.next].label}`
                        : 'Tier max'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
