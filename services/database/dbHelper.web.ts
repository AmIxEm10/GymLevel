/**
 * Web stub for dbHelper — AsyncStorage via Zustand persist already
 * covers web sessions, so the SQLite layer is a no-op here. The file
 * exists to stop Metro from trying to resolve expo-sqlite in the web
 * bundle.
 */
import type { WorkoutSession } from '@/types';
import type { DbHelper } from './dbHelper';

const webHelper: DbHelper = {
  async init() {
    /* no-op */
  },
  async saveSession(_session: WorkoutSession) {
    /* no-op */
  },
  async getRecentSessions(_limit?: number) {
    return [];
  },
  async clearAll() {
    /* no-op */
  },
};

export default webHelper;
