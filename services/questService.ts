/**
 * questService.ts
 * ---------------
 * Generates daily quests and updates their progress as the user trains.
 * Quests are stateless templates; the instance lives in the store.
 */

import type {
  EquipmentItem,
  EquipmentRarity,
  ExerciseCategory,
  LootReward,
  MuscleGroupId,
  Quest,
  QuestDifficulty,
  QuestFilter,
  QuestType,
} from '@/types';
import {
  DAILY_QUEST_COUNT,
  QUEST_REFRESH_HOUR,
  QUEST_XP_REWARDS,
} from '@/constants/gamification';
import { ALL_MUSCLE_IDS } from '@/data/muscleGroups';
import {
  ITEM_TEMPLATES_BY_ID,
  mintItem,
  pickRandomTemplate,
} from '@/data/equipment';

// ---------------------------------------------------------------------------
// Pool definition
// ---------------------------------------------------------------------------

interface QuestTemplate {
  id: string;
  type: QuestType;
  difficulty: QuestDifficulty;
  title: (f?: QuestFilter) => string;
  description: (target: number, f?: QuestFilter) => string;
  buildTarget: () => number;
  buildFilter?: () => QuestFilter;
}

const CATEGORIES: ExerciseCategory[] = ['push', 'pull', 'legs', 'core'];

const rand = <T>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)]!;

const QUEST_POOL: QuestTemplate[] = [
  {
    id: 'volume_light',
    type: 'volume_total',
    difficulty: 'easy',
    title: () => 'Petit marathon',
    description: t => `Soulève un total de ${t / 1000} tonnes aujourd'hui.`,
    buildTarget: () => 2000,
  },
  {
    id: 'volume_medium',
    type: 'volume_total',
    difficulty: 'medium',
    title: () => 'Volume sérieux',
    description: t => `Soulève un total de ${t / 1000} tonnes aujourd'hui.`,
    buildTarget: () => 5000,
  },
  {
    id: 'volume_heavy',
    type: 'volume_total',
    difficulty: 'hard',
    title: () => 'Le mastodonte',
    description: t => `Soulève un total de ${t / 1000} tonnes aujourd'hui.`,
    buildTarget: () => 10000,
  },
  {
    id: 'cat_push',
    type: 'exercises_category',
    difficulty: 'easy',
    title: f => `Spécialiste ${f?.category ?? ''}`,
    description: (t, f) =>
      `Valide ${t} exercices de ${f?.category ?? 'la catégorie ciblée'}.`,
    buildTarget: () => 3,
    buildFilter: () => ({ category: rand(CATEGORIES) }),
  },
  {
    id: 'cat_pull_triple',
    type: 'exercises_category',
    difficulty: 'medium',
    title: () => 'Dos d\'acier',
    description: t => `Valide ${t} exercices de tirage (pull).`,
    buildTarget: () => 4,
    buildFilter: () => ({ category: 'pull' }),
  },
  {
    id: 'muscle_xp_focus',
    type: 'muscle_xp',
    difficulty: 'medium',
    title: f => `Focus ${f?.muscleId ?? ''}`,
    description: (t, f) =>
      `Gagne ${t} XP sur ${f?.muscleId?.replace(/_/g, ' ') ?? 'un muscle'}.`,
    buildTarget: () => 500,
    buildFilter: () => ({
      muscleId: rand(ALL_MUSCLE_IDS) as MuscleGroupId,
    }),
  },
  {
    id: 'duration_45',
    type: 'workout_duration',
    difficulty: 'easy',
    title: () => 'Séance engagée',
    description: t => `Entraîne-toi au moins ${Math.round(t / 60)} minutes.`,
    buildTarget: () => 45 * 60,
  },
  {
    id: 'set_count_20',
    type: 'set_count',
    difficulty: 'easy',
    title: () => 'Compteur de séries',
    description: t => `Complète ${t} séries (hors échauffement).`,
    buildTarget: () => 20,
  },
  {
    id: 'streak_keep',
    type: 'streak_day',
    difficulty: 'easy',
    title: () => 'Ne brise pas la chaîne',
    description: () => `Termine au moins une séance aujourd'hui.`,
    buildTarget: () => 1,
  },
  {
    id: 'epic_5_tons',
    type: 'volume_total',
    difficulty: 'epic',
    title: () => 'Titan',
    description: t => `Soulève ${t / 1000} tonnes dans la journée.`,
    buildTarget: () => 20000,
  },
];

// ---------------------------------------------------------------------------
// Expiry calculation (end of day at QUEST_REFRESH_HOUR local time)
// ---------------------------------------------------------------------------

