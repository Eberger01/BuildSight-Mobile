/**
 * Subscription Screen
 * Purchase credits and manage subscription
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { borderRadius, colors, darkTheme, fontSize, spacing } from '@/constants/theme';
import { useCredits } from '@/contexts/CreditsContext';
import { restorePurchases as restorePurchasesBackend } from '@/services/creditsService';
import {
  getCreditsForProduct,
  getPackages,
  isPurchasesAvailable,
  PRODUCTS,
  purchasePackage,
  restorePurchases as restorePurchasesRC,
} from '@/services/purchaseService';
import { DEFAULT_PRICING, PricingPackage } from '@/types/credits';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    credits,
    planType,
    dailyUsage,
    dailyLimit,
    isLoading: creditsLoading,
    refreshCredits,
    isPurchasesAvailable: purchasesAvailable,
  } = useCredits();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load available packages from RevenueCat
   */
  const loadPackages = useCallback(async () => {
    if (!isPurchasesAvailable()) {
      setIsLoadingPackages(false);
      return;
    }

    try {
      setIsLoadingPackages(true);
      const pkgs = await getPackages();

      // Sort packages: single credit first, then pack10, then subscription
      const sortedPkgs = pkgs.sort((a, b) => {
        const aId = a.product.identifier;
        const bId = b.product.identifier;

        if (aId.includes('single')) return -1;
        if (bId.includes('single')) return 1;
        if (aId.includes('pack10')) return -1;
        if (bId.includes('pack10')) return 1;
        return 0;
      });

      setPackages(sortedPkgs);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setIsLoadingPackages(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  /**
   * Handle refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadPackages(), refreshCredits()]);
    setRefreshing(false);
  }, [loadPackages, refreshCredits]);

  /**
   * Handle purchase
   */
  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      setIsPurchasing(true);
      await purchasePackage(pkg);
      await refreshCredits();

      const creditsAdded = getCreditsForProduct(pkg.product.identifier);
      Alert.alert(
        t('subscription.purchaseSuccess', 'Purchase Successful!'),
        t('subscription.creditsAdded', { count: creditsAdded }),
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      if (error.message === 'PURCHASE_CANCELLED') {
        // User cancelled - no alert needed
        return;
      }
      Alert.alert(t('subscription.purchaseFailed', 'Purchase Failed'), error.message || t('errors.genericError'));
    } finally {
      setIsPurchasing(false);
    }
  };

  /**
   * Handle restore purchases
   */
  const handleRestore = async () => {
    try {
      setIsRestoring(true);

      // Restore from RevenueCat
      if (isPurchasesAvailable()) {
        await restorePurchasesRC();
      }

      // Sync with backend
      await restorePurchasesBackend();
      await refreshCredits();

      Alert.alert(t('subscription.restoreComplete', 'Restore Complete'), t('subscription.purchasesRestored', 'Your purchases have been restored.'), [{ text: t('common.ok') }]);
    } catch (error: any) {
      Alert.alert(t('subscription.restoreFailed', 'Restore Failed'), error.message || t('subscription.failedRestore', 'Failed to restore purchases.'));
    } finally {
      setIsRestoring(false);
    }
  };

  /**
   * Get plan display name
   */
  const getPlanDisplayName = () => {
    switch (planType) {
      case 'pro_monthly':
        return t('settings.plans.proMonthly');
      case 'pack10':
        return t('settings.plans.creditPack');
      case 'single':
        return t('settings.plans.payAsYouGo');
      default:
        return t('settings.plans.freePlan');
    }
  };

  /**
   * Render pricing card for RevenueCat package
   */
  const renderPackageCard = (pkg: PurchasesPackage) => {
    const productId = pkg.product.identifier;
    const creditsAmount = getCreditsForProduct(productId);
    const isSubscription = productId.includes('monthly');
    const isMostPopular = productId === PRODUCTS.PACK_10;

    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={[styles.pricingCard, isMostPopular && styles.popularCard]}
        onPress={() => handlePurchase(pkg)}
        disabled={isPurchasing}
      >
        {isMostPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>{t('subscription.mostPopular', 'Most Popular')}</Text>
          </View>
        )}

        <Text style={styles.cardTitle}>{pkg.product.title || productId}</Text>
        <Text style={styles.cardCredits}>
          {creditsAmount} {creditsAmount > 1 ? t('subscription.credits') : t('subscription.credit', 'Credit')}
          {isSubscription ? t('subscription.perMonth') : ''}
        </Text>
        <Text style={styles.cardPrice}>{pkg.product.priceString}</Text>
        {pkg.product.description && (
          <Text style={styles.cardDescription}>{pkg.product.description}</Text>
        )}

        <View style={[styles.buyButton, isMostPopular && styles.popularBuyButton]}>
          <Text style={styles.buyButtonText}>
            {isSubscription ? t('subscription.subscribe', 'Subscribe') : t('subscription.buyNow', 'Buy Now')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render fallback pricing card (when RevenueCat not available)
   */
  const renderFallbackCard = (pricing: PricingPackage) => {
    return (
      <View key={pricing.id} style={[styles.pricingCard, pricing.isMostPopular && styles.popularCard]}>
        {pricing.isMostPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>{t('subscription.mostPopular', 'Most Popular')}</Text>
          </View>
        )}

        <Text style={styles.cardTitle}>{pricing.name}</Text>
        <Text style={styles.cardCredits}>
          {pricing.credits} {pricing.credits > 1 ? t('subscription.credits') : t('subscription.credit', 'Credit')}
          {pricing.isSubscription ? t('subscription.perMonth') : ''}
        </Text>
        <Text style={styles.cardPrice}>
          {pricing.currency} {pricing.price}
        </Text>
        {pricing.savings && <Text style={styles.savingsText}>{pricing.savings}</Text>}

        <View style={styles.unavailableButton}>
          <Text style={styles.unavailableButtonText}>
            {Platform.OS === 'web'
              ? t('subscription.useMobileApp', 'Use Mobile App')
              : t('common.comingSoon')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={darkTheme.colors.text} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('subscription.title')}</Text>
          <Text style={styles.subtitle}>{t('subscription.subtitle')}</Text>
        </View>

        {/* Current Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>{t('subscription.currentBalance')}</Text>
              <Text style={styles.balanceValue}>
                {creditsLoading ? '...' : credits} {t('subscription.credits')}
              </Text>
            </View>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{getPlanDisplayName()}</Text>
            </View>
          </View>

          <View style={styles.usageRow}>
            <Text style={styles.usageText}>
              {t('subscription.todayUsage', { used: dailyUsage, limit: dailyLimit })}
            </Text>
            <View style={styles.usageBar}>
              <View
                style={[
                  styles.usageBarFill,
                  { width: `${Math.min((dailyUsage / dailyLimit) * 100, 100)}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Web Platform Notice */}
        {Platform.OS === 'web' && (
          <View style={styles.webNotice}>
            <Text style={styles.webNoticeText}>
              {t('subscription.webNotice')}
            </Text>
          </View>
        )}

        {/* Pricing Cards */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionTitle}>{t('subscription.purchaseCredits')}</Text>

          {isLoadingPackages ? (
            <ActivityIndicator size="large" color={colors.primary[500]} style={styles.loader} />
          ) : packages.length > 0 ? (
            <View style={styles.pricingGrid}>
              {packages.map(renderPackageCard)}
            </View>
          ) : (
            <View style={styles.pricingGrid}>
              {DEFAULT_PRICING.map(renderFallbackCard)}
            </View>
          )}
        </View>

        {/* Restore Purchases */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator size="small" color={colors.primary[500]} />
          ) : (
            <Text style={styles.restoreButtonText}>{t('subscription.restorePurchases')}</Text>
          )}
        </TouchableOpacity>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('subscription.howCreditsWork')}</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>1</Text>
            <Text style={styles.infoText}>{t('subscription.creditInfo1')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>2</Text>
            <Text style={styles.infoText}>{t('subscription.creditInfo2')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>3</Text>
            <Text style={styles.infoText}>{t('subscription.creditInfo3')}</Text>
          </View>
        </View>

        {/* Loading Overlay */}
        {isPurchasing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.loadingText}>{t('subscription.processingPurchase')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: darkTheme.colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
  },
  balanceCard: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.xs,
  },
  balanceValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.primary[500],
  },
  planBadge: {
    backgroundColor: colors.primary[500] + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  planBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary[500],
  },
  usageRow: {
    marginTop: spacing.sm,
  },
  usageText: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.xs,
  },
  usageBar: {
    height: 4,
    backgroundColor: darkTheme.colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
  },
  webNotice: {
    backgroundColor: colors.accent[500] + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  webNoticeText: {
    fontSize: fontSize.sm,
    color: colors.accent[500],
    textAlign: 'center',
  },
  pricingSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  pricingGrid: {
    gap: spacing.md,
  },
  pricingCard: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    alignItems: 'center',
  },
  popularCard: {
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  popularBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: darkTheme.colors.text,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardCredits: {
    fontSize: fontSize.md,
    color: darkTheme.colors.textMuted,
    marginBottom: spacing.sm,
  },
  cardPrice: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.primary[500],
    marginBottom: spacing.sm,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  savingsText: {
    fontSize: fontSize.sm,
    color: colors.success[500],
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  buyButton: {
    backgroundColor: darkTheme.colors.cardElevated,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  popularBuyButton: {
    backgroundColor: colors.primary[500],
  },
  buyButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: darkTheme.colors.text,
  },
  unavailableButton: {
    backgroundColor: darkTheme.colors.cardElevated,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    width: '100%',
    alignItems: 'center',
    opacity: 0.6,
  },
  unavailableButtonText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: darkTheme.colors.textMuted,
  },
  restoreButton: {
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  restoreButtonText: {
    fontSize: fontSize.md,
    color: colors.primary[500],
    textDecorationLine: 'underline',
  },
  infoSection: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  infoTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: darkTheme.colors.text,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[500] + '20',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.primary[500],
    marginRight: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: darkTheme.colors.textMuted,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: darkTheme.colors.background + 'E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: darkTheme.colors.text,
  },
});
