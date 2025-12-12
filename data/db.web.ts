import { idbClearAllAsync, idbGetAllAsync, idbGetMetaAsync, idbPutAsync, idbSetMetaAsync } from './idb.web';

type JobRow = {
  id: number;
  clientName: string;
  projectType: string;
  status: 'Planning' | 'In Progress' | 'Review' | 'Completed';
  progress: number;
  budgetCents: number;
  startDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type TaskRow = {
  id: number;
  title: string;
  dueAt: string | null;
  priority: 'high' | 'medium' | 'low';
  completed: number;
  createdAt: string;
  updatedAt: string;
};

const META_VERSION_KEY = 'schemaVersion';
const CURRENT_VERSION = 1;

let initPromise: Promise<void> | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

async function seedIfEmpty(): Promise<void> {
  const jobs = await idbGetAllAsync<JobRow>('jobs');
  if (jobs.length > 0) return;

  const now = nowIso();
  await idbPutAsync<JobRow>('jobs', {
    clientName: 'John Smith',
    projectType: 'Kitchen Remodel',
    status: 'In Progress',
    progress: 65,
    budgetCents: 2850000,
    startDate: '2025-12-01',
    notes: 'Seeded job',
    createdAt: now,
    updatedAt: now,
  } as any);

  await idbPutAsync<JobRow>('jobs', {
    clientName: 'Sarah Johnson',
    projectType: 'Bathroom Upgrade',
    status: 'Planning',
    progress: 25,
    budgetCents: 1520000,
    startDate: '2025-12-03',
    notes: 'Seeded job',
    createdAt: now,
    updatedAt: now,
  } as any);

  await idbPutAsync<JobRow>('jobs', {
    clientName: 'Mike Davis',
    projectType: 'Fence Installation',
    status: 'In Progress',
    progress: 80,
    budgetCents: 890000,
    startDate: '2025-11-28',
    notes: 'Seeded job',
    createdAt: now,
    updatedAt: now,
  } as any);

  await idbPutAsync<TaskRow>('tasks', {
    title: 'Site inspection - Johnson residence',
    dueAt: '2025-12-12T14:00:00.000Z',
    priority: 'high',
    completed: 0,
    createdAt: now,
    updatedAt: now,
  } as any);
}

export async function initDbAsync(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const v = await idbGetMetaAsync<number>(META_VERSION_KEY);
      if (!v || v < CURRENT_VERSION) {
        await idbSetMetaAsync(META_VERSION_KEY, CURRENT_VERSION);
      }
      await seedIfEmpty();
    })();
  }
  return initPromise;
}

// Keep API parity with native db.ts, even though web repos don’t need a db handle.
export async function getDbAsync(): Promise<null> {
  await initDbAsync();
  return null;
}

export async function resetDbAsync(): Promise<void> {
  await idbClearAllAsync();
  initPromise = null;
  await initDbAsync();
}


