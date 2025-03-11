// src/settings/__tests__/settingsTab.test.ts
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

import { MockPlugin } from '../__mocks__/MockPlugin'
import { RecapitanSettings } from "../types";



// Mock SettingsTab class that avoids DOM operations
class SettingsTab extends PluginSettingTab {
	settings: RecapitanSettings;
	plugin: MockPlugin;

	constructor(app: App, plugin: Plugin, settings: RecapitanSettings) {
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

	loadSettings(): RecapitanSettings {
		return this.settings;
	}
}

describe("SettingsTab", () => {
	let mockApp: Partial<App>;
	let mockPlugin: MockPlugin;
	let settingsTab: SettingsTab;

	beforeEach(() => {
		// Create mock DataAdapter with proper function signatures
		const mockDataAdapter: Partial<DataAdapter> = {
			exists: jest.fn(
				(
					normalizedPath: string,
					sensitive?: boolean
				): Promise<boolean> => Promise.resolve(true)
			),
			read: jest.fn(
				(normalizedPath: string): Promise<string> => Promise.resolve("")
			),
			write: jest.fn(
				(
					normalizedPath: string,
					data: string,
					options?: DataWriteOptions
				): Promise<void> => Promise.resolve()
			),
			getName: jest.fn((): string => ""),
		};

		// Create mock WorkspaceSidedock
		const mockSidedock: Partial<WorkspaceSidedock> = {
			collapsed: false,
			expand: jest.fn(),
			collapse: jest.fn(),
			toggle: jest.fn(),
		};

		// Create minimal mock workspace
		const mockWorkspace: Partial<Workspace> = {
			leftSplit: mockSidedock as WorkspaceSidedock,
			rightSplit: mockSidedock as WorkspaceSidedock,
			leftRibbon: { addIconButton: jest.fn() },
			rightRibbon: { addIconButton: jest.fn() },
		};

		// Setup minimal App mock
		mockApp = {
			workspace: mockWorkspace as Workspace,
			vault: {
				adapter: mockDataAdapter as DataAdapter,
			} as Vault,
		};

		// Create mock plugin
		mockPlugin = new MockPlugin(mockApp as App);

		// Setup spy on plugin methods
		jest.spyOn(mockPlugin, "saveData").mockImplementation(async () => {});
		jest.spyOn(mockPlugin, "loadData").mockImplementation(async () => ({}));

		// Initialize settings
		const initialSettings: RecapitanSettings = {
			aiProvider: "openai",
			apiKey: "",
			analysisSchedule: "daily",
			communicationStyle: "direct",
			privateMarker: ":::private",
			ollamaHost: "http://localhost:11434",
			cacheTTLMinutes: 60,
			cacheMaxSize: 100,
			ollamaEndpoint: "http://localhost:11434/api/generate",
			ollamaModel: "deepseek-r1:latest",
			openaiModel: "gpt-4",
			reflectionTemplate: "",
			weeklyReflectionTemplate: ""
		};

		// Create settings tab instance
		settingsTab = new SettingsTab(
			mockApp as App,
			mockPlugin as Plugin,
			initialSettings
		);
	});

	test("should initialize with default settings", () => {
		expect(settingsTab.settings.aiProvider).toBe("openai");
		expect(settingsTab.settings.analysisSchedule).toBe("daily");
		expect(settingsTab.settings.communicationStyle).toBe("direct");
	});

	test("should save settings when updated", async () => {
		settingsTab.settings.aiProvider = "ollama";
		await settingsTab.saveSettings();

		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				aiProvider: "ollama",
			})
		);
	});

	test("should handle API key updates", async () => {
		const newApiKey = "test-api-key";
		settingsTab.settings.apiKey = newApiKey;
		await settingsTab.saveSettings();

		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				apiKey: newApiKey,
			})
		);
	});

	test("should maintain all settings when updating single value", async () => {
		const originalSettings = { ...settingsTab.settings };
		settingsTab.settings.aiProvider = "ollama";
		await settingsTab.saveSettings();

		expect(mockPlugin.saveData).toHaveBeenCalledWith({
			...originalSettings,
			aiProvider: "ollama",
		});
	});
});
