// Mock for @react-native-async-storage/async-storage

const storage: Map<string, string> = new Map();

const AsyncStorage = {
  getItem: jest.fn((key: string) => {
    return Promise.resolve(storage.get(key) || null);
  }),

  setItem: jest.fn((key: string, value: string) => {
    storage.set(key, value);
    return Promise.resolve();
  }),

  removeItem: jest.fn((key: string) => {
    storage.delete(key);
    return Promise.resolve();
  }),

  clear: jest.fn(() => {
    storage.clear();
    return Promise.resolve();
  }),

  getAllKeys: jest.fn(() => {
    return Promise.resolve(Array.from(storage.keys()));
  }),

  multiGet: jest.fn((keys: string[]) => {
    const result = keys.map((key) => [key, storage.get(key) || null]);
    return Promise.resolve(result);
  }),

  multiSet: jest.fn((keyValuePairs: [string, string][]) => {
    keyValuePairs.forEach(([key, value]) => storage.set(key, value));
    return Promise.resolve();
  }),

  multiRemove: jest.fn((keys: string[]) => {
    keys.forEach((key) => storage.delete(key));
    return Promise.resolve();
  }),

  // Helper for tests to reset storage
  __resetStorage: () => {
    storage.clear();
  },

  // Helper to inspect storage in tests
  __getStorage: () => storage,
};

export default AsyncStorage;
