import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, darkTheme, fontSize, fontWeight, shadows, spacing } from '@/constants/theme';
import { PROJECT_TYPES, TIMELINE_OPTIONS, Photo, ProjectData } from '@/types';

type Props = {
  formData: ProjectData;
  photos: Photo[];
  isLoading: boolean;
  error: string | null;
  onChange: (name: keyof ProjectData, value: string) => void;
  onRemovePhoto: (photoId: string) => void;
  onTakePhoto: () => void;
  onPickImages: () => void;
  onSubmit: () => void;
  onSaveDraft?: () => void;
  onClearForm?: () => void;
};

export function EstimateForm(props: Props) {
  const { formData, photos, isLoading, error, onChange, onRemovePhoto, onTakePhoto, onPickImages, onSubmit, onSaveDraft, onClearForm } = props;
  const [showProjectTypes, setShowProjectTypes] = useState(false);
  const [showTimelines, setShowTimelines] = useState(false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        overScrollMode="always"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>New Project Estimate</Text>
            <Text style={styles.subtitle}>Fill in the details to generate an AI-powered estimate</Text>
          </View>
          <View style={styles.headerRight}>
            {onClearForm && (
              <TouchableOpacity style={styles.clearButton} onPress={onClearForm} disabled={isLoading}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Client Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.clientName}
              onChangeText={(value) => onChange('clientName', value)}
              placeholder="John Smith"
              placeholderTextColor={colors.neutral[500]}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => onChange('email', value)}
              placeholder="john@example.com"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => onChange('phone', value)}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Type *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowProjectTypes(!showProjectTypes)}
              disabled={isLoading}
            >
              <Text style={formData.projectType ? styles.dropdownText : styles.dropdownPlaceholder}>
                {formData.projectType || 'Select project type...'}
              </Text>
              <Text style={styles.dropdownArrow}>{showProjectTypes ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showProjectTypes && (
              <View style={styles.dropdownList}>
                {PROJECT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.dropdownItem}
                    onPress={() => {
                      onChange('projectType', type);
                      setShowProjectTypes(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Square Footage</Text>
              <TextInput
                style={styles.input}
                value={formData.squareFootage}
                onChangeText={(value) => onChange('squareFootage', value)}
                placeholder="500"
                placeholderTextColor={colors.neutral[500]}
                keyboardType="numeric"
                editable={!isLoading}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Timeline</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowTimelines(!showTimelines)}
                disabled={isLoading}
              >
                <Text style={formData.timeline ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {TIMELINE_OPTIONS.find((t) => t.value === formData.timeline)?.label || 'Select...'}
                </Text>
                <Text style={styles.dropdownArrow}>{showTimelines ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showTimelines && (
                <View style={styles.dropdownList}>
                  {TIMELINE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        onChange('timeline', option.value);
                        setShowTimelines(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => onChange('description', value)}
              placeholder="Describe the project in detail..."
              placeholderTextColor={colors.neutral[500]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.photoHeader}>
            <Text style={styles.sectionTitle}>Project Photos</Text>
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.photoRemove} onPress={() => onRemovePhoto(photo.id)}>
                    <Text style={styles.photoRemoveText}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoButton} onPress={onTakePhoto} disabled={isLoading}>
              <Text style={styles.photoButtonIcon}>📷</Text>
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={onPickImages} disabled={isLoading}>
              <Text style={styles.photoButtonIcon}>🖼️</Text>
              <Text style={styles.photoButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.actions}>
          {onSaveDraft && (
            <TouchableOpacity
              style={[styles.saveDraftButton, isLoading && styles.submitButtonDisabled]}
              onPress={onSaveDraft}
              disabled={isLoading}
            >
              <Text style={styles.saveDraftButtonText}>Save Draft</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={onSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.submitButtonText}>Generating Estimate...</Text>
              </>
            ) : (
              <Text style={styles.submitButtonText}>Generate AI Estimate</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Estimation Tips</Text>
          <Text style={styles.tipItem}>- Provide detailed project descriptions for accuracy</Text>
          <Text style={styles.tipItem}>- Include square footage when applicable</Text>
          <Text style={styles.tipItem}>- Photos help improve estimate accuracy</Text>
          <Text style={styles.tipItem}>- Mention specific materials or preferences</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkTheme.colors.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing['5xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: darkTheme.colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted },
  clearButton: {
    backgroundColor: darkTheme.colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  clearButtonText: { color: darkTheme.colors.textMuted, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  aiBadge: {
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[500] + '40',
  },
  aiBadgeText: { color: colors.primary[400], fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  section: { backgroundColor: darkTheme.colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: darkTheme.colors.text, marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: darkTheme.colors.textMuted, marginBottom: spacing.xs },
  input: {
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: darkTheme.colors.text,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  halfWidth: { flex: 1 },
  dropdown: {
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: { fontSize: fontSize.md, color: darkTheme.colors.text },
  dropdownPlaceholder: { fontSize: fontSize.md, color: colors.neutral[500] },
  dropdownArrow: { fontSize: fontSize.xs, color: darkTheme.colors.textMuted },
  dropdownList: {
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    maxHeight: 200,
  },
  dropdownItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: darkTheme.colors.border },
  dropdownItemText: { fontSize: fontSize.md, color: darkTheme.colors.text },
  photoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  photoBadge: { backgroundColor: colors.primary[500] + '20', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  photoBadgeText: { color: colors.primary[400], fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  photoItem: { width: 80, height: 80, borderRadius: borderRadius.md, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.danger[500],
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: { color: colors.white, fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  photoActions: { flexDirection: 'row', gap: spacing.md },
  photoButton: {
    flex: 1,
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    borderStyle: 'dashed',
  },
  photoButtonIcon: { fontSize: fontSize['2xl'], marginBottom: spacing.xs },
  photoButtonText: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted },
  errorContainer: {
    backgroundColor: colors.danger[500] + '20',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.danger[500] + '40',
  },
  errorIcon: { fontSize: fontSize.lg, marginRight: spacing.sm },
  errorText: { flex: 1, color: colors.danger[400], fontSize: fontSize.sm },
  actions: { marginBottom: spacing.xl, gap: spacing.md },
  saveDraftButton: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  saveDraftButtonText: { color: darkTheme.colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  submitButton: {
    backgroundColor: colors.accent[500],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.lg,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: colors.white, fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  tipsCard: { backgroundColor: darkTheme.colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, ...shadows.sm },
  tipsTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: darkTheme.colors.text, marginBottom: spacing.md },
  tipItem: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted, marginBottom: spacing.xs, lineHeight: 20 },
});


