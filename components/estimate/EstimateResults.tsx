import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { borderRadius, colors, darkTheme, fontSize, fontWeight, shadows, spacing } from '@/constants/theme';
import { Estimate, ProjectData } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { CountryCode } from '@/constants/countries';

type Props = {
  project: ProjectData;
  estimate: Estimate;
  currency: string;
  country?: CountryCode;
  isBusy: boolean;
  onNewEstimate: () => void;
  onAssignToJob: () => void;
  onDownloadPdf: () => void;
  assignedJobLabel?: string | null;
};

export function EstimateResults(props: Props) {
  const { t } = useTranslation();
  const { estimate, currency, country, isBusy, onNewEstimate, onAssignToJob, onDownloadPdf, assignedJobLabel } = props;

  // Support both new net/gross format and legacy format
  const hasNetGross = estimate.totalEstimate?.net && estimate.totalEstimate?.gross;
  const netAvg = hasNetGross ? estimate.totalEstimate.net.average : (estimate.totalEstimate?.average || 0);
  const grossAvg = hasNetGross ? estimate.totalEstimate.gross.average : netAvg;
  const grossMin = hasNetGross ? estimate.totalEstimate.gross.min : (estimate.totalEstimate?.min || 0);
  const grossMax = hasNetGross ? estimate.totalEstimate.gross.max : (estimate.totalEstimate?.max || 0);
  const taxRate = estimate.totalEstimate?.taxRate || 0;
  const taxAmount = estimate.totalEstimate?.taxAmount || (grossAvg - netAvg);

  const fmtPct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('estimateResults.aiGeneratedEstimate', 'AI-Generated Estimate')}</Text>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>{t('estimateResults.poweredByGemini', 'Powered by Gemini')}</Text>
        </View>
      </View>

      {/* Main Total Card - Shows Gross (incl. tax) */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>{t('estimateResults.totalEstimateInclTax', 'Total Estimate (incl. tax)')}</Text>
        <Text style={styles.totalAmount}>{formatCurrency(grossAvg, currency, country)}</Text>
        <Text style={styles.totalRange}>
          {t('estimateResults.range', 'Range')}: {formatCurrency(grossMin, currency, country)} - {formatCurrency(grossMax, currency, country)}
        </Text>
      </View>

      {/* Net/VAT breakdown (only show if we have net/gross data) */}
      {hasNetGross && taxAmount > 0 ? (
        <View style={styles.taxCard}>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>{t('estimateResults.netExclTax', 'Net (excl. tax)')}</Text>
            <Text style={styles.taxValue}>{formatCurrency(netAvg, currency, country)}</Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>{t('estimateResults.vatTax', 'VAT/Tax')} ({fmtPct(taxRate)})</Text>
            <Text style={styles.taxValue}>{formatCurrency(taxAmount, currency, country)}</Text>
          </View>
        </View>
      ) : null}

      {estimate.breakdown ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('estimateResults.costBreakdown', 'Cost Breakdown')}</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('estimateResults.materials', 'Materials')}</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.materials?.cost || 0, currency, country)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              {t('estimateResults.labor', 'Labor')} ({estimate.breakdown.labor?.hours || 0}h @ {formatCurrency(estimate.breakdown.labor?.hourlyRate || 0, currency, country)}/hr)
            </Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.labor?.cost || 0, currency, country)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>{t('estimateResults.permits', 'Permits')}</Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.permits || 0, currency, country)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>
              {t('estimateResults.contingency', 'Contingency')} {estimate.breakdown.contingencyRate ? `(${fmtPct(estimate.breakdown.contingencyRate)})` : ''}
            </Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.contingency || 0, currency, country)}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownRowLast]}>
            <Text style={styles.breakdownLabel}>
              {t('estimateResults.overhead', 'Overhead')} {estimate.breakdown.overheadRate ? `(${fmtPct(estimate.breakdown.overheadRate)})` : ''}
            </Text>
            <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.overhead || 0, currency, country)}</Text>
          </View>
        </View>
      ) : null}

      {estimate.timeline ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('estimate.timeline')}</Text>
          <Text style={styles.timelineText}>
            {t('estimateResults.estimatedDuration', 'Estimated Duration')}: <Text style={styles.timelineBold}>{estimate.timeline.estimatedDays} {t('estimateResults.days', 'days')}</Text>
          </Text>
          {estimate.timeline.phases?.length > 0 ? (
            <View style={styles.phasesList}>
              {estimate.timeline.phases.slice(0, 5).map((phase, idx) => (
                <Text key={idx} style={styles.phaseItem}>
                  • {phase.phase}: {phase.duration}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {estimate.assumptions?.length ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('estimateResults.assumptions', 'Assumptions')}</Text>
          {estimate.assumptions.map((item, idx) => (
            <View key={idx} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {estimate.exclusions?.length ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('estimateResults.notIncluded', 'Not Included')}</Text>
          {estimate.exclusions.map((item, idx) => (
            <View key={idx} style={styles.recommendationItem}>
              <Text style={[styles.recommendationBullet, { color: colors.danger[400] }]}>✗</Text>
              <Text style={styles.recommendationText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {estimate.risks?.length ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('estimateResults.risks', 'Risks')}</Text>
          {estimate.risks.slice(0, 3).map((risk, idx) => (
            <View key={idx} style={styles.riskItem}>
              <View style={styles.riskHeader}>
                <Text style={styles.riskTitle}>{risk.risk}</Text>
                <View style={[
                  styles.riskBadge,
                  risk.impact === 'high' ? styles.riskHigh : risk.impact === 'medium' ? styles.riskMedium : styles.riskLow
                ]}>
                  <Text style={styles.riskBadgeText}>{risk.impact}</Text>
                </View>
              </View>
              <Text style={styles.riskMitigation}>{risk.mitigation}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {estimate.recommendations?.length ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('estimateResults.recommendations', 'Recommendations')}</Text>
          {estimate.recommendations.map((rec, idx) => (
            <View key={idx} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>→</Text>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {assignedJobLabel ? (
        <View style={styles.assignedCard}>
          <Text style={styles.assignedText}>{t('estimateResults.assignedTo', 'Assigned to')}: {assignedJobLabel}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={[styles.primaryBtn, isBusy && styles.disabled]} onPress={onNewEstimate} disabled={isBusy}>
          <Text style={styles.primaryBtnText}>{t('estimateResults.newEstimate', 'New Estimate')}</Text>
        </Pressable>
        <Pressable style={[styles.secondaryBtn, isBusy && styles.disabled]} onPress={onAssignToJob} disabled={isBusy}>
          <Text style={styles.secondaryBtnText}>{t('estimateResults.assignToJob', 'Assign to Job')}</Text>
        </Pressable>
        <Pressable style={[styles.ghostBtn, isBusy && styles.disabled]} onPress={onDownloadPdf} disabled={isBusy}>
          <Text style={styles.ghostBtnText}>{t('estimateResults.downloadPdf', 'Download PDF')}</Text>
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
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  totalLabel: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted, marginBottom: spacing.xs },
  totalAmount: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, color: colors.primary[400], marginBottom: spacing.xs },
  totalRange: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted },
  taxCard: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  taxLabel: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted },
  taxValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: darkTheme.colors.text },
  sectionCard: { backgroundColor: darkTheme.colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadows.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: darkTheme.colors.text, marginBottom: spacing.md },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: darkTheme.colors.border },
  breakdownRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
  breakdownLabel: { fontSize: fontSize.md, color: darkTheme.colors.textMuted, flex: 1 },
  breakdownValue: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: darkTheme.colors.text },
  timelineText: { fontSize: fontSize.md, color: darkTheme.colors.textMuted },
  timelineBold: { fontWeight: fontWeight.bold, color: darkTheme.colors.text },
  phasesList: { marginTop: spacing.sm },
  phaseItem: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted, marginBottom: spacing.xs },
  recommendationItem: { flexDirection: 'row', marginBottom: spacing.xs },
  recommendationBullet: { color: colors.primary[400], marginRight: spacing.sm, fontSize: fontSize.md, width: 16 },
  recommendationText: { flex: 1, fontSize: fontSize.sm, color: darkTheme.colors.textMuted, lineHeight: 20 },
  riskItem: { marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: darkTheme.colors.border },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  riskTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: darkTheme.colors.text, flex: 1 },
  riskBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  riskBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, textTransform: 'uppercase' },
  riskHigh: { backgroundColor: colors.danger[500] + '30' },
  riskMedium: { backgroundColor: colors.warning[500] + '30' },
  riskLow: { backgroundColor: colors.success[500] + '30' },
  riskMitigation: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted },
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
