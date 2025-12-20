import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
import { LANGUAGE_OPTIONS, LanguageCode, changeLanguage } from '@/i18n';
import i18n from '@/i18n';

const currencyOptions: Array<{ label: string; value: CurrencyCode }> = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'BRL (R$)', value: 'BRL' },
];

const countryList = getCountryList();

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { credits, planType, isBackendConfigured } = useCredits();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isBusy, setIsBusy] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(i18n.language as LanguageCode || 'en');

  // Get plan display name
  const getPlanDisplayName = () => {
    switch (planType) {
      case 'pro_monthly':
        return t('settings.plans.proMonthly');
      case 'pack10':
        return t('settings.plans.creditPack');
      case 'single':
        return t('settings.plans.payAsYouGo');
      default:
        return isBackendConfigured ? t('settings.plans.freePlan') : t('settings.plans.directMode');
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
      Alert.alert(t('common.error'), t('settings.errorSaveSetting'));
    }
  };

  const saveMultipleSettings = async (updates: Partial<SettingsData>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert(t('common.error'), t('settings.errorSaveSetting'));
    }
  };

  const handlePhotoQualityPress = () => {
    const options: Array<{ label: string; value: 'high' | 'medium' | 'low' }> = [
      { label: t('settings.photoQualityHigh'), value: 'high' },
      { label: t('settings.photoQualityMedium'), value: 'medium' },
      { label: t('settings.photoQualityLow'), value: 'low' },
    ];

    Alert.alert(
      t('settings.photoQuality'),
      t('settings.selectPhotoQuality'),
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => saveSetting('photoQuality', option.value),
        })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ]
    );
  };

  const getPhotoQualityLabel = () => {
    switch (settings.photoQuality) {
      case 'high': return t('settings.photoQualityHigh');
      case 'medium': return t('settings.photoQualityMedium');
      case 'low': return t('settings.photoQualityLow');
      default: return t('settings.photoQualityHigh');
    }
  };

  const handleCurrencySelect = (value: CurrencyCode) => {
    saveSetting('currency', value);
    setCurrencyModalVisible(false);
  };

  const handleCountrySelect = (code: CountryCode) => {
    const countryConfig = COUNTRIES[code];
    // Update country and auto-set currency to match (save both at once to avoid race condition)
    saveMultipleSettings({
      country: code,
      currency: countryConfig.currency,
    });
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

  const getLanguageLabel = () => {
    const lang = LANGUAGE_OPTIONS.find(l => l.code === currentLanguage);
    return lang ? lang.native : 'English';
  };

  const handleLanguageSelect = async (code: LanguageCode) => {
    try {
      await changeLanguage(code);
      setCurrentLanguage(code);
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert(t('common.error'), t('errors.saveFailed'));
    }
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
      t('settings.clearCacheConfirm'),
      t('settings.clearCacheWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsBusy(true);
              await deleteAllAppFilesAsync();
              await resetDbAsync();
              await AsyncStorage.removeItem(ESTIMATE_DRAFT_KEY);
              Alert.alert(t('settings.cacheClearedTitle'), t('settings.cacheClearedMsg'));
            } catch (e) {
              Alert.alert(t('common.error'), e instanceof Error ? e.message : t('errors.genericError'));
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
        <Text style={styles.loadingText}>{t('settings.loadingSettings')}</Text>
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
        <Text style={styles.sectionTitle}>{t('settings.aiSettings')}</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.aiEnabled')}</Text>
              <Text style={styles.settingDescription}>{t('settings.aiEnabledDesc')}</Text>
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
                t('settings.aiModel'),
                `Model: ${t('settings.aiModelName')}\nAPI key: ${isApiKeyConfigured() ? t('settings.apiKeyConfigured') : t('settings.apiKeyMissing')}`
              )
            }
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.aiModel')}</Text>
              <Text style={styles.settingDescription}>{t('settings.aiModelName')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Camera Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.camera')}</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.autoUpload')}</Text>
              <Text style={styles.settingDescription}>{t('settings.autoUploadDesc')}</Text>
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
              <Text style={styles.settingLabel}>{t('settings.photoQuality')}</Text>
              <Text style={styles.settingDescription}>{getPhotoQualityLabel()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.pushNotifications')}</Text>
              <Text style={styles.settingDescription}>{t('settings.pushNotificationsDesc')}</Text>
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
        <Text style={styles.sectionTitle}>{t('settings.appSettings')}</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.autoSave')}</Text>
              <Text style={styles.settingDescription}>{t('settings.autoSaveDesc')}</Text>
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
              <Text style={styles.settingLabel}>{t('settings.country')}</Text>
              <Text style={styles.settingDescription}>{getCountryLabel()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={() => setCurrencyModalVisible(true)}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.currency')}</Text>
              <Text style={styles.settingDescription}>{getCurrencyLabel()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.settingRow}
            onPress={() => setLanguageModalVisible(true)}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.language')}</Text>
              <Text style={styles.settingDescription}>{getLanguageLabel()}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        <View style={styles.settingsCard}>
          <Pressable style={styles.settingRow} onPress={() => setProfileModalVisible(true)}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.profile')}</Text>
              <Text style={styles.settingDescription}>{profileSubtitle === 'Not set' ? t('common.notSet') : profileSubtitle}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.settingRow}
            onPress={() => router.push('/subscription')}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.subscription')}</Text>
              <Text style={styles.settingDescription}>
                {getPlanDisplayName()} {isBackendConfigured ? `• ${credits} ${t('settings.credits')}` : ''}
              </Text>
            </View>
            {isBackendConfigured && <CreditBadge size="small" pressable={false} />}
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
        <View style={styles.settingsCard}>
          <Pressable style={styles.settingRow} onPress={handleExport} disabled={isBusy}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{t('settings.exportData')}</Text>
              <Text style={styles.settingDescription}>{t('settings.exportDataDesc')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.settingRow} onPress={handleClearCache} disabled={isBusy}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, styles.dangerText]}>{t('settings.clearCache')}</Text>
              <Text style={styles.settingDescription}>{t('settings.clearCacheDesc')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>{t('settings.appVersion')}</Text>
        <Text style={styles.appPowered}>{t('settings.poweredBy')}</Text>
        <Text style={styles.appCopyright}>{t('settings.copyright')}</Text>
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
            <Text style={styles.modalTitle}>{t('settings.selectCurrency')}</Text>
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
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
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
            <Text style={styles.modalTitle}>{t('settings.selectCountry')}</Text>
            <Text style={styles.modalSubtitle}>{t('settings.countryUsedFor')}</Text>
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
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
            {LANGUAGE_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.code}
                style={[
                  styles.modalOption,
                  index < LANGUAGE_OPTIONS.length - 1 && styles.modalOptionBorder,
                  currentLanguage === option.code && styles.modalOptionSelected,
                ]}
                onPress={() => handleLanguageSelect(option.code)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    currentLanguage === option.code && styles.modalOptionTextSelected,
                  ]}
                >
                  {option.native} ({option.label})
                </Text>
                {currentLanguage === option.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
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
