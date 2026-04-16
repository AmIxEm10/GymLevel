/**
 * Muscle ranking tiers — Untrained → Legend.
 * Per-muscle XP thresholds determine the visible tier badge.
 * The "Overall Rank" shown on the Muscle Rankings screen uses the SUM
 * of every muscle's XP against OVERALL_TIER_THRESHOLDS (scaled ×10).
 */

export type MuscleTier =
  | 'untrained'
  | 'bronze_1' | 'bronze_2' | 'bronze_3'
  | 'silver_1' | 'silver_2' | 'silver_3'
  | 'gold_1' | 'gold_2' | 'gold_3'
  | 'platinum_1' | 'platinum_2' | 'platinum_3'
  | 'diamond_1' | 'diamond_2' | 'diamond_3'
  | 'master'
  | 'legend';

export const TIER_ORDER: readonly MuscleTier[] = [
  'untrained',
  'bronze_1', 'bronze_2', 'bronze_3',
  'silver_1', 'silver_2', 'silver_3',
  'gold_1', 'gold_2', 'gold_3',
  'platinum_1', 'platinum_2', 'platinum_3',
  'diamond_1', 'diamond_2', 'diamond_3',
  'master',
  'legend',
];

/** Per-muscle XP thresholds. Reaching the threshold promotes to that tier. */
export const MUSCLE_TIER_XP: Record<MuscleTier, number> = {
  untrained:   0,
  bronze_1:    200,
  bronze_2:    500,
  bronze_3:    1000,
  silver_1:    2000,
  silver_2:    3500,
  silver_3:    5500,
  gold_1:      8000,
  gold_2:      12000,
  gold_3:      17000,
  platinum_1:  23000,
  platinum_2:  30000,
  platinum_3:  38000,
  diamond_1:   47000,
  diamond_2:   57000,
  diamond_3:   70000,
  master:      90000,
  legend:      120000,
};

/** Overall rank thresholds — applied to Σ muscle XP. ×10 the muscle scale. */
export const OVERALL_TIER_XP: Record<MuscleTier, number> = Object.fromEntries(
  Object.entries(MUSCLE_TIER_XP).map(([k, v]) => [k, v * 10]),
) as Record<MuscleTier, number>;

export interface TierMeta {
  label: string;
  shortLabel: string;
  color: string;        // main badge colour
  glow: string;         // shadow neon colour
  family: 'untrained' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'legend';
}

export const TIER_META: Record<MuscleTier, TierMeta> = {
  untrained:   { label: 'Untrained',   shortLabel: 'UT', color: '#475569', glow: '#64748B', family: 'untrained' },
  bronze_1:    { label: 'Bronze I',    shortLabel: 'B1', color: '#B45309', glow: '#F97316', family: 'bronze' },
  bronze_2:    { label: 'Bronze II',   shortLabel: 'B2', color: '#C2410C', glow: '#F97316', family: 'bronze' },
  bronze_3:    { label: 'Bronze III',  shortLabel: 'B3', color: '#EA580C', glow: '#FB923C', family: 'bronze' },
  silver_1:    { label: 'Silver I',    shortLabel: 'S1', color: '#94A3B8', glow: '#CBD5E1', family: 'silver' },
  silver_2:    { label: 'Silver II',   shortLabel: 'S2', color: '#9CA3AF', glow: '#D1D5DB', family: 'silver' },
  silver_3:    { label: 'Silver III',  shortLabel: 'S3', color: '#E5E7EB', glow: '#F3F4F6', family: 'silver' },
  gold_1:      { label: 'Gold I',      shortLabel: 'G1', color: '#D97706', glow: '#FBBF24', family: 'gold' },
  gold_2:      { label: 'Gold II',     shortLabel: 'G2', color: '#EAB308', glow: '#FACC15', family: 'gold' },
  gold_3:      { label: 'Gold III',    shortLabel: 'G3', color: '#FBBF24', glow: '#FDE68A', family: 'gold' },
  platinum_1:  { label: 'Platinum I',  shortLabel: 'P1', color: '#22D3EE', glow: '#67E8F9', family: 'platinum' },
  platinum_2:  { label: 'Platinum II', shortLabel: 'P2', color: '#06B6D4', glow: '#22D3EE', family: 'platinum' },
  platinum_3:  { label: 'Platinum III',shortLabel: 'P3', color: '#0891B2', glow: '#22D3EE', family: 'platinum' },
  diamond_1:   { label: 'Diamond I',   shortLabel: 'D1', color: '#818CF8', glow: '#A5B4FC', family: 'diamond' },
  diamond_2:   { label: 'Diamond II',  shortLabel: 'D2', color: '#6366F1', glow: '#818CF8', family: 'diamond' },
  diamond_3:   { label: 'Diamond III', shortLabel: 'D3', color: '#4F46E5', glow: '#6366F1', family: 'diamond' },
  master:      { label: 'Master',      shortLabel: 'M',  color: '#A855F7', glow: '#C084FC', family: 'master' },
  legend:      { label: 'Legend',      shortLabel: 'L',  color: '#F43F5E', glow: '#FB7185', family: 'legend' },
};

