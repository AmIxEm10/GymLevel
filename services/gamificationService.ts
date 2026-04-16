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
  EquipmentItem,
  EquipmentSlot,
  Exercise,
  MuscleGroupId,
  MuscleGroupStats,
  MuscleStatus,
  PersonalRecord,
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
  MAX_CLASS_MULTIPLIER,
  MAX_EQUIPMENT_MULTIPLIER,
  MAX_LEVEL,
  MUSCLE_XP_MATURITY_REDUCTION,
  MUSCLE_XP_MATURITY_THRESHOLD,
  VOLUME_TO_XP_RATIO,
  WARMUP_XP_MULTIPLIER,
} from '@/constants/gamification';
import { getMuscleTier, tierRankIndex } from '@/data/muscleTiers';

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
  /** Profile's current streak — read by `streak_active` condition. */
  currentStreak: number;
}

/** Evaluate a single condition against a context. Pure + data-driven. */
export function matchesClassBonus(
  condition: ClassBonusCondition,
  ctx: ClassBonusContext,
): boolean {
  const { set, exercise, userBodyweightKg, currentStreak } = ctx;

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
    case 'isolation_reps':
      return exercise.movement === 'isolation' && set.reps >= condition.minReps;
    case 'category':
      return exercise.category === condition.category;
    case 'high_reps':
      return set.reps >= condition.minReps;
    case 'movement':
      return exercise.movement === condition.movement;

    case 'rep_range':
      return set.reps >= condition.minReps && set.reps <= condition.maxReps;
    case 'equipment':
      return condition.equipments.includes(exercise.equipment);
    case 'muscle_primary':
      return exercise.primaryMuscles.some(m => condition.muscleIds.includes(m));
    case 'streak_active':
      return currentStreak >= condition.minDays;

    case 'all_of':
      return condition.conditions.every(c => matchesClassBonus(c, ctx));

    default:
      return false;
  }
}

/**
 * Compute the stacked class bonus multiplier for one set.
 * Multiple bonuses stack multiplicatively (Tank's "Heavy Hitter" ×1.30 AND
 * "Mur d'acier" ×1.10 → ×1.43 when both conditions match), then the product
 * is clamped to MAX_CLASS_MULTIPLIER to prevent XP economy from exploding.
 */
export function computeClassMultiplier(
  playerClass: PlayerClass,
  ctx: ClassBonusContext,
): { multiplier: number; rawMultiplier: number; clamped: boolean; applied: ClassBonus[] } {
  let rawMultiplier = 1;
  const applied: ClassBonus[] = [];

  for (const bonus of playerClass.bonuses) {
    if (matchesClassBonus(bonus.condition, ctx)) {
      rawMultiplier *= bonus.multiplier;
      applied.push(bonus);
    }
  }

  const multiplier = Math.min(rawMultiplier, MAX_CLASS_MULTIPLIER);
  return {
    multiplier,
    rawMultiplier,
    clamped: rawMultiplier > MAX_CLASS_MULTIPLIER,
    applied,
  };
}

// ===========================================================================
// Equipment bonuses (RPG loot)
// ===========================================================================

export interface AppliedEquipmentBonus {
  itemId: string;
  itemName: string;
  slot: EquipmentSlot;
  bonus: ClassBonus;
}

/**
 * Compute the stacked equipment multiplier by iterating the currently
 * equipped items. Reuses the ClassBonus condition evaluator, so equipment
 * bonuses behave exactly like class bonuses (data-driven, composable).
 * Product is clamped to MAX_EQUIPMENT_MULTIPLIER.
 */
export function computeEquipmentMultiplier(
  equipped: Record<EquipmentSlot, EquipmentItem | null>,
  ctx: ClassBonusContext,
): {
  multiplier: number;
  rawMultiplier: number;
  clamped: boolean;
  applied: AppliedEquipmentBonus[];
} {
  let rawMultiplier = 1;
  const applied: AppliedEquipmentBonus[] = [];

  const slots: EquipmentSlot[] = ['head', 'body', 'weapon', 'accessory'];
  for (const slot of slots) {
    const item = equipped[slot];
    if (!item) continue;
    for (const bonus of item.bonuses) {
      if (matchesClassBonus(bonus.condition, ctx)) {
        rawMultiplier *= bonus.multiplier;
        applied.push({
          itemId: item.id,
          itemName: item.name,
          slot,
          bonus,
        });
      }
    }
  }

  const multiplier = Math.min(rawMultiplier, MAX_EQUIPMENT_MULTIPLIER);
  return {
    multiplier,
    rawMultiplier,
    clamped: rawMultiplier > MAX_EQUIPMENT_MULTIPLIER,
    applied,
  };
}

