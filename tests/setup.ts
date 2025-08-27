/**
 * Test setup and configuration
 */

import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'ERROR'; // Reduce noise during tests

// Mock console methods to reduce test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Clean up after tests
afterAll(() => {
  jest.clearAllMocks();
});