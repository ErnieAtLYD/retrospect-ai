import { CommentaryView } from "../../views/CommentaryView";
import mockObsidian from "../../__mocks__/obsidian";
import * as React from "react";
import { AnalysisManager } from "../../services/AnalysisManager";
import { AIService } from "../../services/AIService";
import { PrivacyManager } from "../../services/PrivacyManager";


// Mock react-dom/client
jest.mock("react-dom/client", () => ({
  createRoot: () => ({
    render: jest.fn(),
    unmount: jest.fn(),
  }),
}));

describe("CommentaryView", () => {
  let view: CommentaryView;
  let mockLeaf: any;
  let mockAnalysisManager: AnalysisManager;
  let mockAIService: AIService;
  let mockPrivacyManager: PrivacyManager;
  let mockPlugin: any;

  beforeEach(() => {
    mockLeaf = new mockObsidian.Leaf({});
    view = new CommentaryView(mockLeaf);
    
    // Mock DOM elements
    view.containerEl = {
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
    
    // Mock dependencies
    mockAIService = { analyze: jest.fn() } as unknown as AIService;
    mockPrivacyManager = { removePrivateSections: jest.fn(text => text) } as unknown as PrivacyManager;
    mockPlugin = { uiManager: { activateView: jest.fn() } };
    
    // Create analysis manager
    mockAnalysisManager = new AnalysisManager(
      mockPlugin as any,
      mockAIService,
      mockPrivacyManager,
      null // No ReflectionMemoryManager for this test
    );
    
    // Set the analysis manager on the view
    view.setAnalysisManager(mockAnalysisManager);
  });

  describe("View lifecycle", () => {
    it("should return the correct view type", () => {
      expect(view.getViewType()).toBe("commentary-view");
    });

    it("should return the correct display text", () => {
      expect(view.getDisplayText()).toBe("AI Analysis");
    });

    it("should initialize React component on open", async () => {
      await view.onOpen();
      
      expect(view.containerEl.children[1].empty).toHaveBeenCalled();
      expect(view.containerEl.children[1].createEl).toHaveBeenCalledWith("div", {
        cls: "react-view-container",
      });
      expect(view.root).not.toBeNull();
    });

    it("should clean up on close", async () => {
      // Setup
      view.root = {
        unmount: jest.fn(),
      } as any;
      
      // Execute
      await view.onClose();
      
      // Verify
      expect(view.root?.unmount).toHaveBeenCalled();
      expect(view.containerEl.empty).toHaveBeenCalled();
    });
  });

  describe("Content management", () => {
    beforeEach(() => {
      view.root = {
        render: jest.fn(),
      } as any;
    });

    it("should update content", () => {
      const content = "Test analysis content";
      const noteId = "test-note-id";
      const noteName = "Test Note";
      
      view.updateContent(content, noteId, noteName);
      
      expect(view.root?.render).toHaveBeenCalled();
      
      // Check that the analysis was added to history in the analysis manager
      const history = mockAnalysisManager.getAnalysisHistory();
      expect(history.length).toBe(1);
      expect(history[0].noteId).toBe(noteId);
      expect(history[0].noteName).toBe(noteName);
      expect(history[0].content).toBe(content);
    });

    it("should replace existing analysis for the same note", () => {
      // Add initial analysis
      view.updateContent("Initial content", "note-1", "Note 1");
      
      // Update the same note
      view.updateContent("Updated content", "note-1", "Note 1");
      
      // Check history
      const history = mockAnalysisManager.getAnalysisHistory();
      expect(history.length).toBe(1);
      expect(history[0].content).toBe("Updated content");
    });

    it("should limit history to 20 items", () => {
      // Mock Date.now() to return incrementing timestamps
      const originalDateNow = Date.now;
      let currentTime = 1000;
      Date.now = jest.fn(() => currentTime);

      // Add 25 different notes with incrementing timestamps
      for (let i = 0; i < 25; i++) {
        currentTime += 1000; // Increment by 1 second
        view.updateContent(`Content ${i}`, `note-${i}`, `Note ${i}`);
      }
      
      // Check history length
      const history = mockAnalysisManager.getAnalysisHistory();
      expect(history.length).toBe(20);
      
      // The most recent notes should be kept (note-24 to note-5)
      expect(history[0].noteId).toBe("note-24");
      expect(history[19].noteId).toBe("note-5");

      // Restore original Date.now
      Date.now = originalDateNow;
    });

    it("should select an analysis from history", () => {
      // Add multiple analyses
      view.updateContent("Content 1", "note-1", "Note 1");
      view.updateContent("Content 2", "note-2", "Note 2");
      
      // Add a spy on the getAnalysisForNote method
      const spy = jest.spyOn(mockAnalysisManager, 'getAnalysisForNote');
      
      // Select the first note
      view.selectAnalysis("note-1");
      
      // Verify the content was updated
      expect(view.root?.render).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith("note-1");
    });
  });
});
