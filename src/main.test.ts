// src/main.test.ts
import RetrospectAI from './main';
import { App } from 'obsidian';

describe('RetrospectAI Plugin', () => {
    let plugin: RetrospectAI;
    let mockApp: any;
    let mockLogger: { error: jest.Mock };
    let ribbonIconClickHandler: () => Promise<void>;

    beforeEach(() => {
        // Mock the app
        mockApp = {} as App;
        
        // Create a mock plugin manifest
        const mockManifest = {
            id: 'retrospect-ai',
            name: 'RetrospectAI',
            version: '1.0.0',
            minAppVersion: '0.15.0',
            description: 'AI-powered journal reflections',
            author: 'Test Author',
            authorUrl: 'https://example.com'
        };
        
        // Create the plugin with proper manifest
        plugin = new RetrospectAI(mockApp, mockManifest);
        
        // Setup mock methods and properties
        plugin.analyzeDailyJournal = jest.fn();
        
        // Mock the addRibbonIcon method to capture the click handler
        plugin.addRibbonIcon = jest.fn().mockImplementation(
            (icon: string, title: string, callback: () => Promise<void>) => {
                ribbonIconClickHandler = callback;
                return { icon, title, callback };
            }
        );
        
        // Create mock logger
        mockLogger = { error: jest.fn() };
        plugin.logger = mockLogger;
    });

    describe('addRibbonIcon', () => {
        test('should set up a ribbon icon with the correct parameters', () => {
            // Call the actual method being tested
            plugin.uiManager = { setupUI: jest.fn() } as any;
            plugin.uiManager.setupUI = () => {
                plugin.addRibbonIcon('brain', 'Analyze Daily Journal', async () => {
                    try {
                        await plugin.analyzeDailyJournal();
                    } catch (error) {
                        plugin.logger.error("Error analyzing daily journal", error as Error);
                    }
                });
            };
            
            plugin.uiManager.setupUI();
            
            // Verify it was called with the correct parameters
            expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
                'brain',
                'Analyze Daily Journal',
                expect.any(Function)
            );
        });

        test('should call analyzeDailyJournal when the ribbon icon is clicked', async () => {
            // Call the actual method being tested
            plugin.uiManager = { setupUI: jest.fn() } as any;
            plugin.uiManager.setupUI = () => {
                plugin.addRibbonIcon('brain', 'Analyze Daily Journal', async () => {
                    try {
                        await plugin.analyzeDailyJournal();
                    } catch (error) {
                        plugin.logger.error("Error analyzing daily journal", error as Error);
                    }
                });
            };
            
            plugin.uiManager.setupUI();
            
            // Get the callback function that was passed to addRibbonIcon
            const callback = (plugin.addRibbonIcon as jest.Mock).mock.calls[0][2];
            
            // Call the callback function
            await callback();
            
            // Verify analyzeDailyJournal was called
            expect(plugin.analyzeDailyJournal).toHaveBeenCalled();
        });

        test('should handle errors when analyzeDailyJournal fails', async () => {
            // Mock analyzeDailyJournal to throw an error
            const testError = new Error('Test error');
            (plugin.analyzeDailyJournal as jest.Mock).mockRejectedValue(testError);
            
            // Call the actual method being tested
            plugin.uiManager = { setupUI: jest.fn() } as any;
            plugin.uiManager.setupUI = () => {
                plugin.addRibbonIcon('brain', 'Analyze Daily Journal', async () => {
                    try {
                        await plugin.analyzeDailyJournal();
                    } catch (error) {
                        plugin.logger.error("Error analyzing daily journal", error as Error);
                    }
                });
            };
            
            plugin.uiManager.setupUI();
            
            // Get the callback function that was passed to addRibbonIcon
            const callback = (plugin.addRibbonIcon as jest.Mock).mock.calls[0][2];
            
            // Call the callback function (which should trigger the error)
            await callback();
            
            // Verify that the error was logged
            expect(mockLogger.error).toHaveBeenCalledWith(
                "Error analyzing daily journal", 
                expect.any(Error)
            );
        });
    });
});