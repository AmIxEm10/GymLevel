/**
 * Native dbHelper — persists finalized sessions into a local SQLite DB.
 * Uses expo-sqlite. All methods fall back to no-op if the native module
 * isn't available (e.g. dev snapshot without rebuild).
 */
import type { WorkoutSession } from '@/types';
import type { DbHelper } from './dbHelper';

// Lazy import — expo-sqlite is a native module; we only touch it if actually
// running on a native platform at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _SQLite: any = null;

function getDb() {
  if (_db) return _db;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _SQLite = require('expo-sqlite');
    _db = _SQLite.openDatabaseSync
      ? _SQLite.openDatabaseSync('gymlevel.db')
      : _SQLite.openDatabase?.('gymlevel.db');
  } catch {
    _db = null;
  }
  return _db;
}

async function exec(sql: string, params: unknown[] = []): Promise<void> {
  const db = getDb();
  if (!db) return;
  if (typeof db.runAsync === 'function') {
    await db.runAsync(sql, params);
  } else if (typeof db.execAsync === 'function') {
    await db.execAsync(sql);
  }
}

async function all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = getDb();
  if (!db) return [];
  if (typeof db.getAllAsync === 'function') {
    return (await db.getAllAsync(sql, params)) as T[];
  }
  return [];
}

const nativeHelper: DbHelper = {
  async init() {
    await exec(
      `CREATE TABLE IF NOT EXISTS workout_sessions (
        id TEXT PRIMARY KEY,
        startedAt INTEGER NOT NULL,
        endedAt INTEGER,
        durationSeconds INTEGER,
        totalVolume REAL,
        totalXpGained REAL,
        status TEXT,
        payload TEXT NOT NULL
      );`,
    );
  },

  async saveSession(session: WorkoutSession) {
    await exec(
      `INSERT OR REPLACE INTO workout_sessions
       (id, startedAt, endedAt, durationSeconds, totalVolume, totalXpGained, status, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        session.id,
        session.startedAt,
        session.endedAt ?? null,
        session.durationSeconds ?? null,
        session.totalVolume,
        session.totalXpGained,
        session.status,
        JSON.stringify(session),
      ],
    );
  },

  async getRecentSessions(limit = 50) {
    const rows = await all<{ payload: string }>(
      `SELECT payload FROM workout_sessions ORDER BY endedAt DESC LIMIT ?;`,
      [limit],
    );
    return rows
      .map(r => {
        try {
          return JSON.parse(r.payload) as WorkoutSession;
        } catch {
          return null;
        }
      })
      .filter((s): s is WorkoutSession => s !== null);
  },

  async clearAll() {
    await exec(`DELETE FROM workout_sessions;`);
  },
};

export default nativeHelper;
