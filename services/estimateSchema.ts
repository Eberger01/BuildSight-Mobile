/**
 * Estimate JSON Schema for Gemini Structured Output
 * This schema is used with generationConfig.responseSchema to ensure
 * the AI returns valid, parseable JSON matching our Estimate type.
 */

import { SchemaType } from '@google/generative-ai';

/**
 * JSON Schema for the Estimate response from Gemini
 * Compatible with Google Generative AI SDK responseSchema format
 */
export const ESTIMATE_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    totalEstimate: {
      type: SchemaType.OBJECT,
      properties: {
        net: {
          type: SchemaType.OBJECT,
          properties: {
            min: { type: SchemaType.NUMBER, description: 'Minimum net cost estimate (before tax)' },
            max: { type: SchemaType.NUMBER, description: 'Maximum net cost estimate (before tax)' },
            average: { type: SchemaType.NUMBER, description: 'Average net cost estimate (before tax)' },
          },
          required: ['min', 'max', 'average'],
        },
        gross: {
          type: SchemaType.OBJECT,
          properties: {
            min: { type: SchemaType.NUMBER, description: 'Minimum gross cost estimate (including tax)' },
            max: { type: SchemaType.NUMBER, description: 'Maximum gross cost estimate (including tax)' },
            average: { type: SchemaType.NUMBER, description: 'Average gross cost estimate (including tax)' },
          },
          required: ['min', 'max', 'average'],
        },
        taxRate: { type: SchemaType.NUMBER, description: 'VAT/tax rate as decimal (e.g., 0.19 for 19%)' },
        taxAmount: { type: SchemaType.NUMBER, description: 'Tax amount based on net average' },
        currency: { type: SchemaType.STRING, description: 'Currency code (EUR, USD, GBP, BRL)' },
      },
      required: ['net', 'gross', 'taxRate', 'taxAmount', 'currency'],
    },
    breakdown: {
      type: SchemaType.OBJECT,
      properties: {
        materials: {
          type: SchemaType.OBJECT,
          properties: {
            cost: { type: SchemaType.NUMBER, description: 'Total materials cost' },
            items: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  item: { type: SchemaType.STRING, description: 'Material name/description' },
                  quantity: { type: SchemaType.STRING, description: 'Quantity with unit (e.g., "25 m²")' },
                  unitCost: { type: SchemaType.NUMBER, description: 'Cost per unit' },
                  total: { type: SchemaType.NUMBER, description: 'Total cost for this item' },
                },
                required: ['item', 'quantity', 'unitCost', 'total'],
              },
            },
          },
          required: ['cost', 'items'],
        },
        labor: {
          type: SchemaType.OBJECT,
          properties: {
            cost: { type: SchemaType.NUMBER, description: 'Total labor cost' },
            hours: { type: SchemaType.NUMBER, description: 'Total labor hours' },
            hourlyRate: { type: SchemaType.NUMBER, description: 'Average hourly rate' },
            trades: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  trade: { type: SchemaType.STRING, description: 'Trade name (e.g., Electrician, Plumber)' },
                  hours: { type: SchemaType.NUMBER, description: 'Hours for this trade' },
                  rate: { type: SchemaType.NUMBER, description: 'Hourly rate for this trade' },
                  cost: { type: SchemaType.NUMBER, description: 'Total cost for this trade' },
                },
                required: ['trade', 'hours', 'rate', 'cost'],
              },
            },
          },
          required: ['cost', 'hours', 'hourlyRate'],
        },
        permits: { type: SchemaType.NUMBER, description: 'Permit and inspection fees' },
        contingency: { type: SchemaType.NUMBER, description: 'Contingency amount' },
        contingencyRate: { type: SchemaType.NUMBER, description: 'Contingency percentage as decimal (e.g., 0.10)' },
        overhead: { type: SchemaType.NUMBER, description: 'Overhead and profit amount' },
        overheadRate: { type: SchemaType.NUMBER, description: 'Overhead percentage as decimal (e.g., 0.15)' },
      },
      required: ['materials', 'labor', 'permits', 'contingency', 'overhead'],
    },
    timeline: {
      type: SchemaType.OBJECT,
      properties: {
        estimatedDays: { type: SchemaType.NUMBER, description: 'Total estimated working days' },
        phases: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              phase: { type: SchemaType.STRING, description: 'Phase name' },
              duration: { type: SchemaType.STRING, description: 'Duration (e.g., "2-3 days")' },
            },
            required: ['phase', 'duration'],
          },
        },
      },
      required: ['estimatedDays', 'phases'],
    },
    risks: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          risk: { type: SchemaType.STRING, description: 'Risk description' },
          mitigation: { type: SchemaType.STRING, description: 'Mitigation strategy' },
          impact: { type: SchemaType.STRING, description: 'Impact level: low, medium, or high' },
        },
        required: ['risk', 'mitigation', 'impact'],
      },
    },
    recommendations: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Professional recommendations for the project',
    },
    assumptions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Key assumptions made in the estimate',
    },
    exclusions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: 'Items explicitly excluded from the estimate',
    },
    notes: { type: SchemaType.STRING, description: 'Additional notes including country-specific considerations' },
  },
  required: ['totalEstimate', 'breakdown', 'timeline', 'risks', 'recommendations', 'assumptions', 'exclusions', 'notes'],
};

