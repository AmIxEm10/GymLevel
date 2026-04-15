import {
  Flame,
  ScrollText,
  Swords,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { selectProfile, useAppStore } from '@/store/useAppStore';

// ---------------------------------------------------------------------------
// Placeholder daily quests
// Real quests will come from useAppStore.activeQuests once the onboarding
// flow is wired up. These are stubs with the Solo Leveling vibe for now.
// ---------------------------------------------------------------------------

type Difficulty = 'easy' | 'medium' | 'hard';

interface QuestStub {
  id: string;
  title: string;
  description: string;
  progressLabel: string;
  progressRatio: number; // 0..1
  xpReward: number;
  difficulty: Difficulty;
  Icon: LucideIcon;
}

const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; accent: string; border: string; chipBg: string; bar: string; text: string }
> = {
  easy: {
    label: 'Facile',
    accent: '#60A5FA',
    border: 'border-blue-500/40',
    chipBg: 'bg-blue-500/15',
    bar: 'bg-blue-400',
    text: 'text-blue-300',
  },
  medium: {
    label: 'Intermédiaire',
    accent: '#A855F7',
    border: 'border-purple-500/50',
    chipBg: 'bg-purple-500/15',
    bar: 'bg-purple-400',
    text: 'text-purple-300',
  },
  hard: {
    label: 'Difficile',
    accent: '#FBBF24',
    border: 'border-amber-400/50',
    chipBg: 'bg-amber-400/15',
    bar: 'bg-amber-300',
    text: 'text-amber-300',
  },
};

const PLACEHOLDER_QUESTS: QuestStub[] = [
  {
    id: 'quest_1',
    title: 'Massacre de l\'ombre',
    description: 'Exécute 100 pompes avant la fin de la journée.',
    progressLabel: '0 / 100 reps',
    progressRatio: 0,
    xpReward: 150,
    difficulty: 'easy',
    Icon: Target,
  },
  {
    id: 'quest_2',
    title: 'Marcheur des ténèbres',
    description: 'Parcours 5 km en course ou marche rapide.',
    progressLabel: '0.0 / 5 km',
    progressRatio: 0,
    xpReward: 300,
    difficulty: 'medium',
    Icon: Flame,
  },
  {
    id: 'quest_3',
    title: 'Défi du Monarque',
    description: 'Soulève un volume total de 5 tonnes sur tes séries.',
    progressLabel: '0 / 5 000 kg',
    progressRatio: 0,
    xpReward: 600,
    difficulty: 'hard',
    Icon: Swords,
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function QuestsScreen() {
  const profile = useAppStore(selectProfile);

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
                Chasseur {profile.username}
              </Text>
              .
            </Text>
          </View>

          <Text className="mt-1 text-xs italic text-slate-500">
            De nouvelles directives ont été transmises par le Système.
          </Text>
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
              3 actives
            </Text>
          </View>

          <View className="mt-4 gap-3">
            {PLACEHOLDER_QUESTS.map(quest => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </View>

          <Text className="mt-6 text-center text-[10px] italic text-slate-600">
            Échéance des quêtes : demain 04:00 — ne les laisse pas expirer.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuestCard({ quest }: { quest: QuestStub }) {
  const meta = DIFFICULTY_META[quest.difficulty];
  const Icon = quest.Icon;
  const percent = Math.round(Math.min(100, Math.max(0, quest.progressRatio)) * 100);

  return (
    <Pressable
      className={`rounded-2xl border ${meta.border} bg-white/5 p-4 active:opacity-80`}
    >
      <View className="flex-row items-start">
        <View
          className={`h-11 w-11 items-center justify-center rounded-xl border ${meta.border} ${meta.chipBg}`}
        >
          <Icon size={22} color={meta.accent} strokeWidth={2} />
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className={`text-[9px] font-bold uppercase tracking-widest ${meta.text}`}
            >
              {meta.label}
            </Text>
            <View className="flex-row items-center">
              <Trophy size={12} color="#FBBF24" strokeWidth={2} />
              <Text className="ml-1 text-[11px] font-bold text-amber-300">
                +{quest.xpReward} XP
              </Text>
            </View>
          </View>

          <Text className="mt-0.5 text-base font-bold text-slate-100">
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
            className={`h-full rounded-full ${meta.bar}`}
            style={{ width: `${percent}%` }}
          />
        </View>
        <View className="mt-1 flex-row justify-between">
          <Text className="text-[10px] text-slate-500">{quest.progressLabel}</Text>
          <Text className={`text-[10px] font-semibold ${meta.text}`}>
            {percent}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
