import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  DEFAULT_PREFERENCES,
  SubscriptionRecord,
  UserPreferences,
} from '../types/subscription';

/**
 * Local Data Persistence Service using IndexedDB (`idb`) with Schema Versioning.
 *
 * Schema Migration Strategy:
 * - Database Name: `renewradar_db`
 * - Current Version: `1`
 * - Object Stores:
 *   1. `subscriptions` (keyPath: `id`, indexes: `status`, `category`, `currency`, `nextRenewalDate`)
 *   2. `preferences` (keyPath: `id`, singleton key `'user_preferences'`)
 * - Future versions (`oldVersion < 2`, etc.) can inspect `oldVersion` in `upgrade(db, oldVersion, newVersion, transaction)`
 *   and transform records in place without losing existing user data.
 * - Fallback: If IndexedDB is unavailable or blocked (e.g., restricted sandboxed iframe or test runner),
 *   gracefully falls back to `localStorage` and in-memory storage while reporting storage status.
 */

const DB_NAME = 'renewradar_db';
export const CURRENT_SCHEMA_VERSION = 1;
const PREFS_KEY = 'user_preferences';
const FALLBACK_SUBS_KEY = 'renewradar_fallback_subscriptions_v1';
const FALLBACK_PREFS_KEY = 'renewradar_fallback_preferences_v1';

interface RenewRadarDB extends DBSchema {
  subscriptions: {
    key: string;
    value: SubscriptionRecord;
    indexes: {
      'by-status': string;
      'by-category': string;
      'by-currency': string;
      'by-nextRenewalDate': string;
    };
  };
  preferences: {
    key: string;
    value: UserPreferences & { id: string };
  };
}

let dbPromise: Promise<IDBPDatabase<RenewRadarDB>> | null = null;
let memoryFallbackSubs: SubscriptionRecord[] = [];
let memoryFallbackPrefs: UserPreferences = { ...DEFAULT_PREFERENCES };

function getDB(): Promise<IDBPDatabase<RenewRadarDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RenewRadarDB>(DB_NAME, CURRENT_SCHEMA_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const subStore = db.createObjectStore('subscriptions', { keyPath: 'id' });
          subStore.createIndex('by-status', 'status');
          subStore.createIndex('by-category', 'category');
          subStore.createIndex('by-currency', 'currency');
          subStore.createIndex('by-nextRenewalDate', 'nextRenewalDate');

          db.createObjectStore('preferences', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadAllSubscriptions(): Promise<{
  records: SubscriptionRecord[];
  usingFallback: boolean;
}> {
  try {
    if (typeof indexedDB === 'undefined') {
      throw new Error('IndexedDB unavailable in this environment');
    }
    const db = await getDB();
    const records = await db.getAll('subscriptions');
    return { records, usingFallback: false };
  } catch {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(FALLBACK_SUBS_KEY) : null;
      if (raw) {
        memoryFallbackSubs = JSON.parse(raw);
      }
    } catch {
      // Ignore localStorage parse error
    }
    return { records: [...memoryFallbackSubs], usingFallback: true };
  }
}

export async function saveSubscriptionRecord(record: SubscriptionRecord): Promise<void> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('No IDB');
    const db = await getDB();
    await db.put('subscriptions', record);
  } catch {
    const idx = memoryFallbackSubs.findIndex((s) => s.id === record.id);
    if (idx >= 0) {
      memoryFallbackSubs[idx] = record;
    } else {
      memoryFallbackSubs.push(record);
    }
    try {
      localStorage.setItem(FALLBACK_SUBS_KEY, JSON.stringify(memoryFallbackSubs));
    } catch {
      // Ignore quota errors
    }
  }
}

export async function saveMultipleSubscriptions(
  records: SubscriptionRecord[],
  clearExistingFirst: boolean = false
): Promise<void> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('No IDB');
    const db = await getDB();
    const tx = db.transaction('subscriptions', 'readwrite');
    if (clearExistingFirst) {
      await tx.store.clear();
    }
    for (const record of records) {
      await tx.store.put(record);
    }
    await tx.done;
  } catch {
    if (clearExistingFirst) {
      memoryFallbackSubs = [...records];
    } else {
      const map = new Map(memoryFallbackSubs.map((s) => [s.id, s]));
      for (const r of records) {
        map.set(r.id, r);
      }
      memoryFallbackSubs = Array.from(map.values());
    }
    try {
      localStorage.setItem(FALLBACK_SUBS_KEY, JSON.stringify(memoryFallbackSubs));
    } catch {
      // Ignore
    }
  }
}

export async function deleteSubscriptionRecord(id: string): Promise<void> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('No IDB');
    const db = await getDB();
    await db.delete('subscriptions', id);
  } catch {
    memoryFallbackSubs = memoryFallbackSubs.filter((s) => s.id !== id);
    try {
      localStorage.setItem(FALLBACK_SUBS_KEY, JSON.stringify(memoryFallbackSubs));
    } catch {
      // Ignore
    }
  }
}

export async function loadUserPreferences(): Promise<UserPreferences> {
  try {
    if (typeof indexedDB === 'undefined') throw new Error('No IDB');
    const db = await getDB();
    const stored = await db.get('preferences', PREFS_KEY);
    if (!stored) {
      return { ...DEFAULT_PREFERENCES };
    }
    const { id: _unused, ...prefs } = stored;
    return {
      ...DEFAULT_PREFERENCES,
      ...prefs,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };
  } catch {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(FALLBACK_PREFS_KEY) : null;
      if (raw) {
        memoryFallbackPrefs = { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
      }
    } catch {
      // Ignore
    }
    return { ...memoryFallbackPrefs };
  }
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  const normalized: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
  try {
    if (typeof indexedDB === 'undefined') throw new Error('No IDB');
    const db = await getDB();
    await db.put('preferences', { id: PREFS_KEY, ...normalized });
  } catch {
    memoryFallbackPrefs = normalized;
    try {
      localStorage.setItem(FALLBACK_PREFS_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore
    }
  }
}

export async function clearAllApplicationData(): Promise<void> {
  memoryFallbackSubs = [];
  memoryFallbackPrefs = { ...DEFAULT_PREFERENCES };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(FALLBACK_SUBS_KEY);
      localStorage.removeItem(FALLBACK_PREFS_KEY);
    }
  } catch {
    // Ignore
  }

  try {
    if (typeof indexedDB === 'undefined') return;
    const db = await getDB();
    const tx1 = db.transaction('subscriptions', 'readwrite');
    await tx1.store.clear();
    await tx1.done;

    const tx2 = db.transaction('preferences', 'readwrite');
    await tx2.store.clear();
    await tx2.done;
  } catch {
    // Ignore
  }
}
