/**
 * GymLevel — Global type definitions
 * ----------------------------------
 * Source of truth for all data models used by the app.
 * Any persisted entity (SQLite row) must map to one of these interfaces.
 */

// ===========================================================================
// 1. MUSCLE GROUPS (17 distinct groups)
// ===========================================================================

export type MuscleGroupId =
  // Upper — Chest
  | 'pectoraux'
  // Upper — Back
  | 'dorsaux'
  | 'trapezes'
  | 'lombaires'
  // Upper — Shoulders (decomposed for training granularity)
  | 'deltoides_anterieur'
  | 'deltoides_lateral'
  | 'deltoides_posterieur'
  // Upper — Arms
  | 'biceps'
  | 'triceps'
  | 'avant_bras'
  // Core
  | 'abdominaux'
  | 'obliques'
  // Lower
  | 'quadriceps'
  | 'ischio_jambiers'
  | 'fessiers'
  | 'mollets'
  | 'adducteurs';

export type BodyPart = 'upper' | 'lower' | 'core';

/** Recovery / overload status of a muscle group. */
export type MuscleStatus =
  | 'frais'      // Rested & ready — full XP gain
  | 'actif'      // Trained recently, still in optimal window
  | 'fatigue'    // Approaching overload — warning state
  | 'epuise';    // Overloaded — XP gains halved until recovery

export interface MuscleGroup {
  id: MuscleGroupId;
  name: string;
  nameEn: string;
  bodyPart: BodyPart;
  colorHex: string;
  baseRecoveryHours: number;
}

/** Live stats for one muscle group on the user profile. */
export interface MuscleGroupStats {
  muscleId: MuscleGroupId;
  xp: number;
  level: number;
  xpToNextLevel: number;
  totalVolumeLifetime: number;
  lastTrainedAt: number | null;
  status: MuscleStatus;
  statusUntil: number | null;

  volumeLast24h: number;
  volumeLast7d: number;
  sessionsLast7d: number;

  lastDeconditioningAppliedAt: number | null;
}

// ===========================================================================
// 2. EXERCISES
// ===========================================================================

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other';

export type ExerciseCategory =
  | 'push'
  | 'pull'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'hiit'
  | 'mobility';

export type Movement = 'compound' | 'isolation';

export interface MuscleInvolvement {
  muscleId: MuscleGroupId;
  weight: number;         // 0..1 — share of XP routed to this muscle
  role: 'primary' | 'secondary' | 'stabilizer';
}

export interface Exercise {
  id: string;
  name: string;
  nameEn?: string;
  category: ExerciseCategory;
  movement: Movement;
  equipment: Equipment;
  isBodyweight: boolean;

  muscleInvolvement: MuscleInvolvement[];
  primaryMuscles: MuscleGroupId[];
  secondaryMuscles: MuscleGroupId[];

  xpMultiplier: number;   // default 1.0
  instructions?: string;
  tips?: string;
  videoUrl?: string;

  isCustom: boolean;
  createdAt: number;
}

// ===========================================================================
// 3. SETS & SESSIONS
// ===========================================================================

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;          // kg normalized
  rpe?: number;            // 1..10
  isWarmup: boolean;
  isDropset: boolean;
  isFailure: boolean;
  completedAt: number;
  restAfterSeconds?: number;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  order: number;
  sets: WorkoutSet[];

  targetSets?: number;
  targetReps?: string;
  targetRestSeconds?: number;
  notes?: string;
}

export type WorkoutStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'abandoned';

export interface WorkoutSession {
  id: string;
  templateId?: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  durationSeconds?: number;

  exercises: WorkoutExercise[];

  totalVolume: number;
  totalXpGained: number;
  xpByMuscle: Partial<Record<MuscleGroupId, number>>;

  status: WorkoutStatus;
  notes?: string;
}

// ===========================================================================
// 4. TEMPLATES
// ===========================================================================

