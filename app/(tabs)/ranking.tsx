import { Crown, Globe, Shield, Users, Map } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PLAYER_CLASSES_BY_ID } from '@/data/playerClasses';
import {
  TIER_META,
  getOverallTier,
  tierRankIndex,
} from '@/data/muscleTiers';
import { calculatePowerLevel } from '@/services/gamificationService';
import { selectProfile, useAppStore } from '@/store/useAppStore';
import type { PlayerClassId } from '@/types';

// ---------------------------------------------------------------------------
// Mock global leaderboard
// ---------------------------------------------------------------------------

type Scope = 'world' | 'regional' | 'friends';

interface LeaderEntry {
  rank: number;
  name: string;
  classId: PlayerClassId;
  powerLevel: number;
  /** Total muscle XP used to derive the global tier. */
  overallXp: number;
  isYou?: boolean;
}

interface HunterSeed extends Omit<LeaderEntry, 'rank' | 'overallXp'> {
  overallXp: number;
  region?: 'eu' | 'na' | 'asia' | 'local';
}

// Stat-sheet entries — overallXp is roughly PL * 3 (used to derive tiers).
const WORLD_HUNTERS: HunterSeed[] = [
  { name: 'Sung Jinwoo',        classId: 'assassin', powerLevel: 148220, overallXp: 420000, region: 'asia' },
  { name: 'Cha Hae-In',         classId: 'guerrier', powerLevel: 132800, overallXp: 370000, region: 'asia' },
  { name: 'Thomas Andre',       classId: 'tank',     powerLevel: 120550, overallXp: 330000, region: 'na'   },
  { name: 'Baek Yoonho',        classId: 'ranger',   powerLevel: 98120,  overallXp: 265000, region: 'asia' },
  { name: 'Liu Zhigang',        classId: 'guerrier', powerLevel: 92410,  overallXp: 245000, region: 'asia' },
  { name: 'Christopher Reed',   classId: 'tank',     powerLevel: 86230,  overallXp: 225000, region: 'na'   },
  { name: 'Hwang Dongsoo',      classId: 'guerrier', powerLevel: 80100,  overallXp: 205000, region: 'asia' },
  { name: 'Min Byung-Gu',       classId: 'healer',   powerLevel: 74820,  overallXp: 190000, region: 'asia' },
  { name: 'Yoo Jinho',          classId: 'tank',     powerLevel: 71200,  overallXp: 180000, region: 'asia' },
  { name: 'Norma Selner',       classId: 'mage',     powerLevel: 68310,  overallXp: 170000, region: 'eu'   },
  { name: 'Goto Ryuji',         classId: 'guerrier', powerLevel: 63400,  overallXp: 155000, region: 'asia' },
  { name: 'Esil Radiru',        classId: 'mage',     powerLevel: 59800,  overallXp: 142000, region: 'eu'   },
  { name: 'Lennart Niermann',   classId: 'ranger',   powerLevel: 54100,  overallXp: 125000, region: 'eu'   },
  { name: 'Yoo Soo-hyun',       classId: 'assassin', powerLevel: 50220,  overallXp: 112000, region: 'asia' },
  { name: 'Song Chi-yul',       classId: 'healer',   powerLevel: 46700,  overallXp: 101000, region: 'asia' },
  { name: 'Woo Jinchul',        classId: 'guerrier', powerLevel: 43800,  overallXp: 92000,  region: 'asia' },
  { name: 'Lim Tae-gyu',        classId: 'tank',     powerLevel: 40100,  overallXp: 82000,  region: 'asia' },
  { name: 'Baek Yeon-oh',       classId: 'ranger',   powerLevel: 37200,  overallXp: 73000,  region: 'asia' },
  { name: 'Lee Ju-hee',         classId: 'healer',   powerLevel: 33900,  overallXp: 62000,  region: 'asia' },
  { name: 'Park Hee-jin',       classId: 'mage',     powerLevel: 30600,  overallXp: 52000,  region: 'asia' },
];

const FRIENDS_HUNTERS: HunterSeed[] = [
  { name: 'Tak',    classId: 'guerrier', powerLevel: 8420, overallXp: 7800,  region: 'local' },
  { name: 'Chloé',  classId: 'ranger',   powerLevel: 5210, overallXp: 4600,  region: 'local' },
  { name: 'Elias',  classId: 'assassin', powerLevel: 4080, overallXp: 3500,  region: 'local' },
  { name: 'Nadia',  classId: 'healer',   powerLevel: 3200, overallXp: 2700,  region: 'local' },
  { name: 'Sam',    classId: 'tank',     powerLevel: 2150, overallXp: 1800,  region: 'local' },
];

