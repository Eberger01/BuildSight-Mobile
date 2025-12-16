// Jest setup file for BuildSight Mobile

// Mock react-native Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'android',
  select: jest.fn((options) => options.android || options.default),
}));

// Global test timeout
jest.setTimeout(10000);

// Silence console warnings in tests (optional)
// console.warn = jest.fn();

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
