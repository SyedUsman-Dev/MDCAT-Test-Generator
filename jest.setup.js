// jest.setup.js - Global Jest configuration and setup
global.console = {
  ...console,
  // Uncomment to ignore a specific log level
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set longer timeout for all tests
jest.setTimeout(60000);

// Mock fetch globally for tests
if (process.env.NODE_ENV === 'test') {
  global.fetch = jest.fn();
  
  // Set test environment variables
  process.env.GEMINI_API_KEY = 'test-key-12345';
  process.env.NODE_ENV = 'test';
}