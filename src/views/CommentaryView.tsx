import { WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";
import * as React from 'react';
import { createRoot, Root } from "react-dom/client";
import { AppComponent } from "../components/App";
import { COMMENTARY_VIEW_TYPE } from "../types";

export class CommentaryView extends ItemView {
    root: Root | null = null;
    private content: string = "";

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }
    
    getViewType(): string {
        return COMMENTARY_VIEW_TYPE;
    }

    getDisplayText(): string {
        return "AI Analysis";
    }

    async onOpen() {
        // Create a container element for our React app
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('div', { cls: 'react-view-container' });
        
        // Mount the React component
        this.root = createRoot(container.children[0]);
        this.updateReactComponent();
    }

    updateContent(content: string): void {
        this.content = content;
        this.updateReactComponent();
    }

    private updateReactComponent(): void {
        if (this.root) {
            this.root.render(
                <React.StrictMode>
                    <AppComponent app={this.app} content={this.content} />
                </React.StrictMode>
            );
        }
    }

    async onClose(): Promise<void> {
        if (this.root) {
            this.root.unmount();
        }
        this.containerEl.empty();
    }
}

