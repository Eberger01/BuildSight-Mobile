import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, fontSize, shadows, darkTheme } from '@/constants/theme';

// Sample data
const stats = [
  { label: 'Active Jobs', value: '12', icon: '🔨', trend: '+3', color: 'primary' },
  { label: 'Pending Estimates', value: '8', icon: '📋', trend: '+2', color: 'accent' },
  { label: 'Completed This Month', value: '24', icon: '✅', trend: '+12%', color: 'success' },
  { label: 'Total Revenue', value: '€142K', icon: '💰', trend: '+18%', color: 'success' },
];

const recentJobs = [
  { id: 1, client: 'John Smith', type: 'Kitchen Remodel', status: 'In Progress', progress: 65, date: '2025-12-01' },
  { id: 2, client: 'Sarah Johnson', type: 'Bathroom Upgrade', status: 'Planning', progress: 25, date: '2025-12-03' },
  { id: 3, client: 'Mike Davis', type: 'Fence Installation', status: 'In Progress', progress: 80, date: '2025-11-28' },
  { id: 4, client: 'Emily Brown', type: 'Home Improvement', status: 'Review', progress: 95, date: '2025-11-25' },
];

const upcomingTasks = [
  { task: 'Site inspection - Johnson residence', time: 'Today, 2:00 PM', priority: 'high' },
  { task: 'Material delivery - Smith kitchen', time: 'Tomorrow, 10:00 AM', priority: 'medium' },
  { task: 'Final walkthrough - Davis fence', time: 'Dec 10, 3:00 PM', priority: 'medium' },
  { task: 'Estimate review - New client', time: 'Dec 12, 11:00 AM', priority: 'low' },
];

export default function DashboardScreen() {
  const router = useRouter();

  const getStatColor = (color: string) => {
    switch (color) {
      case 'primary': return colors.primary[500];
      case 'accent': return colors.accent[500];
      case 'success': return colors.success[500];
      default: return colors.primary[500];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return colors.primary[500];
      case 'planning': return colors.accent[500];
      case 'review': return colors.success[500];
      default: return colors.neutral[500];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.danger[500];
      case 'medium': return colors.warning[500];
      case 'low': return colors.success[500];
      default: return colors.neutral[500];
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      overScrollMode="always"
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back! 👋</Text>
          <Text style={styles.subtitle}>Here's what's happening with your projects today.</Text>
        </View>
        <Pressable
          style={styles.newEstimateBtn}
          onPress={() => router.push('/estimate')}
        >
          <Text style={styles.newEstimateBtnText}>📝 New Estimate</Text>
        </Pressable>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { borderLeftColor: getStatColor(stat.color) }]}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={[styles.statTrend, { color: colors.success[500] }]}>{stat.trend}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Jobs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Jobs</Text>
          <Pressable onPress={() => router.push('/jobs')}>
            <Text style={styles.viewAllLink}>View All →</Text>
          </Pressable>
        </View>
        <View style={styles.jobsList}>
          {recentJobs.map((job) => (
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
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${job.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{job.progress}%</Text>
              </View>
              <Text style={styles.jobDate}>Started: {job.date}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Upcoming Tasks Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
          <Text style={styles.viewAllLink}>View Calendar →</Text>
        </View>
        <View style={styles.tasksList}>
          {upcomingTasks.map((item, index) => (
            <View key={index} style={styles.taskItem}>
              <View style={[styles.taskPriority, { backgroundColor: getPriorityColor(item.priority) }]} />
              <View style={styles.taskContent}>
                <Text style={styles.taskName}>{item.task}</Text>
                <Text style={styles.taskTime}>{item.time}</Text>
              </View>
              <Pressable style={styles.checkBtn}>
                <Text style={styles.checkBtnText}>✓</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* AI Banner */}
        <View style={styles.aiBanner}>
          <Text style={styles.aiIcon}>🤖</Text>
          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>AI Estimation Ready</Text>
            <Text style={styles.aiSubtitle}>Powered by Gemini 3 Pro</Text>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  welcomeText: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    maxWidth: 200,
  },
  newEstimateBtn: {
    backgroundColor: colors.accent[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  newEstimateBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '48%',
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.xs,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: darkTheme.colors.text,
  },
  statTrend: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: darkTheme.colors.text,
  },
  viewAllLink: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: '500',
  },
  jobsList: {
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
    marginBottom: spacing.md,
  },
  jobClient: {
    fontSize: fontSize.md,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
    fontWeight: '600',
    width: 35,
    textAlign: 'right',
  },
  jobDate: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
  },
  tasksList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  taskPriority: {
    width: 4,
    height: 40,
    borderRadius: borderRadius.full,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  taskTime: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: darkTheme.colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnText: {
    color: darkTheme.colors.textMuted,
    fontSize: fontSize.md,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[900],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[700],
    gap: spacing.md,
  },
  aiIcon: {
    fontSize: 32,
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  aiSubtitle: {
    fontSize: fontSize.sm,
    color: colors.primary[300],
  },
});
