// src/__mocks__/obsidian.ts

import { jest } from '@jest/globals';

// Mock ItemView and WorkspaceLeaf classes (these need to be actual classes, not just functions)
export class ItemView {
  leaf: any;
  containerEl: any = {
    children: [null, document.createElement('div')],
    empty: jest.fn(),
  };
  app: any = {};

  constructor(leaf: any) {
    this.leaf = leaf;
  }

  getViewType(): string {
    return 'mock-view';
  }

  getDisplayText(): string {
    return 'Mock View';
  }

  onOpen(): Promise<void> {
    return Promise.resolve();
  }

  onClose(): Promise<void> {
    return Promise.resolve();
  }
}

export class WorkspaceLeaf {
  view: any = null;
  
  constructor() {}
  
  getViewState() {
    return {};
  }
  
  setViewState() {
    return Promise.resolve();
  }
}

export class Notice {
  message: string;
  
  constructor(message: string) {
    this.message = message;
  }
  
  close = jest.fn();
}

export class Plugin {
  constructor(app: any, manifest: any) {}
  loadData() { return Promise.resolve({}); }
  saveData() { return Promise.resolve(); }
  addSettingTab() {}
  registerView() {}
  addRibbonIcon() { return { setTooltip: jest.fn(), addClass: jest.fn() }; }
  addStatusBarItem() { return { setText: jest.fn(), remove: jest.fn() }; }
}

export class PluginSettingTab {
  constructor(app: any, plugin: any) {}
}

// Mock Obsidian API
const mockObsidian = {
  Plugin: jest.fn().mockImplementation((app: any, manifest: any) => new Plugin(app, manifest)),
  Notice: jest.fn().mockImplementation((message: unknown) => new Notice(message as string)),
  PluginSettingTab: jest.fn().mockImplementation((app: any, plugin: any) => new PluginSettingTab(app, plugin)),
  Setting: jest.fn(),
  TFile: jest.fn(),
  App: jest.fn().mockReturnValue({
    vault: {
      getMarkdownFiles: jest.fn().mockReturnValue([]),
      read: jest.fn().mockImplementation(() => Promise.resolve("")),
      create: jest.fn().mockImplementation(() => Promise.resolve()),
      createFolder: jest.fn().mockImplementation(() => Promise.resolve()),
      getAbstractFileByPath: jest.fn().mockReturnValue(null),
      adapter: {
        exists: jest.fn().mockResolvedValue(true),
        createFolder: jest.fn().mockResolvedValue(undefined),
        read: jest.fn().mockResolvedValue("{}"),
        write: jest.fn().mockResolvedValue(undefined),
      },
      configDir: jest.fn(),
      getName: jest.fn().mockReturnValue('MockVault'),
      getFileByPath: jest.fn().mockReturnValue(null),
    },
    workspace: {
      getActiveFile: jest.fn().mockReturnValue(null),
      getActiveViewOfType: jest.fn().mockReturnValue(null),
      getLeavesOfType: jest.fn().mockReturnValue([]),
      getRightLeaf: jest.fn().mockReturnValue({
        setViewState: jest.fn().mockImplementation(() => Promise.resolve()),
      }),
      revealLeaf: jest.fn(),
      onLayoutReady: jest.fn().mockImplementation((callback: unknown) => {
        if (typeof callback === 'function') {
          callback();
        }
        return { unsubscribe: jest.fn() };
      }),
      getLeaf: jest.fn().mockReturnValue({
        openFile: jest.fn(),
      }),
      leftSplit: jest.fn(),
      rightSplit: jest.fn(),
      leftRibbon: jest.fn(),
      rightRibbon: jest.fn(),
    },
    statusBar: {
      addStatusBarItem: jest.fn().mockReturnValue({
        setText: jest.fn(),
        remove: jest.fn(),
      }),
    },
  }),
  Vault: jest.fn(),
  Workspace: jest.fn(),
  ItemView: jest.fn().mockImplementation((leaf) => new ItemView(leaf)),
  Leaf: jest.fn().mockImplementation((props) => { return {
    view: null,
    setViewState: jest.fn(),
    openFile: jest.fn(),
  }}),
  Editor: jest.fn().mockReturnValue({
    getValue: jest.fn().mockReturnValue(""),
    setValue: jest.fn(),
    replaceRange: jest.fn(),
    getCursor: jest.fn().mockReturnValue({ line: 0, ch: 0 }),
  }),
  MarkdownView: jest.fn().mockReturnValue({
    editor: {
      getValue: jest.fn().mockReturnValue(""),
      setValue: jest.fn(),
    },
    file: null,
  }),
};

// Export the mock
export default mockObsidian;

// Mock for React components
export const mockReactRoot = {
  render: jest.fn(),
  unmount: jest.fn(),
};

// Mock for createRoot
export const mockCreateRoot = jest.fn().mockReturnValue(mockReactRoot); 
