import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../constants/theme';
import { PriorityPicker } from './PriorityPicker';
import { JobPicker } from './JobPicker';
import type { TaskRow, TaskPriority, TaskInput } from '../../data/repos/tasksRepo';

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (task: TaskInput) => Promise<void>;
  initialTask?: TaskRow | null;
  initialDate?: string | null;
}

export function TaskFormModal({
  visible,
  onClose,
  onSave,
  initialTask,
  initialDate,
}: TaskFormModalProps) {
  const isEditMode = !!initialTask;

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [jobId, setJobId] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens/closes or initialTask changes
  useEffect(() => {
    if (visible) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDueDate(initialTask.dueAt ? initialTask.dueAt.slice(0, 10) : null);
        setPriority(initialTask.priority);
        setJobId(initialTask.jobId);
      } else {
        setTitle('');
        setDueDate(initialDate || null);
        setPriority('medium');
        setJobId(null);
      }
    }
  }, [visible, initialTask, initialDate]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a task title.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        dueAt: dueDate ? `${dueDate}T12:00:00.000Z` : null,
        priority,
        jobId,
      });
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateSelect = (day: { dateString: string }) => {
    setDueDate(day.dateString);
    setShowDatePicker(false);
  };

  const clearDate = () => {
    setDueDate(null);
  };

  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Select date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calendar theme matching the app's dark theme
  const calendarTheme = {
    backgroundColor: colors.dark.bgSecondary,
    calendarBackground: colors.dark.bgSecondary,
    textSectionTitleColor: colors.neutral[400],
    selectedDayBackgroundColor: colors.primary[500],
    selectedDayTextColor: colors.white,
    todayTextColor: colors.accent[500],
    dayTextColor: colors.dark.textPrimary,
    textDisabledColor: colors.neutral[600],
    dotColor: colors.primary[500],
    monthTextColor: colors.dark.textPrimary,
    arrowColor: colors.primary[500],
    textDayFontWeight: '500' as const,
    textMonthFontWeight: '600' as const,
    textDayHeaderFontWeight: '500' as const,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Edit Task' : 'New Task'}
            </Text>
            <Pressable onPress={onClose} disabled={isSaving}>
              <FontAwesome name="times" size={20} color={colors.neutral[400]} />
            </Pressable>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="What needs to be done?"
                placeholderTextColor={colors.neutral[500]}
                editable={!isSaving}
                autoFocus={!isEditMode}
              />
            </View>

            {/* Due Date */}
            <View style={styles.field}>
              <Text style={styles.label}>Due Date</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={isSaving}
              >
                <FontAwesome
                  name="calendar"
                  size={16}
                  color={dueDate ? colors.primary[500] : colors.neutral[500]}
                />
                <Text
                  style={[
                    styles.dateText,
                    !dueDate && styles.datePlaceholder,
                  ]}
                >
                  {formatDisplayDate(dueDate)}
                </Text>
                {dueDate && (
                  <Pressable
                    onPress={clearDate}
                    style={styles.clearButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <FontAwesome name="times-circle" size={16} color={colors.neutral[500]} />
                  </Pressable>
                )}
              </Pressable>

              {showDatePicker && (
                <View style={styles.calendarContainer}>
                  <Calendar
                    current={dueDate || undefined}
                    onDayPress={handleDateSelect}
                    markedDates={
                      dueDate
                        ? { [dueDate]: { selected: true, selectedColor: colors.primary[500] } }
                        : {}
                    }
                    theme={calendarTheme}
                    style={styles.calendar}
                  />
                </View>
              )}
            </View>

            {/* Priority */}
            <View style={styles.field}>
              <Text style={styles.label}>Priority</Text>
              <PriorityPicker
                value={priority}
                onChange={setPriority}
                disabled={isSaving}
              />
            </View>

            {/* Job Link */}
            <View style={styles.field}>
              <Text style={styles.label}>Link to Job</Text>
              <JobPicker
                value={jobId}
                onChange={setJobId}
                disabled={isSaving}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Save Changes' : 'Create Task'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.dark.textPrimary,
  },
  form: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.dark.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.dark.bgTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.dark.textPrimary,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dark.bgTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dateText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.dark.textPrimary,
  },
  datePlaceholder: {
    color: colors.neutral[500],
  },
  clearButton: {
    padding: spacing.xs,
  },
  calendarContainer: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  calendar: {
    borderRadius: borderRadius.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.dark.bgTertiary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.dark.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
});
