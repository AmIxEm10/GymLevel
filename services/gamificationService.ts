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
