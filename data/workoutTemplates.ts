import type { WorkoutTemplate } from '@/types';

/**
 * Built-in routines. All are `isBuiltIn: true` and cannot be edited directly —
 * the user must clone them via `useAppStore.cloneTemplate()`.
 * Timestamps are zeroed; the store stamps them on first app load if needed.
 */
export const BUILT_IN_TEMPLATES: readonly WorkoutTemplate[] = [
  // ---------------------------------------------------------------- PUSH
  {
    id: 'tpl_push_intermediate',
    name: 'Push — Intermédiaire',
    description: 'Séance poussée : pectoraux, épaules, triceps.',
    tags: ['push', 'upper'],
    difficulty: 'intermediate',
    estimatedDurationMinutes: 60,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      { exerciseId: 'bench_press_barbell', order: 1, targetSets: 4, targetReps: '6-8',  targetRestSeconds: 150 },
      { exerciseId: 'incline_db_press',    order: 2, targetSets: 4, targetReps: '8-10', targetRestSeconds: 120 },
      { exerciseId: 'overhead_press',      order: 3, targetSets: 3, targetReps: '8-10', targetRestSeconds: 120 },
      { exerciseId: 'lateral_raise',       order: 4, targetSets: 3, targetReps: '12-15',targetRestSeconds: 60  },
      { exerciseId: 'triceps_pushdown',    order: 5, targetSets: 3, targetReps: '10-12',targetRestSeconds: 60  },
      { exerciseId: 'dips',                order: 6, targetSets: 3, targetReps: 'AMRAP',targetRestSeconds: 90  },
    ],
  },

  // ---------------------------------------------------------------- PULL
  {
    id: 'tpl_pull_intermediate',
    name: 'Pull — Intermédiaire',
    description: 'Séance tirage : dos, biceps, deltoïdes postérieurs.',
    tags: ['pull', 'upper'],
    difficulty: 'intermediate',
    estimatedDurationMinutes: 60,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      { exerciseId: 'pull_up',       order: 1, targetSets: 4, targetReps: 'AMRAP', targetRestSeconds: 120 },
      { exerciseId: 'barbell_row',   order: 2, targetSets: 4, targetReps: '6-8',   targetRestSeconds: 150 },
      { exerciseId: 'seated_row',    order: 3, targetSets: 3, targetReps: '8-10',  targetRestSeconds: 90  },
      { exerciseId: 'face_pull',     order: 4, targetSets: 3, targetReps: '12-15', targetRestSeconds: 60  },
      { exerciseId: 'biceps_curl_db',order: 5, targetSets: 3, targetReps: '10-12', targetRestSeconds: 60  },
      { exerciseId: 'hammer_curl',   order: 6, targetSets: 3, targetReps: '10-12', targetRestSeconds: 60  },
    ],
  },

  // ---------------------------------------------------------------- LEGS
  {
    id: 'tpl_legs_intermediate',
    name: 'Legs — Intermédiaire',
    description: 'Séance jambes complète : quads, fessiers, ischios, mollets.',
    tags: ['legs', 'lower'],
    difficulty: 'intermediate',
    estimatedDurationMinutes: 65,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      { exerciseId: 'back_squat',        order: 1, targetSets: 4, targetReps: '5-6',   targetRestSeconds: 180 },
      { exerciseId: 'romanian_deadlift', order: 2, targetSets: 4, targetReps: '8-10',  targetRestSeconds: 120 },
      { exerciseId: 'leg_press',         order: 3, targetSets: 3, targetReps: '10-12', targetRestSeconds: 120 },
      { exerciseId: 'leg_curl',          order: 4, targetSets: 3, targetReps: '10-12', targetRestSeconds: 60  },
      { exerciseId: 'calf_raise',        order: 5, targetSets: 4, targetReps: '12-15', targetRestSeconds: 60  },
    ],
  },

  // ---------------------------------------------------------------- UPPER
  {
    id: 'tpl_upper_body',
    name: 'Haut du corps',
    description: 'Upper body complet pour un entraînement 4×/semaine.',
    tags: ['upper'],
    difficulty: 'intermediate',
    estimatedDurationMinutes: 70,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      { exerciseId: 'bench_press_barbell', order: 1, targetSets: 4, targetReps: '6-8',   targetRestSeconds: 150 },
      { exerciseId: 'barbell_row',         order: 2, targetSets: 4, targetReps: '6-8',   targetRestSeconds: 150 },
      { exerciseId: 'overhead_press',      order: 3, targetSets: 3, targetReps: '8-10',  targetRestSeconds: 120 },
      { exerciseId: 'lat_pulldown',        order: 4, targetSets: 3, targetReps: '10-12', targetRestSeconds: 90  },
      { exerciseId: 'biceps_curl_db',      order: 5, targetSets: 3, targetReps: '10-12', targetRestSeconds: 60  },
      { exerciseId: 'triceps_pushdown',    order: 6, targetSets: 3, targetReps: '10-12', targetRestSeconds: 60  },
    ],
  },

  // ---------------------------------------------------------------- ARMS
  {
    id: 'tpl_arms',
    name: 'Bras — Spécialisation',
    description: 'Biceps / Triceps focus pour volume.',
    tags: ['arms', 'upper'],
    difficulty: 'intermediate',
    estimatedDurationMinutes: 45,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      { exerciseId: 'dips',              order: 1, targetSets: 4, targetReps: 'AMRAP', targetRestSeconds: 90 },
      { exerciseId: 'biceps_curl_db',    order: 2, targetSets: 4, targetReps: '8-10',  targetRestSeconds: 60 },
      { exerciseId: 'triceps_pushdown',  order: 3, targetSets: 4, targetReps: '10-12', targetRestSeconds: 60 },
      { exerciseId: 'hammer_curl',       order: 4, targetSets: 4, targetReps: '10-12', targetRestSeconds: 60 },
    ],
  },

  // ---------------------------------------------------------------- FULL BODY
  {
    id: 'tpl_fullbody_beginner',
    name: 'Full Body — Débutant',
    description: 'Séance complète pour débuter, 2-3×/semaine.',
    tags: ['fullbody', 'beginner_friendly'],
    difficulty: 'beginner',
    estimatedDurationMinutes: 50,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      { exerciseId: 'back_squat',          order: 1, targetSets: 3, targetReps: '8-10',  targetRestSeconds: 120 },
      { exerciseId: 'bench_press_barbell', order: 2, targetSets: 3, targetReps: '8-10',  targetRestSeconds: 120 },
      { exerciseId: 'barbell_row',         order: 3, targetSets: 3, targetReps: '8-10',  targetRestSeconds: 120 },
      { exerciseId: 'overhead_press',      order: 4, targetSets: 3, targetReps: '8-10',  targetRestSeconds: 90  },
      { exerciseId: 'plank',               order: 5, targetSets: 3, targetReps: '30s',   targetRestSeconds: 45  },
    ],
  },

  // ---------------------------------------------------------------- CORE
  {
    id: 'tpl_abs_core',
    name: 'Abdos & Core',
    description: 'Focus ceinture abdominale.',
    tags: ['core'],
    difficulty: 'intermediate',
    estimatedDurationMinutes: 25,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      { exerciseId: 'hanging_leg_raise', order: 1, targetSets: 4, targetReps: '10-15', targetRestSeconds: 60 },
      { exerciseId: 'cable_crunch',      order: 2, targetSets: 4, targetReps: '12-15', targetRestSeconds: 60 },
      { exerciseId: 'russian_twist',     order: 3, targetSets: 3, targetReps: '20',    targetRestSeconds: 45 },
      { exerciseId: 'plank',             order: 4, targetSets: 3, targetReps: '45s',   targetRestSeconds: 45 },
      { exerciseId: 'back_extension',    order: 5, targetSets: 3, targetReps: '12-15', targetRestSeconds: 60 },
    ],
  },

  // ---------------------------------------------------------------- HIIT
  {
    id: 'tpl_hiit_20',
    name: 'HIIT 20 min',
    description: 'Conditionnement métabolique haute intensité.',
    tags: ['hiit', 'cardio'],
    difficulty: 'advanced',
    estimatedDurationMinutes: 20,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      { exerciseId: 'burpee',            order: 1, targetSets: 5, targetReps: '30s', targetRestSeconds: 30 },
      { exerciseId: 'mountain_climber',  order: 2, targetSets: 5, targetReps: '30s', targetRestSeconds: 30 },
      { exerciseId: 'push_up',           order: 3, targetSets: 5, targetReps: 'AMRAP', targetRestSeconds: 30 },
    ],
  },

  // =========================================================================
  // SIGNATURE DUNGEONS — handcrafted for the 3 classes (V1 Alpha)
  // =========================================================================

  // ---------------------------- LE TOMBEAU DU COLOSSE — Guerrier / Force
  {
    id: 'tpl_tombeau_colosse',
    name: 'Le Tombeau du Colosse',
    description: 'Dédié au Guerrier. Charges lourdes, séries brèves — écrase la pierre sous la barre.',
    tags: ['push', 'upper'],
    difficulty: 'advanced',
    rankOverride: 'B',
    estimatedDurationMinutes: 70,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      // Échauffement — mobilisation épaules/poignets via pompes légères
      { exerciseId: 'push_up',             order: 1, targetSets: 2, targetReps: '10',    targetRestSeconds: 60,  notes: 'Échauffement' },
      // BOSS
      { exerciseId: 'bench_press_barbell', order: 2, targetSets: 5, targetReps: '5',     targetRestSeconds: 180, notes: 'BOSS — charges lourdes, 5×5' },
      // ELITES
      { exerciseId: 'overhead_press',      order: 3, targetSets: 3, targetReps: '8',     targetRestSeconds: 150, notes: 'ELITE' },
      { exerciseId: 'dips',                order: 4, targetSets: 3, targetReps: '8',     targetRestSeconds: 120, notes: 'ELITE — lestés si possible' },
      // Accessoires
      { exerciseId: 'triceps_pushdown',    order: 5, targetSets: 3, targetReps: '10-12', targetRestSeconds: 90  },
      { exerciseId: 'lateral_raise',       order: 6, targetSets: 3, targetReps: '12-15', targetRestSeconds: 60  },
    ],
  },

  // ---------------------------- LE SENTIER DE L'OMBRE — Assassin / Corps
  {
    id: 'tpl_sentier_ombre',
    name: "Le Sentier de l'Ombre",
    description: "Dédié à l'Assassin. Poids du corps, explosivité, aucune chaîne ne te retient.",
    tags: ['pull', 'upper', 'core'],
    difficulty: 'intermediate',
    rankOverride: 'C',
    estimatedDurationMinutes: 50,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      // Échauffement — cardio léger
      { exerciseId: 'jumping_jacks',     order: 1, targetSets: 2, targetReps: '45s',   targetRestSeconds: 30,  notes: 'Échauffement' },
      // BOSS
      { exerciseId: 'pull_up',           order: 2, targetSets: 4, targetReps: 'AMRAP', targetRestSeconds: 120, notes: 'BOSS — max de répétitions' },
      // ELITES
      { exerciseId: 'push_up_diamond',   order: 3, targetSets: 4, targetReps: '15',    targetRestSeconds: 75,  notes: 'ELITE — triceps focus' },
      { exerciseId: 'jump_squat',        order: 4, targetSets: 4, targetReps: '20',    targetRestSeconds: 75,  notes: 'ELITE — explosivité' },
      // Accessoire core
      { exerciseId: 'plank',             order: 5, targetSets: 3, targetReps: '45s',   targetRestSeconds: 45  },
    ],
  },

  // ---------------------------- LA FORGE DE SANG — Tank / Hypertrophie
  {
    id: 'tpl_forge_sang',
    name: 'La Forge de Sang',
    description: 'Dédiée au Tank. Pompe absolue, séries longues, que la fonte chauffe la forge.',
    tags: ['push', 'upper', 'arms'],
    difficulty: 'intermediate',
    rankOverride: 'B',
    estimatedDurationMinutes: 65,
    isBuiltIn: true,
    createdAt: 0, updatedAt: 0,
    exercises: [
      // Échauffement — cardio léger
      { exerciseId: 'mountain_climber',   order: 1, targetSets: 2, targetReps: '45s',   targetRestSeconds: 45,  notes: 'Échauffement — 5 min cardio' },
      // BOSS
      { exerciseId: 'incline_db_press',   order: 2, targetSets: 4, targetReps: '12',    targetRestSeconds: 120, notes: 'BOSS — focus hypertrophie' },
      // ELITES
      { exerciseId: 'cable_flye',         order: 3, targetSets: 3, targetReps: '15',    targetRestSeconds: 75,  notes: 'ELITE — étirement pecs' },
      { exerciseId: 'triceps_pushdown',   order: 4, targetSets: 4, targetReps: '12',    targetRestSeconds: 75,  notes: 'ELITE' },
      // Accessoires
      { exerciseId: 'db_flye',            order: 5, targetSets: 3, targetReps: '12',    targetRestSeconds: 75  },
      { exerciseId: 'biceps_curl_db',     order: 6, targetSets: 3, targetReps: '12',    targetRestSeconds: 60  },
    ],
  },
];

export const BUILT_IN_TEMPLATES_BY_ID: Record<string, WorkoutTemplate> =
  BUILT_IN_TEMPLATES.reduce(
    (acc, t) => { acc[t.id] = t; return acc; },
    {} as Record<string, WorkoutTemplate>,
  );