export type TemplateTag =
  | 'upper'
  | 'lower'
  | 'push'
  | 'pull'
  | 'legs'
  | 'fullbody'
  | 'arms'
  | 'core'
  | 'hiit'
  | 'cardio'
  | 'beginner_friendly'
  | 'custom';

export type TemplateDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface TemplateExercise {
  exerciseId: string;
  order: number;
  targetSets: number;
  targetReps: string;
  targetRestSeconds?: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  tags: TemplateTag[];
  difficulty: TemplateDifficulty;
  estimatedDurationMinutes: number;
  exercises: TemplateExercise[];

  isBuiltIn: boolean;
  clonedFrom?: string;

  createdAt: number;
  updatedAt: number;
}

// ===========================================================================
// 5. QUESTS
// ===========================================================================

export type QuestType =
  | 'volume_total'
  | 'muscle_volume'
  | 'exercises_category'
  | 'exercise_specific'
  | 'muscle_xp'
  | 'workout_duration'
  | 'streak_day'
  | 'set_count'
  // Refonte du moteur de quêtes :
  | 'total_reps'         // cumulative reps across sets (STRENGTH/ENDURANCE)
  | 'max_weight'         // max weight observed on a single set (STRENGTH)
  | 'early_workout';     // workout started before a given hour (DISCIPLINE)

/** High-level category used by the UI (icon + tagline). */
export type QuestCategory = 'strength' | 'endurance' | 'discipline';

export type QuestStatus =
  | 'active'
  | 'completed'
  | 'failed'
  | 'expired';

export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'epic';

export interface QuestFilter {
  category?: ExerciseCategory;
  muscleId?: MuscleGroupId;
  exerciseIds?: string[];
  bodyPart?: BodyPart;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  filter?: QuestFilter;

  target: number;
  progress: number;

  xpReward: number;
  /** Optional loot reward — rolled on claim by questService.rollLootFromQuest(). */
  lootReward?: LootReward;

  difficulty: QuestDifficulty;
  /** High-level category — drives the UI icon & badge colour. */
  category: QuestCategory;
  /** Computed rank letter (E → S) for the "QUÊTE DE RANG X" label. */
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

  /** Reference to the library template (debug + re-roll). */
  templateId?: string;

  status: QuestStatus;

  createdAt: number;
  expiresAt: number;
  completedAt?: number;
}

// ===========================================================================
// 6. PLAYER CLASS SYSTEM (RPG)
// ===========================================================================

export type PlayerClassId =
  | 'guerrier'   // Force / charges lourdes
  | 'assassin'   // Calisthénie / poids du corps
  | 'tank';      // Hypertrophie / volume

/**
 * Serialisable condition triggering a passive bonus.
 * The gamification service evaluates it against the set being logged,
 * plus a small context snapshot (bodyweight, current streak).
 * Conditions must be pure data (no functions) so PlayerClass objects stay
 * JSON-safe and can be shipped from the server later.
 */
export type ClassBonusCondition =
  // ---- Primitive conditions -----------------------------------------------

  /** Compound lifts, low reps, heavy weight relative to the user's bodyweight. */
  | {
      kind: 'heavy_compound';
      maxReps: number;           // e.g. 5 — only trigger for low-rep sets
      minBodyweightRatio: number;// e.g. 1.0 — weight / bodyweight ≥ ratio
    }
  /** Any set performed on a bodyweight-flagged exercise. */
  | { kind: 'bodyweight_exercise' }
  /** Isolation movement in hypertrophy rep range. */
  | {
      kind: 'isolation_hypertrophy';
      minReps: number;
      maxReps: number;
    }
  /** Any isolation movement with reps ≥ minReps. */
  | { kind: 'isolation_reps'; minReps: number }
  /** Exercise category match (e.g. hiit). */
  | { kind: 'category'; category: ExerciseCategory }
  /** Very high-rep set (endurance work). */
  | { kind: 'high_reps'; minReps: number }
  /** Exercise flagged as compound/isolation. */
  | { kind: 'movement'; movement: Movement }

  // ---- Primitives added for the Solo Leveling class pack ------------------

  /** Set reps fall inside [minReps, maxReps] — no movement restriction. */
  | { kind: 'rep_range'; minReps: number; maxReps: number }
  /** Exercise equipment is one of the listed equipments (OR semantic). */
  | { kind: 'equipment'; equipments: Equipment[] }
  /** Exercise primary muscle(s) intersect with the provided list. */
  | { kind: 'muscle_primary'; muscleIds: MuscleGroupId[] }
  /** User currently has a training streak ≥ minDays. */
  | { kind: 'streak_active'; minDays: number }

  // ---- Composition --------------------------------------------------------

  /** Logical AND — every inner condition must match. */
  | { kind: 'all_of'; conditions: ClassBonusCondition[] };

