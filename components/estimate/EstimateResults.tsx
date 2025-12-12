import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, darkTheme, fontSize, fontWeight, shadows, spacing } from '@/constants/theme';
import { Estimate, ProjectData } from '@/types';
import { formatCurrency } from '@/utils/formatters';

type Props = {
  project: ProjectData;
  estimate: Estimate;
  currency: string;
  isBusy: boolean;
  onNewEstimate: () => void;
  onAssignToJob: () => void;
  onDownloadPdf: () => void;
  assignedJobLabel?: string | null;
};

export function EstimateResults(props: Props) {
  const { estimate, currency, isBusy, onNewEstimate, onAssignToJob, onDownloadPdf, assignedJobLabel } = props;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>AI-Generated Estimate</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>Powered by Gemini</Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Estimated Cost</Text>
        <Text style={styles.totalAmount}>{formatCurrency(estimate.totalEstimate?.average || 0, currency)}</Text>
        <Text style={styles.totalRange}>
          Range: {formatCurrency(estimate.totalEstimate?.min || 0, currency)} - {formatCurrency(estimate.totalEstimate?.max || 0, currency)}
        </Text>
      </View>

      {estimate.breakdown ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Materials</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.materials?.cost || 0, currency)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Labor</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.labor?.cost || 0, currency)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Permits</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.permits || 0, currency)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Contingency</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.contingency || 0, currency)}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownRowLast]}>
            <Text style={styles.breakdownLabel}>Overhead</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.overhead || 0, currency)}</Text>
          </View>
        </View>
      ) : null}

      {estimate.timeline ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <Text style={styles.timelineText}>
            Estimated Duration: <Text style={styles.timelineBold}>{estimate.timeline.estimatedDays} days</Text>
          </Text>
        </View>
      ) : null}

      {estimate.recommendations?.length ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {estimate.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>-</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {assignedJobLabel ? (
        <View style={styles.assignedCard}>
          <Text style={styles.assignedText}>Assigned to: {assignedJobLabel}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={[styles.primaryBtn, isBusy && styles.disabled]} onPress={onNewEstimate} disabled={isBusy}>
          <Text style={styles.primaryBtnText}>New Estimate</Text>
        </Pressable>
        <Pressable style={[styles.secondaryBtn, isBusy && styles.disabled]} onPress={onAssignToJob} disabled={isBusy}>
          <Text style={styles.secondaryBtnText}>Assign to Job</Text>
        </Pressable>
        <Pressable style={[styles.ghostBtn, isBusy && styles.disabled]} onPress={onDownloadPdf} disabled={isBusy}>
          <Text style={styles.ghostBtnText}>Download PDF</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkTheme.colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: darkTheme.colors.text },
  aiBadge: {
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[500] + '40',
  },
  aiBadgeText: { color: colors.primary[400], fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  totalCard: {
    backgroundColor: colors.primary[500] + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  totalLabel: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted, marginBottom: spacing.xs },
  totalAmount: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, color: colors.primary[400], marginBottom: spacing.xs },
  totalRange: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted },
  sectionCard: { backgroundColor: darkTheme.colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: darkTheme.colors.text, marginBottom: spacing.md },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: darkTheme.colors.border },
  breakdownRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  breakdownLabel: { fontSize: fontSize.md, color: darkTheme.colors.textMuted },
  breakdownValue: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: darkTheme.colors.text },
  timelineText: { fontSize: fontSize.md, color: darkTheme.colors.textMuted },
  timelineBold: { fontWeight: fontWeight.bold, color: darkTheme.colors.text },
  recommendationItem: { flexDirection: 'row', marginBottom: spacing.xs },
  recommendationBullet: { color: colors.primary[400], marginRight: spacing.sm, fontSize: fontSize.md },
  recommendationText: { flex: 1, fontSize: fontSize.sm, color: darkTheme.colors.textMuted, lineHeight: 20 },
  assignedCard: { backgroundColor: colors.success[500] + '15', borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.success[500] + '30' },
  assignedText: { color: darkTheme.colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, textAlign: 'center' },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  primaryBtn: { backgroundColor: colors.primary[500], borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', ...shadows.md },
  primaryBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  secondaryBtn: { backgroundColor: darkTheme.colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: darkTheme.colors.border },
  secondaryBtnText: { color: darkTheme.colors.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  ghostBtn: { backgroundColor: 'transparent', borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: darkTheme.colors.border },
  ghostBtnText: { color: darkTheme.colors.textMuted, fontSize: fontSize.md, fontWeight: fontWeight.medium },
  disabled: { opacity: 0.7 },
});