/**
 * Validate that an estimate object has internally consistent totals
 * Returns an object with validation results and optionally auto-repaired values
 */
export function validateEstimateTotals(estimate: any): {
  valid: boolean;
  errors: string[];
  repaired?: any;
} {
  const errors: string[] = [];
  const tolerance = 1; // Allow $1 rounding tolerance

  // Handle null/undefined estimate
  if (!estimate || !estimate.totalEstimate) {
    return { valid: true, errors: [] };
  }

  // Check net range consistency: min <= average <= max
  const { net, gross, taxRate, taxAmount } = estimate.totalEstimate || {};
  if (net) {
    if (net.min > net.average) errors.push('Net min > average');
    if (net.average > net.max) errors.push('Net average > max');
  }
  if (gross) {
    if (gross.min > gross.average) errors.push('Gross min > average');
    if (gross.average > gross.max) errors.push('Gross average > max');
  }

  // Check breakdown sums to net average
  const breakdown = estimate.breakdown || {};
  const materialsCost = breakdown.materials?.cost || 0;
  const laborCost = breakdown.labor?.cost || 0;
  const permits = breakdown.permits || 0;
  const contingency = breakdown.contingency || 0;
  const overhead = breakdown.overhead || 0;
  const calculatedNet = materialsCost + laborCost + permits + contingency + overhead;

  if (net && Math.abs(calculatedNet - net.average) > tolerance) {
    errors.push(`Breakdown sum (${calculatedNet}) != net.average (${net.average})`);
  }

  // Check tax calculation
  if (net && taxRate !== undefined && taxAmount !== undefined) {
    const expectedTax = Math.round(net.average * taxRate);
    if (Math.abs(expectedTax - taxAmount) > tolerance) {
      errors.push(`Tax amount (${taxAmount}) != net.average * taxRate (${expectedTax})`);
    }
  }

  // Check gross = net + tax
  if (net && gross && taxAmount !== undefined) {
    const expectedGross = net.average + taxAmount;
    if (Math.abs(expectedGross - gross.average) > tolerance) {
      errors.push(`Gross average (${gross.average}) != net.average + taxAmount (${expectedGross})`);
    }
  }

  // Check labor cost = hours * hourlyRate
  const labor = breakdown.labor || {};
  if (labor.hours && labor.hourlyRate) {
    const expectedLaborCost = labor.hours * labor.hourlyRate;
    if (Math.abs(expectedLaborCost - laborCost) > tolerance) {
      errors.push(`Labor cost (${laborCost}) != hours * rate (${expectedLaborCost})`);
    }
  }

  // Check materials items sum
  const materialItems = breakdown.materials?.items || [];
  if (materialItems.length > 0) {
    const itemsSum = materialItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    if (Math.abs(itemsSum - materialsCost) > tolerance) {
      errors.push(`Materials items sum (${itemsSum}) != materials.cost (${materialsCost})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize an estimate to ensure backward compatibility
 * Adds legacy fields (min, max, average) to totalEstimate for older UI components
 */
export function normalizeEstimate(estimate: any): any {
  if (!estimate || !estimate.totalEstimate) return estimate;

  const { net, gross } = estimate.totalEstimate;

  // Add legacy fields for backward compatibility
  if (gross) {
    estimate.totalEstimate.min = gross.min;
    estimate.totalEstimate.max = gross.max;
    estimate.totalEstimate.average = gross.average;
  } else if (net) {
    estimate.totalEstimate.min = net.min;
    estimate.totalEstimate.max = net.max;
    estimate.totalEstimate.average = net.average;
  }

  // Ensure assumptions and exclusions exist
  if (!estimate.assumptions) estimate.assumptions = [];
  if (!estimate.exclusions) estimate.exclusions = [];

  return estimate;
}

