import { initDbAsync } from '../db';

export type PhotoRow = {
  id: number;
  jobId: number | null;
  localPath: string;
  originalUri: string | null;
  category: string;
  title: string;
  createdAt: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function listPhotosByJobIdAsync(jobId: number): Promise<PhotoRow[]> {
  const db = await initDbAsync();
  return db.getAllAsync<PhotoRow>(
    `SELECT id, jobId, localPath, originalUri, category, title, createdAt
     FROM photos
     WHERE jobId = ?
     ORDER BY createdAt DESC, id DESC;`,
    [jobId]
  );
}

export async function listUnassignedPhotosAsync(): Promise<PhotoRow[]> {
  const db = await initDbAsync();
  return db.getAllAsync<PhotoRow>(
    `SELECT id, jobId, localPath, originalUri, category, title, createdAt
     FROM photos
     WHERE jobId IS NULL
     ORDER BY createdAt DESC, id DESC;`
  );
}

export async function countPhotosByJobIdAsync(jobId: number): Promise<number> {
  const db = await initDbAsync();
  const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM photos WHERE jobId = ?;', [jobId]);
  return row?.c ?? 0;
}

export async function createPhotoAsync(input: {
  jobId: number | null;
  localPath: string;
  originalUri?: string | null;
  category?: string;
  title?: string;
}): Promise<number> {
  const db = await initDbAsync();
  const result = await db.runAsync(
    `INSERT INTO photos (jobId, localPath, originalUri, category, title, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.jobId ?? null,
      input.localPath,
      input.originalUri ?? null,
      input.category ?? '',
      input.title ?? '',
      nowIso(),
    ]
  );
  return Number(result.lastInsertRowId);
}

export async function deletePhotoAsync(photoId: number): Promise<void> {
  const db = await initDbAsync();
  await db.runAsync('DELETE FROM photos WHERE id = ?;', [photoId]);
}

export async function listAllPhotosAsync(): Promise<PhotoRow[]> {
  const db = await initDbAsync();
  return db.getAllAsync<PhotoRow>(
    `SELECT id, jobId, localPath, originalUri, category, title, createdAt
     FROM photos
     ORDER BY createdAt DESC, id DESC;`
  );
}


