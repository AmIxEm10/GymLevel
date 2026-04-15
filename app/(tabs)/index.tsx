import { router } from 'expo-router';
import {
  Clock,
  Dumbbell,
  HeartPulse,
  ScrollText,
  Swords,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function QuestsScreen() {
  const profile = useAppStore(selectProfile);
  const activeQuests = useAppStore(selectActiveQuests);
  const displayName = profile.nickname?.trim() ? profile.nickname : 'Chasseur';

  const activeCount = activeQuests.filter(q => q.status === 'active').length;
  const completedCount = activeQuests.filter(q => q.status === 'completed').length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#0B0F19]">
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

        {/* =========================================== DAILY QUESTS */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuestCard({ quest }: { quest: Quest }) {
  const cat = CATEGORY_META[quest.category];
  const Icon = cat.Icon;
  const rankMeta = RANK_META[quest.rank];
  const percent = Math.round(
    Math.min(100, (quest.progress / Math.max(1, quest.target)) * 100),
  );
  const isCompleted = quest.status === 'completed';

  return (
    <Pressable
      className={`rounded-2xl border ${cat.border} ${cat.bg} p-4 active:opacity-80`}
      style={{
        shadowColor: cat.color,
        shadowOpacity: isCompleted ? 0.8 : 0.35,
        shadowRadius: isCompleted ? 14 : 8,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View className="flex-row items-start">
        <View
          className={`h-11 w-11 items-center justify-center rounded-xl border ${cat.border} bg-white/5`}
        >
          <Icon size={22} color={cat.color} strokeWidth={2} />
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row flex-wrap items-center justify-between">
            <View className="flex-row items-center">
              {/* Rank chip */}
              <View
                className="rounded-md px-1.5 py-0.5"
                style={{
                  borderWidth: 1,
                  borderColor: rankMeta.color,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  shadowColor: rankMeta.glow,
                  shadowOpacity: 0.6,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
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
                  QUÊTE DE RANG {quest.rank}
                </Text>
              </View>

              {/* Category chip */}
              <View
                className={`ml-1.5 rounded-md border px-1.5 py-0.5 ${cat.border}`}
                style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              >
                <Text
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: cat.color }}
                >
                  {cat.label}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Trophy size={12} color="#FBBF24" strokeWidth={2} />
              <Text className="ml-1 text-[11px] font-bold text-amber-300">
                +{quest.xpReward} XP
              </Text>
            </View>
          </View>

          <Text className="mt-1 text-base font-bold text-slate-100">
            {quest.title}
          </Text>
          <Text className="mt-0.5 text-xs leading-snug text-slate-400">
            {quest.description}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <View
            className="h-full rounded-full"
            style={{
              width: `${percent}%`,
              backgroundColor: isCompleted ? '#FBBF24' : cat.color,
            }}
          />
        </View>
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-[10px] text-slate-500">
            {formatProgress(quest)}
          </Text>
          <View className="flex-row items-center">
            <Text
              className="text-[10px] font-semibold"
              style={{ color: isCompleted ? '#FBBF24' : cat.color }}
            >
              {isCompleted ? 'PRÊT À RÉCLAMER' : `${percent}%`}
            </Text>
            {!isCompleted ? (
              <Text className="ml-2 text-[9px] uppercase tracking-widest text-slate-600">
                {DIFFICULTY_LABEL[quest.difficulty]}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
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
