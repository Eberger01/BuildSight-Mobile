import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { darkTheme } from '@/constants/theme';

export default function GalleryLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: darkTheme.colors.background,
        },
        headerTintColor: darkTheme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('gallery.projectGallery'),
        }}
      />
      <Stack.Screen
        name="[projectId]"
        options={{
          title: t('gallery.projectPhotos'),
        }}
      />
    </Stack>
  );
}
