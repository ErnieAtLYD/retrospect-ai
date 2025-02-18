// Mock Obsidian API
global.window = {};

// Create minimal mocks for required Obsidian classes
const mockObsidian = {
    Plugin: class {},
    Notice: class {},
    PluginSettingTab: class {},
    Setting: class {
        setName() { return this; }
        setDesc() { return this; }
        addText() { return this; }
        addDropdown() { return this; }
    },
    TFile: class {},
    App: class {},
    Vault: class {},
    Workspace: class {},
};

// Mock the entire obsidian module
jest.mock('obsidian', () => mockObsidian, { virtual: true });
