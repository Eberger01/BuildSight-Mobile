export const MIGRATION_001_INITIAL = {
  version: 1,
  sql: `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientName TEXT NOT NULL,
  projectType TEXT NOT NULL,
  status TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  budgetCents INTEGER NOT NULL DEFAULT 0,
  startDate TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS estimates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobId INTEGER,
  status TEXT NOT NULL DEFAULT 'final',
  projectDataJson TEXT NOT NULL,
  estimateJson TEXT,
  currency TEXT NOT NULL DEFAULT 'EUR',
  pdfPath TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobId INTEGER,
  localPath TEXT NOT NULL,
  originalUri TEXT,
  category TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_jobId ON photos(jobId);
CREATE INDEX IF NOT EXISTS idx_estimates_jobId ON estimates(jobId);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  dueAt TEXT,
  priority TEXT NOT NULL DEFAULT 'low',
  completed INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`,
} as const;


