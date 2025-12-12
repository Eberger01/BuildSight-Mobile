export function downloadTextFile(params: { fileName: string; text: string; mimeType: string }): void {
  const blob = new Blob([params.text], { type: params.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = params.fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function printHtml(params: { html: string; title?: string }): void {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.open();
  win.document.write(params.html);
  win.document.close();
  if (params.title) win.document.title = params.title;
  // Reason: let the new document render before invoking print.
  setTimeout(() => win.print(), 250);
}


