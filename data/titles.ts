import type { Title } from '@/types';

/**
 * Catalog of unlockable Titles. Each entry declares:
 *   - unlock condition (checked at endSession)
 *   - visual color + wording
 *   - effectId consumed by the XP / recovery / fatigue pipelines
 *
 * The store reads this list at endSession(), unlocks any title whose
 * condition matches, then the UI lets the user set it as activeTitleId.
 */
export const TITLES: readonly Title[] = [
  {
    id: 'chasseur_aube',
    name: "Chasseur de l'Aube",
    description: 'Tu t\'éveilles avant le soleil. Les ombres te connaissent.',
    unlockHint: 'Termine une séance avant 7:00 du matin.',
    effectDescription: '+10 % XP sur les séries effectuées entre 5h et 10h.',
    effectId: 'morning_xp_boost',
    colorHex: '#FBBF24', // gold
    condition: { kind: 'session_ended_before_hour', hour: 7 },
  },
  {
    id: 'briseur_limites',
    name: 'Briseur de Limites',
    description: 'Tu as brisé tes propres chaînes en une seule traversée.',
    unlockHint: 'Bats 5 records personnels (PR) dans une même séance.',
    effectDescription: '+5 % au taux de récupération passive.',
    effectId: 'recovery_boost_5',
    colorHex: '#F97316', // orange néon
    condition: { kind: 'session_prs', minCount: 5 },
  },
  {
    id: 'ami_muscles',
    name: 'Ami des Muscles',
    description: 'Tes muscles te chantent des louanges.',
    unlockHint: 'Termine 3 séances avec une fatigue globale quasi nulle.',
    effectDescription: 'Fatigue globale affichée réduite de 10 points.',
    effectId: 'fatigue_reduction_10',
    colorHex: '#22D3A4', // vert Healer
    condition: { kind: 'zero_fatigue_sessions', count: 3 },
  },
];

export const TITLES_BY_ID: Record<string, Title> = TITLES.reduce(
  (acc, t) => { acc[t.id] = t; return acc; },
  {} as Record<string, Title>,
);

export function getTitle(id: string | null): Title | null {
  if (!id) return null;
  return TITLES_BY_ID[id] ?? null;
}
