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
  TIER_ORDER,
  getMasteryTitle,
  getMuscleTier,
  progressWithinTier,
  tierRankIndex,
  type MuscleTier,
} from '@/data/muscleTiers';
import { selectProfile, useAppStore } from '@/store/useAppStore';
import type { BodyPart, MuscleGroupId } from '@/types';

// ---------------------------------------------------------------------------
// Filter definitions — single source of truth. Each row carries its own
// `bodyParts` array so the filter logic stays trivial + case-safe.
// ---------------------------------------------------------------------------

type Filter = 'all' | 'upper' | 'lower' | 'core';

interface FilterDef {
  id: Filter;
  label: string;
  bodyParts: BodyPart[] | null; // null = no filter (All)
}

const FILTERS: readonly FilterDef[] = [
  { id: 'all',   label: 'Tous',   bodyParts: null },
  { id: 'upper', label: 'Haut',   bodyParts: ['upper'] },
  { id: 'lower', label: 'Bas',    bodyParts: ['lower'] },
  { id: 'core',  label: 'Tronc',  bodyParts: ['core'] },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function MusclesScreen() {
  const profile = useAppStore(selectProfile);
  const [filter, setFilter] = useState<Filter>('all');

  /** The filtered muscle-id list — case-insensitive, bodyParts-driven. */
  const muscleIds = useMemo<MuscleGroupId[]>(() => {
    const normalized = (filter ?? 'all').toString().toLowerCase() as Filter;
    const def = FILTERS.find(f => f.id === normalized) ?? FILTERS[0]!;
    if (!def.bodyParts) return [...ALL_MUSCLE_IDS];
    return ALL_MUSCLE_IDS.filter(id =>
      def.bodyParts!.includes(MUSCLE_GROUP_BY_ID[id].bodyPart),
    );
  }, [filter]);

  /** Total XP summed across every muscle (display only — not the tier). */
  const totalMuscleXp = useMemo(() => {
    let s = 0;
    for (const m of Object.values(profile.muscleStats)) s += m.xp;
    return s;
  }, [profile.muscleStats]);

  /**
   * Overall Rank = MEAN of every visible muscle's rank (index on the ladder).
   * Computed over the currently-filtered list so picking "Core" reveals the
   * overall tier of your core specifically.
   */
  const overallTier = useMemo<MuscleTier>(() => {
    if (muscleIds.length === 0) return 'untrained';
    const sum = muscleIds.reduce((acc, id) => {
      const tier = getMuscleTier(profile.muscleStats[id].xp);
      return acc + tierRankIndex(tier);
    }, 0);
    const avgIndex = Math.round(sum / muscleIds.length);
    return TIER_ORDER[avgIndex] ?? 'untrained';
  }, [muscleIds, profile.muscleStats]);
  const overallMeta = TIER_META[overallTier];

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
        <View className="items-center px-5 pt-4 pb-5">
          <Text className="text-center text-[10px] font-semibold uppercase tracking-[6px] text-blue-400/70">
            LE SYSTÈME
          </Text>
          <Text
            className="mt-1 text-center text-3xl font-black tracking-[3px] text-blue-300"
            style={{
              textShadowColor: '#22D3EE',
              textShadowRadius: 18,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            RANGS MUSCULAIRES
          </Text>
          <View className="mt-3 h-[2px] w-20 bg-cyan-400" />
        </View>

        {/* ================================================== TIER LADDER */}
        <View className="px-4 pb-4">
          <View className="flex-row items-start justify-between">
            {TIER_FAMILIES.slice(4).map(f => (
              <View key={f.id} className="flex-1 items-center justify-center px-0.5">
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    borderWidth: 1.25,
                    borderColor: f.color,
                    backgroundColor: `${f.color}18`,
                    shadowColor: f.glow,
                    shadowOpacity: 0.7,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <Shield size={18} color={f.color} strokeWidth={2} />
                </View>
                <Text
                  className="mt-1.5 text-center text-[9px] font-bold uppercase tracking-widest"
                  numberOfLines={1}
                  style={{ color: f.color }}
                >
                  {f.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ================================================== OVERALL RANK */}
        <View className="mx-5 mb-5">
          <View
            className="items-center justify-center rounded-2xl border-2 bg-white/[0.03] px-5 py-6"
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
              <ShieldCheck size={32} color={overallMeta.glow} strokeWidth={2} />
            </View>
            <Text className="mt-3 text-center text-[9px] font-bold uppercase tracking-[3px] text-slate-400">
              Rang Global
            </Text>
            <Text
              className="mt-0.5 text-center text-2xl font-black tracking-wider"
              style={{
                color: overallMeta.color,
                textShadowColor: overallMeta.glow,
                textShadowRadius: 12,
              }}
            >
              {overallMeta.label}
            </Text>
            <Text className="mt-1 text-center text-[11px] text-slate-500">
              {totalMuscleXp >= 1000
                ? `${(totalMuscleXp / 1000).toFixed(1)}k Total XP`
                : `${Math.round(totalMuscleXp)} Total XP`}
            </Text>
          </View>
        </View>

        {/* ================================================== FILTERS */}
        <View className="mx-5 mb-5 flex-row rounded-full border border-blue-500/30 bg-white/[0.03] p-1.5" style={{ gap: 6 }}>
          {FILTERS.map(f => {
            const active = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                className="flex-1 items-center justify-center rounded-full py-2 active:opacity-70"
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
                  className={`text-center text-[10px] font-black uppercase ${
                    active ? 'text-cyan-200' : 'text-slate-500'
                  }`}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  style={
                    active
                      ? {
                          textShadowColor: '#22D3EE',
                          textShadowRadius: 8,
                          letterSpacing: 1,
                        }
                      : { letterSpacing: 1 }
                  }
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Debug caption — helps verify the filter took effect at a glance. */}
        <Text className="mb-2 text-center text-[10px] uppercase tracking-[3px] text-slate-600">
          {muscleIds.length} muscle{muscleIds.length > 1 ? 's' : ''} · {
            FILTERS.find(f => f.id === filter)?.label
          }
        </Text>

        {/* ============================================ MUSCLE GRID (3 cols) */}
        <View className="px-3 flex-row flex-wrap">
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
              <View key={id} className="w-1/3 p-1">
                <View
                  className="rounded-xl border p-2 items-center"
                  style={{
                    borderColor: meta.color,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    shadowColor: meta.glow,
                    shadowOpacity: 0.55,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  {/* Icon + FOCUS flag */}
                  <View className="flex-row items-center justify-center">
                    <View
                      className="h-7 w-7 items-center justify-center rounded-lg"
                      style={{
                        borderWidth: 1,
                        borderColor: muscle.colorHex,
                        backgroundColor: `${muscle.colorHex}22`,
                      }}
                    >
                      <View
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 4.5,
                          backgroundColor: muscle.colorHex,
                        }}
                      />
                    </View>
                    {isFocus ? (
                      <View
                        className="ml-1 h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: '#F97316',
                          shadowColor: '#F97316',
                          shadowOpacity: 0.9,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 0 },
                        }}
                      />
                    ) : null}
                  </View>

                  {/* Muscle name */}
                  <Text
                    className="mt-1 text-center text-[10px] font-bold text-slate-100"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {muscle.name}
                  </Text>

                  {/* Tier chip — full French label */}
                  <View
                    className="mt-1 flex-row items-center rounded-md px-1.5 py-[1px]"
                    style={{
                      borderWidth: 1,
                      borderColor: meta.color,
                      backgroundColor: `${meta.color}1A`,
                    }}
                  >
                    <Shield size={7} color={meta.color} strokeWidth={2.5} />
                    <Text
                      className="ml-1 text-center text-[8px] font-black uppercase"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                      style={{
                        color: meta.color,
                        textShadowColor: meta.glow,
                        textShadowRadius: 3,
                        letterSpacing: 0.5,
                      }}
                    >
                      {meta.label}
                    </Text>
                  </View>

                  {/* Mastery sub-title — family-level mastery name (Initié / Expert…) */}
                  <Text
                    className="mt-0.5 text-center text-[8px] italic tracking-widest"
                    numberOfLines={1}
                    style={{ color: meta.glow, opacity: 0.85 }}
                  >
                    {getMasteryTitle(tier)}
                  </Text>

                  {/* Progress bar */}
                  <View className="mt-1.5 w-full">
                    <GradientBar
                      percent={p.ratio * 100}
                      height={3}
                      startColor="#1e40af"
                      endColor={meta.glow}
                    />
                  </View>

                  {/* XP */}
                  <Text
                    className="mt-1 text-center text-[9px] text-slate-500"
                    numberOfLines={1}
                  >
                    {stats.xp >= 1000
                      ? `${(stats.xp / 1000).toFixed(1)}k`
                      : `${Math.round(stats.xp)}`} XP
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
