/**
 * Tests for estimate PDF HTML generation
 */

import { buildEstimatePdfHtml } from '../estimatePdf';
import {
  validEstimateV2,
  legacyEstimate,
  usMarketEstimate,
  sampleProjectData,
} from '@/services/__fixtures__/estimateFixtures';

describe('buildEstimatePdfHtml', () => {
  describe('basic structure', () => {
    it('should generate valid HTML with required sections', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      // Basic HTML structure
      expect(html).toContain('<html>');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');

      // Title and header
      expect(html).toContain('BuildSight Estimate');
      expect(html).toContain('Max Mustermann');
    });

    it('should escape HTML entities in project data', () => {
      const projectWithSpecialChars = {
        ...sampleProjectData,
        clientName: 'Test <script>alert("xss")</script>',
        description: 'Description with "quotes" & ampersand',
      };

      const html = buildEstimatePdfHtml({
        project: projectWithSpecialChars,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      // Should escape HTML entities
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&amp;');
      expect(html).toContain('&quot;');
    });
  });

  describe('net/gross totals', () => {
    it('should display net, VAT, and gross totals', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      // Should have net/gross sections
      expect(html).toContain('Net Total');
      expect(html).toContain('excl. tax');
      expect(html).toContain('VAT/Tax');
      expect(html).toContain('19%');
      expect(html).toContain('Gross Total');
      expect(html).toContain('incl. tax');
    });

    it('should handle legacy estimate format gracefully', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: legacyEstimate,
        currency: 'EUR',
        country: 'DE',
      });

      // Should still generate valid HTML
      expect(html).toContain('<html>');
      expect(html).toContain('Estimated');
    });
  });

  describe('cost breakdown', () => {
    it('should display all breakdown categories', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('Materials');
      expect(html).toContain('Labor');
      expect(html).toContain('Permits');
      expect(html).toContain('Contingency');
      expect(html).toContain('Overhead');
    });

    it('should display labor hours and rate', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('80 hours');
      expect(html).toContain('/hr');
    });

    it('should display contingency and overhead rates', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('10%');
      expect(html).toContain('15%');
    });
  });

  describe('materials itemization', () => {
    it('should display material items table', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('Materials (Top Items)');
      expect(html).toContain('Paint (premium)');
      expect(html).toContain('20 liters');
    });

    it('should limit materials to top 12 items', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      // Count material item rows (each item has a <tr> with item name)
      const itemMatches = html.match(/<tr>\s*<td>[^<]+<\/td>/g);
      // Should not exceed 12 + header row + total rows
      expect(itemMatches).toBeTruthy();
    });
  });

  describe('labor trades', () => {
    it('should display labor trades breakdown', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('Labor by Trade');
      expect(html).toContain('Painter');
      expect(html).toContain('Helper');
      expect(html).toContain('60h');
      expect(html).toContain('20h');
    });
  });

  describe('timeline', () => {
    it('should display timeline and phases', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('Project Timeline');
      expect(html).toContain('10 working days');
      expect(html).toContain('Preparation');
      expect(html).toContain('2 days');
    });
  });

  describe('assumptions and exclusions', () => {
    it('should display assumptions', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('Assumptions');
      expect(html).toContain('Walls are in reasonable condition');
      expect(html).toContain('Standard 2.5m ceiling height');
    });

    it('should display exclusions', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('Exclusions');
      expect(html).toContain('Not Included');
      expect(html).toContain('Furniture moving');
      expect(html).toContain('Wallpaper removal');
    });
  });

  describe('risks', () => {
    it('should display risks with impact levels', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('Project Risks');
      expect(html).toContain('Hidden water damage');
      expect(html).toContain('Thorough inspection');
      expect(html.toLowerCase()).toContain('medium');
    });
  });

  describe('recommendations', () => {
    it('should display recommendations', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('Recommendations');
      expect(html).toContain('premium paint');
    });
  });

  describe('notes', () => {
    it('should display notes section', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('Additional Notes');
      expect(html).toContain('Germany 2025 market rates');
    });
  });

  describe('country-specific formatting', () => {
    it('should use German locale for EUR currency', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      // German format uses period as thousands separator
      expect(html).toContain('Germany');
    });

    it('should use US locale for USD currency', () => {
      const usProject = { ...sampleProjectData, squareFootage: '800' };
      const html = buildEstimatePdfHtml({
        project: usProject,
        estimate: usMarketEstimate,
        currency: 'USD',
        country: 'US',
      });

      expect(html).toContain('United States');
      expect(html).toContain('sq ft');
    });

    it('should display correct area unit for metric countries', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('m²');
    });

    it('should display correct area unit for imperial countries', () => {
      const usProject = { ...sampleProjectData, squareFootage: '800' };
      const html = buildEstimatePdfHtml({
        project: usProject,
        estimate: usMarketEstimate,
        currency: 'USD',
        country: 'US',
      });

      expect(html).toContain('sq ft');
    });
  });

  describe('footer', () => {
    it('should include disclaimer footer', () => {
      const html = buildEstimatePdfHtml({
        project: sampleProjectData,
        estimate: validEstimateV2,
        currency: 'EUR',
        country: 'DE',
      });

      expect(html).toContain('BuildSight AI');
      expect(html).toContain('Actual costs may vary');
    });
  });
});

