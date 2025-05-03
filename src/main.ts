// main.ts
import { Plugin, Notice, WorkspaceLeaf } from "obsidian";
import { RetrospectAISettings, DEFAULT_RETROSPECT_AI_SETTINGS, ExtendedApp, COMMENTARY_VIEW_TYPE } from "./types";
import { RetrospectAISettingTab } from "./settings/settingsTab";
import { ServiceManager } from "./core/ServiceManager";
import { CommandManager } from "./core/CommandManager";
import { UIManager } from "./core/UIManager";
import { CommentaryView } from "./views/CommentaryView";
import { ReflectionMemoryManager } from "./services/ReflectionMemoryManager";
import { LoggingService, LogLevel } from "./services/LoggingService";



export default class RetrospectAI extends Plugin {
    settings!: RetrospectAISettings;
    serviceManager!: ServiceManager;
    commandManager!: CommandManager;
    uiManager!: UIManager;
    reflectionMemoryManager!: ReflectionMemoryManager;
    
    // Add an early logger for use before serviceManager is initialized
    private earlyLogger = new LoggingService(DEFAULT_RETROSPECT_AI_SETTINGS, LogLevel.INFO, true);
    
    // Logger property that matches what's expected by tests
    logger = {
        error: (message: string, error: Error) => {
            this.getLogger().error(message, error);
        }
    };
    
    // Helper to get the appropriate logger
    private getLogger() {
        return this.serviceManager?.logger || this.earlyLogger;
    }

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
        this.addSettingTab(new RetrospectAISettingTab(this.app as unknown as ExtendedApp, this));
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
            this.getLogger().error("Error analyzing daily journal", error as Error);
            new Notice(`Analysis failed: ${(error as Error).message}`);
            throw error; // Rethrow to propagate to caller
        }
    }

    async activateView() {
        return this.uiManager.activateView();
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
            this.getLogger().error("Failed to initialize reflection memory manager", error);
            new Notice("Failed to initialize reflection system. Some features may not work properly.");
        }
        
        // The reflection memory manager is now passed directly to the AnalysisManager via constructor
        
        // Set up the plugin
        this.commandManager.registerCommands();
        this.initializeUI();

        // Wait for the workspace to be ready
        await this.app.workspace.onLayoutReady(async () => {
            try {
                // Activate the view after workspace is ready
                await this.uiManager.activateView();
            } catch (error) {
                this.getLogger().error("Failed to activate view", error);
            }
        });
    }

    async onunload(): Promise<void> {
        this.serviceManager.shutdown();
        this.uiManager.cleanup();
        
        // Properly clean up the ReflectionMemoryManager
        if (this.reflectionMemoryManager) {
            try {
                this.getLogger().info("ReflectionMemoryManager shut down successfully");
            } catch (error) {
                this.getLogger().error("Error shutting down ReflectionMemoryManager", error as Error);
            }
        }
    }
}
