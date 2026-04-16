import type { PlayerClass, PlayerClassId } from '@/types';

/**
 * Chasseur classes — 7 archétypes finaux (V1.1).
 * Each class combines:
 *   - bonuses[]         — per-set ClassBonus multipliers (stacked, capped by
 *                         MAX_CLASS_MULTIPLIER in gamificationService)
 *   - passiveEffects    — profile-wide passive toggles (recovery, luck)
 */
export const PLAYER_CLASSES: readonly PlayerClass[] = [
  // ================================================================ NOVICE
  {
    id: 'novice',
    name: 'Novice',
    nameEn: 'Novice',
    tagline: 'Le Système t\'évalue…',
    description:
      "Classe de départ. Aucun bonus passif. Entraîne-toi puis choisis une vraie classe quand le Système te l'accordera.",
    colorHex: '#94A3B8',
    icon: '🌱',
    affinity: {},
    bonuses: [],
  },

  // ============================================================== GUERRIER
  {
    id: 'guerrier',
    name: 'Guerrier',
    nameEn: 'Warrior',
    tagline: 'Brise les barres.',
    description:
      "Spécialiste de la force brute. Bonus XP sur les composés lourds à faibles répétitions. Chaque kilo arraché te rend plus puissant.",
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

  // ============================================================= ASSASSIN
  {
    id: 'assassin',
    name: 'Assassin',
    nameEn: 'Assassin',
    tagline: "Ton corps est l'arme ultime.",
    description:
      "Calisthenics pur. Bonus d'XP sur tous les exercices au poids du corps — tractions, dips, pompes, leg raises.",
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
        label: "Endurance de l'ombre",
        description: '+15 % XP sur les séries de 20+ répétitions.',
        multiplier: 1.15,
        condition: { kind: 'high_reps', minReps: 20 },
      },
    ],
  },

  // ================================================================== TANK
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

  // ================================================================ RANGER
  {
    id: 'ranger',
    name: 'Ranger',
    nameEn: 'Ranger',
    tagline: 'Le souffle du loup, la foulée infinie.',
    description:
      "Endurance et conditionnement métabolique. Bonus XP sur le HIIT, le cardio et toutes les séries longues (15+ reps).",
    colorHex: '#10B981',
    icon: '🏹',
    affinity: {
      categories: ['hiit', 'cardio'],
      muscles: ['abdominaux', 'quadriceps', 'mollets'],
    },
    bonuses: [
      {
        id: 'ranger_high_reps_15',
        label: 'Métronome',
        description: '+25 % XP sur toute série de 15+ répétitions.',
        multiplier: 1.25,
        condition: { kind: 'high_reps', minReps: 15 },
      },
      {
        id: 'ranger_hiit',
        label: 'Foulée infinie',
        description: '+20 % XP sur les exercices HIIT.',
        multiplier: 1.20,
        condition: { kind: 'category', category: 'hiit' },
      },
      {
        id: 'ranger_cardio',
        label: 'Second souffle',
        description: '+15 % XP sur les exercices cardio.',
        multiplier: 1.15,
        condition: { kind: 'category', category: 'cardio' },
      },
    ],
  },

  // ================================================================== MAGE
  {
    id: 'mage',
    name: 'Mage',
    nameEn: 'Mage',
    tagline: 'La précision prime sur la force.',
    description:
      "Maître de la contraction. Bonus d'XP sur les isolations machine/poulie. Sa chance arcanique multiplie ses drops de loot.",
    colorHex: '#A855F7',
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
    passiveEffects: {
      /** +50 % de probabilité de drop en fin de donjon. */
      lootLuck: 1.5,
      /** 30 % de chance de monter d'un tier de rareté sur le roll. */
      rarityUpgradeChance: 0.30,
    },
  },

  // ================================================================ HEALER
  {
    id: 'healer',
    name: 'Healer',
    nameEn: 'Healer',
    tagline: 'La régularité est ton pouvoir.',
    description:
      "Gardien du noyau. Bonus d'XP sur le core et bonus de streak. Son pouvoir passif double la vitesse de récupération de ses muscles.",
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
        description: '+30 % XP sur tous les exercices Core.',
        multiplier: 1.30,
        condition: { kind: 'category', category: 'core' },
      },
      {
        id: 'healer_regularity',
        label: 'Régularité sacrée',
        description: '+15 % XP sur toute séance dès 3 jours de streak.',
        multiplier: 1.15,
        condition: { kind: 'streak_active', minDays: 3 },
      },
    ],
    passiveEffects: {
      /** 4 %/h vs 2 %/h par défaut — les muscles reviennent frais deux fois plus vite. */
      recoveryRate: 0.04,
    },
  },
];

export const PLAYER_CLASSES_BY_ID: Record<PlayerClassId, PlayerClass> =
  PLAYER_CLASSES.reduce(
    (acc, c) => { acc[c.id] = c; return acc; },
    {} as Record<PlayerClassId, PlayerClass>,
  );

/** Safe lookup — unknown ids fall back to Novice. */
export function getPlayerClass(id: PlayerClassId): PlayerClass {
  return PLAYER_CLASSES_BY_ID[id] ?? PLAYER_CLASSES_BY_ID.novice;
}
