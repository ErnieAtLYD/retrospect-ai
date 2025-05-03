// src/views/CommentaryView.ts

import { WorkspaceLeaf } from "obsidian";
import { ItemView } from "obsidian";
import * as React from 'react';
import { createRoot, Root } from "react-dom/client";
import { AppComponent } from "../components/App";
import { COMMENTARY_VIEW_TYPE } from "../types";
import { AnalysisManager, AnalysisResult, NoteAnalysis } from "../services/AnalysisManager";

export class CommentaryView extends ItemView {
    root: Root | null = null;
    private content: string = "";
    private currentNoteId: string | undefined;
    private currentNoteName: string | undefined;
    private analysisManager: AnalysisManager | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }
    
    /**
     * Set the analysis manager reference
     * @param analysisManager The analysis manager instance
     */
    setAnalysisManager(analysisManager: AnalysisManager): void {
        this.analysisManager = analysisManager;
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
        
        // Add to analysis manager history if we have note information
        if (noteId && noteName && this.analysisManager) {
            // Create a new analysis result and add it to the history
            const analysisResult: AnalysisResult = {
                content,
                noteId,
                noteName,
                timestamp: Date.now()
            };
            
            // Store in the analysis manager
            this.analysisManager.addToHistory(analysisResult);
        }
        
        this.updateReactComponent();
    }
    
    getAnalysisHistory(): NoteAnalysis[] {
        // Get analysis history from analysis manager if available, otherwise return empty array
        return this.analysisManager ? this.analysisManager.getAnalysisHistory() : [];
    }
    
    /**
     * Select an analysis from history by noteId
     * @param noteId The ID of the note to select
     * @returns boolean Whether the selection was successful
     */
    selectAnalysis(noteId: string): boolean {
        if (!this.analysisManager) return false;
        
        const analysis = this.analysisManager.getAnalysisForNote(noteId);
        if (analysis) {
            this.content = analysis.content;
            this.currentNoteId = analysis.noteId;
            this.currentNoteName = analysis.noteName;
            this.updateReactComponent();
            return true;
        }
        
        return false;
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
                        analysisHistory={this.getAnalysisHistory()}
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

