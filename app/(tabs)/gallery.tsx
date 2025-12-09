import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Image } from 'react-native';
import { colors, spacing, borderRadius, fontSize, shadows, darkTheme } from '@/constants/theme';

const categories = ['All', 'Kitchen', 'Bathroom', 'Fence', 'Deck', 'Painting'];

const galleryItems = [
  { id: 1, category: 'Kitchen', title: 'Smith Kitchen Remodel', date: '2025-12-01' },
  { id: 2, category: 'Bathroom', title: 'Johnson Bathroom', date: '2025-12-03' },
  { id: 3, category: 'Fence', title: 'Davis Fence Project', date: '2025-11-28' },
  { id: 4, category: 'Deck', title: 'Wilson Deck Build', date: '2025-12-05' },
  { id: 5, category: 'Painting', title: 'Anderson Interior', date: '2025-12-08' },
  { id: 6, category: 'Kitchen', title: 'Brown Kitchen Update', date: '2025-11-25' },
];

export default function GalleryScreen() {
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredItems = selectedCategory === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
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
          </Pressable>
        ))}
      </ScrollView>

      {/* Gallery Grid */}
      <ScrollView style={styles.galleryContainer} contentContainerStyle={styles.galleryContent}>
        <View style={styles.galleryGrid}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.galleryItem}>
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderIcon}>📷</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: darkTheme.colors.card,
    marginRight: spacing.sm,
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
  galleryContainer: {
    flex: 1,
  },
  galleryContent: {
    padding: spacing.lg,
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
  },
  placeholderIcon: {
    fontSize: 48,
    opacity: 0.5,
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
  itemDate: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
  },
});
