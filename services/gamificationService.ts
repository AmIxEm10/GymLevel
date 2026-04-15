/**
 * gamificationService.ts
 * ----------------------
 * Pure functions that compute XP, levels, and per-muscle rewards.
 * No side effects — the Zustand store is in charge of writing the result.
 *
 * This file is the SINGLE place where "how does a set turn into XP?" is
 * answered. Any balancing change must happen here + in constants/gamification.
 */

import type {
  Exercise,
  MuscleGroupId,
  MuscleGroupStats,
  MuscleStatus,
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

/** XP needed to go from level `n` to level `n+1`. */
export function xpRequiredForLevel(level: number): number {
  if (level >= MAX_LEVEL) return Number.POSITIVE_INFINITY;
  return Math.round(BASE_XP_PER_LEVEL * Math.pow(level, LEVEL_EXPONENT));
}

/** Consume XP and yield new (level, xp, xpToNextLevel). */
export function applyXpToLevel(
  currentLevel: number,
  currentXp: number,
  xpDelta: number,
): { level: number; xp: number; xpToNextLevel: number } {
  let level = currentLevel;
  let xp = Math.max(0, currentXp + xpDelta);

  // Level up loop
  while (level < MAX_LEVEL && xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
  }

  // Down-level on penalty (allow level 1 floor)
  while (level > 1 && xp < 0) {
    level -= 1;
    xp += xpRequiredForLevel(level);
  }
  if (xp < 0) xp = 0;

  return {
    level,
    xp,
    xpToNextLevel: xpRequiredForLevel(level),
  };
}

// ===========================================================================
// Set → Volume → XP
// ===========================================================================

/** Effective weight used for XP: bodyweight exercises fall back to bw. */
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

/** Raw volume (kg) for a single set. */
export function computeSetVolume(
  set: WorkoutSet,
  exercise: Exercise,
  userBodyweightKg: number,
): number {
  return set.reps * effectiveSetWeight(set, exercise, userBodyweightKg);
}

/** Aggregate set multiplier (warmup / dropset / failure / compound flag). */
export function computeSetModifier(set: WorkoutSet, exercise: Exercise): number {
  let m = 1;
  if (set.isWarmup) m *= WARMUP_XP_MULTIPLIER;
  if (set.isDropset) m *= DROPSET_XP_MULTIPLIER;
  if (set.isFailure) m *= FAILURE_XP_MULTIPLIER;
  if (exercise.movement === 'compound') m *= COMPOUND_GLOBAL_MULTIPLIER;
  m *= exercise.xpMultiplier;
  return m;
}

/** Per-muscle XP multiplier derived from the muscle's current status. */
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
// Route a set's XP across the muscles it involves
// ===========================================================================

export interface SetXpBreakdown {
  volume: number;
  baseXp: number;                          // before muscle-level status modifier
  perMuscle: Array<{
    muscleId: MuscleGroupId;
    share: number;                         // 0..1
    xpBeforeStatus: number;
    xpAfterStatus: number;
    statusModifier: number;
  }>;
  totalXp: number;                         // Σ perMuscle.xpAfterStatus
}

/**
 * Compute the full XP breakdown for one completed set.
 * The caller (store) applies it against `muscleStats` atomically.
 */
export function computeSetXp(
  set: WorkoutSet,
  exercise: Exercise,
  muscleStats: Record<MuscleGroupId, MuscleGroupStats>,
  userBodyweightKg: number,
): SetXpBreakdown {
  const volume = computeSetVolume(set, exercise, userBodyweightKg);
  const setModifier = computeSetModifier(set, exercise);
  const baseXp = volume * VOLUME_TO_XP_RATIO * setModifier;

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

  return { volume, baseXp, perMuscle, totalXp };
}

// ===========================================================================
// Mutations (pure, return NEW state slices)
// ===========================================================================

/** Apply an XP delta to a single muscle — returns new stats snapshot. */
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

/**
 * Aggregate an entire SetXpBreakdown into an updated muscleStats map
 * AND a new global (profile-level) XP delta.
 */
export function applySetBreakdownToProfile(
  profile: UserProfile,
  breakdown: SetXpBreakdown,
  now: number,
): UserProfile {
  const nextMuscleStats = { ...profile.muscleStats };

  for (const entry of breakdown.perMuscle) {
    const current = nextMuscleStats[entry.muscleId];
    // volumeShare is share × raw volume, not XP (volume tracking is pre-status)
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
