/**
 * Device Service
 * Manages unique device identification for anonymous users
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'buildsight_device_id';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers/Node)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create a unique device ID
 * This ID persists across app sessions and is used for user identification
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate new device ID with platform prefix
      const platformPrefix = Platform.OS === 'web' ? 'web' : Platform.OS === 'ios' ? 'ios' : 'android';
      deviceId = `${platformPrefix}_${generateUUID()}`;

      // Persist it
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('Generated new device ID:', deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to in-memory ID if storage fails
    return `temp_${generateUUID()}`;
  }
}

/**
 * Get device ID synchronously if already cached (for headers)
 * Note: Should call getDeviceId() first to ensure it's cached
 */
let cachedDeviceId: string | null = null;

export async function ensureDeviceId(): Promise<string> {
  if (!cachedDeviceId) {
    cachedDeviceId = await getDeviceId();
  }
  return cachedDeviceId;
}

/**
 * Get cached device ID (returns empty string if not yet loaded)
 */
export function getCachedDeviceId(): string {
  return cachedDeviceId || '';
}

/**
 * Clear device ID (for testing or reset purposes)
 */
export async function clearDeviceId(): Promise<void> {
  cachedDeviceId = null;
  await AsyncStorage.removeItem(DEVICE_ID_KEY);
}

/**
 * Get platform information
 */
export function getPlatformInfo(): { os: string; version: string } {
  return {
    os: Platform.OS,
    version: Platform.Version?.toString() || 'unknown',
  };
}
