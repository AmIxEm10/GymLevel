import type { Title } from '@/types';

/**
 * Catalog of unlockable Titles. Each entry declares:
 *   - unlock condition (checked at endSession)
 *   - visual color + wording
 *   - effectId consumed by the XP / recovery / fatigue pipelines
 *
 * The store reads this list at endSession(), unlocks any title whose
 * condition matches, then the UI lets the user set it as activeTitleId.
 *
 * V1.2 — expanded to 13 titles. New entries reuse the existing effectIds:
 *   morning_xp_boost       (chasseur_aube, eveille_rouge)
 *   recovery_boost_5       (briseur_limites, architecte_fer, marathonien,
 *                           ame_erante)
 *   fatigue_reduction_10   (ami_muscles, veilleur_nuit, main_douce,
 *                           rune_respiration, symbiose_parfaite,
 *                           barde_silencieux, gardien_lune)
 *
 * Conditions re-use session_ended_before_hour / session_prs /
 * zero_fatigue_sessions thresholds with new tunings.
 */
export const TITLES: readonly Title[] = [
  // ================================================ ORIGINAL TRIO
  {
    id: 'chasseur_aube',
    name: "Chasseur de l'Aube",
    description: "Tu t'éveilles avant le soleil. Les ombres te connaissent.",
    unlockHint: 'Termine une séance avant 7:00 du matin.',
    effectDescription: '+10 % XP sur les séries effectuées entre 5h et 10h.',
    effectId: 'morning_xp_boost',
    colorHex: '#FBBF24',
    condition: { kind: 'session_ended_before_hour', hour: 7 },
    category: 'progression',
  },
  {
    id: 'briseur_limites',
    name: 'Briseur de Limites',
    description: 'Tu as brisé tes propres chaînes en une seule traversée.',
    unlockHint: 'Bats 5 records personnels (PR) dans une même séance.',
    effectDescription: '+5 % au taux de récupération passive.',
    effectId: 'recovery_boost_5',
    colorHex: '#F97316',
    condition: { kind: 'session_prs', minCount: 5 },
    category: 'feats',
  },
  {
    id: 'ami_muscles',
    name: 'Ami des Muscles',
    description: 'Tes muscles te chantent des louanges.',
    unlockHint: 'Termine 3 séances avec une fatigue globale quasi nulle.',
    effectDescription: 'Fatigue globale affichée réduite de 10 points.',
    effectId: 'fatigue_reduction_10',
    colorHex: '#22D3A4',
    condition: { kind: 'zero_fatigue_sessions', count: 3 },
    category: 'progression',
  },

  // ================================================ V1.2 EXPANSION
  {
    id: 'eveille_rouge',
    name: 'Éveillé Rouge',
    description: 'Tu défies le soleil levant. Le ciel vire au pourpre.',
    unlockHint: 'Termine une séance avant 6:00 du matin.',
    effectDescription: '+10 % XP sur les séries effectuées entre 5h et 10h.',
    effectId: 'morning_xp_boost',
    colorHex: '#EF4444',
    condition: { kind: 'session_ended_before_hour', hour: 6 },
    category: 'feats',
  },
  {
    id: 'architecte_fer',
    name: 'Architecte de Fer',
    description: 'Tu as sculpté ton corps comme une cathédrale.',
    unlockHint: 'Bats 8 records personnels dans une même séance.',
    effectDescription: '+5 % au taux de récupération passive.',
    effectId: 'recovery_boost_5',
    colorHex: '#A855F7',
    condition: { kind: 'session_prs', minCount: 8 },
    category: 'feats',
  },
  {
    id: 'marathonien',
    name: 'Le Marathonien',
    description: 'Les kilomètres ne t\'effraient plus. Le rythme est ta prière.',
    unlockHint: 'Bats 3 records personnels dans une même séance longue.',
    effectDescription: '+5 % au taux de récupération passive.',
    effectId: 'recovery_boost_5',
    colorHex: '#10B981',
    condition: { kind: 'session_prs', minCount: 3 },
    category: 'progression',
  },
  {
    id: 'ame_erante',
    name: 'Âme Errante',
    description: 'Tu voyages entre les séances comme les esprits entre les mondes.',
    unlockHint: 'Bats 10 records personnels dans une même séance.',
    effectDescription: '+5 % au taux de récupération passive.',
    effectId: 'recovery_boost_5',
    colorHex: '#67E8F9',
    condition: { kind: 'session_prs', minCount: 10 },
    category: 'feats',
  },
  {
    id: 'veilleur_nuit',
    name: 'Veilleur de Nuit',
    description: 'La lune te garde. Tes muscles ne dorment jamais vraiment.',
    unlockHint: 'Termine 5 séances avec 0 % de fatigue globale.',
    effectDescription: 'Fatigue globale affichée réduite de 10 points.',
    effectId: 'fatigue_reduction_10',
    colorHex: '#6366F1',
    condition: { kind: 'zero_fatigue_sessions', count: 5 },
    category: 'progression',
  },
  {
    id: 'main_douce',
    name: 'Main Douce',
    description: 'Ton contact calme les muscles les plus sauvages.',
    unlockHint: 'Termine 7 séances avec 0 % de fatigue globale.',
    effectDescription: 'Fatigue globale affichée réduite de 10 points.',
    effectId: 'fatigue_reduction_10',
    colorHex: '#F472B6',
    condition: { kind: 'zero_fatigue_sessions', count: 7 },
    category: 'feats',
  },
  {
    id: 'rune_respiration',
    name: 'Rune de Respiration',
    description: "Tu respires comme une rune ancienne — chaque souffle est un sort.",
    unlockHint: 'Termine 10 séances avec 0 % de fatigue globale.',
    effectDescription: 'Fatigue globale affichée réduite de 10 points.',
    effectId: 'fatigue_reduction_10',
    colorHex: '#60A5FA',
    condition: { kind: 'zero_fatigue_sessions', count: 10 },
    category: 'legendary',
  },
  {
    id: 'symbiose_parfaite',
    name: 'Symbiose Parfaite',
    description: 'Tu ne fais plus qu\'un avec ton propre corps.',
    unlockHint: 'Termine 15 séances avec 0 % de fatigue globale.',
    effectDescription: 'Fatigue globale affichée réduite de 10 points.',
    effectId: 'fatigue_reduction_10',
    colorHex: '#E879F9',
    condition: { kind: 'zero_fatigue_sessions', count: 15 },
    category: 'legendary',
  },
  {
    id: 'barde_silencieux',
    name: 'Barde Silencieux',
    description: 'Ton corps est une mélodie que seul le Système entend.',
    unlockHint: 'Termine 20 séances avec 0 % de fatigue globale.',
    effectDescription: 'Fatigue globale affichée réduite de 10 points.',
    effectId: 'fatigue_reduction_10',
    colorHex: '#FDE68A',
    condition: { kind: 'zero_fatigue_sessions', count: 20 },
    category: 'legendary',
  },
  {
    id: 'gardien_lune',
    name: 'Gardien de la Lune',
    description: 'La nuit reconnaît ton passage. Les astres te saluent.',
    unlockHint: 'Termine 30 séances avec 0 % de fatigue globale.',
    effectDescription: 'Fatigue globale affichée réduite de 10 points.',
    effectId: 'fatigue_reduction_10',
    colorHex: '#C0C0C0',
    condition: { kind: 'zero_fatigue_sessions', count: 30 },
    category: 'legendary',
  },
  // ================================================ V1.3 — Reposed Sovereign
  {
    id: 'souverain_repos',
    name: 'Souverain du Repos',
    description:
      'Tu ne charges jamais sans être pleinement rétabli. Le Système salue ta discipline.',
    unlockHint: 'Lance 5 séances en étant parfaitement reposé (fatigue ≤ 5 %).',
    effectDescription: 'Fatigue globale affichée réduite de 10 points.',
    effectId: 'fatigue_reduction_10',
    colorHex: '#A5F3FC',
    condition: { kind: 'fresh_start_sessions', count: 5 },
    category: 'feats',
  },
];

/** Ordered list of categories driving the tab picker on the Profile screen. */
export const TITLE_CATEGORIES: Array<{
  id: 'progression' | 'feats' | 'legendary';
  label: string;
  accent: string;
  glow: string;
}> = [
  { id: 'progression', label: 'Progression', accent: '#22D3EE', glow: '#67E8F9' },
  { id: 'feats',       label: 'Exploits',    accent: '#F97316', glow: '#FDBA74' },
  { id: 'legendary',   label: 'Légende',     accent: '#FBBF24', glow: '#FEF3C7' },
];

export const TITLES_BY_ID: Record<string, Title> = TITLES.reduce(
  (acc, t) => { acc[t.id] = t; return acc; },
  {} as Record<string, Title>,
);

export function getTitle(id: string | null): Title | null {
  if (!id) return null;
  return TITLES_BY_ID[id] ?? null;
}
