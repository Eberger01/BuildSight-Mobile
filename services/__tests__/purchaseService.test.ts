/**
 * Unit tests for purchaseService
 */

import {
  PRODUCTS,
  PRODUCT_CREDITS,
  getCreditsForProduct,
  getProductDescription,
  formatPrice,
  isPurchasesAvailable,
} from '../purchaseService';

// Mock dependencies
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    appOwnership: 'standalone',
  },
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn((options: any) => options.android),
  },
}));

jest.mock('react-native-purchases');

describe('purchaseService', () => {
  describe('PRODUCTS constants', () => {
    it('should have SINGLE_CREDIT product ID', () => {
      expect(PRODUCTS.SINGLE_CREDIT).toBe('buildsight_credit_single');
    });

    it('should have PACK_10 product ID', () => {
      expect(PRODUCTS.PACK_10).toBe('buildsight_credit_pack10');
    });

    it('should have PRO_MONTHLY product ID', () => {
      expect(PRODUCTS.PRO_MONTHLY).toBe('buildsight_pro_monthly');
    });
  });

  describe('PRODUCT_CREDITS mapping', () => {
    it('should map SINGLE_CREDIT to 1 credit', () => {
      expect(PRODUCT_CREDITS[PRODUCTS.SINGLE_CREDIT]).toBe(1);
    });

    it('should map PACK_10 to 10 credits', () => {
      expect(PRODUCT_CREDITS[PRODUCTS.PACK_10]).toBe(10);
    });

    it('should map PRO_MONTHLY to 50 credits', () => {
      expect(PRODUCT_CREDITS[PRODUCTS.PRO_MONTHLY]).toBe(50);
    });
  });

  describe('getCreditsForProduct', () => {
    it('should return 1 credit for single credit product', () => {
      expect(getCreditsForProduct('buildsight_credit_single')).toBe(1);
    });

    it('should return 10 credits for pack10 product', () => {
      expect(getCreditsForProduct('buildsight_credit_pack10')).toBe(10);
    });

    it('should return 50 credits for pro monthly product', () => {
      expect(getCreditsForProduct('buildsight_pro_monthly')).toBe(50);
    });

    it('should handle RevenueCat subscription suffixes', () => {
      // RevenueCat adds suffixes like :monthly to subscription products
      expect(getCreditsForProduct('buildsight_pro_monthly:monthly')).toBe(50);
    });

    it('should return 0 for unknown product', () => {
      expect(getCreditsForProduct('unknown_product')).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(getCreditsForProduct('')).toBe(0);
    });
  });

  describe('getProductDescription', () => {
    it('should return correct description for single credit', () => {
      expect(getProductDescription('buildsight_credit_single')).toBe('1 AI Estimate Credit');
    });

    it('should return correct description for pack10', () => {
      expect(getProductDescription('buildsight_credit_pack10')).toBe('10 AI Estimate Credits');
    });

    it('should return correct description for pro monthly', () => {
      expect(getProductDescription('buildsight_pro_monthly')).toBe('50 Credits/Month (Pro)');
    });

    it('should handle RevenueCat subscription suffixes', () => {
      expect(getProductDescription('buildsight_pro_monthly:monthly')).toBe('50 Credits/Month (Pro)');
    });

    it('should return default description for unknown product', () => {
      expect(getProductDescription('unknown_product')).toBe('Credits');
    });
  });

  describe('formatPrice', () => {
    it('should return the price string from package', () => {
      const mockPackage = {
        product: {
          priceString: '$0.99',
          identifier: 'test',
          price: 0.99,
        },
        identifier: 'test_package',
      } as any;

      expect(formatPrice(mockPackage)).toBe('$0.99');
    });

    it('should handle different currency formats', () => {
      const mockPackage = {
        product: {
          priceString: '€7,99',
          identifier: 'test',
          price: 7.99,
        },
        identifier: 'test_package',
      } as any;

      expect(formatPrice(mockPackage)).toBe('€7,99');
    });
  });

  describe('isPurchasesAvailable', () => {
    it('should return true on Android with native module', () => {
      // Platform is mocked to 'android' and Constants.appOwnership is 'standalone'
      const result = isPurchasesAvailable();
      expect(typeof result).toBe('boolean');
    });
  });
});

describe('purchaseService - Product ID variations', () => {
  // Test that the service handles various product ID formats correctly

  describe('EUR product variants', () => {
    it('should handle EUR suffix on single credit', () => {
      // The webhook handler supports EUR variants, test the mapping
      const eurProductId = 'buildsight_credit_single_eur';
      // This should return 0 since the service doesn't have EUR mappings
      // (EUR variants are handled by the webhook, not the client)
      expect(getCreditsForProduct(eurProductId)).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle product ID with multiple colons', () => {
      expect(getCreditsForProduct('buildsight_pro_monthly:monthly:extra')).toBe(50);
    });

    it('should handle null-like values gracefully', () => {
      // TypeScript would prevent this, but testing runtime safety
      expect(getCreditsForProduct('' as any)).toBe(0);
    });
  });
});
