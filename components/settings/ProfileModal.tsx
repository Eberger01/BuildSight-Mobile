import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { ProfileData } from '@/data/profile';

type Props = {
  visible: boolean;
  profile: ProfileData;
  onClose: () => void;
  onSave: (profile: ProfileData) => void;
};

export function ProfileModal(props: Props) {
  const { visible, profile, onClose, onSave } = props;
  const [draft, setDraft] = useState<ProfileData>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => undefined}>
          <Text style={styles.title}>Profile</Text>

          <View style={styles.group}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={draft.companyName}
              onChangeText={(v) => setDraft((p) => ({ ...p, companyName: v }))}
              placeholder="BuildSight Construction"
              placeholderTextColor={colors.neutral[500]}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Contact Email</Text>
            <TextInput
              style={styles.input}
              value={draft.contactEmail}
              onChangeText={(v) => setDraft((p) => ({ ...p, contactEmail: v }))}
              placeholder="contact@company.com"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={draft.contactPhone}
              onChangeText={(v) => setDraft((p) => ({ ...p, contactPhone: v }))}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.ghostBtn} onPress={onClose}>
              <Text style={styles.ghostText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => onSave({ ...draft, companyName: draft.companyName.trim(), contactEmail: draft.contactEmail.trim(), contactPhone: draft.contactPhone.trim() })}>
              <Text style={styles.primaryText}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
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
    width: '100%',
    maxWidth: 360,
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: darkTheme.colors.text, marginBottom: spacing.md, textAlign: 'center' },
  group: { marginBottom: spacing.md },
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
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  ghostBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: darkTheme.colors.border, alignItems: 'center' },
  ghostText: { color: darkTheme.colors.textMuted, fontWeight: '700' },
  primaryBtn: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primary[500], alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '700' },
});


