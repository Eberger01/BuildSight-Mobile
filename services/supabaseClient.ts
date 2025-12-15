/**
 * Supabase Client Configuration
 * Initializes Supabase client for Edge Function calls
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
}

// Check if we're in a server-side rendering context (no window object)
const isSSR = typeof window === 'undefined';

// Create a memory-based storage for SSR that implements the required interface
const memoryStorage = {
  store: new Map<string, string>(),
  getItem: (key: string) => memoryStorage.store.get(key) ?? null,
  setItem: (key: string, value: string) => { memoryStorage.store.set(key, value); },
  removeItem: (key: string) => { memoryStorage.store.delete(key); },
};

// Lazy-load AsyncStorage only on client-side to avoid SSR issues
const getStorage = () => {
  if (isSSR) {
    return memoryStorage;
  }
  // Dynamic import would be ideal but for synchronous usage, we use require
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
};

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: !isSSR,
    persistSession: !isSSR,
    detectSessionInUrl: false,
  },
});

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

/**
 * Get Supabase URL for display purposes
 */
export function getSupabaseUrl(): string {
  return SUPABASE_URL;
}
