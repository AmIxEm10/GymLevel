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
  name: string;        // Display name (FR)
  nameEn: string;
  bodyPart: BodyPart;
  /** Visual cue — used by the body map UI later. */
  colorHex: string;
  /** Relative recovery capacity (hours). Smaller muscles recover faster. */
  baseRecoveryHours: number;
}

/** Live stats for one muscle group on the user profile. */
export interface MuscleGroupStats {
  muscleId: MuscleGroupId;
  xp: number;
  level: number;
  xpToNextLevel: number;
  totalVolumeLifetime: number;   // kg cumulated (all time)
  lastTrainedAt: number | null;  // epoch ms
  status: MuscleStatus;
  statusUntil: number | null;    // epoch ms — when status should auto-re-evaluate

  // Rolling windows used by recovery & quests services
  volumeLast24h: number;
  volumeLast7d: number;
  sessionsLast7d: number;

  // Deconditioning tracking
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

/**
 * Per-exercise muscle activation map.
 * `weight` ∈ [0..1] — share of the volume that will be routed
 * to that muscle's XP bar. Sum of weights SHOULD be ≈ 1.0
 * (enforced at seed time, not runtime, for performance).
 */
export interface MuscleInvolvement {
  muscleId: MuscleGroupId;
  weight: number;
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

  /** Granular activation — single source of truth for XP routing. */
  muscleInvolvement: MuscleInvolvement[];

  /** Convenience flattened fields (derived from muscleInvolvement at seed time). */
  primaryMuscles: MuscleGroupId[];
  secondaryMuscles: MuscleGroupId[];

  /** Compound lifts give a small XP bonus to reward effort. */
  xpMultiplier: number; // default 1.0

  instructions?: string;
  tips?: string;
  videoUrl?: string;

  /** User-created exercises have this flag set. */
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
  weight: number;            // kg (normalized; display handles lbs conversion)
  rpe?: number;              // 1..10 — rate of perceived exertion
  isWarmup: boolean;
  isDropset: boolean;
  isFailure: boolean;
  completedAt: number;
  restAfterSeconds?: number;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;                // unique within the session
  exerciseId: string;
  order: number;
  sets: WorkoutSet[];

  // Target guidance from the template (optional)
  targetSets?: number;
  targetReps?: string;       // e.g. "8-12"
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
  templateId?: string;       // undefined when the user starts from scratch
  name: string;
  startedAt: number;
  endedAt?: number;
  durationSeconds?: number;

  exercises: WorkoutExercise[];

  // Aggregated snapshots computed at session end (and live during tracking)
  totalVolume: number;                                      // Σ reps × weight
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
  targetReps: string;        // "5", "8-12", "AMRAP", "30s"
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

  /** Built-in templates cannot be deleted, only cloned. */
  isBuiltIn: boolean;
  /** If this template is the product of a clone, keep lineage. */
  clonedFrom?: string;

  createdAt: number;
  updatedAt: number;
}

// ===========================================================================
// 5. QUESTS
// ===========================================================================

export type QuestType =
  | 'volume_total'           // Lift X kg during the day
  | 'muscle_volume'          // Lift X kg on a given muscle
  | 'exercises_category'     // Complete X exercises of category (push/pull/legs/core)
  | 'exercise_specific'      // Complete X sets of a given exercise
  | 'muscle_xp'              // Gain X XP on a given muscle
  | 'workout_duration'       // Train at least X minutes
  | 'streak_day'             // Train today (streak-keeper)
  | 'set_count';             // Complete X working sets

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
  expiresAt: number;         // daily quests expire at midnight local
  completedAt?: number;
}

// ===========================================================================
// 6. USER PROFILE
// ===========================================================================

export type WeightUnit = 'kg' | 'lbs';
export type Theme = 'dark' | 'light' | 'system';

export interface UserPreferences {
  weightUnit: WeightUnit;
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

  // Global progression
  totalXp: number;
  level: number;
  xpToNextLevel: number;

  // Per-muscle progression (always contains the 17 keys)
  muscleStats: Record<MuscleGroupId, MuscleGroupStats>;

  // Streaks & lifetime counters
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalVolumeLifetime: number;
  lastWorkoutAt: number | null;

  preferences: UserPreferences;
}

// ===========================================================================
// 7. GAMIFICATION EVENTS (audit log / debug)
// ===========================================================================

export type XpEventReason =
  | 'set_completed'
  | 'workout_finished'
  | 'quest_reward'
  | 'streak_bonus'
  | 'first_time_bonus'
  | 'deconditioning_penalty';

export interface XpEvent {
  id: string;
  timestamp: number;
  muscleId: MuscleGroupId | 'global';
  baseXp: number;
  modifier: number;          // e.g. 0.5 when "épuisé", 1.1 when compound
  finalXp: number;           // baseXp * modifier (may be negative for penalty)
  reason: XpEventReason;
  sourceId?: string;         // workoutSessionId | questId | setId
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
// 8. STORE SHAPES (re-exported for convenience by the Zustand store)
// ===========================================================================

/** Payload used by the tracker to add a set. */
export type NewSetPayload = Omit<WorkoutSet, 'id' | 'completedAt' | 'setNumber'>;

/** Payload used to create a custom template from scratch. */
export type NewTemplatePayload = Omit<
  WorkoutTemplate,
  'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'
>;
