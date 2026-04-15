/**
 * useAppStore.ts
 * --------------
 * Zustand store — the single reactive source of truth for the UI.
 * Persistence is delegated to AsyncStorage (SQLite mirror comes later via
 * services/database). All business logic is delegated to /services; the
 * store only orchestrates and exposes actions.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  DeconditioningCheckResult,
  Exercise,
  MuscleGroupId,
  NewSetPayload,
  NewTemplatePayload,
  Quest,
  UserPreferences,
  UserProfile,
  WorkoutSession,
  WorkoutTemplate,
} from '@/types';

import { BODYWEIGHT_DEFAULT_KG, STREAK_XP_BONUS_PER_DAY, STREAK_MAX_BONUS_DAYS } from '@/constants/gamification';
import { EXERCISES, EXERCISES_BY_ID } from '@/data/exercises';
import { createInitialMuscleStatsRecord } from '@/data/muscleGroups';
import { BUILT_IN_TEMPLATES, BUILT_IN_TEMPLATES_BY_ID } from '@/data/workoutTemplates';

import {
  applySetBreakdownToProfile,
  applyXpToLevel,
  computeSetXp,
} from '@/services/gamificationService';
import {
  applyQuestEvent,
  expireQuests,
  generateDailyQuests,
  nextQuestExpiry,
} from '@/services/questService';
import {
  refreshAllMuscleStatuses,
  runDeconditioningCheck,
  shouldRunDeconditioningCheck,
} from '@/services/recoveryService';
import {
  abandonSession as svcAbandonSession,
  addExercise as svcAddExercise,
  addSetToExercise as svcAddSet,
  blankSession,
  cloneTemplate as svcCloneTemplate,
  finalizeSession as svcFinalizeSession,
  removeExercise as svcRemoveExercise,
  removeSet as svcRemoveSet,
  sessionFromTemplate,
  updateSet as svcUpdateSet,
} from '@/services/workoutService';

// ---------------------------------------------------------------------------
// Default profile factory
// ---------------------------------------------------------------------------

const DEFAULT_PREFERENCES: UserPreferences = {
  weightUnit: 'kg',
  defaultRestSeconds: 90,
  theme: 'dark',
  hapticFeedback: true,
  soundEffects: true,
  notifications: true,
};

function createDefaultProfile(now: number): UserProfile {
  return {
    id: 'local_user',
    username: 'Challenger',
    createdAt: now,
    totalXp: 0,
    level: 1,
    xpToNextLevel: 100,
    muscleStats: createInitialMuscleStatsRecord(),
    currentStreak: 0,
    longestStreak: 0,
    totalWorkouts: 0,
    totalVolumeLifetime: 0,
    lastWorkoutAt: null,
    preferences: DEFAULT_PREFERENCES,
  };
}

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface AppState {
  // --- Persisted ----------------------------------------------------------
  profile: UserProfile;
  activeSession: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  customTemplates: WorkoutTemplate[];
  activeQuests: Quest[];
  completedQuests: Quest[];
  lastQuestGenerationAt: number | null;
  lastDeconditioningResult: DeconditioningCheckResult | null;

  // --- Non persisted (runtime lookups) ------------------------------------
  builtInTemplates: WorkoutTemplate[];
  exercises: Exercise[];

  // --- Lifecycle ----------------------------------------------------------
  initializeApp: () => void;
  resetProfile: () => void;

  // --- Preferences --------------------------------------------------------
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  setBodyweight: (kg: number) => void;

  // --- Session / Tracker --------------------------------------------------
  startSessionFromTemplate: (templateId: string) => void;
  startBlankSession: (name?: string) => void;
  addExerciseToSession: (exerciseId: string) => void;
  removeExerciseFromSession: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string, payload: NewSetPayload) => void;
  updateSet: (workoutExerciseId: string, setId: string, patch: Partial<AppStoreSetPatch>) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  endSession: () => void;
  abandonSession: () => void;

  // --- Gamification -------------------------------------------------------
  /** Manual XP adjustment (quests, bonuses, admin). */
  grantXp: (muscleId: MuscleGroupId | 'global', xp: number) => void;

  // --- Quests -------------------------------------------------------------
  refreshDailyQuests: (force?: boolean) => void;
  claimQuestReward: (questId: string) => void;

  // --- Templates ----------------------------------------------------------
  cloneTemplate: (templateId: string) => string | null;
  saveCustomTemplate: (payload: NewTemplatePayload) => string;
  deleteCustomTemplate: (id: string) => void;
}

