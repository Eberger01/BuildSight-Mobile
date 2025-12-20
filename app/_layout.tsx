import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';

import { useColorScheme } from '@/components/useColorScheme';
import { CreditsProvider } from '@/contexts/CreditsContext';
import i18n, { getInitialLanguage } from '@/i18n';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [i18nReady, setI18nReady] = useState(false);

  // Initialize i18n with saved language preference
  useEffect(() => {
    getInitialLanguage().then((lang) => {
      i18n.changeLanguage(lang).then(() => {
        setI18nReady(true);
      });
    });
  }, []);

  // Hide splash screen immediately on mount
  useEffect(() => {
    if (i18nReady) {
      SplashScreen.hideAsync();
    }
  }, [i18nReady]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
    }
  }, [error]);

  if (!i18nReady) {
    return null; // Wait for i18n to be ready
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <I18nextProvider i18n={i18n}>
          <CreditsProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              </Stack>
            </ThemeProvider>
          </CreditsProvider>
        </I18nextProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
