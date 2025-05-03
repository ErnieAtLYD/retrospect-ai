// Jest setup file
import { jest } from "@jest/globals";
import { RetrospectAISettings } from "../types";
import type { ReflectionMemoryManager } from '../services/ReflectionMemoryManager'
import { App, Editor, MarkdownView, Notice, TFile, View, Workspace, Vault, StatusBar } from "obsidian"
import { Plugin } from "obsidian"
import { LogLevel } from '../services/LoggingService'


export function createMockReflectionMemoryManager(): jest.Mocked<ReflectionMemoryManager> {
	return {
	  initialize: jest.fn(),
	  cleanup:    jest.fn(),
	  // if your integration tests also touch other methods (addReflection, saveIndex, etc.), stub them here too:
	  addReflection:     jest.fn(),
	  updateReflection:  jest.fn(),
	  deleteReflection:  jest.fn(),
	  saveIndex:         jest.fn(),
	  // …and any other methods your plugin calls during onload/onunload
	} as any
  }


/**
 * Mock global window object
 * This is a mock implementation of the global window object.
 * It provides basic mock functions for the window object.
 */
declare const global: {
	window: Window & typeof globalThis;
};

// Mock the global window object
global.window = Object.create(window);


/**
 * Mock createRoot from react-dom/client
 * This is a mock implementation of the createRoot function from react-dom/client.
 * It provides basic mock functions for the render and unmount properties.
 */
jest.mock("react-dom/client", () => ({
	createRoot: jest.fn().mockReturnValue({
		render: jest.fn(),
		unmount: jest.fn(),
	}),
}));

/**
 * Mock React
 * This is a mock implementation of the React class.
 * It provides basic mock functions for useState, useEffect, createElement, and StrictMode.
 */
jest.mock("react", () => {
	const actual = jest.requireActual("react") as Record<string, unknown>;
	return {
		...actual,
		useState: jest
			.fn()
			.mockImplementation((initialValue: any) => [
				initialValue,
				jest.fn(),
			]),
		useEffect: jest.fn().mockReturnValue(undefined),
		createElement: jest.fn(),
		StrictMode: ({ children }: { children: any }) => children,
	};
});

// Mock the MarkdownView class
export class MockMarkdownView implements MarkdownView {
    editor: Partial<Editor>;
    file: TFile | null;

	constructor(options: {file?: TFile, editor?: Partial<Editor>} = {}) {
		this.editor = options.editor || {
			getValue: jest.fn().mockReturnValue(""),
			setValue: jest.fn()
		  };
		this.file = options.file || null; 
	}
}

/**
 * Mock Notice class
 * This is a mock implementation of the Notice class.
 * It provides basic mock functions for the hide property.
 */
// Improve MockNotice to ensure it has hide method during tests
export const MockNotice = jest.fn().mockImplementation((message, timeout) => {
	return {
		hide: jest.fn(),
		message: message || "",
		setMessage: jest.fn(),
		noticeEl: document.createElement('div')
	};
});

/**
 * Mock Editor class
 * This is a mock implementation of the Editor class.
 * It provides basic mock functions for getValue and setValue.
 */
export class MockEditor {
	getValue() {}
	setValue() {}
}


/**
 * MockPlugin is a mock implementation of the Plugin class.
 * It provides basic mock functions for saveData and loadData.
 * The settings property is initialized to an empty object.
 */
export class MockPlugin {
	saveData: (data: any) => Promise<void>;
	loadData: () => Promise<any>;
	settings: any;
	logger: {
		error: jest.Mock;
		info: jest.Mock;
		debug: jest.Mock;
		warn: jest.Mock;
	};
	reflectionMemoryManager?: any;
	serviceManager: any;
	uiManager: any;
	addCommand: jest.Mock;

	constructor(app: any) {
		// Initialize with basic mock functions
		this.saveData = async () => {};
		this.loadData = async () => ({});
		this.settings = {};
		this.logger = {
			error: jest.fn(),
			info: jest.fn(),
			debug: jest.fn(),
			warn: jest.fn()
		};
		this.serviceManager = {
			analyzeContent: jest.fn(),
			analysisManager: {
				analyzeContent: jest.fn(),
				updateSidePanelView: jest.fn()
			},
			weeklyAnalysisService: {
				runWeeklyAnalysis: jest.fn()
			}
		};
		this.uiManager = {
			statusBarItem: {
				setText: jest.fn()
			},
			activateView: jest.fn().mockResolvedValue(undefined)
		};
		this.addCommand = jest.fn();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		try {
			if (this.reflectionMemoryManager && typeof this.reflectionMemoryManager.initialize === 'function') {
				await this.reflectionMemoryManager.initialize();
			}
		} catch (error) {
			this.logger.error("Failed to initialize reflection memory manager:", error);
		}
	}

