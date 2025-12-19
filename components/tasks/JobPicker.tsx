import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, borderRadius, fontSize, spacing, shadows } from '../../constants/theme';
import { listJobsAsync, JobRow } from '../../data/repos/jobsRepo';

interface JobPickerProps {
  value: number | null;
  onChange: (jobId: number | null) => void;
  disabled?: boolean;
}

export function JobPicker({ value, onChange, disabled }: JobPickerProps) {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (value && jobs.length > 0) {
      const job = jobs.find((j) => j.id === value);
      setSelectedJob(job ?? null);
    } else {
      setSelectedJob(null);
    }
  }, [value, jobs]);

  const loadJobs = async () => {
    try {
      const data = await listJobsAsync();
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const handleSelect = (job: JobRow | null) => {
    onChange(job?.id ?? null);
    setModalVisible(false);
  };

  return (
    <>
      <Pressable
        style={[styles.picker, disabled && styles.disabled]}
        onPress={() => !disabled && setModalVisible(true)}
      >
        <View style={styles.pickerContent}>
          {selectedJob ? (
            <>
              <FontAwesome name="briefcase" size={16} color={colors.primary[500]} />
              <View style={styles.jobInfo}>
                <Text style={styles.jobName} numberOfLines={1}>
                  {selectedJob.projectType}
                </Text>
                <Text style={styles.jobClient} numberOfLines={1}>
                  {selectedJob.clientName}
                </Text>
              </View>
            </>
          ) : (
            <>
              <FontAwesome name="link" size={16} color={colors.neutral[500]} />
              <Text style={styles.placeholder}>Link to Job (optional)</Text>
            </>
          )}
        </View>
        <FontAwesome
          name="chevron-down"
          size={12}
          color={colors.neutral[500]}
        />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Job</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={20} color={colors.neutral[400]} />
              </Pressable>
            </View>

            <ScrollView style={styles.jobList}>
              {/* No Job option */}
              <Pressable
                style={[
                  styles.jobItem,
                  value === null && styles.jobItemSelected,
                ]}
                onPress={() => handleSelect(null)}
              >
                <View style={styles.jobItemIcon}>
                  <FontAwesome name="times-circle" size={20} color={colors.neutral[500]} />
                </View>
                <View style={styles.jobItemContent}>
                  <Text style={styles.jobItemName}>No Job Linked</Text>
                  <Text style={styles.jobItemDetail}>Task will be standalone</Text>
                </View>
                {value === null && (
                  <FontAwesome name="check" size={16} color={colors.primary[500]} />
                )}
              </Pressable>

              {/* Job options */}
              {jobs.map((job) => (
                <Pressable
                  key={job.id}
                  style={[
                    styles.jobItem,
                    value === job.id && styles.jobItemSelected,
                  ]}
                  onPress={() => handleSelect(job)}
                >
                  <View style={[styles.jobItemIcon, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                    <FontAwesome
                      name="briefcase"
                      size={16}
                      color={getStatusColor(job.status)}
                    />
                  </View>
                  <View style={styles.jobItemContent}>
                    <Text style={styles.jobItemName}>{job.projectType}</Text>
                    <Text style={styles.jobItemDetail}>
                      {job.clientName} - {job.status}
                    </Text>
                  </View>
                  {value === job.id && (
                    <FontAwesome name="check" size={16} color={colors.primary[500]} />
                  )}
                </Pressable>
              ))}

              {jobs.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No jobs available</Text>
                  <Text style={styles.emptySubtext}>Create a job first to link tasks</Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Completed':
      return colors.success[500];
    case 'In Progress':
      return colors.primary[500];
    case 'Review':
      return colors.warning[500];
    case 'Planning':
    default:
      return colors.neutral[500];
  }
}

const styles = StyleSheet.create({
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark.bgTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.dark.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  pickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  jobInfo: {
    flex: 1,
  },
  jobName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.dark.textPrimary,
  },
  jobClient: {
    fontSize: fontSize.xs,
    color: colors.dark.textSecondary,
  },
  placeholder: {
    fontSize: fontSize.md,
    color: colors.neutral[500],
  },
  disabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.dark.textPrimary,
  },
  jobList: {
    padding: spacing.md,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  jobItemSelected: {
    backgroundColor: colors.primary[500] + '15',
  },
  jobItemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobItemContent: {
    flex: 1,
  },
  jobItemName: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.dark.textPrimary,
  },
  jobItemDetail: {
    fontSize: fontSize.sm,
    color: colors.dark.textSecondary,
  },
  emptyState: {
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.dark.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.dark.textSecondary,
  },
});
