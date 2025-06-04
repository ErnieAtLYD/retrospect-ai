import { jest } from '@jest/globals';

// Mock the obsidian module
jest.mock('obsidian');

declare const global: {
  window: Window & typeof globalThis;
};

// Mock the global window object
const mockWindow = {
  ...global.window,
  matchMedia: jest.fn().mockImplementation((query: unknown) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
} as unknown as Window & typeof globalThis;

global.window = mockWindow;
