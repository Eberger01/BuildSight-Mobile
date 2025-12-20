import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import fr from './locales/fr.json';
import nl from './locales/nl.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

export const LANGUAGE_KEY = 'app_language';

export type LanguageCode = 'en' | 'fr' | 'nl' | 'es' | 'pt';

export const LANGUAGE_OPTIONS: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'nl', label: 'Dutch', native: 'Nederlands' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
];

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  nl: { translation: nl },
  es: { translation: es },
  pt: { translation: pt },
};

// Get initial language from saved preference or device locale
export const getInitialLanguage = async (): Promise<LanguageCode> => {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && saved in resources) {
      return saved as LanguageCode;
    }
  } catch (error) {
    console.warn('Failed to load saved language:', error);
  }

  // Fall back to device locale
  const locales = Localization.getLocales();
  const deviceLang = locales[0]?.languageCode || 'en';
  if (deviceLang in resources) {
    return deviceLang as LanguageCode;
  }

  return 'en';
};

// Save language preference
export const saveLanguage = async (lang: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch (error) {
    console.warn('Failed to save language:', error);
  }
};

// Change language and save preference
export const changeLanguage = async (lang: LanguageCode): Promise<void> => {
  await i18n.changeLanguage(lang);
  await saveLanguage(lang);
};

// Initialize i18n
i18n.use(initReactI18next).init({
  resources,
  lng: 'en', // Default, will be updated after async load
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
