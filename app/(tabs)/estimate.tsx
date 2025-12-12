import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { AssignEstimateModal } from '@/components/estimate/AssignEstimateModal';
import { EstimateForm } from '@/components/estimate/EstimateForm';
import { EstimateResults } from '@/components/estimate/EstimateResults';
import { importPhotoToAppStorageAsync } from '@/data/files';
import { createEstimateAsync, updateEstimateJobIdAsync, updateEstimatePdfPathAsync } from '@/data/repos/estimatesRepo';
import { createJobAsync, JobRow, listJobsAsync } from '@/data/repos/jobsRepo';
import { createPhotoAsync } from '@/data/repos/photosRepo';
import { defaultSettings, ESTIMATE_DRAFT_KEY, loadSettingsAsync, SettingsData } from '@/data/settings';
import { generateEstimate } from '@/services/geminiService';
import { Estimate, Photo, ProjectData } from '@/types';
import { buildEstimatePdfHtml } from '@/utils/estimatePdf';
import { photoQualityToExpo } from '@/utils/photoQuality';
import { printHtmlToPdfAndShareAsync } from '@/utils/exportDownload';

export default function EstimateScreen() {
  const router = useRouter();
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
      const s = await loadSettingsAsync();
      setSettings(s);
      await Promise.all([loadDraft(), refreshJobs()]);
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
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: photoQualityToExpo(settings.photoQuality),
    });

    if (!result.canceled) {
      const imported = await Promise.all(
        result.assets.map(async (asset) => {
          const localPath = await importPhotoToAppStorageAsync(asset.uri);
          if (settings.autoUpload) {
            // Reason: user requested local-only storage; auto-upload means save to local Gallery as unassigned.
            await createPhotoAsync({ jobId: null, localPath, originalUri: asset.uri });
          }
          return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, uri: localPath } satisfies Photo;
        })
      );
      setPhotos((prev) => [...prev, ...imported]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: photoQualityToExpo(settings.photoQuality),
    });

    if (!result.canceled) {
      const localPath = await importPhotoToAppStorageAsync(result.assets[0].uri);
      if (settings.autoUpload) {
        await createPhotoAsync({ jobId: null, localPath, originalUri: result.assets[0].uri });
      }
      const newPhoto: Photo = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, uri: localPath };
      setPhotos((prev) => [...prev, newPhoto]);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const currency = useMemo(() => settings.currency ?? 'EUR', [settings.currency]);

  const handleSubmit = async () => {
    // Validation
    if (!formData.clientName || !formData.email || !formData.phone || !formData.projectType || !formData.description) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEstimate(null);
    setEstimateId(null);
    setAssignedJobLabel(null);

    try {
      console.log('Generating AI estimate for:', formData);
      const result = await generateEstimate(formData);
      console.log('AI Estimate Result:', result);
      setEstimate(result);

      const id = await createEstimateAsync({
        jobId: null,
        status: 'final',
        projectDataJson: JSON.stringify({ ...formData, photos }),
        estimateJson: JSON.stringify(result),
        currency,
      });
      setEstimateId(id);
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
    setEstimateId(null);
    setAssignedJobLabel(null);
    AsyncStorage.removeItem(ESTIMATE_DRAFT_KEY).catch(() => undefined);
  };

  const onAssignToJobId = async (jobId: number | null) => {
    if (!estimateId) return;
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
        clientName: formData.clientName || 'Client',
        projectType: formData.projectType || 'Project',
        status: 'Planning',
        progress: 0,
        budgetCents,
        startDate: new Date().toISOString().slice(0, 10),
        notes: 'Created from estimate',
      });
      await refreshJobs();
      await onAssignToJobId(newJobId);
      router.push((`/jobs/${newJobId}` as unknown) as any);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create job.');
    } finally {
      setIsBusy(false);
    }
  };

  const downloadPdf = async () => {
    if (!estimate || !estimateId) return;
    try {
      setIsBusy(true);
      const html = buildEstimatePdfHtml({ project: formData, estimate, currency });
      const baseName = `${formData.clientName || 'client'}_estimate`;
      const result = await printHtmlToPdfAndShareAsync({ html, baseName, dialogTitle: 'Share estimate PDF' });
      if (result?.savedPath) {
        await updateEstimatePdfPathAsync(estimateId, result.savedPath);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to generate PDF.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Save as draft estimate without AI generation
      await createEstimateAsync({
        jobId: null,
        status: 'draft',
        projectDataJson: JSON.stringify({ ...formData, photos }),
        estimateJson: null,
        currency,
      });

      // Clear the autosave draft since we've saved properly
      await AsyncStorage.removeItem(ESTIMATE_DRAFT_KEY);

      Alert.alert('Draft Saved', 'Your estimate draft has been saved. You can generate the AI estimate later.', [
        { text: 'OK', onPress: () => resetForm() },
        { text: 'Continue Editing', style: 'cancel' },
      ]);
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft.');
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
    />
  );
}