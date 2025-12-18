import { Estimate, ProjectData } from '@/types';
import { CountryCode, COUNTRIES } from '@/constants/countries';
import { getLocaleForCountry } from './formatters';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface EstimatePdfParams {
  project: ProjectData;
  estimate: Estimate;
  currency: string;
  country?: CountryCode;
  appName?: string;
}

/**
 * Build professional estimate PDF HTML
 * Displays net + VAT + gross totals, breakdown, materials, labor,
 * assumptions, exclusions, risks, and recommendations
 */
export function buildEstimatePdfHtml(params: EstimatePdfParams): string {
  const { project, estimate, currency, country = 'DE' } = params;

  const locale = getLocaleForCountry(country);
  const countryConfig = COUNTRIES[country];

  const title = `${project.clientName || 'Client'} - Estimate`;

  // Currency formatter using country locale
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  // Percentage formatter
  const fmtPct = (n: number) => `${Math.round(n * 100)}%`;

  // Get totals (support both new net/gross and legacy format)
  const hasNetGross = estimate.totalEstimate?.net && estimate.totalEstimate?.gross;
  const netAvg = hasNetGross ? estimate.totalEstimate.net.average : (estimate.totalEstimate?.average || 0);
  const netMin = hasNetGross ? estimate.totalEstimate.net.min : (estimate.totalEstimate?.min || 0);
  const netMax = hasNetGross ? estimate.totalEstimate.net.max : (estimate.totalEstimate?.max || 0);
  const grossAvg = hasNetGross ? estimate.totalEstimate.gross.average : netAvg;
  const grossMin = hasNetGross ? estimate.totalEstimate.gross.min : netMin;
  const grossMax = hasNetGross ? estimate.totalEstimate.gross.max : netMax;
  const taxRate = estimate.totalEstimate?.taxRate || 0;
  const taxAmount = estimate.totalEstimate?.taxAmount || (grossAvg - netAvg);

  // Build material items table (top 12)
  const materialItems = (estimate.breakdown?.materials?.items || []).slice(0, 12);
  const materialRows = materialItems
    .map(
      (item) =>
        `<tr>
          <td>${escapeHtml(item.item)}</td>
          <td style="text-align:center">${escapeHtml(item.quantity)}</td>
          <td style="text-align:right">${fmt(item.unitCost)}</td>
          <td style="text-align:right">${fmt(item.total)}</td>
        </tr>`
    )
    .join('');

  // Build labor trades table
  const laborTrades = estimate.breakdown?.labor?.trades || [];
  const tradeRows = laborTrades
    .map(
      (t) =>
        `<tr>
          <td>${escapeHtml(t.trade)}</td>
          <td style="text-align:center">${t.hours}h</td>
          <td style="text-align:right">${fmt(t.rate)}/hr</td>
          <td style="text-align:right">${fmt(t.cost)}</td>
        </tr>`
    )
    .join('');

  // Build timeline phases
  const phases = (estimate.timeline?.phases || [])
    .map((p) => `<li><strong>${escapeHtml(p.phase)}</strong>: ${escapeHtml(p.duration)}</li>`)
    .join('');

  // Build assumptions list
  const assumptions = (estimate.assumptions || [])
    .map((a) => `<li>${escapeHtml(a)}</li>`)
    .join('');

  // Build exclusions list
  const exclusions = (estimate.exclusions || [])
    .map((e) => `<li>${escapeHtml(e)}</li>`)
    .join('');

  // Build risks table
  const risks = (estimate.risks || [])
    .map(
      (r) =>
        `<tr>
          <td>${escapeHtml(r.risk)}</td>
          <td>${escapeHtml(r.mitigation)}</td>
          <td style="text-align:center; text-transform:uppercase; font-size:11px; font-weight:600; color:${
            r.impact === 'high' ? '#dc2626' : r.impact === 'medium' ? '#d97706' : '#059669'
          }">${escapeHtml(r.impact)}</td>
        </tr>`
    )
    .join('');

  // Build recommendations list
  const recommendations = (estimate.recommendations || [])
    .map((r) => `<li>${escapeHtml(r)}</li>`)
    .join('');

  // Labor summary
  const laborHours = estimate.breakdown?.labor?.hours || 0;
  const laborRate = estimate.breakdown?.labor?.hourlyRate || 0;

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
          padding: 24px; 
          color: #1e293b; 
          font-size: 13px;
          line-height: 1.5;
        }
        h1 { margin: 0 0 4px 0; font-size: 24px; color: #0f172a; }
        h2 { margin: 20px 0 10px 0; font-size: 16px; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
        .muted { color: #64748b; font-size: 12px; }
        .card { margin-top: 16px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fafafa; }
        .highlight-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-color: #0ea5e9; }
        .row { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .col { flex: 1; min-width: 120px; }
        .k { color: #64748b; font-size: 11px; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
        .v { font-weight: 600; color: #0f172a; }
        .big { font-size: 28px; font-weight: 700; color: #0369a1; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
        th { background: #f1f5f9; padding: 8px 6px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #cbd5e1; }
        td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
        tr:last-child td { border-bottom: none; }
        .total-row td { font-weight: 700; background: #f8fafc; border-top: 2px solid #cbd5e1; }
        ul { margin: 8px 0 0 0; padding-left: 20px; }
        li { margin-bottom: 4px; }
        .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .badge-info { background: #dbeafe; color: #1e40af; }
        @media print {
          body { padding: 12px; }
          .card { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <h1>BuildSight Estimate</h1>
      <div class="muted">Generated on ${escapeHtml(new Date().toLocaleDateString(locale))} | ${escapeHtml(countryConfig?.name || 'Germany')} Market Pricing</div>

      <!-- Client & Project Info -->
      <div class="card">
        <div class="row">
          <div class="col">
            <div class="k">Client</div>
            <div class="v">${escapeHtml(project.clientName || '-')}</div>
          </div>
          <div class="col">
            <div class="k">Project Type</div>
            <div class="v">${escapeHtml(project.projectType || '-')}</div>
          </div>
          <div class="col">
            <div class="k">Area</div>
            <div class="v">${escapeHtml(project.squareFootage || 'Not specified')} ${countryConfig?.units === 'metric' ? 'm²' : 'sq ft'}</div>
          </div>
        </div>
        <div style="margin-top: 12px">
          <div class="k">Description</div>
          <div>${escapeHtml(project.description || '-')}</div>
        </div>
      </div>

      <!-- Total Estimate (Net / VAT / Gross) -->
      <div class="card highlight-card">
        <div class="row" style="align-items: flex-end;">
          <div class="col">
            <div class="k">Net Total (excl. tax)</div>
            <div class="v" style="font-size: 20px">${fmt(netAvg)}</div>
            <div class="muted">Range: ${fmt(netMin)} - ${fmt(netMax)}</div>
          </div>
          <div class="col">
            <div class="k">VAT/Tax (${fmtPct(taxRate)})</div>
            <div class="v" style="font-size: 20px">${fmt(taxAmount)}</div>
          </div>
          <div class="col">
            <div class="k">Gross Total (incl. tax)</div>
            <div class="big">${fmt(grossAvg)}</div>
            <div class="muted">Range: ${fmt(grossMin)} - ${fmt(grossMax)}</div>
          </div>
        </div>
      </div>

      <!-- Cost Breakdown Summary -->
      <h2>Cost Breakdown</h2>
      <table>
        <tr><th style="width:60%">Category</th><th style="width:20%; text-align:right">Amount</th><th style="width:20%; text-align:right">Rate</th></tr>
        <tr>
          <td>Materials</td>
          <td style="text-align:right">${fmt(estimate.breakdown?.materials?.cost || 0)}</td>
          <td style="text-align:right">-</td>
        </tr>
        <tr>
          <td>Labor (${laborHours} hours @ ${fmt(laborRate)}/hr)</td>
          <td style="text-align:right">${fmt(estimate.breakdown?.labor?.cost || 0)}</td>
          <td style="text-align:right">-</td>
        </tr>
        <tr>
          <td>Permits & Inspections</td>
          <td style="text-align:right">${fmt(estimate.breakdown?.permits || 0)}</td>
          <td style="text-align:right">-</td>
        </tr>
        <tr>
          <td>Contingency</td>
          <td style="text-align:right">${fmt(estimate.breakdown?.contingency || 0)}</td>
          <td style="text-align:right">${estimate.breakdown?.contingencyRate ? fmtPct(estimate.breakdown.contingencyRate) : '~10%'}</td>
        </tr>
        <tr>
          <td>Overhead & Profit</td>
          <td style="text-align:right">${fmt(estimate.breakdown?.overhead || 0)}</td>
          <td style="text-align:right">${estimate.breakdown?.overheadRate ? fmtPct(estimate.breakdown.overheadRate) : '~10-15%'}</td>
        </tr>
        <tr class="total-row">
          <td>Subtotal (Net)</td>
          <td style="text-align:right">${fmt(netAvg)}</td>
          <td style="text-align:right">-</td>
        </tr>
      </table>

      ${
        materialItems.length > 0
          ? `
      <!-- Materials Detail -->
      <h2>Materials (Top Items)</h2>
      <table>
        <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Cost</th><th style="text-align:right">Total</th></tr>
        ${materialRows}
      </table>
      `
          : ''
      }

      ${
        laborTrades.length > 0
          ? `
      <!-- Labor by Trade -->
      <h2>Labor by Trade</h2>
      <table>
        <tr><th>Trade</th><th style="text-align:center">Hours</th><th style="text-align:right">Rate</th><th style="text-align:right">Cost</th></tr>
        ${tradeRows}
      </table>
      `
          : ''
      }

      <!-- Timeline -->
      <h2>Project Timeline</h2>
      <div class="card">
        <div class="row">
          <div class="col">
            <div class="k">Estimated Duration</div>
            <div class="v">${estimate.timeline?.estimatedDays || 0} working days</div>
          </div>
        </div>
        ${phases ? `<div style="margin-top:12px"><div class="k">Phases</div><ul>${phases}</ul></div>` : ''}
      </div>

      ${
        assumptions
          ? `
      <!-- Assumptions -->
      <h2>Assumptions</h2>
      <div class="card">
        <ul>${assumptions}</ul>
      </div>
      `
          : ''
      }

      ${
        exclusions
          ? `
      <!-- Exclusions -->
      <h2>Exclusions (Not Included)</h2>
      <div class="card">
        <ul>${exclusions}</ul>
      </div>
      `
          : ''
      }

      ${
        risks
          ? `
      <!-- Risks -->
      <h2>Project Risks</h2>
      <table>
        <tr><th style="width:35%">Risk</th><th style="width:45%">Mitigation</th><th style="width:20%; text-align:center">Impact</th></tr>
        ${risks}
      </table>
      `
          : ''
      }

      ${
        recommendations
          ? `
      <!-- Recommendations -->
      <h2>Recommendations</h2>
      <div class="card">
        <ul>${recommendations}</ul>
      </div>
      `
          : ''
      }

      ${
        estimate.notes
          ? `
      <!-- Notes -->
      <h2>Additional Notes</h2>
      <div class="card">
        <p>${escapeHtml(estimate.notes)}</p>
      </div>
      `
          : ''
      }

      <div class="footer">
        <p>This estimate was generated by BuildSight AI and is based on ${escapeHtml(countryConfig?.name || 'regional')} 2025 market pricing.</p>
        <p>Actual costs may vary based on site conditions, material availability, and scope changes.</p>
        <p style="margin-top:8px"><strong>BuildSight</strong> - Professional Contractor Estimating</p>
      </div>
    </body>
  </html>
  `;
}
