import { initDbAsync } from '../db';

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
  const db = await initDbAsync();
  return db.getAllAsync<TaskRow>(
    `SELECT id, title, dueAt, priority, completed, createdAt, updatedAt
     FROM tasks
     ORDER BY completed ASC, dueAt ASC, id DESC
     LIMIT ?;`,
    [limit]
  );
}

export async function listAllTasksAsync(): Promise<TaskRow[]> {
  const db = await initDbAsync();
  return db.getAllAsync<TaskRow>(
    `SELECT id, title, dueAt, priority, completed, createdAt, updatedAt
     FROM tasks
     ORDER BY completed ASC, dueAt ASC, id DESC;`
  );
}

export async function toggleTaskCompletedAsync(taskId: number): Promise<void> {
  const db = await initDbAsync();
  const row = await db.getFirstAsync<{ completed: number }>('SELECT completed FROM tasks WHERE id = ?;', [taskId]);
  const current = row?.completed ?? 0;
  const next = current ? 0 : 1;
  await db.runAsync('UPDATE tasks SET completed = ?, updatedAt = ? WHERE id = ?;', [next, nowIso(), taskId]);
}


