/**
 * Tests for estimate schema validation and normalization
 */

import { validateEstimateTotals, normalizeEstimate } from '../estimateSchema';
import {
  validEstimateV2,
  legacyEstimate,
  estimateWithMathErrors,
} from '../__fixtures__/estimateFixtures';

describe('validateEstimateTotals', () => {
  describe('valid estimates', () => {
    it('should validate a correct estimate with no errors', () => {
      const result = validateEstimateTotals(validEstimateV2);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle legacy estimate format', () => {
      // Legacy format may not have all fields, but should not crash
      const result = validateEstimateTotals(legacyEstimate);
      // Legacy format has empty net/gross, so validation should pass or warn
      expect(result).toBeDefined();
    });
  });

  describe('invalid estimates', () => {
    it('should detect min > average in net range', () => {
      const result = validateEstimateTotals(estimateWithMathErrors);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('min > average'))).toBe(true);
    });

    it('should detect min > max in net range', () => {
      const estimate = {
        totalEstimate: {
          net: { min: 10000, max: 8000, average: 9000 },
          gross: { min: 11900, max: 9520, average: 10710 },
          taxRate: 0.19,
          taxAmount: 1710,
          currency: 'EUR',
        },
        breakdown: {
          materials: { cost: 4000, items: [] },
          labor: { cost: 4000, hours: 80, hourlyRate: 50 },
          permits: 0,
          contingency: 500,
          overhead: 500,
        },
      };

      const result = validateEstimateTotals(estimate);
      expect(result.valid).toBe(false);
    });

    it('should detect labor cost mismatch (hours * rate != cost)', () => {
      const estimate = {
        totalEstimate: {
          net: { min: 8000, max: 12000, average: 10000 },
          gross: { min: 9520, max: 14280, average: 11900 },
          taxRate: 0.19,
          taxAmount: 1900,
          currency: 'EUR',
        },
        breakdown: {
          materials: { cost: 4000, items: [] },
          labor: { cost: 2000, hours: 50, hourlyRate: 50 }, // Should be 2500
          permits: 0,
          contingency: 1000,
          overhead: 1000,
        },
      };

      const result = validateEstimateTotals(estimate);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Labor cost'))).toBe(true);
    });

    it('should detect breakdown sum mismatch with net average', () => {
      const estimate = {
        totalEstimate: {
          net: { min: 8000, max: 12000, average: 10000 },
          gross: { min: 9520, max: 14280, average: 11900 },
          taxRate: 0.19,
          taxAmount: 1900,
          currency: 'EUR',
        },
        breakdown: {
          materials: { cost: 4000, items: [] },
          labor: { cost: 2500, hours: 50, hourlyRate: 50 },
          permits: 0,
          contingency: 500,
          overhead: 500,
        }, // Sum = 7500, but net.average = 10000
      };

      const result = validateEstimateTotals(estimate);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Breakdown sum'))).toBe(true);
    });

    it('should detect materials items sum mismatch', () => {
      const estimate = {
        totalEstimate: {
          net: { min: 8000, max: 12000, average: 10000 },
          gross: { min: 9520, max: 14280, average: 11900 },
          taxRate: 0.19,
          taxAmount: 1900,
          currency: 'EUR',
        },
        breakdown: {
          materials: {
            cost: 4000,
            items: [
              { item: 'Paint', quantity: '10 liters', unitCost: 50, total: 500 },
              { item: 'Brushes', quantity: '5 units', unitCost: 10, total: 50 },
            ], // Sum = 550, but materials.cost = 4000
          },
          labor: { cost: 4000, hours: 80, hourlyRate: 50 },
          permits: 0,
          contingency: 1000,
          overhead: 1000,
        },
      };

      const result = validateEstimateTotals(estimate);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Materials items sum'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined estimate', () => {
      const result = validateEstimateTotals(null);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty estimate object', () => {
      const result = validateEstimateTotals({});
      expect(result.errors).toHaveLength(0);
    });

    it('should allow small rounding tolerance (±1)', () => {
      // Estimate where labor is exactly 1 off from hours * rate
      const estimate = {
        totalEstimate: {
          net: { min: 8000, max: 12000, average: 10001 },
          gross: { min: 9520, max: 14280, average: 11901 },
          taxRate: 0.19,
          taxAmount: 1900,
          currency: 'EUR',
        },
        breakdown: {
          materials: { cost: 4000, items: [] },
          labor: { cost: 4001, hours: 80, hourlyRate: 50 }, // 4001 vs 80*50=4000, diff=1
          permits: 0,
          contingency: 1000,
          overhead: 1000,
        },
      };

      const result = validateEstimateTotals(estimate);
      // Tolerance is 1, so 4001 vs 4000 should pass (diff = 1 which is within tolerance)
      expect(result.errors.some((e) => e.includes('Labor cost'))).toBe(false);
    });
  });
});

describe('normalizeEstimate', () => {
  it('should add legacy fields (min, max, average) from gross totals', () => {
    const estimate = {
      totalEstimate: {
        net: { min: 8000, max: 12000, average: 10000 },
        gross: { min: 9520, max: 14280, average: 11900 },
        taxRate: 0.19,
        taxAmount: 1900,
        currency: 'EUR',
      },
    };

    const normalized = normalizeEstimate(estimate);

    expect(normalized.totalEstimate.min).toBe(9520);
    expect(normalized.totalEstimate.max).toBe(14280);
    expect(normalized.totalEstimate.average).toBe(11900);
  });

  it('should use net totals if gross is not available', () => {
    const estimate = {
      totalEstimate: {
        net: { min: 8000, max: 12000, average: 10000 },
        taxRate: 0.19,
        taxAmount: 1900,
        currency: 'EUR',
      },
    };

    const normalized = normalizeEstimate(estimate);

    expect(normalized.totalEstimate.min).toBe(8000);
    expect(normalized.totalEstimate.max).toBe(12000);
    expect(normalized.totalEstimate.average).toBe(10000);
  });

  it('should ensure assumptions and exclusions arrays exist', () => {
    const estimate = {
      totalEstimate: {
        net: { min: 8000, max: 12000, average: 10000 },
        gross: { min: 9520, max: 14280, average: 11900 },
        taxRate: 0.19,
        taxAmount: 1900,
        currency: 'EUR',
      },
    };

    const normalized = normalizeEstimate(estimate);

    expect(Array.isArray(normalized.assumptions)).toBe(true);
    expect(Array.isArray(normalized.exclusions)).toBe(true);
  });

  it('should preserve existing assumptions and exclusions', () => {
    const estimate = {
      totalEstimate: {
        net: { min: 8000, max: 12000, average: 10000 },
        gross: { min: 9520, max: 14280, average: 11900 },
        taxRate: 0.19,
        taxAmount: 1900,
        currency: 'EUR',
      },
      assumptions: ['Assumption 1'],
      exclusions: ['Exclusion 1'],
    };

    const normalized = normalizeEstimate(estimate);

    expect(normalized.assumptions).toEqual(['Assumption 1']);
    expect(normalized.exclusions).toEqual(['Exclusion 1']);
  });

  it('should handle null/undefined input', () => {
    expect(normalizeEstimate(null)).toBeNull();
    expect(normalizeEstimate(undefined)).toBeUndefined();
  });
});

