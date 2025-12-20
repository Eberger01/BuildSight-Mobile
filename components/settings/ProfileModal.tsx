import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { ProfileData } from '@/data/profile';

type Props = {
  visible: boolean;
  profile: ProfileData;
  onClose: () => void;
  onSave: (profile: ProfileData) => void;
};

export function ProfileModal(props: Props) {
  const { t } = useTranslation();
  const { visible, profile, onClose, onSave } = props;
  const [draft, setDraft] = useState<ProfileData>(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={() => undefined}>
          <Text style={styles.title}>{t('settings.profile')}</Text>

          <View style={styles.group}>
            <Text style={styles.label}>{t('profile.companyName')}</Text>
            <TextInput
              style={styles.input}
              value={draft.companyName}
              onChangeText={(v) => setDraft((p) => ({ ...p, companyName: v }))}
              placeholder={t('profile.companyNamePlaceholder')}
              placeholderTextColor={colors.neutral[500]}
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>{t('profile.contactEmail')}</Text>
            <TextInput
              style={styles.input}
              value={draft.contactEmail}
              onChangeText={(v) => setDraft((p) => ({ ...p, contactEmail: v }))}
              placeholder={t('profile.contactEmailPlaceholder')}
              placeholderTextColor={colors.neutral[500]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>{t('profile.contactPhone')}</Text>
            <TextInput
              style={styles.input}
              value={draft.contactPhone}
              onChangeText={(v) => setDraft((p) => ({ ...p, contactPhone: v }))}
              placeholder={t('profile.contactPhonePlaceholder')}
              placeholderTextColor={colors.neutral[500]}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.ghostBtn} onPress={onClose}>
              <Text style={styles.ghostText}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={() => onSave({ ...draft, companyName: draft.companyName.trim(), contactEmail: draft.contactEmail.trim(), contactPhone: draft.contactPhone.trim() })}>
              <Text style={styles.primaryText}>{t('common.save')}</Text>
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


