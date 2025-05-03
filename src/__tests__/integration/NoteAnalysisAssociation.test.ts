// src/__tests__/integration/NoteAnalysisAssociation.test.ts

import { AnalysisManager } from "../../services/AnalysisManager";
import { CommentaryView } from "../../views/CommentaryView";
import { ReflectionMemoryManager } from "../../services/ReflectionMemoryManager";
import { PrivacyManager } from "../../services/PrivacyManager";
import { AIService } from "../../services/AIService";
import { App, Plugin, TFile } from "obsidian";
import { createRoot } from "react-dom/client";

// Mock Obsidian App
const mockObsidian = {
	App: jest.fn().mockImplementation(() => ({
		vault: {
			adapter: {
				exists: jest.fn().mockResolvedValue(false),
				read: jest.fn().mockResolvedValue(""),
				write: jest.fn().mockResolvedValue(undefined),
				createFolder: jest.fn().mockResolvedValue(undefined),
			},
		},
	})),
	TFile: jest.fn().mockImplementation(() => ({
		path: "test.md",
		basename: "test",
		extension: "md",
	})),
};

// Mock AIService
const mockAIService: AIService = {
	analyze: jest.fn().mockResolvedValue("Analyzed content"),
} as any;

// Mock PrivacyManager
const mockPrivacyManager: PrivacyManager = {
	removePrivateSections: jest.fn((content) => content),
	privateMarker: "PRIVATE",
} as any;

// Mock the plugin
const mockPlugin: Plugin & {
	app: App;
	settings: any;
	uiManager: any;
	logger: any;
	reflectionMemoryManager: ReflectionMemoryManager;
} = {
	app: new mockObsidian.App(),
	settings: {
		reflectionTemplate: "Test template",
		communicationStyle: "direct",
	},
	uiManager: {
		activateView: jest.fn().mockResolvedValue(undefined),
	},
	logger: {
		error: jest.fn(),
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
	},
	reflectionMemoryManager: new ReflectionMemoryManager(
		new mockObsidian.App() as any,
		{} as any,
		{
			error: jest.fn(),
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
		} as any
	),
} as any;

// Mock react-dom/client
jest.mock("react-dom/client", () => ({
	createRoot: jest.fn().mockReturnValue({
		render: jest.fn(),
		unmount: jest.fn(),
	}),
}));

