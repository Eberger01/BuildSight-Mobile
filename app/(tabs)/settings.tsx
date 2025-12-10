import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Switch, Alert, Modal, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize, shadows, darkTheme } from '@/constants/theme';

const SETTINGS_KEY = 'buildsight_settings';

interface SettingsData {
  aiEnabled: boolean;
  notifications: boolean;
  autoSave: boolean;
  autoUpload: boolean;
  photoQuality: 'high' | 'medium' | 'low';
  currency: 'USD' | 'EUR' | 'BRL';
}

const defaultSettings: SettingsData = {
  aiEnabled: true,
  notifications: true,
  autoSave: true,
  autoUpload: false,
  photoQuality: 'high',
  currency: 'USD',
};

const currencyOptions: Array<{ label: string; value: 'USD' | 'EUR' | 'BRL' }> = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'BRL (R$)', value: 'BRL' },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSetting = async <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save setting:', error);
      Alert.alert('Error', 'Failed to save setting. Please try again.');
    }
  };

  const handlePhotoQualityPress = () => {
    const options: Array<{ label: string; value: 'high' | 'medium' | 'low' }> = [
      { label: 'High (Original)', value: 'high' },
      { label: 'Medium (Balanced)', value: 'medium' },
      { label: 'Low (Compressed)', value: 'low' },
    ];

    Alert.alert(
      'Photo Quality',
      'Select the quality for captured photos',
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => saveSetting('photoQuality', option.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const getPhotoQualityLabel = () => {
    switch (settings.photoQuality) {
      case 'high': return 'High (Original)';
      case 'medium': return 'Medium (Balanced)';
      case 'low': return 'Low (Compressed)';
      default: return 'High (Original)';
    }
  };

  const handleCurrencySelect = (value: 'USD' | 'EUR' | 'BRL') => {
    saveSetting('currency', value);
    setCurrencyModalVisible(false);
  };

  const getCurrencyLabel = () => {
    switch (settings.currency) {
      case 'USD': return 'USD ($)';
      case 'EUR': return 'EUR (€)';
      case 'BRL': return 'BRL (R$)';
      default: return 'USD ($)';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* AI Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Settings</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>AI Estimation</Text>
              <Text style={styles.settingDescription}>Enable Gemini 3 Pro for cost estimation</Text>
            </View>
            <Switch
              value={settings.aiEnabled}
              onValueChange={(value) => saveSetting('aiEnabled', value)}
              trackColor={{ false: darkTheme.colors.cardElevated, true: colors.primary[500] }}
              thumbColor={colors.white}
            />
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>AI Model</Text>
              <Text style={styles.settingDescription}>Gemini 3 Pro Preview</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Camera Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Camera Settings</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Upload Photos</Text>
              <Text style={styles.settingDescription}>Upload photos to gallery automatically</Text>
            </View>
            <Switch
              value={settings.autoUpload}
              onValueChange={(value) => saveSetting('autoUpload', value)}
              trackColor={{ false: darkTheme.colors.cardElevated, true: colors.primary[500] }}
              thumbColor={colors.white}
            />
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={handlePhotoQualityPress}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Photo Quality</Text>
              <Text style={styles.settingDescription}>{getPhotoQualityLabel()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Get updates about your projects</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => saveSetting('notifications', value)}
              trackColor={{ false: darkTheme.colors.cardElevated, true: colors.primary[500] }}
              thumbColor={colors.white}
            />
          </View>
        </View>
      </View>

      {/* App Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Save Drafts</Text>
              <Text style={styles.settingDescription}>Automatically save estimate drafts</Text>
            </View>
            <Switch
              value={settings.autoSave}
              onValueChange={(value) => saveSetting('autoSave', value)}
              trackColor={{ false: darkTheme.colors.cardElevated, true: colors.primary[500] }}
              thumbColor={colors.white}
            />
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => setCurrencyModalVisible(true)}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Currency</Text>
              <Text style={styles.settingDescription}>{getCurrencyLabel()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingDescription}>English</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsCard}>
          <Pressable style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Profile</Text>
              <Text style={styles.settingDescription}>Manage your account details</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Subscription</Text>
              <Text style={styles.settingDescription}>Free Plan</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.settingsCard}>
          <Pressable style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Export Data</Text>
              <Text style={styles.settingDescription}>Download your estimates and projects</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, styles.dangerText]}>Clear Cache</Text>
              <Text style={styles.settingDescription}>Free up storage space</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>BuildSight v1.0.0</Text>
        <Text style={styles.appPowered}>Powered by Gemini 3 Pro</Text>
        <Text style={styles.appCopyright}>© 2025 BuildSight. All rights reserved.</Text>
      </View>

      {/* Currency Selection Modal */}
      <Modal
        visible={currencyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            {currencyOptions.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  index < currencyOptions.length - 1 && styles.modalOptionBorder,
                  settings.currency === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => handleCurrencySelect(option.value)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    settings.currency === option.value && styles.modalOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {settings.currency === option.value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setCurrencyModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: darkTheme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  settingsCard: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: darkTheme.colors.border,
    marginHorizontal: spacing.lg,
  },
  chevron: {
    fontSize: fontSize['2xl'],
    color: darkTheme.colors.textMuted,
    fontWeight: '300',
  },
  dangerText: {
    color: colors.danger[500],
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  appVersion: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.xs,
  },
  appPowered: {
    fontSize: fontSize.xs,
    color: colors.primary[400],
    marginBottom: spacing.xs,
  },
  appCopyright: {
    fontSize: fontSize.xs,
    color: darkTheme.colors.textMuted,
    opacity: 0.7,
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
    maxWidth: 340,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: darkTheme.colors.text,
    textAlign: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  modalOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  modalOptionSelected: {
    backgroundColor: colors.primary[500] + '20',
  },
  modalOptionText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.text,
  },
  modalOptionTextSelected: {
    color: colors.primary[400],
    fontWeight: '600',
  },
  checkmark: {
    fontSize: fontSize.lg,
    color: colors.primary[400],
    fontWeight: '600',
  },
  modalCancel: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.border,
    marginTop: spacing.xs,
  },
  modalCancelText: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
    textAlign: 'center',
  },
});
