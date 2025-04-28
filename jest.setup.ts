import { jest } from '@jest/globals';

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

// Create minimal mocks for required Obsidian classes
const mockObsidian = {
  Plugin: class {},
  Notice: class {},
  PluginSettingTab: class {},
  Setting: class {
    setName() { return this; }
    setDesc() { return this; }
    addText() { return this; }
    addDropdown() { return this; }
  },
  TFile: class {},
  App: class {},
  Vault: class {},
  Workspace: class {},
  ItemView: class {
    leaf: { view: unknown };
    constructor(leaf: { view: unknown }) {
      this.leaf = leaf;
    }
  },
  Leaf: class {
    view: unknown;
    constructor(view: unknown) {
      this.view = view;
    }
    openFile = jest.fn().mockResolvedValue(undefined);
  },
  Editor: class {
    getValue = jest.fn().mockReturnValue("");
    setValue = jest.fn();
    replaceRange = jest.fn();
    getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
  },
  MarkdownView: class {
    editor: { getValue: () => string; setValue: (value: string) => void };
    file: { path: string; basename: string } | null;
    constructor(file: { path: string; basename: string } | null = null) {
      this.editor = new mockObsidian.Editor();
      this.file = file;
    }
  }
};

// Mock the entire obsidian module
jest.mock('obsidian', () => mockObsidian, { virtual: true }); 