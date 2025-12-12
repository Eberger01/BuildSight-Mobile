# BuildSight Mobile (Offline-First) — Overview

## Purpose

BuildSight is a mobile app for contractors to:

- Capture job/project photos
- Generate AI-assisted estimates (Gemini)
- Track jobs, progress, and related artifacts (photos, PDFs)

This MVP is **offline-first**: jobs, estimates, and photos are stored **on-device**. Cloud sync (e.g., Supabase) is intentionally deferred.

## Architecture

### Navigation

- **Framework**: Expo + React Native
- **Routing**: Expo Router
- **Tabs** live in `app/(tabs)/`:
  - Dashboard: `app/(tabs)/index.tsx`
  - Estimate: `app/(tabs)/estimate.tsx`
  - Jobs: `app/(tabs)/jobs.tsx`
  - Gallery: `app/(tabs)/gallery.tsx`
  - Settings: `app/(tabs)/settings.tsx`

Nested screens (details/edit) should be placed under `app/(tabs)/...` so they **do not become new tabs**, but can still be pushed with `router.push(...)`.

### Data persistence (offline-first)

- **Structured data**: SQLite (via `expo-sqlite`)
- **Files** (photos + PDFs): App-owned directory via `expo-file-system`
- **Small preferences** (toggles/options): `AsyncStorage`

#### SQLite tables (core)

- `jobs`: project/job records
- `estimates`: saved estimate inputs + AI result + optional PDF path
- `photos`: photo metadata + local file path + job link
- `tasks`: optional dashboard tasks (simple)

### Services

- AI estimation: `services/geminiService.ts`

## Conventions

- Keep files under **500 LOC**; split into feature modules when needed.
- Prefer **feature folders** for data access (`data/`) and utilities (`utils/`).
- Avoid base64 persistence for photos; store only local file paths.


