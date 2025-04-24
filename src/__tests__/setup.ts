// Jest setup file
import {
	App,
	Plugin,
	PluginSettingTab,
	DataAdapter,
	Vault,
	WorkspaceSidedock,
	Workspace,
	DataWriteOptions,
} from "obsidian";
import { jest } from "@jest/globals";
import { RetrospectAISettings } from "../types";

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
		.mockImplementation((initialValue) => [initialValue, jest.fn()]),
	useEffect: jest.fn().mockImplementation((fn) => fn()),
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

	constructor(app: App) {
		// Initialize with basic mock functions
		this.saveData = async () => {};
		this.loadData = async () => ({});
	}
}

// Mock SettingsTab class that avoids DOM operations
export class SettingsTab extends PluginSettingTab {
	settings: RetrospectAISettings;
	plugin: MockPlugin;

	constructor(app: App, plugin: Plugin, settings: RetrospectAISettings) {
		super(app, plugin);
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

// Mock the StreamingManager module
jest.mock("../services/StreamingManager", () => {
  const mockStreamAnalysis = jest.fn().mockImplementation((promise) => {
    // Handle both resolved and rejected promises
    return promise.catch((error: Error) => {
      // Let the error propagate after handling it in the stream
      throw error;
    });
  });

  return {
    StreamingEditorManager: jest.fn().mockImplementation(() => ({
      streamAnalysis: mockStreamAnalysis,
    })),
  };
});

// Note: Obsidian mock is now in src/__tests__/__mocks__/obsidian.ts
import mockObsidian from './__mocks__/obsidian';

jest.mock('obsidian', () => mockObsidian);
