import { Stack } from 'expo-router';

import { darkTheme } from '@/constants/theme';

export default function GalleryLayout() {
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
          title: 'Project Gallery',
        }}
      />
      <Stack.Screen
        name="[projectId]"
        options={{
          title: 'Project Photos',
        }}
      />
    </Stack>
  );
}
