import { WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";
import * as React from 'react';
import { createRoot, Root } from "react-dom/client";
import { AppComponent } from "../components/App";
import { COMMENTARY_VIEW_TYPE, NoteAnalysis } from "../types";

export class CommentaryView extends ItemView {
    root: Root | null = null;
    private content: string = "";
    private currentNoteId: string | undefined;
    private currentNoteName: string | undefined;
    private analysisHistory: NoteAnalysis[] = [];

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
        if (!container) {
            console.warn("Expected container is missing");
            return;
        }
        
        // Handle both Obsidian environment and test environment
        if (typeof container.empty === 'function') {
            // We're in Obsidian
            container.empty();
            container.createEl('div', { cls: 'react-view-container' });
        } else {
            // We're in a test environment
            container.innerHTML = '';
            const reactContainer = document.createElement('div');
            reactContainer.className = 'react-view-container';
            container.appendChild(reactContainer);
        }
        
        // Mount the React component
        const reactContainer = container.children[0];
        this.root = createRoot(reactContainer);
        this.updateReactComponent();
    }

    updateContent(content: string, noteId?: string, noteName?: string): void {
        this.content = content;
        this.currentNoteId = noteId;
        this.currentNoteName = noteName;
        
        // Add to history if we have note information
        if (noteId && noteName) {
            // Remove any existing analysis for this note
            this.analysisHistory = this.analysisHistory.filter(item => item.noteId !== noteId);
            
            // Add the new analysis
            this.analysisHistory.push({
                noteId,
                noteName,
                content,
                timestamp: Date.now()
            });
            
            // Sort by most recent first
            this.analysisHistory.sort((a, b) => b.timestamp - a.timestamp);
            
            // Limit history to 20 items
            if (this.analysisHistory.length > 20) {
                this.analysisHistory = this.analysisHistory.slice(0, 20);
            }
        }
        
        this.updateReactComponent();
    }
    
    getAnalysisHistory(): NoteAnalysis[] {
        return this.analysisHistory;
    }
    
    selectAnalysis(noteId: string): void {
        const analysis = this.analysisHistory.find(item => item.noteId === noteId);
        if (analysis) {
            this.content = analysis.content;
            this.currentNoteId = analysis.noteId;
            this.currentNoteName = analysis.noteName;
            this.updateReactComponent();
        }
    }

    private updateReactComponent(): void {
        if (this.root) {
            this.root.render(
                <React.StrictMode>
                    <AppComponent 
                        app={this.app} 
                        content={this.content} 
                        currentNoteId={this.currentNoteId}
                        currentNoteName={this.currentNoteName}
                        analysisHistory={this.analysisHistory}
                        onSelectNote={(noteId) => this.selectAnalysis(noteId)}
                    />
                </React.StrictMode>
            );
        }
    }

    async onClose(): Promise<void> {
        if (this.root) {
            this.root.unmount();
        }
        
        // Handle both Obsidian environment and test environment
        if (typeof this.containerEl.empty === 'function') {
            this.containerEl.empty();
        } else {
            this.containerEl.innerHTML = '';
        }
    }
}

