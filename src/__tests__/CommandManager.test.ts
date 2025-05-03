import { CommandManager } from "../core/CommandManager";
import RetrospectAI from "../main";
import { MockPlugin } from "./setup";

// Mock notice directly for the tests
jest.mock("obsidian", () => ({
  Notice: jest.fn()
}), { virtual: true });

// src/core/CommandManager.test.ts
describe("CommandManager", () => {
	let commandManager: CommandManager;
	let mockPlugin: MockPlugin;

	beforeEach(() => {
		// Mock the plugin
		mockPlugin = new MockPlugin();
		
		// Add required settings
		mockPlugin.settings = {
			reflectionTemplate: "Test template",
			communicationStyle: "Test style"
		};

		commandManager = new CommandManager(mockPlugin as unknown as RetrospectAI);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("should register commands", () => {
		commandManager.registerCommands();
		expect(mockPlugin.addCommand).toHaveBeenCalledTimes(2);
	});
});