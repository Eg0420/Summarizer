console.log('JEST SETUP LOADED');
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({}),
  })
) as any;

// Fix navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'node.js',
  },
  writable: true,
});

// Clean mocks
beforeEach(() => {
  jest.clearAllMocks();
});