/**
 * Jest Configuration
 * Testing configuration for Jest
 */

// Polyfill Web APIs for Next.js 15 - must be done before nextJest loads
// Set up ReadableStream, Blob, and File FIRST before requiring undici (which depends on them)
const { ReadableStream, TransformStream } = require('web-streams-polyfill');
const { Blob } = require('blob-polyfill');
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;
global.Blob = Blob;

// File polyfill - File extends Blob
class File extends Blob {
  constructor(fileBits, fileName, options = {}) {
    super(fileBits, options);
    this.name = fileName;
    this.lastModified = options.lastModified || Date.now();
  }
}
global.File = File;

// DOMException polyfill
if (typeof DOMException === 'undefined') {
  global.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || 'DOMException';
      this.code = 0;
    }
  };
}

// Now we can safely require undici
const { Request, Response, Headers, fetch } = require('undici');

// Add other Web API polyfills
global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.fetch = fetch;

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Temporarily comment out setupFilesAfterEnv to test
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
