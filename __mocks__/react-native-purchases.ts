// Mock for react-native-purchases (RevenueCat SDK)

export const LOG_LEVEL = {
  VERBOSE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};

export const PURCHASE_TYPE = {
  INAPP: 'inapp',
  SUBS: 'subs',
};

// Mock customer info
export const mockCustomerInfo = {
  entitlements: {
    active: {},
    all: {},
  },
  activeSubscriptions: [],
  allPurchasedProductIdentifiers: [],
  latestExpirationDate: null,
  firstSeen: new Date().toISOString(),
  originalAppUserId: 'test-user-id',
  requestDate: new Date().toISOString(),
  allExpirationDates: {},
  allPurchaseDates: {},
  originalApplicationVersion: null,
  originalPurchaseDate: null,
  managementURL: null,
  nonSubscriptionTransactions: [],
};

// Mock offering
export const mockOffering = {
  identifier: 'default',
  serverDescription: 'Default offering',
  availablePackages: [
    {
      identifier: 'buildsight_credit_single',
      packageType: 'CUSTOM',
      product: {
        identifier: 'buildsight_credit_single',
        description: '1 Credit for AI estimates',
        title: '1 Credit',
        price: 0.99,
        priceString: '$0.99',
        currencyCode: 'USD',
      },
      offeringIdentifier: 'default',
    },
    {
      identifier: 'buildsight_credit_pack10',
      packageType: 'CUSTOM',
      product: {
        identifier: 'buildsight_credit_pack10',
        description: '10 Credits for AI estimates',
        title: '10 Credits',
        price: 7.99,
        priceString: '$7.99',
        currencyCode: 'USD',
      },
      offeringIdentifier: 'default',
    },
    {
      identifier: 'buildsight_pro_monthly',
      packageType: 'MONTHLY',
      product: {
        identifier: 'buildsight_pro_monthly',
        description: '50 Credits per month',
        title: 'Pro Monthly',
        price: 19.99,
        priceString: '$19.99',
        currencyCode: 'USD',
        subscriptionPeriod: 'P1M',
      },
      offeringIdentifier: 'default',
    },
  ],
  lifetime: null,
  annual: null,
  sixMonth: null,
  threeMonth: null,
  twoMonth: null,
  monthly: null,
  weekly: null,
};

// Mock offerings
export const mockOfferings = {
  current: mockOffering,
  all: {
    default: mockOffering,
  },
};

// Mock functions
const configure = jest.fn().mockResolvedValue(undefined);
const setLogLevel = jest.fn();
const getOfferings = jest.fn().mockResolvedValue(mockOfferings);
const getCustomerInfo = jest.fn().mockResolvedValue(mockCustomerInfo);
const purchasePackage = jest.fn().mockResolvedValue({
  customerInfo: mockCustomerInfo,
  productIdentifier: 'buildsight_credit_single',
});
const restorePurchases = jest.fn().mockResolvedValue(mockCustomerInfo);
const logIn = jest.fn().mockResolvedValue({
  customerInfo: mockCustomerInfo,
  created: false,
});
const logOut = jest.fn().mockResolvedValue(mockCustomerInfo);
const getAppUserID = jest.fn().mockReturnValue('test-app-user-id');
const isConfigured = jest.fn().mockReturnValue(true);

// Default export (matches the actual module structure)
const Purchases = {
  configure,
  setLogLevel,
  getOfferings,
  getCustomerInfo,
  purchasePackage,
  restorePurchases,
  logIn,
  logOut,
  getAppUserID,
  isConfigured,
  LOG_LEVEL,
  PURCHASE_TYPE,
};

export default Purchases;

// Named exports for convenience in tests
export {
  configure,
  setLogLevel,
  getOfferings,
  getCustomerInfo,
  purchasePackage,
  restorePurchases,
  logIn,
  logOut,
  getAppUserID,
  isConfigured,
};
