/**
 * workoutService.ts
 * -----------------
 * Helpers around WorkoutSession lifecycle + template instantiation.
 * No state, no persistence — only transforms.
 */

import type {
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
} from '@/types';

let SEQ = 0;
const uid = (prefix: string, now: number) => `${prefix}_${now}_${SEQ++}`;

// ---------------------------------------------------------------------------
// Template -> Session
// ---------------------------------------------------------------------------

export function sessionFromTemplate(
  template: WorkoutTemplate,
  now: number,
): WorkoutSession {
  const exercises: WorkoutExercise[] = template.exercises
    .sort((a, b) => a.order - b.order)
    .map(te => ({
      id: uid('we', now),
      exerciseId: te.exerciseId,
      order: te.order,
      sets: [],
      targetSets: te.targetSets,
      targetReps: te.targetReps,
      targetRestSeconds: te.targetRestSeconds,
    }));

  return {
    id: uid('ws', now),
    templateId: template.id,
    name: template.name,
    startedAt: now,
    exercises,
    totalVolume: 0,
    totalXpGained: 0,
    xpByMuscle: {},
    status: 'in_progress',
  };
}

export function blankSession(name: string, now: number): WorkoutSession {
  return {
    id: uid('ws', now),
    name,
    startedAt: now,
    exercises: [],
    totalVolume: 0,
    totalXpGained: 0,
    xpByMuscle: {},
    status: 'in_progress',
  };
}

// ---------------------------------------------------------------------------
// Session mutations (pure)
// ---------------------------------------------------------------------------

export function addExercise(
  session: WorkoutSession,
  exerciseId: string,
  now: number,
): WorkoutSession {
  const order = session.exercises.length + 1;
  const we: WorkoutExercise = {
    id: uid('we', now),
    exerciseId,
    order,
    sets: [],
  };
  return { ...session, exercises: [...session.exercises, we] };
}

export function removeExercise(
  session: WorkoutSession,
  workoutExerciseId: string,
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises
      .filter(e => e.id !== workoutExerciseId)
      .map((e, i) => ({ ...e, order: i + 1 })),
  };
}

export function addSetToExercise(
  session: WorkoutSession,
  workoutExerciseId: string,
  partialSet: Omit<WorkoutSet, 'id' | 'completedAt' | 'setNumber'>,
  now: number,
): { session: WorkoutSession; newSet: WorkoutSet } | null {
  const target = session.exercises.find(e => e.id === workoutExerciseId);
  if (!target) return null;

  const newSet: WorkoutSet = {
    ...partialSet,
    id: uid('set', now),
    completedAt: now,
    setNumber: target.sets.length + 1,
  };

  const exercises = session.exercises.map(e =>
    e.id === workoutExerciseId ? { ...e, sets: [...e.sets, newSet] } : e,
  );
  return { session: { ...session, exercises }, newSet };
}

export function updateSet(
  session: WorkoutSession,
  workoutExerciseId: string,
  setId: string,
  updates: Partial<WorkoutSet>,
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map(e =>
      e.id !== workoutExerciseId
        ? e
        : {
            ...e,
            sets: e.sets.map(s => (s.id === setId ? { ...s, ...updates } : s)),
          },
    ),
  };
}

export function removeSet(
  session: WorkoutSession,
  workoutExerciseId: string,
  setId: string,
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map(e =>
      e.id !== workoutExerciseId
        ? e
        : {
            ...e,
            sets: e.sets
              .filter(s => s.id !== setId)
              .map((s, i) => ({ ...s, setNumber: i + 1 })),
          },
    ),
  };
}

// ---------------------------------------------------------------------------
// Finalization
// ---------------------------------------------------------------------------

export function finalizeSession(
  session: WorkoutSession,
  now: number,
): WorkoutSession {
  const durationSeconds = Math.max(0, Math.round((now - session.startedAt) / 1000));
  return {
    ...session,
    endedAt: now,
    durationSeconds,
    status: 'completed',
  };
}

export function abandonSession(
  session: WorkoutSession,
  now: number,
): WorkoutSession {
  return {
    ...session,
    endedAt: now,
    durationSeconds: Math.max(0, Math.round((now - session.startedAt) / 1000)),
    status: 'abandoned',
  };
}

// ---------------------------------------------------------------------------
// Cloning
// ---------------------------------------------------------------------------

export function cloneTemplate(
  source: WorkoutTemplate,
  now: number,
): WorkoutTemplate {
  return {
    ...source,
    id: uid('tpl', now),
    name: `${source.name} (copie)`,
    isBuiltIn: false,
    clonedFrom: source.id,
    createdAt: now,
    updatedAt: now,
  };
}
