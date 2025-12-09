import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows, darkTheme } from '@/constants/theme';

const activeJobs = [
  { id: 1, client: 'John Smith', type: 'Kitchen Remodel', status: 'In Progress', progress: 65, budget: '€28,500', startDate: '2025-12-01' },
  { id: 2, client: 'Sarah Johnson', type: 'Bathroom Upgrade', status: 'Planning', progress: 25, budget: '€15,200', startDate: '2025-12-03' },
  { id: 3, client: 'Mike Davis', type: 'Fence Installation', status: 'In Progress', progress: 80, budget: '€8,900', startDate: '2025-11-28' },
  { id: 4, client: 'Emily Brown', type: 'Home Improvement', status: 'Review', progress: 95, budget: '€42,000', startDate: '2025-11-25' },
  { id: 5, client: 'Robert Wilson', type: 'Deck Construction', status: 'In Progress', progress: 40, budget: '€12,500', startDate: '2025-12-05' },
  { id: 6, client: 'Lisa Anderson', type: 'Painting', status: 'Planning', progress: 10, budget: '€5,200', startDate: '2025-12-08' },
];

export default function JobsScreen() {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return colors.primary[500];
      case 'planning': return colors.accent[500];
      case 'review': return colors.success[500];
      default: return colors.neutral[500];
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Jobs</Text>
        <Text style={styles.headerSubtitle}>{activeJobs.length} projects in progress</Text>
      </View>

      <View style={styles.jobsGrid}>
        {activeJobs.map((job) => (
          <View key={job.id} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View>
                <Text style={styles.jobClient}>{job.client}</Text>
                <Text style={styles.jobType}>{job.type}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>{job.status}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{job.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${job.progress}%` }]} />
              </View>
            </View>

            <View style={styles.jobDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Budget</Text>
                <Text style={styles.detailValue}>{job.budget}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Started</Text>
                <Text style={styles.detailValue}>{job.startDate}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  jobsGrid: {
    gap: spacing.md,
  },
  jobCard: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  jobClient: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  jobType: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  progressValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: darkTheme.colors.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  jobDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: darkTheme.colors.text,
  },
});
