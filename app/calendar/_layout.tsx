import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function CalendarLayout() {
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
          title: 'Task Calendar',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="[taskId]"
        options={{
          title: 'Task Details',
          headerBackTitle: 'Calendar',
        }}
      />
    </Stack>
  );
}
