import { initDbAsync } from '@/data/db';
import { idbGetAllAsync, idbGetByIdAsync, idbPutAsync } from '@/data/idb.web';

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
  await initDbAsync();
  const jobs = await idbGetAllAsync<JobRow>('jobs');
  return [...jobs].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || (b.id ?? 0) - (a.id ?? 0));
}

export async function getJobByIdAsync(jobId: number): Promise<JobRow | null> {
  await initDbAsync();
  return idbGetByIdAsync<JobRow>('jobs', jobId);
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
  await initDbAsync();
  const now = nowIso();
  const row: Omit<JobRow, 'id'> = {
    clientName: input.clientName,
    projectType: input.projectType,
    status: input.status ?? 'Planning',
    progress: input.progress ?? 0,
    budgetCents: input.budgetCents ?? 0,
    startDate: input.startDate ?? now.slice(0, 10),
    notes: input.notes ?? '',
    createdAt: now,
    updatedAt: now,
  };
  return idbPutAsync('jobs', row as any);
}

export async function updateJobAsync(
  jobId: number,
  patch: Partial<Pick<JobRow, 'clientName' | 'projectType' | 'status' | 'progress' | 'budgetCents' | 'startDate' | 'notes'>>
): Promise<void> {
  await initDbAsync();
  const existing = await getJobByIdAsync(jobId);
  if (!existing) throw new Error('Job not found');
  const next: JobRow = { ...existing, ...patch, id: jobId, updatedAt: nowIso() };
  await idbPutAsync('jobs', next);
}


