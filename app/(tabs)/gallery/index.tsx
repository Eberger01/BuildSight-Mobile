import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { borderRadius, colors, darkTheme, fontSize, shadows, spacing } from '@/constants/theme';
import { importPhotoToAppStorageAsync } from '@/data/files';
import { GalleryProjectRow, listGalleryProjectsAsync } from '@/data/repos/galleryRepo';
import { JobRow, listJobsAsync } from '@/data/repos/jobsRepo';
import { createPhotoAsync } from '@/data/repos/photosRepo';
import { loadSettingsAsync } from '@/data/settings';
import { photoQualityToExpo } from '@/utils/photoQuality';

const categories = ['All', 'Kitchen', 'Bathroom', 'Fence', 'Deck', 'Painting', 'Other'] as const;

export default function GalleryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('All');
  const [projects, setProjects] = useState<GalleryProjectRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [attachModalVisible, setAttachModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<'library' | 'camera' | null>(null);

  const refresh = useCallback(async () => {
    const [p, j] = await Promise.all([listGalleryProjectsAsync(), listJobsAsync()]);
    setProjects(p);
    setJobs(j);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const s = await loadSettingsAsync();
        setQuality(photoQualityToExpo(s.photoQuality));
      })();
    }, [])
  );

  const filteredProjects = useMemo(() => {
    if (selectedCategory === 'All') return projects;
    return projects.filter((p) => p.category === selectedCategory);
  }, [projects, selectedCategory]);

  const totalPhotos = useMemo(
    () => filteredProjects.reduce((sum, item) => sum + (item.photoCount || 0), 0),
    [filteredProjects]
  );

  const beginAttach = (action: 'library' | 'camera') => {
    setPendingAction(action);
    setAttachModalVisible(true);
  };

  const runAttach = async (jobId: number | null) => {
    const action = pendingAction;
    if (!action) return;

    setAttachModalVisible(false);
    setPendingAction(null);

    try {
      setIsBusy(true);

      if (action === 'library') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('errors.permissionNeeded'), t('errors.cameraRollPermission'));
          return;
        }
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
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('errors.permissionNeeded'), t('errors.cameraPermission'));
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality,
          allowsEditing: false,
        });
        if (result.canceled) return;

        const asset = result.assets[0];
        const localPath = await importPhotoToAppStorageAsync(asset.uri);
        await createPhotoAsync({ jobId, localPath, originalUri: asset.uri });
      }

      await refresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('gallery.failedAddPhotos', 'Failed to add photos.'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleProjectPress = (item: GalleryProjectRow) => {
    router.push(`/gallery/${item.projectId}`);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t('gallery.projectPhotos')}</Text>
          <Text style={styles.headerSubtitle}>
            {filteredProjects.length} {t('jobs.projects')} • {totalPhotos} {t('gallery.photos').toLowerCase()}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={() => beginAttach('camera')}
            >
              <Text style={styles.cameraBtnIcon}>📸</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => beginAttach('library')}
            disabled={isBusy}
          >
            <Text style={styles.uploadBtnIcon}>➕</Text>
            <Text style={styles.uploadBtnText}>
              {isBusy ? t('common.loading') : t('common.add')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => {
          const count = category === 'All'
            ? projects.length
            : projects.filter(item => item.category === category).length;

          return (
            <Pressable
              key={category}
              style={[
                styles.categoryBtn,
                selectedCategory === category && styles.categoryBtnActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryBtnText,
                selectedCategory === category && styles.categoryBtnTextActive
              ]}>
                {category}
              </Text>
              <View style={[
                styles.categoryCount,
                selectedCategory === category && styles.categoryCountActive
              ]}>
                <Text style={[
                  styles.categoryCountText,
                  selectedCategory === category && styles.categoryCountTextActive
                ]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Gallery Grid */}
      <ScrollView
        style={styles.galleryContainer}
        contentContainerStyle={styles.galleryContent}
        showsVerticalScrollIndicator={true}
        overScrollMode="always"
      >
        <View style={styles.galleryGrid}>
          {filteredProjects.map((item) => (
            <Pressable
              key={item.projectId}
              style={styles.galleryItem}
              onPress={() => handleProjectPress(item)}
            >
              <View style={styles.imagePlaceholder}>
                {item.thumbnailPath ? (
                  <Image source={{ uri: item.thumbnailPath }} style={styles.thumbnail} />
                ) : (
                  <Text style={styles.placeholderIcon}>📷</Text>
                )}
                {/* Photo Count Badge */}
                <View style={styles.photoCountBadge}>
                  <Text style={styles.photoCountIcon}>🖼️</Text>
                  <Text style={styles.photoCountText}>{item.photoCount}</Text>
                </View>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <Text style={styles.itemDate}>{item.date ? item.date.slice(0, 10) : ''}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {filteredProjects.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📷</Text>
            <Text style={styles.emptyStateText}>{t('gallery.noPhotos')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('gallery.noPhotosDesc')}</Text>
            <TouchableOpacity style={styles.emptyStateBtn} onPress={() => beginAttach('library')}>
              <Text style={styles.emptyStateBtnText}>{t('gallery.addPhotos', 'Add Photos')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Attach-to-Job modal */}
      <Modal
        visible={attachModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAttachModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAttachModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('gallery.attachPhotosTo', 'Attach photos to…')}</Text>

            <Pressable style={styles.modalOption} onPress={() => runAttach(null)}>
              <Text style={styles.modalOptionText}>{t('gallery.unassigned', 'Unassigned')}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <View style={styles.modalDivider} />

            <ScrollView style={styles.modalList} contentContainerStyle={styles.modalListContent}>
              {jobs.map((j) => (
                <Pressable key={j.id} style={styles.modalOption} onPress={() => runAttach(j.id)}>
                  <View style={styles.modalOptionInfo}>
                    <Text style={styles.modalOptionText}>{j.clientName}</Text>
                    <Text style={styles.modalOptionSub}>{j.projectType}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
              {jobs.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>{t('gallery.noJobsYet', 'No jobs yet. Create one in Jobs → New.')}</Text>
                </View>
              ) : null}
            </ScrollView>

            <Pressable style={styles.modalCancel} onPress={() => setAttachModalVisible(false)}>
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: darkTheme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtnIcon: {
    fontSize: fontSize.xl,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  uploadBtnIcon: {
    fontSize: fontSize.md,
  },
  uploadBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  categoryContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  categoryContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: darkTheme.colors.card,
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  categoryBtnActive: {
    backgroundColor: colors.primary[500],
  },
  categoryBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: darkTheme.colors.textMuted,
  },
  categoryBtnTextActive: {
    color: colors.white,
  },
  categoryCount: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: darkTheme.colors.cardElevated,
  },
  categoryCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryCountText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: darkTheme.colors.textMuted,
  },
  categoryCountTextActive: {
    color: colors.white,
  },
  galleryContainer: {
    flex: 1,
  },
  galleryContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  galleryItem: {
    width: '48%',
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 4/3,
    backgroundColor: darkTheme.colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  photoCountIcon: {
    fontSize: fontSize.xs,
  },
  photoCountText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
  itemInfo: {
    padding: spacing.md,
  },
  itemTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCategory: {
    fontSize: fontSize.xs,
    color: colors.primary[400],
    fontWeight: '500',
  },
  itemDate: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  emptyStateBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
  },
  emptyStateBtnText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 380,
    ...shadows.lg,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: darkTheme.colors.text,
    textAlign: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  modalDivider: {
    height: 1,
    backgroundColor: darkTheme.colors.border,
  },
  modalList: {
    maxHeight: 320,
  },
  modalListContent: {
    paddingBottom: spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  modalOptionInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  modalOptionText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: darkTheme.colors.text,
  },
  modalOptionSub: {
    marginTop: 2,
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  chevron: {
    fontSize: fontSize['2xl'],
    color: darkTheme.colors.textMuted,
    fontWeight: '300',
  },
  modalEmpty: {
    padding: spacing.lg,
  },
  modalEmptyText: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    textAlign: 'center',
  },
  modalCancel: {
    padding: spacing.lg,
    backgroundColor: darkTheme.colors.card,
  },
  modalCancelText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
    textAlign: 'center',
    fontWeight: '700',
  },
});
