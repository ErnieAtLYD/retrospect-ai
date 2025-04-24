import { CommandManager } from "./CommandManager";
import { MockMarkdownView, MockEditor, MockNotice } from "../__tests__/setup";

// src/core/CommandManager.test.ts
describe("CommandManager", () => {
	let commandManager: CommandManager;
	let mockPlugin: any;
	let mockEditor: any;

	beforeEach(() => {
		// Mock the plugin
		mockPlugin = {
			addCommand: jest.fn(),
			serviceManager: {
				analyzeContent: jest.fn().mockResolvedValue("Analysis result"),
				weeklyAnalysisService: {
					runWeeklyAnalysis: jest.fn().mockResolvedValue(undefined),
				},
			},
			uiManager: {
				statusBarItem: {
					setText: jest.fn(),
				},
			},
		};

		// Mock the editor
		mockEditor = {
			getValue: jest.fn().mockReturnValue("Note content"),
		};

		commandManager = new CommandManager(mockPlugin);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	test("should register commands", () => {
		commandManager.registerCommands();
		expect(mockPlugin.addCommand).toHaveBeenCalledTimes(2);
	});

	test("should handle analyze note command", async () => {
		// Setup
		const mockContext = new MockMarkdownView();
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

		// Verify
		expect(mockPlugin.serviceManager.analyzeContent).toHaveBeenCalledWith(
			"Note content"
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
		// Setup
		const mockContext = new MockMarkdownView();
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
		mockPlugin.serviceManager.analyzeContent.mockRejectedValueOnce(testError);

		// Register commands to get the callback
		commandManager.registerCommands();

		// Execute the callback - with try/catch to ensure the test doesn't fail
		// The error should be caught in the command implementation, not bubble up
		await editorCallback(mockEditor, mockContext);

		// Verify error handling
		expect(mockPlugin.serviceManager.analyzeContent).toHaveBeenCalled();
		expect(MockNotice).toHaveBeenCalledWith(expect.stringContaining("Test error"), expect.any(Number));
	});
});
