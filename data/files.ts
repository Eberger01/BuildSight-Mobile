import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Check if FileSystem is available (may be null in Expo Go or web)
function isFileSystemAvailable(): boolean {
  try {
    return !!FileSystem.documentDirectory;
  } catch {
    return false;
  }
}

function getDocumentDirectory(): string {
  try {
    if (!FileSystem.documentDirectory) {
      return '';
    }
    return FileSystem.documentDirectory;
  } catch {
    return '';
  }
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
  // Skip if FileSystem not available or invalid directory path
  if (!isFileSystemAvailable() || !dir || dir === 'buildsight/' || dir.startsWith('buildsight/')) return;

  try {
    // Just try to create - it will succeed if doesn't exist, or throw EEXIST which we ignore
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  } catch (error: unknown) {
    // Ignore "already exists" errors and platform not available errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('not available') || errorMessage.includes('already exists') || errorMessage.includes('EEXIST')) {
      return;
    }
    console.error('ensureDirAsync failed for:', dir, error);
    throw error;
  }
}

export async function ensureAppDirsAsync(): Promise<void> {
  if (!isFileSystemAvailable() || dirsInitialized) return;
  await ensureDirAsync(ROOT_DIR());
  await ensureDirAsync(PHOTOS_DIR());
  await ensureDirAsync(PDFS_DIR());
  await ensureDirAsync(EXPORTS_DIR());
  dirsInitialized = true;
}

export async function importPhotoToAppStorageAsync(inputUri: string): Promise<string> {
  // If FileSystem not available, just return the original URI
  if (!isFileSystemAvailable()) {
    console.warn('FileSystem not available, using original URI');
    return inputUri;
  }

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
  // If FileSystem not available, just return the temp URI
  if (!isFileSystemAvailable()) return tempPdfUri;

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

  // If FileSystem not available, return empty (can't export)
  if (!isFileSystemAvailable()) {
    console.warn('FileSystem not available, cannot export JSON');
    return '';
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
  // No-op if FileSystem not available
  if (!isFileSystemAvailable()) return;

  const rootDir = ROOT_DIR();
  // idempotent: true means it won't throw if the directory doesn't exist
  await FileSystem.deleteAsync(rootDir, { idempotent: true });
  dirsInitialized = false;
}


