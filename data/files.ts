import * as FileSystem from 'expo-file-system';

const ROOT_DIR = `${FileSystem.documentDirectory}buildsight/`;
const PHOTOS_DIR = `${ROOT_DIR}photos/`;
const PDFS_DIR = `${ROOT_DIR}pdfs/`;
const EXPORTS_DIR = `${ROOT_DIR}exports/`;

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function nowStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function ensureDirAsync(dir: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dir);
  if (info.exists) return;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

export async function ensureAppDirsAsync(): Promise<void> {
  await ensureDirAsync(ROOT_DIR);
  await ensureDirAsync(PHOTOS_DIR);
  await ensureDirAsync(PDFS_DIR);
  await ensureDirAsync(EXPORTS_DIR);
}

export async function importPhotoToAppStorageAsync(inputUri: string): Promise<string> {
  await ensureAppDirsAsync();

  const guessedExt =
    inputUri.toLowerCase().includes('.png') ? 'png'
      : inputUri.toLowerCase().includes('.webp') ? 'webp'
        : inputUri.toLowerCase().includes('.heic') ? 'heic'
          : 'jpg';

  const dest = `${PHOTOS_DIR}${nowStamp()}_${Math.random().toString(16).slice(2)}.${guessedExt}`;

  // Reason: keep a stable, app-owned copy so data survives camera roll changes.
  await FileSystem.copyAsync({ from: inputUri, to: dest });
  return dest;
}

export async function savePdfToAppStorageAsync(tempPdfUri: string, baseName: string): Promise<string> {
  await ensureAppDirsAsync();

  const name = safeFileName(baseName);
  const dest = `${PDFS_DIR}${nowStamp()}_${name}.pdf`;

  // Reason: expo-print writes to a temp/cache location; move into app-owned folder.
  await FileSystem.moveAsync({ from: tempPdfUri, to: dest });
  return dest;
}

export async function writeExportJsonAsync(baseName: string, json: unknown): Promise<string> {
  await ensureAppDirsAsync();
  const name = safeFileName(baseName);
  const dest = `${EXPORTS_DIR}${nowStamp()}_${name}.json`;
  await FileSystem.writeAsStringAsync(dest, JSON.stringify(json, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return dest;
}

export async function deleteAllAppFilesAsync(): Promise<void> {
  const info = await FileSystem.getInfoAsync(ROOT_DIR);
  if (!info.exists) return;
  await FileSystem.deleteAsync(ROOT_DIR, { idempotent: true });
}


