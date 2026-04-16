import type { SecretQuestDef } from '@/types';

/**
 * Secret Quests — hidden triggers fired by gameplay conditions.
 * They DO NOT appear in the daily quests list; the user discovers them
 * via the SecretQuestModal only when a trigger fires.
 *
 * The store scans these:
 *   - after each addSet (single_set_* triggers)
 *   - at endSession (session_volume / session_reps / streak / time)
 *
 * V1.2 — expanded to 20 secrets covering force, endurance, discipline
 * and temporal edges (night owl, dawn raider, lightning session).
 */
export const SECRET_QUESTS: readonly SecretQuestDef[] = [
  // ================================================ ORIGINAL FIVE
  {
    id: 'reveil_demon',
    name: 'Éveil du Démon',
    description: 'Tu viens de réveiller quelque chose de profond.',
    hint: '100 pompes en une seule série sans poser les genoux.',
    trigger: { kind: 'single_set_reps', exerciseId: 'push_up', minReps: 100 },
    xpReward: 2000,
    lootRarity: 'rare',
  },
  {
    id: 'colosse_immobile',
    name: 'Colosse Immobile',
    description: 'Le sol tremble sous la barre. La pierre te reconnaît.',
    hint: '200 kg sur le squat barre.',
    trigger: { kind: 'single_set_weight', exerciseId: 'back_squat', minWeight: 200 },
    xpReward: 3000,
    lootRarity: 'epic',
  },
  {
    id: 'moine_inlassable',
    name: 'Moine Inlassable',
    description: 'Tu as défié le temps. Le Système te le rend.',
    hint: '3 minutes de planche sans rompre.',
    trigger: { kind: 'single_set_reps', exerciseId: 'plank', minReps: 180 },
    xpReward: 1500,
    lootRarity: 'rare',
  },
  {
    id: 'transe_volume',
    name: 'Transe du Volume',
    description: 'Tu as forgé une montagne en une seule traversée.',
    hint: '10 000 kg de volume cumulé dans une même séance.',
    trigger: { kind: 'session_volume', minVolume: 10000 },
    xpReward: 2500,
    lootRarity: 'epic',
  },
  {
    id: 'reigne_corde',
    name: 'Règne de la Corde',
    description: 'Tu planes au-dessus du sol comme une ombre.',
    hint: '30 tractions en une seule série.',
    trigger: { kind: 'single_set_reps', exerciseId: 'pull_up', minReps: 30 },
    xpReward: 2000,
    lootRarity: 'rare',
  },

  // ================================================ V1.2 EXPANSION
  {
    id: 'marteau_cosmos',
    name: 'Marteau du Cosmos',
    description: "La barre devient une étoile entre tes mains.",
    hint: '150 kg sur le développé couché barre.',
    trigger: { kind: 'single_set_weight', exerciseId: 'bench_press_barbell', minWeight: 150 },
    xpReward: 2500,
    lootRarity: 'epic',
  },
  {
    id: 'racines_titans',
    name: 'Racines des Titans',
    description: "Tes jambes plongent dans la roche.",
    hint: '250 kg sur le soulevé de terre.',
    trigger: { kind: 'single_set_weight', exerciseId: 'deadlift', minWeight: 250 },
    xpReward: 3500,
    lootRarity: 'epic',
  },
  {
    id: 'lame_eternelle',
    name: 'Lame Éternelle',
    description: "Tu ne faiblis jamais. La répétition est ton art.",
    hint: '50 tractions en une seule série.',
    trigger: { kind: 'single_set_reps', exerciseId: 'pull_up', minReps: 50 },
    xpReward: 3000,
    lootRarity: 'epic',
  },
  {
    id: 'endurance_nexus',
    name: 'Endurance Nexus',
    description: "Tu as franchi un seuil que peu connaissent.",
    hint: '500 répétitions cumulées en une même séance.',
    trigger: { kind: 'session_reps', minReps: 500 },
    xpReward: 2500,
    lootRarity: 'epic',
  },
  {
    id: 'tempete_reps',
    name: 'Tempête de Répétitions',
    description: 'Tes mouvements font un seul fil continu.',
    hint: '1 000 répétitions cumulées en une même séance.',
    trigger: { kind: 'session_reps', minReps: 1000 },
    xpReward: 4000,
    lootRarity: 'legendary',
  },
  {
    id: 'ombre_sept',
    name: 'Ombre du Septième Jour',
    description: 'Tu as tenu sans faillir pendant 7 soleils.',
    hint: '7 jours consécutifs d\'entraînement.',
    trigger: { kind: 'streak_days', minDays: 7 },
    xpReward: 2500,
    lootRarity: 'rare',
  },
  {
    id: 'discipline_lune',
    name: 'Discipline de la Lune',
    description: 'La constance est ta vertu. Le Système te reconnaît.',
    hint: '14 jours consécutifs d\'entraînement.',
    trigger: { kind: 'streak_days', minDays: 14 },
    xpReward: 4500,
    lootRarity: 'epic',
  },
  {
    id: 'rituel_trente',
    name: 'Rituel des Trente',
    description: 'Tu as dépassé la loi de l\'Humain.',
    hint: '30 jours consécutifs d\'entraînement.',
    trigger: { kind: 'streak_days', minDays: 30 },
    xpReward: 8000,
    lootRarity: 'legendary',
  },
  {
    id: 'gardien_aube',
    name: "Gardien de l'Aube",
    description: 'Tu t\'entraînes quand le soleil dort encore.',
    hint: 'Commence une séance avant 6:00.',
    trigger: { kind: 'early_workout', maxStartHour: 6 },
    xpReward: 1500,
    lootRarity: 'rare',
  },
  {
    id: 'couteau_nocturne',
    name: 'Couteau Nocturne',
    description: 'Les Chasseurs de la nuit marchent en silence.',
    hint: 'Commence une séance après 22:00.',
    trigger: { kind: 'late_workout', minStartHour: 22 },
    xpReward: 1500,
    lootRarity: 'rare',
  },
  {
    id: 'eclair_compact',
    name: 'Éclair Compact',
    description: 'Tu as compressé une guerre en quelques minutes.',
    hint: '3 000 kg de volume en moins de 15 minutes.',
    trigger: { kind: 'short_session', maxSeconds: 900, minVolume: 3000 },
    xpReward: 2000,
    lootRarity: 'rare',
  },
  {
    id: 'rage_titanique',
    name: 'Rage Titanique',
    description: 'Ta volonté plie le métal.',
    hint: '200 kg sur le rowing barre.',
    trigger: { kind: 'single_set_weight', exerciseId: 'barbell_row', minWeight: 200 },
    xpReward: 2500,
    lootRarity: 'epic',
  },
  {
    id: 'vigile_planche',
    name: 'Vigile de la Planche',
    description: 'Le temps t\'a oublié. Tu es devenu pierre.',
    hint: '5 minutes de planche sans rompre.',
    trigger: { kind: 'single_set_reps', exerciseId: 'plank', minReps: 300 },
    xpReward: 2800,
    lootRarity: 'epic',
  },
  {
    id: 'armee_dips',
    name: 'Armée des Dips',
    description: 'Chaque répétition est un soldat de ton armée.',
    hint: '40 dips en une seule série.',
    trigger: { kind: 'single_set_reps', exerciseId: 'dips', minReps: 40 },
    xpReward: 2000,
    lootRarity: 'rare',
  },
  {
    id: 'archiviste_volume',
    name: 'Archiviste du Volume',
    description: 'Le Système archive ton nom à jamais.',
    hint: '25 000 kg de volume cumulé dans une même séance.',
    trigger: { kind: 'session_volume', minVolume: 25000 },
    xpReward: 6000,
    lootRarity: 'legendary',
  },
];

export const SECRET_QUESTS_BY_ID: Record<string, SecretQuestDef> =
  SECRET_QUESTS.reduce(
    (acc, q) => { acc[q.id] = q; return acc; },
    {} as Record<string, SecretQuestDef>,
  );
