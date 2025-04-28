
import { App, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import RetrospectAI from '../main';
import { ReflectionMemoryManager } from '../services/ReflectionMemoryManager';
import { ServiceManager } from '../core/ServiceManager';
import { AnalysisManager } from '../services/AnalysisManager';

// Mock the dependencies
jest.mock('obsidian');
jest.mock('../services/ReflectionMemoryManager');
jest.mock('../core/ServiceManager');
jest.mock('../services/AnalysisManager');

describe('ReflectionMemoryManager Integration', () => {
  let plugin: RetrospectAI;
  let mockApp: jest.Mocked<App>;
  let mockReflectionMemoryManager: jest.Mocked<ReflectionMemoryManager>;
  let mockServiceManager: jest.Mocked<ServiceManager>;
  let mockAnalysisManager: jest.Mocked<AnalysisManager>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup mocks
    mockApp = {
      workspace: {
        onLayoutReady: jest.fn().mockImplementation(cb => cb()),
        getLeavesOfType: jest.fn().mockReturnValue([]),
        getRightLeaf: jest.fn().mockReturnValue({ setViewState: jest.fn().mockResolvedValue(undefined) }),
        revealLeaf: jest.fn(),
      },
    } as unknown as jest.Mocked<App>;
    
    // Create plugin instance
    plugin = new RetrospectAI(mockApp, {} as any);
    
    // Setup reflection memory manager mock
    mockReflectionMemoryManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      saveIndex: jest.fn(),
    } as unknown as jest.Mocked<ReflectionMemoryManager>;
    
    // Setup analysis manager mock
    mockAnalysisManager = {
      setReflectionMemoryManager: jest.fn(),
    } as unknown as jest.Mocked<AnalysisManager>;
    
    // Setup service manager mock
    mockServiceManager = {
      reinitializeServices: jest.fn(),
      shutdown: jest.fn(),
      logger: { error: jest.fn() },
      analysisManager: mockAnalysisManager,
    } as unknown as jest.Mocked<ServiceManager>;
    
    // Mock the ReflectionMemoryManager constructor
    (ReflectionMemoryManager as jest.Mock).mockImplementation(() => mockReflectionMemoryManager);
    
    // Mock the ServiceManager constructor
    (ServiceManager as jest.Mock).mockImplementation(() => mockServiceManager);
    
    // Setup plugin methods
    plugin.loadSettings = jest.fn().mockResolvedValue(undefined);
    plugin.saveData = jest.fn().mockResolvedValue(undefined);
    plugin.addSettingTab = jest.fn();
    plugin.registerView = jest.fn();
    plugin.addRibbonIcon = jest.fn();
    plugin.addStatusBarItem = jest.fn();
  });

  test('should initialize ReflectionMemoryManager during onload', async () => {
    // Call onload
    await plugin.onload();
    
    // Verify ReflectionMemoryManager was created
    expect(ReflectionMemoryManager).toHaveBeenCalledTimes(1);
    expect(ReflectionMemoryManager).toHaveBeenCalledWith(
      mockApp,
      plugin.settings,
      mockServiceManager.logger
    );
    
    // Verify initialize was called
    expect(mockReflectionMemoryManager.initialize).toHaveBeenCalledTimes(1);
    
    // Verify it was made available to the analysis manager
    expect(mockAnalysisManager.setReflectionMemoryManager).toHaveBeenCalledWith(mockReflectionMemoryManager);
  });

  test('should handle initialization errors gracefully', async () => {
    // Setup initialize to throw an error
    const error = new Error('Initialization failed');
    mockReflectionMemoryManager.initialize.mockRejectedValueOnce(error);
    
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Mock Notice constructor
    const originalNotice = global.Notice;
    global.Notice = jest.fn() as unknown as typeof Notice;
    
    try {
      // Call onload
      await plugin.onload();
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize reflection memory manager:',
        error
      );
      
      // Verify Notice was shown
      expect(global.Notice).toHaveBeenCalledWith(
        'Failed to initialize reflection system. Some features may not work properly.'
      );
    } finally {
      // Restore mocks
      console.error = originalConsoleError;
      global.Notice = originalNotice;
    }
  });

  test('should clean up ReflectionMemoryManager during onunload', () => {
    // Set the reflection memory manager
    plugin.reflectionMemoryManager = mockReflectionMemoryManager;
    plugin.serviceManager = mockServiceManager;
    
    // Mock console.log
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    try {
      // Call onunload
      plugin.onunload();
      
      // Verify saveIndex was called
      expect(mockReflectionMemoryManager.saveIndex).toHaveBeenCalledTimes(1);
      
      // Verify success was logged
      expect(console.log).toHaveBeenCalledWith(
        'ReflectionMemoryManager shut down successfully'
      );
    } finally {
      // Restore console.log
      console.log = originalConsoleLog;
    }
  });

  test('should handle cleanup errors gracefully', () => {
    // Set the reflection memory manager
    plugin.reflectionMemoryManager = mockReflectionMemoryManager;
    plugin.serviceManager = mockServiceManager;
    
    // Setup saveIndex to throw an error
    const error = new Error('Cleanup failed');
    mockReflectionMemoryManager.saveIndex.mockImplementationOnce(() => {
      throw error;
    });
    
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    try {
      // Call onunload
      plugin.onunload();
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Error shutting down ReflectionMemoryManager:',
        error
      );
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });
});
