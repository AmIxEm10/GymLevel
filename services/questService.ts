/**
 * questService.ts
 * ---------------
 * Daily quest generation driven by data/questLibrary.ts.
 * - generateDailyQuests(stats, now) picks a diversified set of templates,
 *   scales each template's target using the player's level, computes a
 *   quest rank from the difficulty offset, and builds Quest instances.
 * - checkQuestProgress(...) is the canonical listener invoked by the store
 *   whenever a Set is logged or a Session ends. It also handles the
 *   max_weight aggregation (MAX instead of SUM).
 *
 * Quests are stateless templates; runtime instances live in the store.
 */

import type {
  EquipmentItem,
  EquipmentRarity,
  LootReward,
  Quest,
  QuestCategory,
  QuestDifficulty,
  QuestFilter,
  QuestType,
} from '@/types';
import {
  DAILY_QUEST_COUNT,
  QUEST_REFRESH_HOUR,
  QUEST_XP_REWARDS,
} from '@/constants/gamification';
import {
  ITEM_TEMPLATES_BY_ID,
  mintItem,
  pickRandomTemplate,
} from '@/data/equipment';
import { clampRarityToLevel } from '@/services/lootService';
import {
  QUEST_LIBRARY,
  QUEST_LIBRARY_BY_CATEGORY,
  type QuestLibraryEntry,
} from '@/data/questLibrary';
import { computeRank, shiftRank, type Rank } from '@/data/ranks';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Minimal snapshot the service needs to scale / seed quests. The store
 * provides this from UserProfile so we don't introduce a dependency cycle.
 */
export interface QuestGenerationStats {
  level: number;
  currentStreak: number;
  /** Highest lifetime `bestWeight` across all PRs — anchors max_weight quests. */
  peakWeightPr: number;
  /** Highest lifetime `bestVolume` on a single set — anchors some volume quests. */
  peakVolumePr: number;
}

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
// Scaling
// ---------------------------------------------------------------------------

function scaleTarget(
  tpl: QuestLibraryEntry,
  stats: QuestGenerationStats,
): number {
  let scaled = tpl.baseTarget * (1 + stats.level * tpl.levelScaling);

  // PR-aware hybrid scaling — target always sits a notch above the user's
  // current record so the objective remains challenging as they progress.
  //
  // STRENGTH (max_weight)  → anchored on peakWeightPr × 1.05
  // VOLUME  (volume_total) → anchored on peakVolumePr × 1.05
  if (tpl.type === 'max_weight' && stats.peakWeightPr > 0) {
    scaled = Math.max(scaled, stats.peakWeightPr * 1.05);
  }
  if (tpl.type === 'volume_total' && stats.peakVolumePr > 0) {
    scaled = Math.max(scaled, stats.peakVolumePr * 1.05);
  }

  // Round durations to the nearest 30s, reps to integer, kg to nearest 5.
  if (tpl.type === 'workout_duration') {
    return Math.round(scaled / 30) * 30;
  }
  if (tpl.type === 'max_weight' || tpl.type === 'volume_total') {
    return Math.max(1, Math.round(scaled / 5) * 5);
  }
  return Math.max(1, Math.round(scaled));
}

function initialProgress(
  tpl: QuestLibraryEntry,
  stats: QuestGenerationStats,
  target: number,
): number {
  // Multi-day streak quests start at min(current streak, target).
  if (tpl.type === 'streak_day' && target > 1) {
    return Math.min(stats.currentStreak, target);
  }
  return 0;
}

function renderDescription(tpl: QuestLibraryEntry, target: number): string {
  const rendered = tpl.type === 'workout_duration'
    ? String(Math.round(target / 60)) // convert seconds → minutes for the text
    : String(target);
  return tpl.descriptionTemplate.replaceAll('{{target}}', rendered);
}

function renderTitle(tpl: QuestLibraryEntry, target: number): string {
  const rendered = tpl.type === 'workout_duration'
    ? String(Math.round(target / 60))
    : String(target);
  return tpl.title.replaceAll('{{target}}', rendered);
}

// ---------------------------------------------------------------------------
// Difficulty → rank offset (relative to player's rank)
// ---------------------------------------------------------------------------

const DIFFICULTY_RANK_OFFSET: Record<QuestDifficulty, number> = {
  easy: -1,
  medium: 0,
  hard: 1,
  epic: 2,
};

function questRankFromDifficulty(
  playerRank: Rank,
  difficulty: QuestDifficulty,
): Rank {
  return shiftRank(playerRank, DIFFICULTY_RANK_OFFSET[difficulty]);
}

// ---------------------------------------------------------------------------
// Loot table (per difficulty) — unchanged semantics from the previous engine
// ---------------------------------------------------------------------------

const DEFAULT_LOOT_BY_DIFFICULTY: Record<
  QuestDifficulty,
  LootReward | undefined
> = {
  easy: undefined,
  medium: { kind: 'random', rarity: 'common' },
  hard: { kind: 'random', rarity: 'rare' },
  epic: { kind: 'random', rarity: 'epic' },
};

// ---------------------------------------------------------------------------
// Template drawing — diversified across categories
// ---------------------------------------------------------------------------

