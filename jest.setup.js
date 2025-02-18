// Mock Obsidian API
global.window = {};
jest.mock('obsidian', () => ({
    Plugin: class {},
    Notice: class {},
    PluginSettingTab: class {},
    Setting: class {},
    TFile: class {},
}));
