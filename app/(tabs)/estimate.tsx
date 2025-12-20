import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AssignEstimateModal } from '@/components/estimate/AssignEstimateModal';
import { EstimateForm } from '@/components/estimate/EstimateForm';
import { EstimateResults } from '@/components/estimate/EstimateResults';
import { CreditWarningBanner } from '@/components/credits/CreditBadge';
import { useCredits, useCanGenerateEstimate } from '@/contexts/CreditsContext';
import { importPhotoToAppStorageAsync } from '@/data/files';
import { createEstimateAsync, updateEstimateJobIdAsync, updateEstimatePdfPathAsync } from '@/data/repos/estimatesRepo';
import { createJobAsync, JobRow, listJobsAsync } from '@/data/repos/jobsRepo';
import { createPhotoAsync } from '@/data/repos/photosRepo';
import { defaultSettings, ESTIMATE_DRAFT_KEY, loadSettingsAsync, SettingsData } from '@/data/settings';
import { generateEstimateSecure, isBackendEnabled } from '@/services/estimateService';
import { generateEstimate } from '@/services/geminiService';
import { Estimate, Photo, ProjectData } from '@/types';
import { buildEstimatePdfHtml } from '@/utils/estimatePdf';
import { photoQualityToExpo } from '@/utils/photoQuality';
import { printHtmlToPdfAndShareAsync } from '@/utils/exportDownload';

