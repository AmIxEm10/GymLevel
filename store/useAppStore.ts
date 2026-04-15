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
  ConsumableItem,
  DeconditioningCheckResult,
  EquipmentItem,
  EquipmentSlot,
  Exercise,
  Inventory,
  MuscleGroupId,
  MuscleStatus,
  NewSetPayload,
  NewTemplatePayload,
  PersonalRecord,
  PlayerClass,
  PlayerClassId,
  Quest,
  UserPreferences,
  UserProfile,
  WorkoutSession,
  WorkoutTemplate,
} from '@/types';

import {
  BODYWEIGHT_MAX_KG,
  BODYWEIGHT_MIN_KG,
  STREAK_MAX_BONUS_DAYS,
  STREAK_XP_BONUS_PER_DAY,
} from '@/constants/gamification';
import {
  CONSUMABLE_TEMPLATES_BY_ID,
  createStarterConsumables,
  mintConsumable,
} from '@/data/consumables';
import { emptyEquippedMap } from '@/data/equipment';
import { EXERCISES, EXERCISES_BY_ID } from '@/data/exercises';
import { ALL_MUSCLE_IDS } from '@/data/muscleGroups';
import { createInitialMuscleStatsRecord } from '@/data/muscleGroups';
import {
  PLAYER_CLASSES,
  PLAYER_CLASSES_BY_ID,
  getPlayerClass,
} from '@/data/playerClasses';
import {
  BUILT_IN_TEMPLATES,
  BUILT_IN_TEMPLATES_BY_ID,
} from '@/data/workoutTemplates';

