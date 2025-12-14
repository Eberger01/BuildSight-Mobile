/**
 * Credits Context Provider
 * Global state management for user credits and purchase functionality
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { initUser, getUserStatus, UserStatus } from '@/services/creditsService';
import { initPurchases, isPurchasesAvailable } from '@/services/purchaseService';
import { isSupabaseConfigured } from '@/services/supabaseClient';

/**
 * Credits context value type
 */
interface CreditsContextType {
  // User status
  userId: string | null;
  credits: number;
  planType: string;
  isActive: boolean;
  dailyUsage: number;
  dailyLimit: number;

  // State
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Computed
  hasCredits: boolean;
  canUseAi: boolean;
  isPurchasesAvailable: boolean;
  isBackendConfigured: boolean;

  // Actions
  refreshCredits: () => Promise<void>;
  clearError: () => void;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

interface CreditsProviderProps {
  children: ReactNode;
}

/**
 * Credits Provider Component
 * Wraps the app to provide global credit state
 */
export function CreditsProvider({ children }: CreditsProviderProps) {
  // User state
  const [userId, setUserId] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const [planType, setPlanType] = useState('free');
  const [isActive, setIsActive] = useState(true);
  const [dailyUsage, setDailyUsage] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(50);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Refresh credits from backend
   */
  const refreshCredits = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const status = await getUserStatus();
      updateStateFromStatus(status);
    } catch (err) {
      console.error('Failed to refresh credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to load credits');
    }
  }, []);

  /**
   * Update state from user status
   */
  const updateStateFromStatus = (status: UserStatus) => {
    setUserId(status.userId);
    setCredits(status.creditsBalance);
    setPlanType(status.planType);
    setIsActive(status.isActive);
    setDailyUsage(status.dailyUsage);
    setDailyLimit(status.dailyLimit);
  };

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      try {
        // Initialize purchases (RevenueCat)
        if (isPurchasesAvailable()) {
          await initPurchases();
        }

        // Initialize user with backend
        if (isSupabaseConfigured()) {
          const status = await initUser();
          updateStateFromStatus(status);
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('Credits initialization error:', err);
        setError(err instanceof Error ? err.message : 'Initialization failed');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Computed values
  const hasCredits = credits > 0;
  const canUseAi = isActive && hasCredits && dailyUsage < dailyLimit;

  const value: CreditsContextType = {
    // User status
    userId,
    credits,
    planType,
    isActive,
    dailyUsage,
    dailyLimit,

    // State
    isLoading,
    isInitialized,
    error,

    // Computed
    hasCredits,
    canUseAi,
    isPurchasesAvailable: isPurchasesAvailable(),
    isBackendConfigured: isSupabaseConfigured(),

    // Actions
    refreshCredits,
    clearError,
  };

  return (
    <CreditsContext.Provider value={value}>
      {children}
    </CreditsContext.Provider>
  );
}

/**
 * Hook to use credits context
 */
export function useCredits(): CreditsContextType {
  const context = useContext(CreditsContext);

  if (!context) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }

  return context;
}

/**
 * Hook to check if user can generate estimates
 */
export function useCanGenerateEstimate(): {
  canGenerate: boolean;
  reason: string | null;
} {
  const { hasCredits, isActive, dailyUsage, dailyLimit, isBackendConfigured } = useCredits();

  if (!isBackendConfigured) {
    // Direct mode - allow (for development)
    return { canGenerate: true, reason: null };
  }

  if (!isActive) {
    return { canGenerate: false, reason: 'Account is suspended' };
  }

  if (!hasCredits) {
    return { canGenerate: false, reason: 'No credits available' };
  }

  if (dailyUsage >= dailyLimit) {
    return { canGenerate: false, reason: 'Daily limit reached' };
  }

  return { canGenerate: true, reason: null };
}
