// src/__tests__/settingsTab.test.ts

import {
	App,
	DataAdapter,
	Vault,
	WorkspaceSidedock,
	Workspace,
	DataWriteOptions,
} from "obsidian";
import { jest } from "@jest/globals";
import { ExtendedApp } from "../types";
import { MockPlugin } from "./setup";
import { RetrospectAISettingTab } from "../settings/settingsTab";
import RetrospectAI from "../main";

describe("SettingsTab", () => {
	let mockApp: ExtendedApp;
	let mockPlugin: MockPlugin;
	let settingsTab: RetrospectAISettingTab;

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

		// Create mock app with all required properties
		mockApp = {
			workspace: mockWorkspace as Workspace,
			statusBar: {
				addStatusBarItem: jest.fn().mockReturnValue({
					setText: jest.fn(),
					remove: jest.fn(),
				}),
			},
			keymap: {
				getRootScope: jest.fn(),
				pushScope: jest.fn(),
				popScope: jest.fn(),
			},
			scope: {
				keys: [],
				register: jest.fn(),
				unregister: jest.fn(),
			},
			vault: {
				adapter: mockDataAdapter as DataAdapter,
				getAbstractFileByPath: jest.fn(),
				getRoot: jest.fn(),
				getFiles: jest.fn(),
				getMarkdownFiles: jest.fn(),
				getFolders: jest.fn(),
				getAllLoadedFiles: jest.fn(),
				createFolder: jest.fn(),
				createFile: jest.fn(),
				delete: jest.fn(),
				rename: jest.fn(),
				read: jest.fn(),
				readBinary: jest.fn(),
				write: jest.fn(),
				writeBinary: jest.fn(),
				append: jest.fn(),
				process: jest.fn(),
				processFrontMatter: jest.fn(),
				cachedRead: jest.fn(),
				getResourcePath: jest.fn(),
				getResourcePathBase: jest.fn(),
				config: {
					attachmentFolderPath: "",
					newFileLocation: "root",
					newLinkFormat: "shortest",
					useMarkdownLinks: true,
				},
				configDir: "",
				getName: jest.fn(),
				getFileByPath: jest.fn(),
				getFolderByPath: jest.fn(),
				getResourcePathByPath: jest.fn(),
				getResourcePathByPathBase: jest.fn(),
			} as unknown as Vault,
			metadataCache: {
				getFileCache: jest.fn(),
				getCache: jest.fn(),
				getFirstLinkpathDest: jest.fn(),
				on: jest.fn(),
				off: jest.fn(),
				trigger: jest.fn(),
			},
			fileManager: {
				createNewMarkdownFile: jest.fn(),
				createNewFile: jest.fn(),
				deleteFile: jest.fn(),
				renameFile: jest.fn(),
				trashFile: jest.fn(),
				processFrontMatter: jest.fn(),
			},
			internalPlugins: {
				getEnabledPluginById: jest.fn(),
				getPluginById: jest.fn(),
				on: jest.fn(),
				off: jest.fn(),
				trigger: jest.fn(),
			},
			plugins: {
				enablePlugin: jest.fn(),
				disablePlugin: jest.fn(),
				on: jest.fn(),
				off: jest.fn(),
				trigger: jest.fn(),
			},
			lastEvent: null,
			loadLocalStorage: jest.fn(),
			saveLocalStorage: jest.fn(),
		} as unknown as ExtendedApp;

		// Create mock plugin
		mockPlugin = new MockPlugin(mockApp as App);
		mockPlugin.settings = {
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
			anthropicApiKey: "",
			commentaryViewEnabled: false,
		};

		// Setup spy on plugin methods
		jest.spyOn(mockPlugin, "saveData").mockImplementation(async () => {});
		jest.spyOn(mockPlugin, "loadData").mockImplementation(async () => ({}));

		// Create settings tab instance
		settingsTab = new RetrospectAISettingTab(mockApp, mockPlugin as unknown as RetrospectAI);
	});

	test("should initialize with default settings", () => {
		expect(settingsTab.plugin.settings.aiProvider).toBe("openai");
		expect(settingsTab.plugin.settings.analysisSchedule).toBe("daily");
		expect(settingsTab.plugin.settings.communicationStyle).toBe("direct");
	});

	test("should save settings when updated", async () => {
		settingsTab.plugin.settings.aiProvider = "ollama";
		await settingsTab.plugin.saveSettings();

		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				aiProvider: "ollama",
			})
		);
	});

	test("should handle API key updates", async () => {
		const newApiKey = "test-api-key";
		settingsTab.plugin.settings.apiKey = newApiKey;
		await settingsTab.plugin.saveSettings();

		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				apiKey: newApiKey,
			})
		);
	});

	test("should maintain provider-specific settings when switching providers", async () => {
		const originalSettings = { ...settingsTab.plugin.settings };
		settingsTab.plugin.settings.aiProvider = "ollama";
		await settingsTab.plugin.saveSettings();

		expect(mockPlugin.saveData).toHaveBeenCalledWith({
			...originalSettings,
			aiProvider: "ollama",
		});
	});

	test("should handle OpenAI model selection", async () => {
		settingsTab.plugin.settings.openaiModel = "gpt-4";
		await settingsTab.plugin.saveSettings();

		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				openaiModel: "gpt-4",
			})
		);
	});

	test("should handle Ollama model selection", async () => {
		settingsTab.plugin.settings.ollamaModel = "llama3.1:8b";
		await settingsTab.plugin.saveSettings();

		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				ollamaModel: "llama3.1:8b",
			})
		);
	});

	test("should handle Anthropic model selection", async () => {
		settingsTab.plugin.settings.anthropicModel = "claude-3-opus-20240229";
		await settingsTab.plugin.saveSettings();

		expect(mockPlugin.saveData).toHaveBeenCalledWith(
			expect.objectContaining({
				anthropicModel: "claude-3-opus-20240229",
			})
		);
	});
});
