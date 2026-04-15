import type { PlayerClass, PlayerClassId } from '@/types';

/**
 * RPG classes — "Chasseur". Each class grants passive XP multipliers that
 * stack multiplicatively when several of its bonuses apply to the same set.
 *
 * Design rules:
 *   - Bonuses are pure data (no functions) → JSON-safe, persistable, remote-shippable.
 *   - Gamification service evaluates `ClassBonusCondition` against (set, exercise, profile).
 *   - The Novice class exists so a freshly-created profile is always valid.
 */
export const PLAYER_CLASSES: readonly PlayerClass[] = [
  // ------------------------------------------------------------------ NOVICE
  {
    id: 'novice',
    name: 'Novice',
    nameEn: 'Novice',
    tagline: 'Au commencement du voyage.',
    description:
      "Aucun bonus passif. Choisis une classe dès que tu découvres ton style d'entraînement.",
    colorHex: '#94A3B8',
    icon: '🌱',
    affinity: {},
    bonuses: [],
  },

  // -------------------------------------------------------------------- TANK
  {
    id: 'tank',
    name: 'Tank',
    nameEn: 'Tank',
    tagline: 'Brise les barres.',
    description:
      "Spécialiste de la force brute. Bonus d'XP massif sur les mouvements composés lourds " +
      'à faibles répétitions. Chaque kilo arraché du sol te rend plus puissant.',
    colorHex: '#EF4444',
    icon: '🛡️',
    affinity: {
      categories: ['push', 'pull', 'legs'],
      muscles: ['quadriceps', 'fessiers', 'dorsaux', 'lombaires', 'pectoraux'],
    },
    bonuses: [
      {
        id: 'tank_heavy_compound',
        label: 'Heavy Hitter',
        description: '+30 % XP sur les séries composées lourdes (≤ 5 reps, ≥ 1.0 × poids de corps).',
        multiplier: 1.30,
        condition: { kind: 'heavy_compound', maxReps: 5, minBodyweightRatio: 1.0 },
      },
      {
        id: 'tank_compound_any',
        label: 'Mur d\'acier',
        description: '+10 % XP sur tout mouvement composé.',
        multiplier: 1.10,
        condition: { kind: 'movement', movement: 'compound' },
      },
    ],
  },

  // --------------------------------------------------------------- ASSASSIN
  {
    id: 'assassin',
    name: 'Assassin',
    nameEn: 'Assassin',
    tagline: 'Maître de ton propre poids.',
    description:
      "Calisthenics et contrôle corporel. Bonus d'XP sur tous les exercices au poids du corps — " +
      'tractions, dips, pompes, abdos suspendus.',
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

  // -------------------------------------------------------------- BERSERKER
  {
    id: 'berserker',
    name: 'Berserker',
    nameEn: 'Berserker',
    tagline: 'Chair contre le fer.',
    description:
      "Adepte de l'hypertrophie. Bonus d'XP sur les exercices d'isolation en range 8-15 reps. " +
      'Le pump est ta force.',
    colorHex: '#F97316',
    icon: '🔥',
    affinity: {
      categories: ['push', 'pull', 'legs'],
      muscles: ['biceps', 'triceps', 'deltoides_lateral', 'mollets', 'pectoraux'],
    },
    bonuses: [
      {
        id: 'berserker_hypertrophy',
        label: 'Rage hypertrophique',
        description: '+30 % XP sur les isolations en 8-15 reps.',
        multiplier: 1.30,
        condition: { kind: 'isolation_hypertrophy', minReps: 8, maxReps: 15 },
      },
      {
        id: 'berserker_isolation',
        label: 'Tunnel vision',
        description: '+10 % XP sur toute isolation.',
        multiplier: 1.10,
        condition: { kind: 'high_reps', minReps: 8 }, // fallback
      },
    ],
  },

  // ----------------------------------------------------------------- RANGER
  {
    id: 'ranger',
    name: 'Ranger',
    nameEn: 'Ranger',
    tagline: 'Le souffle du loup.',
    description:
      'Explorateur du HIIT et de l\'endurance métabolique. Bonus d\'XP sur les séances HIIT et ' +
      'les séries très longues.',
    colorHex: '#10B981',
    icon: '🏹',
    affinity: {
      categories: ['hiit', 'cardio'],
      muscles: ['abdominaux', 'quadriceps', 'mollets'],
    },
    bonuses: [
      {
        id: 'ranger_hiit',
        label: 'Foulée infinie',
        description: '+30 % XP sur les exercices HIIT.',
        multiplier: 1.30,
        condition: { kind: 'category', category: 'hiit' },
      },
      {
        id: 'ranger_cardio',
        label: 'Second souffle',
        description: '+20 % XP sur les exercices cardio.',
        multiplier: 1.20,
        condition: { kind: 'category', category: 'cardio' },
      },
      {
        id: 'ranger_endurance',
        label: 'Métronome',
        description: '+15 % XP sur les séries de 25+ répétitions.',
        multiplier: 1.15,
        condition: { kind: 'high_reps', minReps: 25 },
      },
    ],
  },
];

export const PLAYER_CLASSES_BY_ID: Record<PlayerClassId, PlayerClass> =
  PLAYER_CLASSES.reduce(
    (acc, c) => { acc[c.id] = c; return acc; },
    {} as Record<PlayerClassId, PlayerClass>,
  );

export function getPlayerClass(id: PlayerClassId): PlayerClass {
  return PLAYER_CLASSES_BY_ID[id] ?? PLAYER_CLASSES_BY_ID.novice;
}
