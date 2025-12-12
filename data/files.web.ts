function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function nowStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function downloadBlob(blob: Blob, fileName: string): string {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Reason: allow the download to start before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return url;
}

export async function ensureAppDirsAsync(): Promise<void> {
  // No-op on web.
}

export async function importPhotoToAppStorageAsync(inputUri: string): Promise<string> {
  // Reason: web doesn’t have an app-owned filesystem; keep URI as-is (blob/url).
  return inputUri;
}

export async function savePdfToAppStorageAsync(tempPdfUri: string, baseName: string): Promise<string> {
  // On web, we can’t move files into a sandbox folder. Keep as-is.
  return `${tempPdfUri}#${safeFileName(baseName)}`;
}

export async function writeExportJsonAsync(baseName: string, json: unknown): Promise<string> {
  const name = safeFileName(baseName);
  const fileName = `${nowStamp()}_${name}.json`;
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  return downloadBlob(blob, fileName);
}

export async function deleteAllAppFilesAsync(): Promise<void> {
  // No-op on web (files are not stored in an app-owned directory).
}


