import { Estimate, ProjectData } from '@/types';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildEstimatePdfHtml(params: {
  project: ProjectData;
  estimate: Estimate;
  currency: string;
  appName?: string;
}): string {
  const { project, estimate, currency } = params;

  const title = `${project.clientName || 'Client'} - Estimate`;

  const fmt = (n: number) =>
    new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const recs = (estimate.recommendations || []).map((r) => `<li>${escapeHtml(r)}</li>`).join('');

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; color: #0f172a; }
        h1 { margin: 0 0 6px 0; font-size: 22px; }
        .muted { color: #475569; font-size: 12px; }
        .card { margin-top: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; }
        .row { display: flex; justify-content: space-between; gap: 12px; }
        .k { color: #64748b; font-size: 12px; margin-bottom: 4px; }
        .v { font-weight: 700; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        td { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
        td:last-child { text-align: right; font-weight: 700; }
        ul { margin: 8px 0 0 18px; }
      </style>
    </head>
    <body>
      <h1>BuildSight Estimate</h1>
      <div class="muted">Generated on ${escapeHtml(new Date().toISOString().slice(0, 10))}</div>

      <div class="card">
        <div class="row">
          <div style="flex:1">
            <div class="k">Client</div>
            <div class="v">${escapeHtml(project.clientName || '')}</div>
          </div>
          <div style="flex:1">
            <div class="k">Project</div>
            <div class="v">${escapeHtml(project.projectType || '')}</div>
          </div>
        </div>
        <div style="margin-top: 12px">
          <div class="k">Description</div>
          <div>${escapeHtml(project.description || '')}</div>
        </div>
      </div>

      <div class="card">
        <div class="k">Estimated Cost</div>
        <div class="v" style="font-size: 28px">${fmt(estimate.totalEstimate?.average || 0)}</div>
        <div class="muted">Range: ${fmt(estimate.totalEstimate?.min || 0)} - ${fmt(estimate.totalEstimate?.max || 0)}</div>
      </div>

      <div class="card">
        <div class="k">Cost Breakdown</div>
        <table>
          <tr><td>Materials</td><td>${fmt(estimate.breakdown?.materials?.cost || 0)}</td></tr>
          <tr><td>Labor</td><td>${fmt(estimate.breakdown?.labor?.cost || 0)}</td></tr>
          <tr><td>Permits</td><td>${fmt(estimate.breakdown?.permits || 0)}</td></tr>
          <tr><td>Contingency</td><td>${fmt(estimate.breakdown?.contingency || 0)}</td></tr>
          <tr><td>Overhead</td><td>${fmt(estimate.breakdown?.overhead || 0)}</td></tr>
        </table>
      </div>

      <div class="card">
        <div class="k">Timeline</div>
        <div class="v">${escapeHtml(String(estimate.timeline?.estimatedDays || 0))} days</div>
      </div>

      ${recs ? `<div class="card"><div class="k">Recommendations</div><ul>${recs}</ul></div>` : ''}
    </body>
  </html>
  `;
}


