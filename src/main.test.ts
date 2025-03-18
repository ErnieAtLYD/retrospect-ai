import { App, MarkdownView, TFile } from "obsidian";
import RetrospectAI from "./main";
import { DEFAULT_RETROSPECT_AI_SETTINGS } from "./types";
import { MockApp } from "./__mocks__/MockApp";
import { StreamingEditorManager } from "./services/StreamingManager";
import { LoggingService } from "./services/LoggingService";

// Mock the StreamingEditorManager
jest.mock("./services/StreamingManager", () => ({
  StreamingEditorManager: jest.fn().mockImplementation(() => ({
    streamAnalysis: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock the Notice class
const mockNotice = jest.fn();
jest.mock("obsidian", () => {
  const original = jest.requireActual("obsidian");
  return {
    ...original,
    Notice: mockNotice,
  };
});

describe("RetrospectAI Plugin", () => {
  let plugin: RetrospectAI;
  let mockApp: Partial<App>;
  
  // Helper to access private methods
  const getPrivateMethod = (methodName: string) => {
    return (plugin as any)[methodName].bind(plugin);
  };
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock app
    mockApp = {
      vault: {
        getMarkdownFiles: jest.fn().mockReturnValue([
          { path: `2023-05-15.md`, name: `2023-05-15.md` },
          { path: "older-note.md", name: "older-note.md" }
        ]),
        read: jest.fn().mockResolvedValue("This is a test journal entry."),
        adapter: { 
          constructor: { 
            TFile: class MockTFile {} 
          } 
        }
      },
      workspace: {
        getActiveViewOfType: jest.fn().mockReturnValue({
          editor: { 
            setValue: jest.fn(),
            getValue: jest.fn().mockReturnValue(""),
            lineCount: jest.fn().mockReturnValue(10),
            setCursor: jest.fn(),
            getLine: jest.fn().mockReturnValue(""),
            replaceRange: jest.fn()
          }
        }),
        getLeaf: jest.fn().mockReturnValue({
          openFile: jest.fn().mockResolvedValue(undefined)
        })
      }
    };
    
    // Create the plugin instance
    plugin = new RetrospectAI(mockApp as App);
    
    // Initialize plugin settings
    plugin.settings = { ...DEFAULT_RETROSPECT_AI_SETTINGS };
    
    // Mock the logger
    (plugin as any).logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    
    // Mock the analyzeContent method
    (plugin as any).analyzeContent = jest.fn().mockResolvedValue("Analysis result");
    
    // Mock the addRibbonIcon method
    plugin.addRibbonIcon = jest.fn().mockReturnValue({
      addClass: jest.fn()
    });
  });

  describe("addRibbonIcon", () => {
    it("should set up a ribbon icon with the correct parameters", () => {
      // Get the private method
      const addRibbonIconMethod = getPrivateMethod("addRibbonIcon");
      
      // Call the method
      addRibbonIconMethod();
      
      // Verify that addRibbonIcon was called with the correct parameters
      expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
        'brain-cog',
        'Analyze Daily Journal',
        expect.any(Function)
      );
      
      // Verify that the icon element has the correct class
      const mockIconElement = (plugin.addRibbonIcon as jest.Mock).mock.results[0].value;
      expect(mockIconElement.addClass).toHaveBeenCalledWith('retrospect-ai-ribbon-icon');
    });
    
    it("should find today's journal entry and analyze it when clicked", async () => {
      // Get the private method
      const addRibbonIconMethod = getPrivateMethod("addRibbonIcon");
      
      // Mock the current date
      const realDate = Date;
      const mockDate = new Date('2023-05-15T12:00:00Z');
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;
      
      // Call the method to set up the ribbon icon
      addRibbonIconMethod();
      
      // Get the callback function that was passed to addRibbonIcon
      const callback = (plugin.addRibbonIcon as jest.Mock).mock.calls[0][2];
      
      // Call the callback to simulate clicking the ribbon icon
      await callback();
      
      // Restore the original Date
      global.Date = realDate;
      
      // Verify that the correct methods were called
      expect(mockApp.vault?.getMarkdownFiles).toHaveBeenCalled();
      expect(mockApp.vault?.read).toHaveBeenCalled();
      expect(mockApp.workspace?.getLeaf).toHaveBeenCalledWith(false);
      expect(mockApp.workspace?.getActiveViewOfType).toHaveBeenCalledWith(MarkdownView);
      
      // Verify that the analyzeContent method was called with the correct content
      expect((plugin as any).analyzeContent).toHaveBeenCalledWith("This is a test journal entry.");
      
      // Verify that StreamingEditorManager was created and used correctly
      expect(StreamingEditorManager).toHaveBeenCalled();
      const mockStreamingManager = (StreamingEditorManager as jest.Mock).mock.instances[0];
      expect(mockStreamingManager.streamAnalysis).toHaveBeenCalledWith(
        "Analysis result",
        {
          loadingIndicatorPosition: "bottom",
          streamingUpdateInterval: 50,
        }
      );
      
      // Verify that the notices were shown
      expect(mockNotice).toHaveBeenCalledWith("Analyzing today's journal entry...");
      expect(mockNotice).toHaveBeenCalledWith("Journal analysis complete");
    });
    
    it("should show a notice when no journal entry is found for today", async () => {
      // Override the getMarkdownFiles mock to return no files matching today's date
      (mockApp.vault?.getMarkdownFiles as jest.Mock).mockReturnValue([
        { path: "older-note.md", name: "older-note.md" }
      ]);
      
      // Mock the current date
      const realDate = Date;
      const mockDate = new Date('2023-05-15T12:00:00Z');
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;
      
      // Get the private method
      const addRibbonIconMethod = getPrivateMethod("addRibbonIcon");
      
      // Call the method to set up the ribbon icon
      addRibbonIconMethod();
      
      // Get the callback function that was passed to addRibbonIcon
      const callback = (plugin.addRibbonIcon as jest.Mock).mock.calls[0][2];
      
      // Call the callback to simulate clicking the ribbon icon
      await callback();
      
      // Restore the original Date
      global.Date = realDate;
      
      // Verify that the correct methods were called
      expect(mockApp.vault?.getMarkdownFiles).toHaveBeenCalled();
      
      // Verify that the Notice was called with the correct message
      expect(mockNotice).toHaveBeenCalledWith("No journal entry found for today");
      
      // Verify that the logger.warn method was called
      expect((plugin as any).logger.warn).toHaveBeenCalled();
      
      // Verify that analyzeContent was not called
      expect((plugin as any).analyzeContent).not.toHaveBeenCalled();
    });
    
    it("should handle errors during analysis", async () => {
      // Mock analyzeContent to throw an error
      (plugin as any).analyzeContent = jest.fn().mockRejectedValue(new Error("Test error"));
      
      // Mock the current date
      const realDate = Date;
      const mockDate = new Date('2023-05-15T12:00:00Z');
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        static now() {
          return mockDate.getTime();
        }
      } as any;
      
      // Get the private method
      const addRibbonIconMethod = getPrivateMethod("addRibbonIcon");
      
      // Call the method to set up the ribbon icon
      addRibbonIconMethod();
      
      // Get the callback function that was passed to addRibbonIcon
      const callback = (plugin.addRibbonIcon as jest.Mock).mock.calls[0][2];
      
      // Call the callback to simulate clicking the ribbon icon
      await callback();
      
      // Restore the original Date
      global.Date = realDate;
      
      // Verify that the error was logged
      expect((plugin as any).logger.error).toHaveBeenCalledWith(
        "Error analyzing daily journal", 
        expect.any(Error)
      );
      
      // Verify that the Notice was called with the error message
      expect(mockNotice).toHaveBeenCalledWith(
        "Error analyzing daily journal: Test error"
      );
    });
  });
});
