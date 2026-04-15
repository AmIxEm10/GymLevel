import type { MuscleGroup, MuscleGroupId, MuscleGroupStats } from '@/types';

/**
 * Canonical list of the 17 muscle groups tracked by GymLevel.
 * This list is the source of truth; adding/removing an entry must be
 * accompanied by a migration of MuscleGroupStats records.
 */
export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  // ---- Chest
  { id: 'pectoraux',             name: 'Pectoraux',         nameEn: 'Chest',            bodyPart: 'upper', colorHex: '#FF5C7A', baseRecoveryHours: 48 },

  // ---- Back
  { id: 'dorsaux',               name: 'Dorsaux',           nameEn: 'Lats',             bodyPart: 'upper', colorHex: '#4C8BF5', baseRecoveryHours: 48 },
  { id: 'trapezes',              name: 'Trapèzes',          nameEn: 'Traps',            bodyPart: 'upper', colorHex: '#6FA8FF', baseRecoveryHours: 36 },
  { id: 'lombaires',             name: 'Lombaires',         nameEn: 'Lower Back',       bodyPart: 'core',  colorHex: '#2F6FDB', baseRecoveryHours: 72 },

  // ---- Shoulders (decomposed)
  { id: 'deltoides_anterieur',   name: 'Deltoïde antérieur',nameEn: 'Front Delts',      bodyPart: 'upper', colorHex: '#FFB84C', baseRecoveryHours: 36 },
  { id: 'deltoides_lateral',     name: 'Deltoïde latéral',  nameEn: 'Side Delts',       bodyPart: 'upper', colorHex: '#FFA02B', baseRecoveryHours: 36 },
  { id: 'deltoides_posterieur',  name: 'Deltoïde postérieur',nameEn:'Rear Delts',       bodyPart: 'upper', colorHex: '#D6811A', baseRecoveryHours: 36 },

  // ---- Arms
  { id: 'biceps',                name: 'Biceps',            nameEn: 'Biceps',           bodyPart: 'upper', colorHex: '#A855F7', baseRecoveryHours: 36 },
  { id: 'triceps',               name: 'Triceps',           nameEn: 'Triceps',          bodyPart: 'upper', colorHex: '#C084FC', baseRecoveryHours: 36 },
  { id: 'avant_bras',            name: 'Avant-bras',        nameEn: 'Forearms',         bodyPart: 'upper', colorHex: '#8E4FD1', baseRecoveryHours: 24 },

  // ---- Core
  { id: 'abdominaux',            name: 'Abdominaux',        nameEn: 'Abs',              bodyPart: 'core',  colorHex: '#22D3A4', baseRecoveryHours: 24 },
  { id: 'obliques',              name: 'Obliques',          nameEn: 'Obliques',         bodyPart: 'core',  colorHex: '#10B981', baseRecoveryHours: 24 },

  // ---- Lower
  { id: 'quadriceps',            name: 'Quadriceps',        nameEn: 'Quads',            bodyPart: 'lower', colorHex: '#F97316', baseRecoveryHours: 72 },
  { id: 'ischio_jambiers',       name: 'Ischio-jambiers',   nameEn: 'Hamstrings',       bodyPart: 'lower', colorHex: '#EA580C', baseRecoveryHours: 72 },
  { id: 'fessiers',              name: 'Fessiers',          nameEn: 'Glutes',           bodyPart: 'lower', colorHex: '#DC2626', baseRecoveryHours: 48 },
  { id: 'mollets',               name: 'Mollets',           nameEn: 'Calves',           bodyPart: 'lower', colorHex: '#B91C1C', baseRecoveryHours: 24 },
  { id: 'adducteurs',            name: 'Adducteurs',        nameEn: 'Adductors',        bodyPart: 'lower', colorHex: '#E11D48', baseRecoveryHours: 48 },
] as const;

/** Lookup map for O(1) access. */
export const MUSCLE_GROUP_BY_ID: Record<MuscleGroupId, MuscleGroup> =
  MUSCLE_GROUPS.reduce((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {} as Record<MuscleGroupId, MuscleGroup>);

/** Every id, useful for iteration. */
export const ALL_MUSCLE_IDS: readonly MuscleGroupId[] = MUSCLE_GROUPS.map(m => m.id);

/** Size classification — drives overload volume thresholds. */
export const MUSCLE_SIZE: Record<MuscleGroupId, 'large' | 'medium' | 'small'> = {
  pectoraux:              'large',
  dorsaux:                'large',
  trapezes:               'medium',
  lombaires:              'medium',
  deltoides_anterieur:    'medium',
  deltoides_lateral:      'medium',
  deltoides_posterieur:   'medium',
  biceps:                 'medium',
  triceps:                'medium',
  avant_bras:             'small',
  abdominaux:             'medium',
  obliques:               'small',
  quadriceps:             'large',
  ischio_jambiers:        'large',
  fessiers:               'large',
  mollets:                'small',
  adducteurs:             'medium',
};

/** Factory: build a fresh MuscleGroupStats for a given muscle id. */
export function createInitialMuscleStats(muscleId: MuscleGroupId): MuscleGroupStats {
  return {
    muscleId,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    totalVolumeLifetime: 0,
    lastTrainedAt: null,
    status: 'frais',
    statusUntil: null,
    volumeLast24h: 0,
    volumeLast7d: 0,
    sessionsLast7d: 0,
    lastDeconditioningAppliedAt: null,
  };
}

/** Factory: build the full 17-entry muscleStats record. */
export function createInitialMuscleStatsRecord(): Record<MuscleGroupId, MuscleGroupStats> {
  return ALL_MUSCLE_IDS.reduce((acc, id) => {
    acc[id] = createInitialMuscleStats(id);
    return acc;
  }, {} as Record<MuscleGroupId, MuscleGroupStats>);
}