/** Limited subset of WorkoutSet fields allowed for updates via the store. */
type AppStoreSetPatch = {
  reps: number;
  weight: number;
  rpe: number;
  isWarmup: boolean;
  isDropset: boolean;
  isFailure: boolean;
  notes: string;
  restAfterSeconds: number;
};

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

const bodyweightFromPrefs = (_p: UserPreferences): number => BODYWEIGHT_DEFAULT_KG;
// TODO: wire a dedicated `bodyweightKg` preference once the user profile form lands.

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: createDefaultProfile(Date.now()),
      activeSession: null,
      workoutHistory: [],
      customTemplates: [],
      activeQuests: [],
      completedQuests: [],
      lastQuestGenerationAt: null,
      lastDeconditioningResult: null,

      builtInTemplates: [...BUILT_IN_TEMPLATES],
      exercises: [...EXERCISES],

      // -------------------------------------------------------------------
      // Lifecycle
      // -------------------------------------------------------------------
      initializeApp: () => {
        const now = Date.now();
        let profile = get().profile;

        // 1) Refresh status on every boot
        profile = refreshAllMuscleStatuses(profile, now);

        // 2) Deconditioning check (Mode Survie)
        let deconditioningResult: DeconditioningCheckResult | null = null;
        if (shouldRunDeconditioningCheck(profile, now)) {
          const out = runDeconditioningCheck(profile, now);
          profile = out.profile;
          deconditioningResult = out.result;
        }

        set({ profile, lastDeconditioningResult: deconditioningResult });

        // 3) Quests refresh
        get().refreshDailyQuests(false);
      },

      resetProfile: () => {
        const now = Date.now();
        set({
          profile: createDefaultProfile(now),
          activeSession: null,
          workoutHistory: [],
          customTemplates: [],
          activeQuests: [],
          completedQuests: [],
          lastQuestGenerationAt: null,
          lastDeconditioningResult: null,
        });
      },

      // -------------------------------------------------------------------
      // Preferences
      // -------------------------------------------------------------------
      updatePreferences: patch => {
        set(s => ({
          profile: { ...s.profile, preferences: { ...s.profile.preferences, ...patch } },
        }));
      },

      setBodyweight: (_kg: number) => {
        // Placeholder — to be wired once we add `bodyweightKg` to UserProfile.
      },

      // -------------------------------------------------------------------
      // Session / Tracker
      // -------------------------------------------------------------------
      startSessionFromTemplate: templateId => {
        const now = Date.now();
        const { builtInTemplates, customTemplates, activeSession } = get();
        if (activeSession) return; // must finish/abandon first

        const template =
          BUILT_IN_TEMPLATES_BY_ID[templateId] ??
          customTemplates.find(t => t.id === templateId) ??
          builtInTemplates.find(t => t.id === templateId);
        if (!template) return;

        set({ activeSession: sessionFromTemplate(template, now) });
      },

      startBlankSession: (name = 'Séance libre') => {
        if (get().activeSession) return;
        set({ activeSession: blankSession(name, Date.now()) });
      },

      addExerciseToSession: exerciseId => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({ activeSession: svcAddExercise(activeSession, exerciseId, Date.now()) });
      },

      removeExerciseFromSession: workoutExerciseId => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({ activeSession: svcRemoveExercise(activeSession, workoutExerciseId) });
      },

      addSet: (workoutExerciseId, payload) => {
        const now = Date.now();
        const state = get();
        const { activeSession, profile } = state;
        if (!activeSession) return;

        // 1) Append the set to the session
        const added = svcAddSet(activeSession, workoutExerciseId, payload, now);
        if (!added) return;
        const { session: sessionWithSet, newSet } = added;

        // 2) Find the exercise to route XP
        const we = sessionWithSet.exercises.find(e => e.id === workoutExerciseId)!;
        const exercise = EXERCISES_BY_ID[we.exerciseId];
        if (!exercise) {
          set({ activeSession: sessionWithSet });
          return;
        }

        // 3) Compute XP breakdown
        const bodyweight = bodyweightFromPrefs(profile.preferences);
        const breakdown = computeSetXp(newSet, exercise, profile.muscleStats, bodyweight);

        // 4) Apply to profile
        const nextProfile = applySetBreakdownToProfile(profile, breakdown, now);

        // 5) Update session aggregates
        const nextSession: WorkoutSession = {
          ...sessionWithSet,
          totalVolume: sessionWithSet.totalVolume + breakdown.volume,
          totalXpGained: sessionWithSet.totalXpGained + breakdown.totalXp,
          xpByMuscle: breakdown.perMuscle.reduce(
            (acc, p) => {
              acc[p.muscleId] = (acc[p.muscleId] ?? 0) + p.xpAfterStatus;
              return acc;
            },
            { ...sessionWithSet.xpByMuscle } as Record<MuscleGroupId, number>,
          ),
        };

        // 6) Feed quests
        let quests = state.activeQuests;
        if (!newSet.isWarmup) {
          quests = applyQuestEvent(quests, { type: 'set_count', value: 1 }, now);
        }
        quests = applyQuestEvent(
          quests,
          { type: 'volume_total', value: breakdown.volume },
          now,
        );
        for (const p of breakdown.perMuscle) {
          quests = applyQuestEvent(
            quests,
            { type: 'muscle_xp', value: p.xpAfterStatus, filter: { muscleId: p.muscleId } },
            now,
          );
          quests = applyQuestEvent(
            quests,
            { type: 'muscle_volume', value: breakdown.volume * p.share, filter: { muscleId: p.muscleId } },
            now,
          );
        }

        set({ activeSession: nextSession, profile: nextProfile, activeQuests: quests });
      },

      updateSet: (workoutExerciseId, setId, patch) => {
        const { activeSession } = get();
        if (!activeSession) return;
        // NOTE: updating a set does NOT retroactively recompute XP. A real
        // recompute requires replaying the session; we defer that to an
        // explicit "re-sync" action to keep perf predictable.
        set({ activeSession: svcUpdateSet(activeSession, workoutExerciseId, setId, patch) });
      },

      removeSet: (workoutExerciseId, setId) => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({ activeSession: svcRemoveSet(activeSession, workoutExerciseId, setId) });
      },

      endSession: () => {
        const now = Date.now();
        const { activeSession, profile, workoutHistory } = get();
        if (!activeSession) return;

        const finalized = svcFinalizeSession(activeSession, now);

        // Streak handling
        const lastAt = profile.lastWorkoutAt;
        const isSameDay =
          lastAt !== null &&
          new Date(lastAt).toDateString() === new Date(now).toDateString();
        const isYesterday =
          lastAt !== null &&
          new Date(lastAt).toDateString() ===
            new Date(now - 24 * 60 * 60 * 1000).toDateString();
        const nextStreak = isSameDay
          ? profile.currentStreak
          : isYesterday
          ? profile.currentStreak + 1
          : 1;

        const streakBonus =
          Math.min(nextStreak, STREAK_MAX_BONUS_DAYS) * STREAK_XP_BONUS_PER_DAY;

        const globalAfter = applyXpToLevel(profile.level, profile.totalXp, streakBonus);

        const nextProfile: UserProfile = {
          ...profile,
          totalXp: globalAfter.xp,
          level: globalAfter.level,
          xpToNextLevel: globalAfter.xpToNextLevel,
          currentStreak: nextStreak,
          longestStreak: Math.max(profile.longestStreak, nextStreak),
          totalWorkouts: profile.totalWorkouts + 1,
          lastWorkoutAt: now,
        };

        // Feed streak & duration quests
        let quests = get().activeQuests;
        quests = applyQuestEvent(quests, { type: 'streak_day', value: 1 }, now);
        if (finalized.durationSeconds) {
          quests = applyQuestEvent(
            quests,
            { type: 'workout_duration', value: finalized.durationSeconds },
            now,
          );
        }

        set({
          activeSession: null,
          profile: nextProfile,
          workoutHistory: [finalized, ...workoutHistory],
          activeQuests: quests,
        });

        // Re-evaluate muscle statuses after session end
        set(s => ({ profile: refreshAllMuscleStatuses(s.profile, now) }));
      },

      abandonSession: () => {
        const now = Date.now();
        const { activeSession, workoutHistory } = get();
        if (!activeSession) return;
        const abandoned = svcAbandonSession(activeSession, now);
        set({
          activeSession: null,
          workoutHistory: [abandoned, ...workoutHistory],
        });
      },

      // -------------------------------------------------------------------
      // Gamification
      // -------------------------------------------------------------------
      grantXp: (muscleId, xp) => {
        const now = Date.now();
        set(s => {
          const { profile } = s;
          if (muscleId === 'global') {
            const g = applyXpToLevel(profile.level, profile.totalXp, xp);
            return {
              profile: {
                ...profile,
                totalXp: g.xp,
                level: g.level,
                xpToNextLevel: g.xpToNextLevel,
              },
            };
          }
          const m = profile.muscleStats[muscleId];
          const mAfter = applyXpToLevel(m.level, m.xp, xp);
          const g = applyXpToLevel(profile.level, profile.totalXp, xp);
          return {
            profile: {
              ...profile,
              totalXp: g.xp,
              level: g.level,
              xpToNextLevel: g.xpToNextLevel,
              muscleStats: {
                ...profile.muscleStats,
                [muscleId]: {
                  ...m,
                  xp: mAfter.xp,
                  level: mAfter.level,
                  xpToNextLevel: mAfter.xpToNextLevel,
                  lastTrainedAt: xp > 0 ? now : m.lastTrainedAt,
                },
              },
            },
          };
        });
      },

      // -------------------------------------------------------------------
      // Quests
      // -------------------------------------------------------------------
      refreshDailyQuests: (force = false) => {
        const now = Date.now();
        const { activeQuests, completedQuests, lastQuestGenerationAt } = get();

        // Expire first
        const expired = expireQuests(activeQuests, now);
        const stillActive = expired.filter(q => q.status === 'active');
        const movedToCompleted = expired.filter(q => q.status === 'completed');

        // Do we need a new batch?
        const needsNew =
          force ||
          stillActive.length === 0 ||
          !lastQuestGenerationAt ||
          now >= nextQuestExpiry(lastQuestGenerationAt) - 1;

        if (needsNew) {
          const fresh = generateDailyQuests(now);
          set({
            activeQuests: fresh,
            completedQuests: [...movedToCompleted, ...completedQuests].slice(0, 200),
            lastQuestGenerationAt: now,
          });
        } else {
          set({
            activeQuests: stillActive,
            completedQuests: [...movedToCompleted, ...completedQuests].slice(0, 200),
          });
        }
      },

      claimQuestReward: questId => {
        const now = Date.now();
        const { activeQuests } = get();
        const quest = activeQuests.find(q => q.id === questId);
        if (!quest || quest.status !== 'completed') return;

        // Award global XP
        get().grantXp('global', quest.xpReward);

        set(s => ({
          activeQuests: s.activeQuests.filter(q => q.id !== questId),
          completedQuests: [
            { ...quest, completedAt: quest.completedAt ?? now },
            ...s.completedQuests,
          ].slice(0, 200),
        }));
      },

      // -------------------------------------------------------------------
      // Templates
      // -------------------------------------------------------------------
      cloneTemplate: templateId => {
        const now = Date.now();
        const { builtInTemplates, customTemplates } = get();
        const src =
          BUILT_IN_TEMPLATES_BY_ID[templateId] ??
          builtInTemplates.find(t => t.id === templateId) ??
          customTemplates.find(t => t.id === templateId);
        if (!src) return null;
        const cloned = svcCloneTemplate(src, now);
        set(s => ({ customTemplates: [cloned, ...s.customTemplates] }));
        return cloned.id;
      },

      saveCustomTemplate: payload => {
        const now = Date.now();
        const id = `tpl_custom_${now}`;
        const tpl: WorkoutTemplate = {
          ...payload,
          id,
          isBuiltIn: false,
          createdAt: now,
          updatedAt: now,
        };
        set(s => ({ customTemplates: [tpl, ...s.customTemplates] }));
        return id;
      },

      deleteCustomTemplate: id => {
        set(s => ({ customTemplates: s.customTemplates.filter(t => t.id !== id) }));
      },
    }),
    {
      name: 'gymlevel-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        profile: state.profile,
        activeSession: state.activeSession,
        workoutHistory: state.workoutHistory,
        customTemplates: state.customTemplates,
        activeQuests: state.activeQuests,
        completedQuests: state.completedQuests,
        lastQuestGenerationAt: state.lastQuestGenerationAt,
        lastDeconditioningResult: state.lastDeconditioningResult,
      }),
      version: 1,
    },
  ),
);

// ---------------------------------------------------------------------------
// Convenience selectors (tree-shaken when unused)
// ---------------------------------------------------------------------------

export const selectProfile = (s: AppState) => s.profile;
export const selectActiveSession = (s: AppState) => s.activeSession;
export const selectMuscleStats =
  (id: MuscleGroupId) => (s: AppState) => s.profile.muscleStats[id];
export const selectAllTemplates = (s: AppState) => [
  ...s.builtInTemplates,
  ...s.customTemplates,
];
export const selectActiveQuests = (s: AppState) => s.activeQuests;
