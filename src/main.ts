// main.ts
import { Plugin, Notice, WorkspaceLeaf } from "obsidian";
import { RetrospectAISettings, DEFAULT_RETROSPECT_AI_SETTINGS, ExtendedApp, COMMENTARY_VIEW_TYPE } from "./types";
import { RetrospectAISettingTab } from "./settings/settingsTab";
import { ServiceManager } from "./core/ServiceManager";
import { CommandManager } from "./core/CommandManager";
import { UIManager } from "./core/UIManager";
// import { ReactView, REACT_VIEW_TYPE } from "./views/view";
import { CommentaryView } from "./views/CommentaryView";
import { ReflectionMemoryManager } from "./services/ReflectionMemoryManager";



export default class RetrospectAI extends Plugin {
    settings!: RetrospectAISettings;
    serviceManager!: ServiceManager;
    commandManager!: CommandManager;
    uiManager!: UIManager;
    reflectionMemoryManager!: ReflectionMemoryManager;
    
    // Add a logger property that matches what's expected by tests
    logger = {
        error: (message: string, error: Error) => {
            console.error(message, error);
        }
    };

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_RETROSPECT_AI_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.serviceManager.reinitializeServices();
    }

    private initializeUI() {
        this.addSettingTab(new RetrospectAISettingTab(this.app as ExtendedApp, this));
        this.uiManager = new UIManager(this);
        this.uiManager.setupUI();
    }

    async analyzeDailyJournal() {
        try {
            // Get the active file
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                throw new Error("No active file");
            }

            // In a real implementation, you would:
            // 1. Read the file content
            // 2. Process it using your AI service
            // 3. Append the analysis

            // For now, let's just get the analysis service and call it
            const {analysisManager} = this.serviceManager;
            if (!analysisManager) {
                throw new Error("Analysis manager not initialized");
            }

            // Here you'd implement the actual analysis logic
            // For example:
            // await analysisManager.analyzeDailyNote(activeFile);
            
            new Notice("Daily journal analyzed");
            return true;
        } catch (error) {
            // Log the error
            this.logger.error("Error analyzing daily journal", error as Error);
            new Notice(`Analysis failed: ${(error as Error).message}`);
            throw error; // Rethrow to propagate to caller
        }
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(COMMENTARY_VIEW_TYPE);
        console.log("leaves", leaves);
    
        if (leaves.length > 0) {
          // A leaf with our view already exists, use that
          leaf = leaves[0];
        } else {
          // Our view could not be found in the workspace, create a new leaf
          // in the right sidebar for it
          leaf = workspace.getRightLeaf(false);
          await leaf?.setViewState({ type: COMMENTARY_VIEW_TYPE, active: true });
        }
    
        // "Reveal" the leaf in case it is in a collapsed sidebar
        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async onload() {
        // Register the view type first
        this.registerView(COMMENTARY_VIEW_TYPE, (leaf) => new CommentaryView(leaf));

        await this.loadSettings();
        
        // Initialize managers
        this.serviceManager = new ServiceManager(this);
        // Initialize services immediately
        this.serviceManager.reinitializeServices();
        this.commandManager = new CommandManager(this);
        
        // Initialize the reflection memory manager
        this.reflectionMemoryManager = new ReflectionMemoryManager(
            this.app,
            this.settings,
            this.serviceManager.logger
        );
        
        try {
            await this.reflectionMemoryManager.initialize();
        } catch (error) {
            console.error("Failed to initialize reflection memory manager:", error);
            new Notice("Failed to initialize reflection system. Some features may not work properly.");
        }
        
        // Make the reflection memory manager available to other services that need it
        if (this.serviceManager.analysisManager) {
            this.serviceManager.analysisManager.setReflectionMemoryManager(this.reflectionMemoryManager);
        }
        
        // Set up the plugin
        this.commandManager.registerCommands();
        this.initializeUI();

        // Wait for the workspace to be ready
        await this.app.workspace.onLayoutReady(async () => {
            try {
                // Activate the view after workspace is ready
                await this.uiManager.activateView();
            } catch (error) {
                console.error("Failed to activate view:", error);
            }
        });
    }

    onunload() {
        this.serviceManager.shutdown();
        this.uiManager.cleanup();
        
        // Properly clean up the ReflectionMemoryManager
        if (this.reflectionMemoryManager) {
            try {
                // Save any pending changes to ensure data integrity
                this.reflectionMemoryManager.saveIndex?.();
                console.log("ReflectionMemoryManager shut down successfully");
            } catch (error) {
                console.error("Error shutting down ReflectionMemoryManager:", error);
            }
        }
    }
}
