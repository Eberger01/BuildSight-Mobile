/**
 * Unit tests for creditsService
 */

// Create mock invoke function at module scope
const mockInvoke = jest.fn();

// Mock supabase client - use getter to return mockInvoke
jest.mock('../supabaseClient', () => ({
  get supabase() {
    return {
      functions: {
        invoke: mockInvoke,
      },
    };
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

// Mock deviceService
jest.mock('../deviceService', () => ({
  getDeviceId: jest.fn(() => Promise.resolve('android_test-device-id')),
}));

import {
  initUser,
  getUserStatus,
  reserveCredit,
  restorePurchases,
  hasCredits,
  getCreditBalance,
  UserStatus,
} from '../creditsService';
import { isSupabaseConfigured } from '../supabaseClient';

// Sample user status response
const mockUserStatus: UserStatus = {
  userId: 'user-123',
  deviceId: 'android_test-device-id',
  email: null,
  planType: 'free',
  isActive: true,
  revenuecatCustomerId: null,
  creditsBalance: 10,
  creditsReserved: 0,
  lifetimeCredits: 15,
  dailyUsage: 3,
  dailyLimit: 50,
  canUseAi: true,
};

describe('creditsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  });

  describe('initUser', () => {
    it('should call init-user edge function with device ID header', async () => {
      mockInvoke.mockResolvedValue({ data: mockUserStatus, error: null });

      const result = await initUser();

      expect(mockInvoke).toHaveBeenCalledWith('init-user', {
        headers: { 'x-device-id': 'android_test-device-id' },
      });
      expect(result).toEqual(mockUserStatus);
    });

    it('should throw error when Supabase not configured', async () => {
      (isSupabaseConfigured as jest.Mock).mockReturnValue(false);

      await expect(initUser()).rejects.toThrow('Supabase not configured');
    });

    it('should throw error on edge function failure', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      await expect(initUser()).rejects.toThrow('Server error');
    });

    it('should handle new user flag', async () => {
      const newUserStatus = { ...mockUserStatus, isNewUser: true };
      mockInvoke.mockResolvedValue({ data: newUserStatus, error: null });

      const result = await initUser();

      expect(result.isNewUser).toBe(true);
    });
  });

  describe('getUserStatus', () => {
    it('should call get-user-status edge function', async () => {
      mockInvoke.mockResolvedValue({ data: mockUserStatus, error: null });

      const result = await getUserStatus();

      expect(mockInvoke).toHaveBeenCalledWith('get-user-status', {
        headers: { 'x-device-id': 'android_test-device-id' },
      });
      expect(result).toEqual(mockUserStatus);
    });

    it('should return complete UserStatus object', async () => {
      mockInvoke.mockResolvedValue({ data: mockUserStatus, error: null });

      const result = await getUserStatus();

      expect(result.creditsBalance).toBe(10);
      expect(result.dailyUsage).toBe(3);
      expect(result.dailyLimit).toBe(50);
      expect(result.canUseAi).toBe(true);
    });

    it('should throw error on failure', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      await expect(getUserStatus()).rejects.toThrow('User not found');
    });
  });

  describe('reserveCredit', () => {
    const mockReservation = {
      requestId: 'req-123',
      creditsBalance: 9,
      creditsReserved: 1,
    };

    it('should call reserve-credit with body params', async () => {
      mockInvoke.mockResolvedValue({ data: mockReservation, error: null });

      const result = await reserveCredit('bathroom_remodel', 'US');

      expect(mockInvoke).toHaveBeenCalledWith('reserve-credit', {
        headers: { 'x-device-id': 'android_test-device-id' },
        body: { projectType: 'bathroom_remodel', countryCode: 'US' },
      });
      expect(result.requestId).toBe('req-123');
    });

    it('should handle INSUFFICIENT_CREDITS error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'INSUFFICIENT_CREDITS' },
      });

      await expect(reserveCredit()).rejects.toThrow('INSUFFICIENT_CREDITS');
    });

    it('should handle 402 error code', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: '402: Not enough credits' },
      });

      await expect(reserveCredit()).rejects.toThrow('INSUFFICIENT_CREDITS');
    });

    it('should handle DAILY_LIMIT_REACHED error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Daily limit reached' },
      });

      await expect(reserveCredit()).rejects.toThrow('DAILY_LIMIT_REACHED');
    });

    it('should handle 429 error code', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: '429: Rate limited' },
      });

      await expect(reserveCredit()).rejects.toThrow('DAILY_LIMIT_REACHED');
    });

    it('should handle SERVICE_UNAVAILABLE error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: '503: Service unavailable' },
      });

      await expect(reserveCredit()).rejects.toThrow('SERVICE_UNAVAILABLE');
    });

    it('should handle generic errors', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Unknown error occurred' },
      });

      await expect(reserveCredit()).rejects.toThrow('Unknown error occurred');
    });
  });

  describe('restorePurchases', () => {
    it('should call restore-purchases edge function', async () => {
      const mockRestoreData = {
        creditsBalance: 20,
        lifetimeCredits: 50,
        totalPurchases: 5,
      };
      mockInvoke.mockResolvedValue({ data: mockRestoreData, error: null });

      const result = await restorePurchases();

      expect(mockInvoke).toHaveBeenCalledWith('restore-purchases', {
        headers: { 'x-device-id': 'android_test-device-id' },
      });
      expect(result).toEqual({
        creditsBalance: 20,
        lifetimeCredits: 50,
        totalPurchases: 5,
      });
    });

    it('should throw error on failure', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Restore failed' },
      });

      await expect(restorePurchases()).rejects.toThrow('Restore failed');
    });
  });

  describe('hasCredits', () => {
    it('should return true when user has credits', async () => {
      mockInvoke.mockResolvedValue({ data: mockUserStatus, error: null });

      const result = await hasCredits();

      expect(result).toBe(true);
    });

    it('should return false when user has no credits', async () => {
      mockInvoke.mockResolvedValue({
        data: { ...mockUserStatus, creditsBalance: 0 },
        error: null,
      });

      const result = await hasCredits();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const result = await hasCredits();

      expect(result).toBe(false);
    });
  });

  describe('getCreditBalance', () => {
    it('should return credit balance', async () => {
      mockInvoke.mockResolvedValue({ data: mockUserStatus, error: null });

      const result = await getCreditBalance();

      expect(result).toBe(10);
    });

    it('should return 0 on error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      });

      const result = await getCreditBalance();

      expect(result).toBe(0);
    });
  });
});

describe('creditsService - Edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isSupabaseConfigured as jest.Mock).mockReturnValue(true);
  });

  describe('UserStatus types', () => {
    it('should handle all plan types', async () => {
      const planTypes = ['free', 'single', 'pack10', 'pro_monthly'] as const;

      for (const planType of planTypes) {
        mockInvoke.mockResolvedValue({
          data: { ...mockUserStatus, planType },
          error: null,
        });

        const result = await getUserStatus();
        expect(result.planType).toBe(planType);
      }
    });

    it('should handle user with recent transactions', async () => {
      const transactions = [
        {
          id: 'tx-1',
          amount: 10,
          transaction_type: 'purchase',
          description: 'Bought 10 credits',
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      mockInvoke.mockResolvedValue({
        data: { ...mockUserStatus, recentTransactions: transactions },
        error: null,
      });

      const result = await getUserStatus();
      expect(result.recentTransactions).toEqual(transactions);
    });
  });
});
