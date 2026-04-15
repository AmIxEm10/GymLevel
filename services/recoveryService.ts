/**
 * recoveryService.ts
 * ------------------
 * Two responsibilities:
 *   1. Deconditioning (Mode Survie) — applied on app launch.
 *      A muscle untouched for > N days leaks XP.
 *   2. Recovery status recalculation — updates each muscle's
 *      'frais' | 'actif' | 'fatigue' | 'epuise' status based on
 *      recent volume and time since last session.
 *
 * All functions are pure (input state in → new state out).
 */

import type {
  DeconditioningCheckResult,
  MuscleGroupId,
  MuscleGroupStats,
  MuscleStatus,
  UserProfile,
} from '@/types';
import {
  DECONDITIONING_CHECK_COOLDOWN_HOURS,
  DECONDITIONING_DAILY_PENALTY,
  DECONDITIONING_MAX_PENALTY,
  DECONDITIONING_THRESHOLD_DAYS,
  OVERLOAD_VOLUME_24H,
  STATUS_HOURS,
} from '@/constants/gamification';
import { ALL_MUSCLE_IDS, MUSCLE_SIZE } from '@/data/muscleGroups';
import { applyXpToLevel } from './gamificationService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

function overloadThreshold(muscleId: MuscleGroupId): number {
  const size = MUSCLE_SIZE[muscleId];
  if (size === 'large')  return OVERLOAD_VOLUME_24H.LARGE;
  if (size === 'medium') return OVERLOAD_VOLUME_24H.MEDIUM;
  return OVERLOAD_VOLUME_24H.SMALL;
}

// ---------------------------------------------------------------------------
// Rolling-window rebuild
// ---------------------------------------------------------------------------

/**
 * Hourly passive recovery rate — 2 % of the 24 h window recovers per hour.
 * Full passive recovery from overload ≈ 50 h without training.
 */
export const HOURLY_RECOVERY_RATE = 0.02;

/**
 * Rebuild volumeLast24h / volumeLast7d for a muscle given its lastTrainedAt.
 * Continuous (linear) decay at HOURLY_RECOVERY_RATE per hour. The 7-day
 * window still resets hard at the boundary — overload happens on 24 h
 * which is the important signal.
 */
export function decayRollingVolumes(
  stats: MuscleGroupStats,
  now: number,
): MuscleGroupStats {
  const since = stats.lastTrainedAt ?? 0;
  if (since === 0) return stats;

  const hoursSince = (now - since) / MS_PER_HOUR;

  const decayFactor = Math.min(1, hoursSince * HOURLY_RECOVERY_RATE);

  const next: MuscleGroupStats = {
    ...stats,
    volumeLast24h: Math.max(0, stats.volumeLast24h * (1 - decayFactor)),
  };

  if (hoursSince / 24 >= 7) {
    next.volumeLast7d = 0;
    next.sessionsLast7d = 0;
  }
  return next;
}

// ---------------------------------------------------------------------------
// Status re-evaluation
// ---------------------------------------------------------------------------

export function computeMuscleStatus(
  stats: MuscleGroupStats,
  now: number,
): MuscleStatus {
  // 1. Overload -> 'epuise' overrides everything
  if (stats.volumeLast24h >= overloadThreshold(stats.muscleId)) {
    return 'epuise';
  }

  // 2. If currently 'epuise' and the status is still locked in, keep it
  if (stats.status === 'epuise' && stats.statusUntil && stats.statusUntil > now) {
    return 'epuise';
  }

  // 3. Time-based decay of freshness
  if (!stats.lastTrainedAt) return 'frais';
  const hoursSince = (now - stats.lastTrainedAt) / MS_PER_HOUR;

  if (hoursSince < STATUS_HOURS.EPUISE_TO_FATIGUE)  return 'fatigue';
  if (hoursSince < STATUS_HOURS.FATIGUE_TO_ACTIF)   return 'actif';
  // hoursSince < STATUS_HOURS.ACTIF_TO_FRAIS -> 'frais' after threshold
  if (hoursSince < STATUS_HOURS.ACTIF_TO_FRAIS)     return 'actif';
  return 'frais';
}

