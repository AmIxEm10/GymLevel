import type { PlayerClass, PlayerClassId } from '@/types';

/**
 * Chasseur classes — inspired by the 6 official Solo Leveling hunter
 * archetypes, plus Novice (starting class).
 *
 * Design rules:
 *   - Bonuses are pure data (no functions) → JSON-safe, persistable, remote-shippable.
 *   - Gamification service evaluates `ClassBonusCondition` against
 *     (set, exercise, bodyweight, currentStreak).
 *   - Multiple bonuses on a class stack multiplicatively, clamped by
 *     MAX_CLASS_MULTIPLIER.
 *   - The Novice class exists so a freshly-created profile is always valid.
 */
export const PLAYER_CLASSES: readonly PlayerClass[] = [
  // ------------------------------------------------------------------ NOVICE
  {
    id: 'novice',
    name: 'Novice',
    nameEn: 'Novice',
    tagline: 'Le Système t\'évalue…',
    description:
      "Classe de départ. Aucun bonus passif. Entraîne-toi, gagne des niveaux, " +
      "puis choisis une vraie classe quand le Système te l'accordera.",
    colorHex: '#94A3B8',
    icon: '🌱',
    affinity: {},
    bonuses: [],
  },

  // ----------------------------------------------------------------- FIGHTER
  {
    id: 'fighter',
    name: 'Fighter',
    nameEn: 'Fighter',
    tagline: 'L\'hypertrophie est un art martial.',
    description:
      'Spécialiste de la prise de muscle. Bonus XP sur le range d\'hypertrophie ' +
      '(8-12 reps) et sur l\'usage des haltères — les armes du duelliste.',
    colorHex: '#F43F5E',
    icon: '🥊',
    affinity: {
      categories: ['push', 'pull', 'legs'],
      muscles: ['pectoraux', 'biceps', 'deltoides_lateral'],
    },
    bonuses: [
      {
        id: 'fighter_hypertrophy',
        label: 'Sculpteur',
        description: '+25 % XP sur les séries de 8 à 12 répétitions.',
        multiplier: 1.25,
        condition: { kind: 'rep_range', minReps: 8, maxReps: 12 },
      },
      {
        id: 'fighter_dumbbell',
        label: 'Duelliste',
        description: '+15 % XP sur les exercices avec haltères.',
        multiplier: 1.15,
        condition: { kind: 'equipment', equipments: ['dumbbell'] },
      },
    ],
  },

  // ------------------------------------------------------------------ TANKER
  {
    id: 'tanker',
    name: 'Tanker',
    nameEn: 'Tanker',
    tagline: 'Rien ne te fait plier.',
    description:
      "Puissance brute et mouvements polyarticulaires. Bonus XP massif sur les " +
      "compounds en force pure (≤ 5 reps) et boost léger sur toute exécution composée.",
    colorHex: '#EF4444',
    icon: '🛡️',
    affinity: {
      categories: ['push', 'pull', 'legs'],
      muscles: ['quadriceps', 'fessiers', 'dorsaux', 'lombaires', 'pectoraux'],
    },
    bonuses: [
      {
        id: 'tanker_pure_strength',
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
        id: 'tanker_compound_any',
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
      "Calisthenics pur. Bonus XP sur tous les exercices au poids du corps — " +
      "tractions, dips, pompes, leg raises. Bonus secondaire sur les séries " +
      "longues pour récompenser l'endurance musculaire.",
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
        description: '+10 % XP sur les séries de 20+ répétitions.',
        multiplier: 1.10,
        condition: { kind: 'high_reps', minReps: 20 },
      },
    ],
  },

  // ------------------------------------------------------------------ RANGER
  {
    id: 'ranger',
    name: 'Ranger',
    nameEn: 'Ranger',
    tagline: 'Le souffle du loup, la foulée infinie.',
    description:
      "Endurance et conditionnement métabolique. Bonus XP sur le HIIT, le cardio " +
      "et toutes les séries longues (15+ reps).",
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
        description: '+15 % XP sur les séries de 15+ répétitions.',
        multiplier: 1.15,
        condition: { kind: 'high_reps', minReps: 15 },
      },
    ],
  },

  // -------------------------------------------------------------------- MAGE
  {
    id: 'mage',
    name: 'Mage',
    nameEn: 'Mage',
    tagline: 'La précision prime sur la force.',
    description:
      "Maître de la contraction. Bonus XP sur les exercices d'isolation " +
      "exécutés sur machine guidée ou poulie — travail chirurgical, amplitude contrôlée.",
    colorHex: '#3B82F6',
    icon: '🧙',
    affinity: {
      categories: ['push', 'pull', 'legs'],
      muscles: ['biceps', 'triceps', 'deltoides_lateral', 'deltoides_posterieur'],
    },
    bonuses: [
      {
        id: 'mage_machine_isolation',
        label: 'Incantation précise',
        description: '+30 % XP sur les isolations à la machine ou à la poulie.',
        multiplier: 1.30,
        condition: {
          kind: 'all_of',
          conditions: [
            { kind: 'movement', movement: 'isolation' },
            { kind: 'equipment', equipments: ['machine', 'cable'] },
          ],
        },
      },
      {
        id: 'mage_cable_control',
        label: 'Flux arcanique',
        description: '+10 % XP sur tout exercice à la poulie.',
        multiplier: 1.10,
        condition: { kind: 'equipment', equipments: ['cable'] },
      },
    ],
  },

  // ------------------------------------------------------------------ HEALER
  {
    id: 'healer',
    name: 'Healer',
    nameEn: 'Healer',
    tagline: 'La régularité est ton pouvoir.',
    description:
      "Gardien du noyau. Bonus XP sur les exercices core/abdos et bonus " +
      "passif lorsque tu maintiens un streak d'entraînement — la discipline " +
      "t'insuffle de l'énergie.",
    colorHex: '#22D3A4',
    icon: '⛑️',
    affinity: {
      categories: ['core'],
      muscles: ['abdominaux', 'obliques', 'lombaires'],
    },
    bonuses: [
      {
        id: 'healer_core_focus',
        label: 'Gardien du noyau',
        description: '+30 % XP sur tous les exercices de la catégorie Core.',
        multiplier: 1.30,
        condition: { kind: 'category', category: 'core' },
      },
      {
        id: 'healer_regularity',
        label: 'Régularité sacrée',
        description: '+15 % XP sur toute séance dès 3 jours de streak consécutifs.',
        multiplier: 1.15,
        condition: { kind: 'streak_active', minDays: 3 },
      },
    ],
  },
];

export const PLAYER_CLASSES_BY_ID: Record<PlayerClassId, PlayerClass> =
  PLAYER_CLASSES.reduce(
    (acc, c) => { acc[c.id] = c; return acc; },
    {} as Record<PlayerClassId, PlayerClass>,
  );

/** Safe lookup — unknown ids (e.g. migration from previous versions) fall back to Novice. */
export function getPlayerClass(id: PlayerClassId): PlayerClass {
  return PLAYER_CLASSES_BY_ID[id] ?? PLAYER_CLASSES_BY_ID.novice;
}
