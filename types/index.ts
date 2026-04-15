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
  | 'set_count';

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
  difficulty: QuestDifficulty;
  status: QuestStatus;

  createdAt: number;
  expiresAt: number;
  completedAt?: number;
}

// ===========================================================================
// 6. PLAYER CLASS SYSTEM (RPG)
// ===========================================================================

export type PlayerClassId =
  | 'novice'       // Default — no passive bonus
  | 'tank'         // Strength / heavy compound lifts
  | 'assassin'     // Bodyweight / calisthenics
  | 'berserker'    // Hypertrophy / isolation
  | 'ranger';      // HIIT / endurance

/**
 * Serialisable condition triggering a passive bonus.
 * The gamification service evaluates it against the set being logged.
 * Conditions must be pure data (no functions) so PlayerClass objects stay
 * JSON-safe and can be shipped from the server later.
 */
export type ClassBonusCondition =
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
      minReps: number;           // e.g. 8
      maxReps: number;           // e.g. 15
    }
  /** Any isolation movement with reps ≥ minReps (broader than hypertrophy). */
  | { kind: 'isolation_reps'; minReps: number }
  /** Exercise category match (e.g. hiit). */
  | { kind: 'category'; category: ExerciseCategory }
  /** Very high-rep set (endurance work). */
  | { kind: 'high_reps'; minReps: number }
  /** Exercise flagged as compound/isolation. */
  | { kind: 'movement'; movement: Movement };

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
// 7. USER PROFILE
// ===========================================================================

export type WeightUnit = 'kg' | 'lbs';
export type Theme = 'dark' | 'light' | 'system';

export interface UserPreferences {
  weightUnit: WeightUnit;
  /**
   * User's bodyweight in kg — used as `weight` for bodyweight exercises
   * and as the reference for Tank's "heavy_compound" ratio bonus.
   * `null` means the value has not been set yet: the onboarding screen
   * ("Évaluation du Système") MUST collect it before any session starts.
   * `initializeApp()` short-circuits when this is null.
   */
  bodyweightKg: number | null;
  defaultRestSeconds: number;
  theme: Theme;
  hapticFeedback: boolean;
  soundEffects: boolean;
  notifications: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  createdAt: number;

  /** RPG class — drives XP multipliers in gamificationService. */
  playerClassId: PlayerClassId;
  /** Timestamp of last class change — we may add cooldown later. */
  playerClassChangedAt: number | null;

  totalXp: number;
  level: number;
  xpToNextLevel: number;

  muscleStats: Record<MuscleGroupId, MuscleGroupStats>;

  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalVolumeLifetime: number;
  lastWorkoutAt: number | null;

  preferences: UserPreferences;
}

// ===========================================================================
// 8. GAMIFICATION EVENTS (audit log / debug)
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
// 9. STORE SHAPES (re-exported for convenience)
// ===========================================================================

export type NewSetPayload = Omit<WorkoutSet, 'id' | 'completedAt' | 'setNumber'>;

export type NewTemplatePayload = Omit<
  WorkoutTemplate,
  'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'
>;