export interface ClassBonus {
  id: string;
  label: string;           // Short display label — "Heavy Hitter"
  description: string;     // Full description used in class selection UI
  multiplier: number;      // 1.25 = +25% XP when condition matches
  condition: ClassBonusCondition;
}

export interface PlayerClass {
  id: PlayerClassId;
  name: string;            // FR display name — "Tank"
  nameEn: string;
  tagline: string;         // 1-line hook — "Brise les barres."
  description: string;     // Paragraph description for the class-picker screen
  colorHex: string;
  icon: string;            // Emoji or key for later icon system
  /** Favourite muscles / categories — used for secondary bonuses & UI sorting. */
  affinity: {
    categories?: ExerciseCategory[];
    muscles?: MuscleGroupId[];
  };
  /** Stacking rule: all matching bonuses multiply together. */
  bonuses: ClassBonus[];
}

// ===========================================================================
// 7. EQUIPMENT / LOOT
// ===========================================================================

export type EquipmentRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type EquipmentSlot = 'head' | 'body' | 'weapon' | 'accessory';

/**
 * Equipment instance owned by the user.
 * The `bonuses` field re-uses the ClassBonus shape so the same condition
 * evaluator (matchesClassBonus) can be applied. Multipliers on items are
 * intentionally smaller than on classes (≈ 1.02 – 1.15 per bonus).
 */
export interface EquipmentItem {
  /** Unique instance id — generated at drop time. */
  id: string;
  /** Reference to the template in data/equipment.ts (useful for UI icons/flavor). */
  templateId: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: EquipmentRarity;
  slot: EquipmentSlot;
  bonuses: ClassBonus[];
  acquiredAt: number;
  sourceQuestId?: string;
}

/** Static definition used to mint new EquipmentItem instances on drop. */
export interface ItemTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: EquipmentRarity;
  slot: EquipmentSlot;
  /** Template bonuses — copied into each minted instance. */
  bonuses: ClassBonus[];
}

export interface Inventory {
  /** Every item the user has acquired, equipped or not. */
  equipment: EquipmentItem[];
  /** Currently worn items — at most one per slot. */
  equipped: Record<EquipmentSlot, EquipmentItem | null>;
  /** Consumables (elixirs, scrolls, keys). */
  consumables: ConsumableItem[];
}

// ---- Consumables ----------------------------------------------------------

export type ConsumableEffect =
  /** Reduce the global fatigue by `percent` (0..100). One-shot. */
  | { kind: 'reduce_fatigue'; percent: number }
  /** Flat XP grant on the global counter. */
  | { kind: 'instant_xp'; amount: number }
  /** Unlocks a special quest / dungeon later in the roadmap. */
  | { kind: 'unlock_dungeon' };

export type ConsumableSubtype = 'elixir' | 'scroll' | 'key' | 'relic';

export interface ConsumableItem {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: EquipmentRarity;
  subtype: ConsumableSubtype;
  effect: ConsumableEffect;
  acquiredAt: number;
}

export interface ConsumableTemplate {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: EquipmentRarity;
  subtype: ConsumableSubtype;
  effect: ConsumableEffect;
}

