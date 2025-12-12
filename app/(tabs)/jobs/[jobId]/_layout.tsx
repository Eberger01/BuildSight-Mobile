import { Stack } from 'expo-router';

import { darkTheme } from '@/constants/theme';

export default function JobIdLayout() {
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
          title: 'Job Details',
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Job',
        }}
      />
      <Stack.Screen
        name="photos"
        options={{
          title: 'Job Photos',
        }}
      />
    </Stack>
  );
}
