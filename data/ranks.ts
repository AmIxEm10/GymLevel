/**
 * Shared rank module — Solo Leveling style E → S.
 * Rank thresholds are tuned against the global-level curve in
 * constants/gamification.ts. Higher rank = higher expected output.
 */

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export const RANK_ORDER: Record<Rank, number> = {
  E: 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
};

export const RANKS_IN_ORDER: readonly Rank[] = ['E', 'D', 'C', 'B', 'A', 'S'];

export interface RankMeta {
  color: string;
  glow: string;
  tagline: string;
}

export const RANK_META: Record<Rank, RankMeta> = {
  E: { color: '#64748B', glow: '#94A3B8', tagline: 'Éveillé récent' },
  D: { color: '#22C55E', glow: '#4ADE80', tagline: 'Chasseur confirmé' },
  C: { color: '#22D3EE', glow: '#67E8F9', tagline: 'Traqueur d\'ombres' },
  B: { color: '#A855F7', glow: '#C084FC', tagline: 'Lame des Abysses' },
  A: { color: '#F97316', glow: '#FB923C', tagline: 'Élite du Système' },
  S: { color: '#FBBF24', glow: '#FDE68A', tagline: 'Monarque' },
};

/** Map global level → Rank. */
export function computeRank(level: number): Rank {
  if (level >= 61) return 'S';
  if (level >= 36) return 'A';
  if (level >= 21) return 'B';
  if (level >= 11) return 'C';
  if (level >= 6) return 'D';
  return 'E';
}

/** Shift a rank by `offset` steps (clamped to E…S). */
export function shiftRank(rank: Rank, offset: number): Rank {
  const next = Math.max(0, Math.min(5, RANK_ORDER[rank] + offset));
  return RANKS_IN_ORDER[next]!;
}