export default function EstimateScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { refreshCredits, isBackendConfigured } = useCredits();
  const { canGenerate, reason: cannotGenerateReason } = useCanGenerateEstimate();
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
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [estimateId, setEstimateId] = useState<number | null>(null);
  const [assignedJobLabel, setAssignedJobLabel] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const handleChange = (name: keyof ProjectData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loadDraft = useCallback(async () => {
    const raw = await AsyncStorage.getItem(ESTIMATE_DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { formData?: ProjectData; photos?: Photo[] };
      if (parsed.formData) setFormData(parsed.formData);
      if (Array.isArray(parsed.photos)) setPhotos(parsed.photos);
    } catch {
      // ignore corrupt draft
    }
  }, []);

  const refreshJobs = useCallback(async () => {
    const rows = await listJobsAsync();
    setJobs(rows);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await loadSettingsAsync();
        setSettings(s);
        await Promise.all([loadDraft(), refreshJobs()]);
      } catch (error) {
        console.error('Failed to load estimate screen data:', error);
        // Settings will remain at defaults, which is acceptable
      }
    })();
  }, [loadDraft, refreshJobs]);

  // Draft autosave (only when enabled)
  useEffect(() => {
    if (!settings.autoSave) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(ESTIMATE_DRAFT_KEY, JSON.stringify({ formData, photos })).catch(() => undefined);
    }, 400);
    return () => clearTimeout(t);
  }, [formData, photos, settings.autoSave]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('errors.permissionNeeded', 'Permission needed'), t('errors.cameraRollPermission', 'Please grant camera roll permissions to upload photos.'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false, // Disabled due to iOS 26 dismissal bug
      quality: photoQualityToExpo(settings.photoQuality),
    });

    if (!result.canceled) {
      try {
        const imported = await Promise.all(
          result.assets.map(async (asset) => {
            const localPath = await importPhotoToAppStorageAsync(asset.uri);
            if (settings.autoUpload) {
              // Reason: user requested local-only storage; auto-upload means save to local Gallery as unassigned.
              try {
                await createPhotoAsync({ jobId: null, localPath, originalUri: asset.uri });
              } catch (uploadError) {
                console.error('Failed to auto-upload photo to gallery:', uploadError);
                // Continue anyway - photo is still usable for the estimate
              }
            }
            return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, uri: localPath } satisfies Photo;
          })
        );
        setPhotos((prev) => [...prev, ...imported]);
      } catch (e) {
        console.error('Failed to import photos:', e);
        Alert.alert(t('common.error'), t('errors.failedImportPhotos', 'Failed to import photos. Please try again.'));
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('errors.permissionNeeded', 'Permission needed'), t('errors.cameraPermission', 'Please grant camera permissions to take photos.'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: photoQualityToExpo(settings.photoQuality),
    });

    if (!result.canceled) {
      try {
        const localPath = await importPhotoToAppStorageAsync(result.assets[0].uri);
        if (settings.autoUpload) {
          try {
            await createPhotoAsync({ jobId: null, localPath, originalUri: result.assets[0].uri });
          } catch (uploadError) {
            console.error('Failed to auto-upload photo to gallery:', uploadError);
            // Continue anyway - photo is still usable for the estimate
          }
        }
        const newPhoto: Photo = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, uri: localPath };
        setPhotos((prev) => [...prev, newPhoto]);
      } catch (e) {
        console.error('Failed to capture photo:', e);
        Alert.alert(t('common.error'), t('errors.failedCapturePhoto', 'Failed to capture photo. Please try again.'));
      }
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const currency = useMemo(() => settings.currency ?? 'EUR', [settings.currency]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.clientName || !formData.email || !formData.phone || !formData.projectType || !formData.description) {
      setError(t('estimate.validation.fillRequired', 'Please fill in all required fields.'));
      return;
    }

    // Check if user can generate estimates (credits check)
    if (isBackendConfigured && !canGenerate) {
      if (cannotGenerateReason === 'No credits available') {
        Alert.alert(
          t('subscription.noCredits', 'No Credits'),
          t('subscription.needCreditsForEstimate', 'You need credits to generate an AI estimate. Would you like to purchase credits?'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('subscription.buyCredits'), onPress: () => router.push('/subscription') },
          ]
        );
      } else {
        Alert.alert(t('estimate.cannotGenerate', 'Cannot Generate Estimate'), cannotGenerateReason || t('errors.tryAgainLater', 'Please try again later.'));
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setEstimate(null);
    setEstimateId(null);
    setAssignedJobLabel(null);

    try {
      console.log('Generating AI estimate for:', formData, 'Country:', settings.country);

      // Use secure backend if configured, otherwise fall back to direct Gemini
      const result = isBackendEnabled()
        ? await generateEstimateSecure(formData, {
            country: settings.country,
            currency: settings.currency,
          })
        : await generateEstimate(formData, {
            country: settings.country,
            currency: settings.currency,
          });

      console.log('AI Estimate Result:', result);

      // Refresh credits after successful estimate (deducts 1 credit)
      if (isBackendConfigured) {
        await refreshCredits();
      }

      // Save estimate to database - must succeed before showing results
      const id = await createEstimateAsync({
        jobId: null,
        status: 'final',
        projectDataJson: JSON.stringify({ ...formData, photos }),
        estimateJson: JSON.stringify(result),
        currency,
      });

      if (!id) {
        throw new Error(t('estimate.failedToSave', 'Failed to save estimate to database.'));
      }

      // Only set estimate and ID after both AI generation and DB save succeed
      setEstimate(result);
      setEstimateId(id);
    } catch (err) {
      console.error('Error generating estimate:', err);

      // Handle specific credit-related errors
      const errorMessage = err instanceof Error ? err.message : t('estimate.failedToGenerate', 'Failed to generate estimate. Please try again.');
      if (errorMessage.includes('credits') || errorMessage.includes('INSUFFICIENT_CREDITS')) {
        Alert.alert(
          t('subscription.noCredits', 'No Credits'),
          t('subscription.needCredits', 'You need credits to generate an AI estimate.'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('subscription.buyCredits'), onPress: () => router.push('/subscription') },
          ]
        );
      } else {
        setError(errorMessage);
      }
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
    setEstimateId(null);
    setAssignedJobLabel(null);
    AsyncStorage.removeItem(ESTIMATE_DRAFT_KEY).catch(() => undefined);
  };

  const onAssignToJobId = async (jobId: number | null) => {
    if (!estimateId) {
      Alert.alert(t('common.error'), t('estimate.notSaved', 'Estimate not saved. Please try generating the estimate again.'));
      return;
    }
    await updateEstimateJobIdAsync(estimateId, jobId);
    if (jobId) {
      const j = jobs.find((x) => x.id === jobId);
      setAssignedJobLabel(j ? `${j.clientName} • ${j.projectType}` : `Job #${jobId}`);
    } else {
      setAssignedJobLabel(null);
    }
    setAssignModalVisible(false);
  };

  const createJobAndAssign = async () => {
    if (!estimate || !estimateId) return;
    try {
      setIsBusy(true);
      const budgetCents = Math.max(0, Math.round((estimate.totalEstimate?.average || 0) * 100));
      const newJobId = await createJobAsync({
        clientName: formData.clientName || t('jobs.clientName'),
        projectType: formData.projectType || t('jobs.projectType'),
        status: 'Planning',
        progress: 0,
        budgetCents,
        startDate: new Date().toISOString().slice(0, 10),
        notes: t('jobs.createdFromEstimate', 'Created from estimate'),
      });
      await refreshJobs();
      await onAssignToJobId(newJobId);
      router.push(`/jobs/${newJobId}`);
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('errors.saveFailed'));
    } finally {
      setIsBusy(false);
    }
  };

  const downloadPdf = async () => {
    if (!estimate || !estimateId) return;
    try {
      setIsBusy(true);
      const html = buildEstimatePdfHtml({
        project: formData,
        estimate,
        currency,
        country: settings.country,
      });
      const baseName = `${formData.clientName || 'client'}_estimate`;
      const result = await printHtmlToPdfAndShareAsync({ html, baseName, dialogTitle: t('estimate.sharePdf') });
      if (result?.savedPath) {
        await updateEstimatePdfPathAsync(estimateId, result.savedPath);
      }
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('estimate.failedPdf', 'Failed to generate PDF.'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create a job in Planning status
      const newJobId = await createJobAsync({
        clientName: formData.clientName || t('estimate.draftClient', 'Draft Client'),
        projectType: formData.projectType || t('estimate.draftProject', 'Draft Project'),
        status: 'Planning',
        progress: 0,
        budgetCents: 0,
        startDate: new Date().toISOString().slice(0, 10),
        notes: t('jobs.createdFrom'),
      });

      // Save as draft estimate linked to the new job
      await createEstimateAsync({
        jobId: newJobId,
        status: 'draft',
        projectDataJson: JSON.stringify({ ...formData, photos }),
        estimateJson: null,
        currency,
      });

      // Clear the autosave draft since we've saved properly
      await AsyncStorage.removeItem(ESTIMATE_DRAFT_KEY);

      // Refresh jobs list
      await refreshJobs();

      Alert.alert(
        t('estimate.draftSaved', 'Draft Saved'),
        t('estimate.draftSavedMessage', 'Your estimate draft has been saved as a new job in Planning status.'),
        [
          {
            text: t('estimate.viewJob', 'View Job'),
            onPress: () => {
              resetForm();
              router.push(`/jobs/${newJobId}` as any);
            },
          },
          {
            text: t('estimate.startNew', 'Start New Estimate'),
            onPress: () => resetForm(),
          },
        ]
      );
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err instanceof Error ? err.message : t('estimate.failedDraft', 'Failed to save draft.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (estimate) {
    return (
      <>
        <EstimateResults
          project={formData}
          estimate={estimate}
          currency={currency}
          country={settings.country}
          isBusy={isBusy}
          onNewEstimate={resetForm}
          onAssignToJob={() => setAssignModalVisible(true)}
          onDownloadPdf={downloadPdf}
          assignedJobLabel={assignedJobLabel}
        />
        <AssignEstimateModal
          visible={assignModalVisible}
          jobs={jobs}
          onClose={() => setAssignModalVisible(false)}
          onAssignToJobId={onAssignToJobId}
          onCreateJob={createJobAndAssign}
        />
      </>
    );
  }

  return (
    <EstimateForm
      formData={formData}
      photos={photos}
      isLoading={isLoading}
      error={error}
      onChange={handleChange}
      onRemovePhoto={removePhoto}
      onTakePhoto={takePhoto}
      onPickImages={pickImages}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      onClearForm={resetForm}
    />
  );
}