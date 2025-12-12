import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { JobRow } from '@/data/repos/jobsRepo';

type Props = {
  visible: boolean;
  jobs: JobRow[];
  onClose: () => void;
  onAssignToJobId: (jobId: number | null) => void;
  onCreateJob: () => void;
};

export function AssignEstimateModal(props: Props) {
  const { visible, jobs, onClose, onAssignToJobId, onCreateJob } = props;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.content}>
          <Text style={styles.title}>Assign estimate to…</Text>

          <Pressable style={styles.option} onPress={() => onAssignToJobId(null)}>
            <Text style={styles.optionText}>Unassigned</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={[styles.option, styles.optionPrimary]} onPress={onCreateJob}>
            <Text style={[styles.optionText, styles.optionTextPrimary]}>＋ Create new job</Text>
            <Text style={[styles.chevron, styles.optionTextPrimary]}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {jobs.map((j) => (
              <Pressable key={j.id} style={styles.option} onPress={() => onAssignToJobId(j.id)}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionText}>{j.clientName}</Text>
                  <Text style={styles.optionSub}>{j.projectType}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}

            {jobs.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No jobs yet. Create one to attach this estimate.</Text>
              </View>
            ) : null}
          </ScrollView>

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 380,
    ...shadows.lg,
    overflow: 'hidden',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: darkTheme.colors.text,
    textAlign: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  divider: { height: 1, backgroundColor: darkTheme.colors.border },
  list: { maxHeight: 320 },
  listContent: { paddingBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  optionPrimary: {
    backgroundColor: colors.primary[500],
    borderBottomColor: colors.primary[500],
  },
  optionInfo: { flex: 1, marginRight: spacing.md },
  optionText: { fontSize: fontSize.md, fontWeight: '700', color: darkTheme.colors.text },
  optionTextPrimary: { color: colors.white },
  optionSub: { marginTop: 2, fontSize: fontSize.sm, color: darkTheme.colors.textMuted },
  chevron: { fontSize: fontSize['2xl'], color: darkTheme.colors.textMuted, fontWeight: '300' },
  empty: { padding: spacing.lg },
  emptyText: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted, textAlign: 'center' },
  cancel: { padding: spacing.lg, backgroundColor: darkTheme.colors.card },
  cancelText: { fontSize: fontSize.md, color: darkTheme.colors.textMuted, textAlign: 'center', fontWeight: '700' },
});


