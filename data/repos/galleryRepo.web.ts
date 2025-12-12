import { initDbAsync } from '@/data/db';
import { idbGetAllAsync } from '@/data/idb.web';
import { JobRow } from '@/data/repos/jobsRepo';
import { PhotoRow } from '@/data/repos/photosRepo';

export type GalleryProjectRow = {
  projectId: string; // jobId as string, or "unassigned"
  jobId: number | null;
  title: string;
  category: string;
  photoCount: number;
  thumbnailPath: string | null;
  date: string | null;
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
  await initDbAsync();
  const [jobs, photos] = await Promise.all([idbGetAllAsync<JobRow>('jobs'), idbGetAllAsync<PhotoRow>('photos')]);

  const byJob = new Map<number | null, PhotoRow[]>();
  for (const p of photos) {
    const key = p.jobId ?? null;
    const list = byJob.get(key) ?? [];
    list.push(p);
    byJob.set(key, list);
  }

  const result: GalleryProjectRow[] = [];

  const unassigned = byJob.get(null) ?? [];
  if (unassigned.length > 0) {
    const sorted = [...unassigned].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    result.push({
      projectId: 'unassigned',
      jobId: null,
      title: 'Unassigned Photos',
      category: 'All',
      photoCount: unassigned.length,
      thumbnailPath: sorted[0]?.localPath ?? null,
      date: sorted[0]?.createdAt ?? null,
    });
  }

  const sortedJobs = [...jobs].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime() || (b.id ?? 0) - (a.id ?? 0));
  for (const j of sortedJobs) {
    const p = byJob.get(j.id) ?? [];
    const sorted = [...p].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    result.push({
      projectId: String(j.id),
      jobId: j.id,
      title: `${j.clientName} • ${j.projectType}`,
      category: inferCategory(j.projectType),
      photoCount: p.length,
      thumbnailPath: sorted[0]?.localPath ?? null,
      date: sorted[0]?.createdAt ?? j.startDate ?? null,
    });
  }

  return result;
}


