import { Crown, Shield, Swords, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PLAYER_CLASSES_BY_ID } from '@/data/playerClasses';
import { calculatePowerLevel } from '@/services/gamificationService';
import { selectProfile, useAppStore } from '@/store/useAppStore';
import type { PlayerClassId } from '@/types';

// ---------------------------------------------------------------------------
// Mock global leaderboard
// ---------------------------------------------------------------------------

type Scope = 'world' | 'friends';

interface LeaderEntry {
  rank: number;
  name: string;
  classId: PlayerClassId;
  powerLevel: number;
  isYou?: boolean;
}

const WORLD_HUNTERS: Omit<LeaderEntry, 'rank'>[] = [
  { name: 'Sung Jinwoo', classId: 'assassin', powerLevel: 148220 },
  { name: 'Cha Hae-In',  classId: 'guerrier', powerLevel: 132800 },
  { name: 'Thomas Andre',classId: 'tank',     powerLevel: 120550 },
  { name: 'Baek Yoonho', classId: 'ranger',   powerLevel: 98120 },
  { name: 'Liu Zhigang', classId: 'guerrier', powerLevel: 92410 },
  { name: 'Christopher Reed', classId: 'tank', powerLevel: 86230 },
  { name: 'Hwang Dongsoo', classId: 'guerrier', powerLevel: 80100 },
  { name: 'Min Byung-Gu', classId: 'healer',   powerLevel: 74820 },
  { name: 'Yoo Jinho',    classId: 'tank',     powerLevel: 71200 },
  { name: 'Norma Selner', classId: 'mage',     powerLevel: 68310 },
  { name: 'Goto Ryuji',   classId: 'guerrier', powerLevel: 63400 },
  { name: 'Esil Radiru',  classId: 'mage',     powerLevel: 59800 },
  { name: 'Lennart Niermann', classId: 'ranger', powerLevel: 54100 },
  { name: 'Yoo Soo-hyun', classId: 'assassin', powerLevel: 50220 },
  { name: 'Song Chi-yul', classId: 'healer',   powerLevel: 46700 },
  { name: 'Woo Jinchul',  classId: 'guerrier', powerLevel: 43800 },
  { name: 'Lim Tae-gyu',  classId: 'tank',     powerLevel: 40100 },
  { name: 'Baek Yeon-oh', classId: 'ranger',   powerLevel: 37200 },
  { name: 'Lee Ju-hee',   classId: 'healer',   powerLevel: 33900 },
  { name: 'Park Hee-jin', classId: 'mage',     powerLevel: 30600 },
];

const FRIENDS_HUNTERS: Omit<LeaderEntry, 'rank'>[] = [
  { name: 'Tak',      classId: 'guerrier', powerLevel: 8420 },
  { name: 'Chloé',    classId: 'ranger',   powerLevel: 5210 },
  { name: 'Elias',    classId: 'assassin', powerLevel: 4080 },
  { name: 'Nadia',    classId: 'healer',   powerLevel: 3200 },
  { name: 'Sam',      classId: 'tank',     powerLevel: 2150 },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RankingScreen() {
  const profile = useAppStore(selectProfile);
  const [scope, setScope] = useState<Scope>('world');

  const entries = useMemo<LeaderEntry[]>(() => {
    const pool = scope === 'world' ? WORLD_HUNTERS : FRIENDS_HUNTERS;
    const pl = calculatePowerLevel(profile);
    const youEntry: Omit<LeaderEntry, 'rank'> = {
      name: profile.nickname?.trim() || 'Chasseur',
      classId: profile.playerClassId,
      powerLevel: pl,
      isYou: true,
    };
    const mixed = [...pool, youEntry].sort(
      (a, b) => b.powerLevel - a.powerLevel,
    );
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
            RANKING
          </Text>
          <View className="mt-2 h-[2px] w-20 bg-cyan-400" />
          <Text className="mt-2 text-[10px] uppercase tracking-widest text-slate-500">
            Power Level · classement absolu
          </Text>
        </View>

        {/* Scope toggle */}
        <View className="mx-5 mb-4 flex-row rounded-full border border-blue-500/30 bg-white/[0.03] p-1">
          {(['world', 'friends'] as Scope[]).map(s => {
            const active = scope === s;
            const label = s === 'world' ? 'Mondial' : 'Amis';
            const Icon = s === 'world' ? Swords : Users;
            return (
              <Pressable
                key={s}
                onPress={() => setScope(s)}
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
                  className={`ml-2 text-[11px] font-black uppercase tracking-[3px] ${
                    active ? 'text-cyan-200' : 'text-slate-500'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Leaderboard list */}
        <View className="px-5 gap-2">
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

  // Top-3 neon accent
  const accent =
    entry.rank === 1
      ? '#FBBF24'
      : entry.rank === 2
      ? '#E5E7EB'
      : entry.rank === 3
      ? '#F97316'
      : '#1e293b';

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
      <View className="w-10 items-center">
        {entry.rank === 1 ? (
          <Crown size={16} color="#FBBF24" strokeWidth={2.25} />
        ) : null}
        <Text
          className="text-lg font-black"
          style={{
            color: top3 ? accent : '#64748B',
            textShadowColor: top3 ? accent : 'transparent',
            textShadowRadius: top3 ? 8 : 0,
          }}
        >
          {entry.rank}
        </Text>
      </View>

      {/* Name + class */}
      <View className="ml-2 flex-1">
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
        <Text
          className="mt-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: classColor }}
        >
          {cls?.name ?? 'Novice'}
        </Text>
      </View>

      {/* Power Level */}
      <View className="items-end">
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
