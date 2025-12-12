import AsyncStorage from '@react-native-async-storage/async-storage';

export const PROFILE_KEY = 'buildsight_profile';

export type ProfileData = {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
};

export const defaultProfile: ProfileData = {
  companyName: '',
  contactEmail: '',
  contactPhone: '',
};

export async function loadProfileAsync(): Promise<ProfileData> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return defaultProfile;
  try {
    const parsed = JSON.parse(raw) as Partial<ProfileData>;
    return { ...defaultProfile, ...parsed };
  } catch {
    return defaultProfile;
  }
}

export async function saveProfileAsync(profile: ProfileData): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}


