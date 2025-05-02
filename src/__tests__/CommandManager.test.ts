import { CommandManager } from "../core/CommandManager";
import { MockPlugin } from "./setup";
import { Notice, MarkdownView } from "obsidian";
import RetrospectAI from "../main";

// Use the mock setup from setup.ts instead of overriding here
// This avoids conflicting mock definitions for obsidian

// src/core/CommandManager.test.ts
describe("CommandManager", () => {
	let commandManager: CommandManager;
	let mockPlugin: MockPlugin;
	let mockEditor: any;

	beforeEach(() => {
		// Mock the plugin
		mockPlugin = new MockPlugin();
		
		// Add required settings
		mockPlugin.settings = {
			reflectionTemplate: "Test template",
			communicationStyle: "Test style"
		};

		// Mock the editor
		mockEditor = {
			getValue: jest.fn().mockReturnValue("Note content"),
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

	test("should handle analyze note command", async () => {
		// Setup - create a proper mock context with a file property
		const testFile = { path: "test/path.md", basename: "test-note" };
		const mockContext = new MarkdownView({ file: testFile });
		let editorCallback: (editor: any, context: any) => Promise<void> = async () => {};

		mockPlugin.addCommand.mockImplementationOnce(
			({
				editorCallback: callback,
			}: {
				editorCallback: (editor: any, context: any) => Promise<void>;
			}) => {
				editorCallback = callback;
			}
		);

		// Register commands to get the callback
		commandManager.registerCommands();

		// Execute the callback
		await editorCallback(mockEditor, mockContext);

		// Verify - the code now uses analysisManager.analyzeContent instead of serviceManager.analyzeContent
		expect(mockPlugin.serviceManager.analysisManager.analyzeContent).toHaveBeenCalledWith(
			"Note content",
			"Test template", // template from settings
			"Test style",    // style from settings
			"test/path.md",  // noteId from file path
			"test-note"      // noteName from file basename
		);
	});

	test("should handle weekly analysis command", async () => {
		// Setup
		let callback: () => Promise<void> = async () => {};

		mockPlugin.addCommand
			.mockImplementationOnce(() => {})
			.mockImplementationOnce(
				({ callback: cb }: { callback: () => Promise<void> }) => {
					callback = cb;
				}
			);

		// Register commands to get the callback
		commandManager.registerCommands();

		// Execute the callback
		await callback();

		// Verify
		expect(
			mockPlugin.serviceManager.weeklyAnalysisService.runWeeklyAnalysis
		).toHaveBeenCalled();
		expect(mockPlugin.uiManager.statusBarItem.setText).toHaveBeenCalledWith(
			"Analyzing past week..."
		);
	});

	test("should handle errors in analyze note command", async () => {
		// Setup - create a proper mock context with a file property
		const testFile = { path: "test/path.md", basename: "test-note" };
		const mockContext = new MarkdownView({ file: testFile });
		let editorCallback: (editor: any, context: any) => Promise<void> = async () => {};

		mockPlugin.addCommand.mockImplementationOnce(
			({
				editorCallback: callback,
			}: {
				editorCallback: (editor: any, context: any) => Promise<void>;
			}) => {
				editorCallback = callback;
			}
		);

		// Mock the error case
		const testError = new Error("Test error");
		mockPlugin.serviceManager.analysisManager.analyzeContent.mockRejectedValueOnce(testError as never);

		// Register commands to get the callback
		commandManager.registerCommands();

		// Execute the callback - with try/catch to ensure the test doesn't fail
		// The error should be caught in the command implementation, not bubble up
		await editorCallback(mockEditor, mockContext);

		// Verify error handling
		expect(mockPlugin.serviceManager.analysisManager.analyzeContent).toHaveBeenCalled();
		expect(Notice).toHaveBeenCalledWith(expect.stringContaining("Test error"), expect.any(Number));
	});
});
