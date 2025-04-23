import { ItemView, WorkspaceLeaf } from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { createRoot, Root } from 'react-dom/client';
import { AppComponent } from './components/App';

export const REACT_VIEW_TYPE = 'react-view';

export class ReactView extends ItemView {
  root: Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return REACT_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'React View';
  }

  async onOpen() {
    // Create a container element for our React app
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('div', { cls: 'react-view-container' });
    
    // Mount the React component
    this.root = createRoot(container.children[0]);
    this.root.render(
      <React.StrictMode>
        <AppComponent app={this.app} />
      </React.StrictMode>
    );
  }

  async onClose() {
    // Unmount the React component when the view is closed
    if (this.root) {
      this.root.unmount();
    }
  }
}