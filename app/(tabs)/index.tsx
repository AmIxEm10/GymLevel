import { router } from 'expo-router';
import {
  Check,
  Clock,
  Dumbbell,
  HeartPulse,
  ScrollText,
  Swords,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AriseExtraction } from '@/components/AriseExtraction';
import { GradientBar } from '@/components/GradientBar';
import { WorldBossBar } from '@/components/WorldBossBar';
import { CHALLENGES, challengeProgress } from '@/data/challenges';
import { RANK_META } from '@/data/ranks';
import {
  selectActiveQuests,
  selectProfile,
  useAppStore,
} from '@/store/useAppStore';
import type { Quest, QuestCategory, QuestDifficulty } from '@/types';

// ---------------------------------------------------------------------------
// Display maps
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<
  QuestCategory,
  { label: string; Icon: LucideIcon; color: string; bg: string; border: string }
> = {
  strength: {
    label: 'Force',
    Icon: Dumbbell,
    color: '#F97316',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/50',
  },
  endurance: {
    label: 'Endurance',
    Icon: HeartPulse,
    color: '#EF4444',
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
  },
  discipline: {
    label: 'Discipline',
    Icon: Clock,
    color: '#60A5FA',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
  },
};

const DIFFICULTY_LABEL: Record<QuestDifficulty, string> = {
  easy: 'Facile',
  medium: 'Normal',
  hard: 'Difficile',
  epic: 'Épique',
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

type QuestTab = 'daily' | 'challenges' | 'secret';

export default function QuestsScreen() {
  const profile = useAppStore(selectProfile);
  const activeQuests = useAppStore(selectActiveQuests);
  const claimChallenge = useAppStore(s => s.claimChallenge);
  const displayName = profile.nickname?.trim() ? profile.nickname : 'Chasseur';

  const [tab, setTab] = useState<QuestTab>('daily');

  const activeCount = activeQuests.filter(q => q.status === 'active').length;
  const completedCount = activeQuests.filter(q => q.status === 'completed').length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#020617]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================== HEADER */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-[10px] font-semibold tracking-[6px] text-blue-400/70">
            LE SYSTÈME
          </Text>

          <Text
            className="mt-1 text-4xl font-black tracking-[3px] text-blue-300"
            style={{
              textShadowColor: '#60A5FA',
              textShadowRadius: 18,
              textShadowOffset: { width: 0, height: 0 },
            }}
          >
            TABLEAU DES QUÊTES
          </Text>

          <View className="mt-3 h-[2px] w-24 bg-blue-400" />
          <View className="mt-[2px] h-[1px] w-16 bg-cyan-400/60" />

          <View className="mt-5 flex-row items-center">
            <ScrollText size={16} color="#60A5FA" strokeWidth={1.75} />
            <Text className="ml-2 text-sm text-slate-300">
              Bienvenue,{' '}
              <Text className="font-bold text-blue-300">
                Chasseur {displayName}
              </Text>
              .
            </Text>
          </View>

          <Text className="mt-1 text-xs italic text-slate-500">
            Directives quotidiennes calibrées sur ton rang et ton niveau.
          </Text>

          {/* Battle Pass — Season 1: L'Éveil */}
          <SeasonPassBar profile={profile} />

          {/* World Boss — shared HP gauge nudged by every kg lifted */}
          <WorldBossBar />

          {/* Shadow extraction — "Je m'élève." */}
          <AriseExtraction />

          {/* Start workout CTA — routes to the template picker */}
          <Pressable
            onPress={() => router.push('/workout/selection')}
            className="mt-5 flex-row items-center justify-center rounded-2xl border-2 border-emerald-400/70 bg-emerald-500/15 py-4 active:opacity-70"
            style={{
              shadowColor: '#10B981',
              shadowOpacity: 0.55,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Swords size={18} color="#6EE7B7" strokeWidth={2.5} />
            <Text
              className="ml-2 text-sm font-black uppercase tracking-[5px] text-emerald-200"
              style={{
                textShadowColor: '#10B981',
                textShadowRadius: 10,
                textShadowOffset: { width: 0, height: 0 },
              }}
            >
              Démarrer une séance
            </Text>
          </Pressable>
        </View>

        {/* =========================================== TAB PICKER */}
        <View className="mx-5 mb-4 flex-row rounded-full border border-blue-500/30 bg-white/[0.03] p-1" style={{ gap: 6 }}>
          {([
            { id: 'daily',      label: 'Quotidien' },
            { id: 'challenges', label: 'Défis' },
            { id: 'secret',     label: 'Secrets' },
          ] as const).map(t => {
            const active = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                className="flex-1 items-center justify-center rounded-full py-2 active:opacity-70"
                style={{
                  backgroundColor: active ? 'rgba(168,85,247,0.25)' : 'transparent',
                  borderWidth: active ? 1 : 0,
                  borderColor: '#A855F7',
                  shadowColor: active ? '#A855F7' : 'transparent',
                  shadowOpacity: active ? 0.7 : 0,
                  shadowRadius: active ? 10 : 0,
                  shadowOffset: { width: 0, height: 0 },
                }}
              >
                <Text
                  className={`text-center text-[11px] font-black uppercase tracking-[2px] ${
                    active ? 'text-purple-200' : 'text-slate-500'
                  }`}
                  numberOfLines={1}
                  style={
                    active
                      ? { textShadowColor: '#A855F7', textShadowRadius: 8 }
                      : undefined
                  }
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* =========================================== CHALLENGES (Rank A/S) */}
        {tab === 'challenges' ? (
        <View className="px-5 pb-6">
          <View className="flex-row items-end justify-between">
            <View>
              <Text
                className="text-lg font-bold tracking-[2px] text-slate-100"
                style={{ textShadowColor: '#A855F7', textShadowRadius: 8 }}
              >
                DÉFIS
              </Text>
              <View className="mt-1 h-[1px] w-16 bg-purple-500/70" />
            </View>
            <Text className="text-[10px] uppercase tracking-widest text-slate-500">
              {profile.completedChallenges.length} / {CHALLENGES.length} complétés
            </Text>
          </View>

          <View className="mt-3 gap-2">
            {CHALLENGES.map(ch => {
              const prog = challengeProgress(ch, profile);
              const pct = Math.min(
                100,
                Math.round((prog / Math.max(1, ch.target)) * 100),
              );
              const done = profile.completedChallenges.includes(ch.id);
              const rankMeta = RANK_META[ch.rank];
              return (
                <View
                  key={ch.id}
                  className="rounded-2xl border bg-white/[0.03] p-3"
                  style={{
                    borderColor: rankMeta.color,
                    shadowColor: rankMeta.glow,
                    shadowOpacity: done ? 0.85 : 0.35,
                    shadowRadius: done ? 18 : 10,
                    shadowOffset: { width: 0, height: 0 },
                  }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center">
                      <View
                        className="rounded-md px-1.5 py-0.5"
                        style={{
                          borderWidth: 1,
                          borderColor: rankMeta.color,
                          backgroundColor: 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <Text
                          className="text-[9px] font-black uppercase tracking-[3px]"
                          style={{
                            color: rankMeta.color,
                            textShadowColor: rankMeta.glow,
                            textShadowRadius: 4,
                          }}
                        >
                          DÉFI · {ch.rank}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-[10px] font-bold text-amber-300">
                      +{ch.xpReward} XP
                    </Text>
                  </View>
                  <Text className="mt-1.5 text-sm font-bold text-slate-100">
                    {ch.name}
                  </Text>
                  <Text className="text-[11px] leading-snug text-slate-400">
                    {ch.description}
                  </Text>

                  <View className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: done ? '#FBBF24' : rankMeta.color,
                      }}
                    />
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-[10px] text-slate-500">
                      {Math.round(prog).toLocaleString()} / {ch.target.toLocaleString()} {ch.unit}
                    </Text>
                    {done ? (
                      <Pressable
                        onPress={() => claimChallenge(ch.id)}
                        className="rounded-md border border-amber-400/60 bg-amber-500/20 px-2 py-0.5 active:opacity-70"
                      >
                        <Text className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                          ACCOMPLI
                        </Text>
                      </Pressable>
                    ) : (
                      <Text
                        className="text-[10px] font-semibold"
                        style={{ color: rankMeta.color }}
                      >
                        {pct}%
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        ) : null}

        {/* =========================================== DAILY QUESTS */}
        {tab === 'daily' ? (
        <View className="px-5 pb-10">
          <View className="flex-row items-end justify-between">
            <View>
              <Text
                className="text-lg font-bold tracking-[2px] text-slate-100"
                style={{ textShadowColor: '#60A5FA', textShadowRadius: 8 }}
              >
                QUÊTES QUOTIDIENNES
              </Text>
              <View className="mt-1 h-[1px] w-16 bg-blue-500/70" />
            </View>
            <Text className="text-[10px] uppercase tracking-widest text-slate-500">
              {activeCount} active{activeCount > 1 ? 's' : ''}
              {completedCount > 0
                ? ` · ${completedCount} prête${completedCount > 1 ? 's' : ''}`
                : ''}
            </Text>
          </View>

          {activeQuests.length === 0 ? (
            <View className="mt-6 items-center rounded-2xl border border-dashed border-slate-700 bg-white/[0.02] p-6">
              <Text className="text-center text-sm text-slate-400">
                Aucune directive active.
              </Text>
              <Text className="mt-1 text-center text-xs italic text-slate-600">
                Le Système régénérera tes quêtes au prochain réveil.
              </Text>
            </View>
          ) : (
            <View className="mt-4 gap-3">
              {activeQuests.map(quest => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </View>
          )}

          <Text className="mt-6 text-center text-[10px] italic text-slate-600">
            Échéance : prochaine rotation du Système à 04:00 locale.
          </Text>
        </View>
        ) : null}

        {/* =========================================== SECRETS */}
        {tab === 'secret' ? (
          <View className="px-5 pb-10">
            <View className="flex-row items-end justify-between">
              <View>
                <Text
                  className="text-lg font-bold tracking-[2px] text-slate-100"
                  style={{ textShadowColor: '#A855F7', textShadowRadius: 8 }}
                >
                  QUÊTES SECRÈTES
                </Text>
                <View className="mt-1 h-[1px] w-16 bg-purple-500/70" />
              </View>
              <Text className="text-[10px] uppercase tracking-widest text-slate-500">
                {profile.completedSecretQuests.length} découvertes
              </Text>
            </View>

            <Text className="mt-3 text-center text-[11px] italic leading-relaxed text-slate-500">
              « Les quêtes secrètes n'apparaissent au Système qu'une fois
              déclenchées. Entraîne-toi, explore des limites, et la Vérité
              se révèlera d'elle-même… »
            </Text>

            {profile.completedSecretQuests.length === 0 ? (
              <View className="mt-6 items-center rounded-2xl border border-dashed border-purple-500/40 bg-purple-500/[0.06] p-6">
                <Text className="text-center text-[10px] uppercase tracking-widest text-purple-300/70">
                  Aucune révélation à ce jour
                </Text>
              </View>
            ) : (
              <View className="mt-4 gap-2">
                {profile.completedSecretQuests.map(id => (
                  <View
                    key={id}
                    className="rounded-xl border border-purple-500/50 bg-purple-500/10 p-3"
                    style={{
                      shadowColor: '#A855F7',
                      shadowOpacity: 0.55,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 0 },
                    }}
                  >
                    <Text className="text-[9px] font-black uppercase tracking-widest text-purple-300">
                      ◆ Secret découvert
                    </Text>
                    <Text className="mt-0.5 text-sm font-bold text-slate-100">
                      {id}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Season Pass bar — "Saison 1 : L'Éveil"
// ---------------------------------------------------------------------------

const SEASON_MAX_LEVEL = 20;
const SEASON_XP_PER_LEVEL = 1000;

interface SeasonReward {
  level: number;
  label: string;
  rarity: 'common' | 'rare' | 'epic';
}
const SEASON_REWARDS: SeasonReward[] = [
  { level: 5,  label: 'Gants · Commun',        rarity: 'common' },
  { level: 10, label: 'Lame de l\'Aube · Rare', rarity: 'rare' },
  { level: 15, label: 'Titre : Éveillé',        rarity: 'epic' },
  { level: 20, label: 'Relique · Épique',       rarity: 'epic' },
];

function SeasonPassBar({
  profile,
}: {
  profile: ReturnType<typeof selectProfile>;
}) {
  // Simple derivation: every 1000 XP of progression = 1 season level.
  const seasonXp = Math.min(
    SEASON_MAX_LEVEL * SEASON_XP_PER_LEVEL,
    profile.totalWorkouts * 250 + profile.completedChallenges.length * 500,
  );
  const seasonLevel = Math.min(
    SEASON_MAX_LEVEL,
    Math.floor(seasonXp / SEASON_XP_PER_LEVEL),
  );
  const seasonRatio =
    seasonXp < SEASON_MAX_LEVEL * SEASON_XP_PER_LEVEL
      ? (seasonXp % SEASON_XP_PER_LEVEL) / SEASON_XP_PER_LEVEL
      : 1;

  return (
    <View
      className="mt-4 rounded-2xl border border-purple-500/40 bg-white/[0.03] p-3"
      style={{
        shadowColor: '#A855F7',
        shadowOpacity: 0.55,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text
            className="text-[9px] font-bold uppercase tracking-[4px] text-purple-300"
            style={{ textShadowColor: '#A855F7', textShadowRadius: 6 }}
          >
            SAISON 1 · L'ÉVEIL
          </Text>
          <Text className="text-base font-black text-slate-100">
            Niveau {seasonLevel}
            <Text className="text-xs font-normal text-slate-500">
              {' '}/ {SEASON_MAX_LEVEL}
            </Text>
          </Text>
        </View>
        <Text className="text-[10px] text-slate-500">
          {seasonXp.toLocaleString()} pts
        </Text>
      </View>

      <View className="mt-2">
        <GradientBar
          percent={seasonRatio * 100}
          height={6}
          startColor="#6366F1"
          endColor="#A855F7"
        />
      </View>

      <View className="mt-3 flex-row gap-1.5">
        {SEASON_REWARDS.map(r => {
          const unlocked = seasonLevel >= r.level;
          return (
            <View
              key={r.level}
              className="flex-1 rounded-lg border px-2 py-1.5"
              style={{
                borderColor: unlocked ? '#A855F7' : '#334155',
                backgroundColor: unlocked
                  ? 'rgba(168,85,247,0.10)'
                  : 'rgba(255,255,255,0.02)',
                opacity: unlocked ? 1 : 0.55,
              }}
            >
              <Text
                className="text-[9px] font-black uppercase tracking-widest"
                style={{
                  color: unlocked ? '#C084FC' : '#64748B',
                }}
              >
                Nv. {r.level}
              </Text>
              <Text
                className="mt-0.5 text-[10px]"
                numberOfLines={1}
                style={{ color: unlocked ? '#E2E8F0' : '#64748B' }}
              >
                {r.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const claimQuestReward = useAppStore(s => s.claimQuestReward);
  const cat = CATEGORY_META[quest.category];
  const Icon = cat.Icon;
  const rankMeta = RANK_META[quest.rank];
  const percent = Math.round(
    Math.min(100, (quest.progress / Math.max(1, quest.target)) * 100),
  );
  const isCompleted = quest.status === 'completed';

  // Pulsing glow on completed cards
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isCompleted) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isCompleted, pulse]);

  return (
    <Pressable
      className="overflow-hidden rounded-2xl border border-[#1e293b] bg-slate-950/60 p-4 active:opacity-80"
      style={{
        shadowColor: cat.color,
        shadowOpacity: isCompleted ? 0.6 : 0.18,
        shadowRadius: isCompleted ? 16 : 10,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      {/* Top row : circular icon + content + XP */}
      <View className="flex-row items-center">
        {/* Circular icon with soft colored glow */}
        <View
          className="h-14 w-14 items-center justify-center rounded-full"
          style={{
            borderWidth: 1.5,
            borderColor: cat.color,
            backgroundColor: 'rgba(255,255,255,0.04)',
            shadowColor: cat.color,
            shadowOpacity: 0.7,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Icon size={24} color={cat.color} strokeWidth={2} />
        </View>

        {/* Content (title left-aligned) */}
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text
              className="text-[9px] font-black uppercase tracking-[3px]"
              style={{
                color: rankMeta.color,
                textShadowColor: rankMeta.glow,
                textShadowRadius: 5,
              }}
            >
              RANG {quest.rank}
            </Text>
            <Text className="mx-1.5 text-[9px] text-slate-700">·</Text>
            <Text
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: cat.color }}
            >
              {cat.label}
            </Text>
          </View>

          <Text className="mt-0.5 text-base font-black text-slate-100">
            {quest.title}
          </Text>
          <Text
            numberOfLines={1}
            className="mt-0.5 text-[11px] leading-snug text-slate-500"
          >
            {quest.description}
          </Text>
        </View>

        {/* XP reward */}
        <View className="ml-3 items-end">
          <View className="flex-row items-center">
            <Trophy size={10} color="#FBBF24" strokeWidth={2} />
            <Text className="ml-0.5 text-[10px] font-black text-amber-300">
              +{quest.xpReward}
            </Text>
          </View>
          <Text className="mt-0.5 text-[8px] uppercase tracking-widest text-slate-600">
            {DIFFICULTY_LABEL[quest.difficulty]}
          </Text>
        </View>
      </View>

      {/* Full-width progress strip at the bottom */}
      <View className="mt-4">
        <View className="mb-1.5 flex-row items-center justify-between">
          <Text className="text-[10px] font-bold tracking-widest text-slate-500">
            {formatProgress(quest)}
          </Text>
          <Text
            className="text-[10px] font-black tracking-wider"
            style={{
              color: isCompleted ? '#FBBF24' : '#67E8F9',
              textShadowColor: isCompleted ? '#FBBF24' : '#22D3EE',
              textShadowRadius: 6,
            }}
          >
            {isCompleted ? 'PRÊT À RÉCLAMER' : `${percent}%`}
          </Text>
        </View>
        <GradientBar
          percent={percent}
          height={6}
          startColor={isCompleted ? '#D97706' : '#1e40af'}
          endColor={isCompleted ? '#FBBF24' : '#22d3ee'}
        />
      </View>

      {/* Claim CTA — only when the quest is completed */}
      {isCompleted ? (
        <Animated.View
          style={{
            marginTop: 12,
            shadowColor: '#FBBF24',
            shadowOpacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.6, 1],
            }) as unknown as number,
            shadowRadius: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 24],
            }) as unknown as number,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <Pressable
            onPress={() => claimQuestReward(quest.id)}
            className="flex-row items-center justify-center rounded-xl border-2 border-amber-400 bg-amber-500/20 py-3 active:opacity-70"
          >
            <Check size={16} color="#FDE68A" strokeWidth={3} />
            <Text
              className="ml-2 text-xs font-black uppercase tracking-[4px] text-amber-200"
              style={{ textShadowColor: '#FBBF24', textShadowRadius: 10 }}
            >
              Réclamer · +{quest.xpReward} XP
            </Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

/** Format the progress line depending on quest type. */
function formatProgress(q: Quest): string {
  switch (q.type) {
    case 'volume_total':
    case 'muscle_volume': {
      const unit = 'kg';
      const p = q.progress >= 1000 ? (q.progress / 1000).toFixed(1) + 't' : Math.round(q.progress) + ` ${unit}`;
      const t = q.target >= 1000 ? (q.target / 1000).toFixed(1) + 't' : q.target + ` ${unit}`;
      return `${p} / ${t}`;
    }
    case 'total_reps':
      return `${Math.round(q.progress)} / ${q.target} reps`;
    case 'max_weight':
      return `${Math.round(q.progress)} / ${q.target} kg`;
    case 'workout_duration':
      return `${Math.round(q.progress / 60)} / ${Math.round(q.target / 60)} min`;
    case 'set_count':
      return `${Math.round(q.progress)} / ${q.target} séries`;
    case 'streak_day':
      return q.target === 1
        ? `${q.progress} / 1 séance`
        : `${q.progress} / ${q.target} jours`;
    case 'early_workout':
      return `${q.progress} / ${q.target} séance`;
    default:
      return `${Math.round(q.progress)} / ${q.target}`;
  }
}
