// Mock Obsidian module
export class Plugin {}
export class MarkdownView {}
export const Notice = jest.fn().mockImplementation((message) => ({
  message,
  hide: jest.fn(),
}));
export class ItemView {
  leaf: any;
  constructor(leaf: any) {
    this.leaf = leaf;
  }
}
export class WorkspaceLeaf {}
export class Editor {}
export class TFile {} 