/**
 * Test fixtures for estimate validation and PDF rendering
 */

import { Estimate, ProjectData } from '@/types';

/**
 * Valid estimate with all new fields (net/gross, assumptions, exclusions)
 */
export const validEstimateV2: Estimate = {
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
        { item: 'Paint (premium)', quantity: '40 liters', unitCost: 50, total: 2000 },
        { item: 'Primer', quantity: '20 liters', unitCost: 30, total: 600 },
        { item: 'Brushes and rollers', quantity: '20 units', unitCost: 15, total: 300 },
        { item: 'Drop cloths', quantity: '10 units', unitCost: 20, total: 200 },
        { item: 'Tape and prep materials', quantity: '2 sets', unitCost: 75, total: 150 },
        { item: 'Wall repair compound', quantity: '10 kg', unitCost: 40, total: 400 },
        { item: 'Sandpaper (various grits)', quantity: '40 sheets', unitCost: 2, total: 80 },
        { item: 'Caulk', quantity: '15 tubes', unitCost: 8, total: 120 },
        { item: 'Miscellaneous supplies', quantity: '1 lot', unitCost: 150, total: 150 },
      ],
    },
    labor: {
      cost: 4000,
      hours: 80,
      hourlyRate: 50,
      trades: [
        { trade: 'Painter', hours: 60, rate: 50, cost: 3000 },
        { trade: 'Helper', hours: 20, rate: 50, cost: 1000 },
      ],
    },
    permits: 0,
    contingency: 800,
    contingencyRate: 0.10,
    overhead: 1200,
    overheadRate: 0.15,
  },
  timeline: {
    estimatedDays: 10,
    phases: [
      { phase: 'Preparation', duration: '2 days' },
      { phase: 'Priming', duration: '2 days' },
      { phase: 'Painting', duration: '4 days' },
      { phase: 'Touch-ups and cleanup', duration: '2 days' },
    ],
  },
  risks: [
    { risk: 'Hidden water damage', mitigation: 'Thorough inspection before starting', impact: 'medium' },
    { risk: 'Color mismatch', mitigation: 'Test patches before full application', impact: 'low' },
    { risk: 'Weather delays', mitigation: 'Schedule buffer days', impact: 'low' },
  ],
  recommendations: [
    'Use premium paint for better durability',
    'Consider adding accent wall for visual interest',
    'Schedule work during dry season',
  ],
  assumptions: [
    'Walls are in reasonable condition without major repairs',
    'Standard 2.5m ceiling height',
    'Access to water and electricity available',
    'No furniture removal required',
  ],
  exclusions: [
    'Furniture moving or storage',
    'Wallpaper removal',
    'Ceiling painting (not requested)',
    'Exterior work',
  ],
  notes: 'Estimate based on Germany 2025 market rates. VAT (19%) included in gross totals. Work can begin within 2 weeks of approval.',
};

/**
 * Legacy estimate format (backward compatibility test)
 */
export const legacyEstimate: Estimate = {
  totalEstimate: {
    net: { min: 0, max: 0, average: 0 },
    gross: { min: 0, max: 0, average: 0 },
    taxRate: 0,
    taxAmount: 0,
    currency: 'EUR',
    min: 5000,
    max: 7000,
    average: 6000,
  },
  breakdown: {
    materials: { cost: 2500, items: [] },
    labor: { cost: 2500, hours: 50, hourlyRate: 50 },
    permits: 0,
    contingency: 500,
    overhead: 500,
  },
  timeline: {
    estimatedDays: 5,
    phases: [{ phase: 'Work', duration: '5 days' }],
  },
  risks: [],
  recommendations: ['Basic recommendation'],
  assumptions: [],
  exclusions: [],
  notes: 'Legacy format estimate',
};

/**
 * Estimate with math errors (for validation testing)
 */
export const estimateWithMathErrors: Estimate = {
  totalEstimate: {
    net: { min: 10000, max: 8000, average: 9000 }, // min > max (error)
    gross: { min: 11900, max: 9520, average: 10710 },
    taxRate: 0.19,
    taxAmount: 2000, // Wrong tax amount (should be ~1710)
    currency: 'EUR',
  },
  breakdown: {
    materials: { cost: 5000, items: [] }, // Breakdown doesn't sum to net
    labor: { cost: 2000, hours: 50, hourlyRate: 50 }, // 50*50=2500, not 2000
    permits: 0,
    contingency: 500,
    overhead: 500,
  },
  timeline: {
    estimatedDays: 5,
    phases: [],
  },
  risks: [],
  recommendations: [],
  assumptions: [],
  exclusions: [],
  notes: '',
};

/**
 * Sample project data for testing
 */
export const sampleProjectData: ProjectData = {
  clientName: 'Max Mustermann',
  email: 'max@example.com',
  phone: '+49 123 456789',
  projectType: 'Painting',
  description: 'Interior painting of living room and bedroom, approximately 80 m². Walls only, no ceiling. Neutral colors preferred.',
  squareFootage: '80',
  timeline: '2-3months',
};

/**
 * US market estimate (imperial units test)
 */
export const usMarketEstimate: Estimate = {
  totalEstimate: {
    net: { min: 5000, max: 8000, average: 6500 },
    gross: { min: 5400, max: 8640, average: 7020 }, // ~8% tax
    taxRate: 0.08,
    taxAmount: 520,
    currency: 'USD',
  },
  breakdown: {
    materials: { cost: 2500, items: [{ item: 'Paint', quantity: '15 gallons', unitCost: 50, total: 750 }] },
    labor: { cost: 3000, hours: 40, hourlyRate: 75 },
    permits: 0,
    contingency: 550,
    contingencyRate: 0.10,
    overhead: 450,
    overheadRate: 0.08,
  },
  timeline: {
    estimatedDays: 5,
    phases: [{ phase: 'Painting', duration: '5 days' }],
  },
  risks: [{ risk: 'Material delays', mitigation: 'Order early', impact: 'low' }],
  recommendations: ['Use VOC-free paint'],
  assumptions: ['Standard 8ft ceilings'],
  exclusions: ['Trim painting'],
  notes: 'Based on US market pricing. Sales tax varies by state.',
};