describe("Note Analysis Association Integration", () => {
	let analysisManager: AnalysisManager;
	let commentaryView: CommentaryView;
	let mockLeaf: any;
	let mockRender: jest.Mock;

	// Mock console.error
	const originalConsoleError = console.error;

	beforeEach(async () => {
		// Reset mocks
		jest.clearAllMocks();

		// Mock console.error
		console.error = jest.fn();

		// Initialize the ReflectionMemoryManager
		await mockPlugin.reflectionMemoryManager.initialize();
		
		// Create a new instance of AnalysisManager with the initialized ReflectionMemoryManager
		analysisManager = new AnalysisManager(
			mockPlugin as any,
			mockAIService,
			mockPrivacyManager,
			mockPlugin.reflectionMemoryManager
		);
		
		// Create a new instance of CommentaryView
		commentaryView = new CommentaryView(mockPlugin as any);
		
		// Mock leaf and render function
		mockLeaf = {
			view: null,
			containerEl: document.createElement("div"),
		};
		mockRender = jest.fn();

		// Connect CommentaryView to AnalysisManager
		commentaryView.setAnalysisManager(analysisManager);

		// Get the mock render function from our mocked createRoot
		mockRender = (createRoot as jest.Mock)().render;

		// Mock DOM elements
		commentaryView.containerEl = document.createElement("div");

		// Add two child elements to match the expected structure
		const headerElement = document.createElement("div");
		const contentElement = document.createElement("div");
		commentaryView.containerEl.appendChild(headerElement);
		commentaryView.containerEl.appendChild(contentElement);

		// Initialize the view
		await commentaryView.onOpen();

		// Mock the workspace to return our view
		((mockPlugin.app as any).workspace.getLeavesOfType as jest.Mock).mockReturnValue(
			[{ view: commentaryView }]
		);
	});

	afterEach(() => {
		// Restore console.error
		console.error = originalConsoleError;
	});
	
	it("should analyze a note and update the commentary view", async () => {
		// Setup test data
		const noteContent =
			"This is a test note with sufficient content for analysis.";
		const noteId = "test-note.md";
		const noteName = "Test Note";
		const testFile = new mockObsidian.TFile(noteId, noteName, noteContent);

		// Perform analysis
		await analysisManager.analyzeContent(
			noteContent,
			mockPlugin.settings.reflectionTemplate,
			mockPlugin.settings.communicationStyle as any,
			noteId,
			noteName
		);

		// Verify AI service was called
		expect(mockAIService.analyze).toHaveBeenCalledWith(
			noteContent,
			mockPlugin.settings.reflectionTemplate,
			mockPlugin.settings.communicationStyle
		);

		// Verify UI was updated
		expect(mockPlugin.uiManager.activateView).toHaveBeenCalled();

		// Get the history from the AnalysisManager via the view and verify it contains our note
		const history = commentaryView.getAnalysisHistory();
		expect(history.length).toBe(1);
		expect(history[0].noteId).toBe(noteId);
		expect(history[0].noteName).toBe(noteName);
		expect(history[0].content).toBe("Analyzed content");
	});

	it("should handle errors during analysis", async () => {
		// Make the AI service throw an error
		const error = new Error("API error");
		(mockAIService.analyze as jest.Mock).mockRejectedValueOnce(error);

		// Attempt to analyze content with sufficient length to pass validation
		await analysisManager.analyzeContent(
			"This is a test note with sufficient content to pass validation but will fail during analysis.",
			mockPlugin.settings.reflectionTemplate,
			mockPlugin.settings.communicationStyle as any,
			"error-note.md",
			"Error Note"
		).catch(() => {
			// We expect this to fail, but we catch it here to continue the test
		});

		// Verify error was logged
		expect(console.error).toHaveBeenCalled();
	});

	it("should retrieve a previously analyzed note from history", async () => {
		// Add multiple analyses
		await analysisManager.analyzeContent(
			"First note content with sufficient length for validation.",
			mockPlugin.settings.reflectionTemplate,
			mockPlugin.settings.communicationStyle as any,
			"note-1.md",
			"Note 1"
		);

		await analysisManager.analyzeContent(
			"Second note content with sufficient length for validation.",
			mockPlugin.settings.reflectionTemplate,
			mockPlugin.settings.communicationStyle as any,
			"note-2.md",
			"Note 2"
		);

		// Reset the render mock to clear previous calls
		mockRender.mockClear();

		// Verify that the history contains our analyses
		const history = commentaryView.getAnalysisHistory();
		expect(history.length).toBe(2);

		// Select the first note
		commentaryView.selectAnalysis("note-1.md");

		// Verify the correct content is displayed - the render function should have been called
		expect(mockRender).toHaveBeenCalled();
	});
});

describe("Note Analysis Association Integration", () => {
	it("should store new reflection entry after analyzing content", async () => {
	  // Arrange: instantiate or acquire the analysis and reflection managers
	  const analysisManager = new AnalysisManager(
		mockPlugin as any,
		mockAIService,
		mockPrivacyManager,
		mockPlugin.reflectionMemoryManager
	  );
	  const reflectionMemoryManager = new ReflectionMemoryManager(
		mockPlugin.app as any,
		mockPlugin.settings as any,
		mockPlugin.logger as any
	  );
  
	  // Arrange: sample content to analyze
	  const content = "Test content for reflection";
  
	  // Act: perform the content analysis
	  await analysisManager.analyzeContent(
		content,
		mockPlugin.settings.reflectionTemplate,
		mockPlugin.settings.communicationStyle as any,
		"test-note.md",
		"Test Note"
	  );
  
	  // Assert: check that ReflectionMemoryManager now contains at least one reflection entry
	  const reflections = await reflectionMemoryManager.getAllReflections();
	  expect(reflections.length).toBeGreaterThan(0);
	});
});  