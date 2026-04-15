/**
 * dbHelper — platform-agnostic interface for session persistence.
 *
 * Native (iOS/Android) resolves `dbHelper.native.ts` which uses expo-sqlite.
 * Web resolves `dbHelper.web.ts` which is a no-op (AsyncStorage via Zustand
 * persist already covers the web build).
 *
 * Metro picks the right file automatically via the .native.ts / .web.ts
 * extension conventions.
 */

import type { WorkoutSession } from '@/types';

export interface DbHelper {
  /** Initialise the schema. Safe to call multiple times. */
  init: () => Promise<void>;
  /** Persist a finalized session. */
  saveSession: (session: WorkoutSession) => Promise<void>;
  /** Return the N most recent sessions, ordered by endedAt desc. */
  getRecentSessions: (limit?: number) => Promise<WorkoutSession[]>;
  /** Wipe everything (used by resetProfile). */
  clearAll: () => Promise<void>;
}

// Default stub — overridden by `.native.ts` on native platforms.
const noop: DbHelper = {
  async init() {},
  async saveSession() {},
  async getRecentSessions() {
    return [];
  },
  async clearAll() {},
};

export default noop;
