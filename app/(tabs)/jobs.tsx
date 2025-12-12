import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { JobRow, listJobsAsync } from '@/data/repos/jobsRepo';
import { formatCurrency } from '@/utils/formatters';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const STATUS_FILTERS = ['All', 'Planning', 'In Progress', 'Review', 'Completed'] as const;
const SORT_OPTIONS = [
  { label: 'Recent', value: 'recent' },
  { label: 'Progress', value: 'progress' },
  { label: 'Budget', value: 'budget' },
] as const;

export default function JobsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return colors.primary[500];
      case 'planning': return colors.accent[500];
      case 'review': return colors.success[500];
      case 'completed': return colors.success[600];
      default: return colors.neutral[500];
    }
  };

  const refreshJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const rows = await listJobsAsync();
      setJobs(rows);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshJobs();
    }, [refreshJobs])
  );

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let result = statusFilter === 'All'
      ? jobs
      : jobs.filter(job => job.status === statusFilter);

    // Sort jobs
    switch (sortBy) {
      case 'progress':
        result = [...result].sort((a, b) => b.progress - a.progress);
        break;
      case 'budget':
        result = [...result].sort((a, b) => b.budgetCents - a.budgetCents);
        break;
      case 'recent':
      default:
        result = [...result].sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        break;
    }

    return result;
  }, [statusFilter, sortBy]);

  const handlePhotos = (jobId: number) => {
    router.push(`/jobs/${jobId}/photos`);
  };

  const handleDetails = (jobId: number) => {
    router.push(`/jobs/${jobId}`);
  };

  const handleUpdate = (jobId: number) => {
    router.push(`/jobs/${jobId}/edit`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        overScrollMode="always"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Active Jobs</Text>
            <Text style={styles.headerSubtitle}>{filteredJobs.length} projects</Text>
          </View>
          <Pressable style={styles.newJobBtn} onPress={() => router.push('/jobs/new')}>
            <Text style={styles.newJobBtnText}>＋ New</Text>
          </Pressable>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {STATUS_FILTERS.map((filter) => (
              <Pressable
                key={filter}
                style={[
                  styles.filterPill,
                  statusFilter === filter && styles.filterPillActive
                ]}
                onPress={() => setStatusFilter(filter)}
              >
                <Text style={[
                  styles.filterPillText,
                  statusFilter === filter && styles.filterPillTextActive
                ]}>
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Sort Button */}
          <View style={styles.sortContainer}>
            <Pressable
              style={styles.sortButton}
              onPress={() => setShowSortMenu(!showSortMenu)}
            >
              <Text style={styles.sortButtonText}>Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}</Text>
              <Text style={styles.sortIcon}>{showSortMenu ? '▲' : '▼'}</Text>
            </Pressable>

            {showSortMenu && (
              <View style={styles.sortMenu}>
                {SORT_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.sortMenuItem,
                      sortBy === option.value && styles.sortMenuItemActive
                    ]}
                    onPress={() => {
                      setSortBy(option.value);
                      setShowSortMenu(false);
                    }}
                  >
                    <Text style={[
                      styles.sortMenuItemText,
                      sortBy === option.value && styles.sortMenuItemTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Jobs Grid */}
        <View style={styles.jobsGrid}>
          {filteredJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={styles.jobHeaderInfo}>
                  <Text style={styles.jobClient}>{job.clientName}</Text>
                  <Text style={styles.jobType}>{job.projectType}</Text>
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
                  <Text style={styles.detailValue}>{formatCurrency(job.budgetCents / 100)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Started</Text>
                  <Text style={styles.detailValue}>{job.startDate}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.jobActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handlePhotos(job.id)}
                >
                  <Text style={styles.actionBtnIcon}>📷</Text>
                  <Text style={styles.actionBtnText}>Photos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDetails(job.id)}
                >
                  <Text style={styles.actionBtnIcon}>📋</Text>
                  <Text style={styles.actionBtnText}>Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryActionBtn]}
                  onPress={() => handleUpdate(job.id)}
                >
                  <Text style={styles.actionBtnIcon}>✏️</Text>
                  <Text style={[styles.actionBtnText, styles.primaryActionBtnText]}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {filteredJobs.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📂</Text>
            <Text style={styles.emptyStateText}>{isLoading ? 'Loading jobs…' : 'No jobs found'}</Text>
            <Text style={styles.emptyStateSubtext}>{isLoading ? 'Fetching local data' : 'Create a job to get started'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  newJobBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
    ...shadows.sm,
  },
  newJobBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.white,
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
  filterSection: {
    marginBottom: spacing.lg,
  },
  filterContent: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: darkTheme.colors.card,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primary[500],
  },
  filterPillText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: darkTheme.colors.textMuted,
  },
  filterPillTextActive: {
    color: colors.white,
  },
  sortContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  sortButtonText: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.text,
  },
  sortIcon: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: spacing.xs,
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.md,
    ...shadows.md,
    zIndex: 10,
    minWidth: 120,
  },
  sortMenuItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sortMenuItemActive: {
    backgroundColor: colors.primary[500] + '20',
  },
  sortMenuItemText: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.text,
  },
  sortMenuItemTextActive: {
    color: colors.primary[500],
    fontWeight: '600',
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
  jobHeaderInfo: {
    flex: 1,
    marginRight: spacing.md,
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
    marginBottom: spacing.lg,
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
  jobActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.border,
    paddingTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary[500],
  },
  actionBtnIcon: {
    fontSize: fontSize.sm,
  },
  actionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: darkTheme.colors.text,
  },
  primaryActionBtnText: {
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
});