import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { importPhotoToAppStorageAsync } from '@/data/files';
import { createPhotoAsync, deletePhotoAsync, listPhotosByJobIdAsync, PhotoRow } from '@/data/repos/photosRepo';
import { loadSettingsAsync } from '@/data/settings';
import { photoQualityToExpo } from '@/utils/photoQuality';

export default function JobPhotosScreen() {
  const params = useLocalSearchParams<{ jobId?: string }>();
  const jobId = Number(params.jobId || 0);

  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [quality, setQuality] = useState(0.8);

  const load = useCallback(async () => {
    if (!jobId) return;
    const rows = await listPhotosByJobIdAsync(jobId);
    setPhotos(rows);
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const s = await loadSettingsAsync();
        setQuality(photoQualityToExpo(s.photoQuality));
      })();
    }, [])
  );

  const total = photos.length;

  const headerSubtitle = useMemo(() => {
    if (total === 0) return 'No photos yet';
    return `${total} photo${total === 1 ? '' : 's'}`;
  }, [total]);

  const addFromLibrary = async () => {
    if (!jobId) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant photo library access.');
      return;
    }

    try {
      setIsBusy(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality,
        selectionLimit: 12,
      });

      if (result.canceled) return;

      for (const asset of result.assets) {
        const localPath = await importPhotoToAppStorageAsync(asset.uri);
        await createPhotoAsync({ jobId, localPath, originalUri: asset.uri });
      }

      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add photos.');
    } finally {
      setIsBusy(false);
    }
  };

  const takePhoto = async () => {
    if (!jobId) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant camera access.');
      return;
    }

    try {
      setIsBusy(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality,
        allowsEditing: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const localPath = await importPhotoToAppStorageAsync(asset.uri);
      await createPhotoAsync({ jobId, localPath, originalUri: asset.uri });

      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to take photo.');
    } finally {
      setIsBusy(false);
    }
  };

  const removePhoto = async (photo: PhotoRow) => {
    Alert.alert('Remove photo?', 'This will delete the local file from the device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsBusy(true);
            await deletePhotoAsync(photo.id);
            await FileSystem.deleteAsync(photo.localPath, { idempotent: true });
            await load();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete photo.');
          } finally {
            setIsBusy(false);
          }
        },
      },
    ]);
  };

  if (!jobId) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>Invalid job id.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Job Photos</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={takePhoto} disabled={isBusy}>
            <Text style={styles.iconBtnText}>📸</Text>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={addFromLibrary} disabled={isBusy}>
            <Text style={styles.primaryBtnText}>{isBusy ? 'Working…' : 'Add'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        {photos.map((p) => (
          <Pressable key={p.id} style={styles.photoTile} onLongPress={() => removePhoto(p)}>
            <Image source={{ uri: p.localPath }} style={styles.photo} />
            <View style={styles.deleteHint}>
              <Text style={styles.deleteHintText}>Hold to delete</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyText}>No photos saved</Text>
          <Text style={styles.emptySub}>Add from library or take a photo to store it locally.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: darkTheme.colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  center: { alignItems: 'center', justifyContent: 'center' },
  muted: { color: darkTheme.colors.textMuted, fontSize: fontSize.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSize['2xl'], fontWeight: '700', color: darkTheme.colors.text, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: darkTheme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  iconBtnText: { fontSize: 18 },
  primaryBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  primaryBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  photoTile: {
    width: '48%',
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: darkTheme.colors.cardElevated },
  deleteHint: {
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.border,
    backgroundColor: darkTheme.colors.card,
  },
  deleteHintText: { fontSize: fontSize.xs, color: darkTheme.colors.textMuted, textAlign: 'center' },
  emptyState: { marginTop: spacing['2xl'], alignItems: 'center' },
  emptyIcon: { fontSize: 64, opacity: 0.5, marginBottom: spacing.md },
  emptyText: { fontSize: fontSize.lg, fontWeight: '700', color: darkTheme.colors.text, marginBottom: spacing.xs },
  emptySub: { fontSize: fontSize.sm, color: darkTheme.colors.textMuted, textAlign: 'center' },
});


