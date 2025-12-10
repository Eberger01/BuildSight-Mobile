import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, TouchableOpacity, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, fontSize, shadows, darkTheme } from '@/constants/theme';

const categories = ['All', 'Kitchen', 'Bathroom', 'Fence', 'Deck', 'Painting'];

interface GalleryItem {
  id: number;
  category: string;
  title: string;
  date: string;
  photoCount: number;
}

const galleryItems: GalleryItem[] = [
  { id: 1, category: 'Kitchen', title: 'Smith Kitchen Remodel', date: '2025-12-01', photoCount: 12 },
  { id: 2, category: 'Bathroom', title: 'Johnson Bathroom', date: '2025-12-03', photoCount: 8 },
  { id: 3, category: 'Fence', title: 'Davis Fence Project', date: '2025-11-28', photoCount: 15 },
  { id: 4, category: 'Deck', title: 'Wilson Deck Build', date: '2025-12-05', photoCount: 22 },
  { id: 5, category: 'Painting', title: 'Anderson Interior', date: '2025-12-08', photoCount: 6 },
  { id: 6, category: 'Kitchen', title: 'Brown Kitchen Update', date: '2025-11-25', photoCount: 18 },
];

export default function GalleryScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isUploading, setIsUploading] = useState(false);

  const filteredItems = selectedCategory === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory);

  const totalPhotos = filteredItems.reduce((sum, item) => sum + item.photoCount, 0);

  const handleUpload = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets.length > 0) {
        console.log('Selected photos:', result.assets.length);
        Alert.alert(
          'Photos Selected',
          `${result.assets.length} photo${result.assets.length > 1 ? 's' : ''} ready to upload.`,
          [{ text: 'OK' }]
        );
        // TODO: Upload photos to backend/storage
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera access to take photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        console.log('Photo taken:', result.assets[0].uri);
        Alert.alert(
          'Photo Captured',
          'Photo is ready to upload.',
          [{ text: 'OK' }]
        );
        // TODO: Upload photo to backend/storage
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleProjectPress = (item: GalleryItem) => {
    console.log('View project:', item.id);
    // TODO: Navigate to project photo gallery
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Project Gallery</Text>
          <Text style={styles.headerSubtitle}>
            {filteredItems.length} projects • {totalPhotos} photos
          </Text>
        </View>
        <View style={styles.headerActions}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handleTakePhoto}
            >
              <Text style={styles.cameraBtnIcon}>📸</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <Text style={styles.uploadBtnIcon}>➕</Text>
            <Text style={styles.uploadBtnText}>
              {isUploading ? 'Uploading...' : 'Upload'}
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
            ? galleryItems.length
            : galleryItems.filter(item => item.category === category).length;

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
        nestedScrollEnabled={true}
      >
        <View style={styles.galleryGrid}>
          {filteredItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.galleryItem}
              onPress={() => handleProjectPress(item)}
            >
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderIcon}>📷</Text>
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
                  <Text style={styles.itemDate}>{item.date}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {filteredItems.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📷</Text>
            <Text style={styles.emptyStateText}>No projects found</Text>
            <Text style={styles.emptyStateSubtext}>Try a different category or upload new photos</Text>
            <TouchableOpacity style={styles.emptyStateBtn} onPress={handleUpload}>
              <Text style={styles.emptyStateBtnText}>Upload Photos</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
});
