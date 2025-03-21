import { App, MarkdownView, TFile } from "obsidian";
import RetrospectAI from "./main";
import { DEFAULT_RETROSPECT_AI_SETTINGS } from "./types";
import { MockApp } from "./__mocks__/MockApp";
import { StreamingEditorManager } from "./services/StreamingManager";
import { LoggingService } from "./services/LoggingService";
import { PluginManifest } from "obsidian";

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
    
    // Mock the logger
    (plugin as any).logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    
    // Mock the analyzeContent method
    (plugin as any).analyzeContent = jest.fn().mockResolvedValue("Analysis result");
    
    // Mock StreamingEditorManager
    mockStreamAnalysis = jest.fn().mockResolvedValue(undefined);
    (StreamingEditorManager as jest.Mock).mockImplementation(() => ({
      streamAnalysis: mockStreamAnalysis
    }));
    
    // Mock the analyzeDailyJournal method
    (plugin as any).analyzeDailyJournal = jest.fn().mockImplementation(async () => {
      const files = mockApp.vault?.getMarkdownFiles();
      const todayFile = files?.find(file => file.path === '2023-05-15.md');
      
      if (!todayFile) {
        (plugin as any).logger.warn("No journal entry found for today");
        mockNotice("No journal entry found for today");
        return;
      }

      try {
        mockNotice("Analyzing today's journal entry...");
        const content = await mockApp.vault?.read(todayFile);
        const view = await mockApp.workspace?.getLeaf(false).openFile(todayFile);
        const editor = mockApp.workspace?.getActiveViewOfType(MarkdownView)?.editor;
        
        if (!editor) {
          throw new Error("Could not get editor view");
        }

        const analysis = await (plugin as any).analyzeContent(content);
        const streamingManager = new StreamingEditorManager(editor);
        await streamingManager.streamAnalysis(analysis, {
          loadingIndicatorPosition: "bottom",
          streamingUpdateInterval: 50,
        });

        mockNotice("Journal analysis complete");
      } catch (error) {
        (plugin as any).logger.error("Error analyzing daily journal", error);
        mockNotice(`Error analyzing daily journal: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    });
    
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
    
    it("should find today's journal entry and analyze it when clicked", async () => {
      // Get the private method
      const addRibbonIconMethod = getPrivateMethod("addAnalysisRibbonIcon");
      
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
      
      // Get the callback function that was stored during mock implementation
      const callback = (plugin as any).ribbonCallback;
      
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
      expect(mockStreamAnalysis).toHaveBeenCalledWith(
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
      const addRibbonIconMethod = getPrivateMethod("addAnalysisRibbonIcon");
      
      // Call the method to set up the ribbon icon
      addRibbonIconMethod();
      
      // Get the callback function that was stored during mock implementation
      const callback = (plugin as any).ribbonCallback;
      
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
      // Mock analyzeDailyJournal to throw an error
      (plugin as any).analyzeDailyJournal = jest.fn().mockImplementation(async () => {
        const files = mockApp.vault?.getMarkdownFiles();
        const todayFile = files?.find(file => file.path === '2023-05-15.md');
        
        if (!todayFile) {
          (plugin as any).logger.warn("No journal entry found for today");
          mockNotice("No journal entry found for today");
          return;
        }

        try {
          mockNotice("Analyzing today's journal entry...");
          const content = await mockApp.vault?.read(todayFile);
          const view = await mockApp.workspace?.getLeaf(false).openFile(todayFile);
          const editor = mockApp.workspace?.getActiveViewOfType(MarkdownView)?.editor;
          
          if (!editor) {
            throw new Error("Could not get editor view");
          }

          // Simulate an error during analysis
          throw new Error("Test error");
        } catch (error) {
          (plugin as any).logger.error("Error analyzing daily journal", error);
          mockNotice(`Error analyzing daily journal: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });
      
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
      const addRibbonIconMethod = getPrivateMethod("addAnalysisRibbonIcon");
      
      // Call the method to set up the ribbon icon
      addRibbonIconMethod();
      
      // Get the callback function that was stored during mock implementation
      const callback = (plugin as any).ribbonCallback;
      
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
