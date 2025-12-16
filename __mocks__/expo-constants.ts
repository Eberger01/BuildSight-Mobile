// Mock for expo-constants

const Constants = {
  appOwnership: 'standalone', // 'expo' for Expo Go, 'standalone' for dev builds
  expoConfig: {
    name: 'BuildSight',
    slug: 'buildsight',
    version: '1.0.0',
    extra: {},
  },
  manifest: {
    name: 'BuildSight',
    slug: 'buildsight',
  },
  executionEnvironment: 'storeClient',
  isDevice: true,
  platform: {
    ios: undefined,
    android: {
      versionCode: 1,
    },
  },
  sessionId: 'test-session-id',
  statusBarHeight: 24,
  systemFonts: [],
  deviceName: 'Test Device',

  // Helper to change appOwnership for tests
  __setAppOwnership: (value: string) => {
    Constants.appOwnership = value;
  },
};

export default Constants;
