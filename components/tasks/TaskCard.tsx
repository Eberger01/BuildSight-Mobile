import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../constants/theme';
import { getPriorityColor } from './PriorityPicker';
import type { TaskWithJob, TaskPriority } from '../../data/repos/tasksRepo';

interface TaskCardProps {
  task: TaskWithJob;
  onPress?: () => void;
  onToggleComplete?: () => void;
  showJob?: boolean;
  compact?: boolean;
}

export function TaskCard({
  task,
  onPress,
  onToggleComplete,
  showJob = true,
  compact = false,
}: TaskCardProps) {
  const { t, i18n } = useTranslation();
  const priorityColor = getPriorityColor(task.priority);
  const isCompleted = task.completed === 1;
  const locale = i18n.language || 'en';

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return t('tasks.noDueDate', 'No due date');
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours === 0 && minutes === 0) return '';
    return date.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Pressable
      style={[
        styles.container,
        compact && styles.containerCompact,
        isCompleted && styles.containerCompleted,
      ]}
      onPress={onPress}
    >
      {/* Priority indicator */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.title, isCompleted && styles.titleCompleted]}
            numberOfLines={compact ? 1 : 2}
          >
            {task.title}
          </Text>
          {onToggleComplete && (
            <Pressable
              style={[styles.checkButton, isCompleted && styles.checkButtonCompleted]}
              onPress={(e) => {
                e.stopPropagation();
                onToggleComplete();
              }}
            >
              <FontAwesome
                name={isCompleted ? 'undo' : 'check'}
                size={12}
                color={isCompleted ? colors.neutral[400] : colors.white}
              />
            </Pressable>
          )}
        </View>

        <View style={styles.meta}>
          {task.dueAt && (
            <View style={styles.metaItem}>
              <FontAwesome name="calendar" size={12} color={colors.neutral[500]} />
              <Text style={styles.metaText}>
                {formatDate(task.dueAt)}
                {formatTime(task.dueAt) && ` at ${formatTime(task.dueAt)}`}
              </Text>
            </View>
          )}

          {showJob && task.jobClientName && (
            <View style={styles.metaItem}>
              <FontAwesome name="briefcase" size={12} color={colors.primary[400]} />
              <Text style={[styles.metaText, styles.jobText]} numberOfLines={1}>
                {task.jobProjectType}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Chevron for navigation */}
      {onPress && (
        <FontAwesome
          name="chevron-right"
          size={12}
          color={colors.neutral[600]}
          style={styles.chevron}
        />
      )}
    </Pressable>
  );
}

// Simplified version for dashboard
export function TaskCardCompact({
  task,
  onPress,
  onToggleComplete,
}: Omit<TaskCardProps, 'showJob' | 'compact'>) {
  return (
    <TaskCard
      task={task}
      onPress={onPress}
      onToggleComplete={onToggleComplete}
      showJob={false}
      compact
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  containerCompact: {
    marginBottom: spacing.xs,
  },
  containerCompleted: {
    opacity: 0.7,
  },
  priorityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
    paddingLeft: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.dark.textPrimary,
    lineHeight: fontSize.md * 1.4,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.dark.textSecondary,
  },
  checkButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: colors.dark.bgTertiary,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.sm,
    color: colors.dark.textSecondary,
  },
  jobText: {
    color: colors.primary[400],
  },
  chevron: {
    alignSelf: 'center',
    paddingRight: spacing.md,
  },
});
