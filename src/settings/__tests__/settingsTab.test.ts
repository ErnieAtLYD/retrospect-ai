import { App, Notice } from 'obsidian';
import { RecapitanSettingTab } from '../settingsTab';
import Recapitan from '../../main';

// Mock Obsidian's App and Notice
jest.mock('obsidian', () => ({
    PluginSettingTab: jest.fn(),
    Notice: jest.fn()
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
                apiKey: 'test-key',
                aiProvider: 'openai',
                model: 'gpt-3.5-turbo',
                reflectionTemplate: 'test template',
                weeklyReflectionTemplate: 'test weekly template',
                analysisSchedule: 'manual',
                communicationStyle: 'direct',
                privateMarker: ':::private',
                ollamaHost: 'http://localhost:11434'
            },
            saveSettings: jest.fn().mockResolvedValue(undefined)
        };

        // Setup mock app
        mockApp = {
            workspace: {
                on: jest.fn(),
                off: jest.fn()
            }
        };

        settingsTab = new RecapitanSettingTab(mockApp as App, mockPlugin as Recapitan);
    });

    describe('saveSettingsWithFeedback', () => {
        it('should show notice on successful settings save', async () => {
            const mockCallback = jest.fn().mockResolvedValue(undefined);
            
            await settingsTab['saveSettingsWithFeedback'](mockCallback);
            
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
            
            // Verify Notice was shown for error
            expect(Notice).toHaveBeenCalledWith('Failed to save settings');
        });
    });
});
