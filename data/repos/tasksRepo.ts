import { initDbAsync } from '../db';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskRow = {
  id: number;
  title: string;
  dueAt: string | null;
  priority: TaskPriority;
  completed: number; // 0/1
  jobId: number | null;
  createdAt: string;
  updatedAt: string;
};

// Extended type with job info for display purposes
export type TaskWithJob = TaskRow & {
  jobClientName?: string;
  jobProjectType?: string;
};

export type TaskInput = {
  title: string;
  dueAt: string | null;
  priority: TaskPriority;
  jobId?: number | null;
};

export type TaskPatch = {
  title?: string;
  dueAt?: string | null;
  priority?: TaskPriority;
  completed?: number;
  jobId?: number | null;
};

function nowIso(): string {
  return new Date().toISOString();
}

// ============ CREATE ============

export async function createTaskAsync(input: TaskInput): Promise<number> {
  const db = await initDbAsync();
  const now = nowIso();
  const result = await db.runAsync(
    `INSERT INTO tasks (title, dueAt, priority, completed, jobId, createdAt, updatedAt)
     VALUES (?, ?, ?, 0, ?, ?, ?);`,
    [input.title, input.dueAt, input.priority, input.jobId ?? null, now, now]
  );
  return result.lastInsertRowId;
}

// ============ READ ============

export async function getTaskByIdAsync(taskId: number): Promise<TaskRow | null> {
  const db = await initDbAsync();
  const row = await db.getFirstAsync<TaskRow>(
    `SELECT id, title, dueAt, priority, completed, jobId, createdAt, updatedAt
     FROM tasks
     WHERE id = ?;`,
    [taskId]
  );
  return row ?? null;
}

export async function getTaskWithJobAsync(taskId: number): Promise<TaskWithJob | null> {
  const db = await initDbAsync();
  const row = await db.getFirstAsync<TaskWithJob>(
    `SELECT t.id, t.title, t.dueAt, t.priority, t.completed, t.jobId, t.createdAt, t.updatedAt,
            j.clientName as jobClientName, j.projectType as jobProjectType
     FROM tasks t
     LEFT JOIN jobs j ON t.jobId = j.id
     WHERE t.id = ?;`,
    [taskId]
  );
  return row ?? null;
}

export async function listTasksAsync(limit: number = 20): Promise<TaskRow[]> {
  const db = await initDbAsync();
  return db.getAllAsync<TaskRow>(
    `SELECT id, title, dueAt, priority, completed, jobId, createdAt, updatedAt
     FROM tasks
     ORDER BY completed ASC, dueAt ASC, id DESC
     LIMIT ?;`,
    [limit]
  );
}

export async function listTasksWithJobAsync(limit: number = 20): Promise<TaskWithJob[]> {
  const db = await initDbAsync();
  return db.getAllAsync<TaskWithJob>(
    `SELECT t.id, t.title, t.dueAt, t.priority, t.completed, t.jobId, t.createdAt, t.updatedAt,
            j.clientName as jobClientName, j.projectType as jobProjectType
     FROM tasks t
     LEFT JOIN jobs j ON t.jobId = j.id
     ORDER BY t.completed ASC, t.dueAt ASC, t.id DESC
     LIMIT ?;`,
    [limit]
  );
}

export async function listAllTasksAsync(): Promise<TaskRow[]> {
  const db = await initDbAsync();
  return db.getAllAsync<TaskRow>(
    `SELECT id, title, dueAt, priority, completed, jobId, createdAt, updatedAt
     FROM tasks
     ORDER BY completed ASC, dueAt ASC, id DESC;`
  );
}

export async function listTasksByDateRangeAsync(
  startDate: string,
  endDate: string
): Promise<TaskWithJob[]> {
  const db = await initDbAsync();
  return db.getAllAsync<TaskWithJob>(
    `SELECT t.id, t.title, t.dueAt, t.priority, t.completed, t.jobId, t.createdAt, t.updatedAt,
            j.clientName as jobClientName, j.projectType as jobProjectType
     FROM tasks t
     LEFT JOIN jobs j ON t.jobId = j.id
     WHERE date(t.dueAt) >= date(?) AND date(t.dueAt) <= date(?)
     ORDER BY t.dueAt ASC, t.priority DESC, t.id DESC;`,
    [startDate, endDate]
  );
}

