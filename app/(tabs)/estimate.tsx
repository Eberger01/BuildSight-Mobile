import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { colors, spacing, borderRadius, fontSize, darkTheme } from '@/constants/theme';

export default function EstimateScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.placeholder}>
        <Text style={styles.icon}>📝</Text>
        <Text style={styles.title}>Estimate Creator</Text>
        <Text style={styles.subtitle}>
          Create AI-powered cost estimates for your construction projects.
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>• AI-powered cost estimation</Text>
          <Text style={styles.feature}>• Material breakdown</Text>
          <Text style={styles.feature}>• Timeline predictions</Text>
          <Text style={styles.feature}>• Photo capture support</Text>
        </View>
        <Text style={styles.comingSoon}>Full implementation coming soon...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    padding: spacing['3xl'],
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: darkTheme.colors.text,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  featureList: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
  },
  feature: {
    fontSize: fontSize.sm,
    color: colors.primary[400],
    marginBottom: spacing.sm,
  },
  comingSoon: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    fontStyle: 'italic',
  },
});
