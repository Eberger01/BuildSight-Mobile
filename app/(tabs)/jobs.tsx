import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows, darkTheme } from '@/constants/theme';
import { JobStatus } from '@/types';

interface Job {
  id: number;
  client: string;
  type: string;
  status: JobStatus;
  progress: number;
  budget: string;
  startDate: string;
}

const activeJobs: Job[] = [
  { id: 1, client: 'John Smith', type: 'Kitchen Remodel', status: 'In Progress', progress: 65, budget: '€28,500', startDate: '2025-12-01' },
  { id: 2, client: 'Sarah Johnson', type: 'Bathroom Upgrade', status: 'Planning', progress: 25, budget: '€15,200', startDate: '2025-12-03' },
  { id: 3, client: 'Mike Davis', type: 'Fence Installation', status: 'In Progress', progress: 80, budget: '€8,900', startDate: '2025-11-28' },
  { id: 4, client: 'Emily Brown', type: 'Home Improvement', status: 'Review', progress: 95, budget: '€42,000', startDate: '2025-11-25' },
  { id: 5, client: 'Robert Wilson', type: 'Deck Construction', status: 'In Progress', progress: 40, budget: '€12,500', startDate: '2025-12-05' },
  { id: 6, client: 'Lisa Anderson', type: 'Painting', status: 'Planning', progress: 10, budget: '€5,200', startDate: '2025-12-08' },
];

const STATUS_FILTERS = ['All', 'Planning', 'In Progress', 'Review', 'Completed'] as const;
const SORT_OPTIONS = [
  { label: 'Recent', value: 'recent' },
  { label: 'Progress', value: 'progress' },
  { label: 'Budget', value: 'budget' },
] as const;

export default function JobsScreen() {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in progress': return colors.primary[500];
      case 'planning': return colors.accent[500];
      case 'review': return colors.success[500];
      case 'completed': return colors.success[600];
      default: return colors.neutral[500];
    }
  };

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let result = statusFilter === 'All'
      ? activeJobs
      : activeJobs.filter(job => job.status === statusFilter);

    // Sort jobs
    switch (sortBy) {
      case 'progress':
        result = [...result].sort((a, b) => b.progress - a.progress);
        break;
      case 'budget':
        result = [...result].sort((a, b) => {
          const aNum = parseInt(a.budget.replace(/[^0-9]/g, ''));
          const bNum = parseInt(b.budget.replace(/[^0-9]/g, ''));
          return bNum - aNum;
        });
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
    console.log('View photos for job:', jobId);
    // TODO: Navigate to job photos
  };

  const handleDetails = (jobId: number) => {
    console.log('View details for job:', jobId);
    // TODO: Navigate to job details
  };

  const handleUpdate = (jobId: number) => {
    console.log('Update job:', jobId);
    // TODO: Open update modal/screen
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
            <Text style={styles.emptyStateText}>No jobs found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
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