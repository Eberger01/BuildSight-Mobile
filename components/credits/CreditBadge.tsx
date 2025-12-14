/**
 * Credit Badge Component
 * Displays credit balance in a compact badge format
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCredits } from '@/contexts/CreditsContext';
import { colors, spacing, borderRadius, fontSize } from '@/constants/theme';

interface CreditBadgeProps {
  /**
   * Whether the badge is pressable (navigates to subscription)
   */
  pressable?: boolean;

  /**
   * Size variant
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Show loading state
   */
  showLoading?: boolean;
}

export function CreditBadge({
  pressable = true,
  size = 'medium',
  showLoading = true,
}: CreditBadgeProps) {
  const router = useRouter();
  const { credits, isLoading, hasCredits } = useCredits();

  const handlePress = () => {
    if (pressable) {
      router.push('/subscription');
    }
  };

  const sizeStyles = {
    small: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs / 2,
      fontSize: fontSize.xs,
      iconSize: 12,
    },
    medium: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      fontSize: fontSize.sm,
      iconSize: 14,
    },
    large: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      fontSize: fontSize.md,
      iconSize: 16,
    },
  }[size];

  const content = (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
        },
        !hasCredits && styles.emptyContainer,
      ]}
    >
      {isLoading && showLoading ? (
        <ActivityIndicator size="small" color={colors.primary[500]} />
      ) : (
        <>
          <Text style={[styles.icon, { fontSize: sizeStyles.iconSize }]}>
            {hasCredits ? '💎' : '⚠️'}
          </Text>
          <Text
            style={[
              styles.text,
              { fontSize: sizeStyles.fontSize },
              !hasCredits && styles.emptyText,
            ]}
          >
            {credits}
          </Text>
        </>
      )}
    </View>
  );

  if (pressable) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

/**
 * Inline credit display (for use in text)
 */
export function CreditDisplay({ showLabel = false }: { showLabel?: boolean }) {
  const { credits, isLoading } = useCredits();

  if (isLoading) {
    return <Text style={styles.inlineText}>...</Text>;
  }

  return (
    <Text style={styles.inlineText}>
      {credits}
      {showLabel && ' credits'}
    </Text>
  );
}

/**
 * Credit warning banner (shows when low on credits)
 */
export function CreditWarningBanner() {
  const router = useRouter();
  const { credits, hasCredits, isLoading } = useCredits();

  if (isLoading || credits > 2) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.warningBanner, !hasCredits && styles.errorBanner]}
      onPress={() => router.push('/subscription')}
    >
      <Text style={styles.warningIcon}>{hasCredits ? '⚠️' : '🚫'}</Text>
      <Text style={styles.warningText}>
        {hasCredits
          ? `Only ${credits} credit${credits > 1 ? 's' : ''} remaining`
          : 'No credits - tap to purchase'}
      </Text>
      <Text style={styles.warningArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500] + '20',
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  emptyContainer: {
    backgroundColor: colors.danger[500] + '20',
  },
  icon: {
    // fontSize set dynamically
  },
  text: {
    color: colors.primary[500],
    fontWeight: '600',
    // fontSize set dynamically
  },
  emptyText: {
    color: colors.danger[500],
  },
  inlineText: {
    color: colors.primary[500],
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent[500] + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorBanner: {
    backgroundColor: colors.danger[500] + '20',
  },
  warningIcon: {
    fontSize: fontSize.md,
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  warningArrow: {
    fontSize: fontSize.lg,
    color: colors.dark.textMuted,
  },
});

export default CreditBadge;
