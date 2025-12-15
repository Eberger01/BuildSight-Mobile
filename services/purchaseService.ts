/**
 * Purchase Service (Native - iOS/Android)
 * RevenueCat integration for in-app purchases
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import { getDeviceId } from './deviceService';

/**
 * Check if native purchases module is available
 * Returns false in Expo Go since react-native-purchases requires a development build
 */
function isNativeModuleAvailable(): boolean {
  try {
    // Check if running in Expo Go (native module won't be available)
    const isExpoGo = Constants.appOwnership === 'expo';
    if (isExpoGo) {
      return false;
    }
    // Check if the native module is actually available
    // @ts-ignore - accessing internal to check availability
    return Purchases !== null && typeof Purchases.configure === 'function';
  } catch {
    return false;
  }
}

// RevenueCat API keys from environment
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';

// Product identifiers
export const PRODUCTS = {
  SINGLE_CREDIT: 'buildsight_credit_single',
  PACK_10: 'buildsight_credit_pack10',
  PRO_MONTHLY: 'buildsight_pro_monthly',
} as const;

// Credits per product
export const PRODUCT_CREDITS: Record<string, number> = {
  [PRODUCTS.SINGLE_CREDIT]: 1,
  [PRODUCTS.PACK_10]: 10,
  [PRODUCTS.PRO_MONTHLY]: 50,
};

let isInitialized = false;

/**
 * Initialize RevenueCat SDK
 */
export async function initPurchases(): Promise<void> {
  if (isInitialized) {
    return;
  }

  // Check if native module is available (not in Expo Go)
  if (!isNativeModuleAvailable()) {
    console.warn('RevenueCat not available (running in Expo Go). Use a development build for purchases.');
    return;
  }

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) {
    console.warn('RevenueCat API key not configured for', Platform.OS);
    return;
  }

  try {
    // Get device ID for user identification
    const deviceId = await getDeviceId();

    // Enable debug logging in development
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Configure RevenueCat with device ID as user identifier
    Purchases.configure({
      apiKey,
      appUserID: deviceId,
    });

    isInitialized = true;
    console.log('RevenueCat initialized with user:', deviceId);
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
  }
}

/**
 * Get available purchase offerings
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  if (!isInitialized) {
    await initPurchases();
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to get offerings:', error);
    throw new Error('Unable to load purchase options. Please try again.');
  }
}

/**
 * Get available packages from current offering
 */
export async function getPackages(): Promise<PurchasesPackage[]> {
  const offering = await getOfferings();
  return offering?.availablePackages ?? [];
}

/**
 * Purchase a package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  if (!isInitialized) {
    await initPurchases();
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    console.log('Purchase successful:', pkg.identifier);
    return customerInfo;
  } catch (error: any) {
    // Handle user cancellation
    if (error.userCancelled) {
      throw new Error('PURCHASE_CANCELLED');
    }

    // Handle other errors
    console.error('Purchase failed:', error);
    throw new Error(error.message || 'Purchase failed. Please try again.');
  }
}

/**
 * Purchase a specific product by ID
 */
export async function purchaseProduct(productId: string): Promise<CustomerInfo> {
  const packages = await getPackages();

  // Try exact match first, then check if productId matches the base product (without suffix)
  // RevenueCat appends duration suffixes like :monthly, :annual to subscriptions
  let pkg = packages.find((p) => p.product.identifier === productId);

  if (!pkg) {
    // Try matching base product ID (e.g., "buildsight_pro_monthly" matches "buildsight_pro_monthly:monthly")
    pkg = packages.find((p) => p.product.identifier.startsWith(productId));
  }

  if (!pkg) {
    throw new Error('Product not found');
  }

  return purchasePackage(pkg);
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  if (!isInitialized) {
    await initPurchases();
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    throw new Error('Failed to restore purchases. Please try again.');
  }
}

/**
 * Get current customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  if (!isInitialized) {
    await initPurchases();
  }

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('Failed to get customer info:', error);
    throw new Error('Failed to get account info');
  }
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  try {
    const customerInfo = await getCustomerInfo();
    return Object.keys(customerInfo.entitlements.active).length > 0;
  } catch {
    return false;
  }
}

/**
 * Check if purchases are available on this platform
 */
export function isPurchasesAvailable(): boolean {
  // Purchases available on iOS and Android, but only with native module (not Expo Go)
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }
  return isNativeModuleAvailable();
}

/**
 * Get credits for a product
 */
export function getCreditsForProduct(productId: string): number {
  // Try exact match first
  if (PRODUCT_CREDITS[productId]) {
    return PRODUCT_CREDITS[productId];
  }

  // Try matching base product ID (handle RevenueCat subscription suffixes like :monthly)
  const baseProductId = productId.split(':')[0];
  return PRODUCT_CREDITS[baseProductId] || 0;
}

/**
 * Format price for display
 */
export function formatPrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get product description
 */
export function getProductDescription(productId: string): string {
  // Handle RevenueCat subscription suffixes (e.g., "buildsight_pro_monthly:monthly")
  const baseProductId = productId.split(':')[0];

  switch (baseProductId) {
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
