/**
 * gamificationService.ts
 * ----------------------
 * Pure functions that compute XP, levels, and per-muscle rewards.
 * No side effects — the Zustand store is in charge of writing the result.
 *
 * This file is the SINGLE place where "how does a set turn into XP?" is
 * answered. Any balancing change must happen here + in constants/gamification
 * and data/playerClasses.
 *
 * Pipeline for a completed set:
 *   volume  = reps × effectiveWeight
 *   baseXp  = volume × VOLUME_TO_XP_RATIO × setModifier × exerciseXpMult × classMult
 *   perMuscle = baseXp × involvement.weight × muscleStatusModifier
 */

import type {
  ClassBonus,
  ClassBonusCondition,
  Exercise,
  MuscleGroupId,
  MuscleGroupStats,
  MuscleStatus,
  PlayerClass,
  UserProfile,
  WorkoutSet,
} from '@/types';
import {
  BASE_XP_PER_LEVEL,
  COMPOUND_GLOBAL_MULTIPLIER,
  DROPSET_XP_MULTIPLIER,
  EXHAUSTED_XP_MULTIPLIER,
  FAILURE_XP_MULTIPLIER,
  FATIGUE_XP_MULTIPLIER,
  LEVEL_EXPONENT,
  MAX_LEVEL,
  VOLUME_TO_XP_RATIO,
  WARMUP_XP_MULTIPLIER,
} from '@/constants/gamification';

// ===========================================================================
// Level curve
// ===========================================================================

export function xpRequiredForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Number.POSITIVE_INFINITY;
  return Math.round(BASE_XP_PER_LEVEL * Math.pow(level, LEVEL_EXPONENT));
}

export function applyXpToLevel(
  currentLevel: number,
  currentXp: number,
  xpDelta: number,
): { level: number; xp: number; xpToNextLevel: number } {
  let level = currentLevel;
  let xp = Math.max(0, currentXp + xpDelta);

  while (level < MAX_LEVEL && xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
  }

  while (level > 1 && xp < 0) {
    level -= 1;
    xp += xpRequiredForLevel(level);
  }
  if (xp < 0) xp = 0;

  return { level, xp, xpToNextLevel: xpRequiredForLevel(level) };
}

// ===========================================================================
// Effective weight (bodyweight fallback)
// ===========================================================================

export function effectiveSetWeight(
  set: WorkoutSet,
  exercise: Exercise,
  userBodyweightKg: number,
): number {
  if (exercise.isBodyweight && set.weight === 0) {
    return Math.max(1, userBodyweightKg);
  }
  return set.weight;
}

export function computeSetVolume(
  set: WorkoutSet,
  exercise: Exercise,
  userBodyweightKg: number,
): number {
  return set.reps * effectiveSetWeight(set, exercise, userBodyweightKg);
}

// ===========================================================================
// Set-level modifier (warmup / dropset / failure / compound / exercise mult)
// ===========================================================================

export function computeSetModifier(set: WorkoutSet, exercise: Exercise): number {
  let m = 1;
  if (set.isWarmup)   m *= WARMUP_XP_MULTIPLIER;
  if (set.isDropset)  m *= DROPSET_XP_MULTIPLIER;
  if (set.isFailure)  m *= FAILURE_XP_MULTIPLIER;
  if (exercise.movement === 'compound') m *= COMPOUND_GLOBAL_MULTIPLIER;
  m *= exercise.xpMultiplier;
  return m;
}

// ===========================================================================
// Muscle-status modifier
// ===========================================================================

export function statusXpMultiplier(status: MuscleStatus): number {
  switch (status) {
    case 'epuise':  return EXHAUSTED_XP_MULTIPLIER;
    case 'fatigue': return FATIGUE_XP_MULTIPLIER;
    case 'actif':
    case 'frais':
    default:        return 1;
  }
}

// ===========================================================================
// Class bonuses (RPG)
// ===========================================================================

/** Context passed to ClassBonusCondition evaluation. */
export interface ClassBonusContext {
  set: WorkoutSet;
  exercise: Exercise;
  userBodyweightKg: number;
}

/** Evaluate a single condition against a context. Pure + data-driven. */
export function matchesClassBonus(
  condition: ClassBonusCondition,
  ctx: ClassBonusContext,
): boolean {
  const { set, exercise, userBodyweightKg } = ctx;

  switch (condition.kind) {
    case 'heavy_compound': {
      if (exercise.movement !== 'compound') return false;
      if (set.reps > condition.maxReps) return false;
      const effectiveWeight = effectiveSetWeight(set, exercise, userBodyweightKg);
      const bw = Math.max(1, userBodyweightKg);
      return effectiveWeight / bw >= condition.minBodyweightRatio;
    }
    case 'bodyweight_exercise':
      return exercise.isBodyweight === true;
    case 'isolation_hypertrophy':
      return (
        exercise.movement === 'isolation' &&
        set.reps >= condition.minReps &&
        set.reps <= condition.maxReps
      );
    case 'category':
      return exercise.category === condition.category;
    case 'high_reps':
      return set.reps >= condition.minReps;
    case 'movement':
      return exercise.movement === condition.movement;
    default:
      return false;
  }
}

