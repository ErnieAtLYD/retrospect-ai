import mockObsidian from "../../__mocks__/obsidian";
import { AnalysisManager } from "../../services/AnalysisManager";
import { CommentaryView } from "../../views/CommentaryView";
// Mock the AIService and PrivacyManager
const mockAIService = {
  analyze: jest.fn().mockResolvedValue("Analyzed content"),
};

const mockPrivacyManager = {
  removePrivateSections: jest.fn(content => content),
};

// Mock the pluginkn.bbbbbj 
const mockPlugin = {
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
  },
};

describe("Note Analysis Association Integration", () => {
  let analysisManager: AnalysisManager;
  let commentaryView: CommentaryView;
  let mockLeaf: any;
  
  // Mock console.error
  const originalConsoleError = console.error;
  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    // Mock console.error
    console.error = jest.fn();
    
    // Setup AnalysisManager
    analysisManager = new AnalysisManager(
      mockPlugin as any,
      mockAIService as any,
      mockPrivacyManager as any,
      60,
      100
    );
    
    // Setup CommentaryView
    mockLeaf = new mockObsidian.Leaf({});
    commentaryView = new CommentaryView(mockLeaf);
    commentaryView.containerEl = document.createElement('div');
    
    // Add two child elements to match the expected structure
    const headerElement = document.createElement('div');
    const contentElement = document.createElement('div');
    commentaryView.containerEl.appendChild(headerElement);
    commentaryView.containerEl.appendChild(contentElement);
    
    // Initialize the view
    await commentaryView.onOpen();
    
    // Mock the workspace to return our view
    (mockPlugin.app.workspace.getLeavesOfType as jest.Mock).mockReturnValue([
      { view: commentaryView },
    ]);
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });
  it("should analyze a note and update the commentary view", async () => {
    // Setup test data
    const noteContent = "This is a test note with sufficient content for analysis.";
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
    
    // Get the history from the view and verify it contains our note
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
    );
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith("An unexpected error occurred during analysis", error);
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
    if (commentaryView.root?.render) {
      (commentaryView.root.render as jest.Mock).mockClear();
    }
    
    // Select the first note
    commentaryView.selectAnalysis("note-1.md");
    
    // Verify the correct content is displayed
    expect(commentaryView.root?.render).toHaveBeenCalled();
  });
});
