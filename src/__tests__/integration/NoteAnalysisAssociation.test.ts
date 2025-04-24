import { AnalysisManager } from "../../services/AnalysisManager";
import { CommentaryView } from "../../views/CommentaryView";
import { MockApp, MockLeaf, MockTFile, MockNotice } from "../mocks/obsidian.mock";

// Mock the AIService and PrivacyManager
const mockAIService = {
  analyze: jest.fn().mockResolvedValue("Analyzed content"),
};

const mockPrivacyManager = {
  removePrivateSections: jest.fn(content => content),
};

// Mock the plugin
const mockPlugin = {
  app: new MockApp(),
  settings: {
    reflectionTemplate: "Test template",
    communicationStyle: "direct",
  },
  uiManager: {
    activateView: jest.fn().mockResolvedValue(undefined),
  },
  logger: {
    error: jest.fn(),
  },
};

// Mock the Notice constructor
jest.mock("obsidian", () => ({
  Notice: jest.fn().mockImplementation((message) => new MockNotice(message)),
  ItemView: class {
    leaf: any;
    constructor(leaf: any) {
      this.leaf = leaf;
    }
  },
}));

describe("Note Analysis Association Integration", () => {
  let analysisManager: AnalysisManager;
  let commentaryView: CommentaryView;
  let mockLeaf: MockLeaf;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup AnalysisManager
    analysisManager = new AnalysisManager(
      mockPlugin as any,
      mockAIService as any,
      mockPrivacyManager as any,
      60,
      100
    );
    
    // Setup CommentaryView
    mockLeaf = new MockLeaf({});
    commentaryView = new CommentaryView(mockLeaf as any);
    
    // Mock DOM elements for CommentaryView
    commentaryView.containerEl = {
      empty: jest.fn(),
      children: [
        {},
        {
          empty: jest.fn(),
          createEl: jest.fn().mockReturnValue({}),
          children: [{}],
        },
      ],
    } as any;
    
    // Mock the root for React rendering
    commentaryView.root = {
      render: jest.fn(),
      unmount: jest.fn(),
    } as any;
    
    // Mock the workspace to return our view
    (mockPlugin.app.workspace.getLeavesOfType as jest.Mock).mockReturnValue([
      { view: commentaryView },
    ]);
  });

  it("should analyze a note and update the commentary view", async () => {
    // Setup test data
    const noteContent = "This is a test note with sufficient content for analysis.";
    const noteId = "test-note.md";
    const noteName = "Test Note";
    const testFile = new MockTFile(noteId, noteName, noteContent);
    
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
    
    // Get the history from the view and verify it contains our note
    const history = commentaryView.getAnalysisHistory();
    expect(history.length).toBe(1);
    expect(history[0].noteId).toBe(noteId);
    expect(history[0].noteName).toBe(noteName);
    expect(history[0].content).toBe("Analyzed content");
  });

  it("should handle errors during analysis", async () => {
    // Make the AI service throw an error
    (mockAIService.analyze as jest.Mock).mockRejectedValueOnce(new Error("API error"));
    
    // Attempt to analyze content
    await analysisManager.analyzeContent(
      "Test content",
      mockPlugin.settings.reflectionTemplate,
      mockPlugin.settings.communicationStyle as any,
      "error-note.md",
      "Error Note"
    );
    
    // Verify error was logged
    expect(mockPlugin.logger.error).toHaveBeenCalled();
  });

  it("should retrieve a previously analyzed note from history", async () => {
    // Add multiple analyses
    await analysisManager.analyzeContent(
      "First note content",
      mockPlugin.settings.reflectionTemplate,
      mockPlugin.settings.communicationStyle as any,
      "note-1.md",
      "Note 1"
    );
    
    await analysisManager.analyzeContent(
      "Second note content",
      mockPlugin.settings.reflectionTemplate,
      mockPlugin.settings.communicationStyle as any,
      "note-2.md",
      "Note 2"
    );
    
    // Select the first note
    commentaryView.selectAnalysis("note-1.md");
    
    // Verify the correct content is displayed
    expect(commentaryView.root.render).toHaveBeenCalled();
  });
});
