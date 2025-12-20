import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { listEstimatesByJobIdAsync } from '@/data/repos/estimatesRepo';
import { deleteJobAsync, getJobByIdAsync, JobRow } from '@/data/repos/jobsRepo';
import { listPhotosByJobIdAsync } from '@/data/repos/photosRepo';
import { formatCurrency } from '@/utils/formatters';

export default function JobDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const jobId = Number(params.jobId || 0);

  const [job, setJob] = useState<JobRow | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [estimateCount, setEstimateCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      t('jobs.deleteJob'),
      t('jobs.deleteConfirm', { name: job?.clientName || 'this job' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteJobAsync(jobId);
              router.replace('/jobs');
            } catch (e) {
              Alert.alert(t('common.error'), e instanceof Error ? e.message : t('errors.deleteFailed'));
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const load = useCallback(async () => {
    if (!jobId) return;
    const j = await getJobByIdAsync(jobId);
    setJob(j);
    if (j) {
      const photos = await listPhotosByJobIdAsync(jobId);
      const estimates = await listEstimatesByJobIdAsync(jobId);
      setPhotoCount(photos.length);
      setEstimateCount(estimates.length);
    }
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Planning': return t('status.planning');
      case 'In Progress': return t('status.inProgress');
      case 'Review': return t('status.review');
      case 'Completed': return t('status.completed');
      default: return status;
    }
  };

  if (!jobId) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>{t('jobs.invalidJobId')}</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>{t('jobs.loadingJob')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <Text style={styles.client}>{job.clientName}</Text>
            <Text style={styles.type}>{job.projectType}</Text>
          </View>
          <Pressable
            style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </Pressable>
        </View>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.badgeMuted]}>
            <Text style={styles.badgeText}>{getStatusLabel(job.status)}</Text>
          </View>
          <View style={[styles.badge, styles.badgeMuted]}>
            <Text style={styles.badgeText}>{job.progress}% {t('jobs.progress').toLowerCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('jobs.budget')}</Text>
          <Text style={styles.statValue}>{formatCurrency(job.budgetCents / 100)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('jobs.start')}</Text>
          <Text style={styles.statValue}>{job.startDate}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('jobs.photos')}</Text>
          <Text style={styles.statValue}>{photoCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('jobs.estimates')}</Text>
          <Text style={styles.statValue}>{estimateCount}</Text>
        </View>
      </View>

      {job.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>{t('jobs.notes')}</Text>
          <Text style={styles.notesText}>{job.notes}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => router.push(`/jobs/${jobId}/photos`)}>
          <Text style={styles.actionBtnText}>📷 {t('jobs.photos')}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => router.push(`/jobs/${jobId}/edit`)}>
          <Text style={styles.actionBtnText}>✏️ {t('jobs.updateJob')}</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.primaryBtn]} onPress={() => router.push('/estimate')}>
          <Text style={[styles.actionBtnText, styles.primaryBtnText]}>🧮 {t('jobs.newEstimate')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkTheme.colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: darkTheme.colors.textMuted, fontSize: fontSize.md },
  headerCard: { backgroundColor: darkTheme.colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerInfo: { flex: 1 },
  deleteBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.danger[500] + '20',
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { fontSize: fontSize.lg },
  client: { fontSize: fontSize['2xl'], fontWeight: '700', color: darkTheme.colors.text, marginBottom: spacing.xs },
  type: { fontSize: fontSize.md, color: darkTheme.colors.textMuted, marginBottom: spacing.md },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  badge: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  badgeMuted: { backgroundColor: darkTheme.colors.cardElevated, borderWidth: 1, borderColor: darkTheme.colors.border },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700', color: darkTheme.colors.text },
  grid: { marginTop: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: {
    width: '48%',
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  statLabel: { fontSize: fontSize.xs, color: darkTheme.colors.textMuted, marginBottom: spacing.xs },
  statValue: { fontSize: fontSize.lg, fontWeight: '700', color: darkTheme.colors.text },
  notesCard: { marginTop: spacing.lg, backgroundColor: darkTheme.colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: darkTheme.colors.text, marginBottom: spacing.sm },
  notesText: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted, lineHeight: 20 },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  actionBtn: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  actionBtnText: { fontSize: fontSize.md, fontWeight: '700', color: darkTheme.colors.text, textAlign: 'center' },
  primaryBtn: { backgroundColor: colors.primary[500] },
  primaryBtnText: { color: colors.white },
});