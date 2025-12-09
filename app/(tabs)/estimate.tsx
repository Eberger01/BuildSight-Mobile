import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows, darkTheme } from '../../constants/theme';
import { generateEstimate } from '../../services/geminiService';
import { formatCurrency } from '../../utils/formatters';
import { PROJECT_TYPES, TIMELINE_OPTIONS, ProjectData, Estimate, Photo } from '../../types';

export default function EstimateScreen() {
  const [formData, setFormData] = useState<ProjectData>({
    clientName: '',
    email: '',
    phone: '',
    projectType: '',
    description: '',
    squareFootage: '',
    timeline: '',
  });

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProjectTypes, setShowProjectTypes] = useState(false);
  const [showTimelines, setShowTimelines] = useState(false);

  const handleChange = (name: keyof ProjectData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const newPhotos: Photo[] = result.assets.map(asset => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uri: asset.uri,
        base64: asset.base64,
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const newPhoto: Photo = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
      };
      setPhotos(prev => [...prev, newPhoto]);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.clientName || !formData.email || !formData.phone || !formData.projectType || !formData.description) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEstimate(null);

    try {
      console.log('Generating AI estimate for:', formData);
      const result = await generateEstimate(formData);
      console.log('AI Estimate Result:', result);
      setEstimate(result);
    } catch (err) {
      console.error('Error generating estimate:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate estimate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      email: '',
      phone: '',
      projectType: '',
      description: '',
      squareFootage: '',
      timeline: '',
    });
    setPhotos([]);
    setEstimate(null);
    setError(null);
  };

  // If we have an estimate, show the results
  if (estimate) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>AI-Generated Estimate</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>Powered by Gemini</Text>
            </View>
          </View>

          {/* Total Estimate */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Estimated Cost</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(estimate.totalEstimate?.average || 0)}
            </Text>
            <Text style={styles.totalRange}>
              Range: {formatCurrency(estimate.totalEstimate?.min || 0)} - {formatCurrency(estimate.totalEstimate?.max || 0)}
            </Text>
          </View>

          {/* Cost Breakdown */}
          {estimate.breakdown && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Cost Breakdown</Text>
              {estimate.breakdown.materials && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Materials</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.materials.cost)}</Text>
                </View>
              )}
              {estimate.breakdown.labor && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Labor</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.labor.cost)}</Text>
                </View>
              )}
              {estimate.breakdown.permits > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Permits</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.permits)}</Text>
                </View>
              )}
              {estimate.breakdown.contingency > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Contingency</Text>
                  <Text style={styles.breakdownValue}>{formatCurrency(estimate.breakdown.contingency)}</Text>
                </View>
              )}
            </View>
          )}

          {/* Timeline */}
          {estimate.timeline && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <Text style={styles.timelineText}>
                Estimated Duration: <Text style={styles.timelineBold}>{estimate.timeline.estimatedDays} days</Text>
              </Text>
            </View>
          )}

          {/* Recommendations */}
          {estimate.recommendations && estimate.recommendations.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {estimate.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationBullet}>-</Text>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.resultsActions}>
            <TouchableOpacity style={styles.primaryButton} onPress={resetForm}>
              <Text style={styles.primaryButtonText}>New Estimate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostButton}>
              <Text style={styles.ghostButtonText}>Download PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // Show the form
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>New Project Estimate</Text>
            <Text style={styles.subtitle}>Fill in the details to generate an AI-powered estimate</Text>
          </View>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>Powered by Gemini</Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Client Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.clientName}
              onChangeText={(value) => handleChange('clientName', value)}
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
              onChangeText={(value) => handleChange('email', value)}
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
              onChangeText={(value) => handleChange('phone', value)}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.neutral[500]}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Project Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Details</Text>

          {/* Project Type Dropdown */}
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
                      handleChange('projectType', type);
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
                onChangeText={(value) => handleChange('squareFootage', value)}
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
                  {TIMELINE_OPTIONS.find(t => t.value === formData.timeline)?.label || 'Select...'}
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
                        handleChange('timeline', option.value);
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
              onChangeText={(value) => handleChange('description', value)}
              placeholder="Describe the project in detail..."
              placeholderTextColor={colors.neutral[500]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.photoHeader}>
            <Text style={styles.sectionTitle}>Project Photos</Text>
            <View style={styles.photoBadge}>
              <Text style={styles.photoBadgeText}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <View style={styles.photoGrid}>
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => removePhoto(photo.id)}
                  >
                    <Text style={styles.photoRemoveText}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Photo Upload Buttons */}
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto} disabled={isLoading}>
              <Text style={styles.photoButtonIcon}>📷</Text>
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoButton} onPress={pickImage} disabled={isLoading}>
              <Text style={styles.photoButtonIcon}>🖼️</Text>
              <Text style={styles.photoButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit Button */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color={colors.white} size="small" />
                <Text style={styles.submitButtonText}>Generating Estimate...</Text>
              </>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Generate AI Estimate</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Tips Card */}
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
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['5xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  aiBadge: {
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[500] + '40',
  },
  aiBadgeText: {
    color: colors.primary[400],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  section: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: darkTheme.colors.text,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: darkTheme.colors.text,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
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
  dropdownText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.text,
  },
  dropdownPlaceholder: {
    fontSize: fontSize.md,
    color: colors.neutral[500],
  },
  dropdownArrow: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
  },
  dropdownList: {
    backgroundColor: darkTheme.colors.cardElevated,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  dropdownItemText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.text,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  photoBadge: {
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  photoBadgeText: {
    color: colors.primary[400],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
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
  photoRemoveText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
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
  photoButtonIcon: {
    fontSize: fontSize['2xl'],
    marginBottom: spacing.xs,
  },
  photoButtonText: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
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
  errorIcon: {
    fontSize: fontSize.lg,
    marginRight: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.danger[400],
    fontSize: fontSize.sm,
  },
  actions: {
    marginBottom: spacing.xl,
  },
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  tipsCard: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  tipsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: darkTheme.colors.text,
    marginBottom: spacing.md,
  },
  tipItem: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  // Results styles
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resultsTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: darkTheme.colors.text,
  },
  totalCard: {
    backgroundColor: colors.primary[500] + '15',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[500] + '30',
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.xs,
  },
  totalAmount: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary[400],
    marginBottom: spacing.xs,
  },
  totalRange: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  sectionCard: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  breakdownLabel: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
  },
  breakdownValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: darkTheme.colors.text,
  },
  timelineText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
  },
  timelineBold: {
    fontWeight: fontWeight.bold,
    color: darkTheme.colors.text,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  recommendationBullet: {
    color: colors.primary[400],
    marginRight: spacing.sm,
    fontSize: fontSize.md,
  },
  recommendationText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    lineHeight: 20,
  },
  resultsActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  ghostButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  ghostButtonText: {
    color: darkTheme.colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
});