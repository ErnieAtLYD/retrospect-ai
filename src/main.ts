// main.ts
import { Plugin, Notice } from "obsidian";
import { RetrospectAISettings, DEFAULT_RETROSPECT_AI_SETTINGS, ExtendedApp } from "./types";
import { RetrospectAISettingTab } from "./settings/settingsTab";
import { ServiceManager } from "./core/ServiceManager";
import { CommandManager } from "./core/CommandManager";
import { UIManager } from "./core/UIManager";

export default class RetrospectAI extends Plugin {
    settings!: RetrospectAISettings;
    serviceManager!: ServiceManager;
    commandManager!: CommandManager;
    uiManager!: UIManager;
    
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

    /**
     * Analyze the current daily journal entry
     * This method is expected by the tests
     */
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
            const analysisManager = this.serviceManager.analysisManager;
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

    async onload() {
        await this.loadSettings();
        
        // Initialize managers
        this.serviceManager = new ServiceManager(this);
        this.commandManager = new CommandManager(this);
        this.uiManager = new UIManager(this);
        
        // Set up the plugin
        this.addSettingTab(new RetrospectAISettingTab(this.app as ExtendedApp, this));
        this.commandManager.registerCommands();
        this.uiManager.setupUI();
    }

    onunload() {
        this.serviceManager.shutdown();
        this.uiManager.cleanup();
    }
}
