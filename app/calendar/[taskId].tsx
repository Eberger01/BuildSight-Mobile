import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../constants/theme';
import { getPriorityColor, getPriorityLabel } from '../../components/tasks/PriorityPicker';
import { TaskFormModal } from '../../components/tasks/TaskFormModal';
import {
  getTaskWithJobAsync,
  updateTaskAsync,
  deleteTaskAsync,
  toggleTaskCompletedAsync,
  TaskWithJob,
  TaskInput,
} from '../../data/repos/tasksRepo';

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const router = useRouter();

  const [task, setTask] = useState<TaskWithJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    try {
      const data = await getTaskWithJobAsync(Number(taskId));
      setTask(data);
    } catch (error) {
      console.error('Error loading task:', error);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useFocusEffect(
    useCallback(() => {
      loadTask();
    }, [loadTask])
  );

  const handleToggleComplete = async () => {
    if (!task) return;
    try {
      await toggleTaskCompletedAsync(task.id);
      await loadTask();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleEdit = async (input: TaskInput) => {
    if (!task) return;
    await updateTaskAsync(task.id, {
      title: input.title,
      dueAt: input.dueAt,
      priority: input.priority,
      jobId: input.jobId,
    });
    await loadTask();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTaskAsync(Number(taskId));
              router.back();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task.');
            }
          },
        },
      ]
    );
  };

  const handleJobPress = () => {
    if (task?.jobId) {
      router.push(`/(tabs)/jobs/${task.jobId}`);
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours === 0 && minutes === 0) return '';
    if (hours === 12 && minutes === 0) return ''; // Default time set in modal
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatTimestamp = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={48} color={colors.danger[500]} />
        <Text style={styles.errorTitle}>Task Not Found</Text>
        <Text style={styles.errorMessage}>This task may have been deleted.</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isCompleted = task.completed === 1;
  const priorityColor = getPriorityColor(task.priority);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={() => setShowEditModal(true)} style={styles.headerButton}>
                <FontAwesome name="edit" size={18} color={colors.primary[500]} />
              </Pressable>
              <Pressable onPress={handleDelete} style={styles.headerButton}>
                <FontAwesome name="trash" size={18} color={colors.danger[500]} />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
            <FontAwesome
              name={isCompleted ? 'check-circle' : 'circle-o'}
              size={14}
              color={isCompleted ? colors.success[500] : colors.neutral[500]}
            />
            <Text style={[styles.statusText, isCompleted && styles.statusTextCompleted]}>
              {isCompleted ? 'Completed' : 'Pending'}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {getPriorityLabel(task.priority)} Priority
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
          {task.title}
        </Text>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          {/* Due Date */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <FontAwesome name="calendar" size={16} color={colors.primary[500]} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailValue}>
                {formatDate(task.dueAt)}
                {formatTime(task.dueAt) && ` at ${formatTime(task.dueAt)}`}
              </Text>
            </View>
          </View>

          {/* Linked Job */}
          {task.jobId && task.jobClientName && (
            <Pressable style={styles.detailRow} onPress={handleJobPress}>
              <View style={styles.detailIcon}>
                <FontAwesome name="briefcase" size={16} color={colors.primary[500]} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Linked Job</Text>
                <Text style={styles.detailValue}>{task.jobProjectType}</Text>
                <Text style={styles.detailSubvalue}>{task.jobClientName}</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={colors.neutral[500]} />
            </Pressable>
          )}

          {!task.jobId && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <FontAwesome name="link" size={16} color={colors.neutral[500]} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Linked Job</Text>
                <Text style={styles.detailValueMuted}>No job linked</Text>
              </View>
            </View>
          )}
        </View>

        {/* Timestamps */}
        <View style={styles.timestamps}>
          <Text style={styles.timestamp}>Created: {formatTimestamp(task.createdAt)}</Text>
          <Text style={styles.timestamp}>Updated: {formatTimestamp(task.updatedAt)}</Text>
        </View>

        {/* Action Button */}
        <Pressable
          style={[
            styles.actionButton,
            isCompleted && styles.actionButtonSecondary,
          ]}
          onPress={handleToggleComplete}
        >
          <FontAwesome
            name={isCompleted ? 'undo' : 'check'}
            size={18}
            color={isCompleted ? colors.dark.textPrimary : colors.white}
          />
          <Text
            style={[
              styles.actionButtonText,
              isCompleted && styles.actionButtonTextSecondary,
            ]}
          >
            {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Edit Modal */}
      <TaskFormModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEdit}
        initialTask={task}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  content: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.bgPrimary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.bgPrimary,
    padding: spacing['3xl'],
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.dark.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: fontSize.md,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  backButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerButton: {
    padding: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dark.bgTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusBadgeCompleted: {
    backgroundColor: colors.success[500] + '20',
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.neutral[400],
  },
  statusTextCompleted: {
    color: colors.success[500],
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.dark.textPrimary,
    lineHeight: fontSize['2xl'] * 1.3,
    marginBottom: spacing.xl,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.dark.textSecondary,
  },
  detailsCard: {
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.dark.textSecondary,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.dark.textPrimary,
  },
  detailValueMuted: {
    fontSize: fontSize.md,
    color: colors.neutral[500],
  },
  detailSubvalue: {
    fontSize: fontSize.sm,
    color: colors.dark.textSecondary,
    marginTop: spacing.xs,
  },
  timestamps: {
    marginBottom: spacing.xl,
  },
  timestamp: {
    fontSize: fontSize.sm,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success[500],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  actionButtonSecondary: {
    backgroundColor: colors.dark.bgSecondary,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  actionButtonTextSecondary: {
    color: colors.dark.textPrimary,
  },
});
