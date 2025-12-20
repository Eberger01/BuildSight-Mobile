import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { darkTheme } from '@/constants/theme';

export default function JobsLayout() {
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
          title: t('jobs.title'),
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: t('jobs.newJob'),
        }}
      />
      <Stack.Screen
        name="[jobId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