function rand<T>(arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick `count` templates trying to cover all 3 categories and varying
 * difficulty. At least one entry per category before duplicating.
 */
function drawTemplates(count: number): QuestLibraryEntry[] {
  const categories: QuestCategory[] = ['strength', 'endurance', 'discipline'];
  const picked: QuestLibraryEntry[] = [];
  const used = new Set<string>();

  // 1st pass — one per category
  for (const cat of categories) {
    if (picked.length >= count) break;
    const pool = QUEST_LIBRARY_BY_CATEGORY[cat].filter(q => !used.has(q.id));
    const next = rand(pool);
    if (next) {
      picked.push(next);
      used.add(next.id);
    }
  }

  // 2nd pass — fill remaining slots from any category
  while (picked.length < count) {
    const pool = QUEST_LIBRARY.filter(q => !used.has(q.id));
    const next = rand(pool);
    if (!next) break;
    picked.push(next);
    used.add(next.id);
  }

  return picked;
}

// ---------------------------------------------------------------------------
// Generation entry point
// ---------------------------------------------------------------------------

let QUEST_SEQ = 0;
const newId = (now: number) => `q_${now}_${QUEST_SEQ++}`;

export function generateDailyQuests(
  stats: QuestGenerationStats,
  now: number,
): Quest[] {
  const playerRank = computeRank(stats.level);
  const templates = drawTemplates(DAILY_QUEST_COUNT);
  const expiresAt = nextQuestExpiry(now);

  return templates.map(tpl => {
    const target = scaleTarget(tpl, stats);
    const progress = initialProgress(tpl, stats, target);
    const rank = questRankFromDifficulty(playerRank, tpl.difficulty);

    return {
      id: newId(now),
      title: renderTitle(tpl, target),
      description: renderDescription(tpl, target),
      type: tpl.type,
      filter: tpl.filter,

      target,
      progress,

      xpReward: QUEST_XP_REWARDS[tpl.difficulty],
      lootReward: DEFAULT_LOOT_BY_DIFFICULTY[tpl.difficulty],

      difficulty: tpl.difficulty,
      category: tpl.category,
      rank,
      templateId: tpl.id,

      status: 'active',
      createdAt: now,
      expiresAt,
    };
  });
}

// ---------------------------------------------------------------------------
// Progress updates (the "listener")
// ---------------------------------------------------------------------------

export interface QuestEvent {
  type: QuestType;
  value: number;
  filter?: QuestFilter;
}

/**
 * Apply a single event to the active quests list. Called by the store
 * on every set completion / session end / manual admin action.
 *
 * Aggregation rules:
 *  - `max_weight`  → progress = max(current, event.value)
 *  - everything else → progress = current + event.value (saturated by target)
 */
export function checkQuestProgress(
  quests: Quest[],
  event: QuestEvent,
  now: number,
): Quest[] {
  return quests.map(q => {
    if (q.status !== 'active') return q;
    if (q.type !== event.type) return q;
    if (!matchesFilter(q.filter, event.filter)) return q;

    let nextProgress: number;
    if (q.type === 'max_weight') {
      nextProgress = Math.min(q.target, Math.max(q.progress, event.value));
    } else {
      nextProgress = Math.min(q.target, q.progress + event.value);
    }

    const justCompleted = nextProgress >= q.target && q.progress < q.target;
    return {
      ...q,
      progress: nextProgress,
      status: nextProgress >= q.target ? 'completed' : q.status,
      completedAt: justCompleted ? now : q.completedAt,
    };
  });
}

/** Back-compat alias kept for call-sites that haven't migrated. */
export const applyQuestEvent = checkQuestProgress;

function matchesFilter(
  questFilter: QuestFilter | undefined,
  eventFilter: QuestFilter | undefined,
): boolean {
  if (!questFilter) return true;
  if (
    questFilter.category &&
    questFilter.category !== eventFilter?.category
  ) {
    return false;
  }
  if (
    questFilter.muscleId &&
    questFilter.muscleId !== eventFilter?.muscleId
  ) {
    return false;
  }
  if (
    questFilter.bodyPart &&
    questFilter.bodyPart !== eventFilter?.bodyPart
  ) {
    return false;
  }
  if (questFilter.exerciseIds?.length) {
    if (
      !eventFilter?.exerciseIds?.some(id =>
        questFilter.exerciseIds!.includes(id),
      )
    ) {
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

// ---------------------------------------------------------------------------
// Loot resolution (unchanged)
// ---------------------------------------------------------------------------

export function rollLootFromQuest(
  quest: Quest,
  now: number,
  /** Player level used to cap the rarity (no epic below L20, etc.). */
  playerLevel: number,
): EquipmentItem | null {
  const reward = quest.lootReward;
  if (!reward) return null;

  if (reward.kind === 'specific') {
    const tpl = ITEM_TEMPLATES_BY_ID[reward.templateId];
    if (!tpl) return null;
    // Specific rewards bypass the rarity cap intentionally — they're tied
    // to a hand-picked template and the quest itself was gated upstream.
    return mintItem(tpl, now, quest.id);
  }

  const cappedRarity = clampRarityToLevel(reward.rarity, playerLevel);
  if (!cappedRarity) return null;

  const tpl = pickRandomTemplate(cappedRarity, reward.slot);
  if (!tpl) return null;
  return mintItem(tpl, now, quest.id);
}

export function rarityWeight(rarity: EquipmentRarity): number {
  switch (rarity) {
    case 'common':    return 1;
    case 'rare':      return 2;
    case 'epic':      return 3;
    case 'legendary': return 4;
  }
}
