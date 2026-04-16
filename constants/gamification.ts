/**
 * Gamification tuning constants.
 * Every magic number that drives the RPG loop lives HERE so we can balance
 * the game without hunting through the codebase.
 */

// ---------- Leveling curve -------------------------------------------------

/** Base XP required to clear level 1. Growth is exponential. */
export const BASE_XP_PER_LEVEL = 100;

/**
 * xpToNextLevel(n) = BASE * n^LEVEL_EXPONENT
 * 1.8 exponent → Lv10 ≈ 6 300 XP, Lv20 ≈ 21 000 XP, Lv50 ≈ 118 000 XP.
 * Nerf from 1.5 to 1.8 slows progression and makes each level meaningful.
 */
export const LEVEL_EXPONENT = 1.8;

/** Hard cap — beyond this, XP still accumulates but level display stops. */
export const MAX_LEVEL = 99;

// ---------- Volume → XP ----------------------------------------------------

/**
 * Core formula: XP gained by a set = reps * weight * VOLUME_TO_XP_RATIO.
 * Nerfed from 1.0 to 0.5 so 1 000 kg of volume now yields 500 XP instead
 * of 1 000 — alignment with the steeper level curve.
 */
export const VOLUME_TO_XP_RATIO = 0.5;

// ---------- Muscle XP diminishing returns ---------------------------------

/**
 * Above this XP threshold, gains on a single muscle are shaved by
 * MUSCLE_XP_MATURITY_REDUCTION (diminishing returns). The rich get less
 * rich — encourages balanced training across groups.
 */
export const MUSCLE_XP_MATURITY_THRESHOLD = 5000;
export const MUSCLE_XP_MATURITY_REDUCTION = 0.3; // 30 % shaved past threshold

/** Warmup sets award a fraction of the XP. */
export const WARMUP_XP_MULTIPLIER = 0.2;

/** Dropsets get a small bonus for intensity. */
export const DROPSET_XP_MULTIPLIER = 1.1;

/** Set taken to failure. */
export const FAILURE_XP_MULTIPLIER = 1.15;

/** Compound lift global multiplier (applied on top of exercise.xpMultiplier). */
export const COMPOUND_GLOBAL_MULTIPLIER = 1.0;

/**
 * Maximum stacked class bonus multiplier.
 * A class like Tank can trigger several bonuses on the same set; their product
 * is clamped to this value so the XP economy cannot explode when conditions
 * align perfectly. 1.5 = +50% hard cap.
 */
export const MAX_CLASS_MULTIPLIER = 1.5;

/**
 * Maximum stacked equipment bonus multiplier.
 * Applied independently from the class cap — a fully geared character can
 * reach classMult × equipmentMult ≈ 1.5 × 1.3 = 1.95× XP on a perfect set.
 */
export const MAX_EQUIPMENT_MULTIPLIER = 1.3;

/**
 * Maximum stacked ItemSet bonus multiplier. Prevents panoplies from
 * combining into runaway XP gains.
 */
export const MAX_SET_MULTIPLIER = 1.25;

// ---------- Recovery / Status ---------------------------------------------

/** Thresholds (hours since lastTrainedAt) at which a muscle moves status. */
export const STATUS_HOURS = {
  EPUISE_TO_FATIGUE: 24,   // after 24h of rest, 'épuisé' -> 'fatigué'
  FATIGUE_TO_ACTIF: 48,
  ACTIF_TO_FRAIS: 72,
} as const;

/**
 * Overload detection — a muscle trained above this volume in the rolling
 * 24h window becomes 'épuisé'. Values are in kg and approximate, per muscle
 * size. The service reads BASE_OVERLOAD_VOLUME and scales by muscle size.
 */
export const OVERLOAD_VOLUME_24H = {
  LARGE: 8000,   // chest, back, legs
  MEDIUM: 4000,  // shoulders subgroups, arms
  SMALL: 2000,   // calves, forearms, obliques
} as const;

/** XP gains are halved while 'épuisé'. */
export const EXHAUSTED_XP_MULTIPLIER = 0.5;

/** 'fatigué' state still earns full XP but flags the UI. */
export const FATIGUE_XP_MULTIPLIER = 1.0;

// ---------- Deconditioning (Mode Survie) ----------------------------------

/** Muscles not trained for this many days start losing XP. */
export const DECONDITIONING_THRESHOLD_DAYS = 7;

/** Base penalty applied each day past the threshold. */
export const DECONDITIONING_DAILY_PENALTY = 0.02; // 2% of current XP per day

/** Cap the total penalty applied in a single check (safety rail). */
export const DECONDITIONING_MAX_PENALTY = 0.5;    // max 50% loss in one check

/** Deconditioning is evaluated at most once per N hours. */
export const DECONDITIONING_CHECK_COOLDOWN_HOURS = 12;

// ---------- Daily Quests ---------------------------------------------------

/** Number of quests generated per day. */
export const DAILY_QUEST_COUNT = 3;

/**
 * XP reward ranges per difficulty.
 * Nerfed by 40 % (previously 50 / 150 / 400 / 1000) to align with the
 * slower progression curve.
 */
export const QUEST_XP_REWARDS = {
  easy: 30,
  medium: 90,
  hard: 240,
  epic: 600,
} as const;

/** Minimum hour (local time) at which stale quests are replaced. */
export const QUEST_REFRESH_HOUR = 4;

// ---------- Streaks --------------------------------------------------------

export const STREAK_XP_BONUS_PER_DAY = 25;
export const STREAK_MAX_BONUS_DAYS = 14;

// ---------- Bodyweight bounds (validated at onboarding) -------------------

export const BODYWEIGHT_MIN_KG = 25;
export const BODYWEIGHT_MAX_KG = 300;
