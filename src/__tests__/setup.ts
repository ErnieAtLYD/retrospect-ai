// Jest setup file
import { jest } from "@jest/globals";
import { RetrospectAISettings } from "../types";

declare const global: {
	window: Window & typeof globalThis;
};

// Mock the global window object
global.window = Object.create(window);

// Mock createRoot from react-dom/client
jest.mock("react-dom/client", () => ({
	createRoot: jest.fn().mockReturnValue({
		render: jest.fn(),
		unmount: jest.fn(),
	}),
}));

// Mock React
jest.mock("react", () => ({
	...jest.requireActual("react"),
	useState: jest
		.fn()
		.mockImplementation((initialValue: any) => [initialValue, jest.fn()]),
	useEffect: jest.fn().mockImplementation((fn: () => void) => fn()),
	createElement: jest.fn(),
	StrictMode: ({ children }: { children: any }) => children,
}));

// Mock the MarkdownView class
export class MockMarkdownView {
	constructor() {}
}

// Mock the Notice class
export const MockNotice = jest.fn().mockImplementation((message: string) => ({
	hide: jest.fn()
}));

// Mock the Editor class
export class MockEditor {
	getValue() {}
	setValue() {}
}

// Mock Plugin class
export class MockPlugin {
	saveData: (data: any) => Promise<void>;
	loadData: () => Promise<any>;

	constructor(app: any) {
		// Initialize with basic mock functions
		this.saveData = async () => {};
		this.loadData = async () => ({});
	}
}

// Mock SettingsTab class that avoids DOM operations
export class SettingsTab {
	settings: RetrospectAISettings;
	plugin: MockPlugin;

	constructor(app: any, plugin: any, settings: RetrospectAISettings) {
		this.settings = settings;
		this.plugin = plugin as MockPlugin;
	}

	display(): void {
		// Simplified display without DOM operations
	}

	async saveSettings(): Promise<void> {
		await this.plugin.saveData(this.settings);
	}

	loadSettings(): RetrospectAISettings {
		return this.settings;
	}
}

// Mock Obsidian
jest.mock('obsidian', () => ({
  ItemView: class {
    leaf: any;
    constructor(leaf: any) {
      this.leaf = leaf;
    }
  },
  Leaf: class {
    view: any;
    constructor(view: any) {
      this.view = view;
    }
    openFile = jest.fn().mockResolvedValue(undefined);
  },
  Notice: jest.fn().mockImplementation((message: string) => ({
    message,
    hide: jest.fn(),
  })),
  App: class {
    vault = {
      getMarkdownFiles: jest.fn().mockReturnValue([]),
      read: jest.fn().mockResolvedValue(""),
      create: jest.fn().mockResolvedValue(undefined),
      createFolder: jest.fn().mockResolvedValue(undefined),
      getAbstractFileByPath: jest.fn().mockReturnValue(null),
      adapter: jest.fn(),
      configDir: jest.fn(),
      getName: jest.fn().mockReturnValue('MockVault'),
      getFileByPath: jest.fn().mockReturnValue(null),
    };
    workspace = {
      getActiveFile: jest.fn().mockReturnValue(null),
      getActiveViewOfType: jest.fn().mockReturnValue(null),
      getLeavesOfType: jest.fn().mockReturnValue([]),
      getRightLeaf: jest.fn().mockReturnValue({
        setViewState: jest.fn().mockResolvedValue(undefined),
      }),
      revealLeaf: jest.fn(),
      onLayoutReady: jest.fn().mockImplementation((callback: () => void) => callback()),
      getLeaf: jest.fn().mockReturnValue({
        openFile: jest.fn(),
      }),
      leftSplit: jest.fn(),
      rightSplit: jest.fn(),
      leftRibbon: jest.fn(),
      rightRibbon: jest.fn(),
    };
    statusBar = {
      addStatusBarItem: jest.fn().mockReturnValue({
        setText: jest.fn(),
        remove: jest.fn(),
      }),
    };
  },
  Editor: class {
    getValue = jest.fn().mockReturnValue("");
    setValue = jest.fn();
    replaceRange = jest.fn();
    getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
  },
  MarkdownView: class {
    editor: any;
    file: any;
    constructor(file: any = null) {
      this.editor = new (jest.requireMock('obsidian').Editor)();
      this.file = file;
    }
  },
  TFile: class {
    constructor(
      public path: string,
      public basename: string,
      public content: string = ""
    ) {}
  }
}));