/** Declarative loot reward attached to a Quest. */
export type LootReward =
  /** Drop a specific item template. */
  | { kind: 'specific'; templateId: string }
  /** Roll a random item from the pool, constrained by rarity and/or slot. */
  | {
      kind: 'random';
      rarity: EquipmentRarity;
      slot?: EquipmentSlot;
    };

// ===========================================================================
// 8. USER PROFILE
// ===========================================================================

export type WeightUnit = 'kg' | 'lbs';
export type Theme = 'dark' | 'light' | 'system';

export interface UserPreferences {
  weightUnit: WeightUnit;
  /**
   * User's bodyweight in kg — used as `weight` for bodyweight exercises
   * and as the reference for Tank's "heavy_compound" ratio bonus.
   * `null` means the value has not been set yet: the onboarding screen
   * MUST collect it before any session starts.
   */
  bodyweightKg: number | null;

  // Optional biometric stats for the Statut screen — can stay null
  // until we ship a biometric editor.
  heightCm?: number | null;
  restingBpm?: number | null;
  vo2max?: number | null;

  defaultRestSeconds: number;
  theme: Theme;
  hapticFeedback: boolean;
  soundEffects: boolean;
  notifications: boolean;
}

/** Personal Record per exercise — feeds PR-aware quest scaling. */
export interface PersonalRecord {
  exerciseId: string;
  /** Heaviest single working set (any reps). */
  bestWeight: number;
  /** Highest rep count on any weight. */
  bestReps: number;
  /** Highest volume on a single set (weight × reps). */
  bestVolume: number;
  /** Estimated 1-rep max (Epley formula). */
  bestEstimated1RM: number;
  lastUpdatedAt: number;
}

/** Active profile-wide buffs from consumables. */
export interface ProfileBuffs {
  /** Fatigue reduction buff. Applied once, cleared after one fatigue recompute. */
  pendingFatigueReduction?: number; // absolute points to subtract from global fatigue (0..100)
}

export interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl?: string;
  createdAt: number;

  /** Flag raised when the user has cleared the onboarding flow. */
  hasAcceptedSystemTerms: boolean;

  /** RPG class — drives XP multipliers in gamificationService. */
  playerClassId: PlayerClassId;
  /** Timestamp of last class change — we may add cooldown later. */
  playerClassChangedAt: number | null;

  totalXp: number;
  level: number;
  xpToNextLevel: number;

  muscleStats: Record<MuscleGroupId, MuscleGroupStats>;

  /** Personal Records keyed by exerciseId. */
  personalRecords: Record<string, PersonalRecord>;

  /** Active buffs from consumables. */
  buffs: ProfileBuffs;

  /** Owned + currently equipped loot. */
  inventory: Inventory;

  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalVolumeLifetime: number;
  lastWorkoutAt: number | null;

  preferences: UserPreferences;
}

// ===========================================================================
// 9. GAMIFICATION EVENTS (audit log / debug)
// ===========================================================================

export type XpEventReason =
  | 'set_completed'
  | 'workout_finished'
  | 'quest_reward'
  | 'streak_bonus'
  | 'first_time_bonus'
  | 'deconditioning_penalty'
  | 'class_bonus';

export interface XpEvent {
  id: string;
  timestamp: number;
  muscleId: MuscleGroupId | 'global';
  baseXp: number;
  modifier: number;
  finalXp: number;
  reason: XpEventReason;
  sourceId?: string;
}

export interface DeconditioningCheckResult {
  checkedAt: number;
  penalties: Array<{
    muscleId: MuscleGroupId;
    daysInactive: number;
    xpBefore: number;
    xpLost: number;
    xpAfter: number;
  }>;
}

// ===========================================================================
// 10. STORE SHAPES (re-exported for convenience)
// ===========================================================================

export type NewSetPayload = Omit<WorkoutSet, 'id' | 'completedAt' | 'setNumber'>;

export type NewTemplatePayload = Omit<
  WorkoutTemplate,
  'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'
>;
