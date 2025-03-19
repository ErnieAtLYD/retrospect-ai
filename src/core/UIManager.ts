// ./src/core/UIManager.ts

import RetrospectAI from "../main";

export class UIManager {
    private plugin: RetrospectAI;
    public statusBarItem: HTMLElement | null = null;

    constructor(plugin: RetrospectAI) {
        this.plugin = plugin;
    }

    setupUI() {
        this.setupStatusBar();
    }

    private setupStatusBar() {
    }
    
    private addAnalysisRibbonIcon() {
    }

    cleanup() {
    }
}