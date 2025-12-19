import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';
import type { TaskPriority } from '../../data/repos/tasksRepo';

interface PriorityPickerProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
}

const priorities: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: colors.danger[500] },
  { value: 'medium', label: 'Medium', color: colors.warning[500] },
  { value: 'low', label: 'Low', color: colors.success[500] },
];

export function PriorityPicker({ value, onChange, disabled }: PriorityPickerProps) {
  return (
    <View style={styles.container}>
      {priorities.map((p) => {
        const isSelected = value === p.value;
        return (
          <Pressable
            key={p.value}
            style={[
              styles.pill,
              isSelected && { backgroundColor: p.color },
              disabled && styles.disabled,
            ]}
            onPress={() => !disabled && onChange(p.value)}
          >
            <View style={[styles.dot, { backgroundColor: p.color }]} />
            <Text
              style={[
                styles.pillText,
                isSelected && styles.pillTextSelected,
              ]}
            >
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function getPriorityColor(priority: TaskPriority): string {
  switch (priority) {
    case 'high':
      return colors.danger[500];
    case 'medium':
      return colors.warning[500];
    case 'low':
      return colors.success[500];
    default:
      return colors.neutral[500];
  }
}

export function getPriorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Low';
    default:
      return 'Unknown';
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.dark.bgTertiary,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  pillText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.dark.textSecondary,
  },
  pillTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