/**
 * Compute the product of all applicable class bonus multipliers for one set.
 * Multiple bonuses stack multiplicatively (Tank's "Heavy Hitter" ×1.30 AND
 * "Mur d'acier" ×1.10 → ×1.43 when both conditions match).
 */
export function computeClassMultiplier(
  playerClass: PlayerClass,
  ctx: ClassBonusContext,
): { multiplier: number; applied: ClassBonus[] } {
  let multiplier = 1;
  const applied: ClassBonus[] = [];

  for (const bonus of playerClass.bonuses) {
    if (matchesClassBonus(bonus.condition, ctx)) {
      multiplier *= bonus.multiplier;
      applied.push(bonus);
    }
  }
  return { multiplier, applied };
}

// ===========================================================================
// Full set XP breakdown
// ===========================================================================

export interface SetXpBreakdown {
  volume: number;
  baseXp: number;                          // after all non-status modifiers
  classMultiplier: number;
  classBonusesApplied: ClassBonus[];
  perMuscle: Array<{
    muscleId: MuscleGroupId;
    share: number;
    xpBeforeStatus: number;
    xpAfterStatus: number;
    statusModifier: number;
  }>;
  totalXp: number;
}

/**
 * Compute the XP breakdown for one completed set.
 * Caller (store) applies the result against `muscleStats` atomically.
 */
export function computeSetXp(
  set: WorkoutSet,
  exercise: Exercise,
  muscleStats: Record<MuscleGroupId, MuscleGroupStats>,
  userBodyweightKg: number,
  playerClass: PlayerClass,
): SetXpBreakdown {
  const volume = computeSetVolume(set, exercise, userBodyweightKg);
  const setModifier = computeSetModifier(set, exercise);

  const { multiplier: classMultiplier, applied: classBonusesApplied } =
    computeClassMultiplier(playerClass, { set, exercise, userBodyweightKg });

  const baseXp = volume * VOLUME_TO_XP_RATIO * setModifier * classMultiplier;

  const perMuscle = exercise.muscleInvolvement.map(mi => {
    const statusMod = statusXpMultiplier(muscleStats[mi.muscleId].status);
    const xpBeforeStatus = baseXp * mi.weight;
    const xpAfterStatus = xpBeforeStatus * statusMod;
    return {
      muscleId: mi.muscleId,
      share: mi.weight,
      xpBeforeStatus,
      xpAfterStatus,
      statusModifier: statusMod,
    };
  });

  const totalXp = perMuscle.reduce((s, p) => s + p.xpAfterStatus, 0);

  return {
    volume,
    baseXp,
    classMultiplier,
    classBonusesApplied,
    perMuscle,
    totalXp,
  };
}

// ===========================================================================
// Mutations (pure)
// ===========================================================================

export function applyXpToMuscle(
  stats: MuscleGroupStats,
  xpDelta: number,
  volumeDelta: number,
  now: number,
): MuscleGroupStats {
  const { level, xp, xpToNextLevel } = applyXpToLevel(stats.level, stats.xp, xpDelta);
  return {
    ...stats,
    xp,
    level,
    xpToNextLevel,
    totalVolumeLifetime: stats.totalVolumeLifetime + Math.max(0, volumeDelta),
    volumeLast24h: stats.volumeLast24h + Math.max(0, volumeDelta),
    volumeLast7d: stats.volumeLast7d + Math.max(0, volumeDelta),
    lastTrainedAt: volumeDelta > 0 ? now : stats.lastTrainedAt,
  };
}

export function applySetBreakdownToProfile(
  profile: UserProfile,
  breakdown: SetXpBreakdown,
  now: number,
): UserProfile {
  const nextMuscleStats = { ...profile.muscleStats };

  for (const entry of breakdown.perMuscle) {
    const current = nextMuscleStats[entry.muscleId];
    const volumeShare = breakdown.volume * entry.share;
    nextMuscleStats[entry.muscleId] = applyXpToMuscle(
      current,
      entry.xpAfterStatus,
      volumeShare,
      now,
    );
  }

  const global = applyXpToLevel(profile.level, profile.totalXp, breakdown.totalXp);

  return {
    ...profile,
    muscleStats: nextMuscleStats,
    totalXp: global.xp,
    level: global.level,
    xpToNextLevel: global.xpToNextLevel,
    totalVolumeLifetime: profile.totalVolumeLifetime + breakdown.volume,
  };
}
