import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { getJobByIdAsync, JobRow, JobStatus, updateJobAsync } from '@/data/repos/jobsRepo';

export default function EditJobScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const jobId = Number(params.jobId || 0);

  const [job, setJob] = useState<JobRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [status, setStatus] = useState<JobStatus>('Planning');
  const [progress, setProgress] = useState('0');
  const [budget, setBudget] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!jobId) return;
    const j = await getJobByIdAsync(jobId);
    setJob(j);
    if (!j) return;
    setClientName(j.clientName);
    setProjectType(j.projectType);
    setStatus(j.status);
    setProgress(String(j.progress));
    setBudget(String((j.budgetCents / 100).toFixed(0)));
    setStartDate(j.startDate);
    setNotes(j.notes);
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const save = async () => {
    if (!jobId) return;
    if (!clientName.trim() || !projectType.trim()) {
      Alert.alert(t('jobs.missingInfo'), t('jobs.clientAndTypeRequired'));
      return;
    }

    const progressNum = Math.max(0, Math.min(100, Number(progress || 0)));
    const budgetCents = Math.max(0, Math.round(Number(budget || 0) * 100));

    try {
      setIsSaving(true);
      await updateJobAsync(jobId, {
        clientName: clientName.trim(),
        projectType: projectType.trim(),
        status,
        progress: progressNum,
        budgetCents,
        startDate: startDate || new Date().toISOString().slice(0, 10),
        notes: notes.trim(),
      });
      router.back();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('errors.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: JobStatus[] = ['Planning', 'In Progress', 'Review', 'Completed'];

  const getStatusLabel = (status: JobStatus) => {
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
        <Text style={styles.muted}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('jobs.updateJob')}</Text>
        <Text style={styles.subtitle}>{t('jobs.editJobSubtitle')}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('jobs.clientNameRequired')}</Text>
          <TextInput
            style={styles.input}
            value={clientName}
            onChangeText={setClientName}
            placeholderTextColor={colors.neutral[500]}
            editable={!isSaving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('jobs.projectTypeRequired')}</Text>
          <TextInput
            style={styles.input}
            value={projectType}
            onChangeText={setProjectType}
            placeholderTextColor={colors.neutral[500]}
            editable={!isSaving}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>{t('jobs.startDate')}</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.neutral[500]}
              editable={!isSaving}
            />
          </View>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>{t('jobs.budgetLabel')}</Text>
            <TextInput
              style={styles.input}
              value={budget}
              onChangeText={setBudget}
              placeholder="0"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="numeric"
              editable={!isSaving}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>{t('jobs.progressLabel')}</Text>
            <TextInput
              style={styles.input}
              value={progress}
              onChangeText={setProgress}
              placeholder="0"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="numeric"
              editable={!isSaving}
            />
          </View>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>{t('jobs.status')}</Text>
            <View style={styles.pills}>
              {statusOptions.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.pill, status === s && styles.pillActive]}
                  onPress={() => setStatus(s)}
                  disabled={isSaving}
                >
                  <Text style={[styles.pillText, status === s && styles.pillTextActive]}>{getStatusLabel(s)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('jobs.notes')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('jobs.notesPlaceholder')}
            placeholderTextColor={colors.neutral[500]}
            multiline
            editable={!isSaving}
          />
        </View>

        <Pressable style={[styles.primaryBtn, isSaving && styles.primaryBtnDisabled]} onPress={save} disabled={isSaving}>
          <Text style={styles.primaryBtnText}>{isSaving ? t('jobs.saving') : t('jobs.saveChanges')}</Text>
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
  card: { backgroundColor: darkTheme.colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.sm },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: darkTheme.colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted, marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: darkTheme.colors.textMuted, marginBottom: spacing.xs },
  input: {
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: darkTheme.colors.text,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: darkTheme.colors.cardElevated,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  pillActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  pillText: { fontSize: fontSize.xs, fontWeight: '700', color: darkTheme.colors.textMuted },
  pillTextActive: { color: colors.white },
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: '700' },
});


