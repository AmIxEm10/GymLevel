import type { Challenge, ChallengeMetric, UserProfile } from '@/types';

/**
 * Long-term Challenges (Rank A / Rank S) — displayed in a dedicated DÉFIS
 * section of the Quêtes tab. Progress is computed LIVE from the profile;
 * completion is persisted via profile.completedChallenges.
 */
export const CHALLENGES: readonly Challenge[] = [
  {
    id: 'la_montagne',
    name: 'La Montagne',
    description:
      'Soulève un volume cumulé à vie de 50 000 kg. Le fer te connaîtra.',
    metric: 'totalVolumeLifetime',
    target: 50000,
    unit: 'kg',
    xpReward: 5000,
    rank: 'S',
  },
  {
    id: 'ombre_constante',
    name: "L'Ombre Constante",
    description: "Entraîne-toi 7 jours consécutifs sans briser la chaîne.",
    metric: 'longestStreak',
    target: 7,
    unit: 'jours',
    xpReward: 3000,
    rank: 'A',
  },
  {
    id: 'cent_chasses',
    name: 'Cent Chasses',
    description:
      'Termine 100 séances. Le Système enregistrera ton endurance.',
    metric: 'totalWorkouts',
    target: 100,
    unit: 'séances',
    xpReward: 8000,
    rank: 'S',
  },
];

export const CHALLENGES_BY_ID: Record<string, Challenge> = CHALLENGES.reduce(
  (acc, c) => { acc[c.id] = c; return acc; },
  {} as Record<string, Challenge>,
);

/** Current progress of a challenge, read live from the profile. */
export function challengeProgress(
  challenge: Challenge,
  profile: UserProfile,
): number {
  const metric: ChallengeMetric = challenge.metric;
  switch (metric) {
    case 'totalVolumeLifetime': return profile.totalVolumeLifetime;
    case 'longestStreak':       return profile.longestStreak;
    case 'totalWorkouts':       return profile.totalWorkouts;
    default:                    return 0;
  }
}
