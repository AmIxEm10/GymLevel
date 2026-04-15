import type { PlayerClass, PlayerClassId } from '@/types';

/**
 * Chasseur classes — 3 archétypes finaux pour la V1 du Système.
 * Les anciennes classes (novice, fighter, tanker, ranger, mage, healer)
 * sont migrées vers une de ces 3 classes par la migration v4 du store.
 */
export const PLAYER_CLASSES: readonly PlayerClass[] = [
  // ---------------------------------------------------------------- GUERRIER
  {
    id: 'guerrier',
    name: 'Guerrier',
    nameEn: 'Warrior',
    tagline: 'Brise les barres.',
    description:
      'Spécialiste de la force brute. Bonus d\'XP massif sur les mouvements composés lourds à faibles répétitions. Chaque kilo arraché du sol te rend plus puissant.',
    colorHex: '#EF4444',
    icon: '⚔️',
    affinity: {
      categories: ['push', 'pull', 'legs'],
      muscles: ['quadriceps', 'fessiers', 'dorsaux', 'lombaires', 'pectoraux'],
    },
    bonuses: [
      {
        id: 'guerrier_pure_strength',
        label: 'Force pure',
        description: '+30 % XP sur les compounds en 1 à 5 reps.',
        multiplier: 1.30,
        condition: {
          kind: 'all_of',
          conditions: [
            { kind: 'rep_range', minReps: 1, maxReps: 5 },
            { kind: 'movement', movement: 'compound' },
          ],
        },
      },
      {
        id: 'guerrier_heavy_compound',
        label: 'Charge lourde',
        description: '+15 % XP sur les compounds ≥ 1.0 × poids de corps.',
        multiplier: 1.15,
        condition: { kind: 'heavy_compound', maxReps: 8, minBodyweightRatio: 1.0 },
      },
      {
        id: 'guerrier_compound_any',
        label: 'Polyarticulaire',
        description: '+10 % XP sur tout mouvement composé.',
        multiplier: 1.10,
        condition: { kind: 'movement', movement: 'compound' },
      },
    ],
  },

  // ---------------------------------------------------------------- ASSASSIN
  {
    id: 'assassin',
    name: 'Assassin',
    nameEn: 'Assassin',
    tagline: 'Ton corps est l\'arme ultime.',
    description:
      "Calisthenics pur. Bonus d'XP sur tous les exercices au poids du corps — tractions, dips, pompes, leg raises. Bonus secondaire sur les longues séries.",
    colorHex: '#8B5CF6',
    icon: '🗡️',
    affinity: {
      categories: ['pull', 'push', 'core'],
      muscles: ['dorsaux', 'biceps', 'abdominaux', 'pectoraux'],
    },
    bonuses: [
      {
        id: 'assassin_bodyweight',
        label: 'Ombre véloce',
        description: '+35 % XP sur tout exercice au poids du corps.',
        multiplier: 1.35,
        condition: { kind: 'bodyweight_exercise' },
      },
      {
        id: 'assassin_high_reps',
        label: 'Endurance de l\'ombre',
        description: '+15 % XP sur les séries de 20+ répétitions.',
        multiplier: 1.15,
        condition: { kind: 'high_reps', minReps: 20 },
      },
    ],
  },

  // -------------------------------------------------------------------- TANK
  {
    id: 'tank',
    name: 'Tank',
    nameEn: 'Tank',
    tagline: 'Chair contre le fer.',
    description:
      "Adepte de l'hypertrophie et du volume. Bonus d'XP sur la range 8-12 reps et sur l'usage des haltères. Le pump est ta force.",
    colorHex: '#F97316',
    icon: '🛡️',
    affinity: {
      categories: ['push', 'pull', 'legs'],
      muscles: ['biceps', 'triceps', 'pectoraux', 'deltoides_lateral'],
    },
    bonuses: [
      {
        id: 'tank_hypertrophy',
        label: 'Pompe musculaire',
        description: '+30 % XP sur les séries de 8 à 12 répétitions.',
        multiplier: 1.30,
        condition: { kind: 'rep_range', minReps: 8, maxReps: 12 },
      },
      {
        id: 'tank_dumbbell',
        label: 'Duelliste',
        description: '+15 % XP sur les exercices avec haltères.',
        multiplier: 1.15,
        condition: { kind: 'equipment', equipments: ['dumbbell'] },
      },
      {
        id: 'tank_isolation',
        label: 'Ciselage',
        description: '+10 % XP sur les isolations en 8+ reps.',
        multiplier: 1.10,
        condition: { kind: 'isolation_reps', minReps: 8 },
      },
    ],
  },
];

export const PLAYER_CLASSES_BY_ID: Record<PlayerClassId, PlayerClass> =
  PLAYER_CLASSES.reduce(
    (acc, c) => { acc[c.id] = c; return acc; },
    {} as Record<PlayerClassId, PlayerClass>,
  );

/** Safe lookup — unknown ids fall back to Guerrier. */
export function getPlayerClass(id: PlayerClassId): PlayerClass {
  return PLAYER_CLASSES_BY_ID[id] ?? PLAYER_CLASSES_BY_ID.guerrier;
}
