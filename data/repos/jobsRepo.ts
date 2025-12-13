import { initDbAsync } from '../db';

export type JobStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed';

export type JobRow = {
  id: number;
  clientName: string;
  projectType: string;
  status: JobStatus;
  progress: number;
  budgetCents: number;
  startDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function listJobsAsync(): Promise<JobRow[]> {
  const db = await initDbAsync();
  return db.getAllAsync<JobRow>(
    `SELECT id, clientName, projectType, status, progress, budgetCents, startDate, notes, createdAt, updatedAt
     FROM jobs
     ORDER BY startDate DESC, id DESC;`
  );
}

export async function getJobByIdAsync(jobId: number): Promise<JobRow | null> {
  const db = await initDbAsync();
  const row = await db.getFirstAsync<JobRow>(
    `SELECT id, clientName, projectType, status, progress, budgetCents, startDate, notes, createdAt, updatedAt
     FROM jobs
     WHERE id = ?;`,
    [jobId]
  );
  return row ?? null;
}

export async function createJobAsync(input: {
  clientName: string;
  projectType: string;
  status?: JobStatus;
  progress?: number;
  budgetCents?: number;
  startDate?: string;
  notes?: string;
}): Promise<number> {
  const db = await initDbAsync();
  const now = nowIso();
  const result = await db.runAsync(
    `INSERT INTO jobs (clientName, projectType, status, progress, budgetCents, startDate, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.clientName,
      input.projectType,
      input.status ?? 'Planning',
      input.progress ?? 0,
      input.budgetCents ?? 0,
      input.startDate ?? now.slice(0, 10),
      input.notes ?? '',
      now,
      now,
    ]
  );
  return Number(result.lastInsertRowId);
}

export async function updateJobAsync(
  jobId: number,
  patch: Partial<Pick<JobRow, 'clientName' | 'projectType' | 'status' | 'progress' | 'budgetCents' | 'startDate' | 'notes'>>
): Promise<void> {
  const db = await initDbAsync();
  const existing = await getJobByIdAsync(jobId);
  if (!existing) throw new Error('Job not found');

  const next: JobRow = {
    ...existing,
    ...patch,
    updatedAt: nowIso(),
  };

  await db.runAsync(
    `UPDATE jobs
     SET clientName = ?, projectType = ?, status = ?, progress = ?, budgetCents = ?, startDate = ?, notes = ?, updatedAt = ?
     WHERE id = ?;`,
    [
      next.clientName,
      next.projectType,
      next.status,
      next.progress,
      next.budgetCents,
      next.startDate,
      next.notes,
      next.updatedAt,
      jobId,
    ]
  );
}

export async function deleteJobAsync(jobId: number): Promise<void> {
  const db = await initDbAsync();
  // Delete related records first (photos, estimates), then the job
  await db.runAsync(`DELETE FROM photos WHERE jobId = ?;`, [jobId]);
  await db.runAsync(`DELETE FROM estimates WHERE jobId = ?;`, [jobId]);
  await db.runAsync(`DELETE FROM jobs WHERE id = ?;`, [jobId]);
}


