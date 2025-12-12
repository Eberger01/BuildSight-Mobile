import AsyncStorage from '@react-native-async-storage/async-storage';

export const SETTINGS_KEY = 'buildsight_settings';
export const ESTIMATE_DRAFT_KEY = 'buildsight_estimate_draft';

export type SettingsData = {
  aiEnabled: boolean;
  notifications: boolean;
  autoSave: boolean;
  autoUpload: boolean;
  photoQuality: 'high' | 'medium' | 'low';
  currency: 'USD' | 'EUR' | 'BRL';
};

export const defaultSettings: SettingsData = {
  aiEnabled: true,
  notifications: true,
  autoSave: true,
  autoUpload: false,
  photoQuality: 'high',
  currency: 'EUR',
};

export async function loadSettingsAsync(): Promise<SettingsData> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return defaultSettings;
  try {
    const parsed = JSON.parse(raw) as Partial<SettingsData>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}


