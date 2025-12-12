import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { savePdfToAppStorageAsync, writeExportJsonAsync } from '@/data/files';

export async function exportJsonAndShareAsync(params: { baseName: string; json: unknown; dialogTitle: string }): Promise<void> {
  const path = await writeExportJsonAsync(params.baseName, params.json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: params.dialogTitle });
  }
}

export async function printHtmlToPdfAndShareAsync(params: { html: string; baseName: string; dialogTitle: string }): Promise<{ savedPath: string } | null> {
  const printed = await Print.printToFileAsync({ html: params.html });
  const savedPath = await savePdfToAppStorageAsync(printed.uri, params.baseName);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(savedPath, { mimeType: 'application/pdf', dialogTitle: params.dialogTitle });
  }
  return { savedPath };
}


