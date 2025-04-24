// src/settings/__tests__/settingsTab.test.ts
import {
	App,
	Plugin,
	DataAdapter,
	Vault,
	WorkspaceSidedock,
	Workspace,
	DataWriteOptions,
} from "obsidian";
import { jest } from "@jest/globals";

import { MockPlugin, SettingsTab } from '../__tests__/setup';
import { RetrospectAISettings } from "../types";

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
		const initialSettings: RetrospectAISettings = {
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
			weeklyReflectionTemplate: "",
			loggingEnabled: false,
			logLevel: "info",
			anthropicModel: "claude-3-haiku-20240307",
			anthropicApiKey: ""
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

	test("should handle OpenAI model selection", async () => {
		// Create a new instance with openai provider
		const initialSettings: RetrospectAISettings = {
			aiProvider: "openai",
			apiKey: "test-key",
			analysisSchedule: "daily",
			communicationStyle: "direct",
			privateMarker: ":::private",
			ollamaHost: "http://localhost:11434",
			cacheTTLMinutes: 60,
			cacheMaxSize: 100,
			ollamaEndpoint: "http://localhost:11434/api/generate",
			ollamaModel: "deepseek-r1:latest",
			openaiModel: "gpt-3.5-turbo", // Start with 3.5
			reflectionTemplate: "",
			weeklyReflectionTemplate: "",
			loggingEnabled: false,
			logLevel: "info",
			anthropicModel: "claude-3-haiku-20240307",
			anthropicApiKey: ""
		};

		// Create settings tab instance with these settings
		const testSettingsTab = new SettingsTab(
			mockApp as App,
			mockPlugin as Plugin,
			initialSettings
		);

		// Change the model to gpt-4
		testSettingsTab.settings.openaiModel = "gpt-4";
		await testSettingsTab.saveSettings();

		// Verify the model was saved
		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				openaiModel: "gpt-4",
			})
		);

		// Change to gpt-4o
		testSettingsTab.settings.openaiModel = "gpt-4o";
		await testSettingsTab.saveSettings();

		// Verify the new model was saved
		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				openaiModel: "gpt-4o",
			})
		);
	});

	test("should maintain provider-specific settings when switching providers", async () => {
		// Create a new instance with openai provider and settings
		const initialSettings: RetrospectAISettings = {
			aiProvider: "openai",
			apiKey: "test-key",
			openaiModel: "gpt-4",
			analysisSchedule: "daily",
			communicationStyle: "direct",
			privateMarker: ":::private",
			ollamaHost: "http://localhost:11434",
			cacheTTLMinutes: 60,
			cacheMaxSize: 100,
			ollamaEndpoint: "http://localhost:11434/api/generate",
			ollamaModel: "deepseek-r1:latest",
			reflectionTemplate: "",
			weeklyReflectionTemplate: "",
			loggingEnabled: false,
			logLevel: "info",
			anthropicModel: "claude-3-haiku-20240307",
			anthropicApiKey: ""
		};

		// Create settings tab instance
		const testSettingsTab = new SettingsTab(
			mockApp as App,
			mockPlugin as Plugin,
			initialSettings
		);

		// Switch to ollama provider
		testSettingsTab.settings.aiProvider = "ollama";
		await testSettingsTab.saveSettings();

		// Verify the provider was changed but openaiModel is preserved
		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				aiProvider: "ollama",
				openaiModel: "gpt-4", // OpenAI model should be preserved
				ollamaModel: "deepseek-r1:latest" // Ollama model should be preserved
			})
		);

		// Switch back to openai
		testSettingsTab.settings.aiProvider = "openai";
		await testSettingsTab.saveSettings();

		// Verify we switched back to openai and the model is still there
		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				aiProvider: "openai",
				openaiModel: "gpt-4"
			})
		);
	});
	
	test("should handle Ollama model selection", async () => {
		// Create a new instance with ollama provider
		const initialSettings: RetrospectAISettings = {
			aiProvider: "ollama",
			apiKey: "",
			analysisSchedule: "daily",
			communicationStyle: "direct",
			privateMarker: ":::private",
			ollamaHost: "http://localhost:11434",
			cacheTTLMinutes: 60,
			cacheMaxSize: 100,
			ollamaEndpoint: "http://localhost:11434/api/generate",
			ollamaModel: "deepseek-r1:latest", // Start with deepseek
			openaiModel: "gpt-4",
			reflectionTemplate: "",
			weeklyReflectionTemplate: "",
			loggingEnabled: false,
			logLevel: "info",
			anthropicModel: "claude-3-haiku-20240307",
			anthropicApiKey: ""
		};

		// Create settings tab instance with these settings
		const testSettingsTab = new SettingsTab(
			mockApp as App,
			mockPlugin as Plugin,
			initialSettings
		);

		// Change the model to llama3
		testSettingsTab.settings.ollamaModel = "llama3.1:8b";
		await testSettingsTab.saveSettings();

		// Verify the model was saved
		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				ollamaModel: "llama3.1:8b",
			})
		);

		// Change to another model
		testSettingsTab.settings.ollamaModel = "mistral:7b";
		await testSettingsTab.saveSettings();

		// Verify the new model was saved
		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				ollamaModel: "mistral:7b",
			})
		);
	});

	test("should handle Anthropic model selection", async () => {
		// Create a new instance with anthropic provider
		const initialSettings: RetrospectAISettings = {
			aiProvider: "anthropic",
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
			weeklyReflectionTemplate: "",
			loggingEnabled: false,
			logLevel: "info",
			anthropicModel: "claude-3-haiku-20240307", // Start with haiku
			anthropicApiKey: "test-key"
		};

		// Create settings tab instance with these settings
		const testSettingsTab = new SettingsTab(
			mockApp as App,
			mockPlugin as Plugin,
			initialSettings
		);

		// Change the model to opus
		testSettingsTab.settings.anthropicModel = "claude-3-opus-20240229";
		await testSettingsTab.saveSettings();

		// Verify the model was saved
		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				anthropicModel: "claude-3-opus-20240229",
			})
		);

		// Change to sonnet
		testSettingsTab.settings.anthropicModel = "claude-3-sonnet-20240229";
		await testSettingsTab.saveSettings();

		// Verify the new model was saved
		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				anthropicModel: "claude-3-sonnet-20240229",
			})
		);
	});
});
