import * as FileSystem from 'expo-file-system';

function getDocumentDirectory(): string {
  if (!FileSystem.documentDirectory) {
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
  if (dirsInitialized) return;
  await ensureDirAsync(ROOT_DIR());
  await ensureDirAsync(PHOTOS_DIR());
  await ensureDirAsync(PDFS_DIR());
  await ensureDirAsync(EXPORTS_DIR());
  dirsInitialized = true;
}

export async function importPhotoToAppStorageAsync(inputUri: string): Promise<string> {
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
  await ensureAppDirsAsync();

  const name = safeFileName(baseName);
  const dest = `${PDFS_DIR()}${nowStamp()}_${name}.pdf`;

  // Reason: expo-print writes to a temp/cache location; move into app-owned folder.
  await FileSystem.moveAsync({ from: tempPdfUri, to: dest });
  return dest;
}

export async function writeExportJsonAsync(baseName: string, json: unknown): Promise<string> {
  await ensureAppDirsAsync();
  const name = safeFileName(baseName);
  const dest = `${EXPORTS_DIR()}${nowStamp()}_${name}.json`;
  await FileSystem.writeAsStringAsync(dest, JSON.stringify(json, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return dest;
}

export async function deleteAllAppFilesAsync(): Promise<void> {
  const rootDir = ROOT_DIR();
  // idempotent: true means it won't throw if the directory doesn't exist
  await FileSystem.deleteAsync(rootDir, { idempotent: true });
  dirsInitialized = false;
}


