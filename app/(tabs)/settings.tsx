import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { styles } from '@/styles/settingsStyles';
import { ProfileModal } from '@/components/settings/ProfileModal';
import { CreditBadge } from '@/components/credits/CreditBadge';
import { useCredits } from '@/contexts/CreditsContext';
import { colors, darkTheme } from '@/constants/theme';
import { CountryCode, CurrencyCode, getCountryList, COUNTRIES } from '@/constants/countries';
import { resetDbAsync } from '@/data/db';
import { deleteAllAppFilesAsync } from '@/data/files';
import { defaultProfile, loadProfileAsync, ProfileData, saveProfileAsync } from '@/data/profile';
import { listAllEstimatesAsync } from '@/data/repos/estimatesRepo';
import { listJobsAsync } from '@/data/repos/jobsRepo';
import { listAllPhotosAsync } from '@/data/repos/photosRepo';
import { listAllTasksAsync } from '@/data/repos/tasksRepo';
import { defaultSettings, ESTIMATE_DRAFT_KEY, loadSettingsAsync, SETTINGS_KEY, SettingsData } from '@/data/settings';
import { isApiKeyConfigured } from '@/services/geminiService';
import { exportJsonAndShareAsync } from '@/utils/exportDownload';

const currencyOptions: Array<{ label: string; value: CurrencyCode }> = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'BRL (R$)', value: 'BRL' },
];

const countryList = getCountryList();

export default function SettingsScreen() {
  const router = useRouter();
  const { credits, planType, isBackendConfigured } = useCredits();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isBusy, setIsBusy] = useState(false);

  // Get plan display name
  const getPlanDisplayName = () => {
    switch (planType) {
      case 'pro_monthly':
        return 'Pro Monthly';
      case 'pack10':
        return 'Credit Pack';
      case 'single':
        return 'Pay-as-you-go';
      default:
        return isBackendConfigured ? 'Free Plan' : 'Direct Mode';
    }
  };

  // Load settings on mount
  useEffect(() => {
    (async () => {
      const [s, p] = await Promise.all([loadSettingsAsync(), loadProfileAsync()]);
      setSettings(s);
      setProfile(p);
      setIsLoading(false);
    })();
  }, []);

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

  const handleCurrencySelect = (value: CurrencyCode) => {
    saveSetting('currency', value);
    setCurrencyModalVisible(false);
  };

  const handleCountrySelect = (code: CountryCode) => {
    const countryConfig = COUNTRIES[code];
    // Update country and auto-set currency to match
    saveSetting('country', code);
    saveSetting('currency', countryConfig.currency);
    setCountryModalVisible(false);
  };

  const getCurrencyLabel = () => {
    switch (settings.currency) {
      case 'USD': return 'USD ($)';
      case 'EUR': return 'EUR (€)';
      case 'GBP': return 'GBP (£)';
      case 'BRL': return 'BRL (R$)';
      default: return 'EUR (€)';
    }
  };

  const getCountryLabel = () => {
    const country = COUNTRIES[settings.country];
    return country ? `${country.flag} ${country.name}` : '🇩🇪 Germany';
  };

  const profileSubtitle = useMemo(() => {
    if (!profile.companyName && !profile.contactEmail && !profile.contactPhone) return 'Not set';
    return profile.companyName || profile.contactEmail || profile.contactPhone;
  }, [profile.companyName, profile.contactEmail, profile.contactPhone]);

  const handleSaveProfile = async (p: ProfileData) => {
    try {
      await saveProfileAsync(p);
      setProfile(p);
      setProfileModalVisible(false);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save profile.');
    }
  };

  const handleExport = async () => {
    try {
      setIsBusy(true);
      const [jobs, estimates, photos, tasks] = await Promise.all([
        listJobsAsync(),
        listAllEstimatesAsync(),
        listAllPhotosAsync(),
        listAllTasksAsync(),
      ]);

      const exportJson = {
        exportedAt: new Date().toISOString(),
        settings,
        profile,
        jobs,
        estimates,
        photos,
        tasks,
      };
      await exportJsonAndShareAsync({
        baseName: 'buildsight_export',
        json: exportJson,
        dialogTitle: 'Export BuildSight Data',
      });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to export data.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear local data?',
      'This deletes local photos/PDFs and resets the local database. Settings will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsBusy(true);
              await deleteAllAppFilesAsync();
              await resetDbAsync();
              await AsyncStorage.removeItem(ESTIMATE_DRAFT_KEY);
              Alert.alert('Done', 'Local cache cleared.');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to clear cache.');
            } finally {
              setIsBusy(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      overScrollMode="always"
    >
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
          <Pressable
            style={styles.settingRow}
            onPress={() =>
              Alert.alert(
                'AI Model',
                `Model: gemini-3-pro-preview\nAPI key: ${isApiKeyConfigured() ? 'configured' : 'missing'}`
              )
            }
          >
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
          <Pressable style={styles.settingRow} onPress={() => setCountryModalVisible(true)}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Country/Region</Text>
              <Text style={styles.settingDescription}>{getCountryLabel()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => setCurrencyModalVisible(true)}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Currency</Text>
              <Text style={styles.settingDescription}>{getCurrencyLabel()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.settingRow}
            onPress={() => Alert.alert('Coming soon', 'Language selection is not implemented yet.')}
          >
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
          <Pressable style={styles.settingRow} onPress={() => setProfileModalVisible(true)}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Profile</Text>
              <Text style={styles.settingDescription}>{profileSubtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.settingRow}
            onPress={() => router.push('/subscription')}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Subscription</Text>
              <Text style={styles.settingDescription}>
                {getPlanDisplayName()} {isBackendConfigured ? `• ${credits} credits` : ''}
              </Text>
            </View>
            {isBackendConfigured && <CreditBadge size="small" pressable={false} />}
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.settingsCard}>
          <Pressable style={styles.settingRow} onPress={handleExport} disabled={isBusy}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Export Data</Text>
              <Text style={styles.settingDescription}>Download your estimates and projects</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={handleClearCache} disabled={isBusy}>
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

      {/* Country Selection Modal */}
      <Modal
        visible={countryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country/Region</Text>
            <Text style={styles.modalSubtitle}>Used for regional pricing in estimates</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {countryList.map((country, index) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.modalOption,
                    index < countryList.length - 1 && styles.modalOptionBorder,
                    settings.country === country.code && styles.modalOptionSelected,
                  ]}
                  onPress={() => handleCountrySelect(country.code)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      settings.country === country.code && styles.modalOptionTextSelected,
                    ]}
                  >
                    {country.flag} {country.name}
                  </Text>
                  {settings.country === country.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setCountryModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ProfileModal
        visible={profileModalVisible}
        profile={profile}
        onClose={() => setProfileModalVisible(false)}
        onSave={handleSaveProfile}
      />
    </ScrollView>
  );
}
