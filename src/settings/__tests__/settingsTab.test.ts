import { App, Notice, StatusBar } from 'obsidian';
import { RecapitanSettingTab } from '../settingsTab';
import Recapitan from '../../main';

// Mock Obsidian's App, Notice, and StatusBar
jest.mock('obsidian', () => ({
    PluginSettingTab: jest.fn(),
    Notice: jest.fn(),
    App: {
        statusBar: {
            addStatusBarItem: jest.fn().mockReturnValue({
                setText: jest.fn(),
                remove: jest.fn()
            })
        }
    }
}));

describe('RecapitanSettingTab', () => {
    let settingsTab: RecapitanSettingTab;
    let mockPlugin: Partial<Recapitan>;
    let mockApp: Partial<App>;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Setup mock plugin
        mockPlugin = {
            settings: {
                apiKey: 'test-key'
            },
            saveSettings: jest.fn().mockResolvedValue(undefined)
        };

        // Setup mock app
        mockApp = {
            statusBar: {
                addStatusBarItem: jest.fn().mockReturnValue({
                    setText: jest.fn(),
                    remove: jest.fn()
                })
            }
        };

        settingsTab = new RecapitanSettingTab(mockApp as App, mockPlugin as Recapitan);
    });

    describe('saveSettingsWithFeedback', () => {
        it('should show and remove loading indicator during settings save', async () => {
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            
            await settingsTab['saveSettingsWithFeedback'](mockCallback);

            // Verify status bar was added and removed
            expect(mockApp.statusBar?.addStatusBarItem).toHaveBeenCalled();
            expect(mockApp.statusBar?.addStatusBarItem().remove).toHaveBeenCalled();
            
            // Verify callback was called
            expect(mockCallback).toHaveBeenCalled();
            
            // Verify Notice was shown for success
            expect(Notice).toHaveBeenCalledWith('Settings saved');
        });

        it('should handle errors and show error notice', async () => {
            const mockError = new Error('Save failed');
            const mockCallback = jest.fn().mockRejectedValue(mockError);
            
            await expect(settingsTab['saveSettingsWithFeedback'](mockCallback))
                .rejects.toThrow(mockError);

            // Verify status bar was added and removed
            expect(mockApp.statusBar?.addStatusBarItem).toHaveBeenCalled();
            expect(mockApp.statusBar?.addStatusBarItem().remove).toHaveBeenCalled();
            
            // Verify Notice was shown for error
            expect(Notice).toHaveBeenCalledWith('Failed to save settings');
        });
    });
});
