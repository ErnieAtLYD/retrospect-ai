// Mock Obsidian API
/* eslint-env jest */
global.window = {};
jest.mock('obsidian', () => ({
    Plugin: class {},
    Notice: class {},
    PluginSettingTab: class {},
    Setting: class {},
    TFile: class {},
}));
