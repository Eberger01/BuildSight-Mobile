/**
 * Credits Service
 * Manages user credits, balance checking, and API communication
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getDeviceId } from './deviceService';

/**
 * User status returned from the backend
 */
export interface UserStatus {
  userId: string;
  deviceId: string;
  email: string | null;
  planType: 'free' | 'single' | 'pack10' | 'pro_monthly';
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
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

/**
 * Credit reservation result
 */
export interface ReservationResult {
  requestId: string;
  creditsBalance: number;
  creditsReserved: number;
}

/**
 * Initialize user - creates new user or retrieves existing
 */
export async function initUser(): Promise<UserStatus> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const deviceId = await getDeviceId();

  const { data, error } = await supabase.functions.invoke('init-user', {
    headers: { 'x-device-id': deviceId },
  });

  if (error) {
    console.error('Init user error:', error);
    throw new Error(error.message || 'Failed to initialize user');
  }

  return data as UserStatus;
}

/**
 * Get current user status including credits balance
 */
export async function getUserStatus(): Promise<UserStatus> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const deviceId = await getDeviceId();

  const { data, error } = await supabase.functions.invoke('get-user-status', {
    headers: { 'x-device-id': deviceId },
  });

  if (error) {
    console.error('Get user status error:', error);
    throw new Error(error.message || 'Failed to get user status');
  }

  return data as UserStatus;
}

/**
 * Reserve a credit before making an AI call
 * Returns a request ID to use with generate-estimate
 */
export async function reserveCredit(
  projectType?: string,
  countryCode?: string
): Promise<ReservationResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const deviceId = await getDeviceId();

  const { data, error } = await supabase.functions.invoke('reserve-credit', {
    headers: { 'x-device-id': deviceId },
    body: { projectType, countryCode },
  });

  if (error) {
    console.error('Reserve credit error:', error);

    // Check for specific error codes
    if (error.message?.includes('INSUFFICIENT_CREDITS') || error.message?.includes('402')) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    if (error.message?.includes('Daily limit') || error.message?.includes('429')) {
      throw new Error('DAILY_LIMIT_REACHED');
    }
    if (error.message?.includes('503')) {
      throw new Error('SERVICE_UNAVAILABLE');
    }

    throw new Error(error.message || 'Failed to reserve credit');
  }

  return data as ReservationResult;
}

/**
 * Restore purchases from RevenueCat
 */
export async function restorePurchases(): Promise<{
  creditsBalance: number;
  lifetimeCredits: number;
  totalPurchases: number;
}> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const deviceId = await getDeviceId();

  const { data, error } = await supabase.functions.invoke('restore-purchases', {
    headers: { 'x-device-id': deviceId },
  });

  if (error) {
    console.error('Restore purchases error:', error);
    throw new Error(error.message || 'Failed to restore purchases');
  }

  return {
    creditsBalance: data.creditsBalance,
    lifetimeCredits: data.lifetimeCredits,
    totalPurchases: data.totalPurchases,
  };
}

/**
 * Check if user has credits available
 */
export async function hasCredits(): Promise<boolean> {
  try {
    const status = await getUserStatus();
    return status.creditsBalance > 0;
  } catch {
    return false;
  }
}

/**
 * Get just the credit balance (lightweight check)
 */
export async function getCreditBalance(): Promise<number> {
  try {
    const status = await getUserStatus();
    return status.creditsBalance;
  } catch {
    return 0;
  }
}
