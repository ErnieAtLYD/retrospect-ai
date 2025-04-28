// Mock Obsidian API
const mockObsidian = {
  ItemView: class {
    leaf: any;
    constructor(leaf: any) {
      this.leaf = leaf;
    }
  },
  Leaf: class {
    view: any;
    constructor(view: any) {
      this.view = view;
    }
    openFile = jest.fn().mockResolvedValue(undefined);
  },
  Notice: jest.fn().mockImplementation((message: string) => ({
    message,
    hide: jest.fn(),
  })),
  App: class {
    vault = {
      getMarkdownFiles: jest.fn().mockReturnValue([]),
      read: jest.fn().mockResolvedValue(""),
      create: jest.fn().mockResolvedValue(undefined),
      createFolder: jest.fn().mockResolvedValue(undefined),
      getAbstractFileByPath: jest.fn().mockReturnValue(null),
      adapter: jest.fn(),
      configDir: jest.fn(),
      getName: jest.fn().mockReturnValue('MockVault'),
      getFileByPath: jest.fn().mockReturnValue(null),
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
      getLeaf: jest.fn().mockReturnValue({
        openFile: jest.fn(),
      }),
      leftSplit: jest.fn(),
      rightSplit: jest.fn(),
      leftRibbon: jest.fn(),
      rightRibbon: jest.fn(),
    };
    statusBar = {
      addStatusBarItem: jest.fn().mockReturnValue({
        setText: jest.fn(),
        remove: jest.fn(),
      }),
    };
  },
  Editor: class {
    getValue = jest.fn().mockReturnValue("");
    setValue = jest.fn();
    replaceRange = jest.fn();
    getCursor = jest.fn().mockReturnValue({ line: 0, ch: 0 });
  },
  MarkdownView: class {
    editor: any;
    file: any;
    constructor(file: any = null) {
      this.editor = new mockObsidian.Editor();
      this.file = file;
    }
  },
  TFile: class {
    constructor(
      public path: string,
      public basename: string,
      public content: string = ""
    ) {}
  }
};

// Export the mock
export default mockObsidian;

// Mock for React components
export const mockReactRoot = {
  render: jest.fn(),
  unmount: jest.fn(),
};

// Mock for createRoot
export const mockCreateRoot = jest.fn().mockReturnValue(mockReactRoot); 