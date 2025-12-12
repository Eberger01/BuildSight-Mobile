import { StyleSheet } from 'react-native';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: darkTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  settingsCard: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: darkTheme.colors.border,
    marginHorizontal: spacing.lg,
  },
  chevron: {
    fontSize: fontSize['2xl'],
    color: darkTheme.colors.textMuted,
    fontWeight: '300',
  },
  dangerText: {
    color: colors.danger[500],
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  appVersion: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.xs,
  },
  appPowered: {
    fontSize: fontSize.xs,
    color: colors.primary[400],
    marginBottom: spacing.xs,
  },
  appCopyright: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 340,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: darkTheme.colors.text,
    textAlign: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  modalOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  modalOptionSelected: {
    backgroundColor: colors.primary[500] + '20',
  },
  modalOptionText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.text,
  },
  modalOptionTextSelected: {
    color: colors.primary[400],
    fontWeight: '600',
  },
  checkmark: {
    fontSize: fontSize.lg,
    color: colors.primary[400],
    fontWeight: '600',
  },
  modalCancel: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.border,
    marginTop: spacing.xs,
  },
  modalCancelText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
    textAlign: 'center',
  },
});