/** Unique tier families in display order — used by the "ladder" at top of screen. */
export const TIER_FAMILIES: Array<{
  id: TierMeta['family'];
  label: string;
  color: string;
  glow: string;
}> = [
  { id: 'bronze',   label: 'Bronze',   color: '#EA580C', glow: '#FB923C' },
  { id: 'silver',   label: 'Silver',   color: '#CBD5E1', glow: '#E5E7EB' },
  { id: 'gold',     label: 'Gold',     color: '#FBBF24', glow: '#FDE68A' },
  { id: 'platinum', label: 'Platinum', color: '#22D3EE', glow: '#67E8F9' },
  { id: 'diamond',  label: 'Diamond',  color: '#818CF8', glow: '#A5B4FC' },
  { id: 'master',   label: 'Master',   color: '#A855F7', glow: '#C084FC' },
  { id: 'legend',   label: 'Legend',   color: '#F43F5E', glow: '#FB7185' },
];

/** Resolve the tier for a given XP amount (per muscle). */
export function getMuscleTier(xp: number): MuscleTier {
  let current: MuscleTier = 'untrained';
  for (const tier of TIER_ORDER) {
    if (xp >= MUSCLE_TIER_XP[tier]) current = tier;
    else break;
  }
  return current;
}

/** Resolve the overall (global) tier for a given total XP. */
export function getOverallTier(totalXp: number): MuscleTier {
  let current: MuscleTier = 'untrained';
  for (const tier of TIER_ORDER) {
    if (totalXp >= OVERALL_TIER_XP[tier]) current = tier;
    else break;
  }
  return current;
}

/** Next tier + XP gap ahead of the current tier. null when at Legend. */
export function getNextTier(
  current: MuscleTier,
  scale: 'muscle' | 'overall' = 'muscle',
): { tier: MuscleTier; requiredXp: number } | null {
  const idx = TIER_ORDER.indexOf(current);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  const next = TIER_ORDER[idx + 1]!;
  const table = scale === 'muscle' ? MUSCLE_TIER_XP : OVERALL_TIER_XP;
  return { tier: next, requiredXp: table[next] };
}

/** Progress 0..1 toward the next tier, per-muscle. */
export function progressWithinTier(
  xp: number,
  scale: 'muscle' | 'overall' = 'muscle',
): { current: MuscleTier; next: MuscleTier | null; ratio: number; xpIntoTier: number; xpForTier: number } {
  const current = scale === 'muscle' ? getMuscleTier(xp) : getOverallTier(xp);
  const next = getNextTier(current, scale);
  const table = scale === 'muscle' ? MUSCLE_TIER_XP : OVERALL_TIER_XP;
  const currentFloor = table[current];
  if (!next) {
    return { current, next: null, ratio: 1, xpIntoTier: xp - currentFloor, xpForTier: 0 };
  }
  const nextFloor = table[next.tier];
  const span = Math.max(1, nextFloor - currentFloor);
  const xpIntoTier = Math.max(0, xp - currentFloor);
  const ratio = Math.min(1, xpIntoTier / span);
  return { current, next: next.tier, ratio, xpIntoTier, xpForTier: span };
}
