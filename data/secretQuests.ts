import type { SecretQuestDef } from '@/types';

/**
 * Secret Quests — hidden triggers fired by gameplay conditions.
 * They DO NOT appear in the daily quests list; the user discovers them
 * via the SecretQuestModal only when a trigger fires.
 *
 * The store scans these:
 *   - after each addSet (single_set_* triggers)
 *   - at endSession (session_volume trigger)
 */
export const SECRET_QUESTS: readonly SecretQuestDef[] = [
  {
    id: 'reveil_demon',
    name: 'Éveil du Démon',
    description: "Tu viens de réveiller quelque chose de profond.",
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
];

export const SECRET_QUESTS_BY_ID: Record<string, SecretQuestDef> =
  SECRET_QUESTS.reduce(
    (acc, q) => { acc[q.id] = q; return acc; },
    {} as Record<string, SecretQuestDef>,
  );
