import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { FontAwesome } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../constants/theme';
import { TaskListSimple } from '../../components/tasks/TaskList';
import { TaskFormModal } from '../../components/tasks/TaskFormModal';
import {
  listTasksByDateAsync,
  getTaskCountsByMonthAsync,
  createTaskAsync,
  toggleTaskCompletedAsync,
  TaskWithJob,
  TaskInput,
} from '../../data/repos/tasksRepo';

type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  };
};

export default function CalendarScreen() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });
  const [tasks, setTasks] = useState<TaskWithJob[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load tasks for selected date
      const dateTasks = await listTasksByDateAsync(selectedDate);
      setTasks(dateTasks);

      // Load marked dates for current month
      const counts = await getTaskCountsByMonthAsync(currentMonth.year, currentMonth.month);
      const marks: MarkedDates = {};

      counts.forEach((item) => {
        marks[item.date] = {
          marked: true,
          dotColor: item.hasHigh ? colors.danger[500] : colors.primary[500],
        };
      });

      // Add selection marker
      marks[selectedDate] = {
        ...marks[selectedDate],
        selected: true,
        selectedColor: colors.primary[500],
      };

      setMarkedDates(marks);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    }
  }, [selectedDate, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleMonthChange = (month: DateData) => {
    setCurrentMonth({ year: month.year, month: month.month });
  };

  const handleTaskPress = (task: TaskWithJob) => {
    router.push(`/calendar/${task.id}`);
  };

  const handleToggleComplete = async (taskId: number) => {
    try {
      await toggleTaskCompletedAsync(taskId);
      await loadData();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleCreateTask = async (input: TaskInput) => {
    await createTaskAsync(input);
    await loadData();
  };

  const formatSelectedDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    const isToday = dateStr === today;
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const formatted = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
    return isToday ? `Today, ${formatted}` : `${dayName}, ${formatted}`;
  };

  // Calendar theme matching the app's dark theme
  const calendarTheme = {
    backgroundColor: colors.dark.bgPrimary,
    calendarBackground: colors.dark.bgPrimary,
    textSectionTitleColor: colors.neutral[400],
    selectedDayBackgroundColor: colors.primary[500],
    selectedDayTextColor: colors.white,
    todayTextColor: colors.accent[500],
    dayTextColor: colors.dark.textPrimary,
    textDisabledColor: colors.neutral[700],
    dotColor: colors.primary[500],
    monthTextColor: colors.dark.textPrimary,
    arrowColor: colors.primary[500],
    textDayFontWeight: '500' as const,
    textMonthFontWeight: '600' as const,
    textDayHeaderFontWeight: '500' as const,
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      >
        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            markedDates={markedDates}
            theme={calendarTheme}
            style={styles.calendar}
            enableSwipeMonths
          />
        </View>

        {/* Selected Date Tasks */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <Text style={styles.tasksSectionTitle}>
              {formatSelectedDate(selectedDate)}
            </Text>
            <Text style={styles.taskCount}>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </Text>
          </View>

          <TaskListSimple
            tasks={tasks}
            onTaskPress={handleTaskPress}
            onToggleComplete={handleToggleComplete}
            showJob
            emptyTitle="No Tasks"
            emptyMessage={`No tasks scheduled for ${formatSelectedDate(selectedDate)}`}
          />
        </View>
      </ScrollView>

      {/* FAB - Add Task */}
      <Pressable
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <FontAwesome name="plus" size={24} color={colors.white} />
      </Pressable>

      {/* Add Task Modal */}
      <TaskFormModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateTask}
        initialDate={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  calendar: {
    borderRadius: borderRadius.lg,
    paddingBottom: spacing.sm,
  },
  tasksSection: {
    flex: 1,
    padding: spacing.lg,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tasksSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.dark.textPrimary,
  },
  taskCount: {
    fontSize: fontSize.sm,
    color: colors.dark.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
