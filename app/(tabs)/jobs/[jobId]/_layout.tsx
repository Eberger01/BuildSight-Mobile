import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { darkTheme, spacing } from '@/constants/theme';

export default function JobIdLayout() {
  const router = useRouter();
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
          title: t('jobs.details'),
          headerLeft: () => (
            <Pressable
              onPress={() => router.push('/jobs')}
              style={{ paddingRight: spacing.md }}
            >
              <FontAwesome name="chevron-left" size={18} color={darkTheme.colors.text} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: t('jobs.editJob'),
        }}
      />
      <Stack.Screen
        name="photos"
        options={{
          title: t('jobs.jobPhotos'),
        }}
      />
    </Stack>
  );
}