export async function listTasksByDateAsync(date: string): Promise<TaskWithJob[]> {
  const db = await initDbAsync();
  return db.getAllAsync<TaskWithJob>(
    `SELECT t.id, t.title, t.dueAt, t.priority, t.completed, t.jobId, t.createdAt, t.updatedAt,
            j.clientName as jobClientName, j.projectType as jobProjectType
     FROM tasks t
     LEFT JOIN jobs j ON t.jobId = j.id
     WHERE date(t.dueAt) = date(?)
     ORDER BY t.completed ASC, t.dueAt ASC, t.id DESC;`,
    [date]
  );
}

export async function listTasksByJobIdAsync(jobId: number): Promise<TaskRow[]> {
  const db = await initDbAsync();
  return db.getAllAsync<TaskRow>(
    `SELECT id, title, dueAt, priority, completed, jobId, createdAt, updatedAt
     FROM tasks
     WHERE jobId = ?
     ORDER BY completed ASC, dueAt ASC, id DESC;`,
    [jobId]
  );
}

// Get all dates that have tasks (for calendar dots)
export async function getTaskDatesAsync(): Promise<string[]> {
  const db = await initDbAsync();
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date(dueAt) as date
     FROM tasks
     WHERE dueAt IS NOT NULL
     ORDER BY date ASC;`
  );
  return rows.map((r) => r.date);
}

// Get task counts per date for a month (for calendar)
export async function getTaskCountsByMonthAsync(
  year: number,
  month: number
): Promise<{ date: string; count: number; hasHigh: boolean }[]> {
  const db = await initDbAsync();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const rows = await db.getAllAsync<{ date: string; count: number; hasHigh: number }>(
    `SELECT date(dueAt) as date,
            COUNT(*) as count,
            MAX(CASE WHEN priority = 'high' AND completed = 0 THEN 1 ELSE 0 END) as hasHigh
     FROM tasks
     WHERE dueAt IS NOT NULL
       AND date(dueAt) >= date(?)
       AND date(dueAt) <= date(?)
     GROUP BY date(dueAt)
     ORDER BY date ASC;`,
    [startDate, endDate]
  );

  return rows.map((r) => ({
    date: r.date,
    count: r.count,
    hasHigh: r.hasHigh === 1,
  }));
}

// ============ UPDATE ============

export async function updateTaskAsync(taskId: number, patch: TaskPatch): Promise<void> {
  const db = await initDbAsync();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (patch.title !== undefined) {
    updates.push('title = ?');
    values.push(patch.title);
  }
  if (patch.dueAt !== undefined) {
    updates.push('dueAt = ?');
    values.push(patch.dueAt);
  }
  if (patch.priority !== undefined) {
    updates.push('priority = ?');
    values.push(patch.priority);
  }
  if (patch.completed !== undefined) {
    updates.push('completed = ?');
    values.push(patch.completed);
  }
  if (patch.jobId !== undefined) {
    updates.push('jobId = ?');
    values.push(patch.jobId);
  }

  if (updates.length === 0) return;

  updates.push('updatedAt = ?');
  values.push(nowIso());
  values.push(taskId);

  await db.runAsync(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?;`, values);
}

export async function toggleTaskCompletedAsync(taskId: number): Promise<void> {
  const db = await initDbAsync();
  const row = await db.getFirstAsync<{ completed: number }>('SELECT completed FROM tasks WHERE id = ?;', [taskId]);
  const current = row?.completed ?? 0;
  const next = current ? 0 : 1;
  await db.runAsync('UPDATE tasks SET completed = ?, updatedAt = ? WHERE id = ?;', [next, nowIso(), taskId]);
}

// ============ DELETE ============

export async function deleteTaskAsync(taskId: number): Promise<void> {
  const db = await initDbAsync();
  await db.runAsync('DELETE FROM tasks WHERE id = ?;', [taskId]);
}
