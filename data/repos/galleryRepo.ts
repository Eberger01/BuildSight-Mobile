import { initDbAsync } from '../db';

export type GalleryProjectRow = {
  projectId: string; // jobId as string, or "unassigned"
  jobId: number | null;
  title: string;
  category: string;
  photoCount: number;
  thumbnailPath: string | null;
  date: string | null; // startDate or latest photo date
};

function inferCategory(projectType: string): string {
  const t = projectType.toLowerCase();
  if (t.includes('kitchen')) return 'Kitchen';
  if (t.includes('bath')) return 'Bathroom';
  if (t.includes('fence')) return 'Fence';
  if (t.includes('deck')) return 'Deck';
  if (t.includes('paint')) return 'Painting';
  return 'Other';
}

export async function listGalleryProjectsAsync(): Promise<GalleryProjectRow[]> {
  const db = await initDbAsync();

  const jobRows = await db.getAllAsync<{
    jobId: number;
    clientName: string;
    projectType: string;
    startDate: string;
    photoCount: number;
    thumbnailPath: string | null;
    latestPhotoDate: string | null;
  }>(
    `
    SELECT
      j.id as jobId,
      j.clientName as clientName,
      j.projectType as projectType,
      j.startDate as startDate,
      (SELECT COUNT(*) FROM photos p WHERE p.jobId = j.id) as photoCount,
      (SELECT p.localPath FROM photos p WHERE p.jobId = j.id ORDER BY p.createdAt DESC, p.id DESC LIMIT 1) as thumbnailPath,
      (SELECT p.createdAt FROM photos p WHERE p.jobId = j.id ORDER BY p.createdAt DESC, p.id DESC LIMIT 1) as latestPhotoDate
    FROM jobs j
    ORDER BY j.startDate DESC, j.id DESC;
    `
  );

  const unassignedRow = await db.getFirstAsync<{
    photoCount: number;
    thumbnailPath: string | null;
    latestPhotoDate: string | null;
  }>(
    `
    SELECT
      COUNT(*) as photoCount,
      (SELECT p.localPath FROM photos p WHERE p.jobId IS NULL ORDER BY p.createdAt DESC, p.id DESC LIMIT 1) as thumbnailPath,
      (SELECT p.createdAt FROM photos p WHERE p.jobId IS NULL ORDER BY p.createdAt DESC, p.id DESC LIMIT 1) as latestPhotoDate
    FROM photos
    WHERE jobId IS NULL;
    `
  );

  const mapped: GalleryProjectRow[] = jobRows.map((r) => ({
    projectId: String(r.jobId),
    jobId: r.jobId,
    title: `${r.clientName} • ${r.projectType}`,
    category: inferCategory(r.projectType),
    photoCount: r.photoCount ?? 0,
    thumbnailPath: r.thumbnailPath ?? null,
    date: r.latestPhotoDate ?? r.startDate ?? null,
  }));

  const unassignedCount = unassignedRow?.photoCount ?? 0;
  if (unassignedCount > 0) {
    mapped.unshift({
      projectId: 'unassigned',
      jobId: null,
      title: 'Unassigned Photos',
      category: 'All',
      photoCount: unassignedCount,
      thumbnailPath: unassignedRow?.thumbnailPath ?? null,
      date: unassignedRow?.latestPhotoDate ?? null,
    });
  }

  return mapped;
}