// "Régional" = bottom 10 of the world pool by PL — mock "neighbourhood".
function pickRegionalPool(): HunterSeed[] {
  return [...WORLD_HUNTERS].sort((a, b) => a.powerLevel - b.powerLevel).slice(0, 10);
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RankingScreen() {
  const profile = useAppStore(selectProfile);
  const [scope, setScope] = useState<Scope>('world');

  const entries = useMemo<LeaderEntry[]>(() => {
    let pool: HunterSeed[];
    if (scope === 'world')          pool = WORLD_HUNTERS;
    else if (scope === 'regional')  pool = pickRegionalPool();
    else                            pool = FRIENDS_HUNTERS;

    const playerOverallXp = Object.values(profile.muscleStats).reduce(
      (s, m) => s + m.xp,
      0,
    );
    const pl = calculatePowerLevel(profile);

    const youEntry: HunterSeed = {
      name: profile.nickname?.trim() || 'Chasseur',
      classId: profile.playerClassId,
      powerLevel: pl,
      overallXp: playerOverallXp,
      isYou: true,
    };

    const mixed: HunterSeed[] = [...pool, youEntry];
    // Sort by GLOBAL MUSCLE TIER first (ladder position), PL as tiebreaker.
    mixed.sort((a, b) => {
      const ta = tierRankIndex(getOverallTier(a.overallXp));
      const tb = tierRankIndex(getOverallTier(b.overallXp));
      if (ta !== tb) return tb - ta;
      return b.powerLevel - a.powerLevel;
    });
    return mixed.map((e, i) => ({ ...e, rank: i + 1 }));
  }, [profile, scope]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#020617]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center px-5 pt-4 pb-4">
          <Text className="text-[10px] font-semibold tracking-[6px] text-center text-blue-400/70">
            LE SYSTÈME
          </Text>
          <Text
            className="mt-1 text-3xl font-black tracking-[3px] text-center text-blue-300"
            style={{
              textShadowColor: '#22D3EE',
              textShadowRadius: 18,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            RANKING
          </Text>
          <View className="mt-3 h-[2px] w-20 bg-cyan-400" />
          <Text className="mt-2 text-center text-[10px] uppercase tracking-widest text-slate-500">
            Trié par rang musculaire global
          </Text>
        </View>

        {/* Scope toggle */}
        <View className="mx-5 mb-4 flex-row rounded-full border border-blue-500/30 bg-white/[0.03] p-1">
          {(
            [
              { id: 'world',    label: 'Mondial',  Icon: Globe },
              { id: 'regional', label: 'Régional', Icon: Map },
              { id: 'friends',  label: 'Amis',     Icon: Users },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = scope === id;
            return (
              <Pressable
                key={id}
                onPress={() => setScope(id)}
                className="flex-1 flex-row items-center justify-center rounded-full py-2 active:opacity-70"
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
                <Icon
                  size={12}
                  color={active ? '#A5F3FC' : '#64748B'}
                  strokeWidth={2.25}
                />
                <Text
                  className={`ml-1.5 text-[11px] font-black uppercase tracking-[3px] ${
                    active ? 'text-cyan-200' : 'text-slate-500'
                  }`}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Leaderboard list */}
        <View className="px-5" style={{ gap: 8 }}>
          {entries.map(e => (
            <LeaderRow key={`${e.rank}-${e.name}`} entry={e} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LeaderRow({ entry }: { entry: LeaderEntry }) {
  const cls = PLAYER_CLASSES_BY_ID[entry.classId];
  const classColor = cls?.colorHex ?? '#60A5FA';
  const top3 = entry.rank <= 3;

  const accent =
    entry.rank === 1
      ? '#FBBF24'
      : entry.rank === 2
      ? '#E5E7EB'
      : entry.rank === 3
      ? '#F97316'
      : '#1e293b';

  const tier = getOverallTier(entry.overallXp);
  const tierMeta = TIER_META[tier];

  return (
    <View
      className="flex-row items-center rounded-2xl border bg-white/[0.03] p-3"
      style={{
        borderColor: entry.isYou ? '#22D3EE' : top3 ? accent : '#1e293b',
        shadowColor: top3 ? accent : entry.isYou ? '#22D3EE' : 'transparent',
        shadowOpacity: top3 || entry.isYou ? 0.7 : 0,
        shadowRadius: top3 || entry.isYou ? 14 : 0,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      {/* Rank */}
      <View className="w-9 items-center justify-center">
        {entry.rank === 1 ? (
          <Crown size={14} color="#FBBF24" strokeWidth={2.25} />
        ) : null}
        <Text
          className="text-center text-lg font-black"
          style={{
            color: top3 ? accent : '#64748B',
            textShadowColor: top3 ? accent : 'transparent',
            textShadowRadius: top3 ? 8 : 0,
          }}
        >
          {entry.rank}
        </Text>
      </View>

      {/* Name + class + tier */}
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text
            className="text-sm font-bold"
            style={{
              color: entry.isYou ? '#67E8F9' : '#E2E8F0',
              textShadowColor: entry.isYou ? '#22D3EE' : 'transparent',
              textShadowRadius: entry.isYou ? 8 : 0,
            }}
            numberOfLines={1}
          >
            {entry.name}
          </Text>
          {entry.isYou ? (
            <Text className="ml-1.5 rounded-md border border-cyan-400/60 bg-cyan-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-200">
              You
            </Text>
          ) : null}
        </View>
        <View className="mt-0.5 flex-row items-center">
          <Text
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: classColor }}
          >
            {cls?.name ?? 'Novice'}
          </Text>
          <Text className="mx-1.5 text-[10px] text-slate-700">·</Text>
          <View className="flex-row items-center">
            <Shield size={9} color={tierMeta.color} strokeWidth={2.25} />
            <Text
              className="ml-1 text-[10px] font-black uppercase tracking-widest"
              style={{
                color: tierMeta.color,
                textShadowColor: tierMeta.glow,
                textShadowRadius: 4,
              }}
            >
              {tierMeta.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Power Level */}
      <View className="items-end justify-center">
        <Text className="text-[9px] uppercase tracking-widest text-slate-500">
          Power
        </Text>
        <Text
          className="text-base font-black"
          style={{
            color: top3 ? accent : '#67E8F9',
            textShadowColor: top3 ? accent : '#22D3EE',
            textShadowRadius: 8,
          }}
        >
          {entry.powerLevel >= 1000
            ? `${(entry.powerLevel / 1000).toFixed(1)}k`
            : entry.powerLevel.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}
