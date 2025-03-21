import { App, MarkdownView, TFile } from "obsidian";
import RetrospectAI from "./main";
import { DEFAULT_RETROSPECT_AI_SETTINGS } from "./types";
import { MockApp } from "./__mocks__/MockApp";
import { StreamingEditorManager } from "./services/StreamingManager";
import { LoggingService } from "./services/LoggingService";
import { JournalAnalysisService } from "./services/JournalAnalysisService";
import { PluginManifest } from "obsidian";
import { PrivacyManager } from "./services/PrivacyManager";
import { OpenAIService } from "./services/OpenAIService";
import { AnalysisManager } from "./services/AnalysisManager";
import { LogLevel } from "./services/LoggingService";

// Mock the JournalAnalysisService
const mockAnalyzeDailyJournal = jest.fn().mockResolvedValue(undefined);
const mockAnalyzeContent = jest.fn().mockResolvedValue("Analysis result");

jest.mock("./services/JournalAnalysisService", () => ({
  JournalAnalysisService: jest.fn().mockImplementation(() => ({
    analyzeDailyJournal: mockAnalyzeDailyJournal,
    analyzeContent: mockAnalyzeContent
  }))
}));

// Mock the StreamingEditorManager
jest.mock("./services/StreamingManager", () => ({
  StreamingEditorManager: jest.fn().mockImplementation(() => ({
    streamAnalysis: jest.fn().mockResolvedValue(undefined),
  })),
}));


// Mock the Notice class and other Obsidian classes
jest.mock("obsidian", () => {
  const mockNotice = jest.fn();
  return {
    Notice: mockNotice,
    App: class {},
    MarkdownView: class {},
    TFile: class {},
    Plugin: class {
      // Mock the addRibbonIcon method at the parent class level
      addRibbonIcon(icon: string, title: string, callback: Function) {
        return { addClass: jest.fn() };
      }
    },
    PluginManifest: class {},
    PluginSettingTab: class {
      app: any;
      plugin: any;

      constructor(app: any, plugin: any) {
        this.app = app;
        this.plugin = plugin;
      }
      display() {}
      async saveSettings() {}
      loadSettings() {}
    }
  };
});

// Get the mock Notice function for testing
const mockNotice = require("obsidian").Notice;

describe("RetrospectAI Plugin", () => {
  let plugin: RetrospectAI;
  let mockApp: Partial<App>;
  let mockStreamAnalysis: jest.Mock;
  
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
        adapter: {} as any
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
    } as unknown as App;
    
    // Create the plugin instance
    plugin = new RetrospectAI(mockApp as App, {
      id: 'retrospect-ai',
      name: 'Retrospect AI',
      version: '1.0.0',
      minAppVersion: '1.0.0',
      author: 'Test Author',
      description: 'Test Description'
    } as PluginManifest);
    
    // Initialize plugin settings
    plugin.settings = { ...DEFAULT_RETROSPECT_AI_SETTINGS };
    
    // Initialize the logger with mocked methods
    (plugin as any).logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    
    // Initialize the privacy manager
    (plugin as any).privacyManager = new PrivacyManager(plugin.settings.privateMarker);
    
    // Initialize the AI service
    (plugin as any).aiService = new OpenAIService(
      "test-api-key",
      "gpt-3.5-turbo"
    );
    
    // Initialize the analysis manager
    (plugin as any).analysisManager = new AnalysisManager(
      (plugin as any).aiService,
      (plugin as any).privacyManager,
      60
    );
    
    // Initialize the journal analysis service
    (plugin as any).journalAnalysisService = new JournalAnalysisService(
      mockApp as App,
      plugin.settings,
      (plugin as any).analysisManager,
      (plugin as any).logger
    );
    
    // Mock StreamingEditorManager
    mockStreamAnalysis = jest.fn().mockResolvedValue(undefined);
    (StreamingEditorManager as jest.Mock).mockImplementation(() => ({
      streamAnalysis: mockStreamAnalysis
    }));
    
    // Mock the addRibbonIcon method
    const mockIconElement = {
      addClass: jest.fn()
    };
    plugin.addRibbonIcon = jest.fn().mockImplementation((icon: string, title: string, callback: Function) => {
      // Store the callback for later use in tests
      (plugin as any).ribbonCallback = callback;
      return mockIconElement;
    });

    // Mock the addCommand method
    plugin.addCommand = jest.fn();
  });

  describe("addRibbonIcon", () => {
    it("should set up a ribbon icon with the correct parameters", () => {
      // Get the private method
      const addRibbonIconMethod = getPrivateMethod("addAnalysisRibbonIcon");
      
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
    
    it("should call analyzeDailyJournal when the ribbon icon is clicked", async () => {
      // Get the private method
      const addRibbonIconMethod = getPrivateMethod("addAnalysisRibbonIcon");
      
      // Call the method to set up the ribbon icon
      addRibbonIconMethod();
      
      // Get the callback function that was stored during mock implementation
      const callback = (plugin as any).ribbonCallback;
      
      // Call the callback to simulate clicking the ribbon icon
      await callback();
      
      // Verify that analyzeDailyJournal was called
      expect(mockAnalyzeDailyJournal).toHaveBeenCalled();
    });
    
    it("should handle errors when analyzeDailyJournal fails", async () => {
      // Mock analyzeDailyJournal to throw an error
      mockAnalyzeDailyJournal.mockImplementationOnce(() => Promise.reject(new Error("Test error")));
      
      // Get the private method
      const addRibbonIconMethod = getPrivateMethod("addAnalysisRibbonIcon");
      
      // Call the method to set up the ribbon icon
      addRibbonIconMethod();
      
      // Get the callback function that was stored during mock implementation
      const callback = (plugin as any).ribbonCallback;
      
      // Call the callback to simulate clicking the ribbon icon
      await callback();
      
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
