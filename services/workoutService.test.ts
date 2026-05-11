import {
  sessionFromTemplate,
  blankSession,
  addExercise,
  removeExercise,
  addSetToExercise,
  updateSet,
  removeSet,
  finalizeSession,
  abandonSession,
  cloneTemplate,
} from './workoutService';
import type { WorkoutTemplate, WorkoutSession, WorkoutExercise } from '@/types';

describe('workoutService', () => {
  const now = 1715420000000; // Mock timestamp

  const mockTemplate: WorkoutTemplate = {
    id: 'tpl_1',
    name: 'Push Day',
    isBuiltIn: false,
    createdAt: now,
    updatedAt: now,
    exercises: [
      {
        exerciseId: 'ex_2',
        order: 2,
        targetSets: 3,
        targetReps: 10,
        targetRestSeconds: 90,
      },
      {
        exerciseId: 'ex_1',
        order: 1,
        targetSets: 4,
        targetReps: 8,
        targetRestSeconds: 120,
      },
    ],
  };

  describe('sessionFromTemplate', () => {
    it('creates a session from a template, ordering exercises correctly', () => {
      const session = sessionFromTemplate(mockTemplate, now);

      expect(session.templateId).toBe(mockTemplate.id);
      expect(session.name).toBe(mockTemplate.name);
      expect(session.startedAt).toBe(now);
      expect(session.status).toBe('in_progress');
      expect(session.exercises).toHaveLength(2);

      // Exercises should be sorted by order
      expect(session.exercises[0].exerciseId).toBe('ex_1');
      expect(session.exercises[0].order).toBe(1);
      expect(session.exercises[1].exerciseId).toBe('ex_2');
      expect(session.exercises[1].order).toBe(2);

      // Sets should be empty initially
      expect(session.exercises[0].sets).toEqual([]);
      expect(session.exercises[1].sets).toEqual([]);

      // target fields should be carried over
      expect(session.exercises[0].targetSets).toBe(4);
      expect(session.exercises[0].targetReps).toBe(8);
      expect(session.exercises[0].targetRestSeconds).toBe(120);
    });
  });

  describe('blankSession', () => {
    it('creates a blank session', () => {
      const session = blankSession('Custom Session', now);

      expect(session.name).toBe('Custom Session');
      expect(session.startedAt).toBe(now);
      expect(session.exercises).toEqual([]);
      expect(session.status).toBe('in_progress');
    });
  });

  describe('mutations', () => {
    let session: WorkoutSession;

    beforeEach(() => {
      session = blankSession('My Session', now);
    });

    describe('addExercise', () => {
      it('adds an exercise with correct sequential order', () => {
        session = addExercise(session, 'ex_1', now);
        expect(session.exercises).toHaveLength(1);
        expect(session.exercises[0].exerciseId).toBe('ex_1');
        expect(session.exercises[0].order).toBe(1);

        session = addExercise(session, 'ex_2', now);
        expect(session.exercises).toHaveLength(2);
        expect(session.exercises[1].exerciseId).toBe('ex_2');
        expect(session.exercises[1].order).toBe(2);
      });
    });

    describe('removeExercise', () => {
      it('removes an exercise and shifts orders down', () => {
        session = addExercise(session, 'ex_1', now);
        session = addExercise(session, 'ex_2', now);
        session = addExercise(session, 'ex_3', now);

        const idToRemove = session.exercises[1].id;
        session = removeExercise(session, idToRemove);

        expect(session.exercises).toHaveLength(2);
        expect(session.exercises[0].exerciseId).toBe('ex_1');
        expect(session.exercises[0].order).toBe(1);
        expect(session.exercises[1].exerciseId).toBe('ex_3');
        expect(session.exercises[1].order).toBe(2);
      });
    });

    describe('addSetToExercise', () => {
      it('adds a set to a given exercise, incrementing setNumber', () => {
        session = addExercise(session, 'ex_1', now);
        const exerciseId = session.exercises[0].id;

        const partialSet = { weight: 100, reps: 5, isWarmup: false };

        const result1 = addSetToExercise(session, exerciseId, partialSet, now);
        expect(result1).not.toBeNull();
        if (result1) {
          session = result1.session;
          expect(result1.newSet.setNumber).toBe(1);
          expect(result1.newSet.weight).toBe(100);
          expect(result1.newSet.completedAt).toBe(now);
          expect(session.exercises[0].sets).toHaveLength(1);
          expect(session.exercises[0].sets[0]).toEqual(result1.newSet);
        }

        const result2 = addSetToExercise(session, exerciseId, { weight: 110, reps: 3, isWarmup: false }, now);
        expect(result2).not.toBeNull();
        if (result2) {
          session = result2.session;
          expect(result2.newSet.setNumber).toBe(2);
          expect(session.exercises[0].sets).toHaveLength(2);
        }
      });

      it('returns null if exercise is not found', () => {
        const partialSet = { weight: 100, reps: 5, isWarmup: false };
        const result = addSetToExercise(session, 'nonexistent', partialSet, now);
        expect(result).toBeNull();
      });
    });

    describe('updateSet', () => {
      it('updates a set within an exercise', () => {
        session = addExercise(session, 'ex_1', now);
        const exerciseId = session.exercises[0].id;

        const addResult = addSetToExercise(session, exerciseId, { weight: 100, reps: 5, isWarmup: false }, now);
        if (addResult) session = addResult.session;

        const setId = session.exercises[0].sets[0].id;

        session = updateSet(session, exerciseId, setId, { reps: 8, weight: 90 });

        expect(session.exercises[0].sets[0].reps).toBe(8);
        expect(session.exercises[0].sets[0].weight).toBe(90);
        expect(session.exercises[0].sets[0].isWarmup).toBe(false); // Should not change
      });
    });

    describe('removeSet', () => {
      it('removes a set and shifts setNumbers down', () => {
        session = addExercise(session, 'ex_1', now);
        const exerciseId = session.exercises[0].id;

        const r1 = addSetToExercise(session, exerciseId, { weight: 100, reps: 5, isWarmup: false }, now);
        if (r1) session = r1.session;
        const r2 = addSetToExercise(session, exerciseId, { weight: 110, reps: 5, isWarmup: false }, now);
        if (r2) session = r2.session;
        const r3 = addSetToExercise(session, exerciseId, { weight: 120, reps: 5, isWarmup: false }, now);
        if (r3) session = r3.session;

        const idToRemove = session.exercises[0].sets[1].id;
        session = removeSet(session, exerciseId, idToRemove);

        const sets = session.exercises[0].sets;
        expect(sets).toHaveLength(2);
        expect(sets[0].weight).toBe(100);
        expect(sets[0].setNumber).toBe(1);
        expect(sets[1].weight).toBe(120);
        expect(sets[1].setNumber).toBe(2);
      });
    });
  });

  describe('finalization', () => {
    it('finalizes a session, computing duration', () => {
      const session = blankSession('Test', now); // startedAt = now
      const later = now + 120000; // 2 minutes later

      const finished = finalizeSession(session, later);

      expect(finished.status).toBe('completed');
      expect(finished.endedAt).toBe(later);
      expect(finished.durationSeconds).toBe(120);
    });

    it('abandons a session, computing duration', () => {
      const session = blankSession('Test', now); // startedAt = now
      const later = now + 60000; // 1 minute later

      const abandoned = abandonSession(session, later);

      expect(abandoned.status).toBe('abandoned');
      expect(abandoned.endedAt).toBe(later);
      expect(abandoned.durationSeconds).toBe(60);
    });

    it('handles negative duration gracefully', () => {
      const session = blankSession('Test', now);
      const before = now - 60000;

      const finished = finalizeSession(session, before);
      expect(finished.durationSeconds).toBe(0);
    });
  });

  describe('cloneTemplate', () => {
    it('clones a template with (copie) suffix and new id', () => {
      const cloned = cloneTemplate(mockTemplate, now);

      expect(cloned.id).not.toBe(mockTemplate.id);
      expect(cloned.id).toMatch(/^tpl_/);
      expect(cloned.name).toBe(`${mockTemplate.name} (copie)`);
      expect(cloned.clonedFrom).toBe(mockTemplate.id);
      expect(cloned.isBuiltIn).toBe(false);
      expect(cloned.createdAt).toBe(now);
      expect(cloned.updatedAt).toBe(now);
      expect(cloned.exercises).toEqual(mockTemplate.exercises);
    });
  });
});
