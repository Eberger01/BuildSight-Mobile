import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../../constants/theme';
import { TaskCard } from './TaskCard';
import type { TaskWithJob } from '../../data/repos/tasksRepo';

interface TaskListProps {
  tasks: TaskWithJob[];
  onTaskPress?: (task: TaskWithJob) => void;
  onToggleComplete?: (taskId: number) => void;
  showJob?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  ListHeaderComponent?: React.ReactElement;
}

export function TaskList({
  tasks,
  onTaskPress,
  onToggleComplete,
  showJob = true,
  refreshing = false,
  onRefresh,
  emptyTitle = 'No Tasks',
  emptyMessage = 'No tasks to display',
  ListHeaderComponent,
}: TaskListProps) {
  const renderItem = ({ item }: { item: TaskWithJob }) => (
    <TaskCard
      task={item}
      onPress={onTaskPress ? () => onTaskPress(item) : undefined}
      onToggleComplete={onToggleComplete ? () => onToggleComplete(item.id) : undefined}
      showJob={showJob}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="calendar-check-o" size={48} color={colors.neutral[600]} />
      <Text style={styles.emptyTitle}>{emptyTitle}</Text>
      <Text style={styles.emptyMessage}>{emptyMessage}</Text>
    </View>
  );

  return (
    <FlatList
      data={tasks}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={[
        styles.listContent,
        tasks.length === 0 && styles.listContentEmpty,
      ]}
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

// Simple scrollable version without FlatList (for embedding in ScrollView)
export function TaskListSimple({
  tasks,
  onTaskPress,
  onToggleComplete,
  showJob = true,
  emptyTitle = 'No Tasks',
  emptyMessage = 'No tasks to display',
}: Omit<TaskListProps, 'refreshing' | 'onRefresh' | 'ListHeaderComponent'>) {
  if (tasks.length === 0) {
    return (
      <View style={styles.emptyContainerSimple}>
        <FontAwesome name="calendar-check-o" size={36} color={colors.neutral[600]} />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onPress={onTaskPress ? () => onTaskPress(task) : undefined}
          onToggleComplete={onToggleComplete ? () => onToggleComplete(task.id) : undefined}
          showJob={showJob}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
  },
  emptyContainerSimple: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.dark.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyMessage: {
    fontSize: fontSize.sm,
    color: colors.dark.textSecondary,
    textAlign: 'center',
  },
});
