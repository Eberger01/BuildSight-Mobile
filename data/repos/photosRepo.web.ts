import { initDbAsync } from '@/data/db';
import { idbDeleteAsync, idbGetAllAsync, idbPutAsync } from '@/data/idb.web';

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
  await initDbAsync();
  const all = await idbGetAllAsync<PhotoRow>('photos');
  return all.filter((p) => p.jobId === jobId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || (b.id ?? 0) - (a.id ?? 0));
}

export async function listUnassignedPhotosAsync(): Promise<PhotoRow[]> {
  await initDbAsync();
  const all = await idbGetAllAsync<PhotoRow>('photos');
  return all.filter((p) => p.jobId == null).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || (b.id ?? 0) - (a.id ?? 0));
}

export async function countPhotosByJobIdAsync(jobId: number): Promise<number> {
  const rows = await listPhotosByJobIdAsync(jobId);
  return rows.length;
}

export async function createPhotoAsync(input: {
  jobId: number | null;
  localPath: string;
  originalUri?: string | null;
  category?: string;
  title?: string;
}): Promise<number> {
  await initDbAsync();
  const row: Omit<PhotoRow, 'id'> = {
    jobId: input.jobId ?? null,
    localPath: input.localPath,
    originalUri: input.originalUri ?? null,
    category: input.category ?? '',
    title: input.title ?? '',
    createdAt: nowIso(),
  };
  return idbPutAsync('photos', row as any);
}

export async function deletePhotoAsync(photoId: number): Promise<void> {
  await initDbAsync();
  await idbDeleteAsync('photos', photoId);
}

export async function listAllPhotosAsync(): Promise<PhotoRow[]> {
  await initDbAsync();
  const all = await idbGetAllAsync<PhotoRow>('photos');
  return [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || (b.id ?? 0) - (a.id ?? 0));
}


