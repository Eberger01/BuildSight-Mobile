/**
 * Professional Estimation Prompt Builder
 * Centralizes prompt construction for both client and backend usage.
 * Produces a structured "estimator spec" with regional context,
 * explicit calculation rules, and consistency requirements.
 */

import { ProjectData } from '../types';
import { CountryConfig, getAreaUnit } from '../constants/countries';

export interface PromptContext {
  projectData: ProjectData;
  countryConfig: CountryConfig;
  currency: string;
  /** Optional findings from photo analysis */
  photoFindingsSummary?: string;
}

/**
 * Parse the VAT rate string to get a decimal value
 * e.g., "19%" -> 0.19, "20% (10% for renovation)" -> 0.20
 */
export function parseVatRateToDecimal(vatRateStr: string): number {
  const match = vatRateStr.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]) / 100;
  }
  return 0.19; // Default to 19% if parsing fails
}

/**
 * Build the professional estimation prompt
 * This prompt is designed to:
 * 1. Act as a licensed estimator / contractor QS
 * 2. Use region-specific pricing and regulations
 * 3. Enforce mathematical consistency in outputs
 * 4. Include professional scope boundaries (assumptions/exclusions)
 */
export function buildEstimatePrompt(ctx: PromptContext): string {
  const { projectData, countryConfig, currency, photoFindingsSummary } = ctx;
  const areaUnit = getAreaUnit(countryConfig.units);
  const isMetric = countryConfig.units === 'metric';
  const vatDecimal = parseVatRateToDecimal(countryConfig.vatRate);

  // Photo findings section (if available)
  const photoSection = photoFindingsSummary
    ? `
**Site Observations (from photos):**
${photoFindingsSummary}
`
    : '';

  return `You are a licensed professional cost estimator (Quantity Surveyor) with 20+ years of experience in residential construction and remodeling. You produce detailed, accurate estimates that contractors use for client proposals.

═══════════════════════════════════════════════════════════════════════════════
REGIONAL MARKET CONTEXT (MANDATORY - ALL PRICING MUST REFLECT THIS REGION)
═══════════════════════════════════════════════════════════════════════════════
• Country: ${countryConfig.name}
• Currency: ${currency} (ALL amounts in this currency)
• Unit System: ${isMetric ? 'METRIC (m², m, kg, cm)' : 'IMPERIAL (sq ft, ft, lbs, inches)'}
• Typical Labor Rates: ${countryConfig.laborRateRange}
• VAT/Tax Rate: ${countryConfig.vatRate} (use ${vatDecimal} as decimal)
• Permit Requirements: ${countryConfig.permitInfo}

You MUST use ${countryConfig.name} 2025 market prices for materials and labor.
All area measurements MUST be in ${areaUnit}.

═══════════════════════════════════════════════════════════════════════════════
PROJECT SCOPE
═══════════════════════════════════════════════════════════════════════════════
• Client: ${projectData.clientName}
• Project Type: ${projectData.projectType}
• Description: ${projectData.description}
• Area: ${projectData.squareFootage || 'Not specified'} ${areaUnit}
• Timeline Preference: ${projectData.timeline || 'Flexible'}
${photoSection}
═══════════════════════════════════════════════════════════════════════════════
CALCULATION RULES (YOU MUST FOLLOW THESE EXACTLY)
═══════════════════════════════════════════════════════════════════════════════
1. COST BREAKDOWN MUST ADD UP:
   net.average = materials.cost + labor.cost + permits + contingency + overhead
   (tolerance: ±1 ${currency})

2. LABOR COST CALCULATION:
   labor.cost = labor.hours × labor.hourlyRate
   (hourly rate must be within ${countryConfig.laborRateRange})

3. MATERIALS COST:
   materials.cost = SUM of all materials.items[].total
   Each item: total = quantity_numeric × unitCost

4. TAX CALCULATION:
   taxRate = ${vatDecimal}
   taxAmount = ROUND(net.average × taxRate)
   gross.average = net.average + taxAmount
   gross.min = net.min + ROUND(net.min × taxRate)
   gross.max = net.max + ROUND(net.max × taxRate)

5. RANGE CONSISTENCY:
   min ≤ average ≤ max (for both net and gross)

6. CONTINGENCY: Typically 10% of subtotal (materials + labor)
   contingencyRate = 0.10
   contingency = ROUND((materials.cost + labor.cost) × contingencyRate)

7. OVERHEAD: Typically 10-15% of subtotal
   overheadRate = 0.10 to 0.15
   overhead = ROUND((materials.cost + labor.cost) × overheadRate)

═══════════════════════════════════════════════════════════════════════════════
PROFESSIONAL REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
• List 8-12 specific material items with realistic quantities and ${countryConfig.name} prices
• Include at least 2-3 labor trades if applicable (e.g., carpenter, electrician, plumber)
• Specify 2-4 assumptions (what you assumed to make the estimate)
• Specify 2-4 exclusions (what is NOT included, e.g., furniture, decorations, architect fees)
• Include 2-3 realistic project risks with mitigations
• Provide 3-5 professional recommendations
• Timeline should include 3-5 phases

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT (RETURN ONLY VALID JSON - NO MARKDOWN, NO PROSE)
═══════════════════════════════════════════════════════════════════════════════
{
  "totalEstimate": {
    "net": { "min": <number>, "max": <number>, "average": <number> },
    "gross": { "min": <number>, "max": <number>, "average": <number> },
    "taxRate": ${vatDecimal},
    "taxAmount": <number>,
    "currency": "${currency}"
  },
  "breakdown": {
    "materials": {
      "cost": <number>,
      "items": [
        { "item": "<material name>", "quantity": "<X ${areaUnit}>", "unitCost": <number>, "total": <number> }
      ]
    },
    "labor": {
      "cost": <number>,
      "hours": <number>,
      "hourlyRate": <number>,
      "trades": [
        { "trade": "<trade name>", "hours": <number>, "rate": <number>, "cost": <number> }
      ]
    },
    "permits": <number>,
    "contingency": <number>,
    "contingencyRate": <decimal>,
    "overhead": <number>,
    "overheadRate": <decimal>
  },
  "timeline": {
    "estimatedDays": <number>,
    "phases": [
      { "phase": "<phase name>", "duration": "<X days>" }
    ]
  },
  "risks": [
    { "risk": "<description>", "mitigation": "<strategy>", "impact": "low|medium|high" }
  ],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "assumptions": ["<assumption 1>", "<assumption 2>", ...],
  "exclusions": ["<exclusion 1>", "<exclusion 2>", ...],
  "notes": "<${countryConfig.name}-specific considerations and additional information>"
}

CRITICAL: Return ONLY the JSON object above. No markdown code blocks. No explanatory text.
Verify all calculations match the rules before responding.`;
}

/**
 * Build a simplified prompt for legacy API compatibility
 * (Used when responseSchema is not supported)
 */
export function buildEstimatePromptLegacy(ctx: PromptContext): string {
  // Use the same professional prompt but wrap JSON in code blocks for parsing
  const basePrompt = buildEstimatePrompt(ctx);
  return basePrompt.replace(
    'CRITICAL: Return ONLY the JSON object above. No markdown code blocks. No explanatory text.',
    'CRITICAL: Return the JSON object wrapped in ```json code blocks. Verify all calculations match the rules before responding.'
  );
}

