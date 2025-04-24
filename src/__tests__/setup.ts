// Jest setup file

// Mock the global window object
global.window = Object.create(window);

// Mock createRoot from react-dom/client
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn().mockReturnValue({
    render: jest.fn(),
    unmount: jest.fn(),
  }),
}));

// Mock React
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn().mockImplementation((initialValue) => [initialValue, jest.fn()]),
  useEffect: jest.fn().mockImplementation((fn) => fn()),
  createElement: jest.fn(),
  StrictMode: ({ children }: { children: any }) => children,
}));

// Mock Obsidian
jest.mock('obsidian', () => ({
  Plugin: class {},
  MarkdownView: class {},
  Notice: jest.fn().mockImplementation((message) => ({
    message,
    hide: jest.fn(),
  })),
  ItemView: class {
    leaf: any;
    constructor(leaf: any) {
      this.leaf = leaf;
    }
  },
  WorkspaceLeaf: class {},
  Editor: class {},
  TFile: class {},
}));
