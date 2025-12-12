import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { createJobAsync, JobStatus } from '@/data/repos/jobsRepo';

export default function NewJobScreen() {
  const router = useRouter();

  const [clientName, setClientName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [status, setStatus] = useState<JobStatus>('Planning');
  const [progress, setProgress] = useState('0');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!clientName.trim() || !projectType.trim()) {
      Alert.alert('Missing info', 'Client name and project type are required.');
      return;
    }

    const progressNum = Math.max(0, Math.min(100, Number(progress || 0)));
    const budgetCents = Math.max(0, Math.round(Number(budget || 0) * 100));

    try {
      setIsSaving(true);
      const id = await createJobAsync({
        clientName: clientName.trim(),
        projectType: projectType.trim(),
        status,
        progress: progressNum,
        budgetCents,
        startDate,
        notes: notes.trim(),
      });
      router.replace(`/jobs/${id}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create job.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusOptions: JobStatus[] = ['Planning', 'In Progress', 'Review', 'Completed'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>New Job</Text>
        <Text style={styles.subtitle}>Create a job stored locally on this device.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Client Name *</Text>
          <TextInput
            style={styles.input}
            value={clientName}
            onChangeText={setClientName}
            placeholder="John Smith"
            placeholderTextColor={colors.neutral[500]}
            editable={!isSaving}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Project Type *</Text>
          <TextInput
            style={styles.input}
            value={projectType}
            onChangeText={setProjectType}
            placeholder="Kitchen Remodel"
            placeholderTextColor={colors.neutral[500]}
            editable={!isSaving}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Start Date</Text>
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
            <Text style={styles.label}>Budget (EUR)</Text>
            <TextInput
              style={styles.input}
              value={budget}
              onChangeText={setBudget}
              placeholder="28500"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="numeric"
              editable={!isSaving}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.half]}>
            <Text style={styles.label}>Progress (0-100)</Text>
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
            <Text style={styles.label}>Status</Text>
            <View style={styles.pills}>
              {statusOptions.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.pill, status === s && styles.pillActive]}
                  onPress={() => setStatus(s)}
                  disabled={isSaving}
                >
                  <Text style={[styles.pillText, status === s && styles.pillTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes…"
            placeholderTextColor={colors.neutral[500]}
            multiline
            editable={!isSaving}
          />
        </View>

        <Pressable style={[styles.primaryBtn, isSaving && styles.primaryBtnDisabled]} onPress={save} disabled={isSaving}>
          <Text style={styles.primaryBtnText}>{isSaving ? 'Saving…' : 'Create Job'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkTheme.colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
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
  pillText: { fontSize: fontSize.xs, fontWeight: '600', color: darkTheme.colors.textMuted },
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


