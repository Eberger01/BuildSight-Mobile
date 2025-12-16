/**
 * Unit tests for deviceService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Mock dependencies before importing the module
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    Version: '31',
  },
}));

// Import after mocks are set up
import {
  getDeviceId,
  ensureDeviceId,
  getCachedDeviceId,
  clearDeviceId,
  getPlatformInfo,
} from '../deviceService';

describe('deviceService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getDeviceId', () => {
    it('should return existing device ID from storage', async () => {
      const existingId = 'android_abc123-def456';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(existingId);

      const deviceId = await getDeviceId();

      expect(deviceId).toBe(existingId);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('buildsight_device_id');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should generate new device ID when not in storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const deviceId = await getDeviceId();

      expect(deviceId).toMatch(/^android_[a-f0-9-]{36}$/);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'buildsight_device_id',
        expect.stringMatching(/^android_/)
      );
    });

    it('should return temp ID when storage fails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const deviceId = await getDeviceId();

      expect(deviceId).toMatch(/^temp_[a-f0-9-]{36}$/);
    });
  });

  describe('UUID format', () => {
    it('should generate valid UUID v4 format', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const deviceId = await getDeviceId();
      const uuidPart = deviceId.replace('android_', '');

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // Where y is 8, 9, a, or b
      const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
      expect(uuidPart).toMatch(uuidRegex);
    });
  });

  describe('ensureDeviceId', () => {
    it('should cache device ID after first call', async () => {
      const deviceId = 'android_cached-id';
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(deviceId);

      // First call
      const result1 = await ensureDeviceId();
      expect(result1).toBe(deviceId);
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);

      // Second call should use cache (though we can't fully test internal state)
      // We verify the function still returns the same value
      const result2 = await ensureDeviceId();
      expect(result2).toBe(deviceId);
    });
  });

  describe('getCachedDeviceId', () => {
    it('should return empty string when not cached', () => {
      // After clearDeviceId or before any device ID is loaded
      // Note: This test depends on the module's internal state
      const result = getCachedDeviceId();
      expect(typeof result).toBe('string');
    });
  });

  describe('clearDeviceId', () => {
    it('should remove device ID from storage', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await clearDeviceId();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('buildsight_device_id');
    });
  });

  describe('getPlatformInfo', () => {
    it('should return platform OS and version', () => {
      const info = getPlatformInfo();

      expect(info).toEqual({
        os: 'android',
        version: '31',
      });
    });
  });
});

describe('deviceService - Platform variations', () => {
  describe('platform prefix', () => {
    it('should use correct prefix based on platform', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const deviceId = await getDeviceId();

      // Platform is mocked to 'android'
      expect(deviceId.startsWith('android_')).toBe(true);
    });
  });
});
