import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { countEstimatesAsync } from '@/data/repos/estimatesRepo';
import { JobRow, listJobsAsync } from '@/data/repos/jobsRepo';
import { listTasksWithJobAsync, TaskWithJob, toggleTaskCompletedAsync } from '@/data/repos/tasksRepo';
import { loadSettingsAsync } from '@/data/settings';
import { formatCurrency } from '@/utils/formatters';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [tasks, setTasks] = useState<TaskWithJob[]>([]);
  const [estimatesCount, setEstimatesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('EUR');

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

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const [j, t, eCount, s] = await Promise.all([listJobsAsync(), listTasksWithJobAsync(8), countEstimatesAsync(), loadSettingsAsync()]);
      setJobs(j);
      setTasks(t);
      setEstimatesCount(eCount);
      setCurrency(s.currency);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((j) => j.status !== 'Completed').length;
    const completedThisMonth = jobs.filter((j) => {
      if (j.status !== 'Completed') return false;
      const d = new Date(j.updatedAt);
      const now = new Date();
      return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
    }).length;
    const totalRevenueCents = jobs.filter((j) => j.status === 'Completed').reduce((sum, j) => sum + (j.budgetCents || 0), 0);

    return [
      { label: t('dashboard.activeJobs'), value: String(activeJobs), icon: '🔨', trend: '', color: 'primary' },
      { label: t('dashboard.savedEstimates'), value: String(estimatesCount), icon: '📋', trend: '', color: 'accent' },
      { label: t('dashboard.completedThisMonth'), value: String(completedThisMonth), icon: '✅', trend: '', color: 'success' },
      { label: t('dashboard.totalRevenue'), value: formatCurrency(totalRevenueCents / 100, currency), icon: '💰', trend: '', color: 'success' },
    ] as const;
  }, [jobs, estimatesCount, currency, t]);

  const recentJobs = useMemo(() => jobs.slice(0, 4), [jobs]);

  const toggleTask = async (taskId: number) => {
    await toggleTaskCompletedAsync(taskId);
    await refresh();
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
          <Text style={styles.welcomeText}>{t('dashboard.welcome')}</Text>
          <Text style={styles.subtitle}>{t('dashboard.subtitle')}</Text>
        </View>
        <Pressable
          style={styles.newEstimateBtn}
          onPress={() => router.push('/estimate')}
        >
          <Text style={styles.newEstimateBtnText}>{t('dashboard.newEstimate')}</Text>
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
                {stat.trend ? <Text style={[styles.statTrend, { color: colors.success[500] }]}>{stat.trend}</Text> : null}
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Jobs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentJobs')}</Text>
          <Pressable onPress={() => router.push('/jobs')}>
            <Text style={styles.viewAllLink}>{t('common.viewAll')}</Text>
          </Pressable>
        </View>
        <View style={styles.jobsList}>
          {recentJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View>
                  <Text style={styles.jobClient}>{job.clientName}</Text>
                  <Text style={styles.jobType}>{job.projectType}</Text>
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
              <Text style={styles.jobDate}>{t('dashboard.started')}: {job.startDate}</Text>
            </View>
          ))}

          {recentJobs.length === 0 && (
            <View style={styles.jobCard}>
              <Text style={styles.jobClient}>{isLoading ? t('common.loading') : t('dashboard.noJobs')}</Text>
              <Text style={styles.jobType}>{isLoading ? t('dashboard.fetchingData') : t('dashboard.noJobsDesc')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Upcoming Tasks Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.upcomingTasks')}</Text>
          <Pressable onPress={() => router.push('/calendar')}>
            <Text style={styles.viewAllLink}>{t('dashboard.viewCalendar')}</Text>
          </Pressable>
        </View>
        <View style={styles.tasksList}>
          {tasks.map((item) => (
            <Pressable key={item.id} style={styles.taskItem} onPress={() => router.push(`/calendar/${item.id}`)}>
              <View style={[styles.taskPriority, { backgroundColor: getPriorityColor(item.priority) }]} />
              <View style={styles.taskContent}>
                <Text style={[styles.taskName, item.completed === 1 && styles.taskNameCompleted]}>{item.title}</Text>
                <Text style={styles.taskTime}>
                  {item.dueAt ? item.dueAt.slice(0, 10) : t('common.noDate')}
                  {item.jobClientName ? ` • ${item.jobClientName}` : ''}
                </Text>
              </View>
              <Pressable style={styles.checkBtn} onPress={(e) => { e.stopPropagation(); toggleTask(item.id); }}>
                <Text style={styles.checkBtnText}>{item.completed === 1 ? '↺' : '✓'}</Text>
              </Pressable>
            </Pressable>
          ))}

          {tasks.length === 0 && (
            <View style={styles.taskItem}>
              <View style={[styles.taskPriority, { backgroundColor: colors.neutral[500] }]} />
              <View style={styles.taskContent}>
                <Text style={styles.taskName}>{isLoading ? t('common.loading') : t('dashboard.noTasks')}</Text>
                <Text style={styles.taskTime}>{isLoading ? t('dashboard.fetchingData') : t('dashboard.noTasksDesc')}</Text>
              </View>
              <View style={styles.checkBtn}>
                <Text style={styles.checkBtnText}>•</Text>
              </View>
            </View>
          )}
        </View>

        {/* AI Banner */}
        <View style={styles.aiBanner}>
          <Text style={styles.aiIcon}>🤖</Text>
          <View style={styles.aiContent}>
            <Text style={styles.aiTitle}>{t('dashboard.aiReady')}</Text>
            <Text style={styles.aiSubtitle}>{t('dashboard.poweredBy')}</Text>
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
  taskNameCompleted: {
    textDecorationLine: 'line-through',
    color: darkTheme.colors.textMuted,
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
