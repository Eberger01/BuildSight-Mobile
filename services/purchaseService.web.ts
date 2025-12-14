/**
 * Purchase Service (Web Platform)
 * Web fallback - IAP not available on web
 */

// Web platform does not support native in-app purchases
// Users should be directed to use the mobile app for purchases

export const PRODUCTS = {
  SINGLE_CREDIT: 'buildsight_credit_single',
  PACK_10: 'buildsight_credit_pack10',
  PRO_MONTHLY: 'buildsight_pro_monthly',
} as const;

export const PRODUCT_CREDITS: Record<string, number> = {
  [PRODUCTS.SINGLE_CREDIT]: 1,
  [PRODUCTS.PACK_10]: 10,
  [PRODUCTS.PRO_MONTHLY]: 50,
};

/**
 * Initialize purchases - no-op on web
 */
export async function initPurchases(): Promise<void> {
  console.log('In-app purchases not available on web platform');
}

/**
 * Get offerings - returns null on web
 */
export async function getOfferings(): Promise<null> {
  return null;
}

/**
 * Get packages - returns empty array on web
 */
export async function getPackages(): Promise<[]> {
  return [];
}

/**
 * Purchase package - not available on web
 */
export async function purchasePackage(): Promise<never> {
  throw new Error('In-app purchases are not available on web. Please use the mobile app to purchase credits.');
}

/**
 * Purchase product - not available on web
 */
export async function purchaseProduct(): Promise<never> {
  throw new Error('In-app purchases are not available on web. Please use the mobile app to purchase credits.');
}

/**
 * Restore purchases - not available on web
 */
export async function restorePurchases(): Promise<never> {
  throw new Error('Restore purchases is not available on web. Please use the mobile app.');
}

/**
 * Get customer info - not available on web
 */
export async function getCustomerInfo(): Promise<never> {
  throw new Error('Not available on web platform');
}

/**
 * Check active subscription - always false on web
 */
export async function hasActiveSubscription(): Promise<boolean> {
  return false;
}

/**
 * Check if purchases are available
 */
export function isPurchasesAvailable(): boolean {
  return false; // Not available on web
}

/**
 * Get credits for a product
 */
export function getCreditsForProduct(productId: string): number {
  return PRODUCT_CREDITS[productId] || 0;
}

/**
 * Format price - placeholder for web
 */
export function formatPrice(): string {
  return 'N/A';
}

/**
 * Get product description
 */
export function getProductDescription(productId: string): string {
  switch (productId) {
    case PRODUCTS.SINGLE_CREDIT:
      return '1 AI Estimate Credit';
    case PRODUCTS.PACK_10:
      return '10 AI Estimate Credits';
    case PRODUCTS.PRO_MONTHLY:
      return '50 Credits/Month (Pro)';
    default:
      return 'Credits';
  }
}
