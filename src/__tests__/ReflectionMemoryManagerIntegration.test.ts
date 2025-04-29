// src/__tests__/ReflectionMemoryManagerIntegration.test.ts

import RetrospectAI from "../main";
import { ReflectionMemoryManager } from "../services/ReflectionMemoryManager";
import {
	describe,
	it,
	beforeEach,
	afterEach,
	expect,
	jest,
} from "@jest/globals";
import { App } from "obsidian";

// Mock Obsidian classes and APIs
const mockApp: App = {
	vault: {
		adapter: {
			exists: jest.fn().mockImplementation(() => Promise.resolve(false)),
			createFolder: jest.fn().mockImplementation(() => Promise.resolve()),
			read: jest.fn().mockImplementation(() => Promise.resolve("{}")),
			write: jest.fn().mockImplementation(() => Promise.resolve()),
		},
	} as any,
	workspace: {
		getRightLeaf: jest.fn().mockImplementation(() => ({
			setViewState: jest.fn().mockImplementation(() => Promise.resolve()),
		})),
		revealLeaf: jest.fn(),
	} as any,
	keymap: {} as any,
	scope: {} as any,
	metadataCache: {} as any,
	fileManager: {} as any,
	lastEvent: {} as any,
	loadLocalStorage: jest.fn(),
	saveLocalStorage: jest.fn(),
};

class MockPlugin {
	app = mockApp;
	settings = {};
	logger = {
		info: jest.fn(),
		debug: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	};

	// Mock plugin methods
	addCommand = jest.fn();
	registerEvent = jest.fn();

	// Mock managers
	uiManager = {
		cleanup: jest.fn(),
		activateView: jest.fn().mockImplementation(() => Promise.resolve()),
	};

	serviceManager = {
		shutdown: jest.fn(),
	};
}

describe("ReflectionMemoryManager Integration", () => {
	let plugin: any;
	let reflectionManager: ReflectionMemoryManager;

	beforeEach(() => {
		// Create mocked plugin with all required dependencies
		plugin = new RetrospectAI(mockApp, {} as any);

		// Override plugin properties with mocks
		Object.assign(plugin, new MockPlugin());

		// Create ReflectionMemoryManager instance with mocked dependencies
		reflectionManager = new ReflectionMemoryManager(
			plugin.app,
			plugin.settings,
			plugin.logger
		);

		// Assign to plugin
		plugin.reflectionMemoryManager = reflectionManager;

		// Mock initialize to prevent real file operations
		jest.spyOn(reflectionManager, "initialize").mockResolvedValue(
			undefined
		);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("should initialize ReflectionMemoryManager during onload", async () => {
		// Create a spy to verify initialize is called
		const initSpy = jest.spyOn(reflectionManager, "initialize");

		// Call onload
		await plugin.onload();

		// Verify initialize was called
		expect(initSpy).toHaveBeenCalled();
	});

	it("should handle initialization errors gracefully", async () => {
		// Force initialize to throw an error
		jest.spyOn(reflectionManager, "initialize").mockRejectedValueOnce(
			new Error("Simulated error")
		);

		// Plugin should handle errors during onload
		await expect(plugin.onload()).resolves.not.toThrow();

		// Verify error was logged
		expect(plugin.logger.error).toHaveBeenCalled();
	});

	it("should clean up ReflectionMemoryManager during onunload", async () => {
		// Call onunload
		plugin.onunload();

		// Verify saveIndex was called
		expect(jest.spyOn(reflectionManager, "saveIndex")).toHaveBeenCalled();
	});

	it("should handle cleanup errors gracefully", async () => {
		// Mock saveIndex to throw an error
		jest.spyOn(reflectionManager, "saveIndex").mockImplementationOnce(
			() => {
				throw new Error("Cleanup error");
			}
		);

		// Plugin should handle errors during onunload
		expect(() => plugin.onunload()).not.toThrow();

		// Verify error was logged
		expect(plugin.logger.error).toHaveBeenCalled();
	});
});