// ===========================================================================
// Full set XP breakdown
// ===========================================================================

export interface SetXpBreakdown {
  volume: number;
  baseXp: number;                          // after all non-status modifiers

  classMultiplier: number;                 // post-clamp
  classMultiplierRaw: number;
  classMultiplierClamped: boolean;
  classBonusesApplied: ClassBonus[];

  equipmentMultiplier: number;             // post-clamp
  equipmentMultiplierRaw: number;
  equipmentMultiplierClamped: boolean;
  equipmentBonusesApplied: AppliedEquipmentBonus[];

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
 *
 * Pipeline:
 *   volume  = reps × effectiveWeight
 *   baseXp  = volume × VOLUME_TO_XP_RATIO
 *           × setModifier            (warmup / dropset / failure / exercise mult)
 *           × classMult (clamped)    (RPG class bonuses)
 *           × equipmentMult (clamped)(loot bonuses from equipped items)
 *   perMuscle = baseXp × involvement.weight × muscleStatusModifier
 */
export function computeSetXp(
  set: WorkoutSet,
  exercise: Exercise,
  muscleStats: Record<MuscleGroupId, MuscleGroupStats>,
  userBodyweightKg: number,
  playerClass: PlayerClass,
  currentStreak: number,
  equipped: Record<EquipmentSlot, EquipmentItem | null>,
): SetXpBreakdown {
  const volume = computeSetVolume(set, exercise, userBodyweightKg);
  const setModifier = computeSetModifier(set, exercise);

  const ctx: ClassBonusContext = {
    set,
    exercise,
    userBodyweightKg,
    currentStreak,
  };

  const classCalc = computeClassMultiplier(playerClass, ctx);
  const equipmentCalc = computeEquipmentMultiplier(equipped, ctx);

  const baseXp =
    volume *
    VOLUME_TO_XP_RATIO *
    setModifier *
    classCalc.multiplier *
    equipmentCalc.multiplier;

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

    classMultiplier: classCalc.multiplier,
    classMultiplierRaw: classCalc.rawMultiplier,
    classMultiplierClamped: classCalc.clamped,
    classBonusesApplied: classCalc.applied,

    equipmentMultiplier: equipmentCalc.multiplier,
    equipmentMultiplierRaw: equipmentCalc.rawMultiplier,
    equipmentMultiplierClamped: equipmentCalc.clamped,
    equipmentBonusesApplied: equipmentCalc.applied,

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
  // Diminishing returns: muscles past the maturity threshold take less XP.
  let effectiveDelta = xpDelta;
  if (xpDelta > 0 && stats.xp >= MUSCLE_XP_MATURITY_THRESHOLD) {
    effectiveDelta = xpDelta * (1 - MUSCLE_XP_MATURITY_REDUCTION);
  }

  const { level, xp, xpToNextLevel } = applyXpToLevel(
    stats.level,
    stats.xp,
    effectiveDelta,
  );
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

// ===========================================================================
// Personal Records
// ===========================================================================

/** Epley formula for estimated 1-rep max. */
export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Update (or create) the PR for a given exerciseId based on a freshly-logged
 * set. Returns the new PR + a flag set to true when *any* metric improved.
 */
export function updatePersonalRecord(
  existing: PersonalRecord | undefined,
  set: WorkoutSet,
  exerciseId: string,
  effectiveWeight: number,
  now: number,
): { pr: PersonalRecord; improved: boolean; pending: boolean } {
  const volume = effectiveWeight * set.reps;
  const e1rm = estimated1RM(effectiveWeight, set.reps);

  const base: PersonalRecord = existing ?? {
    exerciseId,
    bestWeight: 0,
    bestReps: 0,
    bestVolume: 0,
    bestEstimated1RM: 0,
    lastUpdatedAt: 0,
  };

  const bestWeight = Math.max(base.bestWeight, effectiveWeight);
  const bestReps = Math.max(base.bestReps, set.reps);
  const bestVolume = Math.max(base.bestVolume, volume);
  const bestEstimated1RM = Math.max(base.bestEstimated1RM, e1rm);

  const improved =
    bestWeight > base.bestWeight ||
    bestReps > base.bestReps ||
    bestVolume > base.bestVolume ||
    bestEstimated1RM > base.bestEstimated1RM;

  // --- Security protocol: aberrant progression filter ---------------------
  // Any single metric jumping by >25% in one session is flagged as pending.
  // The record is still stored (the number becomes the new best), but the
  // UI should not award glow or the bonus XP until confirmed.
  let pending = false;
  if (improved && base.bestWeight > 0) {
    const weightJump = effectiveWeight / base.bestWeight - 1;
    const volumeJump = volume / Math.max(1, base.bestVolume) - 1;
    const e1rmJump = e1rm / Math.max(1, base.bestEstimated1RM) - 1;
    if (weightJump > 0.25 || volumeJump > 0.25 || e1rmJump > 0.25) {
      pending = true;
    }
  }

  return {
    pr: {
      exerciseId,
      bestWeight,
      bestReps,
      bestVolume,
      bestEstimated1RM,
      lastUpdatedAt: improved ? now : base.lastUpdatedAt,
      pendingValidation: pending || base.pendingValidation,
    },
    improved,
    pending,
  };
}

// ===========================================================================
// Power Level
// ===========================================================================

/**
 * Aggregated "Power Level" (v3) — aligned with the spec formula:
 *
 *   base       = (totalVolumeLifetime / 100)
 *              + (level × 100)
 *              + (Σ tierRankIndex(muscle) × 50)
 *   strength×  = 1 + max(0, peakWeight/bw − 1) × 0.2   (relative strength)
 *   cardio×    = 1 + vo2Bonus + rhrBonus               (conditioning)
 *     · vo2Bonus = clamp((vo2 − 30)/50, 0..1) × 0.15
 *     · rhrBonus = clamp((70 − rbpm)/20, 0..1) × 0.10
 *
 *   PL = round(base × strength× × cardio×)
 *
 * Cardio / strength components degrade gracefully to ×1 when their
 * inputs are missing (fresh profile, no biometrics, no PR).
 */
export function calculatePowerLevel(profile: UserProfile): number {
  const volumeComp = profile.totalVolumeLifetime / 100;
  const levelComp = profile.level * 100;

  // Σ muscle tier rank indices × 50 — reflects the rank ladder, not raw XP.
  let rankComp = 0;
  for (const m of Object.values(profile.muscleStats)) {
    rankComp += tierRankIndex(getMuscleTier(m.xp));
  }
  rankComp = rankComp * 50;

  const base = volumeComp + levelComp + rankComp;

  // ---- Multipliers ----------------------------------------------------

  // Relative strength — best single-set weight vs current bodyweight.
  let peakWeight = 0;
  for (const pr of Object.values(profile.personalRecords)) {
    if (pr.bestWeight > peakWeight) peakWeight = pr.bestWeight;
  }
  const bw = profile.preferences.bodyweightKg ?? 0;
  const strengthMult =
    bw > 0 && peakWeight > 0
      ? 1 + Math.max(0, peakWeight / bw - 1) * 0.2
      : 1;

  // Cardio — VO2max (baseline 30, saturates at 80) + low RHR (< 70 bpm).
  const vo2 = profile.preferences.vo2max ?? 0;
  const rbpm = profile.preferences.restingBpm ?? 0;
  const vo2Bonus = vo2 > 0 ? Math.min(1, Math.max(0, (vo2 - 30) / 50)) * 0.15 : 0;
  const rhrBonus = rbpm > 0 ? Math.min(1, Math.max(0, (70 - rbpm) / 20)) * 0.10 : 0;
  const cardioMult = 1 + vo2Bonus + rhrBonus;

  return Math.round(base * strengthMult * cardioMult);
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