import {
  applySetBreakdownToProfile,
  applyXpToLevel,
  computeSetXp,
  effectiveSetWeight,
  updatePersonalRecord,
} from '@/services/gamificationService';
import {
  checkQuestProgress,
  expireQuests,
  generateDailyQuests,
  nextQuestExpiry,
  rollLootFromQuest,
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
// Default factories
// ---------------------------------------------------------------------------

const DEFAULT_PREFERENCES: UserPreferences = {
  weightUnit: 'kg',
  // Must be collected during onboarding ("Évaluation du Système").
  // initializeApp() short-circuits while this is null.
  bodyweightKg: null,
  defaultRestSeconds: 90,
  theme: 'dark',
  hapticFeedback: true,
  soundEffects: true,
  notifications: true,
};

function createDefaultInventory(now: number): Inventory {
  return {
    equipment: [],
    equipped: emptyEquippedMap(),
    consumables: createStarterConsumables(now),
  };
}

function createDefaultProfile(now: number): UserProfile {
  return {
    id: 'local_user',
    nickname: '',
    createdAt: now,

    hasAcceptedSystemTerms: false,

    // Default class chosen during onboarding — Guerrier is the starter hint.
    playerClassId: 'guerrier',
    playerClassChangedAt: null,

    totalXp: 0,
    level: 1,
    xpToNextLevel: 100,

    muscleStats: createInitialMuscleStatsRecord(),
    personalRecords: {},
    buffs: {},

    inventory: createDefaultInventory(now),

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
  playerClasses: PlayerClass[];

  // --- Non persisted runtime flags ---------------------------------------
  /** true once initializeApp() has completed its full pass. */
  isInitialized: boolean;
  /** true while profile.preferences.bodyweightKg is null — UI must route to onboarding. */
  needsOnboarding: boolean;

  // --- Lifecycle ----------------------------------------------------------
  initializeApp: () => void;
  resetProfile: () => void;

  // --- Identity -----------------------------------------------------------
  updateNickname: (name: string) => void;
  /** Accept the System terms — final step of the onboarding flow. */
  acceptSystemTerms: () => void;

  // --- Preferences --------------------------------------------------------
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  setBodyweight: (kg: number) => void;

  // --- Player Class (RPG) -------------------------------------------------
  setPlayerClass: (classId: PlayerClassId) => void;

  // --- Session / Tracker --------------------------------------------------
  startSessionFromTemplate: (templateId: string) => void;
  startBlankSession: (name?: string) => void;
  /** Random 5-exercise balanced session — "Donjon Instantané". */
  startInstantDungeon: () => void;
  addExerciseToSession: (exerciseId: string) => void;
  removeExerciseFromSession: (workoutExerciseId: string) => void;
  addSet: (workoutExerciseId: string, payload: NewSetPayload) => void;
  updateSet: (
    workoutExerciseId: string,
    setId: string,
    patch: Partial<AppStoreSetPatch>,
  ) => void;
  removeSet: (workoutExerciseId: string, setId: string) => void;
  endSession: () => void;
  abandonSession: () => void;

  // --- Gamification -------------------------------------------------------
  grantXp: (muscleId: MuscleGroupId | 'global', xp: number) => void;

  // --- Quests -------------------------------------------------------------
  refreshDailyQuests: (force?: boolean) => void;
  claimQuestReward: (questId: string) => void;

  // --- Equipment / Loot ---------------------------------------------------
  /** Non-persisted — last item minted by claimQuestReward, for "loot popup" UI. */
  lastLootDrop: EquipmentItem | null;
  equipItem: (itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;
  dismissLootDrop: () => void;

  // --- Consumables --------------------------------------------------------
  consumeItem: (itemId: string) => void;
  /** Non-persisted — recent consumed item, for a confirmation toast. */
  lastConsumed: ConsumableItem | null;
  dismissLastConsumed: () => void;

  // --- Templates ----------------------------------------------------------
  cloneTemplate: (templateId: string) => string | null;
  saveCustomTemplate: (payload: NewTemplatePayload) => string;
  deleteCustomTemplate: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Store implementation
// ---------------------------------------------------------------------------

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
      playerClasses: [...PLAYER_CLASSES],

      isInitialized: false,
      needsOnboarding: true,
      lastLootDrop: null,
      lastConsumed: null,

      // -------------------------------------------------------------------
      // Lifecycle
      // -------------------------------------------------------------------
      initializeApp: () => {
        const now = Date.now();
        const { profile: currentProfile } = get();

        // Daily quests do NOT depend on bodyweight — refresh them first so
        // the Quêtes tab is populated even before onboarding completes.
        get().refreshDailyQuests(false);

        // Onboarding gate — bodyweight + nickname + accepted terms.
        const prefs = currentProfile.preferences;
        const onboardingIncomplete =
          prefs.bodyweightKg === null ||
          currentProfile.nickname.trim().length === 0 ||
          !currentProfile.hasAcceptedSystemTerms;

        if (onboardingIncomplete) {
          set({ isInitialized: false, needsOnboarding: true });
          return;
        }

        let profile = refreshAllMuscleStatuses(currentProfile, now);

        let deconditioningResult: DeconditioningCheckResult | null = null;
        if (shouldRunDeconditioningCheck(profile, now)) {
          const out = runDeconditioningCheck(profile, now);
          profile = out.profile;
          deconditioningResult = out.result;
        }

        set({
          profile,
          lastDeconditioningResult: deconditioningResult,
          isInitialized: true,
          needsOnboarding: false,
        });
      },

      resetProfile: () => {
        set({
          profile: createDefaultProfile(Date.now()),
          activeSession: null,
          workoutHistory: [],
          customTemplates: [],
          activeQuests: [],
          completedQuests: [],
          lastQuestGenerationAt: null,
          lastDeconditioningResult: null,
          isInitialized: false,
          needsOnboarding: true,
          lastLootDrop: null,
        });
      },

      // -------------------------------------------------------------------
      // Identity
      // -------------------------------------------------------------------
      updateNickname: name => {
        // Trim + cap at 24 chars to keep the UI header tidy.
        const cleaned = name.trim().slice(0, 24);
        set(s => ({
          profile: { ...s.profile, nickname: cleaned },
        }));
      },

      acceptSystemTerms: () => {
        set(s => {
          const now = Date.now();
          const prefs = s.profile.preferences;
          const ok =
            prefs.bodyweightKg !== null &&
            s.profile.nickname.trim().length > 0;
          if (!ok) return s;
          return {
            profile: {
              ...s.profile,
              hasAcceptedSystemTerms: true,
              playerClassChangedAt: s.profile.playerClassChangedAt ?? now,
            },
            needsOnboarding: false,
          };
        });
      },

      // -------------------------------------------------------------------
      // Preferences
      // -------------------------------------------------------------------
      updatePreferences: patch => {
        set(s => ({
          profile: {
            ...s.profile,
            preferences: { ...s.profile.preferences, ...patch },
          },
        }));
      },

      setBodyweight: kg => {
        const clamped = Math.max(
          BODYWEIGHT_MIN_KG,
          Math.min(BODYWEIGHT_MAX_KG, Math.round(kg)),
        );
        set(s => ({
          profile: {
            ...s.profile,
            preferences: { ...s.profile.preferences, bodyweightKg: clamped },
          },
        }));
      },

      // -------------------------------------------------------------------
      // Player Class (RPG)
      // -------------------------------------------------------------------
      setPlayerClass: classId => {
        if (!PLAYER_CLASSES_BY_ID[classId]) return;
        const now = Date.now();
        set(s => ({
          profile: {
            ...s.profile,
            playerClassId: classId,
            playerClassChangedAt: now,
          },
        }));
      },

      // -------------------------------------------------------------------
      // Session / Tracker
      // -------------------------------------------------------------------
      startSessionFromTemplate: templateId => {
        const now = Date.now();
        const { builtInTemplates, customTemplates, activeSession } = get();
        if (activeSession) return;

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

      startInstantDungeon: () => {
        const now = Date.now();
        // Build a balanced 5-exercise pick: 1 push, 1 pull, 1 legs,
        // 1 core, 1 hiit-or-accessory.
        const pickOne = (cat: 'push' | 'pull' | 'legs' | 'core' | 'hiit') => {
          const pool = EXERCISES.filter(ex => ex.category === cat);
          if (pool.length === 0) return null;
          return pool[Math.floor(Math.random() * pool.length)] ?? null;
        };
        const picks = [
          pickOne('push'),
          pickOne('pull'),
          pickOne('legs'),
          pickOne('core'),
          pickOne('hiit'),
        ].filter((e): e is Exercise => e !== null);

        // Abandon any active session first
        if (get().activeSession) {
          get().abandonSession();
        }

        // Seed a blank session then append exercises
        let session = blankSession('Donjon Instantané', now);
        for (const ex of picks) {
          session = svcAddExercise(session, ex.id, now);
        }
        set({ activeSession: session });
      },

      addExerciseToSession: exerciseId => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({
          activeSession: svcAddExercise(activeSession, exerciseId, Date.now()),
        });
      },

      removeExerciseFromSession: workoutExerciseId => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({
          activeSession: svcRemoveExercise(activeSession, workoutExerciseId),
        });
      },

      addSet: (workoutExerciseId, payload) => {
        const now = Date.now();
        const state = get();
        const { activeSession, profile } = state;
        if (!activeSession) return;

        // Safety — onboarding must have set this. If not, we refuse to log the
        // set because XP cannot be computed safely on bodyweight exercises.
        const bodyweight = profile.preferences.bodyweightKg;
        if (bodyweight === null) {
          set({ needsOnboarding: true });
          return;
        }

        // 1) Append the set to the session
        const added = svcAddSet(activeSession, workoutExerciseId, payload, now);
        if (!added) return;
        const { session: sessionWithSet, newSet } = added;

        // 2) Resolve exercise + class for XP computation
        const we = sessionWithSet.exercises.find(e => e.id === workoutExerciseId)!;
        const exercise = EXERCISES_BY_ID[we.exerciseId];
        if (!exercise) {
          set({ activeSession: sessionWithSet });
          return;
        }

        const playerClass = getPlayerClass(profile.playerClassId);

        // 3) Compute XP breakdown (class multiplier + equipment multiplier).
        //    currentStreak and equipped items are read from the profile so
        //    the Healer's 'streak_active' bonus and any equipped loot can
        //    evaluate on every set.
        const breakdown = computeSetXp(
          newSet,
          exercise,
          profile.muscleStats,
          bodyweight,
          playerClass,
          profile.currentStreak,
          profile.inventory.equipped,
        );

        // 4) Apply to profile (XP + level + per-muscle stats)
        let nextProfile = applySetBreakdownToProfile(profile, breakdown, now);

        // 4bis) Update PRs if this set beats anything on record
        const effectiveW = effectiveSetWeight(newSet, exercise, bodyweight);
        const existingPr = nextProfile.personalRecords[exercise.id];
        const { pr, improved } = updatePersonalRecord(
          existingPr,
          newSet,
          exercise.id,
          effectiveW,
          now,
        );
        if (improved || !existingPr) {
          nextProfile = {
            ...nextProfile,
            personalRecords: {
              ...nextProfile.personalRecords,
              [exercise.id]: pr,
            },
          };
        }

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

        // 6) Feed quests — the listener
        const category = exercise.category;
        let quests = state.activeQuests;

        // Volume quests (filtered or not)
        quests = checkQuestProgress(
          quests,
          {
            type: 'volume_total',
            value: breakdown.volume,
            filter: { category },
          },
          now,
        );

        if (!newSet.isWarmup) {
          // Working set counters
          quests = checkQuestProgress(
            quests,
            { type: 'set_count', value: 1, filter: { category } },
            now,
          );

          // Total reps — drives the ENDURANCE category
          quests = checkQuestProgress(
            quests,
            {
              type: 'total_reps',
              value: newSet.reps,
              filter: { category },
            },
            now,
          );

          // Max-weight PR (STRENGTH) — per-exercise and per-category both match
          quests = checkQuestProgress(
            quests,
            {
              type: 'max_weight',
              value: effectiveW,
              filter: { category, exerciseIds: [exercise.id] },
            },
            now,
          );
        }

        for (const p of breakdown.perMuscle) {
          quests = checkQuestProgress(
            quests,
            {
              type: 'muscle_xp',
              value: p.xpAfterStatus,
              filter: { muscleId: p.muscleId },
            },
            now,
          );
          quests = checkQuestProgress(
            quests,
            {
              type: 'muscle_volume',
              value: breakdown.volume * p.share,
              filter: { muscleId: p.muscleId },
            },
            now,
          );
        }

        set({
          activeSession: nextSession,
          profile: nextProfile,
          activeQuests: quests,
        });
      },

      updateSet: (workoutExerciseId, setId, patch) => {
        const { activeSession } = get();
        if (!activeSession) return;
        // Edits are not retroactively re-XP'd (MVP design decision).
        set({
          activeSession: svcUpdateSet(activeSession, workoutExerciseId, setId, patch),
        });
      },

      removeSet: (workoutExerciseId, setId) => {
        const { activeSession } = get();
        if (!activeSession) return;
        set({
          activeSession: svcRemoveSet(activeSession, workoutExerciseId, setId),
        });
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

        const globalAfter = applyXpToLevel(
          profile.level,
          profile.totalXp,
          streakBonus,
        );

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

        // Only emit streak_day when the streak actually advances today
        // (prevents multiple same-day sessions from double-counting).
        if (!isSameDay) {
          quests = checkQuestProgress(
            quests,
            { type: 'streak_day', value: 1 },
            now,
          );
        }

        if (finalized.durationSeconds) {
          quests = checkQuestProgress(
            quests,
            { type: 'workout_duration', value: finalized.durationSeconds },
            now,
          );
        }

        // Early workout (DISCIPLINE) — fired once per session if started before 8:00.
        const startedHour = new Date(finalized.startedAt).getHours();
        if (startedHour < 8) {
          quests = checkQuestProgress(
            quests,
            { type: 'early_workout', value: 1 },
            now,
          );
        }

        set({
          activeSession: null,
          profile: nextProfile,
          workoutHistory: [finalized, ...workoutHistory],
          activeQuests: quests,
        });

        // Re-evaluate statuses (maybe just pushed a muscle into 'epuise')
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
      // Gamification (manual XP grants — quests, bonuses, admin)
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
        const {
          activeQuests,
          completedQuests,
          lastQuestGenerationAt,
          profile,
        } = get();

        const expired = expireQuests(activeQuests, now);
        const stillActive = expired.filter(q => q.status === 'active');
        const movedToCompleted = expired.filter(q => q.status === 'completed');

        const needsNew =
          force ||
          stillActive.length === 0 ||
          !lastQuestGenerationAt ||
          now >= nextQuestExpiry(lastQuestGenerationAt) - 1;

        if (needsNew) {
          // Aggregate PR peaks for quest scaling
          let peakWeightPr = 0;
          let peakVolumePr = 0;
          for (const pr of Object.values(profile.personalRecords)) {
            if (pr.bestWeight > peakWeightPr) peakWeightPr = pr.bestWeight;
            if (pr.bestVolume > peakVolumePr) peakVolumePr = pr.bestVolume;
          }

          const fresh = generateDailyQuests(
            {
              level: profile.level,
              currentStreak: profile.currentStreak,
              peakWeightPr,
              peakVolumePr,
            },
            now,
          );
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

        // 1) Global XP reward
        get().grantXp('global', quest.xpReward);

        // 2) Roll loot (if the quest has a reward defined)
        const lootItem = rollLootFromQuest(quest, now);

        set(s => ({
          activeQuests: s.activeQuests.filter(q => q.id !== questId),
          completedQuests: [
            { ...quest, completedAt: quest.completedAt ?? now },
            ...s.completedQuests,
          ].slice(0, 200),
          profile: lootItem
            ? {
                ...s.profile,
                inventory: {
                  ...s.profile.inventory,
                  equipment: [lootItem, ...s.profile.inventory.equipment],
                },
              }
            : s.profile,
          lastLootDrop: lootItem ?? s.lastLootDrop,
        }));
      },

      // -------------------------------------------------------------------
      // Equipment / Loot
      // -------------------------------------------------------------------
      equipItem: itemId => {
        set(s => {
          const inventory = s.profile.inventory;
          const item = inventory.equipment.find(e => e.id === itemId);
          if (!item) return s;

          // Replace whatever is currently in that slot (if anything).
          const nextEquipped = {
            ...inventory.equipped,
            [item.slot]: item,
          };

          return {
            profile: {
              ...s.profile,
              inventory: {
                ...inventory,
                equipped: nextEquipped,
              },
            },
          };
        });
      },

      unequipItem: slot => {
        set(s => {
          const inventory = s.profile.inventory;
          if (!inventory.equipped[slot]) return s;
          return {
            profile: {
              ...s.profile,
              inventory: {
                ...inventory,
                equipped: { ...inventory.equipped, [slot]: null },
              },
            },
          };
        });
      },

      dismissLootDrop: () => {
        set({ lastLootDrop: null });
      },

      // -------------------------------------------------------------------
      // Consumables
      // -------------------------------------------------------------------
      consumeItem: itemId => {
        set(s => {
          const item = s.profile.inventory.consumables.find(c => c.id === itemId);
          if (!item) return s;

          let profile = s.profile;

          // Apply effect
          switch (item.effect.kind) {
            case 'reduce_fatigue': {
              // Roll back each muscle's status by the given percent — we
              // shave that share of volumeLast24h AND soften the status
              // tier by one level for a meaningful immediate feedback.
              const reduction = item.effect.percent / 100;
              const nextMuscleStats = { ...profile.muscleStats };
              for (const id of ALL_MUSCLE_IDS) {
                const stats = nextMuscleStats[id];
                const nextStatus: MuscleStatus =
                  stats.status === 'epuise'
                    ? 'fatigue'
                    : stats.status === 'fatigue'
                    ? 'actif'
                    : stats.status === 'actif'
                    ? 'frais'
                    : 'frais';
                nextMuscleStats[id] = {
                  ...stats,
                  volumeLast24h: Math.max(0, stats.volumeLast24h * (1 - reduction)),
                  status: nextStatus,
                  statusUntil: nextStatus === 'epuise' ? stats.statusUntil : null,
                };
              }
              profile = { ...profile, muscleStats: nextMuscleStats };
              break;
            }
            case 'instant_xp': {
              const g = applyXpToLevel(
                profile.level,
                profile.totalXp,
                item.effect.amount,
              );
              profile = {
                ...profile,
                totalXp: g.xp,
                level: g.level,
                xpToNextLevel: g.xpToNextLevel,
              };
              break;
            }
            case 'unlock_dungeon':
              // Placeholder — will be wired to a scripted dungeon later.
              break;
          }

          return {
            profile: {
              ...profile,
              inventory: {
                ...profile.inventory,
                consumables: profile.inventory.consumables.filter(
                  c => c.id !== itemId,
                ),
              },
            },
            lastConsumed: item,
          };
        });
      },

      dismissLastConsumed: () => {
        set({ lastConsumed: null });
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
      version: 4,
      migrate: (persistedState, version) => {
        const s =
          (persistedState as
            | {
                profile?: Record<string, unknown>;
                activeQuests?: unknown;
                lastQuestGenerationAt?: number | null;
              }
            | null) ?? ({} as Record<string, unknown>);

        // v1 → v2: UserProfile.username was renamed to UserProfile.nickname.
        if (version < 2) {
          if (s.profile && typeof s.profile === 'object') {
            const p = s.profile as Record<string, unknown>;
            if (typeof p.nickname !== 'string') {
              p.nickname =
                typeof p.username === 'string' ? p.username : 'Chasseur';
            }
            delete p.username;
          }
        }

        // v2 → v3: Quest shape gained `category` + `rank` + `templateId`.
        if (version < 3) {
          s.activeQuests = [];
          s.lastQuestGenerationAt = null;
        }

        // v3 → v4:
        //   - 7-class roster collapsed to 3 (guerrier/assassin/tank)
        //   - New UserProfile fields: personalRecords, buffs,
        //     hasAcceptedSystemTerms
        //   - New inventory.consumables array
        //   - Wipe activeQuests again since their targets were scaled on
        //     the old class and lack PR-aware fields.
        if (version < 4) {
          if (s.profile && typeof s.profile === 'object') {
            const p = s.profile as Record<string, unknown>;
            const oldClass = p.playerClassId as string | undefined;
            const mapping: Record<string, PlayerClassId> = {
              guerrier: 'guerrier',
              assassin: 'assassin',
              tank: 'tank',
              // legacy values:
              tanker: 'guerrier',
              fighter: 'tank',
              mage: 'tank',
              healer: 'tank',
              ranger: 'assassin',
              novice: 'guerrier',
            };
            p.playerClassId = mapping[oldClass ?? 'guerrier'] ?? 'guerrier';

            if (!p.personalRecords) p.personalRecords = {};
            if (!p.buffs) p.buffs = {};
            if (typeof p.hasAcceptedSystemTerms !== 'boolean') {
              // Existing users with a non-empty nickname + bodyweight are
              // considered onboarded retroactively.
              const prefs = (p.preferences as Record<string, unknown>) ?? {};
              const hasBw = typeof prefs.bodyweightKg === 'number';
              const hasName =
                typeof p.nickname === 'string' && p.nickname.trim().length > 0;
              p.hasAcceptedSystemTerms = hasBw && hasName;
            }

            const inventory = p.inventory as Record<string, unknown> | undefined;
            if (inventory && !inventory.consumables) {
              inventory.consumables = [];
            }
          }

          s.activeQuests = [];
          s.lastQuestGenerationAt = null;
        }

        return persistedState as never;
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// Convenience selectors
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
export const selectPlayerClass = (s: AppState) =>
  getPlayerClass(s.profile.playerClassId);
export const selectBodyweightKg = (s: AppState) =>
  s.profile.preferences.bodyweightKg;
export const selectNeedsOnboarding = (s: AppState) => s.needsOnboarding;
export const selectIsInitialized = (s: AppState) => s.isInitialized;
export const selectInventory = (s: AppState) => s.profile.inventory;
export const selectEquipped = (s: AppState) => s.profile.inventory.equipped;
export const selectLastLootDrop = (s: AppState) => s.lastLootDrop;
