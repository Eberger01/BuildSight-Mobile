import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Guard: this file should only be used on native platforms.
// Web should use files.web.ts via Metro's platform-specific resolution.
if (Platform.OS === 'web') {
  console.warn('data/files.ts loaded on web - this should not happen. Check Metro config.');
}

function getDocumentDirectory(): string {
  if (!FileSystem.documentDirectory) {
    // On web, documentDirectory is null - return a safe fallback
    if (Platform.OS === 'web') {
      return '';
    }
    throw new Error('FileSystem.documentDirectory is not available on this platform');
  }
  return FileSystem.documentDirectory;
}

const ROOT_DIR = () => `${getDocumentDirectory()}buildsight/`;
const PHOTOS_DIR = () => `${ROOT_DIR()}photos/`;
const PDFS_DIR = () => `${ROOT_DIR()}pdfs/`;
const EXPORTS_DIR = () => `${ROOT_DIR()}exports/`;

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function nowStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

// Cache to avoid repeated getInfoAsync calls
let dirsInitialized = false;

async function ensureDirAsync(dir: string): Promise<void> {
  // Skip on web - FileSystem APIs don't work there
  if (Platform.OS === 'web') return;

  try {
    // Just try to create - it will succeed if doesn't exist, or throw EEXIST which we ignore
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch (error: unknown) {
    // Ignore "already exists" errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('already exists') && !errorMessage.includes('EEXIST')) {
      console.error('ensureDirAsync failed for:', dir, error);
      throw error;
    }
  }
}

export async function ensureAppDirsAsync(): Promise<void> {
  if (Platform.OS === 'web' || dirsInitialized) return;
  await ensureDirAsync(ROOT_DIR());
  await ensureDirAsync(PHOTOS_DIR());
  await ensureDirAsync(PDFS_DIR());
  await ensureDirAsync(EXPORTS_DIR());
  dirsInitialized = true;
}

export async function importPhotoToAppStorageAsync(inputUri: string): Promise<string> {
  // On web, just return the URI as-is (blob/data URL)
  if (Platform.OS === 'web') return inputUri;

  await ensureAppDirsAsync();

  const guessedExt =
    inputUri.toLowerCase().includes('.png') ? 'png'
      : inputUri.toLowerCase().includes('.webp') ? 'webp'
        : inputUri.toLowerCase().includes('.heic') ? 'heic'
          : 'jpg';

  const dest = `${PHOTOS_DIR()}${nowStamp()}_${Math.random().toString(16).slice(2)}.${guessedExt}`;

  // Reason: keep a stable, app-owned copy so data survives camera roll changes.
  await FileSystem.copyAsync({ from: inputUri, to: dest });
  return dest;
}

export async function savePdfToAppStorageAsync(tempPdfUri: string, baseName: string): Promise<string> {
  // On web, just return the temp URI
  if (Platform.OS === 'web') return tempPdfUri;

  await ensureAppDirsAsync();

  const name = safeFileName(baseName);
  const dest = `${PDFS_DIR()}${nowStamp()}_${name}.pdf`;

  // Reason: expo-print writes to a temp/cache location; move into app-owned folder.
  await FileSystem.moveAsync({ from: tempPdfUri, to: dest });
  return dest;
}

export async function writeExportJsonAsync(baseName: string, json: unknown): Promise<string> {
  // On web, trigger a download via blob
  if (Platform.OS === 'web') {
    const name = safeFileName(baseName);
    const fileName = `${nowStamp()}_${name}.json`;
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return url;
  }

  await ensureAppDirsAsync();
  const name = safeFileName(baseName);
  const dest = `${EXPORTS_DIR()}${nowStamp()}_${name}.json`;
  await FileSystem.writeAsStringAsync(dest, JSON.stringify(json, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return dest;
}

export async function deleteAllAppFilesAsync(): Promise<void> {
  // No-op on web
  if (Platform.OS === 'web') return;

  const rootDir = ROOT_DIR();
  // idempotent: true means it won't throw if the directory doesn't exist
  await FileSystem.deleteAsync(rootDir, { idempotent: true });
  dirsInitialized = false;
}


