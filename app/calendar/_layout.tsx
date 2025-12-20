import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';

export default function CalendarLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.dark.bgPrimary },
        headerTintColor: colors.dark.textPrimary,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.dark.bgPrimary },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('calendar.title'),
          headerBackTitle: t('common.back'),
        }}
      />
      <Stack.Screen
        name="[taskId]"
        options={{
          title: t('calendar.taskDetails'),
          headerBackTitle: t('calendar.calendarBackTitle'),
        }}
      />
    </Stack>
  );
}
