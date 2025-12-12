import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { listEstimatesByJobIdAsync } from '@/data/repos/estimatesRepo';
import { getJobByIdAsync, JobRow } from '@/data/repos/jobsRepo';
import { listPhotosByJobIdAsync } from '@/data/repos/photosRepo';
import { formatCurrency } from '@/utils/formatters';

export default function JobDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const jobId = Number(params.jobId || 0);

  const [job, setJob] = useState<JobRow | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [estimateCount, setEstimateCount] = useState(0);

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

  if (!jobId) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>Invalid job id.</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>Loading job…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.client}>{job.clientName}</Text>
        <Text style={styles.type}>{job.projectType}</Text>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.badgeMuted]}>
            <Text style={styles.badgeText}>{job.status}</Text>
          </View>
          <View style={[styles.badge, styles.badgeMuted]}>
            <Text style={styles.badgeText}>{job.progress}% progress</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Budget</Text>
          <Text style={styles.statValue}>{formatCurrency(job.budgetCents / 100)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Start</Text>
          <Text style={styles.statValue}>{job.startDate}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Photos</Text>
          <Text style={styles.statValue}>{photoCount}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Estimates</Text>
          <Text style={styles.statValue}>{estimateCount}</Text>
        </View>
      </View>

      {job.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{job.notes}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => router.push(`/jobs/${jobId}/photos`)}>
          <Text style={styles.actionBtnText}>📷 Photos</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => router.push(`/jobs/${jobId}/edit`)}>
          <Text style={styles.actionBtnText}>✏️ Update</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.primaryBtn]} onPress={() => router.push('/estimate')}>
          <Text style={[styles.actionBtnText, styles.primaryBtnText]}>🧮 New Estimate</Text>
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


