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
 * Default hourly passive recovery rate — 2 % of the 24 h window per hour.
 * Classes with a `passiveEffects.recoveryRate` (e.g. Healer → 0.04) override
 * this; see recoveryRateForProfile().
 */
export const HOURLY_RECOVERY_RATE = 0.02;

/** Resolve the active recovery rate for a given profile (class + title aware). */
export function recoveryRateForProfile(profile: UserProfile): number {
  // Lazy require to avoid a cycle with data/playerClasses → types → this.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getPlayerClass } = require('@/data/playerClasses');
  const cls = getPlayerClass(profile.playerClassId);
  let rate = cls?.passiveEffects?.recoveryRate ?? HOURLY_RECOVERY_RATE;

  // "Briseur de Limites" title → +5 % on top of the base rate.
  if (profile.activeTitleId === 'briseur_limites') {
    rate += 0.005;
  }
  return rate;
}

/**
 * Rebuild volumeLast24h / volumeLast7d for a muscle given its lastTrainedAt.
 * Continuous (linear) decay at the given `recoveryRate` per hour.
 */
export function decayRollingVolumes(
  stats: MuscleGroupStats,
  now: number,
  recoveryRate: number = HOURLY_RECOVERY_RATE,
): MuscleGroupStats {
  const since = stats.lastTrainedAt ?? 0;
  if (since === 0) return stats;

  const hoursSince = (now - since) / MS_PER_HOUR;

  const decayFactor = Math.min(1, hoursSince * recoveryRate);

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
// Status re-evaluation — PR-aware (spec V1)
// ---------------------------------------------------------------------------

/**
 * Status thresholds expressed as fractions of the user's peakVolumePr.
 * Combined with the 2 %/h decay in decayRollingVolumes(), the muscle
 * status naturally ramps down in real time without hard clocks.
 *
 *   volumeLast24h / peakVolumePr
 *     < 0.05  →  frais
 *     < 0.30  →  actif
 *     < 0.70  →  fatigue
 *     ≥ 0.70  →  epuise
 */
export const STATUS_VOLUME_RATIO = {
  FRAIS_MAX:   0.05,
  ACTIF_MAX:   0.30,
  FATIGUE_MAX: 0.70,
} as const;

export function computeMuscleStatus(
  stats: MuscleGroupStats,
  peakVolumePr: number,
): MuscleStatus {
  // Fallback for users with no PR yet — use the legacy absolute threshold
  // (kg per muscle size bucket) so fresh profiles still behave sanely.
  const peak =
    peakVolumePr > 0 ? peakVolumePr : overloadThreshold(stats.muscleId);

  if (peak <= 0 || stats.volumeLast24h <= 0) return 'frais';

  const ratio = stats.volumeLast24h / peak;
  if (ratio >= STATUS_VOLUME_RATIO.FATIGUE_MAX) return 'epuise';
  if (ratio >= STATUS_VOLUME_RATIO.ACTIF_MAX)   return 'fatigue';
  if (ratio >= STATUS_VOLUME_RATIO.FRAIS_MAX)   return 'actif';
  return 'frais';
}

/**
 * Recompute status for every muscle.
 * Reads the profile's personalRecords to get the `peakVolumePr` anchor.
 */
export function refreshAllMuscleStatuses(
  profile: UserProfile,
  now: number,
): UserProfile {
  // Derive the global peak volume PR across all tracked exercises.
  let peakVolumePr = 0;
  for (const pr of Object.values(profile.personalRecords)) {
    if (pr.bestVolume > peakVolumePr) peakVolumePr = pr.bestVolume;
  }

  // Class-aware recovery rate (Healer doubles it, etc.).
  const recoveryRate = recoveryRateForProfile(profile);

  const nextStats = { ...profile.muscleStats };
  for (const id of ALL_MUSCLE_IDS) {
    const decayed = decayRollingVolumes(nextStats[id], now, recoveryRate);
    const newStatus = computeMuscleStatus(decayed, peakVolumePr);
    nextStats[id] = { ...decayed, status: newStatus, statusUntil: null };
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
