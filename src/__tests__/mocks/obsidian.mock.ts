// Mock for Obsidian API
export class MockApp {
  vault = {
    getMarkdownFiles: jest.fn().mockReturnValue([]),
    read: jest.fn().mockResolvedValue(""),
  };
  workspace = {
    getActiveFile: jest.fn().mockReturnValue(null),
    getActiveViewOfType: jest.fn().mockReturnValue(null),
    getLeavesOfType: jest.fn().mockReturnValue([]),
    getRightLeaf: jest.fn().mockReturnValue({
      setViewState: jest.fn().mockResolvedValue(undefined),
    }),
    revealLeaf: jest.fn(),
    onLayoutReady: jest.fn().mockImplementation((callback) => callback()),
  };
  statusBar = {
    addStatusBarItem: jest.fn().mockReturnValue({
      setText: jest.fn(),
      remove: jest.fn(),
    }),
  };
}

export class MockLeaf {
  view: any;
  constructor(view: any) {
    this.view = view;
  }
  openFile = jest.fn().mockResolvedValue(undefined);
}

export class MockEditor {
  getValue = jest.fn().mockReturnValue("");
  setValue = jest.fn();
  replaceRange = jest.fn();
  getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
}

export class MockMarkdownView {
  editor: MockEditor;
  file: any;
  constructor(file: any = null) {
    this.editor = new MockEditor();
    this.file = file;
  }
}

export class MockNotice {
  constructor(public message: string, public timeout?: number) {}
  hide = jest.fn();
}

// Mock TFile
export class MockTFile {
  constructor(
    public path: string,
    public basename: string,
    public content: string = ""
  ) {}
}

// Mock for React components
export const mockReactRoot = {
  render: jest.fn(),
  unmount: jest.fn(),
};

// Mock for createRoot
export const mockCreateRoot = jest.fn().mockReturnValue(mockReactRoot);
