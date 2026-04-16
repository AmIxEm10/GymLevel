/**
 * Class Evolution — lineage ladder for the 7 player classes.
 * --------------------------------------------------------------
 * Each class has 3 evolution tiers unlocked at player-level 30 / 60 / 90.
 * A player can only evolve WITHIN their original lineage (no cross-class).
 * Each step grants a +5 % bump on the class's passive multipliers
 * (applied at match time in gamificationService via evolutionBonus()).
 */

import type { PlayerClassId } from '@/types';

/** Ordered stage gates (player level → evolutionStage). */
export const EVOLUTION_LEVELS: readonly number[] = [30, 60, 90];

export type EvolutionStage = 0 | 1 | 2 | 3;

/**
 * 4-element tuple per class:
 *   [ base, stage1 (L30), stage2 (L60), stage3 (L90) ]
 */
export const EVOLUTION_CHAIN: Record<
  PlayerClassId,
  readonly [string, string, string, string]
> = {
  novice:    ['Novice',     'Éclaireur',          'Pionnier',            'Transcendant'],
  guerrier:  ['Guerrier',   'Gladiateur',         'Berserker',           'Seigneur de Guerre'],
  assassin:  ['Assassin',   'Silencieux',         'Maître des Ombres',   'Monarque du Vide'],
  tank:      ['Tank',       'Juggernaut',         'Forteresse Vivante',  'Indestructible'],
  ranger:    ['Ranger',     'Traqueur',           'Éclaireur Fantôme',   'Maître du Vent'],
  mage:      ['Mage',       'Archimage',          'Suprématie Arcane',   'Éveillé de la Réalité'],
  healer:    ['Healer',     'Prêtre',             'Saint de la Vitalité', 'Porteur de Vie'],
};

/** French one-liner shown on evolution notification. */
export const EVOLUTION_FLAVOR: Record<PlayerClassId, readonly [string, string, string]> = {
  novice:    [
    'Tes yeux s\'ouvrent sur le Système.',
    'Les chemins interdits t\'apparaissent.',
    'Tu as transcendé ta condition humaine.',
  ],
  guerrier:  [
    'Le sang de l\'arène coule dans tes veines.',
    'La fureur éteint toute peur.',
    'Les champs de bataille te reconnaissent comme leur roi.',
  ],
  assassin:  [
    'Plus personne n\'entend tes pas.',
    'Les ombres obéissent à ton souffle.',
    'Le vide lui-même s\'incline devant toi.',
  ],
  tank:      [
    'Rien ne te bouge plus, même la pierre te craint.',
    'Tu es devenu une forteresse de chair.',
    'Aucune arme, aucune force — rien ne peut te briser.',
  ],
  ranger:    [
    'Tu traques ce qui fuit le regard des autres.',
    'Le vent même trahit sa route pour toi.',
    'Tu règnes là où commence l\'horizon.',
  ],
  mage:      [
    'La magie arcane reconnaît ta voix.',
    'Les lois de la réalité vacillent sous ta main.',
    'Tu vois le monde tel qu\'il est, et tu peux le refaire.',
  ],
  healer:    [
    'Tes mains apaisent les douleurs les plus anciennes.',
    'La mort même hésite quand tu es proche.',
    'Tu es devenu la source — la Vie en personne.',
  ],
};

/** Resolve the display name for a class at the given evolution stage. */
export function getEvolvedClassName(
  classId: PlayerClassId,
  stage: EvolutionStage,
): string {
  const chain = EVOLUTION_CHAIN[classId];
  return chain[stage] ?? chain[0];
}

/** Get the eligible evolution stage for a given player level (0..3). */
export function getStageForLevel(level: number): EvolutionStage {
  if (level >= 90) return 3;
  if (level >= 60) return 2;
  if (level >= 30) return 1;
  return 0;
}

/**
 * Multiplicative bonus applied on top of class bonuses.
 *   stage 0 → 1.00
 *   stage 1 → 1.05
 *   stage 2 → 1.10
 *   stage 3 → 1.15
 */
export function evolutionBonus(stage: EvolutionStage): number {
  return 1 + stage * 0.05;
}

/** True if the player qualifies to evolve further. */
export function canEvolve(level: number, currentStage: EvolutionStage): boolean {
  return getStageForLevel(level) > currentStage;
}
