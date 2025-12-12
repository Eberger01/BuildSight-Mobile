import { initDbAsync } from '../db';

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
  const db = await initDbAsync();
  return db.getAllAsync<EstimateRow>(
    `SELECT id, jobId, status, projectDataJson, estimateJson, currency, pdfPath, createdAt, updatedAt
     FROM estimates
     WHERE jobId = ?
     ORDER BY createdAt DESC, id DESC;`,
    [jobId]
  );
}

export async function createEstimateAsync(input: {
  jobId?: number | null;
  status?: EstimateStatus;
  projectDataJson: string;
  estimateJson?: string | null;
  currency?: string;
  pdfPath?: string | null;
}): Promise<number> {
  const db = await initDbAsync();
  const now = nowIso();
  const result = await db.runAsync(
    `INSERT INTO estimates (jobId, status, projectDataJson, estimateJson, currency, pdfPath, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.jobId ?? null,
      input.status ?? 'final',
      input.projectDataJson,
      input.estimateJson ?? null,
      input.currency ?? 'EUR',
      input.pdfPath ?? null,
      now,
      now,
    ]
  );
  return Number(result.lastInsertRowId);
}

export async function updateEstimatePdfPathAsync(estimateId: number, pdfPath: string): Promise<void> {
  const db = await initDbAsync();
  const now = nowIso();
  await db.runAsync('UPDATE estimates SET pdfPath = ?, updatedAt = ? WHERE id = ?;', [pdfPath, now, estimateId]);
}

export async function updateEstimateJobIdAsync(estimateId: number, jobId: number | null): Promise<void> {
  const db = await initDbAsync();
  const now = nowIso();
  await db.runAsync('UPDATE estimates SET jobId = ?, updatedAt = ? WHERE id = ?;', [jobId, now, estimateId]);
}

export async function getEstimateByIdAsync(estimateId: number): Promise<EstimateRow | null> {
  const db = await initDbAsync();
  const row = await db.getFirstAsync<EstimateRow>(
    `SELECT id, jobId, status, projectDataJson, estimateJson, currency, pdfPath, createdAt, updatedAt
     FROM estimates
     WHERE id = ?;`,
    [estimateId]
  );
  return row ?? null;
}

export async function countEstimatesAsync(): Promise<number> {
  const db = await initDbAsync();
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM estimates;');
  return row?.c ?? 0;
}

export async function listAllEstimatesAsync(): Promise<EstimateRow[]> {
  const db = await initDbAsync();
  return db.getAllAsync<EstimateRow>(
    `SELECT id, jobId, status, projectDataJson, estimateJson, currency, pdfPath, createdAt, updatedAt
     FROM estimates
     ORDER BY createdAt DESC, id DESC;`
  );
}