	async onunload() {
		try {
			if (this.reflectionMemoryManager && typeof this.reflectionMemoryManager.saveIndex === 'function') {
				await this.reflectionMemoryManager.saveIndex();
			}
		} catch (error) {
			this.logger.error("Error shutting down ReflectionMemoryManager:", error);
		}
	}
}

/**
 * SettingsTab is a mock implementation of the SettingsTab class.
 * It provides basic mock functions for saveSettings and loadSettings.
 * The settings property is initialized to an empty object.
 */
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

/**
 * Mock Obsidian
 * This is a mock implementation of the Obsidian class.
 * It provides basic mock functions for the ItemView, Leaf, Notice, App, and Editor classes.
 */
jest.mock("obsidian", () => {
	// Define the MockMarkdownView constructor here so it can be used for instanceof checks
	const MarkdownViewMock = MockMarkdownView;
	
	return {
		ItemView: class {
			leaf: any;
			constructor(leaf: any) {
				this.leaf = leaf;
			}
		},
		/**
		 * Mock Leaf class
		 * This is a mock implementation of the Leaf class.
		 * It provides basic mock functions for the view property.
		 */
		Leaf: class {
			view: any;
			constructor(view: any) {
				this.view = view;
			}
			openFile: jest.Mock;
		},
		/**
		 * Mock Notice class
		 * This is a mock implementation of the Notice class.
		 * It provides basic mock functions for the message and hide properties.
		 */
		Notice: jest.fn().mockImplementation((message, timeout) => {
			return {
				hide: jest.fn(),
				message: message || "",
				setMessage: jest.fn(),
				noticeEl: document.createElement('div')
			};
		}),
		/**
		 * Mock App class
		 * This is a mock implementation of the App class.
		 * It provides basic mock functions for the vault, workspace, and editor properties.
		 */
		App: class {
			vault = {
				getMarkdownFiles: jest.fn().mockReturnValue([]),
				read: jest.fn().mockReturnValue(""),
				create: jest.fn().mockReturnValue(undefined),
				createFolder: jest.fn().mockReturnValue(undefined),
				getAbstractFileByPath: jest.fn().mockReturnValue(null),
				adapter: jest.fn(),
				configDir: jest.fn(),
				getName: jest.fn().mockReturnValue("MockVault"),
				getFileByPath: jest.fn().mockReturnValue(null),
			};
			workspace = {
				getActiveFile: jest.fn().mockReturnValue(null),
				getActiveViewOfType: jest.fn().mockReturnValue(null),
				getLeavesOfType: jest.fn().mockReturnValue([]),
				getRightLeaf: jest.fn().mockReturnValue({
					setViewState: jest.fn().mockReturnValue(undefined),
				}),
				revealLeaf: jest.fn(),
				onLayoutReady: jest
					.fn()
					.mockReturnValue({ unsubscribe: jest.fn() }),
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
		/**
		 * Mock Editor class
		 * This is a mock implementation of the Editor class.
		 * It provides basic mock functions for getValue, setValue, replaceRange, and getCursor.
		 */
		Editor: class {
			getValue = jest.fn().mockReturnValue("");
			setValue = jest.fn();
			replaceRange = jest.fn();
			getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
		},

		/**
		 * Important: export the MarkdownView class so instanceof checks work correctly
		 * This fixes the "Right-hand side of 'instanceof' is not an object" error
		 */
		MarkdownView: MarkdownViewMock,
		
		TFile: class {
			constructor(
				public path: string,
				public basename: string,
				public content: string = ""
			) {}
		},
		/**
		 * Mock PluginSettingTab class
		 * This is a mock implementation of the PluginSettingTab class.
		 * It provides basic mock functions for the display and hide properties.
		 */
		PluginSettingTab: class {
			app: any;
			plugin: any;
			constructor(app: any, plugin: any) {
				this.app = app;
				this.plugin = plugin;
			}
			display() {}
			hide() {}
		},
		// Mock for the missing LogLevel enum
        LogLevel: {
            NONE: 0,
            ERROR: 1,
            WARN: 2,
            INFO: 3,
            DEBUG: 4
        },
	};
});