/** Recompute status for every muscle. */
export function refreshAllMuscleStatuses(
  profile: UserProfile,
  now: number,
): UserProfile {
  const nextStats = { ...profile.muscleStats };
  for (const id of ALL_MUSCLE_IDS) {
    const decayed = decayRollingVolumes(nextStats[id], now);
    const newStatus = computeMuscleStatus(decayed, now);

    // When entering 'epuise', lock until tomorrow.
    const statusUntil =
      newStatus === 'epuise' && decayed.status !== 'epuise'
        ? now + MS_PER_DAY
        : newStatus === 'epuise'
        ? decayed.statusUntil
        : null;

    nextStats[id] = { ...decayed, status: newStatus, statusUntil };
  }
  return { ...profile, muscleStats: nextStats };
}

// ---------------------------------------------------------------------------
// Deconditioning (Mode Survie)
// ---------------------------------------------------------------------------

export interface DeconditioningOptions {
  /** Override the cooldown — useful for tests. */
  skipCooldown?: boolean;
}

/** Should we even run the deconditioning pass right now? */
export function shouldRunDeconditioningCheck(
  profile: UserProfile,
  now: number,
  opts?: DeconditioningOptions,
): boolean {
  if (opts?.skipCooldown) return true;

  // Find the most recent deconditioning application across ALL muscles
  let mostRecent = 0;
  for (const id of ALL_MUSCLE_IDS) {
    const ts = profile.muscleStats[id].lastDeconditioningAppliedAt ?? 0;
    if (ts > mostRecent) mostRecent = ts;
  }

  const hoursSince = (now - mostRecent) / MS_PER_HOUR;
  return hoursSince >= DECONDITIONING_CHECK_COOLDOWN_HOURS;
}

/**
 * Apply the deconditioning penalty to stale muscles.
 * Returns a new profile and a structured report for UI/notifications.
 */
export function runDeconditioningCheck(
  profile: UserProfile,
  now: number,
): { profile: UserProfile; result: DeconditioningCheckResult } {
  const penalties: DeconditioningCheckResult['penalties'] = [];
  const nextStats = { ...profile.muscleStats };

  let totalGlobalXpLost = 0;

  for (const id of ALL_MUSCLE_IDS) {
    const stats = nextStats[id];
    if (!stats.lastTrainedAt) continue; // never trained -> nothing to decay

    const daysSince = Math.floor((now - stats.lastTrainedAt) / MS_PER_DAY);
    if (daysSince <= DECONDITIONING_THRESHOLD_DAYS) continue;

    const daysOver = daysSince - DECONDITIONING_THRESHOLD_DAYS;

    // Apply only for the days that haven't been billed yet.
    const lastApplied = stats.lastDeconditioningAppliedAt ?? 0;
    const daysAlreadyApplied =
      lastApplied > 0
        ? Math.floor((lastApplied - stats.lastTrainedAt) / MS_PER_DAY) -
          DECONDITIONING_THRESHOLD_DAYS
        : 0;
    const newDays = Math.max(0, daysOver - Math.max(0, daysAlreadyApplied));
    if (newDays === 0) continue;

    const penaltyRate = Math.min(
      DECONDITIONING_MAX_PENALTY,
      newDays * DECONDITIONING_DAILY_PENALTY,
    );

    const xpBefore = stats.xp;
    const xpLost = Math.round(xpBefore * penaltyRate);
    if (xpLost <= 0) continue;

    const updated = applyXpToLevel(stats.level, stats.xp, -xpLost);

    nextStats[id] = {
      ...stats,
      xp: updated.xp,
      level: updated.level,
      xpToNextLevel: updated.xpToNextLevel,
      lastDeconditioningAppliedAt: now,
    };

    totalGlobalXpLost += xpLost;

    penalties.push({
      muscleId: id,
      daysInactive: daysSince,
      xpBefore,
      xpLost,
      xpAfter: updated.xp,
    });
  }

  // Global profile XP is kept in sync — penalty affects the big gauge too.
  const globalAfter = applyXpToLevel(
    profile.level,
    profile.totalXp,
    -totalGlobalXpLost,
  );

  const nextProfile: UserProfile = {
    ...profile,
    muscleStats: nextStats,
    totalXp: globalAfter.xp,
    level: globalAfter.level,
    xpToNextLevel: globalAfter.xpToNextLevel,
  };

  return {
    profile: nextProfile,
    result: { checkedAt: now, penalties },
  };
}
