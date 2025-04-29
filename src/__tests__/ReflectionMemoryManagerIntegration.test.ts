// src/__tests__/ReflectionMemoryManagerIntegration.test.ts

import RetrospectAI from "../main";
import { ReflectionMemoryManager, ReflectionMemoryError } from "../services/ReflectionMemoryManager";
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
		createFolder: jest.fn().mockImplementation(() => Promise.resolve()),
	} as any,
	workspace: {
		getRightLeaf: jest.fn().mockImplementation(() => ({
			setViewState: jest.fn().mockImplementation(() => Promise.resolve()),
		})),
		revealLeaf: jest.fn(),
		onLayoutReady: jest.fn().mockImplementation(callback => {
			// Execute the callback immediately
			if (typeof callback === 'function') {
				callback();
			}
			return { unsubscribe: jest.fn() };
		}),
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
	saveData = jest.fn().mockResolvedValue(undefined);
	loadData = jest.fn().mockResolvedValue({});

	// Mock managers
	uiManager = {
		cleanup: jest.fn(),
		activateView: jest.fn().mockImplementation(() => Promise.resolve()),
		setupRibbonIcons: jest.fn().mockImplementation(() => {
			return {
				addClass: jest.fn(),
				removeClass: jest.fn(),
			};
		}),
	};

	serviceManager = {
		shutdown: jest.fn(),
	};
	
	// Add reflectionMemoryManager property
	reflectionMemoryManager = {
		initialize: jest.fn().mockResolvedValue(undefined),
		saveIndex: jest.fn().mockResolvedValue(undefined),
		shutdown: jest.fn().mockResolvedValue(undefined),
		addReflection: jest.fn().mockResolvedValue(undefined),
	};
}

describe("ReflectionMemoryManager Integration", () => {
	let plugin: any;
	let reflectionManager: ReflectionMemoryManager;

	beforeEach(() => {
		// Create mocked plugin with all required dependencies
		plugin = new MockPlugin();

		// Create ReflectionMemoryManager instance with mocked dependencies
		reflectionManager = {
			initialize: jest.fn().mockResolvedValue(undefined),
			saveIndex: jest.fn().mockResolvedValue(undefined),
			shutdown: jest.fn().mockResolvedValue(undefined),
			addReflection: jest.fn().mockResolvedValue(undefined),
		} as unknown as ReflectionMemoryManager;

		// Assign to plugin
		plugin.reflectionMemoryManager = reflectionManager;
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("should initialize ReflectionMemoryManager during onload", async () => {
		// Create a spy to verify initialize is called
		const initSpy = jest.spyOn(reflectionManager, "initialize");

		// Call onload
		await plugin.onload?.();

		// Verify initialize was called
		expect(initSpy).toHaveBeenCalled();
	});

	it("should handle initialization errors gracefully", async () => {
		// Force initialize to throw an error
		jest.spyOn(reflectionManager, "initialize").mockRejectedValueOnce(
			new ReflectionMemoryError("Simulated error")
		);

		// Plugin should handle errors during onload
		await expect(plugin.onload?.()).resolves.not.toThrow();

		// Verify error was logged
		expect(plugin.logger.error).toHaveBeenCalledWith(
			"Failed to initialize reflection memory manager:",
			expect.any(Error)
		);
	});

	it("should clean up ReflectionMemoryManager during onunload", async () => {
		// Create a spy to verify saveIndex is called
		const saveIndexSpy = jest.spyOn(reflectionManager, "saveIndex");

		// Call onunload
		await plugin.onunload?.();

		// Verify saveIndex was called
		expect(saveIndexSpy).toHaveBeenCalled();
	});

	it("should save index during cleanup", async () => {
		// Create a spy to verify saveIndex is called
		const saveIndexSpy = jest.spyOn(reflectionManager, "saveIndex");

		// Call onunload
		await plugin.onunload?.();

		// Verify saveIndex was called
		expect(saveIndexSpy).toHaveBeenCalled();
	});

	it("should handle cleanup errors gracefully", async () => {
		// Force saveIndex to throw an error
		jest.spyOn(reflectionManager, "saveIndex").mockRejectedValueOnce(
			new ReflectionMemoryError("Simulated cleanup error")
		);

		// Plugin should handle errors during onunload
		expect(() => plugin.onunload?.()).not.toThrow();

		// Verify error was logged
		expect(plugin.logger.error).toHaveBeenCalledWith(
			"Error shutting down ReflectionMemoryManager:",
			expect.any(Error)
		);
	});
});
