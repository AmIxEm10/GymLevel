import type {
  QuestCategory,
  QuestDifficulty,
  QuestFilter,
  QuestType,
} from '@/types';

/**
 * QuestLibraryEntry
 * -----------------
 * Static template for daily quest generation. Quests are built by
 * questService.generateDailyQuests(), which:
 *   1. Picks N templates with diversity across STRENGTH/ENDURANCE/DISCIPLINE
 *   2. Scales the target with the player level:
 *        target = round(baseTarget × (1 + level × levelScaling))
 *   3. Derives quest rank from (playerRank + difficulty offset) and awards
 *      XP + loot based on the difficulty bucket.
 */
export interface QuestLibraryEntry {
  id: string;
  category: QuestCategory;
  type: QuestType;
  title: string;
  /** Template for the description — `{{target}}` is substituted in service. */
  descriptionTemplate: string;
  baseTarget: number;
  /**
   * Linear level scaling factor.
   *   levelScaling = 0   → flat target (same at lvl 1 and lvl 99)
   *   levelScaling = 0.1 → +10% of base per level
   */
  levelScaling: number;
  difficulty: QuestDifficulty;
  filter?: QuestFilter;
  /** Optional custom unit rendered in the card label (default inferred). */
  unit?: string;
}

// ===========================================================================
// STRENGTH — Volume total, max poids, volume par catégorie
// ===========================================================================

const STRENGTH: QuestLibraryEntry[] = [
  {
    id: 'str_volume_easy',
    category: 'strength',
    type: 'volume_total',
    title: 'Marathon de fer',
    descriptionTemplate: 'Soulève {{target}} kg au total aujourd\'hui.',
    baseTarget: 1500,
    levelScaling: 0.15,
    difficulty: 'easy',
    unit: 'kg',
  },
  {
    id: 'str_volume_medium',
    category: 'strength',
    type: 'volume_total',
    title: 'Forgeron du Système',
    descriptionTemplate: 'Accumule {{target}} kg de volume.',
    baseTarget: 4000,
    levelScaling: 0.15,
    difficulty: 'medium',
    unit: 'kg',
  },
  {
    id: 'str_volume_hard',
    category: 'strength',
    type: 'volume_total',
    title: 'Titan de fer',
    descriptionTemplate: 'Ploie le fer : {{target}} kg de volume.',
    baseTarget: 8000,
    levelScaling: 0.2,
    difficulty: 'hard',
    unit: 'kg',
  },
  {
    id: 'str_push_volume',
    category: 'strength',
    type: 'volume_total',
    title: 'Récolte des poussées',
    descriptionTemplate: '{{target}} kg sur la catégorie push.',
    baseTarget: 800,
    levelScaling: 0.15,
    difficulty: 'medium',
    filter: { category: 'push' },
    unit: 'kg',
  },
  {
    id: 'str_pull_volume',
    category: 'strength',
    type: 'volume_total',
    title: 'Griffes du dos',
    descriptionTemplate: '{{target}} kg sur la catégorie pull.',
    baseTarget: 800,
    levelScaling: 0.15,
    difficulty: 'medium',
    filter: { category: 'pull' },
    unit: 'kg',
  },
  {
    id: 'str_legs_volume',
    category: 'strength',
    type: 'volume_total',
    title: 'Marche du Monarque',
    descriptionTemplate: '{{target}} kg sur la catégorie jambes.',
    baseTarget: 1500,
    levelScaling: 0.18,
    difficulty: 'hard',
    filter: { category: 'legs' },
    unit: 'kg',
  },
  {
    id: 'str_max_weight_push',
    category: 'strength',
    type: 'max_weight',
    title: 'Plus lourd que l\'ombre',
    descriptionTemplate: 'Place une série à {{target}} kg minimum sur un exercice de poussée.',
    baseTarget: 30,
    levelScaling: 0.1,
    difficulty: 'hard',
    filter: { category: 'push' },
    unit: 'kg',
  },
  {
    id: 'str_max_weight_legs',
    category: 'strength',
    type: 'max_weight',
    title: 'Squat du démon',
    descriptionTemplate: 'Pose une charge de {{target}} kg minimum sur un exercice jambes.',
    baseTarget: 50,
    levelScaling: 0.12,
    difficulty: 'hard',
    filter: { category: 'legs' },
    unit: 'kg',
  },
];

// ===========================================================================
// ENDURANCE — Reps cumulées, HIIT, nombre de séries
// ===========================================================================

