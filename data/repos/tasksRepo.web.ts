import { initDbAsync } from '@/data/db';
import { idbGetAllAsync, idbPutAsync } from '@/data/idb.web';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskRow = {
  id: number;
  title: string;
  dueAt: string | null;
  priority: TaskPriority;
  completed: number; // 0/1
  createdAt: string;
  updatedAt: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function listTasksAsync(limit: number = 20): Promise<TaskRow[]> {
  await initDbAsync();
  const all = await idbGetAllAsync<TaskRow>('tasks');
  const sorted = [...all].sort((a, b) => (a.completed - b.completed) || (a.dueAt ?? '').localeCompare(b.dueAt ?? '') || (b.id ?? 0) - (a.id ?? 0));
  return sorted.slice(0, limit);
}

export async function listAllTasksAsync(): Promise<TaskRow[]> {
  await initDbAsync();
  const all = await idbGetAllAsync<TaskRow>('tasks');
  return [...all].sort((a, b) => (a.completed - b.completed) || (a.dueAt ?? '').localeCompare(b.dueAt ?? '') || (b.id ?? 0) - (a.id ?? 0));
}

export async function toggleTaskCompletedAsync(taskId: number): Promise<void> {
  await initDbAsync();
  const all = await idbGetAllAsync<TaskRow>('tasks');
  const existing = all.find((t) => t.id === taskId);
  if (!existing) return;
  const next = existing.completed ? 0 : 1;
  await idbPutAsync('tasks', { ...existing, completed: next, updatedAt: nowIso() });
}


