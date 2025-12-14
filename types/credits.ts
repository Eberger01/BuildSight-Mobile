/**
 * Credits and Payment Types
 */

/**
 * User plan types
 */
export type PlanType = 'free' | 'single' | 'pack10' | 'pro_monthly';

/**
 * Credit transaction types
 */
export type TransactionType =
  | 'purchase'
  | 'usage'
  | 'refund'
  | 'bonus'
  | 'subscription_renewal'
  | 'trial';

/**
 * Usage log status
 */
export type UsageStatus = 'pending' | 'completed' | 'failed' | 'rolled_back';

/**
 * User status from backend
 */
export interface UserStatus {
  userId: string;
  deviceId: string;
  email: string | null;
  planType: PlanType;
  isActive: boolean;
  revenuecatCustomerId: string | null;
  creditsBalance: number;
  creditsReserved: number;
  lifetimeCredits: number;
  dailyUsage: number;
  dailyLimit: number;
  canUseAi: boolean;
  isNewUser?: boolean;
  recentTransactions?: CreditTransaction[];
}

/**
 * Credit transaction record
 */
export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  transactionType: TransactionType;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

/**
 * Usage log record
 */
export interface UsageLog {
  id: string;
  userId: string;
  requestId: string;
  creditsUsed: number;
  estimatedCostUsd: number;
  modelUsed: string;
  status: UsageStatus;
  projectType?: string;
  countryCode?: string;
  latencyMs?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Credit wallet
 */
export interface CreditWallet {
  userId: string;
  creditsBalance: number;
  creditsReserved: number;
  lifetimeCredits: number;
  updatedAt: string;
}

/**
 * Pricing package for display
 */
export interface PricingPackage {
  id: string;
  name: string;
  credits: number;
  price: string;
  priceValue: number;
  currency: string;
  savings?: string;
  isSubscription: boolean;
  isMostPopular?: boolean;
}

/**
 * Default pricing packages (for fallback display)
 */
export const DEFAULT_PRICING: PricingPackage[] = [
  {
    id: 'buildsight_credit_single',
    name: 'Single Credit',
    credits: 1,
    price: '0.49',
    priceValue: 0.49,
    currency: 'EUR',
    isSubscription: false,
  },
  {
    id: 'buildsight_credit_pack10',
    name: 'Pack of 10',
    credits: 10,
    price: '4.99',
    priceValue: 4.99,
    currency: 'EUR',
    savings: 'Save 10%',
    isSubscription: false,
    isMostPopular: true,
  },
  {
    id: 'buildsight_pro_monthly',
    name: 'Pro Monthly',
    credits: 50,
    price: '19.99',
    priceValue: 19.99,
    currency: 'EUR',
    savings: 'Best Value',
    isSubscription: true,
  },
];

/**
 * Purchase result
 */
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  creditsAdded?: number;
  error?: string;
}

/**
 * API error codes
 */
export const CREDIT_ERROR_CODES = {
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  DAILY_LIMIT_REACHED: 'DAILY_LIMIT_REACHED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  PURCHASE_CANCELLED: 'PURCHASE_CANCELLED',
  PURCHASE_FAILED: 'PURCHASE_FAILED',
} as const;

export type CreditErrorCode = (typeof CREDIT_ERROR_CODES)[keyof typeof CREDIT_ERROR_CODES];
