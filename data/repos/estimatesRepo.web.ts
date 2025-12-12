import { initDbAsync } from '@/data/db';
import { idbDeleteAsync, idbGetAllAsync, idbGetByIdAsync, idbPutAsync } from '@/data/idb.web';

export type EstimateStatus = 'draft' | 'final';

export type EstimateRow = {
  id: number;
  jobId: number | null;
  status: EstimateStatus;
  projectDataJson: string;
  estimateJson: string | null;
  currency: string;
  pdfPath: string | null;
  createdAt: string;
  updatedAt: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function listEstimatesByJobIdAsync(jobId: number): Promise<EstimateRow[]> {
  await initDbAsync();
  const all = await idbGetAllAsync<EstimateRow>('estimates');
  return all.filter((e) => e.jobId === jobId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || (b.id ?? 0) - (a.id ?? 0));
}

export async function createEstimateAsync(input: {
  jobId?: number | null;
  status?: EstimateStatus;
  projectDataJson: string;
  estimateJson?: string | null;
  currency?: string;
  pdfPath?: string | null;
}): Promise<number> {
  await initDbAsync();
  const now = nowIso();
  const row: Omit<EstimateRow, 'id'> = {
    jobId: input.jobId ?? null,
    status: input.status ?? 'final',
    projectDataJson: input.projectDataJson,
    estimateJson: input.estimateJson ?? null,
    currency: input.currency ?? 'EUR',
    pdfPath: input.pdfPath ?? null,
    createdAt: now,
    updatedAt: now,
  };
  return idbPutAsync('estimates', row as any);
}

export async function updateEstimatePdfPathAsync(estimateId: number, pdfPath: string): Promise<void> {
  await initDbAsync();
  const e = await getEstimateByIdAsync(estimateId);
  if (!e) throw new Error('Estimate not found');
  await idbPutAsync('estimates', { ...e, pdfPath, updatedAt: nowIso() });
}

export async function updateEstimateJobIdAsync(estimateId: number, jobId: number | null): Promise<void> {
  await initDbAsync();
  const e = await getEstimateByIdAsync(estimateId);
  if (!e) throw new Error('Estimate not found');
  await idbPutAsync('estimates', { ...e, jobId, updatedAt: nowIso() });
}

export async function getEstimateByIdAsync(estimateId: number): Promise<EstimateRow | null> {
  await initDbAsync();
  return idbGetByIdAsync<EstimateRow>('estimates', estimateId);
}

export async function countEstimatesAsync(): Promise<number> {
  await initDbAsync();
  const all = await idbGetAllAsync<EstimateRow>('estimates');
  return all.length;
}

export async function listAllEstimatesAsync(): Promise<EstimateRow[]> {
  await initDbAsync();
  const all = await idbGetAllAsync<EstimateRow>('estimates');
  return [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || (b.id ?? 0) - (a.id ?? 0));
}

// (Optional cleanup utility; not used yet but kept for parity if needed)
export async function deleteEstimateAsync(estimateId: number): Promise<void> {
  await initDbAsync();
  await idbDeleteAsync('estimates', estimateId);
}


