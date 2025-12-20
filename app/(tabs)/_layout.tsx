import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { darkTheme } from '@/constants/theme';

// Tab bar icon component
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // Add extra padding for Android gesture navigation bar
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: darkTheme.colors.tabBarActive,
        tabBarInactiveTintColor: darkTheme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: darkTheme.colors.tabBar,
          borderTopColor: darkTheme.colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: 57 + bottomPadding,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: darkTheme.colors.background,
        },
        headerTintColor: darkTheme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
          headerTitle: 'BuildSight',
        }}
      />
      <Tabs.Screen
        name="estimate"
        options={{
          title: t('tabs.estimate'),
          tabBarIcon: ({ color }) => <TabBarIcon name="calculator" color={color} />,
          headerTitle: t('estimate.title'),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: t('tabs.jobs'),
          tabBarIcon: ({ color }) => <TabBarIcon name="briefcase" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: t('tabs.gallery'),
          tabBarIcon: ({ color }) => <TabBarIcon name="image" color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
          headerTitle: t('settings.title'),
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          title: t('tabs.credits'),
          tabBarIcon: ({ color }) => <TabBarIcon name="diamond" color={color} />,
          headerTitle: t('subscription.purchaseCredits'),
        }}
      />
    </Tabs>
  );
}
