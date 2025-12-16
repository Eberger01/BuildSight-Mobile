/**
 * Unit tests for CreditsContext
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock services before importing
const mockInitUser = jest.fn();
const mockGetUserStatus = jest.fn();
const mockInitPurchases = jest.fn();
const mockIsPurchasesAvailable = jest.fn(() => false);
const mockIsSupabaseConfigured = jest.fn(() => true);

jest.mock('@/services/creditsService', () => ({
  initUser: mockInitUser,
  getUserStatus: mockGetUserStatus,
}));

jest.mock('@/services/purchaseService', () => ({
  __esModule: true,
  initPurchases: mockInitPurchases,
  isPurchasesAvailable: () => mockIsPurchasesAvailable(),
}));

jest.mock('@/services/supabaseClient', () => ({
  __esModule: true,
  isSupabaseConfigured: () => mockIsSupabaseConfigured(),
}));

import { CreditsProvider, useCredits, useCanGenerateEstimate } from '../CreditsContext';

// Sample user status
const mockUserStatus = {
  userId: 'user-123',
  deviceId: 'android_test-device-id',
  email: null,
  planType: 'pack10' as const,
  isActive: true,
  revenuecatCustomerId: null,
  creditsBalance: 10,
  creditsReserved: 0,
  lifetimeCredits: 15,
  dailyUsage: 3,
  dailyLimit: 50,
  canUseAi: true,
};

// Wrapper component for hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CreditsProvider>{children}</CreditsProvider>
);

describe('CreditsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitUser.mockResolvedValue(mockUserStatus);
    mockGetUserStatus.mockResolvedValue(mockUserStatus);
    mockInitPurchases.mockResolvedValue(undefined);
    mockIsPurchasesAvailable.mockReturnValue(false);
    mockIsSupabaseConfigured.mockReturnValue(true);
  });

  describe('useCredits hook', () => {
    it('should throw when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useCredits());
      }).toThrow('useCredits must be used within a CreditsProvider');

      consoleSpy.mockRestore();
    });

    it('should provide initial loading state', () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isInitialized).toBe(false);
    });

    it('should initialize with user data', async () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.userId).toBe('user-123');
      expect(result.current.credits).toBe(10);
      expect(result.current.planType).toBe('pack10');
      expect(result.current.isActive).toBe(true);
      expect(result.current.dailyUsage).toBe(3);
      expect(result.current.dailyLimit).toBe(50);
    });

    it('should compute hasCredits correctly', async () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.hasCredits).toBe(true);
    });

    it('should compute hasCredits as false when no credits', async () => {
      mockInitUser.mockResolvedValue({ ...mockUserStatus, creditsBalance: 0 });

      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.hasCredits).toBe(false);
    });

    it('should compute canUseAi correctly', async () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // isActive=true, credits=10>0, dailyUsage=3<50
      expect(result.current.canUseAi).toBe(true);
    });

    it('should set canUseAi false when inactive', async () => {
      mockInitUser.mockResolvedValue({ ...mockUserStatus, isActive: false });

      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.canUseAi).toBe(false);
    });

    it('should set canUseAi false when no credits', async () => {
      mockInitUser.mockResolvedValue({ ...mockUserStatus, creditsBalance: 0 });

      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.canUseAi).toBe(false);
    });

    it('should set canUseAi false when daily limit reached', async () => {
      mockInitUser.mockResolvedValue({ ...mockUserStatus, dailyUsage: 50 });

      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.canUseAi).toBe(false);
    });
  });

  describe('refreshCredits', () => {
    it('should refresh credits from backend', async () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      // Update mock for refresh
      const updatedStatus = { ...mockUserStatus, creditsBalance: 20 };
      mockGetUserStatus.mockResolvedValue(updatedStatus);

      await act(async () => {
        await result.current.refreshCredits();
      });

      expect(result.current.credits).toBe(20);
      expect(mockGetUserStatus).toHaveBeenCalled();
    });

    it('should handle refresh error', async () => {
      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      mockGetUserStatus.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        await result.current.refreshCredits();
      });

      expect(result.current.error).toBe('Network error');
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockInitUser.mockRejectedValue(new Error('Init error'));

      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe('Init error');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('initialization', () => {
    it('should call initPurchases when available', async () => {
      mockIsPurchasesAvailable.mockReturnValue(true);

      renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(mockInitPurchases).toHaveBeenCalled();
      });
    });

    it('should not call initPurchases when unavailable', async () => {
      mockIsPurchasesAvailable.mockReturnValue(false);

      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(mockInitPurchases).not.toHaveBeenCalled();
    });

    it('should skip backend init when Supabase not configured', async () => {
      mockIsSupabaseConfigured.mockReturnValue(false);

      const { result } = renderHook(() => useCredits(), { wrapper });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(mockInitUser).not.toHaveBeenCalled();
    });
  });
});

describe('useCanGenerateEstimate hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitUser.mockResolvedValue(mockUserStatus);
    mockGetUserStatus.mockResolvedValue(mockUserStatus);
    mockIsSupabaseConfigured.mockReturnValue(true);
  });

  it('should return canGenerate true when user can generate', async () => {
    const { result } = renderHook(() => useCanGenerateEstimate(), { wrapper });

    await waitFor(() => {
      expect(result.current.canGenerate).toBe(true);
    });

    expect(result.current.reason).toBe(null);
  });

  it('should return false with reason when account suspended', async () => {
    mockInitUser.mockResolvedValue({ ...mockUserStatus, isActive: false });

    const { result } = renderHook(() => useCanGenerateEstimate(), { wrapper });

    await waitFor(() => {
      expect(result.current.canGenerate).toBe(false);
    });

    expect(result.current.reason).toBe('Account is suspended');
  });

  it('should return false with reason when no credits', async () => {
    mockInitUser.mockResolvedValue({ ...mockUserStatus, creditsBalance: 0 });

    const { result } = renderHook(() => useCanGenerateEstimate(), { wrapper });

    await waitFor(() => {
      expect(result.current.canGenerate).toBe(false);
    });

    expect(result.current.reason).toBe('No credits available');
  });

  it('should return false with reason when daily limit reached', async () => {
    mockInitUser.mockResolvedValue({ ...mockUserStatus, dailyUsage: 50, dailyLimit: 50 });

    const { result } = renderHook(() => useCanGenerateEstimate(), { wrapper });

    await waitFor(() => {
      expect(result.current.canGenerate).toBe(false);
    });

    expect(result.current.reason).toBe('Daily limit reached');
  });

  it('should allow generation when backend not configured (dev mode)', async () => {
    mockIsSupabaseConfigured.mockReturnValue(false);

    const { result } = renderHook(() => useCanGenerateEstimate(), { wrapper });

    await waitFor(() => {
      expect(result.current.canGenerate).toBe(true);
    });

    expect(result.current.reason).toBe(null);
  });

  it('should prioritize suspended account over no credits', async () => {
    mockInitUser.mockResolvedValue({
      ...mockUserStatus,
      isActive: false,
      creditsBalance: 0,
    });

    const { result } = renderHook(() => useCanGenerateEstimate(), { wrapper });

    await waitFor(() => {
      expect(result.current.canGenerate).toBe(false);
    });

    expect(result.current.reason).toBe('Account is suspended');
  });
});
