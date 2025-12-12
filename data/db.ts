import * as SQLite from 'expo-sqlite';

import { MIGRATION_001_INITIAL } from './migrations/001_initial';

const DB_NAME = 'buildsight.db';

type Migration = {
  version: number;
  sql: string;
};

const MIGRATIONS: Migration[] = [MIGRATION_001_INITIAL].sort((a, b) => a.version - b.version);

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

async function getUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  return row?.user_version ?? 0;
}

async function setUserVersion(db: SQLite.SQLiteDatabase, version: number): Promise<void> {
  await db.execAsync(`PRAGMA user_version = ${version};`);
}

async function applyMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  const current = await getUserVersion(db);
  const pending = MIGRATIONS.filter((m) => m.version > current);
  if (pending.length === 0) return;

  // Reason: keep schema updates atomic to avoid partially-applied schemas.
  await db.withExclusiveTransactionAsync(async (txn) => {
    let version = current;
    for (const m of pending) {
      await txn.execAsync(m.sql);
      version = m.version;
      await txn.execAsync(`PRAGMA user_version = ${version};`);
    }
  });
}

async function seedIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const jobsCountRow = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM jobs;');
  const jobsCount = jobsCountRow?.c ?? 0;
  if (jobsCount > 0) return;

  const now = nowIso();

  // Reason: seed minimal local data so the UI can switch off hard-coded arrays.
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO jobs (clientName, projectType, status, progress, budgetCents, startDate, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['John Smith', 'Kitchen Remodel', 'In Progress', 65, 2850000, '2025-12-01', 'Seeded job', now, now]
    );
    await txn.runAsync(
      `INSERT INTO jobs (clientName, projectType, status, progress, budgetCents, startDate, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Sarah Johnson', 'Bathroom Upgrade', 'Planning', 25, 1520000, '2025-12-03', 'Seeded job', now, now]
    );
    await txn.runAsync(
      `INSERT INTO jobs (clientName, projectType, status, progress, budgetCents, startDate, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Mike Davis', 'Fence Installation', 'In Progress', 80, 890000, '2025-11-28', 'Seeded job', now, now]
    );

    await txn.runAsync(
      `INSERT INTO tasks (title, dueAt, priority, completed, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Site inspection - Johnson residence', '2025-12-12T14:00:00.000Z', 'high', 0, now, now]
    );
    await txn.runAsync(
      `INSERT INTO tasks (title, dueAt, priority, completed, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Material delivery - Smith kitchen', '2025-12-13T10:00:00.000Z', 'medium', 0, now, now]
    );
    await txn.runAsync(
      `INSERT INTO tasks (title, dueAt, priority, completed, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Final walkthrough - Davis fence', '2025-12-10T15:00:00.000Z', 'medium', 0, now, now]
    );
    await txn.runAsync(
      `INSERT INTO tasks (title, dueAt, priority, completed, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['Estimate review - New client', '2025-12-12T11:00:00.000Z', 'low', 0, now, now]
    );
  });
}

export async function getDbAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initDbAsync(): Promise<SQLite.SQLiteDatabase> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDbAsync();
      await applyMigrations(db);
      await seedIfEmpty(db);
      return db;
    })();
  }
  return initPromise;
}

export async function resetDbAsync(): Promise<void> {
  const db = await getDbAsync();

  // Reason: destructive user action (Clear Cache) should reset schema and seed.
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync(`
      DROP TABLE IF EXISTS photos;
      DROP TABLE IF EXISTS estimates;
      DROP TABLE IF EXISTS tasks;
      DROP TABLE IF EXISTS jobs;
      PRAGMA user_version = 0;
    `);
  });

  initPromise = null;
  await initDbAsync();
}


