/**
 * Estimate Service
 * Secure AI estimation through backend proxy
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getDeviceId } from './deviceService';
import { reserveCredit } from './creditsService';
import { Estimate, ProjectData } from '@/types';
import { CountryCode, CurrencyCode } from '@/constants/countries';

// Feature flag for backend usage
const USE_BACKEND = process.env.EXPO_PUBLIC_USE_BACKEND === 'true';

/**
 * Region settings for estimation
 */
export interface RegionSettings {
  country: CountryCode;
  currency: CurrencyCode;
}

/**
 * Result from secure estimate generation
 */
export interface EstimateResult {
  estimate: Estimate;
  requestId: string;
  latencyMs: number;
}

/**
 * Generate AI-powered cost estimation through secure backend
 * This function:
 * 1. Reserves a credit
 * 2. Calls the backend to generate estimate (which uses server-side API key)
 * 3. Returns the estimate or throws an error (with credit refunded on failure)
 */
export async function generateEstimateSecure(
  projectData: ProjectData,
  regionSettings: RegionSettings
): Promise<Estimate> {
  if (!USE_BACKEND) {
    // Fallback to direct Gemini calls (development only)
    const { generateEstimate } = await import('./geminiService');
    return generateEstimate(projectData, regionSettings);
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Backend not configured. Please contact support.');
  }

  const deviceId = await getDeviceId();

  // Step 1: Reserve a credit
  let requestId: string;
  try {
    const reservation = await reserveCredit(projectData.projectType, regionSettings.country);
    requestId = reservation.requestId;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INSUFFICIENT_CREDITS') {
        throw new Error('You need credits to generate an estimate. Please purchase credits to continue.');
      }
      if (error.message === 'DAILY_LIMIT_REACHED') {
        throw new Error('You have reached your daily limit. Please try again tomorrow.');
      }
      if (error.message === 'SERVICE_UNAVAILABLE') {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      }
    }
    throw error;
  }

  // Step 2: Call backend to generate estimate
  try {
    const { data, error } = await supabase.functions.invoke('generate-estimate', {
      headers: { 'x-device-id': deviceId },
      body: {
        request_id: requestId,
        project_data: projectData,
        region_settings: regionSettings,
      },
    });

    if (error) {
      console.error('Generate estimate error:', error);

      // Check if credit was refunded
      if (error.message?.includes('creditRefunded')) {
        throw new Error('AI estimation failed. Your credit has been refunded.');
      }

      throw new Error(error.message || 'Failed to generate estimate');
    }

    return data.estimate as Estimate;

  } catch (error) {
    console.error('Estimate generation failed:', error);
    throw error;
  }
}

/**
 * Check if backend estimation is available
 */
export function isBackendEnabled(): boolean {
  return USE_BACKEND && isSupabaseConfigured();
}

/**
 * Get estimation mode for display
 */
export function getEstimationMode(): 'backend' | 'direct' {
  return isBackendEnabled() ? 'backend' : 'direct';
}