const ENDURANCE: QuestLibraryEntry[] = [
  {
    id: 'end_reps_light',
    category: 'endurance',
    type: 'total_reps',
    title: 'Volée de flèches',
    descriptionTemplate: 'Enchaîne {{target}} répétitions au total.',
    baseTarget: 40,
    levelScaling: 0.12,
    difficulty: 'easy',
    unit: 'reps',
  },
  {
    id: 'end_reps_medium',
    category: 'endurance',
    type: 'total_reps',
    title: 'Pluie de coups',
    descriptionTemplate: '{{target}} répétitions — que le souffle ne faillisse.',
    baseTarget: 120,
    levelScaling: 0.12,
    difficulty: 'medium',
    unit: 'reps',
  },
  {
    id: 'end_reps_storm',
    category: 'endurance',
    type: 'total_reps',
    title: 'Tempête éternelle',
    descriptionTemplate: 'Franchis les {{target}} répétitions cumulées.',
    baseTarget: 260,
    levelScaling: 0.14,
    difficulty: 'hard',
    unit: 'reps',
  },
  {
    id: 'end_hiit_volume',
    category: 'endurance',
    type: 'total_reps',
    title: 'Marathonien',
    descriptionTemplate: '{{target}} reps en HIIT — cardio au sommet.',
    baseTarget: 80,
    levelScaling: 0.1,
    difficulty: 'medium',
    filter: { category: 'hiit' },
    unit: 'reps',
  },
  {
    id: 'end_set_count',
    category: 'endurance',
    type: 'set_count',
    title: 'Compteur de séries',
    descriptionTemplate: 'Boucle {{target}} séries de travail.',
    baseTarget: 10,
    levelScaling: 0.12,
    difficulty: 'easy',
    unit: 'séries',
  },
  {
    id: 'end_core_sets',
    category: 'endurance',
    type: 'set_count',
    title: 'Fou du core',
    descriptionTemplate: '{{target}} séries focalisées sur le core.',
    baseTarget: 5,
    levelScaling: 0.1,
    difficulty: 'medium',
    filter: { category: 'core' },
    unit: 'séries',
  },
];

// ===========================================================================
// DISCIPLINE — Régularité, durée, chrono
// ===========================================================================

const DISCIPLINE: QuestLibraryEntry[] = [
  {
    id: 'dis_streak_today',
    category: 'discipline',
    type: 'streak_day',
    title: 'Ne brise pas la chaîne',
    descriptionTemplate: 'Termine au moins une séance aujourd\'hui.',
    baseTarget: 1,
    levelScaling: 0,
    difficulty: 'easy',
    unit: 'séance',
  },
  {
    id: 'dis_streak_chain',
    category: 'discipline',
    type: 'streak_day',
    title: 'Chaîne de {{target}} jours',
    descriptionTemplate: 'Enchaîne {{target}} jours d\'entraînement consécutifs.',
    baseTarget: 3,
    levelScaling: 0.05,
    difficulty: 'hard',
    unit: 'jours',
  },
  {
    id: 'dis_duration_30',
    category: 'discipline',
    type: 'workout_duration',
    title: 'Séance engagée',
    descriptionTemplate: 'Entraîne-toi au moins {{target}} minutes.',
    baseTarget: 30 * 60,
    levelScaling: 0.06,
    difficulty: 'easy',
    unit: 'min',
  },
  {
    id: 'dis_duration_60',
    category: 'discipline',
    type: 'workout_duration',
    title: 'Séance marathon',
    descriptionTemplate: 'Tiens {{target}} minutes dans la salle.',
    baseTarget: 60 * 60,
    levelScaling: 0.04,
    difficulty: 'medium',
    unit: 'min',
  },
  {
    id: 'dis_early',
    category: 'discipline',
    type: 'early_workout',
    title: 'Chasseur matinal',
    descriptionTemplate: 'Démarre une séance avant 8:00.',
    baseTarget: 1,
    levelScaling: 0,
    difficulty: 'medium',
    unit: 'séance',
  },
];

export const QUEST_LIBRARY: readonly QuestLibraryEntry[] = [
  ...STRENGTH,
  ...ENDURANCE,
  ...DISCIPLINE,
];

export const QUEST_LIBRARY_BY_ID: Record<string, QuestLibraryEntry> =
  QUEST_LIBRARY.reduce(
    (acc, q) => { acc[q.id] = q; return acc; },
    {} as Record<string, QuestLibraryEntry>,
  );

export const QUEST_LIBRARY_BY_CATEGORY: Record<QuestCategory, QuestLibraryEntry[]> = {
  strength: STRENGTH,
  endurance: ENDURANCE,
  discipline: DISCIPLINE,
};
