import { Stack } from 'expo-router';

import { darkTheme } from '@/constants/theme';

export default function JobsLayout() {
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
          title: 'Active Jobs',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Job',
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