export function nextQuestExpiry(now: number): number {
  const d = new Date(now);
  d.setHours(QUEST_REFRESH_HOUR, 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

let QUEST_SEQ = 0;
const newId = (now: number) => `q_${now}_${QUEST_SEQ++}`;

/** Draw `count` distinct templates balanced across difficulties. */
function drawQuestTemplates(count: number): QuestTemplate[] {
  const pool = [...QUEST_POOL];
  const out: QuestTemplate[] = [];
  // Try to spread difficulty
  const tiers: QuestDifficulty[] = ['easy', 'medium', 'hard'];
  for (const tier of tiers) {
    if (out.length >= count) break;
    const candidates = pool.filter(p => p.difficulty === tier);
    if (candidates.length === 0) continue;
    const picked = candidates[Math.floor(Math.random() * candidates.length)]!;
    out.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  while (out.length < count && pool.length > 0) {
    const picked = pool[Math.floor(Math.random() * pool.length)]!;
    out.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  return out;
}

/**
 * Default loot reward attached to a freshly generated daily quest, indexed
 * by difficulty. Can be overridden for specific hand-crafted quests later.
 */
const DEFAULT_LOOT_BY_DIFFICULTY: Record<QuestDifficulty, LootReward | undefined> = {
  easy: undefined,
  medium: { kind: 'random', rarity: 'common' },
  hard: { kind: 'random', rarity: 'rare' },
  epic: { kind: 'random', rarity: 'epic' },
};

export function generateDailyQuests(now: number): Quest[] {
  const templates = drawQuestTemplates(DAILY_QUEST_COUNT);
  const expiresAt = nextQuestExpiry(now);

  return templates.map(tpl => {
    const filter = tpl.buildFilter?.();
    const target = tpl.buildTarget();
    return {
      id: newId(now),
      title: tpl.title(filter),
      description: tpl.description(target, filter),
      type: tpl.type,
      filter,
      target,
      progress: 0,
      xpReward: QUEST_XP_REWARDS[tpl.difficulty],
      lootReward: DEFAULT_LOOT_BY_DIFFICULTY[tpl.difficulty],
      difficulty: tpl.difficulty,
      status: 'active',
      createdAt: now,
      expiresAt,
    };
  });
}

// ---------------------------------------------------------------------------
// Loot resolution (on claim)
// ---------------------------------------------------------------------------

/**
 * Resolve a quest's lootReward into a real EquipmentItem instance.
 * Returns null when the quest has no reward, or when a random roll
 * couldn't find a matching template (empty pool).
 */
export function rollLootFromQuest(quest: Quest, now: number): EquipmentItem | null {
  const reward = quest.lootReward;
  if (!reward) return null;

  if (reward.kind === 'specific') {
    const tpl = ITEM_TEMPLATES_BY_ID[reward.templateId];
    if (!tpl) return null;
    return mintItem(tpl, now, quest.id);
  }

  // random roll
  const tpl = pickRandomTemplate(reward.rarity, reward.slot);
  if (!tpl) return null;
  return mintItem(tpl, now, quest.id);
}

/** Convenience for UI flavor / notifications. */
export function rarityWeight(rarity: EquipmentRarity): number {
  switch (rarity) {
    case 'common':    return 1;
    case 'rare':      return 2;
    case 'epic':      return 3;
    case 'legendary': return 4;
  }
}

// ---------------------------------------------------------------------------
// Progress update
// ---------------------------------------------------------------------------

/**
 * Feed a single "event" into the quest log and let each quest decide whether
 * it applies. The store calls this after each set / session end.
 *
 * `value` semantics:
 *  - volume_total / muscle_volume: kg delta
 *  - exercises_category / exercise_specific: exercises count delta (usually 1)
 *  - muscle_xp: XP delta
 *  - workout_duration: seconds delta
 *  - streak_day: 1 when a workout is completed today
 *  - set_count: number of working sets added
 */
export function applyQuestEvent(
  quests: Quest[],
  event: { type: QuestType; value: number; filter?: QuestFilter },
  now: number,
): Quest[] {
  return quests.map(q => {
    if (q.status !== 'active') return q;
    if (q.type !== event.type) return q;
    if (!matchesFilter(q.filter, event.filter)) return q;

    const progress = Math.min(q.target, q.progress + event.value);
    const justCompleted = progress >= q.target && q.progress < q.target;
    return {
      ...q,
      progress,
      status: progress >= q.target ? 'completed' : q.status,
      completedAt: justCompleted ? now : q.completedAt,
    };
  });
}

function matchesFilter(
  questFilter: QuestFilter | undefined,
  eventFilter: QuestFilter | undefined,
): boolean {
  if (!questFilter) return true;
  if (questFilter.category && questFilter.category !== eventFilter?.category) return false;
  if (questFilter.muscleId && questFilter.muscleId !== eventFilter?.muscleId) return false;
  if (questFilter.bodyPart && questFilter.bodyPart !== eventFilter?.bodyPart) return false;
  if (questFilter.exerciseIds?.length) {
    if (!eventFilter?.exerciseIds?.some(id => questFilter.exerciseIds!.includes(id))) {
      return false;
    }
  }
  return true;
}

/** Auto-expire quests whose deadline has passed. */
export function expireQuests(quests: Quest[], now: number): Quest[] {
  return quests.map(q =>
    q.status === 'active' && now >= q.expiresAt
      ? { ...q, status: 'expired' as const }
      : q,
  );
}
