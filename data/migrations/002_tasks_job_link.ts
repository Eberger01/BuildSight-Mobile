export const MIGRATION_002_TASKS_JOB_LINK = {
  version: 2,
  sql: `
ALTER TABLE tasks ADD COLUMN jobId INTEGER REFERENCES jobs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_jobId ON tasks(jobId);
`,
} as const;
